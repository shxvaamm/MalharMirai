"use client";

import * as React from "react";
import Link from "next/link";
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  Calendar,
  MapPin,
  User,
  Users,
  ShieldCheck,
  ShieldAlert,
  Loader2,
  ArrowLeft,
  Sparkles,
  Ticket,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { verifyTicketAction, checkInTicketAction } from "@/lib/actions/registrations";
import { useToast } from "@/components/ui/toast";

export default function TicketVerifyPage({
  params,
}: {
  params: { id: string };
}) {
  const ticketId = params?.id;
  const { toast } = useToast();

  const [ticket, setTicket] = React.useState<any | null>(null);
  const [eventData, setEventData] = React.useState<any | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [checkingIn, setCheckingIn] = React.useState(false);
  const [checkedInAt, setCheckedInAt] = React.useState<string | null>(null);

  React.useEffect(() => {
    async function loadTicket() {
      if (!ticketId) {
        setError("Invalid QR verification URL.");
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);
      try {
        const res = await verifyTicketAction(ticketId);
        if (res.success && res.data) {
          setTicket(res.data.ticket);
          setEventData(res.data.event);
          setCheckedInAt(res.data.ticket.checked_in_at || null);
        } else {
          setError(res.error || "Ticket not found in the official registry.");
        }
      } catch {
        setError("Network failure while verifying entry pass.");
      } finally {
        setLoading(false);
      }
    }

    loadTicket();
  }, [ticketId]);

  const handleCheckIn = async () => {
    if (!ticket) return;

    setCheckingIn(true);
    try {
      const res = await checkInTicketAction(ticket.id);
      if (res.success) {
        setCheckedInAt(new Date().toISOString());
        toast({
          title: "Attendee Checked In!",
          description: "Entry recorded in gate audit ledger.",
        });
      } else {
        toast({
          title: "Check-in Error",
          description: res.error || "Failed to record entry.",
        });
      }
    } catch {
      toast({
        title: "Check-in Error",
        description: "Failed to record entry.",
      });
    } finally {
      setCheckingIn(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen pt-28 pb-20 px-4 flex flex-col items-center justify-center space-y-4">
        <Loader2 className="h-10 w-10 animate-spin text-amber-400" />
        <p className="text-sm font-semibold text-neutral-300">
          Verifying security pass with official registry...
        </p>
      </div>
    );
  }

  if (error || !ticket) {
    return (
      <div className="min-h-screen pt-28 pb-20 px-4 flex items-center justify-center">
        <div className="max-w-md w-full glass-panel border border-rose-500/30 bg-[#0D0D0D]/90 rounded-3xl p-8 text-center space-y-6 shadow-2xl">
          <div className="h-20 w-20 rounded-full bg-rose-500/10 border border-rose-500/30 flex items-center justify-center mx-auto text-rose-400">
            <XCircle className="h-10 w-10" />
          </div>

          <div className="space-y-2">
            <h1 className="text-2xl font-extrabold text-rose-400">
              INVALID TICKET
            </h1>
            <p className="text-xs text-neutral-400 leading-relaxed">
              {error || "This QR code does not belong to any confirmed registration in the MALHAR database."}
            </p>
          </div>

          <div className="p-3.5 rounded-2xl bg-black/60 border border-white/5 font-mono text-xs text-neutral-400">
            Lookup Code: <span className="text-white font-bold">{ticketId}</span>
          </div>

          <div className="flex flex-col gap-2 pt-2">
            <Button asChild variant="default" className="rounded-full font-semibold bg-[#E5E5E5] text-neutral-950 hover:bg-[#D4D4D4] text-xs">
              <Link href="/">Return to Home</Link>
            </Button>
            <Button asChild variant="outline" className="rounded-full border-white/10 text-xs">
              <Link href="/my-tickets">Find My Passes</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const isConfirmed = ticket.status === "confirmed";
  const isRejected = ticket.status === "rejected";
  const isPending = !isConfirmed && !isRejected;

  return (
    <div className="min-h-screen pt-24 pb-20 px-4 sm:px-6 flex flex-col items-center justify-center">
      <div className="max-w-lg w-full glass-panel border border-white/10 bg-[#0D0D0D]/95 rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Top Status Header Banner */}
        <div
          className={`p-8 text-center text-white ${
            isConfirmed
              ? checkedInAt
                ? "bg-gradient-to-b from-amber-600 to-amber-700"
                : "bg-gradient-to-b from-emerald-600 to-emerald-700"
              : isRejected
              ? "bg-gradient-to-b from-rose-600 to-rose-700"
              : "bg-gradient-to-b from-amber-500 to-amber-600"
          }`}
        >
          {isConfirmed ? (
            checkedInAt ? (
              <>
                <div className="h-16 w-16 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center mx-auto mb-3 shadow-inner">
                  <ShieldCheck className="h-9 w-9 text-white" />
                </div>
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                  ALREADY CHECKED IN
                </h1>
                <p className="text-xs opacity-90 mt-1 font-medium">
                  Entry confirmed at {new Date(checkedInAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                </p>
              </>
            ) : (
              <>
                <div className="h-16 w-16 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center mx-auto mb-3 shadow-inner animate-pulse">
                  <CheckCircle2 className="h-9 w-9 text-white" />
                </div>
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                  VALID ENTRY PASS
                </h1>
                <p className="text-xs opacity-90 mt-1 font-medium">
                  Ticket Verified • Admit Attendee
                </p>
              </>
            )
          ) : isRejected ? (
            <>
              <div className="h-16 w-16 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center mx-auto mb-3 shadow-inner">
                <XCircle className="h-9 w-9 text-white" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                ENTRY VOIDED / REJECTED
              </h1>
              <p className="text-xs opacity-90 mt-1 font-medium">
                Application was declined by admin
              </p>
            </>
          ) : (
            <>
              <div className="h-16 w-16 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center mx-auto mb-3 shadow-inner">
                <Clock className="h-9 w-9 text-white" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                PENDING VERIFICATION
              </h1>
              <p className="text-xs opacity-90 mt-1 font-medium">
                Awaiting admin audit of payment receipt
              </p>
            </>
          )}
        </div>

        {/* Content Details */}
        <div className="p-6 sm:p-8 space-y-6">
          {/* Attendee / Team Header */}
          <div className="flex items-center gap-4 pb-5 border-b border-white/[0.06]">
            <div className="h-14 w-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shrink-0">
              {ticket.registration_type === "team" ? (
                <Users className="h-7 w-7" />
              ) : (
                <User className="h-7 w-7" />
              )}
            </div>

            <div className="min-w-0 flex-1">
              <span className="text-[10px] uppercase font-bold tracking-wider text-neutral-400 block">
                {ticket.registration_type === "team" ? "Team / Group" : "Individual Attendee"}
              </span>
              <h2 className="text-lg sm:text-xl font-bold text-neutral-100 truncate">
                {ticket.registration_type === "team" ? ticket.team_name : ticket.student_name}
              </h2>
              {ticket.registration_type === "team" && ticket.student_name && (
                <p className="text-xs text-neutral-400 truncate">
                  Team Leader: {ticket.student_name}
                </p>
              )}
            </div>
          </div>

          {/* Event Information */}
          <div className="space-y-2">
            <span className="text-[10px] uppercase font-bold tracking-wider text-neutral-500 block">
              Event Details
            </span>
            <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 space-y-1.5 text-xs">
              <h3 className="font-bold text-sm text-neutral-100">
                {eventData?.title || ticket.events?.title || "Cultural Fest Event"}
              </h3>
              <p className="text-neutral-400 flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 text-neutral-500" />
                <span>
                  {eventData?.date_time
                    ? new Date(eventData.date_time).toLocaleDateString("en-IN", {
                        dateStyle: "medium",
                      })
                    : "Event Date TBA"}
                </span>
              </p>
              <p className="text-neutral-400 flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5 text-neutral-500" />
                <span>{eventData?.venue || "Main Auditorium"}</span>
              </p>
            </div>
          </div>

          {/* Team Members List (if applicable) */}
          {ticket.registration_type === "team" && Array.isArray(ticket.team_members) && ticket.team_members.length > 0 && (
            <div className="space-y-2">
              <span className="text-[10px] uppercase font-bold tracking-wider text-neutral-500 block">
                Team Roster ({ticket.team_members.length + 1} Attendees)
              </span>
              <div className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/5 space-y-2 text-xs max-h-40 overflow-y-auto custom-scrollbar">
                <div className="flex items-center justify-between pb-1.5 border-b border-white/5 font-semibold text-neutral-200">
                  <span>1. {ticket.student_name} (Leader)</span>
                  <span className="text-neutral-400 font-mono text-[11px]">{ticket.college_id || "Lead"}</span>
                </div>
                {ticket.team_members.map((m: any, idx: number) => (
                  <div key={idx} className="flex items-center justify-between text-neutral-300">
                    <span>{idx + 2}. {m.name}</span>
                    <span className="text-neutral-400 font-mono text-[11px]">{m.collegeId || m.email}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Verification Audit Log & Pass IDs */}
          <div className="p-4 rounded-2xl bg-black/60 border border-white/5 space-y-1.5 text-[11px] text-neutral-400">
            <div className="flex justify-between">
              <span>Ticket Code:</span>
              <span className="font-mono font-bold text-amber-400">
                {ticket.ticket_code || `#${ticket.id.slice(0, 10).toUpperCase()}`}
              </span>
            </div>
            <div className="flex justify-between">
              <span>College ID:</span>
              <span className="font-mono text-neutral-200">{ticket.college_id || "N/A"}</span>
            </div>
            <div className="flex justify-between">
              <span>Email:</span>
              <span className="text-neutral-300">{ticket.student_email}</span>
            </div>
            <div className="flex justify-between">
              <span>Registered At:</span>
              <span>{new Date(ticket.created_at).toLocaleString("en-IN")}</span>
            </div>
            {checkedInAt && (
              <div className="flex justify-between text-emerald-400 font-semibold pt-1 border-t border-white/5">
                <span>Gate Check-In:</span>
                <span>{new Date(checkedInAt).toLocaleTimeString("en-IN")}</span>
              </div>
            )}
          </div>

          {/* Action Buttons for Gate Security */}
          <div className="space-y-2 pt-1">
            {isConfirmed && !checkedInAt && (
              <Button
                onClick={handleCheckIn}
                disabled={checkingIn}
                className="w-full rounded-full font-bold bg-emerald-500 hover:bg-emerald-600 text-white text-xs py-3 shadow-lg flex items-center justify-center gap-2"
              >
                {checkingIn ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Check className="h-4 w-4 stroke-[3]" />
                )}
                <span>Admit Attendee / Mark Checked In</span>
              </Button>
            )}

            <Button asChild variant="outline" className="w-full rounded-full border-white/10 text-xs">
              <Link href="/">Return to Site</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
