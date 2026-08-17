"use client";

import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  Calendar,
  MapPin,
  Users,
  Clock,
  ArrowLeft,
  Trophy,
  ShieldAlert,
  Phone,
  Sparkles,
  CheckCircle,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CountdownTimer } from "@/components/public/countdown-timer";
import { EventRegistrationModal } from "@/components/public/event-registration-modal";
import { useEventById } from "@/lib/hooks/use-events";

export default function EventDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const eventId = params?.id || "event-1";
  const { event, loading } = useEventById(eventId);

  if (!event) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center space-y-4">
        <h2 className="text-2xl font-bold text-white">Event Not Found</h2>
        <p className="text-neutral-400 text-sm">
          The requested event could not be located.
        </p>
        <Button asChild variant="outline" className="rounded-full border-white/15 text-white">
          <Link href="/events">Return to Events Hub</Link>
        </Button>
      </div>
    );
  }

  const registered = event.registered_count || 0;
  const maxCap = event.max_capacity || 300;
  const capacityPercent = Math.min(100, Math.round((registered / maxCap) * 100));

  const isPast =
    event.status === "completed" ||
    new Date(event.date_time).getTime() < Date.now();
  const isFull = registered >= maxCap;
  const isDeadlinePassed = event.registration_deadline
    ? new Date(event.registration_deadline).getTime() < Date.now()
    : false;
  const isClosed = isPast || isDeadlinePassed;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      {/* Back Link */}
      <Link
        href="/events"
        className="inline-flex items-center gap-2 text-xs font-semibold text-neutral-400 hover:text-white transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        <span>Back to All Events</span>
      </Link>

      {/* Title & Badges Header */}
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <Badge variant={event.status as "upcoming" | "ongoing" | "completed"} className="capitalize text-xs">
            {event.status}
          </Badge>
          <span className="text-xs font-medium text-neutral-300 bg-white/[0.04] px-3 py-1 rounded-full border border-white/10">
            {event.category}
          </span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-extrabold text-neutral-100 leading-tight">
          {event.title}
        </h1>
      </div>

      {/* Hero Media & Poster Banner (Tall, Centered, object-contain, no cropped text) */}
      <div className="relative min-h-[320px] sm:min-h-[440px] max-h-[560px] w-full overflow-hidden rounded-3xl border border-white/[0.06] shadow-2xl bg-neutral-950 flex items-center justify-center p-3">
        {event.poster_url && (
          <img
            src={event.poster_url}
            alt=""
            aria-hidden="true"
            className="absolute inset-0 h-full w-full object-cover blur-2xl opacity-20 scale-110 pointer-events-none"
          />
        )}
        <img
          src={event.poster_url}
          alt={event.title}
          className="relative z-10 max-h-[500px] w-auto max-w-full object-contain object-center rounded-2xl shadow-xl"
        />
      </div>

      {/* Live Registration & Countdown Widget */}
      <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-white/[0.06] shadow-xl space-y-6 bg-[#0D0D0D]/75">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 border-b border-white/[0.06] pb-6">
          <div className="space-y-1 text-center md:text-left">
            <span className="text-xs font-semibold uppercase tracking-widest text-neutral-300">
              {isPast ? "Event Status" : "Live Countdown"}
            </span>
            <div className="pt-1">
              {isPast ? (
                <div className="text-sm font-semibold text-neutral-400 py-1">
                  This showcase has concluded.
                </div>
              ) : (
                <CountdownTimer targetDate={event.date_time} size="lg" label="" />
              )}
            </div>
          </div>

          <div className="w-full md:w-72 space-y-3">
            <EventRegistrationModal event={event} />
            <p className="text-[11px] text-center text-neutral-400">
              {isPast
                ? "This event has concluded. Registration is closed."
                : isDeadlinePassed
                ? "Registration portal closed for this session."
                : isFull
                ? "Max capacity reached. Registration is closed."
                : "Instant digital entry confirmation provided."}
            </p>
          </div>
        </div>

        {/* Capacity Progress Bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-medium text-neutral-300 flex items-center gap-1.5">
              <Users className="h-4 w-4 text-neutral-400" />
              Registration Capacity:
            </span>
            <span className="font-mono font-bold text-neutral-200">
              {registered} / {maxCap} Seats Filled ({capacityPercent}%)
            </span>
          </div>
          <div className="w-full h-3 bg-neutral-800 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${
                capacityPercent >= 90
                  ? "bg-rose-500"
                  : "bg-[#E5E5E5]"
              }`}
              style={{ width: `${capacityPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Main Content Grid: Logistics & Rules */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Cols: Description, Rules & Prizes */}
        <div className="lg:col-span-2 space-y-8">
          {/* Description */}
          <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-white/[0.06] space-y-3 bg-[#0D0D0D]/75">
            <h2 className="text-xl font-bold text-neutral-100">About the Event</h2>
            <p className="text-sm text-neutral-300 leading-relaxed">
              {event.description}
            </p>
          </div>

          {/* Official Rules */}
          {event.rules && event.rules.length > 0 && (
            <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-white/[0.06] space-y-4 bg-[#0D0D0D]/75">
              <h2 className="text-xl font-bold text-neutral-100 flex items-center gap-2">
                <ShieldAlert className="h-5 w-5 text-neutral-300" />
                <span>Guidelines & Rules</span>
              </h2>
              <ul className="space-y-2.5 text-xs sm:text-sm text-neutral-300">
                {event.rules.map((rule, idx) => (
                  <li key={idx} className="flex items-start gap-2.5">
                    <CheckCircle className="h-4 w-4 text-neutral-300 shrink-0 mt-0.5" />
                    <span>{rule}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Prize Pool */}
          {event.prizes && event.prizes.length > 0 && (
            <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-white/[0.06] space-y-4 bg-[#0D0D0D]/75">
              <h2 className="text-xl font-bold text-neutral-100 flex items-center gap-2">
                <Trophy className="h-5 w-5 text-neutral-300" />
                <span>Prize Pool & Honors</span>
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {event.prizes.map((prize, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-2xl bg-white/[0.03] border border-white/10 text-xs font-medium text-neutral-200"
                  >
                    🏆 {prize}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Col: Logistics Card & Coordinators */}
        <div className="space-y-6">
          <Card className="glass-panel border-white/[0.06] bg-[#0D0D0D]/75 rounded-3xl">
            <CardHeader>
              <CardTitle className="text-base font-bold text-neutral-100">Key Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-xs">
              <div className="flex items-start gap-3">
                <Calendar className="h-4 w-4 text-neutral-400 shrink-0 mt-0.5" />
                <div>
                  <span className="text-neutral-400 block text-[11px]">Date & Time</span>
                  <span className="font-semibold text-neutral-200">
                    {new Date(event.date_time).toLocaleString("en-IN", {
                      dateStyle: "full",
                      timeStyle: "short",
                    })}
                  </span>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <MapPin className="h-4 w-4 text-neutral-400 shrink-0 mt-0.5" />
                <div>
                  <span className="text-neutral-400 block text-[11px]">Venue</span>
                  <span className="font-semibold text-neutral-200">{event.venue}</span>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Clock className="h-4 w-4 text-neutral-400 shrink-0 mt-0.5" />
                <div>
                  <span className="text-neutral-400 block text-[11px]">Registration Closes</span>
                  <span className="font-semibold text-neutral-200">
                    {event.registration_deadline
                      ? new Date(event.registration_deadline).toLocaleString("en-IN", {
                          dateStyle: "medium",
                          timeStyle: "short",
                        })
                      : "Open until event day"}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>


          {/* Coordinators Contact */}
          {event.coordinators && event.coordinators.length > 0 && (
            <Card className="glass-panel border-white/[0.06] bg-[#0D0D0D]/75 rounded-3xl">
              <CardHeader>
                <CardTitle className="text-base font-bold text-neutral-100">Event Coordinators</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-xs">
                {event.coordinators.map((coord, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2.5 rounded-2xl bg-black/60 border border-white/10">
                    <span className="font-medium text-neutral-200">{coord.name}</span>
                    <a
                      href={`tel:${coord.phone}`}
                      className="text-neutral-300 hover:text-white flex items-center gap-1 font-mono text-[11px]"
                    >
                      <Phone className="h-3 w-3 text-neutral-400" />
                      <span>{coord.phone}</span>
                    </a>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>

  );
}
