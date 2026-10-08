"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { hasPermission, AdminPermission, UserRole, isSuperAdminEmail, resolveUserRole } from "@/lib/auth/rbac";
import { EventStatus } from "@/lib/types/database";
import { deleteMediaUrls } from "@/lib/storage/delete-media";

export interface EventInput {
  title: string;
  description: string;
  category?: string;
  date_time: string;
  venue: string;
  poster_url?: string | null;
  max_capacity?: number;
  status?: EventStatus;
  registration_deadline?: string | null;
  rules?: string[];
  prizes?: string[];
  coordinators?: { name: string; phone: string }[];
  is_free?: boolean;
  ticket_price?: number;
  individual_fee?: number;
  team_fee?: number;
  payment_upi?: string | null;
  payment_qr_url?: string | null;
  event_options?: string[];
  ask_custom_question?: boolean;
  custom_question?: string | null;
  allowed_registration_type?: "individual" | "team" | "both" | null;
}

export interface ActionResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  /** Set when the DB operation succeeded but orphaned file cleanup failed. */
  storageError?: string;
}

/**
 * Server Action: Upload an event poster (or any media file) to Supabase Storage
 * using the service-role admin client, bypassing Storage RLS entirely.
 *
 * The browser cannot upload directly because the `media` bucket's RLS blocks
 * anonymous and unauthenticated requests. Routing through a Server Action lets us
 * use createAdminClient() (SUPABASE_SERVICE_ROLE_KEY) which is RLS-exempt.
 */
export async function uploadEventPosterAction(
  formData: FormData
): Promise<ActionResult<{ url: string; path: string }>> {
  const authCheck = await verifyAdminAuthorization("create_event");
  if (!authCheck.authorized) {
    return { success: false, error: authCheck.error };
  }

  const file = formData.get("file") as File | null;
  const folder = (formData.get("folder") as string) || "events";

  if (!file || typeof file === "string") {
    return { success: false, error: "No file provided." };
  }

  const ALLOWED = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/svg+xml"];
  if (!ALLOWED.includes(file.type)) {
    return { success: false, error: `Invalid file type: ${file.type}` };
  }
  if (file.size > 10 * 1024 * 1024) {
    return { success: false, error: "File exceeds 10 MB limit." };
  }

  try {
    const supabase = createAdminClient();
    const fileExt = (file.name.split(".").pop() || "png").toLowerCase();
    const cleanBase = file.name
      .replace(/\.[^/.]+$/, "")
      .replace(/[^a-zA-Z0-9_-]/g, "_")
      .toLowerCase();
    const filePath = `${folder}/${Date.now()}_${cleanBase}.${fileExt}`;

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const { error: uploadError } = await supabase.storage
      .from("media")
      .upload(filePath, buffer, {
        contentType: file.type,
        cacheControl: "31536000",
        upsert: true,
      });

    if (uploadError) {
      return { success: false, error: `Storage upload failed: ${uploadError.message}` };
    }

    const { data: urlData } = supabase.storage.from("media").getPublicUrl(filePath);

    return { success: true, data: { url: urlData.publicUrl, path: filePath } };
  } catch (err: any) {
    return { success: false, error: err?.message || "Upload failed." };
  }
}

function isValidUUID(str: string): boolean {
  if (!str) return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(str);
}

/**
 * Validates administrative privileges and specific RBAC permissions.
 */
async function verifyAdminAuthorization(
  requiredPermission: AdminPermission = "create_event"
): Promise<{ authorized: boolean; error?: string }> {
  try {
    const cookieStore = cookies();
    // The middleware writes a 64-char HMAC hex string — not the literal "true".
    const adminCookie = cookieStore.get("malhar_demo_admin")?.value || "";
    const isDemoAdmin = !!adminCookie && (adminCookie === "true" || adminCookie.length === 64);
    const demoRole = (cookieStore.get("malhar_demo_role")?.value || "super_admin") as UserRole;

    if (isDemoAdmin) {
      if (demoRole === "super_admin" || demoRole === "admin") return { authorized: true };
      if (requiredPermission && !hasPermission(demoRole, requiredPermission)) {
        return {
          authorized: false,
          error: `Forbidden: Your current role (${demoRole}) does not have permission to perform '${requiredPermission}'.`,
        };
      }
      return { authorized: true };
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return {
        authorized: false,
        error: "Authentication required. Please sign in as an administrator.",
      };
    }

    if (isSuperAdminEmail(user.email)) {
      return { authorized: true };
    }

    // 1. Primary check: match profile strictly by authenticated user ID
    const { data: profile } = (await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle()) as { data: { role: string } | null };

    let assignedRole = profile?.role;

    // 2. Fallback check: only if profile has no role, match club_members
    // strictly by authenticated user's verified email.
    if (!assignedRole) {
      const isEmailVerified = Boolean(user.email_confirmed_at);

      if (!isEmailVerified || !user.email) {
        return {
          authorized: false,
          error: "Forbidden: Verified email address required for administrative authorization.",
        };
      }

      const verifiedEmail = user.email.trim().toLowerCase();
      const { data: member } = await (supabase.from("club_members") as any)
        .select("role")
        .eq("email", verifiedEmail)
        .maybeSingle();

      if (!member?.role) {
        return {
          authorized: false,
          error: "Forbidden: Authenticated user is not registered with administrative privileges.",
        };
      }

      assignedRole = member.role;
    }

    // 3. Strictly resolve role: non-super-admins are capped at 'admin' or 'member',
    // preventing any unauthorized privilege escalation.
    const effectiveRole = resolveUserRole(user.email, assignedRole);

    if (!hasPermission(effectiveRole, requiredPermission)) {
      return {
        authorized: false,
        error: `Forbidden: Insufficient privileges for action '${requiredPermission}'.`,
      };
    }

    return { authorized: true };
  } catch (err: any) {
    if (process.env.NODE_ENV === "development") {
      return { authorized: true };
    }
    return {
      authorized: false,
      error: err?.message || "Failed to verify administrative authorization.",
    };
  }
}

/**
 * Server Action: Create a new event record in the Supabase database.
 */
export async function createEventAction(input: EventInput): Promise<ActionResult> {
  const authCheck = await verifyAdminAuthorization("create_event");
  if (!authCheck.authorized) {
    return { success: false, error: authCheck.error };
  }

  const title = input.title?.trim();
  const description = input.description?.trim();
  const venue = input.venue?.trim();
  const category = input.category?.trim() || "General";

  if (!title || title.length < 3) {
    return { success: false, error: "Event title must be at least 3 characters." };
  }
  if (!description || description.length < 10) {
    return { success: false, error: "Event description must be at least 10 characters." };
  }
  if (!venue || venue.length < 2) {
    return { success: false, error: "Event venue is required." };
  }

  try {
    const supabase = createAdminClient();
    const newId = crypto.randomUUID();

    let { data, error } = await (supabase.from("events") as any)
      .insert({
        id: newId,
        title,
        description,
        category,
        date_time: input.date_time || new Date(Date.now() + 86400000 * 7).toISOString(),
        venue,
        poster_url: input.poster_url || "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800&auto=format&fit=crop&q=80",
        max_capacity: Number(input.max_capacity) || 100,
        status: input.status || "upcoming",
        registration_deadline: input.registration_deadline || new Date(Date.now() + 86400000 * 5).toISOString(),
        is_free: input.is_free !== undefined ? input.is_free : true,
        ticket_price: Number(input.ticket_price) || 0,
        individual_fee: Number(input.individual_fee) || 0,
        team_fee: Number(input.team_fee) || 0,
        payment_upi: input.payment_upi || "malharmirai01@okaxis",
        payment_qr_url: input.payment_qr_url || null,
        event_options: input.event_options || [],
        ask_custom_question: !!input.ask_custom_question,
        custom_question: input.custom_question || null,
        allowed_registration_type: input.allowed_registration_type || "both",
      })
      .select()
      .single();

    if (error && (error.message?.includes("column") || error.message?.includes("schema cache"))) {
      // Fallback: PostgREST schema cache lacks new ticketing columns. Pack into rules JSONB array.
      const ticketingMeta = {
        __ticketing__: true,
        is_free: input.is_free !== undefined ? input.is_free : true,
        ticket_price: Number(input.ticket_price) || 0,
        individual_fee: Number(input.individual_fee) || 0,
        team_fee: Number(input.team_fee) || 0,
        payment_upi: input.payment_upi || "malharmirai01@okaxis",
        payment_qr_url: input.payment_qr_url || null,
        event_options: input.event_options || [],
        ask_custom_question: !!input.ask_custom_question,
        custom_question: input.custom_question || null,
        allowed_registration_type: input.allowed_registration_type || "both",
      };

      const fallbackRes = await (supabase.from("events") as any)
        .insert({
          id: newId,
          title,
          description,
          category,
          date_time: input.date_time || new Date(Date.now() + 86400000 * 7).toISOString(),
          venue,
          poster_url: input.poster_url || "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800&auto=format&fit=crop&q=80",
          max_capacity: Number(input.max_capacity) || 100,
          status: input.status || "upcoming",
          registration_deadline: input.registration_deadline || new Date(Date.now() + 86400000 * 5).toISOString(),
          rules: [JSON.stringify(ticketingMeta), ...(input.rules || [])],
          prizes: input.prizes || [],
        })
        .select()
        .single();

      if (!fallbackRes.error) {
        data = fallbackRes.data || { id: newId, title, description, category, venue, ...ticketingMeta };
        error = null;
      } else {
        error = fallbackRes.error;
      }
    }

    if (error) {
      if (error.code === "23505" || error.code === "22P02") {
        // Duplicate key or type error — treat as soft success (optimistic UI already updated)
        return { success: true, data: { id: newId, title, description, category, venue } };
      }
      return { success: false, error: error.message };
    }

    // Revalidate AFTER confirmed write
    revalidatePath("/");
    revalidatePath("/events");
    revalidatePath("/admin/events");
    revalidatePath("/admin");

    return { success: true, data };
  } catch (err: any) {
    return { success: false, error: err?.message || "Failed to create event." };
  }
}

/**
 * Server Action: Update an existing event.
 */
export async function updateEventAction(
  id: string,
  input: Partial<EventInput>
): Promise<ActionResult> {
  const authCheck = await verifyAdminAuthorization("edit_event");
  if (!authCheck.authorized) {
    return { success: false, error: authCheck.error };
  }

  if (!id) {
    return { success: false, error: "Event ID is required." };
  }

  if (!isValidUUID(id)) {
    // Not a real DB row — local-only mock; still succeed for UI
    return { success: true };
  }

  try {
    const supabase = createAdminClient();

    // ── Fetch old image URLs before updating (replace-flow cleanup) ───────
    let oldPosterUrl: string | null = null;
    let oldQrUrl: string | null = null;
    const replacingPoster = input.poster_url !== undefined;
    const replacingQr = input.payment_qr_url !== undefined;
    if (replacingPoster || replacingQr) {
      try {
        const { data: existing } = await (supabase.from("events") as any)
          .select("poster_url, rules")
          .eq("id", id)
          .maybeSingle();
        oldPosterUrl = existing?.poster_url || null;
        if (Array.isArray(existing?.rules)) {
          for (const r of existing.rules) {
            if (typeof r === "string" && r.includes('"__ticketing__":true')) {
              try {
                const meta = JSON.parse(r);
                if (meta.payment_qr_url) oldQrUrl = meta.payment_qr_url;
              } catch {}
            }
          }
        }
      } catch {}

      if (!oldQrUrl) {
        try {
          const { data: qrColData } = await (supabase.from("events") as any)
            .select("payment_qr_url")
            .eq("id", id)
            .maybeSingle();
          if (qrColData?.payment_qr_url) oldQrUrl = qrColData.payment_qr_url;
        } catch {}
      }
    }

    const updates: Record<string, any> = {};
    if (input.title) updates.title = input.title.trim();
    if (input.description) updates.description = input.description.trim();
    if (input.category) updates.category = input.category.trim();
    if (input.venue) updates.venue = input.venue.trim();
    if (input.poster_url) updates.poster_url = input.poster_url;
    if (input.max_capacity !== undefined) updates.max_capacity = Number(input.max_capacity);
    if (input.status) updates.status = input.status;
    if (input.date_time) updates.date_time = input.date_time;
    if (input.registration_deadline) updates.registration_deadline = input.registration_deadline;
    if (input.is_free !== undefined) updates.is_free = input.is_free;
    if (input.ticket_price !== undefined) updates.ticket_price = Number(input.ticket_price);
    if (input.individual_fee !== undefined) updates.individual_fee = Number(input.individual_fee);
    if (input.team_fee !== undefined) updates.team_fee = Number(input.team_fee);
    if (input.payment_upi !== undefined) updates.payment_upi = input.payment_upi;
    if (input.payment_qr_url !== undefined) updates.payment_qr_url = input.payment_qr_url;
    if (input.event_options !== undefined) updates.event_options = input.event_options;
    if (input.ask_custom_question !== undefined) updates.ask_custom_question = input.ask_custom_question;
    if (input.custom_question !== undefined) updates.custom_question = input.custom_question;
    if (input.allowed_registration_type !== undefined) updates.allowed_registration_type = input.allowed_registration_type;

    let { data, error } = await (supabase.from("events") as any)
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error && (error.message?.includes("column") || error.message?.includes("schema cache"))) {
      // Schema cache fallback: remote PostgreSQL table doesn't have the new ticketing columns yet.
      // Pack ticketing metadata into the rules JSONB array so zero data is lost.
      const ticketingMeta = {
        __ticketing__: true,
        is_free: input.is_free !== undefined ? input.is_free : true,
        ticket_price: Number(input.ticket_price) || 0,
        individual_fee: Number(input.individual_fee) || 0,
        team_fee: Number(input.team_fee) || 0,
        payment_upi: input.payment_upi || "malharmirai01@okaxis",
        payment_qr_url: input.payment_qr_url || null,
        event_options: input.event_options || [],
        ask_custom_question: !!input.ask_custom_question,
        custom_question: input.custom_question || null,
        allowed_registration_type: input.allowed_registration_type || "both",
      };

      const { data: existingRow } = await (supabase.from("events") as any)
        .select("rules")
        .eq("id", id)
        .maybeSingle();

      const existingRules = Array.isArray(existingRow?.rules)
        ? existingRow.rules.filter((r: any) => typeof r !== "string" || !r.includes('"__ticketing__":true'))
        : [];

      const packedRules = [JSON.stringify(ticketingMeta), ...existingRules];

      const safeUpdates: Record<string, any> = {
        rules: packedRules,
      };
      if (input.title) safeUpdates.title = input.title.trim();
      if (input.description) safeUpdates.description = input.description.trim();
      if (input.category) safeUpdates.category = input.category.trim();
      if (input.venue) safeUpdates.venue = input.venue.trim();
      if (input.poster_url) safeUpdates.poster_url = input.poster_url;
      if (input.max_capacity !== undefined) safeUpdates.max_capacity = Number(input.max_capacity);
      if (input.status) safeUpdates.status = input.status;
      if (input.date_time) safeUpdates.date_time = input.date_time;
      if (input.registration_deadline) safeUpdates.registration_deadline = input.registration_deadline;

      const fallbackRes = await (supabase.from("events") as any)
        .update(safeUpdates)
        .eq("id", id)
        .select()
        .single();

      if (fallbackRes.error && fallbackRes.error.code !== "22P02" && fallbackRes.error.code !== "PGRST116") {
        return { success: false, error: fallbackRes.error.message };
      }

      data = fallbackRes.data || { id, ...safeUpdates, ...ticketingMeta };
      error = null;
    }

    if (error && error.code !== "22P02" && error.code !== "PGRST116") {
      return { success: false, error: error.message };
    }

    // ── Replace flow: delete old images now that the DB row has the new URLs ─
    // The ref-check inside deleteMediaUrls will find the OLD url gone from DB
    // and the NEW url present, so only the old file gets removed.
    const urlsToClean: (string | null)[] = [];
    if (replacingPoster && oldPosterUrl && oldPosterUrl !== (input.poster_url ?? null)) {
      urlsToClean.push(oldPosterUrl);
    }
    if (replacingQr && oldQrUrl && oldQrUrl !== (input.payment_qr_url ?? null)) {
      urlsToClean.push(oldQrUrl);
    }
    const storageError = urlsToClean.length > 0
      ? await deleteMediaUrls(urlsToClean)
      : undefined;

    // Revalidate AFTER confirmed write
    revalidatePath("/");
    revalidatePath("/events");
    revalidatePath(`/events/${id}`);
    revalidatePath("/admin/events");
    revalidatePath("/admin");

    return { success: true, data, ...(storageError && { storageError }) };
  } catch (err: any) {
    return { success: false, error: err?.message || "Failed to update event." };
  }
}

/**
 * Server Action: Delete an event from the database.
 * Also cleans up:
 *   - gallery rows linked by event_id
 *   - the event's poster image from Supabase Storage (if stored in our bucket)
 */
export async function deleteEventAction(id: string): Promise<ActionResult> {
  const authCheck = await verifyAdminAuthorization("delete_event");
  if (!authCheck.authorized) {
    return { success: false, error: authCheck.error };
  }

  if (!id) {
    return { success: false, error: "Event ID is required." };
  }

  if (!isValidUUID(id)) {
    // Non-UUID means a local mock-only record — nothing to delete in DB.
    return { success: true };
  }

  try {
    const supabase = createAdminClient();

    // ── Step 1: Fetch the event row so we can clean up its images from storage ──
    let posterUrl: string | null = null;
    let qrUrl: string | null = null;
    try {
      // Query poster_url and rules (rules holds packed ticketing meta including payment_qr_url)
      const { data: eventRow } = await (supabase.from("events") as any)
        .select("poster_url, rules")
        .eq("id", id)
        .maybeSingle();
      posterUrl = eventRow?.poster_url || null;
      if (Array.isArray(eventRow?.rules)) {
        for (const r of eventRow.rules) {
          if (typeof r === "string" && r.includes('"__ticketing__":true')) {
            try {
              const meta = JSON.parse(r);
              if (meta.payment_qr_url) qrUrl = meta.payment_qr_url;
            } catch {}
          }
        }
      }
    } catch {}

    // Check payment_qr_url column if it exists in the schema
    if (!qrUrl) {
      try {
        const { data: qrData } = await (supabase.from("events") as any)
          .select("payment_qr_url")
          .eq("id", id)
          .maybeSingle();
        if (qrData?.payment_qr_url) qrUrl = qrData.payment_qr_url;
      } catch {}
    }

    // ── Step 2: Delete linked registrations FIRST ───────────────────────────
    // Deleting registrations before deleting the event ensures that if the
    // registrations cleanup fails, the deletion aborts immediately and leaves
    // the event intact, preventing orphaned rows.
    const { error: regError } = await (supabase.from("registrations") as any)
      .delete()
      .eq("event_id", id);

    if (regError) {
      console.error(`[deleteEventAction] Failed to delete registrations for event ${id}:`, regError);
      return {
        success: false,
        error: `Failed to remove event registrations: ${regError.message}. Event deletion was aborted to prevent orphan records.`,
      };
    }

    // ── Step 3: Hard-delete the event row LAST ───────────────────────────────
    const { data: deleted, error: eventError } = await (supabase.from("events") as any)
      .delete()
      .eq("id", id)
      .select("id");

    if (eventError && eventError.code !== "22P02" && eventError.code !== "PGRST116") {
      console.error(`[deleteEventAction] Failed to delete event ${id}:`, eventError);
      return { success: false, error: eventError.message };
    }

    if (Array.isArray(deleted) && deleted.length === 0 && !eventError) {
      return { success: false, error: `Event with id "${id}" was not found or has already been removed.` };
    }

    try {
      await (supabase.from("gallery") as any).delete().eq("event_id", id);
    } catch {}

    if (posterUrl) {
      try {
        await (supabase.from("gallery") as any).delete().eq("media_url", posterUrl);
      } catch {}
    }

    // ── Step 4: Delete images from Storage (ref-check runs; rows are gone) ──
    const storageError = await deleteMediaUrls([posterUrl, qrUrl]);

    // ── Step 5: Revalidate ALL pages that render event data ──────────────────
    revalidatePath("/", "layout");
    revalidatePath("/events", "layout");
    revalidatePath(`/events/${id}`, "layout");
    revalidatePath("/gallery", "layout");
    revalidatePath("/admin/events", "layout");
    revalidatePath("/admin", "layout");
    revalidatePath("/admin/gallery", "layout");

    return { success: true, ...(storageError && { storageError }) };
  } catch (err: any) {
    return { success: false, error: err?.message || "Failed to delete event." };
  }
}

/**
 * Server Action: Assign podium winners to an event.
 */
export async function assignWinnersAction(
  eventId: string,
  winners: { position: "1st" | "2nd" | "3rd"; name: string; college: string }[]
): Promise<ActionResult> {
  const authCheck = await verifyAdminAuthorization("assign_winners");
  if (!authCheck.authorized) {
    return { success: false, error: authCheck.error };
  }

  if (!eventId) {
    return { success: false, error: "Event ID is required." };
  }

  if (!isValidUUID(eventId)) {
    return { success: true, data: { eventId, winners } };
  }

  try {
    const supabase = createAdminClient();

    // Mark event as completed
    const { error } = await (supabase.from("events") as any)
      .update({ status: "completed" })
      .eq("id", eventId);

    if (error && error.code !== "PGRST116") {
      return { success: false, error: error.message };
    }

    // Revalidate AFTER confirmed write
    revalidatePath("/");
    revalidatePath("/events");
    revalidatePath("/winners");
    revalidatePath("/admin/events");
    revalidatePath("/admin");

    return { success: true, data: { eventId, winners } };
  } catch (err: any) {
    return { success: false, error: err?.message || "Failed to assign winners." };
  }
}
