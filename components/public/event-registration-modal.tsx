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
import { useAuth } from "@/lib/auth/auth-context";
import { registerForEventAction, checkUserRegistrationStatusAction } from "@/lib/actions/registrations";
import { CheckCircle2, Ticket, AlertCircle, Loader2, Calendar, MapPin } from "lucide-react";
import { validateEmail } from "@/lib/validation/phone-email";
import { getEffectiveEventStatus } from "@/lib/utils";

interface EventRegistrationModalProps {
  event: ClubEvent;
  trigger?: React.ReactNode;
}

export function EventRegistrationModal({ event, trigger }: EventRegistrationModalProps) {
  const { user } = useAuth();

  const [open, setOpen] = React.useState(false);
  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");

  const [isAlreadyRegistered, setIsAlreadyRegistered] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const [isSuccess, setIsSuccess] = React.useState(false);
  const [registrationCode, setRegistrationCode] = React.useState("");

  // Pre-fill Name & Email from authenticated user account
  React.useEffect(() => {
    if (user?.fullName && !name) {
      setName(user.fullName);
    }
    if (user?.email && !email) {
      setEmail(user.email);
    }
  }, [user]);

  // Check if current user is already registered for this event directly from Supabase
  React.useEffect(() => {
    let isMounted = true;

    async function verifyDbStatus() {
      if (!user?.email && !user?.id) return;
      try {
        const res = await checkUserRegistrationStatusAction(
          event.id,
          user?.email,
          user?.id
        );
        if (isMounted && res.registered) {
          setIsAlreadyRegistered(true);
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

    setLoading(true);
    setErrorMessage(null);
    const code = `MIRAI-MALHAR-${Math.floor(1000 + Math.random() * 9000)}`;

    try {
      const res = await registerForEventAction({
        eventId: event.id,
        studentName: name.trim(),
        studentEmail: emailValidation.normalizedEmail,
        studentPhone: null,
        userId: user?.id || null,
        department: null,
        year: null,
      });

      if (!res.success) {
        const rawMsg = res.error || "";
        if (
          rawMsg.toLowerCase().includes("already registered") ||
          rawMsg.toLowerCase().includes("unique") ||
          rawMsg.toLowerCase().includes("duplicate") ||
          rawMsg.includes("23505")
        ) {
          setErrorMessage("You're already registered for this event.");
          setIsAlreadyRegistered(true);
        } else {
          setErrorMessage(rawMsg || "Failed to submit event registration. Please try again.");
        }
        return;
      }

      setRegistrationCode(code);
      setIsSuccess(true);
      setIsAlreadyRegistered(true);
    } catch (err: any) {
      setErrorMessage(err?.message || "Failed to submit event registration. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setIsSuccess(false);
    setErrorMessage(null);
    setOpen(false);
  };

  // 1. Registered Successfully state — no re-register option
  if (isAlreadyRegistered) {
    if (trigger) {
      return (
        <Button
          variant="outline"
          disabled
          className="w-full rounded-full font-semibold text-xs border-emerald-500/30 bg-emerald-950/40 text-emerald-400 opacity-100 cursor-default flex items-center justify-center gap-1.5"
        >
          <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
          <span>Registered Successfully</span>
        </Button>
      );
    }
    return (
      <Button
        variant="outline"
        disabled
        className="w-full rounded-full font-semibold text-xs border-emerald-500/30 bg-emerald-950/40 text-emerald-400 opacity-100 cursor-default flex items-center justify-center gap-1.5 py-2.5"
      >
        <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
        <span>Registered Successfully</span>
      </Button>
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

  // 3. Full state — server-enforced, NO numbers exposed
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

  // 4. Registration form trigger & modal
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
              </div>
              <DialogTitle className="text-xl font-bold text-neutral-100">
                {event.title}
              </DialogTitle>
              <DialogDescription className="text-xs text-neutral-400">
                Confirm your student details below to reserve your entry pass for this official MALHAR showcase.
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

              <div>
                <label className="text-xs font-medium text-neutral-300 block mb-1">
                  College Email ID * {user?.email && <span className="text-neutral-500 text-[10px] font-normal">(Linked to your account)</span>}
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

              <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/10 text-xs text-neutral-400 flex items-center gap-2">
                <Ticket className="h-4 w-4 text-neutral-300 shrink-0" />
                <span>One registration per student. Digital pass issued immediately.</span>
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
                    Confirming Registration...
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
              <h3 className="text-2xl font-bold text-neutral-100">Registered Successfully!</h3>
              <p className="text-xs text-neutral-400">
                Your entry pass has been confirmed and registered in Supabase.
              </p>
            </div>

            <div className="glass-panel p-5 rounded-3xl border border-white/15 text-left space-y-3 relative overflow-hidden bg-black/80">
              <div className="flex items-center justify-between border-b border-white/[0.06] pb-2.5">
                <div>
                  <div className="text-[10px] uppercase font-semibold tracking-widest text-neutral-400">Pass ID</div>
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
                <span>Email: <strong className="text-neutral-300">{email}</strong></span>
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
