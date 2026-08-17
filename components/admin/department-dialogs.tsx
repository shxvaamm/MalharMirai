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
import { Department } from "@/lib/mock-data";
import {
  Layers,
  Plus,
  Edit,
  Loader2,
  AlertCircle,
  UploadCloud,
  X,
  ImageIcon,
  CheckCircle2,
} from "lucide-react";
import {
  createDepartmentAction,
  updateDepartmentAction,
} from "@/lib/actions/departments";
import {
  uploadMediaFile,
  validateMediaFile,
} from "@/lib/supabase/storage";

// ===================== CREATE DEPARTMENT DIALOG =====================
interface CreateDepartmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: (newDept: Department) => void;
  onError: (errorMsg: string) => void;
}

export function CreateDepartmentDialog({
  open,
  onOpenChange,
  onSuccess,
  onError,
}: CreateDepartmentDialogProps) {
  const [name, setName] = React.useState("");
  const [lead, setLead] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [imageUrl, setImageUrl] = React.useState("");
  const [selectedFile, setSelectedFile] = React.useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = React.useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = React.useState(false);
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

  const handleRemoveImage = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setImageUrl("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    // Client validation
    if (!name.trim() || name.trim().length < 2) {
      setValidationError("Department name must be at least 2 characters.");
      return;
    }
    if (!description.trim() || description.trim().length < 5) {
      setValidationError("Description must be at least 5 characters.");
      return;
    }

    setLoading(true);

    let finalImageUrl = imageUrl.trim();

    // If file was picked, upload to Supabase Storage
    if (selectedFile) {
      setUploadingImage(true);
      const uploadRes = await uploadMediaFile(selectedFile, "departments");
      setUploadingImage(false);

      if (!uploadRes.success || !uploadRes.url) {
        setLoading(false);
        setValidationError(uploadRes.error || "Failed to upload image to Supabase Storage.");
        return;
      }
      finalImageUrl = uploadRes.url;
    }

    const result = await createDepartmentAction({
      name: name.trim(),
      description: description.trim(),
      lead: lead.trim() || "General Lead",
      image_url: finalImageUrl,
    });
    setLoading(false);

    if (result.success) {
      onSuccess({
        id: result.data?.id || `dept-${Date.now()}`,
        name: name.trim(),
        description: description.trim(),
        lead: lead.trim() || "General Lead",
        memberCount: 0,
        image_url: finalImageUrl,
      });
      onOpenChange(false);
      setName("");
      setLead("");
      setDescription("");
      handleRemoveImage();
    } else {
      setValidationError(result.error || "Failed to create department.");
      onError(result.error || "Failed to create department.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto bg-[#0D0D0D] border border-white/10 rounded-3xl">
        <DialogHeader>
          <DialogTitle className="text-neutral-100 font-bold flex items-center gap-2">
            <Plus className="h-5 w-5 text-neutral-300" />
            <span>Create New Department Wing</span>
          </DialogTitle>
          <DialogDescription className="text-xs text-neutral-400">
            Add a new creative or operational wing with logo/cover upload to Supabase Storage.
          </DialogDescription>
        </DialogHeader>

        {validationError && (
          <div className="p-3 rounded-2xl bg-rose-950/30 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
            <span>{validationError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 pt-1">
          <div>
            <label className="text-xs font-semibold block mb-1 text-neutral-300">Department Name *</label>
            <Input
              placeholder="e.g. Photography & Cinematography"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              disabled={loading}
              className="text-xs rounded-2xl bg-black/60 border-white/10 text-neutral-200"
            />
          </div>

          <div>
            <label className="text-xs font-semibold block mb-1 text-neutral-300">Wing Lead / Head</label>
            <Input
              placeholder="e.g. Kabir Sengupta"
              value={lead}
              onChange={(e) => setLead(e.target.value)}
              disabled={loading}
              className="text-xs rounded-2xl bg-black/60 border-white/10 text-neutral-200"
            />
          </div>

          {/* Media Upload Section */}
          <div className="space-y-2">
            <label className="text-xs font-semibold block text-neutral-300">Wing Logo / Cover Image (PNG, JPG, WebP max 5MB)</label>
            
            {previewUrl || imageUrl ? (
              <div className="relative rounded-2xl overflow-hidden border border-white/10 bg-white/[0.03] p-2 flex items-center gap-3">
                <div className="relative h-16 w-24 shrink-0 rounded-xl overflow-hidden bg-neutral-900 border border-white/10">
                  <Image
                    src={previewUrl || imageUrl}
                    alt="Preview"
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0 text-xs">
                  <div className="font-semibold text-neutral-200 truncate">
                    {selectedFile ? selectedFile.name : "Custom Image URL"}
                  </div>
                  <div className="text-[11px] text-neutral-400">
                    {selectedFile
                      ? `${(selectedFile.size / (1024 * 1024)).toFixed(2)} MB`
                      : "Ready to attach"}
                  </div>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleRemoveImage}
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
                <UploadCloud className="h-8 w-8 mx-auto text-neutral-400 group-hover:text-neutral-200 transition-colors mb-1" />
                <div className="text-xs font-semibold text-neutral-200">
                  Click to browse image or drag & drop
                </div>
                <div className="text-[10px] text-neutral-400 mt-0.5">
                  Supports PNG, JPG, WebP, SVG up to 5MB
                </div>
              </div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp,image/gif,image/svg+xml"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>

          <div>
            <label className="text-xs font-semibold block mb-1 text-neutral-300">Description *</label>
            <textarea
              className="flex w-full rounded-2xl border border-white/10 bg-black/60 px-3 py-2 text-xs text-neutral-200 min-h-[70px] focus:outline-none"
              placeholder="Describe wing scope, activities, and auditions..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              disabled={loading}
            />
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
            <Button type="submit" variant="default" size="sm" disabled={loading} className="rounded-full font-semibold bg-[#E5E5E5] text-neutral-950 hover:bg-[#D4D4D4] shadow-sm">
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  <span>
                    {uploadingImage ? "Uploading to Storage..." : "Saving Department..."}
                  </span>
                </>
              ) : (
                "Create Department"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ===================== EDIT DEPARTMENT DIALOG =====================
interface EditDepartmentDialogProps {
  department: Department | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: (updatedDept: Department) => void;
  onError: (errorMsg: string) => void;
}

export function EditDepartmentDialog({
  department,
  open,
  onOpenChange,
  onSuccess,
  onError,
}: EditDepartmentDialogProps) {
  const [name, setName] = React.useState("");
  const [lead, setLead] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [imageUrl, setImageUrl] = React.useState("");
  const [selectedFile, setSelectedFile] = React.useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = React.useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [validationError, setValidationError] = React.useState<string | null>(null);

  const fileInputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (department && open) {
      setName(department.name || "");
      setLead(department.lead || "");
      setDescription(department.description || "");
      setImageUrl(department.image_url || "");
      setPreviewUrl(department.image_url || "");
      setSelectedFile(null);
      setValidationError(null);
    }
  }, [department, open]);

  if (!department) return null;

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

    try {
      // Assuming a helper exists to generate preview or using Blob URL
      const localUrl = URL.createObjectURL(file);
      setPreviewUrl(localUrl);
      setImageUrl(localUrl);
    } catch {
      const localUrl = URL.createObjectURL(file);
      setPreviewUrl(localUrl);
      setImageUrl(localUrl);
    }
  };

  const handleRemoveImage = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setImageUrl("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    if (!name.trim() || name.trim().length < 3) {
      setValidationError("Department name must be at least 3 characters.");
      return;
    }

    setLoading(true);

    let finalImageUrl = imageUrl.trim();

    if (selectedFile) {
      setUploadingImage(true);
      const uploadRes = await uploadMediaFile(selectedFile, "departments");
      setUploadingImage(false);

      if (uploadRes.success && uploadRes.url) {
        finalImageUrl = uploadRes.url;
      } else {
        setLoading(false);
        setValidationError(uploadRes.error || "Failed to upload image.");
        return;
      }
    }

    const payload = {
      name: name.trim(),
      lead: lead.trim() || "Wing Coordinator",
      description: description.trim() || "MALHAR Creative Department",
      image_url: finalImageUrl,
    };

    const result = await updateDepartmentAction(department.id, payload);
    setLoading(false);

    if (result.success) {
      onSuccess({
        ...department,
        ...payload,
      });
      onOpenChange(false);
    } else {
      setValidationError(result.error || "Failed to update department.");
      onError(result.error || "Failed to update department.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto bg-[#0D0D0D] border border-white/10 rounded-3xl">
        <DialogHeader>
          <DialogTitle className="text-neutral-100 font-bold flex items-center gap-2">
            <Edit className="h-5 w-5 text-neutral-300" />
            <span>Edit Department</span>
          </DialogTitle>
          <DialogDescription className="text-xs text-neutral-400">
            Modify wing metadata and upload updated logo/cover to Supabase Storage.
          </DialogDescription>
        </DialogHeader>

        {validationError && (
          <div className="p-3 rounded-2xl bg-rose-950/30 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
            <span>{validationError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 pt-1">
          <div>
            <label className="text-xs font-semibold block mb-1 text-neutral-300">Department Name *</label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              disabled={loading}
              className="text-xs rounded-2xl bg-black/60 border-white/10 text-neutral-200"
            />
          </div>

          <div>
            <label className="text-xs font-semibold block mb-1 text-neutral-300">Wing Lead / Head</label>
            <Input
              value={lead}
              onChange={(e) => setLead(e.target.value)}
              disabled={loading}
              className="text-xs rounded-2xl bg-black/60 border-white/10 text-neutral-200"
            />
          </div>

          {/* Media Upload Section */}
          <div className="space-y-2">
            <label className="text-xs font-semibold block text-neutral-300">Logo / Cover Image (PNG, JPG, WebP max 5MB)</label>
            
            {previewUrl || imageUrl ? (
              <div className="relative rounded-2xl overflow-hidden border border-white/10 bg-white/[0.03] p-2 flex items-center gap-3">
                <div className="relative h-16 w-24 shrink-0 rounded-xl overflow-hidden bg-neutral-900 border border-white/10">
                  <Image
                    src={previewUrl || imageUrl}
                    alt="Preview"
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0 text-xs">
                  <div className="font-semibold text-neutral-200 truncate">
                    {selectedFile ? selectedFile.name : "Active Department Image"}
                  </div>
                  <div className="text-[11px] text-neutral-400">
                    {selectedFile
                      ? `${(selectedFile.size / (1024 * 1024)).toFixed(2)} MB`
                      : "Attached"}
                  </div>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleRemoveImage}
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
                <UploadCloud className="h-8 w-8 mx-auto text-neutral-400 group-hover:text-neutral-200 transition-colors mb-1" />
                <div className="text-xs font-semibold text-neutral-200">
                  Click to replace or upload new image
                </div>
                <div className="text-[10px] text-neutral-400 mt-0.5">
                  Supports PNG, JPG, WebP, SVG up to 5MB
                </div>
              </div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp,image/gif,image/svg+xml"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>

          <div>
            <label className="text-xs font-semibold block mb-1 text-neutral-300">Description *</label>
            <textarea
              className="flex w-full rounded-2xl border border-white/10 bg-black/60 px-3 py-2 text-xs text-neutral-200 min-h-[70px] focus:outline-none"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              disabled={loading}
            />
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
            <Button type="submit" variant="default" size="sm" disabled={loading} className="rounded-full font-semibold bg-[#E5E5E5] text-neutral-950 hover:bg-[#D4D4D4] shadow-sm">
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  <span>
                    {uploadingImage ? "Uploading to Storage..." : "Saving Changes..."}
                  </span>
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
