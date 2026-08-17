"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ClubMember } from "@/lib/mock-data";
import { createMemberAction, updateMemberAction } from "@/lib/actions/members";
import { uploadMediaFile, validateMediaFile, fileToOptimizedDataUrl } from "@/lib/supabase/storage";
import { OFFICIAL_LEADERSHIP_ROLES } from "@/lib/leadership";
import { PhoneInput } from "@/components/ui/phone-input";
import { validateEmail, validatePhoneNumber } from "@/lib/validation/phone-email";
import {
  Crown,
  Upload,
  Camera,
  X,
  Trash2,
  Edit,
  AlertTriangle,
  Instagram,
  Linkedin,
  Sparkles,
} from "lucide-react";
import Image from "next/image";

const YEAR_OPTIONS = ["1st Year", "2nd Year", "3rd Year", "4th Year", "Faculty / Mentor"];

function formatInstagramUrl(val: string): string {
  const trimmed = val.trim();
  if (!trimmed) return "";
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) return trimmed;
  const handle = trimmed.replace(/^@/, "").replace(/\/$/, "");
  return `https://instagram.com/${handle}`;
}

function formatLinkedInUrl(val: string): string {
  const trimmed = val.trim();
  if (!trimmed) return "";
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) return trimmed;
  const path = trimmed.replace(/^@/, "").replace(/\/$/, "");
  if (path.startsWith("in/")) return `https://linkedin.com/${path}`;
  return `https://linkedin.com/in/${path}`;
}

interface AddLeaderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: (leader: ClubMember) => void;
  onError?: (error: string) => void;
  defaultSpecialty?: string;
}

export function AddLeaderDialog({
  open,
  onOpenChange,
  onSuccess,
  onError,
  defaultSpecialty = "President",
}: AddLeaderDialogProps) {
  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [countryCode, setCountryCode] = React.useState("+91");
  const [year, setYear] = React.useState("3rd Year");
  const [selectedRolePreset, setSelectedRolePreset] = React.useState<string>(defaultSpecialty);
  const [customSpecialty, setCustomSpecialty] = React.useState("");
  const [bio, setBio] = React.useState("");
  const [avatarUrl, setAvatarUrl] = React.useState("");
  const [instagram, setInstagram] = React.useState("");
  const [linkedin, setLinkedin] = React.useState("");

  const [selectedFile, setSelectedFile] = React.useState<File | null>(null);
  const [filePreview, setFilePreview] = React.useState<string | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [validationError, setValidationError] = React.useState("");

  const fileInputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (open) {
      setSelectedRolePreset(defaultSpecialty);
      if (!OFFICIAL_LEADERSHIP_ROLES.includes(defaultSpecialty as any)) {
        setSelectedRolePreset("Custom");
        setCustomSpecialty(defaultSpecialty);
      }
    }
  }, [open, defaultSpecialty]);

  const effectiveSpecialty = selectedRolePreset === "Custom" ? customSpecialty.trim() : selectedRolePreset;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validation = validateMediaFile(file);
    if (!validation.valid) {
      setValidationError(validation.error || "Invalid file format or size.");
      return;
    }

    setValidationError("");
    setSelectedFile(file);

    try {
      const dataUrl = await fileToOptimizedDataUrl(file);
      setFilePreview(dataUrl);
      setAvatarUrl(dataUrl);
    } catch {
      const preview = URL.createObjectURL(file);
      setFilePreview(preview);
      setAvatarUrl(preview);
    }
  };

  const handleRemoveAvatar = () => {
    setSelectedFile(null);
    if (filePreview && !filePreview.startsWith("data:")) URL.revokeObjectURL(filePreview);
    setFilePreview(null);
    setAvatarUrl("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError("");

    if (!name.trim() || name.trim().length < 2) {
      setValidationError("Full name must be at least 2 characters.");
      return;
    }

    // Strict email domain validation
    const emailValidation = validateEmail(email);
    if (!emailValidation.valid) {
      setValidationError(emailValidation.error || "Please provide a valid official email address.");
      return;
    }

    // Strict phone number validation with Country Code
    let formattedPhone = "+91 98765 00000";
    if (phone.trim()) {
      const phoneValidation = validatePhoneNumber(phone, countryCode);
      if (!phoneValidation.valid) {
        setValidationError(phoneValidation.error || "Please enter a valid phone number.");
        return;
      }
      formattedPhone = phoneValidation.formattedNumber;
    }

    if (!effectiveSpecialty) {
      setValidationError("Leadership Designation / Title is required.");
      return;
    }

    setLoading(true);

    let finalAvatarUrl = avatarUrl.trim();

    if (selectedFile) {
      setUploadingAvatar(true);
      const uploadRes = await uploadMediaFile(selectedFile, "avatars");
      setUploadingAvatar(false);

      if (uploadRes.success && uploadRes.url) {
        finalAvatarUrl = uploadRes.url;
      }
    }

    const initials = name
      .trim()
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);

    const formattedIg = formatInstagramUrl(instagram);
    const formattedLi = formatLinkedInUrl(linkedin);

    const newLeader: ClubMember = {
      id: `lead-${Date.now()}`,
      full_name: name.trim(),
      email: emailValidation.normalizedEmail,
      phone: formattedPhone,
      role: "admin",
      department: "Leadership Board",
      year: year.trim() || "3rd Year",
      specialty: effectiveSpecialty,
      bio: bio.trim() || `${effectiveSpecialty} leading MALHAR cultural initiatives at Mirai.`,
      avatar_url: finalAvatarUrl,
      avatar_initials: initials,
      socials: {
        instagram: formattedIg || undefined,
        linkedin: formattedLi || undefined,
      },
    };

    // 1. Optimistic UI update
    if (onSuccess) {
      onSuccess(newLeader);
    }
    onOpenChange(false);
    setLoading(false);

    // Reset Form
    setName("");
    setEmail("");
    setPhone("");
    setCountryCode("+91");
    setBio("");
    setInstagram("");
    setLinkedin("");
    handleRemoveAvatar();

    // 2. Persist to server in background
    try {
      await createMemberAction({
        full_name: name.trim(),
        email: emailValidation.normalizedEmail,
        phone: formattedPhone,
        role: "admin",
        department: "Leadership Board",
        year: year.trim() || "3rd Year",
        specialty: effectiveSpecialty,
        bio: bio.trim() || `${effectiveSpecialty} leading MALHAR cultural initiatives at Mirai.`,
        avatar_url: finalAvatarUrl,
        instagram: formattedIg || undefined,
        linkedin: formattedLi || undefined,
      });
    } catch (err) {
      console.warn("Background leadership creation:", err);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto bg-[#0D0D0D] border border-white/10 rounded-3xl">
        <DialogHeader>
          <DialogTitle className="text-neutral-100 font-bold flex items-center gap-2">
            <Crown className="h-5 w-5 text-neutral-300" />
            <span>Add Core Committee Member</span>
          </DialogTitle>
          <DialogDescription className="text-xs text-neutral-400">
            Appoint an executive coordinator (President, Vice President, Treasurer, Media Head, Faculty Coordinator).
          </DialogDescription>
        </DialogHeader>

        {validationError && (
          <div className="p-3 rounded-2xl bg-rose-950/30 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <span>{validationError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Photo Upload Section */}
          <div className="p-3.5 rounded-2xl border border-white/10 bg-white/[0.02] space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-neutral-200 text-xs flex items-center gap-1.5">
                <Camera className="h-4 w-4 text-neutral-400" />
                Portrait Photo
              </span>
              <span className="text-[10px] text-neutral-400 font-mono">Live Website Display</span>
            </div>

            <div className="flex items-center gap-4">
              <div className="relative h-16 w-16 shrink-0 rounded-2xl overflow-hidden border border-white/10 bg-neutral-900 flex items-center justify-center">
                {avatarUrl ? (
                  <Image src={avatarUrl} alt="Preview" fill className="object-cover" />
                ) : (
                  <Crown className="h-7 w-7 text-neutral-500" />
                )}
              </div>

              <div className="flex-1 space-y-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png, image/jpeg, image/webp"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    className="h-8 text-xs rounded-full border-white/10 bg-white/[0.03] text-neutral-300 hover:text-white"
                  >
                    <Upload className="mr-1.5 h-3.5 w-3.5" />
                    {avatarUrl ? "Replace Photo" : "Upload Picture"}
                  </Button>
                  {avatarUrl && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={handleRemoveAvatar}
                      className="h-8 text-xs text-rose-400 hover:text-rose-300 rounded-full"
                    >
                      <X className="h-3.5 w-3.5 mr-1" /> Remove
                    </Button>
                  )}
                </div>
                <p className="text-[10px] text-neutral-400">
                  High-res portrait photo (PNG, JPG, WebP up to 5MB).
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-semibold block mb-1 text-neutral-300">Full Name *</label>
              <Input
                placeholder="e.g. Aryan Kapoor"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="text-xs rounded-2xl bg-black/60 border-white/10 text-neutral-200"
              />
            </div>
            <div>
              <label className="text-[11px] font-semibold block mb-1 text-neutral-300">Official Email *</label>
              <Input
                type="email"
                placeholder="e.g. aryan.k@mirai.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="text-xs rounded-2xl bg-black/60 border-white/10 text-neutral-200"
              />
            </div>
          </div>

          <div>
            <label className="text-[11px] font-semibold block mb-1 text-neutral-300">Contact / Mobile Number</label>
            <PhoneInput
              value={phone}
              onChange={setPhone}
              countryCode={countryCode}
              onCountryCodeChange={setCountryCode}
              disabled={loading || uploadingAvatar}
            />
          </div>

          {/* Position & Year (Department Removed for Leaders) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-semibold block mb-1 text-neutral-300">Leadership Position *</label>
              <select
                value={selectedRolePreset}
                onChange={(e) => setSelectedRolePreset(e.target.value)}
                className="w-full rounded-2xl border border-white/10 bg-black/60 px-3 py-2 text-xs font-semibold text-neutral-200 focus-visible:outline-none"
              >
                {OFFICIAL_LEADERSHIP_ROLES.map((role) => (
                  <option key={role} value={role}>
                    {role}
                  </option>
                ))}
                <option value="Custom">Custom Designation...</option>
              </select>
            </div>
            <div>
              <label className="text-[11px] font-semibold block mb-1 text-neutral-300">Academic Year</label>
              <select
                value={year}
                onChange={(e) => setYear(e.target.value)}
                className="w-full rounded-2xl border border-white/10 bg-black/60 px-3 py-2 text-xs font-medium text-neutral-200 focus-visible:outline-none"
              >
                {YEAR_OPTIONS.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {selectedRolePreset === "Custom" && (
            <div>
              <label className="text-[11px] font-semibold block mb-1 text-neutral-300">Custom Title / Designation *</label>
              <Input
                placeholder="e.g. Joint Secretary / Stage Director"
                value={customSpecialty}
                onChange={(e) => setCustomSpecialty(e.target.value)}
                required
                className="text-xs rounded-2xl bg-black/60 border-white/10 text-neutral-200"
              />
            </div>
          )}

          <div>
            <label className="text-[11px] font-semibold block mb-1 text-neutral-300">Executive Bio</label>
            <Textarea
              placeholder="Leadership vision and contribution to MALHAR..."
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={2}
              className="text-xs rounded-2xl bg-black/60 border-white/10 text-neutral-200"
            />
          </div>

          {/* Dedicated Social Media Section (Instagram & LinkedIn) */}
          <div className="p-3.5 rounded-2xl border border-white/[0.08] bg-white/[0.02] space-y-3">
            <div className="text-xs font-semibold text-neutral-200 flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-neutral-400" />
              <span>Public Social Links (Shown on Main Website)</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-medium flex items-center gap-1.5 mb-1 text-neutral-400">
                  <Instagram className="h-3.5 w-3.5" />
                  <span>Instagram Handle / Link</span>
                </label>
                <Input
                  placeholder="@handle or https://instagram.com/..."
                  value={instagram}
                  onChange={(e) => setInstagram(e.target.value)}
                  className="text-xs font-mono rounded-xl bg-black/60 border-white/10 text-neutral-200"
                />
              </div>
              <div>
                <label className="text-[11px] font-medium flex items-center gap-1.5 mb-1 text-neutral-400">
                  <Linkedin className="h-3.5 w-3.5" />
                  <span>LinkedIn Profile Link</span>
                </label>
                <Input
                  placeholder="https://linkedin.com/in/..."
                  value={linkedin}
                  onChange={(e) => setLinkedin(e.target.value)}
                  className="text-xs font-mono rounded-xl bg-black/60 border-white/10 text-neutral-200"
                />
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2 pt-2">
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
              disabled={loading || uploadingAvatar}
              className="rounded-full font-semibold bg-[#E5E5E5] text-neutral-950 hover:bg-[#D4D4D4] shadow-sm"
            >
              {loading || uploadingAvatar ? "Saving..." : "Add to Core Committee"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ===================== EDIT LEADER DIALOG =====================
interface EditLeaderDialogProps {
  leader: ClubMember | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: (leader: ClubMember) => void;
}

export function EditLeaderDialog({
  leader,
  open,
  onOpenChange,
  onSuccess,
}: EditLeaderDialogProps) {
  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [countryCode, setCountryCode] = React.useState("+91");
  const [year, setYear] = React.useState("3rd Year");
  const [selectedRolePreset, setSelectedRolePreset] = React.useState("President");
  const [customSpecialty, setCustomSpecialty] = React.useState("");
  const [bio, setBio] = React.useState("");
  const [avatarUrl, setAvatarUrl] = React.useState("");
  const [instagram, setInstagram] = React.useState("");
  const [linkedin, setLinkedin] = React.useState("");

  const [selectedFile, setSelectedFile] = React.useState<File | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [validationError, setValidationError] = React.useState<string | null>(null);

  const fileInputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (leader && open) {
      setName(leader.full_name || "");
      setEmail(leader.email || "");
      setPhone(leader.phone || "");
      setCountryCode("+91");
      setYear(leader.year || "3rd Year");
      setBio(leader.bio || "");
      setAvatarUrl(leader.avatar_url || "");
      setInstagram(leader.socials?.instagram || "");
      setLinkedin(leader.socials?.linkedin || "");

      const currentSpecialty = leader.specialty || "";
      if (OFFICIAL_LEADERSHIP_ROLES.includes(currentSpecialty as any)) {
        setSelectedRolePreset(currentSpecialty);
        setCustomSpecialty("");
      } else {
        setSelectedRolePreset("Custom");
        setCustomSpecialty(currentSpecialty);
      }

      setSelectedFile(null);
      setValidationError(null);
    }
  }, [leader, open]);

  if (!leader) return null;

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
    const localUrl = URL.createObjectURL(file);
    setAvatarUrl(localUrl);
  };

  const handleRemoveAvatar = () => {
    setSelectedFile(null);
    setAvatarUrl("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    if (!name.trim() || name.trim().length < 2) {
      setValidationError("Full Name must be at least 2 characters.");
      return;
    }

    // Strict email domain validation
    const emailValidation = validateEmail(email);
    if (!emailValidation.valid) {
      setValidationError(emailValidation.error || "Valid official email address is required.");
      return;
    }

    // Strict phone number validation with Country Code
    let formattedPhone = "+91 98765 00000";
    if (phone.trim()) {
      const phoneValidation = validatePhoneNumber(phone, countryCode);
      if (!phoneValidation.valid) {
        setValidationError(phoneValidation.error || "Please enter a valid phone number.");
        return;
      }
      formattedPhone = phoneValidation.formattedNumber;
    }

    const effectiveSpecialty =
      selectedRolePreset === "Custom"
        ? customSpecialty.trim() || "Core Committee Member"
        : selectedRolePreset;

    setLoading(true);

    let finalAvatarUrl = avatarUrl.trim();

    if (selectedFile) {
      setUploadingAvatar(true);
      try {
        const uploadResult = await uploadMediaFile(selectedFile, "avatars");
        if (uploadResult.success && uploadResult.url) {
          finalAvatarUrl = uploadResult.url;
        } else {
          finalAvatarUrl = await fileToOptimizedDataUrl(selectedFile);
        }
      } catch {
        finalAvatarUrl = await fileToOptimizedDataUrl(selectedFile);
      } finally {
        setUploadingAvatar(false);
      }
    }

    const updatedLeader: ClubMember = {
      ...leader,
      full_name: name.trim(),
      email: emailValidation.normalizedEmail,
      phone: formattedPhone,
      role: "admin",
      department: "Leadership Board",
      year: year.trim() || "3rd Year",
      specialty: effectiveSpecialty,
      bio: bio.trim() || `${effectiveSpecialty} leading MALHAR cultural initiatives at Mirai.`,
      avatar_url: finalAvatarUrl,
      socials: {
        instagram: formatInstagramUrl(instagram) || undefined,
        linkedin: formatLinkedInUrl(linkedin) || undefined,
      },
    };

    // 1. Optimistic local update
    if (onSuccess) {
      onSuccess(updatedLeader);
    }
    onOpenChange(false);
    setLoading(false);

    // 2. Persist in background
    try {
      await updateMemberAction(leader.id, {
        full_name: name.trim(),
        email: emailValidation.normalizedEmail,
        phone: formattedPhone,
        department: "Leadership Board",
        year: year.trim(),
        role: "admin",
        specialty: effectiveSpecialty,
        bio: bio.trim(),
        avatar_url: finalAvatarUrl,
        instagram: formatInstagramUrl(instagram) || undefined,
        linkedin: formatLinkedInUrl(linkedin) || undefined,
      });
    } catch (err) {
      console.warn("Background leader update error:", err);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto bg-[#0D0D0D] border border-white/10 rounded-3xl">
        <DialogHeader>
          <DialogTitle className="text-neutral-100 font-bold flex items-center gap-2">
            <Edit className="h-5 w-5 text-neutral-300" />
            <span>Edit Core Committee Profile</span>
          </DialogTitle>
          <DialogDescription className="text-xs text-neutral-400">
            Update role designation, citation, social links, and portrait photo.
          </DialogDescription>
        </DialogHeader>

        {validationError && (
          <div className="p-3 rounded-2xl bg-rose-950/30 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <span>{validationError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Photo Section */}
          <div className="p-3.5 rounded-2xl border border-white/10 bg-white/[0.02] space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-neutral-200 text-xs flex items-center gap-1.5">
                <Camera className="h-4 w-4 text-neutral-400" />
                Portrait Photo
              </span>
              <span className="text-[10px] text-neutral-400 font-mono">Live Website Sync</span>
            </div>

            <div className="flex items-center gap-4">
              <div className="relative h-16 w-16 shrink-0 rounded-2xl overflow-hidden border border-white/10 bg-neutral-900 flex items-center justify-center">
                {avatarUrl ? (
                  <Image src={avatarUrl} alt="Preview" fill className="object-cover" />
                ) : (
                  <Crown className="h-7 w-7 text-neutral-500" />
                )}
              </div>

              <div className="flex-1 space-y-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png, image/jpeg, image/webp"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    className="h-8 text-xs rounded-full border-white/10 bg-white/[0.03] text-neutral-300 hover:text-white"
                  >
                    <Upload className="mr-1.5 h-3.5 w-3.5" />
                    {avatarUrl ? "Change Photo" : "Upload Picture"}
                  </Button>
                  {avatarUrl && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={handleRemoveAvatar}
                      className="h-8 text-xs text-rose-400 hover:text-rose-300 rounded-full"
                    >
                      <X className="h-3.5 w-3.5 mr-1" /> Remove
                    </Button>
                  )}
                </div>
                <p className="text-[10px] text-neutral-400">
                  Update portrait avatar stored in Supabase.
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-semibold block mb-1 text-neutral-300">Full Name *</label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="text-xs rounded-2xl bg-black/60 border-white/10 text-neutral-200"
              />
            </div>
            <div>
              <label className="text-[11px] font-semibold block mb-1 text-neutral-300">Official Email *</label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="text-xs rounded-2xl bg-black/60 border-white/10 text-neutral-200"
              />
            </div>
          </div>

          <div>
            <label className="text-[11px] font-semibold block mb-1 text-neutral-300">Contact / Mobile Number</label>
            <PhoneInput
              value={phone}
              onChange={setPhone}
              countryCode={countryCode}
              onCountryCodeChange={setCountryCode}
              disabled={loading || uploadingAvatar}
            />
          </div>

          {/* Position & Year (Department Removed for Leaders) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-semibold block mb-1 text-neutral-300">Leadership Position *</label>
              <select
                value={selectedRolePreset}
                onChange={(e) => setSelectedRolePreset(e.target.value)}
                className="w-full rounded-2xl border border-white/10 bg-black/60 px-3 py-2 text-xs font-semibold text-neutral-200 focus-visible:outline-none"
              >
                {OFFICIAL_LEADERSHIP_ROLES.map((role) => (
                  <option key={role} value={role}>
                    {role}
                  </option>
                ))}
                <option value="Custom">Custom Designation...</option>
              </select>
            </div>
            <div>
              <label className="text-[11px] font-semibold block mb-1 text-neutral-300">Academic Year</label>
              <select
                value={year}
                onChange={(e) => setYear(e.target.value)}
                className="w-full rounded-2xl border border-white/10 bg-black/60 px-3 py-2 text-xs font-medium text-neutral-200 focus-visible:outline-none"
              >
                {YEAR_OPTIONS.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {selectedRolePreset === "Custom" && (
            <div>
              <label className="text-[11px] font-semibold block mb-1 text-neutral-300">Custom Title / Designation *</label>
              <Input
                placeholder="e.g. Joint Secretary / Stage Director"
                value={customSpecialty}
                onChange={(e) => setCustomSpecialty(e.target.value)}
                required
                className="text-xs rounded-2xl bg-black/60 border-white/10 text-neutral-200"
              />
            </div>
          )}

          <div>
            <label className="text-[11px] font-semibold block mb-1 text-neutral-300">Executive Bio</label>
            <Textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={2}
              className="text-xs rounded-2xl bg-black/60 border-white/10 text-neutral-200"
            />
          </div>

          {/* Dedicated Social Media Section (Instagram & LinkedIn) */}
          <div className="p-3.5 rounded-2xl border border-white/[0.08] bg-white/[0.02] space-y-3">
            <div className="text-xs font-semibold text-neutral-200 flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-neutral-400" />
              <span>Public Social Links (Shown on Main Website)</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-medium flex items-center gap-1.5 mb-1 text-neutral-400">
                  <Instagram className="h-3.5 w-3.5" />
                  <span>Instagram Handle / Link</span>
                </label>
                <Input
                  placeholder="@handle or https://instagram.com/..."
                  value={instagram}
                  onChange={(e) => setInstagram(e.target.value)}
                  className="text-xs font-mono rounded-xl bg-black/60 border-white/10 text-neutral-200"
                />
              </div>
              <div>
                <label className="text-[11px] font-medium flex items-center gap-1.5 mb-1 text-neutral-400">
                  <Linkedin className="h-3.5 w-3.5" />
                  <span>LinkedIn Profile Link</span>
                </label>
                <Input
                  placeholder="https://linkedin.com/in/..."
                  value={linkedin}
                  onChange={(e) => setLinkedin(e.target.value)}
                  className="text-xs font-mono rounded-xl bg-black/60 border-white/10 text-neutral-200"
                />
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2 pt-2">
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
              disabled={loading || uploadingAvatar}
              className="rounded-full font-semibold bg-[#E5E5E5] text-neutral-950 hover:bg-[#D4D4D4] shadow-sm"
            >
              {loading || uploadingAvatar ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ===================== DELETE LEADER CONFIRM DIALOG =====================
interface DeleteLeaderConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  onConfirm: () => Promise<void> | void;
}

export function DeleteLeaderConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  onConfirm,
}: DeleteLeaderConfirmDialogProps) {
  const [loading, setLoading] = React.useState(false);

  const handleConfirm = async () => {
    setLoading(true);
    await onConfirm();
    setLoading(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-[#0D0D0D] border border-white/10 rounded-3xl">
        <DialogHeader>
          <DialogTitle className="text-neutral-100 flex items-center gap-2 font-bold">
            <Trash2 className="h-5 w-5 text-rose-400" />
            <span>{title}</span>
          </DialogTitle>
          <DialogDescription className="text-xs text-neutral-400">{description}</DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2 pt-2">
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)} disabled={loading} className="rounded-full border-white/10 bg-white/[0.03] text-neutral-300 hover:text-white">
            Cancel
          </Button>
          <Button variant="destructive" size="sm" onClick={handleConfirm} disabled={loading} className="rounded-full">
            {loading ? "Deleting..." : "Confirm Delete"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
