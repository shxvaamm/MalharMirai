"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/server";
import { deleteMediaByUrl } from "@/lib/storage/delete-media";

export interface ActionResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  /** Set when the DB operation succeeded but orphaned file cleanup failed. */
  storageError?: string;
}

function isValidUUID(str: string): boolean {
  if (!str) return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(str);
}

/**
 * Server Action: Delete a hero_slides row AND its image from Supabase Storage.
 *
 * Protocol:
 *  1. Fetch image_url before deleting the row.
 *  2. Delete the DB row.
 *  3. Call deleteMediaByUrl — ref-check runs against the updated DB (row is
 *     gone), so the file is deleted unless another row shares the same URL.
 *  4. Return { success: true } even when storage cleanup fails; surface
 *     the failure as storageError so the UI can show a warning.
 */
export async function deleteHeroSlideAction(id: string): Promise<ActionResult> {
  if (!isValidUUID(id)) {
    return { success: false, error: "Invalid slide ID." };
  }

  try {
    const supabase = createAdminClient();

    // 1. Fetch image URL before deleting the row
    let imageUrl: string | null = null;
    try {
      const { data } = await (supabase.from("hero_slides") as any)
        .select("image_url")
        .eq("id", id)
        .maybeSingle();
      imageUrl = data?.image_url || null;
    } catch {}

    // 2. Delete the DB row
    const { error } = await (supabase.from("hero_slides") as any)
      .delete()
      .eq("id", id);

    if (error && error.code !== "PGRST116") {
      return { success: false, error: error.message };
    }

    // 3. Delete image from Storage (ref-check runs; row is now gone)
    let storageError: string | undefined;
    if (imageUrl) {
      const result = await deleteMediaByUrl(imageUrl);
      if (result.storageError) {
        storageError = result.storageError;
        console.error("[deleteHeroSlideAction] storage cleanup failed:", result.storageError);
      }
    }

    revalidatePath("/", "layout");
    revalidatePath("/admin/slideshow", "layout");

    return { success: true, ...(storageError && { storageError }) };
  } catch (err: any) {
    return { success: false, error: err?.message || "Failed to delete slide." };
  }
}

/**
 * Server Action: Update a hero_slides row metadata and optionally replace the image.
 *
 * Replace-flow: if image_url is included in the update AND it differs from the
 * current image, the old image is deleted from Storage after the DB row is
 * saved (ref-check ensures it's not shared with another row).
 */
export async function updateHeroSlideAction(
  id: string,
  updates: {
    title?: string;
    caption?: string;
    is_active?: boolean;
    order?: number;
    image_url?: string;
  }
): Promise<ActionResult> {
  if (!isValidUUID(id)) {
    return { success: false, error: "Invalid slide ID." };
  }

  try {
    const supabase = createAdminClient();

    // 1. Fetch old image URL before updating (only needed if image is being replaced)
    let oldImageUrl: string | null = null;
    if (updates.image_url !== undefined) {
      try {
        const { data } = await (supabase.from("hero_slides") as any)
          .select("image_url")
          .eq("id", id)
          .maybeSingle();
        oldImageUrl = data?.image_url || null;
      } catch {}
    }

    // 2. Build the DB update payload
    const dbUpdates: Record<string, any> = {};
    if (updates.title !== undefined) dbUpdates.title = updates.title;
    if (updates.caption !== undefined) dbUpdates.subtitle = updates.caption;
    if (updates.is_active !== undefined) dbUpdates.is_active = updates.is_active;
    if (updates.order !== undefined) dbUpdates.sort_order = updates.order;
    if (updates.image_url !== undefined) dbUpdates.image_url = updates.image_url;

    const { error } = await (supabase.from("hero_slides") as any)
      .update(dbUpdates)
      .eq("id", id);

    if (error && error.code !== "PGRST116") {
      return { success: false, error: error.message };
    }

    // 3. Replace-flow: delete old image if a new one was saved and it differs
    let storageError: string | undefined;
    if (
      updates.image_url !== undefined &&
      oldImageUrl &&
      oldImageUrl !== updates.image_url
    ) {
      const result = await deleteMediaByUrl(oldImageUrl);
      if (result.storageError) {
        storageError = result.storageError;
        console.error("[updateHeroSlideAction] old image storage cleanup failed:", result.storageError);
      }
    }

    revalidatePath("/", "layout");
    revalidatePath("/admin/slideshow", "layout");

    return { success: true, ...(storageError && { storageError }) };
  } catch (err: any) {
    return { success: false, error: err?.message || "Failed to update slide." };
  }
}
