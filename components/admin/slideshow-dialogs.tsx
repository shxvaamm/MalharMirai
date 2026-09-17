"use client";

import * as React from "react";
import Image from "next/image";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { HeroSlide } from "@/lib/mock-data";
import {
  UploadCloud,
  X,
  Loader2,
  AlertCircle,
  Sparkles,
  Image as ImageIcon,
  CheckCircle2,
} from "lucide-react";
import {
  validateMediaFile,
  fileToOptimizedDataUrl,
  uploadMediaFile,
} from "@/lib/supabase/storage";

// ===================== UPLOAD SLIDE DIALOG =====================
interface UploadSlideDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpload: (slide: {
    title: string;
    caption: string;
    image_url: string;
    order: number;
    is_active: boolean;
  }) => Promise<void> | void;
  currentSlideCount: number;
}

export function UploadSlideDialog({
  open,
  onOpenChange,
  onUpload,
  currentSlideCount,
}: UploadSlideDialogProps) {
  const [title, setTitle] = React.useState("");
  const [caption, setCaption] = React.useState("");
  const [selectedFile, setSelectedFile] = React.useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [validationError, setValidationError] = React.useState<string | null>(null);

  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const isSubmittingRef = React.useRef(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validation = validateMediaFile(file);
    if (!validation.valid) {
      setValidationError(validation.error || "Invalid file format or size.");
      return;
    }

    setValidationError(null);
    setSelectedFile(file);
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
  };

  const handleRemoveImage = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmittingRef.current || loading) return;
    isSubmittingRef.current = true;
    setValidationError(null);

    if (!selectedFile && !previewUrl) {
      setValidationError("Please select or upload a background image.");
      isSubmittingRef.current = false;
      return;
    }

    setLoading(true);

    try {
      let finalImageUrl = previewUrl || "";

      if (selectedFile) {
        // Upload to Supabase Storage to get a real public URL (works on all devices)
        try {
          const { uploadMediaFile: upload } = await import("@/lib/supabase/storage");
          const { createClient } = await import("@/lib/supabase/client");

          const supabase = createClient();
          const fileExt = selectedFile.name.split(".").pop() || "jpg";
          const filePath = `slideshow/${Date.now()}_slide.${fileExt}`;

          // Try uploading to 'media' bucket first, fallback to 'department-assets'
          let publicUrl = "";
          for (const bucket of ["media", "department-assets", "gallery"]) {
            const { data: uploadData, error: uploadError } = await supabase.storage
              .from(bucket)
              .upload(filePath, selectedFile, { cacheControl: "31536000", upsert: true });

            if (!uploadError && uploadData) {
              const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(filePath);
              if (urlData?.publicUrl) {
                publicUrl = urlData.publicUrl;
                break;
              }
            }
          }

          if (publicUrl) {
            finalImageUrl = publicUrl;
          } else {
            // Fallback: use optimized data URL (same device only — warn user)
            const { fileToOptimizedDataUrl } = await import("@/lib/supabase/storage");
            const dataUrl = await fileToOptimizedDataUrl(selectedFile, 1920, 1080, 0.80);
            if (dataUrl) finalImageUrl = dataUrl;
          }
        } catch (uploadErr) {
          console.warn("[Slideshow] Storage upload failed, using local preview:", uploadErr);
          // Last resort: use object URL (local only)
          if (!finalImageUrl) finalImageUrl = URL.createObjectURL(selectedFile);
        }
      }

      await onUpload({
        title: title.trim() || "MALHAR Stage Showcase",
        caption: caption.trim() || "Mirai Cultural Society",
        image_url: finalImageUrl,
        order: currentSlideCount + 1,
        is_active: true,
      });

      // Reset form
      setTitle("");
      setCaption("");
      setSelectedFile(null);
      setPreviewUrl(null);
      onOpenChange(false);
    } catch (err: any) {
      setValidationError(err?.message || "Failed to upload slideshow photo.");
    } finally {
      setLoading(false);
      isSubmittingRef.current = false;
    }
  };


  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto bg-[#0D0D0D] border border-white/10 rounded-3xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-neutral-100 flex items-center gap-2">
            <UploadCloud className="h-5 w-5 text-neutral-300" />
            <span>Upload Slideshow Photo</span>
          </DialogTitle>
          <DialogDescription className="text-xs text-neutral-400">
            This photo will automatically rotate in the background on the public home page with reduced opacity.
          </DialogDescription>
        </DialogHeader>

        {validationError && (
          <div className="flex items-center gap-2 p-3 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{validationError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 pt-1">
          {/* Image Upload Area */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-neutral-300 block">
              Background Photo (PNG, JPG, WebP up to 10MB) *
            </label>

            {previewUrl ? (
              <div className="relative rounded-2xl overflow-hidden border border-white/10 bg-white/[0.03] p-2 flex items-center gap-3">
                <div className="relative h-20 w-32 shrink-0 rounded-xl overflow-hidden bg-neutral-900 border border-white/10">
                  <img
                    src={previewUrl}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                  {/* Subtle opacity simulation overlay */}
                  <div className="absolute inset-0 bg-black/60" />
                </div>
                <div className="flex-1 min-w-0 text-xs">
                  <div className="font-semibold text-neutral-200 truncate">
                    {selectedFile ? selectedFile.name : "Background Photo"}
                  </div>
                  <div className="text-[11px] text-neutral-400 mt-0.5 font-medium">
                    Simulated background preview
                  </div>
                  <div className="text-[10px] text-neutral-500 mt-0.5">
                    {selectedFile
                      ? `${(selectedFile.size / (1024 * 1024)).toFixed(2)} MB`
                      : "Ready"}
                  </div>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleRemoveImage}
                  className="h-8 w-8 p-0 text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-full"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-white/15 hover:border-white/30 rounded-2xl p-6 text-center cursor-pointer transition-all bg-white/[0.02] hover:bg-white/[0.05] group"
              >
                <UploadCloud className="h-10 w-10 mx-auto text-neutral-400 group-hover:text-neutral-200 transition-colors mb-2" />
                <div className="text-xs font-semibold text-neutral-200">
                  Click or drag photo to upload
                </div>
                <div className="text-[11px] text-neutral-400 mt-1">
                  High-resolution horizontal/landscape photos look best
                </div>
              </div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp,image/jpg"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>

          {/* Optional Title & Caption */}
          <div className="space-y-3">
            <div>
              <label className="text-xs font-semibold text-neutral-300 block mb-1">
                Slide Label / Showcase Title (Optional)
              </label>
              <Input
                placeholder="e.g. Annual Fest Stage & Lights"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="text-xs rounded-2xl bg-black/60 border-white/10 text-neutral-200"
                disabled={loading}
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-neutral-300 block mb-1">
                Event Subtitle / Caption (Optional)
              </label>
              <Input
                placeholder="e.g. Cultural Wing Performances"
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                className="text-xs rounded-2xl bg-black/60 border-white/10 text-neutral-200"
                disabled={loading}
              />
            </div>
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              disabled={loading}
              className="rounded-full border-white/10 bg-white/[0.03] text-neutral-300 hover:text-white"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="default"
              size="sm"
              disabled={loading || (!selectedFile && !previewUrl)}
              className="rounded-full font-semibold bg-[#E5E5E5] text-neutral-950 hover:bg-[#D4D4D4] shadow-sm"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  <span>Publishing...</span>
                </>
              ) : (
                <>
                  <UploadCloud className="mr-2 h-4 w-4" />
                  <span>Add to Slideshow</span>
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ===================== EDIT SLIDE DIALOG =====================
interface EditSlideDialogProps {
  slide: HeroSlide | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (id: string, updates: Partial<HeroSlide>) => void;
}

export function EditSlideDialog({
  slide,
  open,
  onOpenChange,
  onSave,
}: EditSlideDialogProps) {
  const [title, setTitle] = React.useState("");
  const [caption, setCaption] = React.useState("");

  React.useEffect(() => {
    if (slide) {
      setTitle(slide.title || "");
      setCaption(slide.caption || "");
    }
  }, [slide]);

  if (!slide) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(slide.id, {
      title: title.trim(),
      caption: caption.trim(),
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-[#0D0D0D] border border-white/10 rounded-3xl">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold text-neutral-100">
            Edit Slide Details
          </DialogTitle>
          <DialogDescription className="text-xs text-neutral-400">
            Update the title or caption associated with this background photo.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="relative h-32 w-full rounded-2xl overflow-hidden border border-white/10 bg-neutral-900">
            <img
              src={slide.image_url}
              alt="Slide"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black/60" />
          </div>

          <div>
            <label className="text-xs font-semibold text-neutral-300 block mb-1">
              Title
            </label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="text-xs rounded-2xl bg-black/60 border-white/10 text-neutral-200"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-neutral-300 block mb-1">
              Caption
            </label>
            <Input
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              className="text-xs rounded-2xl bg-black/60 border-white/10 text-neutral-200"
            />
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="rounded-full border-white/10 bg-white/[0.03] text-neutral-300 hover:text-white"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="default"
              size="sm"
              className="rounded-full font-semibold bg-[#E5E5E5] text-neutral-950 hover:bg-[#D4D4D4] shadow-sm"
            >
              Save Changes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
