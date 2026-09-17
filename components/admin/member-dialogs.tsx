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
import { ClubMember, Department, OFFICIAL_DEPARTMENTS, MOCK_DEPARTMENTS } from "@/lib/mock-data";
import { getSyncedData, STORAGE_KEYS } from "@/lib/store/sync-store";
import {
  UserPlus,
  Edit,
  Shield,
  Trash2,
  Layers,
  UploadCloud,
  X,
  Loader2,
  AlertCircle,
  Camera,
  Crown,
  ShieldAlert,
} from "lucide-react";

import { UserRole, isSuperAdminEmail } from "@/lib/auth/rbac";
import {
  createMemberAction,
  updateMemberAction,
  updateMemberRoleAction,
  deleteMemberAction,
} from "@/lib/actions/members";

import { uploadMediaFile, validateMediaFile, fileToOptimizedDataUrl } from "@/lib/supabase/storage";
import { registerAccountCredential } from "@/lib/auth/credentials-store";
import { PhoneInput } from "@/components/ui/phone-input";
import { validateEmail, validatePhoneNumber } from "@/lib/validation/phone-email";

// ===================== ADD MEMBER DIALOG =====================
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

interface AddMemberDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: (newMember: ClubMember) => void;
  onError?: (errorMsg: string) => void;
  onAdd?: (newMember: any) => Promise<any>;
  defaultRole?: "admin" | "member" | "volunteer";
}

export function AddMemberDialog({
  open,
  onOpenChange,
  onSuccess,
  onError,
  onAdd,
  defaultRole = "member",
}: AddMemberDialogProps) {
  const departmentsList = typeof window !== "undefined"
    ? getSyncedData<Department[]>(STORAGE_KEYS.DEPARTMENTS, OFFICIAL_DEPARTMENTS)
    : OFFICIAL_DEPARTMENTS;

  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [countryCode, setCountryCode] = React.useState("+91");
  const [role, setRole] = React.useState<"admin" | "member" | "volunteer">(defaultRole);
  const [department, setDepartment] = React.useState(departmentsList[0]?.name || "Management Department");
  const [year, setYear] = React.useState("1st Year");
  const [specialty, setSpecialty] = React.useState("");
  const [bio, setBio] = React.useState("");
  const [avatarUrl, setAvatarUrl] = React.useState("");
  const [instagram, setInstagram] = React.useState("");
  const [linkedin, setLinkedin] = React.useState("");

  const [selectedFile, setSelectedFile] = React.useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = React.useState<string | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [validationError, setValidationError] = React.useState<string | null>(null);

  const fileInputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (open) {
      setRole(defaultRole);
    }
  }, [open, defaultRole]);

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
      const dataUrl = await fileToOptimizedDataUrl(file);
      setPreviewUrl(dataUrl);
      setAvatarUrl(dataUrl);
    } catch {
      const fallbackUrl = URL.createObjectURL(file);
      setPreviewUrl(fallbackUrl);
      setAvatarUrl(fallbackUrl);
    }
  };

  const handleRemoveAvatar = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setAvatarUrl("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    if (!name.trim() || name.trim().length < 2) {
      setValidationError("Full name must be at least 2 characters.");
      return;
    }

    // Strict email domain validation
    const emailValidation = validateEmail(email);
    if (!emailValidation.valid) {
      setValidationError(emailValidation.error || "Please enter a valid official email address.");
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

    const formattedIg = formatInstagramUrl(instagram);
    const formattedLi = formatLinkedInUrl(linkedin);

    const result = await createMemberAction({
      full_name: name.trim(),
      email: emailValidation.normalizedEmail,
      phone: formattedPhone,
      role,
      department,
      year,
      specialty: specialty.trim() || "Department Coordinator",
      bio: bio.trim() || `Active member in ${department}`,
      avatar_url: finalAvatarUrl,
    });
    setLoading(false);

    if (result.success) {
      const initials = name
        .trim()
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);

      const createdMember: ClubMember = {
        id: result.data?.id || `mem-${Date.now()}`,
        full_name: name.trim(),
        email: emailValidation.normalizedEmail,
        phone: formattedPhone,
        role,
        department,
        year,
        specialty: specialty.trim() || "Department Coordinator",
        bio: bio.trim() || `Active member in ${department}`,
        avatar_url: finalAvatarUrl,
        avatar_initials: initials || "MC",
        socials: {
          instagram: formattedIg || undefined,
          linkedin: formattedLi || undefined,
        },
      };

      const { updateRegisteredUserRole } = await import("@/lib/auth/credentials-store");
      updateRegisteredUserRole(emailValidation.normalizedEmail, role);

      if (onSuccess) {
        onSuccess(createdMember);
      } else if (onAdd) {
        await onAdd(createdMember);
      }
      onOpenChange(false);
      setName("");
      setEmail("");
      setPhone("");
      setCountryCode("+91");
      setInstagram("");
      setLinkedin("");
      handleRemoveAvatar();
    } else {
      if (onError) onError(result.error || "Failed to create member.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto bg-[#0D0D0D] border border-white/10 rounded-3xl">
        <DialogHeader>
          <DialogTitle className="text-neutral-100 font-bold flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-neutral-300" />
            <span>Add Society Member</span>
          </DialogTitle>
          <DialogDescription className="text-xs text-neutral-400">
            Enroll a new member, coordinator, or volunteer to MALHAR official departments.
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
            <label className="text-xs font-semibold block mb-1 text-neutral-300">Full Name</label>
            <Input
              placeholder="e.g. Rahul Sharma"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              disabled={loading}
              className="text-xs rounded-2xl bg-black/60 border-white/10 text-neutral-200"
            />
          </div>

          <div>
            <label className="text-xs font-semibold block mb-1 text-neutral-300">Email Address</label>
            <Input
              type="email"
              placeholder="rahul@mirai.edu"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
              className="text-xs rounded-2xl bg-black/60 border-white/10 text-neutral-200"
            />
          </div>

          <div>
            <label className="text-xs font-semibold block mb-1 text-neutral-300">Phone Number</label>
            <PhoneInput
              value={phone}
              onChange={setPhone}
              countryCode={countryCode}
              onCountryCodeChange={setCountryCode}
              disabled={loading}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold block mb-1 text-neutral-300">Department</label>
              <select
                className="flex h-10 w-full rounded-2xl border border-white/10 bg-black/60 px-3 py-2 text-xs text-neutral-200 focus-visible:outline-none"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                disabled={loading}
              >
                {departmentsList.map((d) => (
                  <option key={d.id} value={d.name}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold block mb-1 text-neutral-300">Role Type</label>
              <select
                className="flex h-10 w-full rounded-2xl border border-white/10 bg-black/60 px-3 py-2 text-xs text-neutral-200 focus-visible:outline-none"
                value={role}
                onChange={(e) => setRole(e.target.value as any)}
                disabled={loading}
              >
                <option value="member">Official Member</option>
                <option value="admin">Administrator</option>
                <option value="volunteer">Volunteer</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold block mb-1 text-neutral-300">Academic Year</label>
            <select
              className="flex h-10 w-full rounded-2xl border border-white/10 bg-black/60 px-3 py-2 text-xs font-medium text-neutral-200 focus-visible:outline-none"
              value={year}
              onChange={(e) => setYear(e.target.value)}
              disabled={loading}
            >
              <option value="1st Year">1st Year</option>
              <option value="2nd Year">2nd Year</option>
              <option value="3rd Year">3rd Year</option>
              <option value="4th Year">4th Year</option>
            </select>
          </div>

          {/* Social Links (Instagram & LinkedIn) */}
          <div className="p-3 rounded-2xl border border-white/[0.08] bg-white/[0.02] space-y-2.5">
            <span className="text-[11px] font-semibold text-neutral-300 block">Public Socials (Main Website)</span>
            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="text-[10px] font-medium text-neutral-400 block mb-0.5">Instagram</label>
                <Input
                  placeholder="@handle or URL"
                  value={instagram}
                  onChange={(e) => setInstagram(e.target.value)}
                  disabled={loading}
                  className="text-xs font-mono rounded-xl bg-black/60 border-white/10 text-neutral-200"
                />
              </div>
              <div>
                <label className="text-[10px] font-medium text-neutral-400 block mb-0.5">LinkedIn</label>
                <Input
                  placeholder="Profile URL"
                  value={linkedin}
                  onChange={(e) => setLinkedin(e.target.value)}
                  disabled={loading}
                  className="text-xs font-mono rounded-xl bg-black/60 border-white/10 text-neutral-200"
                />
              </div>
            </div>
          </div>

          {/* Profile Photo Upload */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold block text-neutral-300">Profile Photo</label>
            {previewUrl ? (
              <div className="relative rounded-2xl overflow-hidden border border-white/10 bg-white/[0.03] p-2.5 flex items-center gap-3">
                <div className="relative h-12 w-12 shrink-0 rounded-full overflow-hidden bg-neutral-900 border border-white/10 shadow-inner">
                  <Image src={previewUrl} alt="Avatar Preview" fill className="object-cover" />
                </div>
                <div className="flex-1 min-w-0 text-xs">
                  <div className="font-semibold text-neutral-200 truncate">
                    {selectedFile ? selectedFile.name : "Photo Selected"}
                  </div>
                  <div className="text-[11px] text-neutral-400">
                    {uploadingAvatar ? "Uploading to storage..." : "Ready to save"}
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    className="h-8 px-2 text-[11px] rounded-full border-white/10 bg-white/[0.03] text-neutral-300 hover:text-white"
                    title="Replace Photo"
                  >
                    Replace
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleRemoveAvatar}
                    className="h-8 w-8 p-0 text-rose-400 hover:text-rose-300 rounded-full"
                    title="Remove Photo"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ) : (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border border-dashed border-white/15 hover:border-white/30 rounded-2xl p-3 text-center cursor-pointer transition-all bg-white/[0.02] hover:bg-white/[0.05] group flex items-center justify-center gap-2"
              >
                <Camera className="h-5 w-5 text-neutral-400 group-hover:text-neutral-200 transition-colors" />
                <span className="text-xs font-medium text-neutral-400 group-hover:text-neutral-200">
                  Upload Photo (PNG, JPG, WebP max 5MB)
                </span>
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

          <div>
            <label className="text-xs font-semibold block mb-1 text-neutral-300">Role Designation / Specialty</label>
            <Input
              placeholder="e.g. Lead Cinematographer"
              value={specialty}
              onChange={(e) => setSpecialty(e.target.value)}
              disabled={loading}
              className="text-xs rounded-2xl bg-black/60 border-white/10 text-neutral-200"
            />
          </div>

          <div>
            <label className="text-xs font-semibold block mb-1 text-neutral-300">Short Bio</label>
            <textarea
              className="flex min-h-[60px] w-full rounded-2xl border border-white/10 bg-black/60 px-3 py-2 text-xs text-neutral-200 focus-visible:outline-none"
              placeholder="Brief introduction..."
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              disabled={loading}
            />
          </div>

          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" size="sm" onClick={() => onOpenChange(false)} disabled={loading} className="rounded-full border-white/10 bg-white/[0.03] text-neutral-300 hover:text-white">
              Cancel
            </Button>
            <Button type="submit" variant="default" size="sm" disabled={loading} className="rounded-full font-semibold bg-[#E5E5E5] text-neutral-950 hover:bg-[#D4D4D4] shadow-sm">
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  <span>{uploadingAvatar ? "Uploading Photo..." : "Saving..."}</span>
                </>
              ) : (
                "Enroll Member"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ===================== EDIT MEMBER DIALOG =====================
interface EditMemberDialogProps {
  member: ClubMember | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: (updatedMember: ClubMember) => void;
  onError: (errorMsg: string) => void;
}

export function EditMemberDialog({
  member,
  open,
  onOpenChange,
  onSuccess,
  onError,
}: EditMemberDialogProps) {
  const departmentsList = typeof window !== "undefined"
    ? getSyncedData<Department[]>(STORAGE_KEYS.DEPARTMENTS, OFFICIAL_DEPARTMENTS)
    : OFFICIAL_DEPARTMENTS;

  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [countryCode, setCountryCode] = React.useState("+91");
  const [department, setDepartment] = React.useState("");
  const [year, setYear] = React.useState("1st Year");
  const [specialty, setSpecialty] = React.useState("");
  const [bio, setBio] = React.useState("");
  const [avatarUrl, setAvatarUrl] = React.useState("");
  const [instagram, setInstagram] = React.useState("");
  const [linkedin, setLinkedin] = React.useState("");

  const [selectedFile, setSelectedFile] = React.useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = React.useState<string | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [validationError, setValidationError] = React.useState<string | null>(null);

  const fileInputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (member) {
      setName(member.full_name || "");
      setEmail(member.email || "");
      setPhone(member.phone || "");
      setCountryCode("+91");
      setDepartment(member.department || departmentsList[0]?.name || "Management Department");
      setYear(member.year || "1st Year");
      setSpecialty(member.specialty || "");
      setBio(member.bio || "");
      setAvatarUrl(member.avatar_url || "");
      setPreviewUrl(member.avatar_url || null);
      setInstagram(member.socials?.instagram || "");
      setLinkedin(member.socials?.linkedin || "");
      setSelectedFile(null);
      setValidationError(null);
    }
  }, [member, departmentsList]);

  if (!member) return null;

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
      const dataUrl = await fileToOptimizedDataUrl(file);
      setPreviewUrl(dataUrl);
      setAvatarUrl(dataUrl);
    } catch {
      const fallbackUrl = URL.createObjectURL(file);
      setPreviewUrl(fallbackUrl);
      setAvatarUrl(fallbackUrl);
    }
  };

  const handleRemoveAvatar = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setAvatarUrl("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    if (!name.trim() || name.trim().length < 2) {
      setValidationError("Full name must be at least 2 characters.");
      return;
    }

    // Strict email domain validation
    const emailValidation = validateEmail(email);
    if (!emailValidation.valid) {
      setValidationError(emailValidation.error || "Please enter a valid official email address.");
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

    const formattedIg = formatInstagramUrl(instagram);
    const formattedLi = formatLinkedInUrl(linkedin);

    const updatedMemberObj: ClubMember = {
      ...member,
      full_name: name.trim(),
      email: emailValidation.normalizedEmail,
      phone: formattedPhone,
      department,
      year: year,
      role: member.role || "member",
      specialty: specialty.trim() || "Department Specialist",
      bio: bio.trim(),
      avatar_url: finalAvatarUrl,
      socials: {
        instagram: formattedIg || undefined,
        linkedin: formattedLi || undefined,
      },
    };

    // 1. Instantly update React state in table and cache
    onSuccess(updatedMemberObj);
    onOpenChange(false);
    setLoading(false);

    // 2. Persist to database in background
    try {
      await updateMemberAction(member.id, {
        full_name: name.trim(),
        email: emailValidation.normalizedEmail,
        phone: formattedPhone,
        department,
        year: year,
        role: member.role as any,
        specialty: specialty.trim(),
        bio: bio.trim(),
        avatar_url: finalAvatarUrl,
      });
    } catch (err) {
      console.warn("Background member update synced locally:", err);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto bg-[#0D0D0D] border border-white/10 rounded-3xl">
        <DialogHeader>
          <DialogTitle className="text-neutral-100 font-bold flex items-center gap-2">
            <Edit className="h-5 w-5 text-neutral-300" />
            <span>Edit Member Profile</span>
          </DialogTitle>
          <DialogDescription className="text-xs text-neutral-400">
            Modify details and assigned department for {member.full_name}.
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
            <label className="text-xs font-semibold block mb-1 text-neutral-300">Full Name</label>
            <Input value={name} onChange={(e) => setName(e.target.value)} required disabled={loading} className="text-xs rounded-2xl bg-black/60 border-white/10 text-neutral-200" />
          </div>

          <div>
            <label className="text-xs font-semibold block mb-1 text-neutral-300">Email</label>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required disabled={loading} className="text-xs rounded-2xl bg-black/60 border-white/10 text-neutral-200" />
          </div>

          <div>
            <label className="text-xs font-semibold block mb-1 text-neutral-300">Phone</label>
            <PhoneInput
              value={phone}
              onChange={setPhone}
              countryCode={countryCode}
              onCountryCodeChange={setCountryCode}
              disabled={loading}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold block mb-1 text-neutral-300">Department</label>
              <select
                className="flex h-10 w-full rounded-2xl border border-white/10 bg-black/60 px-3 py-2 text-xs text-neutral-200 focus-visible:outline-none"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                disabled={loading}
              >
                {departmentsList.map((d) => (
                  <option key={d.id} value={d.name}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold block mb-1 text-neutral-300">Academic Year</label>
              <select
                className="flex h-10 w-full rounded-2xl border border-white/10 bg-black/60 px-3 py-2 text-xs font-medium text-neutral-200 focus-visible:outline-none"
                value={year}
                onChange={(e) => setYear(e.target.value)}
                disabled={loading}
              >
                <option value="1st Year">1st Year</option>
                <option value="2nd Year">2nd Year</option>
                <option value="3rd Year">3rd Year</option>
                <option value="4th Year">4th Year</option>
              </select>
            </div>
          </div>

          {/* Social Links (Instagram & LinkedIn) */}
          <div className="p-3 rounded-2xl border border-white/[0.08] bg-white/[0.02] space-y-2.5">
            <span className="text-[11px] font-semibold text-neutral-300 block">Public Socials (Main Website)</span>
            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="text-[10px] font-medium text-neutral-400 block mb-0.5">Instagram</label>
                <Input
                  placeholder="@handle or URL"
                  value={instagram}
                  onChange={(e) => setInstagram(e.target.value)}
                  disabled={loading}
                  className="text-xs font-mono rounded-xl bg-black/60 border-white/10 text-neutral-200"
                />
              </div>
              <div>
                <label className="text-[10px] font-medium text-neutral-400 block mb-0.5">LinkedIn</label>
                <Input
                  placeholder="Profile URL"
                  value={linkedin}
                  onChange={(e) => setLinkedin(e.target.value)}
                  disabled={loading}
                  className="text-xs font-mono rounded-xl bg-black/60 border-white/10 text-neutral-200"
                />
              </div>
            </div>
          </div>

          {/* Photo / Avatar Upload Section */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold block text-neutral-300">Profile Photo</label>
            {previewUrl ? (
              <div className="relative rounded-2xl overflow-hidden border border-white/10 bg-white/[0.03] p-2.5 flex items-center gap-3">
                <div className="relative h-12 w-12 shrink-0 rounded-full overflow-hidden bg-neutral-900 border border-white/10 shadow-inner">
                  <Image src={previewUrl} alt="Avatar Preview" fill className="object-cover" />
                </div>
                <div className="flex-1 min-w-0 text-xs">
                  <div className="font-semibold text-neutral-200 truncate">
                    {selectedFile ? selectedFile.name : "Current Photo Attached"}
                  </div>
                  <div className="text-[11px] text-neutral-400">
                    {selectedFile ? "New file ready to upload" : "Stored in Supabase"}
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    className="h-8 px-2 text-[11px] rounded-full border-white/10 bg-white/[0.03] text-neutral-300 hover:text-white"
                    title="Replace Photo"
                  >
                    Replace
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleRemoveAvatar}
                    className="h-8 w-8 p-0 text-rose-400 hover:text-rose-300 rounded-full"
                    title="Remove Photo"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ) : (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border border-dashed border-white/15 hover:border-white/30 rounded-2xl p-3 text-center cursor-pointer transition-all bg-white/[0.02] hover:bg-white/[0.05] group flex items-center justify-center gap-2"
              >
                <Camera className="h-5 w-5 text-neutral-400 group-hover:text-neutral-200 transition-colors" />
                <span className="text-xs font-medium text-neutral-400 group-hover:text-neutral-200">
                  Upload / Change Photo (PNG, JPG, WebP max 5MB)
                </span>
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

          <div>
            <label className="text-xs font-semibold block mb-1 text-neutral-300">Role Designation / Specialty</label>
            <Input value={specialty} onChange={(e) => setSpecialty(e.target.value)} disabled={loading} className="text-xs rounded-2xl bg-black/60 border-white/10 text-neutral-200" />
          </div>

          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" size="sm" onClick={() => onOpenChange(false)} disabled={loading} className="rounded-full border-white/10 bg-white/[0.03] text-neutral-300 hover:text-white">
              Cancel
            </Button>
            <Button type="submit" variant="default" size="sm" disabled={loading} className="rounded-full font-semibold bg-[#E5E5E5] text-neutral-950 hover:bg-[#D4D4D4] shadow-sm">
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  <span>{uploadingAvatar ? "Uploading Photo..." : "Saving..."}</span>
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

// ===================== CHANGE ROLE DIALOG =====================
interface ChangeRoleDialogProps {
  member: ClubMember | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: (id: string, newRole: "admin" | "member" | "volunteer" | "super_admin") => void;
  onError: (errorMsg: string) => void;
}

export function ChangeRoleDialog({
  member,
  open,
  onOpenChange,
  onSuccess,
  onError,
}: ChangeRoleDialogProps) {
  const [selectedRole, setSelectedRole] = React.useState<UserRole>("member");
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    if (member) setSelectedRole((member.role as any) || "member");
  }, [member]);

  if (!member) return null;

  const isTargetSuperAdmin = isSuperAdminEmail(member.email);

  const handleSave = async () => {
    if (isTargetSuperAdmin) {
      onError("Super Admin (shvxamkumar@gmail.com) is permanent and cannot be modified.");
      return;
    }

    setLoading(true);
    // 1. Instant local store & credentials sync
    const { updateRegisteredUserRole } = await import("@/lib/auth/credentials-store");
    updateRegisteredUserRole(member.email, selectedRole);

    // 2. Instant UI update
    onSuccess(member.id, selectedRole);
    onOpenChange(false);
    setLoading(false);

    // 3. Background server action
    try {
      const { updateUserRoleAction } = await import("@/lib/actions/roles");
      await updateUserRoleAction(member.id, selectedRole, member.email);
    } catch (err) {
      console.warn("Background role action update:", err);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm bg-[#0D0D0D] border border-white/10 rounded-3xl">
        <DialogHeader>
          <DialogTitle className="text-neutral-100 font-bold flex items-center gap-2">
            <Shield className="h-5 w-5 text-neutral-300" />
            <span>Assign Role</span>
          </DialogTitle>
          <DialogDescription className="text-xs text-neutral-400">
            Assign portal access privileges for {member.full_name}.
          </DialogDescription>
        </DialogHeader>

        {isTargetSuperAdmin ? (
          <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs space-y-1.5 my-2">
            <div className="font-bold flex items-center gap-1.5 text-rose-200">
              <ShieldAlert className="h-4 w-4 text-rose-400" />
              <span>Protected Super Admin</span>
            </div>
            <p className="text-[11px] text-rose-300/80 leading-relaxed">
              {member.email} is the permanent and exclusive Super Admin of MALHAR and cannot be modified or demoted.
            </p>
          </div>
        ) : (
          <div className="space-y-2.5 py-3">
            {[
              {
                role: "member" as UserRole,
                title: "Official Member",
                desc: "Active department contributor. No administrative portal login access.",
              },
              {
                role: "admin" as UserRole,
                title: "Administrator",
                desc: "Designated Admin approved by Super Admin. Can register, set password, and manage society portal.",
              },
              {
                role: "volunteer" as UserRole,
                title: "Volunteer",
                desc: "Event volunteer and community contributor supporting society activities.",
              },
            ].map((item) => (
              <label
                key={item.role}
                onClick={() => setSelectedRole(item.role)}
                className={`flex items-start gap-3 p-3 rounded-2xl border cursor-pointer transition-all ${
                  selectedRole === item.role
                    ? "bg-white/[0.08] border-white/20 shadow-sm"
                    : "glass-panel border-white/[0.06] bg-black/40 hover:bg-white/[0.03]"
                }`}
              >
                <input
                  type="radio"
                  name="role"
                  checked={selectedRole === item.role}
                  onChange={() => setSelectedRole(item.role)}
                  className="mt-1 accent-white"
                />
                <div className="text-xs space-y-0.5">
                  <div className="font-semibold text-neutral-200">{item.title}</div>
                  <div className="text-[11px] text-neutral-400">{item.desc}</div>
                </div>
              </label>
            ))}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)} disabled={loading} className="rounded-full border-white/10 bg-white/[0.03] text-neutral-300 hover:text-white">
            {isTargetSuperAdmin ? "Close" : "Cancel"}
          </Button>
          {!isTargetSuperAdmin && (
            <Button variant="default" size="sm" onClick={handleSave} disabled={loading} className="rounded-full font-semibold bg-[#E5E5E5] text-neutral-950 hover:bg-[#D4D4D4] shadow-sm">
              {loading ? "Updating..." : "Save Role"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ===================== DELETE CONFIRMATION DIALOG =====================
interface DeleteConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  onConfirm: () => Promise<any>;
}

export function DeleteConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  onConfirm,
}: DeleteConfirmDialogProps) {
  const [loading, setLoading] = React.useState(false);

  const handleConfirm = async () => {
    setLoading(true);
    await onConfirm();
    setLoading(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm bg-[#0D0D0D] border border-white/10 rounded-3xl">
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
