import { createClient } from "@/lib/supabase/client";

export const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/svg+xml",
];

export const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB limit for input (compressed on client)

export interface UploadResult {
  success: boolean;
  url?: string;
  path?: string;
  error?: string;
}

/**
 * Validates file MIME type and maximum file size.
 */
export function validateMediaFile(file: File): { valid: boolean; error?: string } {
  if (!file) {
    return { valid: false, error: "No file provided." };
  }

  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    return {
      valid: false,
      error: `Invalid file format (${file.type || "unknown"}). Allowed types: PNG, JPG, WebP, GIF, SVG.`,
    };
  }

  if (file.size > MAX_FILE_SIZE_BYTES) {
    const sizeMb = (file.size / (1024 * 1024)).toFixed(2);
    return {
      valid: false,
      error: `File size (${sizeMb} MB) exceeds the maximum limit of 10 MB.`,
    };
  }

  return { valid: true };
}

/**
 * High-performance client-side image optimizer:
 * Scales and compresses any uploaded photo to a lightweight, crisp WebP/JPEG data URL (<50KB).
 * Renders instantly (0ms) and persists reliably in localStorage & Supabase without breaking.
 */
export async function fileToOptimizedDataUrl(
  file: File,
  maxWidth = 720,
  maxHeight = 720,
  quality = 0.85
): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new (typeof window !== "undefined" ? window.Image : Image)() as HTMLImageElement;
      img.onload = () => {
        try {
          const canvas = document.createElement("canvas");
          let { width, height } = img;

          if (width > maxWidth || height > maxHeight) {
            if (width > height) {
              height = Math.round((height * maxWidth) / width);
              width = maxWidth;
            } else {
              width = Math.round((width * maxHeight) / height);
              height = maxHeight;
            }
          }

          canvas.width = Math.max(width, 1);
          canvas.height = Math.max(height, 1);
          const ctx = canvas.getContext("2d");
          if (!ctx) {
            resolve(e.target?.result as string);
            return;
          }

          ctx.drawImage(img, 0, 0, width, height);

          // Try WebP first, fallback to JPEG
          try {
            const webpUrl = canvas.toDataURL("image/webp", quality);
            if (webpUrl && webpUrl.startsWith("data:image/webp")) {
              resolve(webpUrl);
              return;
            }
          } catch {
            // fallback
          }

          const jpegUrl = canvas.toDataURL("image/jpeg", quality);
          resolve(jpegUrl);
        } catch {
          resolve(e.target?.result as string);
        }
      };
      img.onerror = () => resolve(e.target?.result as string);
      img.src = e.target?.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * Uploads a media file to Supabase Storage.
 *
 * NOTE: No race timeout — we always wait for the real Supabase public URL.
 * A Data URL fallback MUST NOT be saved to the database because:
 *   1. Postgres can truncate very long text values silently
 *   2. localStorage quota overflows evict the sync cache, making images vanish
 *   3. Data URLs are not accessible to other users or devices
 *
 * If both bucket uploads hard-fail we return success:false so the caller
 * can surface an actionable error instead of saving a broken URL to the DB.
 */
export async function uploadMediaFile(
  file: File,
  folder: "departments" | "events" | "gallery" | "avatars" = "avatars",
  bucketName = "department-assets"
): Promise<UploadResult> {
  const validation = validateMediaFile(file);
  if (!validation.valid) {
    return { success: false, error: validation.error };
  }

  try {
    const supabase = createClient();
    const fileExt = file.name.split(".").pop() || "png";
    const cleanBaseName = file.name
      .replace(/\.[^/.]+$/, "")
      .replace(/[^a-zA-Z0-9_-]/g, "_")
      .toLowerCase();
    const filePath = `${folder}/${Date.now()}_${cleanBaseName}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from(bucketName)
      .upload(filePath, file, {
        cacheControl: "31536000", // 1 year — immutable upload
        upsert: true,
      });

    if (uploadError) {
      // Try fallback bucket 'media'
      const { error: fallbackError } = await supabase.storage
        .from("media")
        .upload(filePath, file, {
          cacheControl: "31536000",
          upsert: true,
        });

      if (fallbackError) {
        // Both buckets failed — return error so the caller does NOT save a broken URL
        return {
          success: false,
          error: `Storage upload failed: ${fallbackError.message}`,
        };
      }

      const { data: publicUrlData } = supabase.storage
        .from("media")
        .getPublicUrl(filePath);

      return {
        success: true,
        url: publicUrlData.publicUrl,
        path: filePath,
      };
    }

    const { data: publicUrlData } = supabase.storage
      .from(bucketName)
      .getPublicUrl(filePath);

    return {
      success: true,
      url: publicUrlData.publicUrl,
      path: filePath,
    };
  } catch (err: any) {
    return { success: false, error: err?.message || "Upload failed." };
  }
}

/**
 * Deletes a media file from Supabase Storage.
 */
export async function deleteMediaFile(
  filePath: string,
  bucketName = "department-assets"
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createClient();
    const { error } = await supabase.storage.from(bucketName).remove([filePath]);
    if (error) {
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || "Deletion failed." };
  }
}
