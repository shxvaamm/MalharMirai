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
import { UploadCloud, Image as ImageIcon, X, Loader2, AlertCircle } from "lucide-react";
import { uploadGalleryMediaAction } from "@/lib/actions/gallery";
import { uploadMediaFile, validateMediaFile } from "@/lib/supabase/storage";

interface UploadMediaDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpload: (
    title: string,
    mediaUrl: string,
    category: "previous_events" | "workshops" | "general",
    mediaType: "image" | "video",
    id?: string
  ) => Promise<any>;
}

export function UploadMediaDialog({ open, onOpenChange, onUpload }: UploadMediaDialogProps) {
  const [title, setTitle] = React.useState("");
  const [mediaUrl, setMediaUrl] = React.useState("");
  const [category, setCategory] = React.useState<"previous_events" | "workshops" | "general">("previous_events");
  const [mediaType, setMediaType] = React.useState<"image" | "video">("image");

  const [selectedFile, setSelectedFile] = React.useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = React.useState<string | null>(null);
  const [uploadingMedia, setUploadingMedia] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [validationError, setValidationError] = React.useState<string | null>(null);

  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validation = validateMediaFile(file);
    if (!validation.valid) {
      setValidationError(validation.error || "Invalid file format or size.");
      return;
    }

    setValidationError(null);
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handleRemoveMedia = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setMediaUrl("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    if (!title.trim() || title.trim().length < 2) {
      setValidationError("Media title is required.");
      return;
    }

    setLoading(true);

    let finalMediaUrl = mediaUrl.trim();

    if (selectedFile) {
      setUploadingMedia(true);
      const uploadRes = await uploadMediaFile(selectedFile, "gallery");
      setUploadingMedia(false);

      if (uploadRes.success && uploadRes.url) {
        finalMediaUrl = uploadRes.url;
      }
    }

    if (!finalMediaUrl) {
      setLoading(false);
      setValidationError("Please provide an image file or direct URL.");
      return;
    }

    const actionRes = await uploadGalleryMediaAction({
      title: title.trim(),
      media_url: finalMediaUrl,
      category,
      media_type: mediaType,
    });

    if (onUpload) {
      await onUpload(title.trim(), finalMediaUrl, category, mediaType, actionRes?.data?.id);
    }
    setLoading(false);
    onOpenChange(false);
    setTitle("");
    handleRemoveMedia();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto bg-[#0D0D0D] border border-white/10 rounded-3xl">
        <DialogHeader>
          <DialogTitle className="text-neutral-100 font-bold flex items-center gap-2">
            <UploadCloud className="h-5 w-5 text-neutral-300" />
            <span>Add Media to Gallery</span>
          </DialogTitle>
          <DialogDescription className="text-xs text-neutral-400">
            Upload festival photography or clips directly to Supabase Storage.
          </DialogDescription>
        </DialogHeader>

        {validationError && (
          <div className="p-3 rounded-2xl bg-rose-950/30 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
            <span>{validationError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5 pt-1">
          <div>
            <label className="text-xs font-semibold block mb-1 text-neutral-300">Media Title / Caption *</label>
            <Input
              placeholder="e.g. Cultural Night Concert"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              disabled={loading}
              className="text-xs rounded-2xl bg-black/60 border-white/10 text-neutral-200"
            />
          </div>

          {/* Media File Upload */}
          <div className="space-y-2">
            <label className="text-xs font-semibold block text-neutral-300">Upload File (PNG, JPG, WebP max 5MB)</label>
            {previewUrl || mediaUrl ? (
              <div className="relative rounded-2xl overflow-hidden border border-white/10 bg-white/[0.03] p-2 flex items-center gap-3">
                <div className="relative h-16 w-24 shrink-0 rounded-xl overflow-hidden bg-neutral-900 border border-white/10">
                  <Image src={previewUrl || mediaUrl} alt="Preview" fill className="object-cover" />
                </div>
                <div className="flex-1 min-w-0 text-xs">
                  <div className="font-semibold text-neutral-200 truncate">
                    {selectedFile ? selectedFile.name : "Attached Media"}
                  </div>
                  <div className="text-[11px] text-neutral-400">Ready to archive</div>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleRemoveMedia}
                  className="h-8 w-8 p-0 text-rose-400 hover:text-rose-300 rounded-full"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-white/15 hover:border-white/30 rounded-2xl p-4 text-center cursor-pointer transition-all bg-white/[0.02] hover:bg-white/[0.05] group"
              >
                <UploadCloud className="h-7 w-7 mx-auto text-neutral-400 group-hover:text-neutral-200 transition-colors mb-1" />
                <div className="text-xs font-semibold text-neutral-200">Click to browse media file</div>
                <div className="text-[10px] text-neutral-400 mt-0.5">PNG, JPG, WebP up to 5MB</div>
              </div>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold block mb-1 text-neutral-300">Archive Category</label>
              <select
                className="flex h-10 w-full rounded-2xl border border-white/10 bg-black/60 px-3 py-2 text-xs font-semibold text-neutral-200 focus-visible:outline-none"
                value={category}
                onChange={(e) => setCategory(e.target.value as any)}
                disabled={loading}
              >
                <option value="previous_events">Previous Events</option>
                <option value="workshops">Workshops &amp; Showcases</option>
                <option value="general">General Campus Moments</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold block mb-1 text-neutral-300">Media Type</label>
              <select
                className="flex h-10 w-full rounded-2xl border border-white/10 bg-black/60 px-3 py-2 text-xs text-neutral-200 focus-visible:outline-none"
                value={mediaType}
                onChange={(e) => setMediaType(e.target.value as any)}
                disabled={loading}
              >
                <option value="image">Photograph (Image)</option>
                <option value="video">Video Clip</option>
              </select>
            </div>
          </div>

          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" size="sm" onClick={() => onOpenChange(false)} disabled={loading} className="rounded-full border-white/10 bg-white/[0.03] text-neutral-300 hover:text-white">
              Cancel
            </Button>
            <Button type="submit" variant="default" size="sm" disabled={loading} className="rounded-full font-semibold bg-[#E5E5E5] text-neutral-950 hover:bg-[#D4D4D4] shadow-sm">
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  <span>{uploadingMedia ? "Uploading..." : "Archiving..."}</span>
                </>
              ) : (
                "Add to Media Gallery"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
