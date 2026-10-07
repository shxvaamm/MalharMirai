import { createAdminClient } from "@/lib/supabase/server";

const BUCKET = "media";

/**
 * Convert a Supabase public storage URL to its bucket-relative path.
 *
 * Handles:
 *   https://<project>.supabase.co/storage/v1/object/public/media/<folder>/<file>
 *
 * Returns null for empty strings or URLs that are not in our bucket.
 */
function urlToStoragePath(url: string | null | undefined): string | null {
  if (!url || typeof url !== "string") return null;

  const marker = `/storage/v1/object/public/${BUCKET}/`;
  const idx = url.indexOf(marker);
  if (idx === -1) return null;

  const rawPath = url.slice(idx + marker.length).split("?")[0];
  if (!rawPath) return null;

  try {
    return decodeURIComponent(rawPath);
  } catch {
    return rawPath;
  }
}

/**
 * Check whether a URL is still referenced by any row in the tracked tables.
 *
 * Call this AFTER the primary DB row has been deleted so the old URL is no
 * longer present in that table. The check still protects shared images that
 * another row references.
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

    // Strip query params before comparing: URLs are stored clean in the DB,
    // so a caller passing "…foo.jpg?v=123" must still match "…foo.jpg".
    const baseUrl = url.split("?")[0];

    const [evtPoster, evtQr, gal, cm, prof, slides] = await Promise.all([
      (supabase.from("events") as any).select("id").eq("poster_url", baseUrl).limit(1),
      (supabase.from("events") as any).select("id").eq("payment_qr_url", baseUrl).limit(1),
      (supabase.from("gallery") as any).select("id").eq("media_url", baseUrl).limit(1),
      (supabase.from("club_members") as any).select("id").eq("avatar_url", baseUrl).limit(1),
      (supabase.from("profiles") as any).select("id").eq("avatar_url", baseUrl).limit(1),
      (supabase.from("hero_slides") as any).select("id").eq("image_url", baseUrl).limit(1),
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
  /** true when the file was removed (or was already gone) */
  deleted: boolean;
  /** Bucket-relative path that was (or would have been) deleted */
  path?: string;
  /** Why the file was intentionally skipped */
  reason?: string;
  /** Set when the storage API call itself fails */
  storageError?: string;
}

/**
 * Delete a single file from Supabase Storage by its public URL.
 *
 * Protocol — always call this AFTER the primary DB row is deleted:
 *  1. Ignore empty / external URLs (returns `{ deleted: false, reason }`).
 *  2. Run the cross-table reference check. If another row still uses the URL,
 *     skip deletion (returns `{ deleted: false, reason }`).
 *  3. Attempt storage removal via the service-role admin client.
 *     - "Not found" is treated as success (idempotent).
 *     - Any other error is logged and returned as `storageError`; the function
 *       does NOT throw so the caller's DB success is preserved.
 */
export async function deleteMediaByUrl(
  url: string | null | undefined
): Promise<DeleteMediaResult> {
  const path = urlToStoragePath(url);

  if (!path) {
    return { deleted: false, reason: "external or empty URL" };
  }

  // Ref-check: only delete when no other row still references this URL.
  // The caller must have deleted their own row BEFORE calling this.
  const inUse = await isUrlInUse(url as string);
  if (inUse) {
    return { deleted: false, path, reason: "URL still referenced by another row" };
  }

  try {
    const supabase = createAdminClient();
    const { error } = await supabase.storage.from(BUCKET).remove([path]);

    if (error) {
      if (error.message?.toLowerCase().includes("not found")) {
        // File already gone — treat as success
        return { deleted: true, path };
      }
      const msg = `Storage delete failed for path "${path}": ${error.message}`;
      console.error(`[deleteMediaByUrl]`, msg);
      return { deleted: false, path, storageError: msg };
    }

    return { deleted: true, path };
  } catch (err: any) {
    const msg = `Storage delete threw for path "${path}": ${err?.message ?? String(err)}`;
    console.error(`[deleteMediaByUrl]`, msg);
    return { deleted: false, path, storageError: msg };
  }
}

/**
 * Delete multiple URLs in parallel.
 *
 * Returns the first `storageError` encountered (if any), so the caller can
 * surface it without hiding the fact that the DB operation succeeded.
 * All URLs are attempted regardless of individual failures.
 */
export async function deleteMediaUrls(
  urls: (string | null | undefined)[]
): Promise<string | undefined> {
  const results = await Promise.all(urls.map((url) => deleteMediaByUrl(url)));
  return results.find((r) => r.storageError)?.storageError;
}
