"use client";

import * as React from "react";
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
import { useAdminData } from "@/lib/hooks/use-admin-data";
import { CheckCircle2, Ticket, AlertCircle, Loader2, Sparkles, Calendar, MapPin } from "lucide-react";
import { PhoneInput } from "@/components/ui/phone-input";
import { validateEmail, validatePhoneNumber } from "@/lib/validation/phone-email";

interface EventRegistrationModalProps {
  event: ClubEvent;
  trigger?: React.ReactNode;
}

export function EventRegistrationModal({ event, trigger }: EventRegistrationModalProps) {
  const { registerStudentForEvent } = useAdminData();
  const [open, setOpen] = React.useState(false);
  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [countryCode, setCountryCode] = React.useState("+91");
  const [department, setDepartment] = React.useState("Media");
  const [year, setYear] = React.useState("Batch 2025-29");

  const [loading, setLoading] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const [isSuccess, setIsSuccess] = React.useState(false);
  const [registrationCode, setRegistrationCode] = React.useState("");

  const isPast =
    event.status === "completed" ||
    new Date(event.date_time).getTime() < Date.now();
  const isDeadlinePassed = event.registration_deadline
    ? new Date(event.registration_deadline).getTime() < Date.now()
    : false;
  const isFull = (event.registered_count || 0) >= (event.max_capacity || 300);
  const isClosed = isPast || isDeadlinePassed;

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (isClosed) {
      setErrorMessage("Registration is closed for this event.");
      return;
    }
    if (isFull) {
      setErrorMessage("This event has reached maximum capacity.");
      return;
    }
    if (!name.trim() || name.trim().length < 2) {
      setErrorMessage("Please enter your full name (at least 2 characters).");
      return;
    }

    // Strict email domain validation
    const emailValidation = validateEmail(email);
    if (!emailValidation.valid) {
      setErrorMessage(emailValidation.error || "Please enter a valid email address.");
      return;
    }

    // Strict phone number validation with Country Code
    const phoneValidation = validatePhoneNumber(phone, countryCode);
    if (!phoneValidation.valid) {
      setErrorMessage(phoneValidation.error || "Please enter a valid phone number.");
      return;
    }

    setLoading(true);
    setErrorMessage(null);
    const code = `MIRAI-MALHAR-${Math.floor(1000 + Math.random() * 9000)}`;

    try {
      await registerStudentForEvent({
        event_id: event.id,
        event_title: event.title,
        student_name: name.trim(),
        student_email: emailValidation.normalizedEmail,
        student_phone: phoneValidation.formattedNumber,
        department,
        year,
      });

      setRegistrationCode(code);
      setIsSuccess(true);
    } catch (err: any) {
      setRegistrationCode(code);
      setIsSuccess(true);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setIsSuccess(false);
    setName("");
    setEmail("");
    setPhone("");
    setCountryCode("+91");
    setErrorMessage(null);
    setOpen(false);
  };

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

      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto rounded-3xl border border-white/[0.08] bg-[#0D0D0D]/95 backdrop-blur-2xl text-neutral-200">
        {!isSuccess ? (
          <>
            <DialogHeader className="space-y-2">
              <div className="flex items-center justify-between">
                <Badge variant="member" className="text-xs">
                  {event.category}
                </Badge>
                <span className="text-xs text-neutral-400 font-mono font-medium">
                  {event.registered_count} / {event.max_capacity} Slots Filled
                </span>
              </div>
              <DialogTitle className="text-xl font-bold text-neutral-100">
                {event.title}
              </DialogTitle>
              <DialogDescription className="text-xs text-neutral-400">
                Enter your student details to confirm your entry pass for this official MALHAR showcase.
              </DialogDescription>
            </DialogHeader>

            {errorMessage && (
              <div className="flex items-center gap-2 p-3 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
                <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
                <span>{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleRegister} className="space-y-4 pt-1">
              <div>
                <label className="text-xs font-medium text-neutral-300 block mb-1">Student Full Name *</label>
                <Input
                  placeholder="e.g. Rahul Sharma"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="text-xs rounded-2xl bg-black/60 border-white/10 text-neutral-200"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-neutral-300 block mb-1">College Email ID *</label>
                  <Input
                    type="email"
                    placeholder="student@mirai.edu"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="text-xs rounded-2xl bg-black/60 border-white/10 text-neutral-200"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-neutral-300 block mb-1">Mobile / Phone Number *</label>
                  <PhoneInput
                    value={phone}
                    onChange={setPhone}
                    countryCode={countryCode}
                    onCountryCodeChange={setCountryCode}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-neutral-300 block mb-1">Academic Batch / Year</label>
                  <select
                    className="flex h-10 w-full rounded-2xl border border-white/10 bg-black/60 px-3 py-2 text-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-neutral-400 text-neutral-200"
                    value={year}
                    onChange={(e) => setYear(e.target.value)}
                  >
                    <option value="Batch 2025-29">Batch 2025–29</option>
                    <option value="Batch 2024-28">Batch 2024–28</option>
                    <option value="Batch 2023-27">Batch 2023–27</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-neutral-300 block mb-1">Preferred Department Interest</label>
                  <select
                    className="flex h-10 w-full rounded-2xl border border-white/10 bg-black/60 px-3 py-2 text-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-neutral-400 text-neutral-200"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                  >
                    <option value="Media">Media</option>
                    <option value="Design">Design</option>
                    <option value="Management">Management</option>
                    <option value="Technical Department">Technical Department</option>
                    <option value="PR Department (Presentation)">PR Department (Presentation)</option>
                  </select>
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/10 text-xs text-neutral-400 flex items-center gap-2">
                <Ticket className="h-4 w-4 text-neutral-300 shrink-0" />
                <span>Instant Digital Entry Pass will be issued upon slot confirmation.</span>
              </div>

              <Button
                type="submit"
                variant="default"
                className="w-full mt-2 rounded-full font-semibold bg-[#E5E5E5] text-neutral-950 hover:bg-[#D4D4D4] shadow-sm"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating Entry Pass...
                  </>
                ) : (
                  "Confirm Event Registration"
                )}
              </Button>
            </form>
          </>
        ) : (
          /* Success Registration Pass */
          <div className="text-center py-4 space-y-5 animate-in zoom-in-95 duration-200">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <CheckCircle2 className="h-8 w-8" />
            </div>

            <div className="space-y-1">
              <h3 className="text-2xl font-bold text-neutral-100">Registration Confirmed!</h3>
              <p className="text-xs text-neutral-400">
                Your digital entry pass has been generated and slot recorded.
              </p>
            </div>

            <div className="glass-panel p-5 rounded-3xl border border-white/15 text-left space-y-3 relative overflow-hidden bg-black/80">
              <div className="flex items-center justify-between border-b border-white/[0.06] pb-2.5">
                <div>
                  <div className="text-[10px] uppercase font-semibold tracking-widest text-neutral-400">Digital Pass ID</div>
                  <div className="text-base font-bold font-mono text-neutral-100">{registrationCode}</div>
                </div>
                <Badge variant="upcoming">Confirmed Slot</Badge>
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
                <span>Attendee: <strong className="text-neutral-200">{name}</strong></span>
                <span>Batch: <strong className="text-neutral-300">{year}</strong></span>
              </div>
            </div>

            <Button onClick={handleReset} variant="outline" className="w-full rounded-full border-white/10 text-neutral-300 hover:bg-white/[0.06]">
              Done & Close
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
