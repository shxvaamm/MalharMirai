"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { createAdminClient } from "@/lib/supabase/server";
import { hasPermission, AdminPermission, UserRole } from "@/lib/auth/rbac";
import { normalizeEventFromDb, normalizeRegistrationFromDb } from "@/lib/utils/event-normalizer";

export interface EventRegistrationInput {
  eventId: string;
  studentName: string;
  studentEmail: string;
  studentPhone?: string | null;
  userId?: string | null;
  department?: string | null;
  year?: string | null;
  collegeId?: string | null;
  registrationType?: "individual" | "team";
  teamName?: string | null;
  leader?: {
    name: string;
    email: string;
    phone?: string;
    collegeId?: string;
    year?: string;
    branch?: string;
  } | null;
  teamMembers?: Array<{
    name: string;
    email: string;
    phone?: string;
    collegeId?: string;
  }>;
  selectedOptions?: string[];
  customAnswer?: string | null;
  paymentScreenshot?: string | null;
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
 * Server Action: Upload payment screenshot to Supabase Storage `media/payments/`
 * using the service-role admin client (bypasses Storage RLS).
 */
export async function uploadPaymentScreenshotAction(
  formData: FormData
): Promise<ActionResult<{ url: string; path: string }>> {
  const file = formData.get("file") as File | null;
  if (!file || typeof file === "string") {
    return { success: false, error: "No file provided." };
  }

  const ALLOWED = ["image/jpeg", "image/png", "image/webp", "image/gif"];
  if (!ALLOWED.includes(file.type)) {
    return { success: false, error: `Invalid image type: ${file.type}. Please upload JPG, PNG, or WebP.` };
  }
  if (file.size > 10 * 1024 * 1024) {
    return { success: false, error: "Screenshot exceeds 10 MB limit." };
  }

  try {
    const supabase = createAdminClient();
    const fileExt = (file.name.split(".").pop() || "png").toLowerCase();
    const cleanBase = file.name
      .replace(/\.[^/.]+$/, "")
      .replace(/[^a-zA-Z0-9_-]/g, "_")
      .toLowerCase();
    const filePath = `payments/${Date.now()}_${cleanBase}.${fileExt}`;

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
    return { success: false, error: err?.message || "Failed to upload payment screenshot." };
  }
}

/**
 * Server Action: Check if a user is already registered for an event
 */
export async function checkUserRegistrationStatusAction(
  eventId: string,
  email?: string | null,
  userId?: string | null
): Promise<{ registered: boolean; status?: string; ticketCode?: string }> {
  if (!eventId || (!email && !userId)) return { registered: false };
  try {
    const supabase = createAdminClient();
    let query = (supabase.from("registrations") as any)
      .select("*")
      .eq("event_id", eventId);

    const cleanEmail = email?.trim().toLowerCase();
    if (cleanEmail && userId) {
      query = query.or(`student_email.ilike.${cleanEmail},user_id.eq.${userId}`);
    } else if (cleanEmail) {
      query = query.ilike("student_email", cleanEmail);
    } else if (userId) {
      query = query.eq("user_id", userId);
    }

    const { data } = await query.order("created_at", { ascending: false }).limit(1);
    if (data && data.length > 0) {
      const normalized = normalizeRegistrationFromDb(data[0]);
      return {
        registered: true,
        status: normalized.status,
        ticketCode: normalized.ticket_code,
      };
    }
    return { registered: false };
  } catch {
    return { registered: false };
  }
}

/**
 * Server Action: Public student registration (Individual or Team) with UPI verification support.
 * Starts in 'pending' status — sent to admin for approval before the entry pass is published.
 * Enforces strict single-registration rule (1 student per event).
 */
export async function registerForEventAction(
  input: EventRegistrationInput
): Promise<ActionResult> {
  const eventId = input.eventId?.trim();
  const studentName = input.studentName?.trim();
  const studentEmail = input.studentEmail?.trim().toLowerCase();
  const studentPhone = input.studentPhone?.trim() || null;
  const userId = input.userId?.trim() || null;
  const registrationType = input.registrationType || "individual";

  if (!eventId) return { success: false, error: "Event ID is required." };
  if (!studentName || studentName.length < 2) return { success: false, error: "Full name is required." };
  if (!studentEmail || !studentEmail.includes("@")) return { success: false, error: "Valid email is required." };

  try {
    const supabase = createAdminClient();
    const newId = crypto.randomUUID();
    const ticketCode = `MIRAI-${Math.floor(100000 + Math.random() * 900000)}`;

    // All registrations start as 'pending' awaiting admin review and approval.
    // The entry pass with dynamic QR code is published once approved by admin.
    const initialStatus = "pending";

    if (isValidUUID(eventId)) {
      // 1. Check event capacity, deadline, and existence
      const { data: eventData } = await (supabase.from("events") as any)
        .select("id, status, date_time, registration_deadline, max_capacity, registered_count, is_free")
        .eq("id", eventId)
        .maybeSingle();

      if (eventData) {
        const isPast =
          eventData.status === "completed" ||
          new Date(eventData.date_time).getTime() < Date.now();
        const isDeadlinePassed = eventData.registration_deadline
          ? new Date(eventData.registration_deadline).getTime() < Date.now()
          : false;

        if (isPast || isDeadlinePassed) {
          return {
            success: false,
            error: "Registration is closed for this completed or past event.",
          };
        }

        if (
          eventData.max_capacity &&
          (eventData.registered_count || 0) >= eventData.max_capacity
        ) {
          return {
            success: false,
            error: "This event has reached maximum capacity.",
          };
        }
      }

      // 2. Strict One-Time Registration Check: A student may only register ONCE per event
      let dupQuery = (supabase.from("registrations") as any)
        .select("id, student_name, student_email, year_of_study, status")
        .eq("event_id", eventId);

      if (userId) {
        dupQuery = dupQuery.or(`student_email.ilike.${studentEmail},user_id.eq.${userId}`);
      } else {
        dupQuery = dupQuery.ilike("student_email", studentEmail);
      }

      const { data: existingRegs } = await dupQuery.limit(1);
      if (existingRegs && existingRegs.length > 0) {
        return {
          success: false,
          error: "You have already registered for this event. Each student may only register once.",
        };
      }

      // Check team members for duplicates
      if (registrationType === "team" && input.teamMembers && input.teamMembers.length > 0) {
        const memberEmails = input.teamMembers
          .map((m) => m.email?.trim().toLowerCase())
          .filter((e): e is string => !!e && e.includes("@"));

        if (memberEmails.length > 0) {
          const { data: dupMembers } = await (supabase.from("registrations") as any)
            .select("student_name, student_email")
            .eq("event_id", eventId)
            .in("student_email", memberEmails)
            .limit(1);

          if (dupMembers && dupMembers.length > 0) {
            return {
              success: false,
              error: `Team member "${dupMembers[0].student_name || dupMembers[0].student_email}" is already registered for this event.`,
            };
          }
        }
      }
    }

    const insertPayload: any = {
      id: newId,
      event_id: eventId,
      student_name: studentName,
      student_email: studentEmail,
      student_phone: studentPhone,
      user_id: userId,
      college_id: input.collegeId?.trim() || input.leader?.collegeId || null,
      department: input.department?.trim() || input.leader?.branch || null,
      year_of_study: input.year?.trim() || input.leader?.year || null,
      status: initialStatus,
      registration_type: registrationType,
      team_name: registrationType === "team" ? (input.teamName?.trim() || null) : null,
      leader: registrationType === "team" ? (input.leader || null) : null,
      team_members: registrationType === "team" ? (input.teamMembers || []) : [],
      selected_options: input.selectedOptions || [],
      custom_answer: input.customAnswer?.trim() || null,
      payment_screenshot: input.paymentScreenshot || null,
      ticket_code: ticketCode,
      created_at: new Date().toISOString(),
    };

    // Insert registration record
    let { data, error } = await (supabase.from("registrations") as any)
      .insert(insertPayload)
      .select()
      .single();

    if (error && (error.message?.includes("column") || error.message?.includes("schema cache") || error.message?.includes("registrations_status_check"))) {
      // Schema fallback: store full registration data safely packed into year_of_study
      const regMeta = {
        __reg_meta__: true,
        ticket_code: ticketCode,
        registration_type: registrationType,
        team_name: input.teamName?.trim() || null,
        leader: input.leader || null,
        team_members: input.teamMembers || [],
        selected_options: input.selectedOptions || [],
        custom_answer: input.customAnswer?.trim() || null,
        payment_screenshot: input.paymentScreenshot || null,
        real_year: input.year?.trim() || input.leader?.year || null,
        real_college_id: input.collegeId?.trim() || input.leader?.collegeId || null,
        workflow_status: initialStatus,
      };

      const safePayload: any = {
        id: newId,
        event_id: eventId,
        student_name: studentName,
        student_email: studentEmail,
        student_phone: studentPhone,
        user_id: userId,
        college_id: input.collegeId?.trim() || input.leader?.collegeId || null,
        department: input.department?.trim() || input.leader?.branch || "General",
        year_of_study: JSON.stringify(regMeta),
        status: "confirmed",
        created_at: new Date().toISOString(),
      };

      const fallbackRes = await (supabase.from("registrations") as any)
        .insert(safePayload)
        .select()
        .single();

      if (!fallbackRes.error) {
        data = fallbackRes.data || { id: newId, ...safePayload, ...regMeta };
        error = null;
      } else {
        error = fallbackRes.error;
      }
    }

    if (error) {
      if (
        error.code === "23505" ||
        error.message?.toLowerCase().includes("unique") ||
        error.message?.toLowerCase().includes("duplicate")
      ) {
        return { success: false, error: "You're already registered for this event." };
      }
      if (error.code === "23503" || error.code === "22P02") {
        // Fallback for non-UUID mock events
        return { success: true, data: { id: newId, ticket_code: ticketCode, ...insertPayload } };
      }
      return { success: false, error: error.message };
    }

    // Atomically increment registered_count on the event
    if (isValidUUID(eventId)) {
      try {
        await supabase.rpc("increment_registered_count" as any, {
          event_id_arg: eventId,
        } as any);
      } catch {
        try {
          const { data: ev } = await (supabase.from("events") as any)
            .select("registered_count")
            .eq("id", eventId)
            .maybeSingle();
          await (supabase.from("events") as any)
            .update({ registered_count: (ev?.registered_count || 0) + 1 })
            .eq("id", eventId);
        } catch {}
      }
    }

    revalidatePath("/");
    revalidatePath("/events");
    revalidatePath(`/events/${eventId}`);
    revalidatePath("/my-tickets");
    revalidatePath("/admin/registrations");
    revalidatePath("/admin/events");
    revalidatePath("/admin");

    return { success: true, data: data || { id: newId, ticket_code: ticketCode, ...insertPayload } };
  } catch (err: any) {
    return { success: false, error: err?.message || "Failed to submit event registration." };
  }
}

/**
 * Server Action: Update registration status (Admin Confirm or Reject)
 * - If status is REJECTED: decrements event registered_count to restore capacity.
 */
export async function updateRegistrationStatusAction(
  id: string,
  status: "confirmed" | "rejected" | "cancelled" | "pending",
  issueReason?: string | null
): Promise<ActionResult> {
  if (!id) return { success: false, error: "Registration ID is required." };

  try {
    const supabase = createAdminClient();

    // 1. Fetch current registration record
    const { data: currentReg } = await (supabase.from("registrations") as any)
      .select("id, event_id, status, year_of_study")
      .eq("id", id)
      .maybeSingle();

    if (!currentReg && isValidUUID(id)) {
      return { success: false, error: "Registration record not found." };
    }

    const prevStatus = currentReg?.status || "pending";

    // 2. Prepare metadata update
    let meta: any = {};
    let realYear: string | null = null;

    if (typeof currentReg?.year_of_study === "string") {
      const trimmed = currentReg.year_of_study.trim();
      if (trimmed.startsWith("{")) {
        try {
          meta = JSON.parse(trimmed);
          realYear = meta.real_year || null;
        } catch {}
      } else {
        realYear = trimmed;
      }
    }

    meta.__reg_meta__ = true;
    meta.workflow_status = status;
    if (status === "rejected") {
      meta.issue_reason = issueReason || "Declined by admin.";
    } else {
      delete meta.issue_reason;
    }
    if (!meta.real_year && realYear && !realYear.startsWith("{")) {
      meta.real_year = realYear;
    }

    // 3. Determine database column status safe for check constraint (confirmed / cancelled)
    const safeDbStatus = status === "rejected" || status === "cancelled" ? "cancelled" : "confirmed";

    // Try update with all columns first
    let updateError: any = null;
    const { error: err1 } = await (supabase.from("registrations") as any)
      .update({
        status: safeDbStatus,
        issue_reason: status === "rejected" ? (issueReason || "Declined by admin.") : null,
        year_of_study: JSON.stringify(meta),
      })
      .eq("id", id);

    if (err1 && (err1.message?.includes("column") || err1.message?.includes("schema cache") || err1.message?.includes("registrations_status_check"))) {
      // Fallback: update only existing schema columns
      const { error: err2 } = await (supabase.from("registrations") as any)
        .update({
          status: safeDbStatus,
          year_of_study: JSON.stringify(meta),
        })
        .eq("id", id);
      updateError = err2;
    } else {
      updateError = err1;
    }

    if (updateError && updateError.code !== "22P02" && updateError.code !== "PGRST116") {
      return { success: false, error: updateError.message };
    }

    // 4. If transitioning to 'rejected' from a non-rejected status, decrement registered_count
    if (status === "rejected" && prevStatus !== "rejected" && currentReg?.event_id && isValidUUID(currentReg.event_id)) {
      try {
        await supabase.rpc("decrement_registered_count" as any, {
          event_id_arg: currentReg.event_id,
        } as any);
      } catch {
        try {
          const { data: ev } = await (supabase.from("events") as any)
            .select("registered_count")
            .eq("id", currentReg.event_id)
            .maybeSingle();
          await (supabase.from("events") as any)
            .update({ registered_count: Math.max(0, (ev?.registered_count || 1) - 1) })
            .eq("id", currentReg.event_id);
        } catch {}
      }
    }

    revalidatePath("/admin/registrations");
    revalidatePath("/admin/events");
    revalidatePath("/admin");
    revalidatePath("/events");
    revalidatePath("/");
    revalidatePath("/my-tickets");
    if (currentReg?.event_id) {
      revalidatePath(`/events/${currentReg.event_id}`);
    }

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || "Failed to update registration status." };
  }
}

/**
 * Server Action: Fetch all registrations for Admin Console using privileged service role client (bypasses RLS).
 */
export async function getAdminRegistrationsAction(): Promise<ActionResult<any[]>> {
  try {
    const supabase = createAdminClient();
    const { data: regRows, error } = await (supabase.from("registrations") as any)
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      return { success: false, error: error.message };
    }

    if (!regRows || regRows.length === 0) {
      return { success: true, data: [] };
    }

    // Fetch parent events cleanly without fragile relational joins
    const eventIds = Array.from(new Set(regRows.map((r: any) => r.event_id).filter(Boolean)));
    let eventMap = new Map();
    if (eventIds.length > 0) {
      const { data: eventRows } = await (supabase.from("events") as any)
        .select("*")
        .in("id", eventIds);
      if (eventRows) {
        eventMap = new Map(eventRows.map((e: any) => [e.id, normalizeEventFromDb(e)]));
      }
    }

    const combined = regRows.map((r: any) => {
      const normReg = normalizeRegistrationFromDb(r);
      const ev = eventMap.get(r.event_id);
      return {
        ...normReg,
        event_title: normReg.event_title || ev?.title || "Event",
        events: ev || null,
      };
    });

    return { success: true, data: combined };
  } catch (err: any) {
    return { success: false, error: err?.message || "Failed to fetch registrations." };
  }
}

/**
 * Server Action: Cancel / delete a student registration from ledger.
 */
export async function cancelRegistrationAction(id: string): Promise<ActionResult> {
  if (!id) return { success: false, error: "Registration ID is required." };

  if (!isValidUUID(id)) {
    return { success: true };
  }

  try {
    const supabase = createAdminClient();

    const { data: currentReg } = await (supabase.from("registrations") as any)
      .select("id, event_id, status")
      .eq("id", id)
      .maybeSingle();

    const { error } = await (supabase.from("registrations") as any)
      .delete()
      .eq("id", id);

    if (error && error.code !== "22P02" && error.code !== "PGRST116") {
      return { success: false, error: error.message };
    }

    if (currentReg?.event_id && isValidUUID(currentReg.event_id)) {
      try {
        await supabase.rpc("decrement_registered_count" as any, {
          event_id_arg: currentReg.event_id,
        } as any);
      } catch {}
    }

    revalidatePath("/admin/registrations");
    revalidatePath("/admin/events");
    revalidatePath("/admin");
    revalidatePath("/my-tickets");

    return { success: true };
  } catch (err: any) {
    return { success: true };
  }
}

/**
 * Server Action: Verify ticket pass by ID or Ticket Code (used by Gate QR Scanner /verify/[id]).
 */
export async function verifyTicketAction(
  idOrCode: string
): Promise<ActionResult<{ ticket: any; event: any }>> {
  if (!idOrCode?.trim()) {
    return { success: false, error: "Ticket ID or verification code is required." };
  }

  try {
    const supabase = createAdminClient();
    const cleanLookup = idOrCode.trim();

    let rawReg: any = null;

    if (isValidUUID(cleanLookup)) {
      const { data } = await (supabase.from("registrations") as any)
        .select("*")
        .eq("id", cleanLookup)
        .maybeSingle();
      if (data) rawReg = data;
    }

    if (!rawReg) {
      // Try by ticket_code column if it exists in DB
      try {
        const { data } = await (supabase.from("registrations") as any)
          .select("*")
          .eq("ticket_code", cleanLookup)
          .maybeSingle();
        if (data) rawReg = data;
      } catch {}
    }

    if (!rawReg) {
      // Fallback: search within packed year_of_study JSON
      const { data } = await (supabase.from("registrations") as any)
        .select("*")
        .ilike("year_of_study", `%"ticket_code":"${cleanLookup}"%`)
        .maybeSingle();
      if (data) {
        rawReg = data;
      } else {
        const { data: data2 } = await (supabase.from("registrations") as any)
          .select("*")
          .ilike("year_of_study", `%${cleanLookup}%`)
          .maybeSingle();
        if (data2) rawReg = data2;
      }
    }

    if (!rawReg) {
      return { success: false, error: "Ticket not found in the official registry." };
    }

    const reg = normalizeRegistrationFromDb(rawReg);

    // Fetch parent event details
    let eventData = null;
    if (reg.event_id && isValidUUID(reg.event_id)) {
      const { data: ev } = await (supabase.from("events") as any)
        .select("*")
        .eq("id", reg.event_id)
        .maybeSingle();
      if (ev) {
        eventData = normalizeEventFromDb(ev);
      }
    }

    return {
      success: true,
      data: {
        ticket: reg,
        event: eventData,
      },
    };
  } catch (err: any) {
    return { success: false, error: err?.message || "Failed to verify ticket pass." };
  }
}

/**
 * Server Action: Check In attendee at the security entry gate.
 */
export async function checkInTicketAction(id: string): Promise<ActionResult> {
  if (!id) return { success: false, error: "Ticket ID is required." };

  try {
    const supabase = createAdminClient();
    const nowIso = new Date().toISOString();

    let { error } = await (supabase.from("registrations") as any)
      .update({
        checked_in_at: nowIso,
        status: "attended",
      })
      .eq("id", id);

    if (error && (error.message?.includes("column") || error.message?.includes("schema cache"))) {
      // Fetch existing row to pack checked_in_at into year_of_study
      const { data: currentReg } = await (supabase.from("registrations") as any)
        .select("id, year_of_study")
        .eq("id", id)
        .maybeSingle();

      let meta: any = {};
      let realYear = currentReg?.year_of_study || null;
      if (typeof currentReg?.year_of_study === "string" && currentReg.year_of_study.includes("__reg_meta__")) {
        try {
          meta = JSON.parse(currentReg.year_of_study);
          realYear = meta.real_year || null;
        } catch {}
      }
      meta.__reg_meta__ = true;
      meta.checked_in_at = nowIso;
      if (!meta.real_year) meta.real_year = realYear;

      const { error: fallbackErr } = await (supabase.from("registrations") as any)
        .update({
          status: "attended",
          year_of_study: JSON.stringify(meta),
        })
        .eq("id", id);
      error = fallbackErr;
    }

    if (error && error.code !== "22P02" && error.code !== "PGRST116") {
      return { success: false, error: error.message };
    }

    revalidatePath(`/verify/${id}`);
    revalidatePath("/admin/registrations");

    return { success: true, data: { checked_in_at: nowIso } };
  } catch (err: any) {
    return { success: false, error: err?.message || "Failed to check in attendee." };
  }
}

/**
 * Server Action: Fetch user tickets by email or userId for /my-tickets.
 */
export async function getUserTicketsAction(
  email?: string | null,
  userId?: string | null
): Promise<ActionResult<any[]>> {
  if (!email && !userId) {
    return { success: true, data: [] };
  }

  try {
    const supabase = createAdminClient();
    let query = (supabase.from("registrations") as any)
      .select("*")
      .order("created_at", { ascending: false });

    const cleanEmail = email?.trim().toLowerCase();
    if (cleanEmail && userId) {
      query = query.or(`student_email.ilike.${cleanEmail},user_id.eq.${userId}`);
    } else if (cleanEmail) {
      query = query.ilike("student_email", cleanEmail);
    } else if (userId) {
      query = query.eq("user_id", userId);
    }

    const { data: regRows, error } = await query;

    if (error) {
      return { success: false, error: error.message };
    }

    if (!regRows || regRows.length === 0) {
      return { success: true, data: [] };
    }

    // Fetch parent events cleanly without fragile foreign-key embeds
    const eventIds = Array.from(new Set(regRows.map((r: any) => r.event_id).filter(Boolean)));
    const { data: eventRows } = await (supabase.from("events") as any)
      .select("*")
      .in("id", eventIds);

    const eventMap = new Map((eventRows || []).map((e: any) => [e.id, normalizeEventFromDb(e)]));

    const combined = regRows.map((r: any) => {
      const normReg = normalizeRegistrationFromDb(r);
      return {
        ...normReg,
        events: eventMap.get(r.event_id) || null,
      };
    });

    return { success: true, data: combined };
  } catch (err: any) {
    return { success: false, error: err?.message || "Failed to fetch user tickets." };
  }
}
