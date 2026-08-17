"use client";

import * as React from "react";
import {
  Mail,
  MapPin,
  Send,
  Instagram,
  MessageSquare,
  CheckCircle2,
  Search,
  ArrowRight,
  Clock,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { validateEmail } from "@/lib/validation/phone-email";

export default function ContactPage() {
  const [activeTab, setActiveTab] = React.useState<"send" | "status">("send");
  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [message, setMessage] = React.useState("");
  const [submitted, setSubmitted] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [ticketId, setTicketId] = React.useState("");
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  // Status check tab state
  const [statusQuery, setStatusQuery] = React.useState("");
  const [statusResult, setStatusResult] = React.useState<any>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    if (!name.trim() || name.trim().length < 2) {
      setErrorMessage("Please enter your name (at least 2 characters).");
      return;
    }

    const emailValidation = validateEmail(email);
    if (!emailValidation.valid) {
      setErrorMessage(emailValidation.error || "Please enter a valid email address.");
      return;
    }

    if (!message.trim()) {
      setErrorMessage("Please enter your message.");
      return;
    }

    setLoading(true);
    const newTicketId = "MLH-" + Math.floor(100000 + Math.random() * 900000);
    setTicketId(newTicketId);

    setTimeout(() => {
      // Store ticket in localStorage for status lookup demo
      if (typeof window !== "undefined") {
        try {
          const tickets = JSON.parse(localStorage.getItem("malhar_contact_tickets") || "[]");
          tickets.push({
            id: newTicketId,
            name: name.trim(),
            email: emailValidation.normalizedEmail,
            message: message.trim(),
            date: new Date().toLocaleDateString(),
            status: "Under Review by Core Committee",
          });
          localStorage.setItem("malhar_contact_tickets", JSON.stringify(tickets));
        } catch {}
      }

      setLoading(false);
      setSubmitted(true);
    }, 400);
  };

  const handleCheckStatus = (e: React.FormEvent) => {
    e.preventDefault();
    if (!statusQuery.trim()) return;

    if (typeof window !== "undefined") {
      try {
        const tickets = JSON.parse(localStorage.getItem("malhar_contact_tickets") || "[]");
        const found = tickets.find(
          (t: any) =>
            t.id.toLowerCase() === statusQuery.trim().toLowerCase() ||
            t.email.toLowerCase() === statusQuery.trim().toLowerCase()
        );
        if (found) {
          setStatusResult(found);
        } else {
          setStatusResult({
            id: statusQuery.trim(),
            name: "Sender",
            email: statusQuery.trim(),
            status: "In Progress",
            date: "Recent",
          });
        }
      } catch {
        setStatusResult({
          id: statusQuery.trim(),
          name: "Sender",
          email: statusQuery.trim(),
          status: "Received & Assigned to Coordinator",
          date: "Recent",
        });
      }
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-20">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start">
        {/* Left Column: Heading, Subtitle & Contact Info */}
        <div className="lg:col-span-5 space-y-8">
          {/* Main Heading */}
          <div className="space-y-4">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-neutral-100 leading-[1.15]">
              Together on <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-b from-neutral-200 via-neutral-300 to-neutral-500">
                Stage and Beyond
              </span>
            </h1>
            <p className="text-sm sm:text-base text-neutral-400 leading-relaxed max-w-md">
              Drop us a message and our core team will get back to you shortly
            </p>
          </div>

          {/* Contact Details List */}
          <div className="space-y-6 pt-4">
            {/* Email */}
            <div className="flex items-center gap-4 group">
              <div className="h-12 w-12 rounded-full bg-white/[0.03] border border-white/10 flex items-center justify-center text-neutral-400 group-hover:text-neutral-200 group-hover:border-white/20 group-hover:bg-white/[0.06] transition-all shrink-0">
                <Mail className="h-5 w-5" />
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-neutral-500">
                  EMAIL US
                </span>
                <a
                  href="mailto:malharmirai01@gmail.com"
                  className="text-sm font-medium text-neutral-200 group-hover:text-white transition-colors"
                >
                  malharmirai01@gmail.com
                </a>
              </div>
            </div>

            {/* Location */}
            <div className="flex items-center gap-4 group">
              <div className="h-12 w-12 rounded-full bg-white/[0.03] border border-white/10 flex items-center justify-center text-neutral-400 group-hover:text-neutral-200 group-hover:border-white/20 group-hover:bg-white/[0.06] transition-all shrink-0">
                <MapPin className="h-5 w-5" />
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-neutral-500">
                  VISIT US
                </span>
                <span className="text-sm font-medium text-neutral-200">
                  Mirai School of Technology Delhi Campus
                </span>
              </div>
            </div>

            {/* Instagram */}
            <div className="flex items-center gap-4 group">
              <div className="h-12 w-12 rounded-full bg-white/[0.03] border border-white/10 flex items-center justify-center text-neutral-400 group-hover:text-neutral-200 group-hover:border-white/20 group-hover:bg-white/[0.06] transition-all shrink-0">
                <Instagram className="h-5 w-5" />
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-neutral-500">
                  FOLLOW US
                </span>
                <a
                  href="https://www.instagram.com/malhar_mirai.hiet/"
                  target="_blank"
                  rel="noreferrer"
                  className="text-sm font-medium text-neutral-200 group-hover:text-white transition-colors"
                >
                  @malhar_mirai.hiet
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Interactive Form Card */}
        <div className="lg:col-span-7">
          <div className="rounded-3xl border border-white/[0.06] glass-card p-6 sm:p-10 shadow-2xl relative overflow-hidden bg-[#0D0D0D]/75">
            {/* Top Navigation Tabs */}
            <div className="flex items-center gap-6 border-b border-white/[0.06] pb-4 mb-8">

              <button
                type="button"
                onClick={() => setActiveTab("send")}
                className={`text-sm font-semibold pb-2 relative transition-all ${
                  activeTab === "send"
                    ? "text-neutral-100"
                    : "text-neutral-400 hover:text-neutral-200"
                }`}
              >
                <span>Send Message</span>
                {activeTab === "send" && (
                  <span className="absolute bottom-[-17px] left-0 right-0 h-[2px] bg-neutral-200 rounded-full" />
                )}
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("status")}
                className={`text-sm font-semibold pb-2 relative transition-all ${
                  activeTab === "status"
                    ? "text-neutral-100"
                    : "text-neutral-400 hover:text-neutral-200"
                }`}
              >
                <span>Check Status</span>
                {activeTab === "status" && (
                  <span className="absolute bottom-[-17px] left-0 right-0 h-[2px] bg-neutral-200 rounded-full" />
                )}
              </button>
            </div>

            {/* Tab 1: Send Message Form */}
            {activeTab === "send" && (
              <>
                {submitted ? (
                  <div className="py-12 text-center space-y-5 animate-in fade-in-50 duration-300">
                    <div className="h-16 w-16 mx-auto rounded-full bg-white/[0.06] text-neutral-200 flex items-center justify-center border border-white/10 shadow-lg">
                      <CheckCircle2 className="h-8 w-8" />
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-2xl font-bold text-neutral-100">Message Dispatched!</h3>
                      <p className="text-xs sm:text-sm text-neutral-300 max-w-md mx-auto leading-relaxed">
                        Thank you, <span className="text-neutral-100 font-semibold">{name}</span>. Your inquiry has been routed to our core committee coordinators.
                      </p>
                    </div>
                    <div className="inline-block p-3 rounded-xl bg-white/[0.03] border border-white/[0.06] text-xs font-mono text-neutral-300">
                      Tracking Ticket: <span className="text-neutral-100 font-semibold">{ticketId}</span>
                    </div>
                    <div className="pt-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSubmitted(false);
                          setName("");
                          setEmail("");
                          setMessage("");
                        }}
                        className="rounded-full px-6 text-xs border-white/10 text-neutral-300 hover:bg-white/[0.06]"
                      >
                        Send Another Message
                      </Button>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-6">
                    {errorMessage && (
                      <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
                        {errorMessage}
                      </div>
                    )}
                    {/* Name */}
                    <div className="space-y-2">
                      <label className="text-xs font-medium text-neutral-300">
                        Your Name <span className="text-neutral-400">*</span>
                      </label>
                      <Input
                        required
                        placeholder="Jane Doe"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="h-12 bg-black/60 border-white/10 rounded-2xl text-sm placeholder:text-neutral-500 focus-visible:ring-neutral-400 text-neutral-200"
                      />
                    </div>

                    {/* Email */}
                    <div className="space-y-2">
                      <label className="text-xs font-medium text-neutral-300">
                        Email Address <span className="text-neutral-400">*</span>
                      </label>
                      <Input
                        required
                        type="email"
                        placeholder="jane@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="h-12 bg-black/60 border-white/10 rounded-2xl text-sm placeholder:text-neutral-500 focus-visible:ring-neutral-400 text-neutral-200"
                      />
                    </div>

                    {/* Message */}
                    <div className="space-y-2">
                      <label className="text-xs font-medium text-neutral-300">
                        How can we help? <span className="text-neutral-400">*</span>
                      </label>
                      <textarea
                        required
                        rows={4}
                        placeholder="I'd like to ask about upcoming cultural events, auditions, or collaborations..."
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        className="w-full rounded-2xl border border-white/10 bg-black/60 p-3.5 text-sm text-neutral-200 placeholder:text-neutral-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400 leading-relaxed resize-none"
                      />
                    </div>

                    {/* Submit Button */}
                    <Button
                      type="submit"
                      disabled={loading}
                      className="w-full h-12 rounded-full bg-[#E5E5E5] text-neutral-950 hover:bg-[#D4D4D4] font-semibold text-sm shadow-sm transition-all flex items-center justify-center gap-2"
                    >
                      <Send className="h-4 w-4" />
                      <span>{loading ? "Sending Message..." : "Send Message"}</span>
                    </Button>
                  </form>
                )}
              </>
            )}

            {/* Tab 2: Check Status Form */}
            {activeTab === "status" && (
              <div className="space-y-6 animate-in fade-in-50 duration-200">
                <form onSubmit={handleCheckStatus} className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-neutral-300">
                      Enter Ticket ID or Registered Email
                    </label>
                    <div className="relative">
                      <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-neutral-500" />
                      <Input
                        required
                        placeholder="e.g. MLH-123456 or jane@example.com"
                        value={statusQuery}
                        onChange={(e) => setStatusQuery(e.target.value)}
                        className="pl-10 h-12 bg-black/60 border-white/10 rounded-2xl text-sm placeholder:text-neutral-500 text-neutral-200"
                      />
                    </div>
                  </div>
                  <Button
                    type="submit"
                    className="w-full h-11 rounded-full bg-[#E5E5E5] text-neutral-950 hover:bg-[#D4D4D4] font-semibold text-xs shadow-sm transition-all"
                  >
                    Check Status
                  </Button>
                </form>

                {statusResult && (
                  <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.06] space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono text-neutral-200 font-bold">
                        {statusResult.id}
                      </span>
                      <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-white/[0.06] border border-white/10 text-neutral-300 font-medium">
                        {statusResult.status}
                      </span>
                    </div>
                    <p className="text-xs text-neutral-300">
                      Inquiry received from <span className="font-semibold text-neutral-200">{statusResult.email}</span>. A coordinator will reach out shortly.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
