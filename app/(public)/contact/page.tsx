"use client";

import * as React from "react";
import {
  Mail,
  MapPin,
  Send,
  Instagram,
  CheckCircle2,
  SquareTerminal,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { validateEmail } from "@/lib/validation/phone-email";

export default function ContactPage() {
  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [message, setMessage] = React.useState("");
  const [submitted, setSubmitted] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

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

    setTimeout(() => {
      setLoading(false);
      setSubmitted(true);
    }, 400);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-20">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-start">
        {/* Left Column: Heading, Description & Contact Details */}
        <div className="lg:col-span-5 space-y-7 sm:space-y-8">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/10 bg-white/[0.03] text-[11px] font-semibold tracking-wider text-neutral-400 uppercase">
            <SquareTerminal className="h-3.5 w-3.5 text-neutral-400" />
            <span>CONTACT US</span>
          </div>

          {/* Headline */}
          <div className="space-y-4">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-neutral-100 leading-[1.12]">
              Let&apos;s create <br />
              <span className="text-[#629584] sm:text-[#6db298]">
                something great.
              </span>
            </h1>
            <p className="text-sm sm:text-base text-neutral-400 leading-relaxed max-w-md">
              Have a question about our events? Want to propose a workshop, performance, or discuss a collaboration? Drop us a message and our core team will get back to you shortly.
            </p>
          </div>

          {/* Contact Details List */}
          <div className="space-y-5 pt-2">
            {/* Email */}
            <div className="flex items-center gap-4 group">
              <div className="h-11 w-11 rounded-full bg-white/[0.03] border border-white/10 flex items-center justify-center text-neutral-400 group-hover:text-neutral-200 group-hover:border-white/20 group-hover:bg-white/[0.06] transition-all shrink-0">
                <Mail className="h-4 w-4" />
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

            {/* Visit Us */}
            <div className="flex items-center gap-4 group">
              <div className="h-11 w-11 rounded-full bg-white/[0.03] border border-white/10 flex items-center justify-center text-neutral-400 group-hover:text-neutral-200 group-hover:border-white/20 group-hover:bg-white/[0.06] transition-all shrink-0">
                <MapPin className="h-4 w-4" />
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-neutral-500">
                  VISIT US
                </span>
                <span className="text-sm font-medium text-neutral-200">
                  mirai hitech, ghaziabad
                </span>
              </div>
            </div>

            {/* Follow Us */}
            <div className="flex items-center gap-4 group">
              <div className="h-11 w-11 rounded-full bg-white/[0.03] border border-white/10 flex items-center justify-center text-neutral-400 group-hover:text-neutral-200 group-hover:border-white/20 group-hover:bg-white/[0.06] transition-all shrink-0">
                <Instagram className="h-4 w-4" />
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

        {/* Right Column: Contact Form Card */}
        <div className="lg:col-span-7">
          <div className="rounded-3xl border border-white/[0.08] bg-[#0E1311]/85 backdrop-blur-xl p-6 sm:p-8 md:p-10 shadow-2xl relative overflow-hidden">
            {/* Top subtle highlight glow */}
            <div className="absolute top-0 left-8 right-8 h-[2px] bg-gradient-to-r from-transparent via-[#629584]/60 to-transparent pointer-events-none" />

            {/* Form Header */}
            <div className="border-b border-white/[0.06] pb-4 mb-7">
              <span className="text-sm font-semibold text-[#629584] sm:text-[#6db298] tracking-wide inline-flex items-center gap-2">
                Send Message
              </span>
            </div>

            {submitted ? (
              <div className="py-10 text-center space-y-5 animate-in fade-in-50 duration-300">
                <div className="h-16 w-16 mx-auto rounded-full bg-[#629584]/15 text-[#6db298] flex items-center justify-center border border-[#629584]/30 shadow-lg">
                  <CheckCircle2 className="h-8 w-8" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-2xl font-bold text-neutral-100">Message Dispatched!</h3>
                  <p className="text-xs sm:text-sm text-neutral-300 max-w-md mx-auto leading-relaxed">
                    Thank you, <span className="text-neutral-100 font-semibold">{name}</span>. Your inquiry has been routed to our core committee coordinators.
                  </p>
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
              <form onSubmit={handleSubmit} className="space-y-5">
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
                    className="h-12 bg-[#141A17]/80 border-white/10 rounded-xl sm:rounded-2xl text-sm placeholder:text-neutral-500 focus-visible:ring-[#629584]/40 focus-visible:border-[#629584]/60 text-neutral-200"
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
                    className="h-12 bg-[#141A17]/80 border-white/10 rounded-xl sm:rounded-2xl text-sm placeholder:text-neutral-500 focus-visible:ring-[#629584]/40 focus-visible:border-[#629584]/60 text-neutral-200"
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
                    className="w-full rounded-xl sm:rounded-2xl border border-white/10 bg-[#141A17]/80 p-3.5 text-sm text-neutral-200 placeholder:text-neutral-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#629584]/40 focus-visible:border-[#629584]/60 leading-relaxed resize-none"
                  />
                </div>

                {/* Submit Button */}
                <div className="pt-2">
                  <Button
                    type="submit"
                    disabled={loading}
                    className="w-full h-12 rounded-full sm:rounded-2xl bg-[#487363] hover:bg-[#3f6556] text-white font-medium text-sm shadow-md transition-all flex items-center justify-center gap-2 border border-[#629584]/30"
                  >
                    <Send className="h-4 w-4" />
                    <span>{loading ? "Sending Message..." : "Send Message"}</span>
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
