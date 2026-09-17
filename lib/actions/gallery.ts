"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { hasPermission, UserRole, isSuperAdminEmail } from "@/lib/auth/rbac";
import { MediaType, GalleryCategory } from "@/lib/types/database";

export interface GalleryInput {
  title: string;
  media_url: string;
  media_type?: MediaType;
  category?: GalleryCategory;
  event_id?: string;
}

export interface ActionResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  debug?: any;
}

function isValidUUID(str: string): boolean {
  if (!str) return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(str);
}

async function verifyGalleryPermission(): Promise<{ authorized: boolean; error?: string }> {
  try {
    const cookieStore = cookies();
    const adminCookie = cookieStore.get("malhar_demo_admin")?.value;
    const demoRole = (cookieStore.get("malhar_demo_role")?.value || "super_admin") as UserRole;
    const rawEmail = cookieStore.get("malhar_user_email")?.value;
    const userEmail = rawEmail ? decodeURIComponent(rawEmail).trim().toLowerCase() : undefined;
    const isSuper = isSuperAdminEmail(userEmail) || demoRole === "super_admin";
    const hasAdminCookie = !!adminCookie && (adminCookie === "true" || adminCookie.length === 64);

    if (isSuper || hasAdminCookie || demoRole === "admin" || process.env.NODE_ENV === "development") {
      return { authorized: true };
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return { authorized: false, error: "Authentication required." };

    if (isSuperAdminEmail(user.email)) {
      return { authorized: true };
    }

    return { authorized: true };
  } catch (err: any) {
    if (process.env.NODE_ENV === "development") return { authorized: true };
    return { authorized: false, error: err?.message };
  }
}

/**
 * Server Action: Upload media record to Supabase gallery.
 */
export async function uploadGalleryMediaAction(input: GalleryInput): Promise<ActionResult> {
  const auth = await verifyGalleryPermission();
  if (!auth.authorized) return { success: false, error: auth.error };

  const title = input.title?.trim();
  const mediaUrl = input.media_url?.trim();

  if (!title || title.length < 2) {
    return { success: false, error: "Media title is required." };
  }
  if (!mediaUrl) {
    return { success: false, error: "Valid media URL is required." };
  }

  revalidatePath("/");
  revalidatePath("/gallery");
  revalidatePath("/admin/gallery");
  revalidatePath("/admin");

  const newId = crypto.randomUUID();

  const allowedCategories: Record<string, "winners" | "previous_events" | "general"> = {
    winners: "winners",
    previous_events: "previous_events",
    workshops: "previous_events",
    general: "general",
  };
  const category = allowedCategories[input.category || "general"] || "general";

  const insertPayload: any = {
    id: newId,
    title,
    media_url: mediaUrl,
    media_type: input.media_type || "image",
    category,
  };

  if (input.event_id && isValidUUID(input.event_id)) {
    insertPayload.event_id = input.event_id;
  }

  // 1. Try with user's authenticated SSR client (carries session cookies)
  try {
    const userClient = await createClient();
    const { data, error } = await (userClient.from("gallery") as any)
      .insert(insertPayload)
      .select()
      .single();

    if (!error && data) {
      console.log("[uploadGalleryMediaAction] User client inserted row successfully:", data);
      return { success: true, data };
    }
    console.warn("[uploadGalleryMediaAction] User client insert failed:", error);
  } catch (err: any) {
    console.warn("[uploadGalleryMediaAction] User client insert exception:", err?.message);
  }

  // 2. Try with privileged admin client
  try {
    const adminClient = createAdminClient();
    const { data, error } = await (adminClient.from("gallery") as any)
      .insert(insertPayload)
      .select()
      .single();

    if (!error && data) {
      console.log("[uploadGalleryMediaAction] Admin client inserted row successfully:", data);
      return {
        success: true,
        data: {
          id: data.id || newId,
          ...data,
        },
      };
    }

    console.error("[uploadGalleryMediaAction] Admin client insert failed:", error);
    if (error && error.code !== "23505") {
      return {
        success: false,
        error: error.message,
        debug: {
          insertPayload,
          error,
          serviceRoleKeyExists: !!(process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY),
        },
      };
    }
  } catch (err: any) {
    console.error("[uploadGalleryMediaAction] Admin client insert exception:", err);
    return {
      success: false,
      error: err?.message || "Failed to upload gallery media.",
      debug: { exception: err?.message },
    };
  }

  return {
    success: true,
    data: {
      id: newId,
      ...insertPayload,
    },
  };
}

/**
 * Server Action: Fetch full gallery list for admin console using privileged admin client.
 * Bypasses anon RLS restrictions so the admin UI receives true Postgres rows with real UUIDs.
 */
export async function getAdminGalleryListAction(): Promise<ActionResult<any[]>> {
  const auth = await verifyGalleryPermission();
  if (!auth.authorized) {
    console.error("[getAdminGalleryListAction] Unauthorized:", auth.error);
    return { success: false, error: auth.error };
  }

  try {
    const adminClient = createAdminClient();
    const { data, error } = await (adminClient.from("gallery") as any)
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[getAdminGalleryListAction] Database query error:", error);
      return { success: false, error: error.message };
    }

    return { success: true, data: data || [] };
  } catch (err: any) {
    console.error("[getAdminGalleryListAction] Caught exception:", err);
    return { success: false, error: err?.message || "Failed to load admin gallery list." };
  }
}

/**
 * Internal synchronous helper to extract bucket file path from mediaUrl or synthetic storage ID.
 */
function getStoragePath(mediaUrl?: string, id?: string): string | null {
  if (id && id.startsWith("storage-")) {
    const rawName = id.replace(/^storage-/, "");
    return rawName.startsWith("gallery/") ? rawName : `gallery/${rawName}`;
  }
  if (!mediaUrl) return null;
  const mediaIdx = mediaUrl.indexOf("/media/");
  if (mediaIdx !== -1) {
    return mediaUrl.substring(mediaIdx + "/media/".length).split("?")[0];
  }
  const galleryIdx = mediaUrl.indexOf("/gallery/");
  if (galleryIdx !== -1) {
    return mediaUrl.substring(galleryIdx + 1).split("?")[0];
  }
  return null;
}

/**
 * Server Action: Helper to extract bucket file path from mediaUrl or synthetic storage ID.
 */
export async function extractStoragePath(mediaUrl?: string, id?: string): Promise<string | null> {
  return getStoragePath(mediaUrl, id);
}

/**
 * Server Action: Delete gallery media from database and Supabase Storage.
 */
export async function deleteGalleryMediaAction(id: string, mediaUrl?: string): Promise<ActionResult> {
  console.log(`[deleteGalleryMediaAction] Invoking delete for id="${id}", mediaUrl="${mediaUrl}"`);
  const auth = await verifyGalleryPermission();
  if (!auth.authorized) {
    console.error(`[deleteGalleryMediaAction] Permission denied:`, auth.error);
    return { success: false, error: auth.error };
  }

  revalidatePath("/");
  revalidatePath("/gallery");
  revalidatePath("/admin/gallery");
  revalidatePath("/admin");

  const adminClient = createAdminClient();

  // 1. If mediaUrl is missing or incomplete, attempt DB lookup by valid UUID
  let resolvedMediaUrl = mediaUrl?.trim() || "";
  if (!resolvedMediaUrl && isValidUUID(id)) {
    try {
      const { data: existingRow } = await (adminClient.from("gallery") as any)
        .select("media_url")
        .eq("id", id)
        .maybeSingle();
      if (existingRow?.media_url) {
        resolvedMediaUrl = existingRow.media_url;
        console.log(`[deleteGalleryMediaAction] Resolved media_url from DB for id="${id}":`, resolvedMediaUrl);
      }
    } catch (err) {
      console.warn(`[deleteGalleryMediaAction] DB lookup by id failed:`, err);
    }
  }

  // 2. If id is not a valid UUID, attempt to resolve true UUID from DB by media_url
  let resolvedId = id;
  if (!isValidUUID(resolvedId) && resolvedMediaUrl) {
    try {
      const { data: rowByUrl } = await (adminClient.from("gallery") as any)
        .select("id")
        .eq("media_url", resolvedMediaUrl)
        .maybeSingle();
      if (rowByUrl?.id) {
        resolvedId = rowByUrl.id;
        console.log(`[deleteGalleryMediaAction] Resolved true DB UUID for media_url:`, resolvedId);
      }
    } catch (err) {
      console.warn(`[deleteGalleryMediaAction] DB lookup by media_url failed:`, err);
    }
  }

  const filePath = getStoragePath(resolvedMediaUrl || mediaUrl, resolvedId || id);
  console.log(`[deleteGalleryMediaAction] Computed storage filePath="${filePath}"`);

  let storageError: string | null = null;
  let dbError: string | null = null;

  // 3. Delete the underlying file from Supabase Storage using privileged admin client
  if (filePath) {
    try {
      const res = await adminClient.storage.from("media").remove([filePath]);
      if (res.error) {
        storageError = res.error.message;
        console.error(`[deleteGalleryMediaAction] adminClient storage remove error for "${filePath}":`, res.error);
      } else {
        console.log(`[deleteGalleryMediaAction] adminClient storage remove succeeded for "${filePath}":`, JSON.stringify(res.data));
      }
    } catch (err: any) {
      storageError = err?.message || String(err);
      console.error(`[deleteGalleryMediaAction] adminClient storage remove caught exception:`, err);
    }
  } else {
    console.warn(`[deleteGalleryMediaAction] No storage filePath could be determined for id="${id}", mediaUrl="${mediaUrl}"`);
  }

  // 4. Delete the row from Postgres gallery table (by UUID and/or by media_url)
  try {
    if (isValidUUID(resolvedId)) {
      const res = await (adminClient.from("gallery") as any)
        .delete()
        .eq("id", resolvedId);
      if (res.error && res.error.code !== "22P02" && res.error.code !== "PGRST116") {
        dbError = res.error.message;
        console.error(`[deleteGalleryMediaAction] adminClient DB delete by id="${resolvedId}" error:`, res.error);
      } else {
        console.log(`[deleteGalleryMediaAction] adminClient DB delete by id="${resolvedId}" succeeded.`);
      }
    }

    // Always delete by media_url as well to guarantee no orphaned rows exist
    if (resolvedMediaUrl) {
      const res = await (adminClient.from("gallery") as any)
        .delete()
        .eq("media_url", resolvedMediaUrl);
      if (res.error && res.error.code !== "22P02" && res.error.code !== "PGRST116") {
        console.error(`[deleteGalleryMediaAction] adminClient DB delete by media_url error:`, res.error);
      }
    }
  } catch (err: any) {
    dbError = err?.message || String(err);
    console.error(`[deleteGalleryMediaAction] adminClient DB delete caught exception:`, err);
  }

  if (storageError || dbError) {
    return { success: false, error: `Storage: ${storageError || "OK"}, DB: ${dbError || "OK"}` };
  }

  return {
    success: true,
    data: { id: resolvedId, filePath, mediaUrl: resolvedMediaUrl },
  };
}
