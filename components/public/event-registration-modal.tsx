"use client";

import * as React from "react";
import Link from "next/link";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ClubEvent } from "@/lib/mock-data";
import { useAuth } from "@/lib/auth/auth-context";
import {
  registerForEventAction,
  checkUserRegistrationStatusAction,
  uploadPaymentScreenshotAction,
} from "@/lib/actions/registrations";
import {
  CheckCircle2,
  Ticket,
  AlertCircle,
  Loader2,
  Calendar,
  MapPin,
  Users,
  User,
  Plus,
  Trash2,
  Copy,
  Check,
  Upload,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  QrCode,
  Clock,
} from "lucide-react";
import { validateEmail } from "@/lib/validation/phone-email";
import { getEffectiveEventStatus } from "@/lib/utils";

interface TeamMemberItem {
  id: string;
  name: string;
  email: string;
  phone?: string;
  collegeId?: string;
}

interface EventRegistrationModalProps {
  event: ClubEvent;
  trigger?: React.ReactNode;
}

export function EventRegistrationModal({ event, trigger }: EventRegistrationModalProps) {
  const { user, loading: authLoading } = useAuth();

  const [open, setOpen] = React.useState(false);
  const [step, setStep] = React.useState<1 | 2 | 3>(1);

  // Registration Type (initialized and constrained by event.allowed_registration_type)
  const [rsvpType, setRsvpType] = React.useState<"individual" | "team">(
    event.allowed_registration_type === "team" ? "team" : "individual"
  );
  const [teamName, setTeamName] = React.useState("");

  // Applicant / Leader Info
  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [collegeId, setCollegeId] = React.useState("");
  const [department, setDepartment] = React.useState("CSE");
  const [year, setYear] = React.useState("1st Year");

  // Team Members (if team registration)
  const [teamMembers, setTeamMembers] = React.useState<TeamMemberItem[]>([]);

  // Custom Question & Options
  const [selectedOptions, setSelectedOptions] = React.useState<string[]>([]);
  const [customAnswer, setCustomAnswer] = React.useState("");

  // Payment State
  const [screenshotFile, setScreenshotFile] = React.useState<File | null>(null);
  const [screenshotPreview, setScreenshotPreview] = React.useState<string | null>(null);
  const [screenshotUrl, setScreenshotUrl] = React.useState<string | null>(null);
  const [uploadingScreenshot, setUploadingScreenshot] = React.useState(false);
  const [copiedUpi, setCopiedUpi] = React.useState(false);

  // Status
  const [isAlreadyRegistered, setIsAlreadyRegistered] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const [registrationCode, setRegistrationCode] = React.useState("");

  // Auto-reopen modal if returning from auth with ?register=eventId
  React.useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const params = new URLSearchParams(window.location.search);
      const registerId = params.get("register");
      if (registerId && registerId === event.id) {
        setOpen(true);
        const url = new URL(window.location.href);
        url.searchParams.delete("register");
        window.history.replaceState(null, "", url.pathname + (url.search ? url.search : ""));
      }
    } catch {}
  }, [event.id]);

  // Synchronize rsvpType when modal opens
  React.useEffect(() => {
    if (open) {
      if (event.allowed_registration_type === "team") {
        setRsvpType("team");
      } else if (event.allowed_registration_type === "individual") {
        setRsvpType("individual");
      }
    }
  }, [open, event.allowed_registration_type]);

  // Pre-fill Name & Email from authenticated user account
  React.useEffect(() => {
    const accountName = user?.fullName || (user as any)?.user_metadata?.full_name;
    if (accountName && !name) {
      setName(accountName);
    }
    if (user?.email && !email) {
      setEmail(user.email);
    }
  }, [user, name, email]);

  const [existingStatus, setExistingStatus] = React.useState<string>("pending");

  // Check if current user is already registered for this event
  React.useEffect(() => {
    let isMounted = true;

    async function verifyDbStatus() {
      // Check local device storage first for instant feedback
      try {
        if (typeof window !== "undefined") {
          const locallyStored = localStorage.getItem(`mirai_reg_${event.id}`);
          if (locallyStored && isMounted) {
            setIsAlreadyRegistered(true);
          }
        }
      } catch {}

      const checkEmail = user?.email || (typeof window !== "undefined" ? localStorage.getItem("mirai_last_registered_email") : null);
      if (!checkEmail && !user?.id) return;

      try {
        const res = await checkUserRegistrationStatusAction(
          event.id,
          checkEmail,
          user?.id
        );
        if (isMounted && res.registered) {
          setIsAlreadyRegistered(true);
          if (res.status) setExistingStatus(res.status);
          try {
            if (typeof window !== "undefined") {
              localStorage.setItem(`mirai_reg_${event.id}`, "true");
            }
          } catch {}
        }
      } catch {}
    }

    verifyDbStatus();

    return () => {
      isMounted = false;
    };
  }, [event.id, user?.email, user?.id]);

  const effectiveStatus = getEffectiveEventStatus(event);
  const isPast = effectiveStatus === "completed";
  const isDeadlinePassed = event.registration_deadline
    ? new Date(event.registration_deadline).getTime() < Date.now()
    : false;
  const isFull = (event.registered_count || 0) >= (event.max_capacity || 300);
  const isClosed = isPast || isDeadlinePassed;

  const isFreeEvent = event.is_free !== false;
  const currentFee =
    rsvpType === "team"
      ? (event.team_fee || event.ticket_price || 0)
      : (event.individual_fee || event.ticket_price || 0);

  const handleAddMember = () => {
    if (teamMembers.length >= 6) return;
    setTeamMembers((prev) => [
      ...prev,
      { id: `mem-${Date.now()}-${Math.random()}`, name: "", email: "", collegeId: "" },
    ]);
  };

  const handleUpdateMember = (id: string, field: keyof TeamMemberItem, val: string) => {
    setTeamMembers((prev) =>
      prev.map((m) => (m.id === id ? { ...m, [field]: val } : m))
    );
  };

  const handleRemoveMember = (id: string) => {
    setTeamMembers((prev) => prev.filter((m) => m.id !== id));
  };

  const toggleOption = (opt: string) => {
    setSelectedOptions((prev) =>
      prev.includes(opt) ? prev.filter((o) => o !== opt) : [...prev, opt]
    );
  };

  const handleCopyUpi = () => {
    const upi = event.payment_upi || "malharmirai01@okaxis";
    navigator.clipboard.writeText(upi);
    setCopiedUpi(true);
    setTimeout(() => setCopiedUpi(false), 2000);
  };

  const handleScreenshotChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setScreenshotFile(file);
    setScreenshotPreview(URL.createObjectURL(file));
    setErrorMessage(null);

    // Auto upload via server action to Supabase Storage media/payments
    setUploadingScreenshot(true);
    const fd = new FormData();
    fd.append("file", file);

    const uploadRes = await uploadPaymentScreenshotAction(fd);
    setUploadingScreenshot(false);

    if (uploadRes.success && uploadRes.data?.url) {
      setScreenshotUrl(uploadRes.data.url);
    } else {
      setErrorMessage(uploadRes.error || "Failed to upload payment receipt screenshot.");
    }
  };

  const handleProceedToStep2 = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!name.trim() || name.trim().length < 2) {
      setErrorMessage("Please enter your full name.");
      return;
    }

    const emailValidation = validateEmail(email);
    if (!emailValidation.valid) {
      setErrorMessage(emailValidation.error || "Please enter a valid email address.");
      return;
    }

    if (!collegeId.trim()) {
      setErrorMessage("Please enter your College ID or Roll Number.");
      return;
    }

    if (rsvpType === "team") {
      if (!teamName.trim()) {
        setErrorMessage("Please enter your team name.");
        return;
      }
      for (let i = 0; i < teamMembers.length; i++) {
        const member = teamMembers[i];
        if (!member.name.trim() || !member.email.trim()) {
          setErrorMessage(`Please fill out Name and Email for Team Member #${i + 1}.`);
          return;
        }
      }
    }

    if (event.ask_custom_question && !customAnswer.trim()) {
      setErrorMessage(`Please answer the required question: "${event.custom_question || "Custom question"}"`);
      return;
    }

    if (isFreeEvent || currentFee === 0) {
      // Free event: complete registration directly
      handleSubmitRegistration();
    } else {
      // Paid event: proceed to UPI payment step
      setStep(2);
    }
  };

  const handleSubmitRegistration = async () => {
    setSubmitting(true);
    setErrorMessage(null);

    try {
      const emailValidation = validateEmail(email);
      const res = await registerForEventAction({
        eventId: event.id,
        studentName: name.trim(),
        studentEmail: emailValidation.normalizedEmail,
        studentPhone: phone.trim() || null,
        userId: user?.id || null,
        collegeId: collegeId.trim(),
        department,
        year,
        registrationType: rsvpType,
        teamName: rsvpType === "team" ? teamName.trim() : null,
        leader: {
          name: name.trim(),
          email: emailValidation.normalizedEmail,
          phone: phone.trim() || undefined,
          collegeId: collegeId.trim(),
          year,
          branch: department,
        },
        teamMembers: rsvpType === "team" ? teamMembers : [],
        selectedOptions,
        customAnswer: customAnswer.trim() || null,
        paymentScreenshot: screenshotUrl || null,
      });

      if (!res.success) {
        const rawMsg = res.error || "";
        if (
          rawMsg.toLowerCase().includes("already registered") ||
          rawMsg.toLowerCase().includes("unique") ||
          rawMsg.toLowerCase().includes("duplicate") ||
          rawMsg.toLowerCase().includes("one registration")
        ) {
          setErrorMessage("You have already registered for this event. Each student may only register once.");
          setIsAlreadyRegistered(true);
        } else {
          setErrorMessage(rawMsg || "Failed to submit event registration. Please try again.");
        }
        return;
      }

      // Cache registration locally for instant feedback
      try {
        if (typeof window !== "undefined") {
          localStorage.setItem(`mirai_reg_${event.id}`, "true");
          localStorage.setItem("mirai_last_registered_email", emailValidation.normalizedEmail);
        }
      } catch {}

      setRegistrationCode(res.data?.ticket_code || `MIRAI-${Math.floor(100000 + Math.random() * 900000)}`);
      setIsAlreadyRegistered(true);
      setExistingStatus("pending");
      setStep(3); // Success Screen
    } catch (err: any) {
      setErrorMessage(err?.message || "Failed to submit event registration.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    setOpen(false);
    setStep(1);
    setErrorMessage(null);
  };

  // 1. Registered / Under Review state — strictly one registration per student
  if (isAlreadyRegistered) {
    const isApproved = existingStatus === "confirmed";
    const label = isApproved ? "Ticket Published • View Pass" : "Application Under Admin Review";
    const IconComponent = isApproved ? CheckCircle2 : Clock;
    const borderBg = isApproved
      ? "border-emerald-500/30 bg-emerald-950/40 text-emerald-400 hover:bg-emerald-900/40"
      : "border-amber-500/30 bg-amber-950/40 text-amber-300 hover:bg-amber-900/40";

    if (trigger) {
      return (
        <Link href="/my-tickets" className="w-full block">
          <Button
            variant="outline"
            className={`w-full rounded-full font-semibold text-xs ${borderBg} transition-all flex items-center justify-center gap-1.5 py-2.5 shadow-sm`}
          >
            <IconComponent className="h-4 w-4 shrink-0" />
            <span>{label}</span>
          </Button>
        </Link>
      );
    }
    return (
      <Link href="/my-tickets" className="w-full block">
        <Button
          variant="outline"
          className={`w-full rounded-full font-semibold text-xs ${borderBg} transition-all flex items-center justify-center gap-1.5 py-2.5 shadow-sm`}
        >
          <IconComponent className="h-4 w-4 shrink-0" />
          <span>{label}</span>
        </Button>
      </Link>
    );
  }

  // 2. Closed state
  if (isClosed) {
    if (trigger) {
      return <span className="opacity-50 pointer-events-none">{trigger}</span>;
    }
    return (
      <Button
        variant="outline"
        disabled
        className="w-full rounded-full font-semibold text-xs border-white/10 bg-black/60 text-neutral-500 cursor-not-allowed"
      >
        Registration Closed
      </Button>
    );
  }

  // 3. Full state
  if (isFull) {
    if (trigger) {
      return <span className="opacity-50 pointer-events-none">{trigger}</span>;
    }
    return (
      <Button
        variant="outline"
        disabled
        className="w-full rounded-full font-semibold text-xs border-white/10 bg-black/60 text-rose-400/80 cursor-not-allowed"
      >
        Capacity Full
      </Button>
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ? (
          trigger
        ) : (
          <Button
            variant="default"
            className="w-full shadow-sm rounded-full font-semibold bg-[#E5E5E5] text-neutral-950 hover:bg-[#D4D4D4] text-xs py-2.5"
          >
            Register for Event
          </Button>
        )}
      </DialogTrigger>

      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto rounded-3xl border border-white/[0.08] bg-[#0D0D0D]/95 backdrop-blur-2xl text-neutral-200 p-6 md:p-8 shadow-2xl">
        {!user && !authLoading ? (
          <div className="py-6 px-2 text-center space-y-6">
            <DialogHeader className="space-y-2 text-center">
              <div className="w-12 h-12 rounded-2xl bg-white/[0.04] border border-white/10 flex items-center justify-center mx-auto text-amber-400 mb-2">
                <Ticket className="w-6 h-6" />
              </div>
              <DialogTitle className="text-xl font-bold text-neutral-100">
                Log in or create an account to register
              </DialogTitle>
              <DialogDescription className="text-xs text-neutral-400 max-w-sm mx-auto leading-relaxed">
                Registration for <span className="text-neutral-200 font-semibold">&ldquo;{event.title}&rdquo;</span> requires an authenticated student account so your entry ticket pass and check-in QR code can be issued.
              </DialogDescription>
            </DialogHeader>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2 max-w-xs mx-auto">
              <Link
                href={`/login?redirectTo=${encodeURIComponent(`/events?register=${event.id}`)}`}
                className="w-full"
              >
                <Button className="w-full bg-neutral-100 text-neutral-950 hover:bg-white font-semibold text-xs h-10 rounded-xl">
                  Log In
                </Button>
              </Link>
              <Link
                href={`/login?mode=register&redirectTo=${encodeURIComponent(`/events?register=${event.id}`)}`}
                className="w-full"
              >
                <Button variant="outline" className="w-full border-white/15 text-neutral-200 hover:bg-white/5 font-semibold text-xs h-10 rounded-xl">
                  Sign Up
                </Button>
              </Link>
            </div>
          </div>
        ) : (
          <>
            {/* STEP 1: Attendee Details */}
            {step === 1 && (
              <div className="space-y-4">
                <DialogHeader className="space-y-1.5 text-left">
                  <div className="flex items-center justify-between">
                    <Badge variant="member" className="text-xs">
                      {event.category}
                    </Badge>
                    <span className="text-[11px] font-semibold text-neutral-400">
                      {isFreeEvent ? "Free Entry" : `₹${currentFee} Fee`}
                    </span>
                  </div>
                  <DialogTitle className="text-xl font-bold text-neutral-100">
                    {event.title}
                  </DialogTitle>
                  <DialogDescription className="text-xs text-neutral-400">
                    Reserve your verified digital pass for this official MALHAR showcase.
                  </DialogDescription>
                </DialogHeader>

            {errorMessage && (
              <div className="flex items-center gap-2 p-3 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
                <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Registration Type Selection (Respects event.allowed_registration_type) */}
            {event.allowed_registration_type === "individual" ? (
              <div className="flex items-center gap-2.5 p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300">
                <User className="h-4 w-4 shrink-0 text-amber-400" />
                <span>This event accepts <strong>Individual registrations only</strong>.</span>
              </div>
            ) : event.allowed_registration_type === "team" ? (
              <div className="flex items-center gap-2.5 p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300">
                <Users className="h-4 w-4 shrink-0 text-amber-400" />
                <span>This event is a <strong>Team competition</strong>. Please enter your team details and designate a Leader below.</span>
              </div>
            ) : (
              <div className="flex p-1 bg-black/60 rounded-2xl border border-white/10">
                <button
                  type="button"
                  onClick={() => setRsvpType("individual")}
                  className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                    rsvpType === "individual"
                      ? "bg-white text-neutral-950 shadow-sm"
                      : "text-neutral-400 hover:text-neutral-200"
                  }`}
                >
                  <User className="h-3.5 w-3.5" />
                  <span>Individual Attendee</span>
                </button>
                <button
                  type="button"
                  onClick={() => setRsvpType("team")}
                  className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                    rsvpType === "team"
                      ? "bg-white text-neutral-950 shadow-sm"
                      : "text-neutral-400 hover:text-neutral-200"
                  }`}
                >
                  <Users className="h-3.5 w-3.5" />
                  <span>Team / Group</span>
                </button>
              </div>
            )}

            <form onSubmit={handleProceedToStep2} className="space-y-3.5 pt-1">
              {rsvpType === "team" && (
                <div>
                  <label className="text-xs font-semibold text-neutral-300 block mb-1">
                    Team / Band / Crew Name *
                  </label>
                  <Input
                    placeholder="e.g. Mirai Raga Ensemble"
                    value={teamName}
                    onChange={(e) => setTeamName(e.target.value)}
                    required
                    className="text-xs rounded-2xl bg-black/60 border-white/10 text-neutral-200"
                  />
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-neutral-300 block mb-1">
                    {rsvpType === "team" ? "Team Leader Name *" : "Full Name *"}
                  </label>
                  <Input
                    placeholder="e.g. Rahul Sharma"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="text-xs rounded-2xl bg-black/60 border-white/10 text-neutral-200"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-neutral-300 block mb-1">
                    College Roll / ID No *
                  </label>
                  <Input
                    placeholder="e.g. 25MIRAI042"
                    value={collegeId}
                    onChange={(e) => setCollegeId(e.target.value)}
                    required
                    className="text-xs rounded-2xl bg-black/60 border-white/10 text-neutral-200"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-neutral-300 block mb-1">
                    Email Address *
                  </label>
                  <Input
                    type="email"
                    placeholder="student@mirai.edu"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    readOnly={!!user?.email}
                    required
                    className={`text-xs rounded-2xl bg-black/60 border-white/10 text-neutral-200 ${
                      user?.email ? "cursor-not-allowed opacity-80" : ""
                    }`}
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-neutral-300 block mb-1">
                    WhatsApp Phone (Optional)
                  </label>
                  <Input
                    type="tel"
                    placeholder="+91 98765 43210"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="text-xs rounded-2xl bg-black/60 border-white/10 text-neutral-200"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-neutral-300 block mb-1">Branch / Department</label>
                  <select
                    className="flex h-10 w-full rounded-2xl border border-white/10 bg-black/60 px-3 py-2 text-xs text-neutral-200 focus:outline-none"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                  >
                    <option value="CSE">Computer Science (CSE)</option>
                    <option value="ECE">Electronics (ECE)</option>
                    <option value="ME">Mechanical (ME)</option>
                    <option value="IT">Information Tech (IT)</option>
                    <option value="Design">Design & Media</option>
                    <option value="Management">Management</option>
                    <option value="Other">Other Branch</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-neutral-300 block mb-1">Year of Study</label>
                  <select
                    className="flex h-10 w-full rounded-2xl border border-white/10 bg-black/60 px-3 py-2 text-xs text-neutral-200 focus:outline-none"
                    value={year}
                    onChange={(e) => setYear(e.target.value)}
                  >
                    <option value="1st Year">1st Year (2025–29)</option>
                    <option value="2nd Year">2nd Year</option>
                    <option value="3rd Year">3rd Year</option>
                    <option value="4th Year">4th Year</option>
                  </select>
                </div>
              </div>

              {/* Dynamic Team Members Roster */}
              {rsvpType === "team" && (
                <div className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/10 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-xs font-bold text-neutral-200 block">Team Members</label>
                      <span className="text-[11px] text-neutral-400">Add up to 6 team partners.</span>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleAddMember}
                      disabled={teamMembers.length >= 6}
                      className="rounded-full text-xs h-7 px-3 border-white/15 bg-white/[0.04] text-neutral-200 hover:text-white"
                    >
                      <Plus className="h-3 w-3 mr-1" /> Add Member
                    </Button>
                  </div>

                  {teamMembers.map((member, idx) => (
                    <div key={member.id} className="p-2.5 rounded-xl bg-black/40 border border-white/5 space-y-2">
                      <div className="flex items-center justify-between text-[11px] font-semibold text-neutral-400">
                        <span>Member #{idx + 1}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveMember(member.id)}
                          className="text-rose-400 hover:text-rose-300"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        <Input
                          placeholder="Member Name *"
                          value={member.name}
                          onChange={(e) => handleUpdateMember(member.id, "name", e.target.value)}
                          required
                          className="text-xs h-8 rounded-xl bg-black/80 border-white/10"
                        />
                        <Input
                          type="email"
                          placeholder="Member Email *"
                          value={member.email}
                          onChange={(e) => handleUpdateMember(member.id, "email", e.target.value)}
                          required
                          className="text-xs h-8 rounded-xl bg-black/80 border-white/10"
                        />
                        <Input
                          placeholder="Roll No (Optional)"
                          value={member.collegeId || ""}
                          onChange={(e) => handleUpdateMember(member.id, "collegeId", e.target.value)}
                          className="text-xs h-8 rounded-xl bg-black/80 border-white/10"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Event Options / Tracks selection */}
              {Array.isArray(event.event_options) && event.event_options.length > 0 && (
                <div>
                  <label className="text-xs font-semibold text-neutral-300 block mb-1.5">
                    Select Event Track / Sub-category
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {event.event_options.map((opt) => {
                      const isSelected = selectedOptions.includes(opt);
                      return (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => toggleOption(opt)}
                          className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all border ${
                            isSelected
                              ? "bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-sm"
                              : "bg-white/[0.03] text-neutral-400 border-white/10 hover:text-neutral-200"
                          }`}
                        >
                          {opt}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Custom Question */}
              {event.ask_custom_question && (
                <div>
                  <label className="text-xs font-semibold text-neutral-300 block mb-1">
                    {event.custom_question || "Specific Question"} *
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Enter your response here..."
                    value={customAnswer}
                    onChange={(e) => setCustomAnswer(e.target.value)}
                    required
                    className="flex w-full rounded-2xl border border-white/10 bg-black/60 px-3 py-2 text-xs text-neutral-200 focus:outline-none"
                  />
                </div>
              )}

              <Button
                type="submit"
                variant="default"
                disabled={submitting}
                className="w-full mt-2 rounded-full font-semibold bg-[#E5E5E5] text-neutral-950 hover:bg-[#D4D4D4] shadow-sm flex items-center justify-center gap-1.5 py-2.5"
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Submitting Registration...</span>
                  </>
                ) : isFreeEvent || currentFee === 0 ? (
                  <>
                    <span>Confirm Free Registration</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </>
                ) : (
                  <>
                    <span>Proceed to UPI Payment (₹{currentFee})</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </>
                )}
              </Button>
            </form>
          </div>
        )}

        {/* STEP 2: Scan & Pay via UPI (Paid Events Only) */}
        {step === 2 && (
          <div className="space-y-4 text-center">
            <DialogHeader className="space-y-1.5 text-center">
              <Badge variant="member" className="mx-auto text-xs bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
                Official Club UPI Verification
              </Badge>
              <DialogTitle className="text-xl font-bold text-neutral-100">
                Scan &amp; Pay via UPI
              </DialogTitle>
              <DialogDescription className="text-xs text-neutral-400">
                Total Amount Due: <strong className="text-emerald-400 text-sm font-bold">₹{currentFee}</strong> ({rsvpType === "team" ? "Team Pass" : "Individual Entry"})
              </DialogDescription>
            </DialogHeader>

            {errorMessage && (
              <div className="flex items-center gap-2 p-3 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs text-left">
                <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* UPI QR Code Container */}
            <div className="p-4 bg-white rounded-3xl inline-block shadow-2xl border-2 border-white/20 mx-auto">
              {event.payment_qr_url ? (
                <img
                  src={event.payment_qr_url}
                  alt="Official UPI QR"
                  className="w-48 h-48 object-contain rounded-xl"
                />
              ) : (
                <div className="w-48 h-48 bg-neutral-900 rounded-xl flex flex-col items-center justify-center p-3 text-center border border-neutral-700">
                  <QrCode className="h-12 w-12 text-emerald-400 mb-2" />
                  <p className="text-[11px] font-bold text-white uppercase">Scan via any UPI app</p>
                  <p className="text-[10px] text-neutral-400 mt-1">GPay • PhonePe • Paytm</p>
                </div>
              )}
            </div>

            {/* UPI ID with Copy Button */}
            <div className="flex items-center justify-between p-3 rounded-2xl bg-black/60 border border-white/10 max-w-sm mx-auto">
              <div className="text-left">
                <span className="text-[10px] uppercase font-bold text-neutral-400 tracking-wider">UPI ID</span>
                <p className="font-mono text-xs font-semibold text-neutral-200">
                  {event.payment_upi || "malharmirai01@okaxis"}
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleCopyUpi}
                className="h-8 rounded-xl border-white/10 text-xs gap-1.5"
              >
                {copiedUpi ? (
                  <>
                    <Check className="h-3 w-3 text-emerald-400" />
                    <span className="text-emerald-400">Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3 w-3" />
                    <span>Copy</span>
                  </>
                )}
              </Button>
            </div>

            {/* Screenshot Upload Input */}
            <div className="text-left space-y-1.5 pt-1">
              <label className="text-xs font-bold text-neutral-300 block">
                Upload Payment Screenshot * <span className="text-neutral-500 font-normal">(Receipt / UTR details)</span>
              </label>
              
              <div className="relative border-2 border-dashed border-white/15 hover:border-white/30 rounded-2xl p-4 text-center cursor-pointer transition-all bg-white/[0.02]">
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={handleScreenshotChange}
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                />
                <Upload className="h-6 w-6 mx-auto text-neutral-400 mb-1" />
                <p className="text-xs font-semibold text-neutral-200">
                  {screenshotFile ? screenshotFile.name : "Click to select payment screenshot"}
                </p>
                <p className="text-[10px] text-neutral-500 mt-0.5">PNG, JPG or WebP up to 10MB</p>
              </div>

              {uploadingScreenshot && (
                <div className="flex items-center gap-2 text-xs text-amber-400 pt-1">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Uploading screenshot to Supabase Storage...</span>
                </div>
              )}

              {screenshotUrl && !uploadingScreenshot && (
                <div className="flex items-center gap-2 text-xs text-emerald-400 pt-1 font-semibold">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  <span>Screenshot uploaded and ready for submission.</span>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setStep(1)}
                disabled={submitting}
                className="flex-1 rounded-full border-white/10"
              >
                <ArrowLeft className="h-3.5 w-3.5 mr-1.5" />
                <span>Back</span>
              </Button>
              <Button
                type="button"
                variant="default"
                onClick={handleSubmitRegistration}
                disabled={submitting || uploadingScreenshot || !screenshotUrl}
                className="flex-1 rounded-full font-semibold bg-[#E5E5E5] text-neutral-950 hover:bg-[#D4D4D4] shadow-sm disabled:opacity-50"
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-1.5" />
                    <span>Verifying...</span>
                  </>
                ) : (
                  <span>Submit Application</span>
                )}
              </Button>
            </div>
          </div>
        )}

        {/* STEP 3: Success Confirmation Screen */}
        {step === 3 && (
          <div className="text-center py-4 space-y-5 animate-in zoom-in-95 duration-200">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Clock className="h-8 w-8" />
            </div>

            <div className="space-y-1">
              <h3 className="text-2xl font-bold text-neutral-100">
                Application Sent to Admin!
              </h3>
              <p className="text-xs text-neutral-400 max-w-sm mx-auto">
                Your registration has been received and is pending review by club administration. Once approved by the admin, your official digital entry ticket pass and QR code will be published in My Tickets.
              </p>
            </div>

            <div className="glass-panel p-5 rounded-3xl border border-white/15 text-left space-y-3 relative overflow-hidden bg-black/80">
              <div className="flex items-center justify-between border-b border-white/[0.06] pb-2.5">
                <div>
                  <div className="text-[10px] uppercase font-semibold tracking-widest text-neutral-400">Pass Code</div>
                  <div className="text-base font-bold font-mono text-neutral-100">{registrationCode}</div>
                </div>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-semibold border bg-amber-500/10 text-amber-300 border-amber-500/20">
                  Pending Admin Approval
                </span>
              </div>

              <div className="space-y-1 text-xs">
                <div className="font-bold text-neutral-100 text-sm">{event.title}</div>
                <div className="text-neutral-400 flex items-center gap-1.5 pt-1">
                  <Calendar className="h-3.5 w-3.5 text-neutral-400" />
                  {new Date(event.date_time).toLocaleDateString("en-IN", {
                    dateStyle: "medium",
                  })}
                </div>
                <div className="text-neutral-400 flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5 text-neutral-400" />
                  {event.venue}
                </div>
              </div>

              <div className="border-t border-white/[0.06] pt-2.5 flex items-center justify-between text-[11px] text-neutral-400">
                <span>Applicant: <strong className="text-neutral-200">{name}</strong></span>
                <span>Type: <strong className="text-neutral-300 uppercase">{rsvpType}</strong></span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-2 pt-2">
              <Button asChild variant="default" className="w-full rounded-full font-semibold bg-[#E5E5E5] text-neutral-950 hover:bg-[#D4D4D4] shadow-sm">
                <Link href="/my-tickets">
                  <span>Track Status in My Tickets</span>
                  <ArrowRight className="h-4 w-4 ml-1.5" />
                </Link>
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                className="w-full rounded-full border-white/10 text-neutral-300 hover:bg-white/[0.06]"
              >
                Close
              </Button>
            </div>
          </div>
        )}
        </>
      )}
      </DialogContent>
    </Dialog>
  );
}
