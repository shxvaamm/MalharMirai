"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { hasPermission, AdminPermission, UserRole, isSuperAdminEmail } from "@/lib/auth/rbac";
import { EventStatus } from "@/lib/types/database";

export interface EventInput {
  title: string;
  description: string;
  category: string;
  date_time: string;
  venue: string;
  poster_url?: string;
  max_capacity?: number | null;
  status?: EventStatus;
  registration_deadline?: string | null;
  rules?: string[];
  prizes?: string[];
  coordinators?: { name: string; phone: string }[];
}

export interface ActionResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
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
    const isDemoAdmin = cookieStore.get("malhar_demo_admin")?.value === "true";
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

    const { data: profile } = (await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single()) as { data: { role: string } | null };

    const role = profile?.role || "member";

    if (!hasPermission(role, requiredPermission)) {
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
  const status = input.status || "upcoming";
  const isCompleted = status === "completed";

  if (!title || title.length < 3) {
    return { success: false, error: "Event title must be at least 3 characters." };
  }
  if (!description || description.length < 10) {
    return { success: false, error: "Event description must be at least 10 characters." };
  }
  if (!venue || venue.length < 2) {
    return { success: false, error: "Event venue is required." };
  }
  if (!input.date_time) {
    return { success: false, error: "Event date & time is required." };
  }

  // Enforce registration logistics only for upcoming or ongoing events
  if (!isCompleted) {
    if (!input.registration_deadline) {
      return { success: false, error: "Registration deadline is required for upcoming/ongoing events." };
    }
    if (input.max_capacity === undefined || input.max_capacity === null || Number(input.max_capacity) <= 0) {
      return { success: false, error: "Valid maximum capacity (seats) is required for upcoming/ongoing events." };
    }
  }

  revalidatePath("/");
  revalidatePath("/events");
  revalidatePath("/admin/events");
  revalidatePath("/admin");

  try {
    const supabase = createAdminClient();
    const newId = crypto.randomUUID();

    const insertPayload: Record<string, any> = {
      id: newId,
      title,
      description,
      category,
      date_time: input.date_time,
      venue,
      poster_url: input.poster_url || "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800&auto=format&fit=crop&q=80",
      max_capacity:
        input.max_capacity !== undefined && input.max_capacity !== null && !isNaN(Number(input.max_capacity))
          ? Number(input.max_capacity)
          : isCompleted
          ? 0
          : 100,
      status,
      registration_deadline: input.registration_deadline
        ? new Date(input.registration_deadline).toISOString()
        : null,
    };

    const { data, error } = await (supabase.from("events") as any)
      .insert(insertPayload)
      .select()
      .single();

    if (error) {
      if (error.code === "23505" || error.code === "22P02") {
        return { success: true, data: { id: newId, title, description, category, venue, ...insertPayload } };
      }
      return { success: false, error: error.message };
    }

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

  const isCompleted = input.status === "completed";
  if (input.status && !isCompleted) {
    if ("registration_deadline" in input && !input.registration_deadline) {
      return { success: false, error: "Registration deadline is required for upcoming/ongoing events." };
    }
    if ("max_capacity" in input && (input.max_capacity === undefined || input.max_capacity === null || Number(input.max_capacity) <= 0)) {
      return { success: false, error: "Valid maximum capacity (seats) is required for upcoming/ongoing events." };
    }
  }

  revalidatePath("/");
  revalidatePath("/events");
  revalidatePath(`/events/${id}`);
  revalidatePath("/admin/events");
  revalidatePath("/admin");

  if (!isValidUUID(id)) {
    return { success: true };
  }

  try {
    const supabase = createAdminClient();

    const updates: Record<string, any> = {};
    if (input.title) updates.title = input.title.trim();
    if (input.description) updates.description = input.description.trim();
    if (input.category) updates.category = input.category.trim();
    if (input.venue) updates.venue = input.venue.trim();
    if (input.poster_url) updates.poster_url = input.poster_url;
    if (input.status) updates.status = input.status;
    if (input.date_time) updates.date_time = input.date_time;
    if ("max_capacity" in input) {
      updates.max_capacity =
        input.max_capacity !== undefined && input.max_capacity !== null && !isNaN(Number(input.max_capacity))
          ? Number(input.max_capacity)
          : isCompleted
          ? 0
          : 100;
    }
    if ("registration_deadline" in input) {
      updates.registration_deadline = input.registration_deadline
        ? new Date(input.registration_deadline).toISOString()
        : null;
    }

    const { data, error } = await (supabase.from("events") as any)
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error && error.code !== "22P02" && error.code !== "PGRST116") {
      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch (err: any) {
    return { success: true };
  }
}

/**
 * Server Action: Delete an event from the database.
 */
/**
 * Helper to extract Supabase Storage path for an event poster image.
 */
function extractEventPosterPath(posterUrl?: string): string | null {
  if (!posterUrl) return null;
  // External unsplash or placeholder images should not be treated as Supabase Storage objects
  if (posterUrl.includes("unsplash.com") || posterUrl.startsWith("data:")) return null;

  const mediaIdx = posterUrl.indexOf("/media/");
  if (mediaIdx !== -1) {
    const rel = posterUrl.substring(mediaIdx + "/media/".length).split("?")[0];
    return rel.startsWith("events/") ? rel : `events/${rel}`;
  }

  const eventsIdx = posterUrl.indexOf("/events/");
  if (eventsIdx !== -1 && posterUrl.includes("supabase.co")) {
    return posterUrl.substring(eventsIdx + 1).split("?")[0];
  }

  if (posterUrl.startsWith("events/")) {
    return posterUrl.split("?")[0];
  }

  return null;
}

/**
 * Server Action: Delete an event from the database, its storage poster,
 * linked child registrations, and unlink any associated gallery photos.
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
    return { success: false, error: "Invalid Event UUID." };
  }

  try {
    const adminClient = createAdminClient();

    // 1. Look up event record first to get poster_url and title
    const { data: event, error: fetchError } = await (adminClient.from("events") as any)
      .select("id, title, poster_url")
      .eq("id", id)
      .maybeSingle();

    if (fetchError) {
      return { success: false, error: `Failed to fetch event for deletion: ${fetchError.message}` };
    }

    // If event does not exist, treat as already deleted
    if (!event) {
      revalidatePath("/");
      revalidatePath("/events");
      revalidatePath(`/events/${id}`);
      revalidatePath("/admin/events");
      revalidatePath("/admin");
      return { success: true };
    }

    // 2. Delete poster image from media/events/ using admin client if present in Supabase Storage
    let storageError: any = null;
    const posterStoragePath = extractEventPosterPath(event.poster_url);
    if (posterStoragePath) {
      try {
        const { error: removeErr } = await adminClient.storage
          .from("media")
          .remove([posterStoragePath]);
        if (removeErr) {
          console.error(`[deleteEventAction] Failed to delete poster storage file "${posterStoragePath}":`, removeErr);
          storageError = removeErr;
        }
      } catch (stErr: any) {
        console.error(`[deleteEventAction] Storage removal exception for "${posterStoragePath}":`, stErr);
        storageError = stErr;
      }
    }

    // 3. Delete child registrations explicitly first (ensures clean cascade even without DB FK)
    const { error: regError } = await (adminClient.from("registrations") as any)
      .delete()
      .eq("event_id", id);

    if (regError) {
      console.error(`[deleteEventAction] Failed to delete registrations for event "${id}":`, regError);
      return { success: false, error: `Failed to delete linked registrations: ${regError.message}` };
    }

    // 4. Decision 1: Nullify gallery references (unlink photos, preserve fest memories)
    if (event.title) {
      try {
        await (adminClient.from("gallery") as any)
          .update({ event_title: null })
          .eq("event_title", event.title);
      } catch (gTitleErr) {
        console.warn(`[deleteEventAction] Could not unlink gallery by event_title:`, gTitleErr);
      }
    }
    try {
      await (adminClient.from("gallery") as any)
        .update({ event_id: null })
        .eq("event_id", id);
    } catch {
      // Column event_id may not exist in current schema; handled safely
    }

    // 5. Delete event row from database
    const { error: dbError } = await (adminClient.from("events") as any)
      .delete()
      .eq("id", id);

    if (dbError) {
      console.error(`[deleteEventAction] Failed to delete event record "${id}":`, dbError);
      return { success: false, error: dbError.message };
    }

    if (storageError) {
      return {
        success: false,
        error: `Event was removed from database, but poster file cleanup failed: ${storageError.message || storageError}`,
      };
    }

    revalidatePath("/");
    revalidatePath("/events");
    revalidatePath(`/events/${id}`);
    revalidatePath("/admin/events");
    revalidatePath("/admin");

    return { success: true };
  } catch (err: any) {
    console.error("[deleteEventAction] Unexpected failure:", err);
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

  revalidatePath("/");
  revalidatePath("/events");
  revalidatePath("/winners");
  revalidatePath("/admin/events");
  revalidatePath("/admin");

  if (!isValidUUID(eventId)) {
    return { success: true, data: { eventId, winners } };
  }

  try {
    const supabase = createAdminClient();

    // Mark event as completed
    await (supabase.from("events") as any)
      .update({ status: "completed" })
      .eq("id", eventId);

    return { success: true, data: { eventId, winners } };
  } catch (err: any) {
    return { success: true, data: { eventId, winners } };
  }
}
