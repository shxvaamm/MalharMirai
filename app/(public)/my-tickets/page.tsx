"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { QRCodeCanvas } from "qrcode.react";
import * as htmlToImage from "html-to-image";
import {
  Ticket,
  QrCode,
  Download,
  CheckCircle2,
  AlertCircle,
  Clock,
  Calendar,
  MapPin,
  Users,
  User,
  Search,
  ArrowLeft,
  Loader2,
  X,
  Sparkles,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/lib/auth/auth-context";
import { getUserTicketsAction } from "@/lib/actions/registrations";
import { useToast } from "@/components/ui/toast";

export default function MyTicketsPage() {
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();

  const [tickets, setTickets] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [selectedTicket, setSelectedTicket] = React.useState<any | null>(null);
  const [downloading, setDownloading] = React.useState(false);

  // Guest search state
  const [searchQuery, setSearchQuery] = React.useState("");
  const [isSearching, setIsSearching] = React.useState(false);
  const [hasSearched, setHasSearched] = React.useState(false);

  const [mounted, setMounted] = React.useState(false);
  const ticketPassRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  // Fetch tickets for logged in user
  const fetchUserTickets = React.useCallback(async (emailToLookup?: string) => {
    setLoading(true);
    try {
      const targetEmail = emailToLookup || user?.email;
      const res = await getUserTicketsAction(targetEmail, user?.id);
      if (res.success && res.data) {
        setTickets(res.data);
      }
    } catch {
      toast({
        title: "Network Error",
        description: "Failed to load registered passes.",
      });
    } finally {
      setLoading(false);
    }
  }, [user, toast]);

  React.useEffect(() => {
    if (!authLoading) {
      if (user?.email) {
        fetchUserTickets();
      } else {
        setLoading(false);
      }
    }
  }, [user, authLoading, fetchUserTickets]);

  // Guest lookup handler
  const handleSearchTickets = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    setHasSearched(true);
    try {
      const res = await getUserTicketsAction(searchQuery.trim(), null);
      if (res.success && res.data) {
        setTickets(res.data);
      } else {
        setTickets([]);
      }
    } catch {
      toast({
        title: "Search Error",
        description: "Could not retrieve tickets for this query.",
      });
    } finally {
      setIsSearching(false);
    }
  };

  // 1-click High-Resolution PNG Pass Export
  const handleDownloadPNG = async () => {
    if (!ticketPassRef.current || !selectedTicket) return;

    setDownloading(true);
    try {
      const dataUrl = await htmlToImage.toPng(ticketPassRef.current, {
        pixelRatio: 3,
        cacheBust: true,
        backgroundColor: "#060B18",
      });

      const link = document.createElement("a");
      const safeTitle = (selectedTicket.events?.title || "Event")
        .replace(/[^a-zA-Z0-9_-]/g, "_")
        .toLowerCase();
      link.href = dataUrl;
      link.download = `MALHAR_Pass_${selectedTicket.ticket_code || selectedTicket.id.slice(0, 8)}_${safeTitle}.png`;
      link.click();

      toast({
        title: "Pass Saved!",
        description: "High-resolution digital entry pass downloaded to your device.",
      });
    } catch {
      toast({
        title: "Download Failed",
        description: "Could not export image pass. Please take a screenshot instead.",
      });
    } finally {
      setDownloading(false);
    }
  };

  const getOrigin = () => {
    if (typeof window !== "undefined") {
      return window.location.origin;
    }
    return "https://malharmirai.in";
  };

  return (
    <div className="min-h-screen pt-24 pb-20 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto space-y-8">
      {/* Top Breadcrumb & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/[0.06] pb-6">
        <div>
          <Link
            href="/events"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-neutral-400 hover:text-white transition-colors mb-2"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Back to Events Hub</span>
          </Link>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-neutral-100 flex items-center gap-3">
            <span>My Digital</span>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-amber-400 to-amber-500">
              Passes &amp; Tickets
            </span>
          </h1>
          <p className="text-xs text-neutral-400 mt-1 max-w-xl">
            Access your verified entry QR passes, monitor UPI verification status, and download high-resolution passes for on-site scanning.
          </p>
        </div>

        {/* Quick Stats or CTA */}
        <div className="flex items-center gap-2">
          <Button asChild variant="outline" size="sm" className="rounded-full text-xs border-white/10">
            <Link href="/events">Explore More Events</Link>
          </Button>
        </div>
      </div>

      {/* Guest Lookup Banner (if not logged in or looking up another email) */}
      {mounted && !user && (
        <div className="glass-panel p-5 sm:p-6 rounded-3xl border border-white/10 bg-[#0D0D0D]/80 shadow-xl space-y-3">
          <div className="flex items-center gap-2 text-neutral-200 text-xs font-bold">
            <Search className="h-4 w-4 text-amber-400" />
            <span>Find Tickets by Email Address</span>
          </div>
          <form onSubmit={handleSearchTickets} className="flex flex-col sm:flex-row gap-2.5">
            <Input
              type="email"
              placeholder="Enter your registration email (e.g. student@mirai.edu)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              required
              className="text-xs rounded-2xl bg-black/60 border-white/15 text-neutral-200 flex-1"
            />
            <Button
              type="submit"
              disabled={isSearching}
              className="rounded-full font-semibold bg-[#E5E5E5] text-neutral-950 hover:bg-[#D4D4D4] text-xs px-6"
            >
              {isSearching ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : null}
              <span>Look Up Passes</span>
            </Button>
          </form>
        </div>
      )}

      {/* Tickets List View */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center space-y-3">
          <Loader2 className="h-8 w-8 animate-spin text-amber-400" />
          <p className="text-xs text-neutral-400 font-medium">Loading your entry passes...</p>
        </div>
      ) : tickets.length === 0 ? (
        <div className="text-center py-16 px-4 glass-panel rounded-3xl border border-white/[0.06] bg-[#0D0D0D]/60 max-w-md mx-auto space-y-4">
          <div className="h-14 w-14 rounded-full bg-white/[0.04] border border-white/10 flex items-center justify-center mx-auto text-neutral-400">
            <Ticket className="h-6 w-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-neutral-100">No Registrations Found</h3>
            <p className="text-xs text-neutral-400">
              {hasSearched
                ? "No event passes are linked to this email address. Make sure to use the exact email entered during registration."
                : "You haven't registered for any upcoming cultural events yet."}
            </p>
          </div>
          <Button asChild variant="default" size="sm" className="rounded-full font-semibold bg-[#E5E5E5] text-neutral-950 hover:bg-[#D4D4D4] text-xs">
            <Link href="/events">Browse Events Hub</Link>
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tickets.map((t) => {
            const isConfirmed = t.status === "confirmed";
            const isRejected = t.status === "rejected";
            const isPending = !isConfirmed && !isRejected;

            return (
              <div
                key={t.id}
                className="glass-panel border border-white/10 bg-[#0D0D0D]/80 rounded-3xl p-6 flex flex-col justify-between shadow-xl relative overflow-hidden transition-all hover:border-white/20"
              >
                {/* Status Accent Stripe */}
                <div
                  className={`absolute top-0 left-0 right-0 h-1.5 ${
                    isConfirmed
                      ? "bg-emerald-500"
                      : isRejected
                      ? "bg-rose-500"
                      : "bg-amber-400"
                  }`}
                />

                <div className="space-y-4">
                  {/* Top Badges */}
                  <div className="flex items-center justify-between">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
                        isConfirmed
                          ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                          : isRejected
                          ? "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                          : "bg-amber-500/10 text-amber-300 border border-amber-500/20"
                      }`}
                    >
                      {isConfirmed ? "Confirmed Entry" : isRejected ? "Rejected" : "Verification Pending"}
                    </span>

                    <span className="font-mono text-[10px] font-bold text-neutral-400">
                      {t.ticket_code || `#${t.id.slice(0, 8)}`}
                    </span>
                  </div>

                  {/* Event & Applicant Details */}
                  <div>
                    <h3 className="font-bold text-lg text-neutral-100 line-clamp-1">
                      {t.events?.title || "Cultural Showcase"}
                    </h3>
                    <p className="text-xs text-neutral-400 mt-1 flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5 text-neutral-500" />
                      <span>
                        {t.events?.date_time
                          ? new Date(t.events.date_time).toLocaleDateString("en-IN", {
                              dateStyle: "medium",
                            })
                          : "TBA"}
                      </span>
                    </p>
                    <p className="text-xs text-neutral-400 flex items-center gap-1.5 mt-0.5">
                      <MapPin className="h-3.5 w-3.5 text-neutral-500" />
                      <span>{t.events?.venue || "Campus Auditorium"}</span>
                    </p>
                  </div>

                  {/* Attendee / Team details */}
                  <div className="p-3 rounded-2xl bg-white/[0.02] border border-white/5 text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-neutral-500 text-[11px] uppercase font-bold">
                        {t.registration_type === "team" ? "Team / Group" : "Attendee"}
                      </span>
                      <span className="uppercase font-mono text-[10px] text-neutral-400 font-bold">
                        {t.registration_type || "Solo"}
                      </span>
                    </div>
                    <div className="font-semibold text-neutral-200">
                      {t.registration_type === "team" ? t.team_name : t.student_name}
                    </div>
                    {t.registration_type === "team" && t.student_name && (
                      <div className="text-[11px] text-neutral-400">
                        Lead: {t.student_name}
                      </div>
                    )}
                  </div>

                  {/* Rejection Alert Box */}
                  {isRejected && (
                    <div className="p-3 rounded-2xl bg-rose-950/30 border border-rose-500/30 text-rose-300 text-xs space-y-1">
                      <div className="flex items-center gap-1.5 font-bold text-[11px]">
                        <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                        <span>Reason for Declination:</span>
                      </div>
                      <p className="text-[11px] text-rose-300/80 leading-relaxed">
                        {t.issue_reason || "Payment could not be verified by admin."}
                      </p>
                    </div>
                  )}

                  {/* Pending Alert Box */}
                  {isPending && (
                    <div className="p-3 rounded-2xl bg-amber-950/30 border border-amber-500/20 text-amber-300 text-xs space-y-1">
                      <div className="flex items-center gap-1.5 font-bold text-[11px]">
                        <Clock className="h-3.5 w-3.5 shrink-0" />
                        <span>Pending Admin Approval</span>
                      </div>
                      <p className="text-[11px] text-amber-300/80 leading-relaxed">
                        Your application is under review by club administration. Your official entry pass and dynamic QR code will be published here as soon as it is approved.
                      </p>
                    </div>
                  )}
                </div>

                {/* Bottom Card Action */}
                <div className="pt-6">
                  {isConfirmed ? (
                    <Button
                      onClick={() => setSelectedTicket(t)}
                      className="w-full rounded-2xl font-semibold bg-[#E5E5E5] text-neutral-950 hover:bg-[#D4D4D4] text-xs py-2.5 shadow-sm flex items-center justify-center gap-2"
                    >
                      <QrCode className="h-4 w-4" />
                      <span>View Digital Pass &amp; QR</span>
                    </Button>
                  ) : (
                    <Button
                      disabled
                      variant="outline"
                      className="w-full rounded-2xl border-white/10 text-neutral-500 text-xs py-2.5 cursor-not-allowed flex items-center justify-center gap-1.5"
                    >
                      <Clock className="h-3.5 w-3.5 text-neutral-500" />
                      <span>{isPending ? "Pass Pending Admin Approval" : "Registration Voided"}</span>
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ============================================================== */}
      {/* DIGITAL PASS MODAL (Perforated Cultural Pass with Dynamic QR) */}
      {/* ============================================================== */}
      {selectedTicket && (
        <div
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-xl flex items-center justify-center p-4 overflow-y-auto"
          onClick={() => setSelectedTicket(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="flex flex-col items-center max-w-sm w-full my-auto animate-in zoom-in-95 duration-200"
          >
            {/* The Perforated Ticket Card Container */}
            <div
              ref={ticketPassRef}
              className="w-full bg-[#060B18] border border-amber-500/30 rounded-[2.5rem] shadow-2xl relative overflow-hidden text-neutral-100 p-6 flex flex-col items-center"
              style={{
                backgroundImage:
                  "radial-gradient(ellipse at 50% -20%, rgba(229, 169, 60, 0.15), transparent 70%)",
              }}
            >
              {/* Gold Cultural Society Badge Header */}
              <div className="flex items-center justify-between w-full border-b border-white/10 pb-3 mb-4">
                <div className="flex items-center gap-2">
                  <div className="h-7 w-7 rounded-full bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
                    <Sparkles className="h-3.5 w-3.5" />
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-extrabold tracking-widest text-amber-400 block">
                      MALHAR • MIRAI
                    </span>
                    <span className="text-[9px] text-neutral-400 block -mt-0.5">
                      Cultural Society Entry Pass
                    </span>
                  </div>
                </div>

                <Badge variant="upcoming" className="text-[9px] bg-emerald-500/10 text-emerald-400 border-emerald-500/30">
                  Verified Entry
                </Badge>
              </div>

              {/* Event Name & Category */}
              <div className="text-center space-y-1 mb-4">
                <span className="text-[10px] font-mono uppercase tracking-widest text-neutral-400">
                  {selectedTicket.events?.category || "Official Showcase"}
                </span>
                <h2 className="text-xl font-extrabold text-white leading-snug line-clamp-2">
                  {selectedTicket.events?.title}
                </h2>
              </div>

              {/* Dynamic QR Code on Crisp High-Contrast White Background */}
              <div className="bg-white p-3.5 rounded-3xl inline-block shadow-2xl border-2 border-amber-400/30 my-2">
                <QRCodeCanvas
                  value={`${getOrigin()}/verify/${selectedTicket.id}`}
                  size={160}
                  level="H"
                  includeMargin={false}
                />
              </div>

              <div className="text-center space-y-0.5 mt-2 mb-4">
                <p className="font-mono text-[10px] uppercase tracking-widest text-neutral-400">
                  Scan at Entry Gate
                </p>
                <p className="font-mono text-xs font-bold text-amber-400">
                  {selectedTicket.ticket_code || `#${selectedTicket.id.slice(0, 10).toUpperCase()}`}
                </p>
              </div>

              {/* Perforation Divider Line with Scalloped Cutouts */}
              <div className="relative w-full my-3">
                <div className="border-t-2 border-dashed border-white/15 w-full" />
                {/* Left Cutout */}
                <div className="absolute -left-9 -top-3 h-6 w-6 rounded-full bg-black/90 border-r border-amber-500/30" />
                {/* Right Cutout */}
                <div className="absolute -right-9 -top-3 h-6 w-6 rounded-full bg-black/90 border-l border-amber-500/30" />
              </div>

              {/* Attendee & Event Metadata */}
              <div className="w-full text-left space-y-2 pt-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-neutral-400 text-[11px]">Attendee</span>
                  <span className="font-bold text-neutral-100 text-right">
                    {selectedTicket.registration_type === "team"
                      ? selectedTicket.team_name
                      : selectedTicket.student_name}
                  </span>
                </div>

                {selectedTicket.registration_type === "team" && (
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-neutral-400">Team Leader</span>
                    <span className="font-semibold text-neutral-200">
                      {selectedTicket.student_name}
                    </span>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <span className="text-neutral-400 text-[11px]">Date &amp; Time</span>
                  <span className="font-semibold text-neutral-200">
                    {selectedTicket.events?.date_time
                      ? new Date(selectedTicket.events.date_time).toLocaleDateString("en-IN", {
                          dateStyle: "medium",
                        })
                      : "Campus Fest"}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-neutral-400 text-[11px]">Venue</span>
                  <span className="font-semibold text-neutral-200 text-right">
                    {selectedTicket.events?.venue || "Auditorium"}
                  </span>
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center gap-3 mt-6 w-full">
              <Button
                onClick={handleDownloadPNG}
                disabled={downloading}
                className="flex-1 rounded-full font-semibold bg-[#E5E5E5] text-neutral-950 hover:bg-[#D4D4D4] text-xs py-2.5 shadow-lg flex items-center justify-center gap-2"
              >
                {downloading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Download className="h-4 w-4" />
                )}
                <span>{downloading ? "Exporting..." : "Download PNG Pass"}</span>
              </Button>

              <Button
                variant="outline"
                onClick={() => setSelectedTicket(null)}
                className="rounded-full border-white/10 text-neutral-300 hover:text-white text-xs px-5"
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
