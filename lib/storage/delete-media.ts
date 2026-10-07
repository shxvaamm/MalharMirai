import { createAdminClient } from "@/lib/supabase/server";

const BUCKET = "media";

/**
 * Convert a Supabase public storage URL to its bucket-relative path.
 *
 * Handles URLs of the form:
 *   https://<project>.supabase.co/storage/v1/object/public/media/<folder>/<file>
 *
 * Returns null for:
 *   - empty / falsy strings
 *   - external URLs (not in our Supabase bucket)
 */
function urlToStoragePath(url: string | null | undefined): string | null {
  if (!url || typeof url !== "string") return null;

  // Must be a Supabase storage URL pointing at our bucket
  const marker = `/storage/v1/object/public/${BUCKET}/`;
  const idx = url.indexOf(marker);
  if (idx === -1) return null;

  // Slice path, strip query params, URL-decode
  const rawPath = url.slice(idx + marker.length).split("?")[0];
  if (!rawPath) return null;

  try {
    return decodeURIComponent(rawPath);
  } catch {
    return rawPath;
  }
}

/**
 * Check whether a given storage path is referenced by any DB row in the
 * tables that matter. Returns true if at least one reference exists (skip delete).
 *
 * Pass the full URL — we convert it to a path internally.
 *
 * Tables checked:
 *  - events.poster_url
 *  - events.payment_qr_url
 *  - gallery.media_url
 *  - club_members.avatar_url
 *  - profiles.avatar_url
 *  - hero_slides.image_url
 */
async function isUrlInUse(url: string): Promise<boolean> {
  try {
    const supabase = createAdminClient();

    const [evtPoster, evtQr, gal, cm, prof, slides] = await Promise.all([
      (supabase.from("events") as any).select("id").eq("poster_url", url).limit(1),
      (supabase.from("events") as any).select("id").eq("payment_qr_url", url).limit(1),
      (supabase.from("gallery") as any).select("id").eq("media_url", url).limit(1),
      (supabase.from("club_members") as any).select("id").eq("avatar_url", url).limit(1),
      (supabase.from("profiles") as any).select("id").eq("avatar_url", url).limit(1),
      (supabase.from("hero_slides") as any).select("id").eq("image_url", url).limit(1),
    ]);

    return [evtPoster, evtQr, gal, cm, prof, slides].some(
      (r) => Array.isArray(r.data) && r.data.length > 0
    );
  } catch {
    // On DB error, play it safe — don't delete
    return true;
  }
}

export interface DeleteMediaResult {
  deleted: boolean;
  /** Human-readable reason if not deleted */
  reason?: string;
}

/**
 * Delete a single file from Supabase Storage by its public URL.
 *
 * Safety rules:
 *  1. Ignores empty / external URLs silently.
 *  2. Before deleting, checks that no OTHER DB row still references the URL.
 *     (Pass `skipRefCheck: true` only when you are certain the DB row has
 *      already been deleted and you want to skip the round-trip.)
 *
 * Returns `{ deleted: true }` on success or if the file was already gone.
 * Returns `{ deleted: false, reason }` when skipped intentionally.
 * Throws on unexpected storage errors.
 */
export async function deleteMediaByUrl(
  url: string | null | undefined,
  options: { skipRefCheck?: boolean } = {}
): Promise<DeleteMediaResult> {
  const path = urlToStoragePath(url);

  if (!path) {
    // External URL or empty — nothing to do
    return { deleted: false, reason: "external or empty URL" };
  }

  if (!options.skipRefCheck) {
    const inUse = await isUrlInUse(url as string);
    if (inUse) {
      return { deleted: false, reason: "URL still referenced by another row" };
    }
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase.storage.from(BUCKET).remove([path]);

  if (error) {
    // "Object not found" is fine — idempotent
    if (error.message?.toLowerCase().includes("not found")) {
      return { deleted: true };
    }
    throw new Error(`Storage delete failed for path "${path}": ${error.message}`);
  }

  // Supabase returns [] when the path didn't exist — treat as success
  return { deleted: true };
}

/**
 * Convenience: delete multiple URLs in parallel, ignoring individual failures.
 * Useful when deleting an event that has both poster_url and payment_qr_url.
 */
export async function deleteMediaUrls(
  urls: (string | null | undefined)[],
  options: { skipRefCheck?: boolean } = {}
): Promise<void> {
  await Promise.allSettled(
    urls.map((url) => deleteMediaByUrl(url, options))
  );
}
