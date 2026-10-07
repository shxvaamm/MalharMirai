"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/server";
import { deleteMediaByUrl } from "@/lib/storage/delete-media";

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
 * Server Action: Delete a hero_slides row AND its image from Supabase Storage.
 * Uses the service-role admin client so RLS doesn't block the operation.
 */
export async function deleteHeroSlideAction(id: string): Promise<ActionResult> {
  if (!isValidUUID(id)) {
    return { success: false, error: "Invalid slide ID." };
  }

  try {
    const supabase = createAdminClient();

    // 1. Fetch the image URL before deleting the row
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

    // 3. Delete the image from storage (row is gone — safe to skip ref-check)
    if (imageUrl) {
      deleteMediaByUrl(imageUrl, { skipRefCheck: true }).catch((err) => {
        console.warn("[deleteHeroSlideAction] storage cleanup failed:", err?.message);
      });
    }

    revalidatePath("/", "layout");
    revalidatePath("/admin/slideshow", "layout");

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || "Failed to delete slide." };
  }
}
