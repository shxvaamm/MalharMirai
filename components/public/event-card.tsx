"use client";

import Link from "next/link";
import { Calendar, MapPin, Users, ArrowRight, Sparkles, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { CountdownTimer } from "@/components/public/countdown-timer";
import { EventRegistrationModal } from "@/components/public/event-registration-modal";
import { ClubEvent } from "@/lib/mock-data";

interface EventCardProps {
  event: ClubEvent;
  showCountdown?: boolean;
}

export function EventCard({ event, showCountdown = true }: EventCardProps) {
  const registeredCount = event.registered_count || 0;
  const maxCapacity = event.max_capacity || 300;
  const capacityPercent = Math.min(
    100,
    Math.round((registeredCount / maxCapacity) * 100)
  );

  const hasUpcomingCountdown =
    showCountdown &&
    event.status === "upcoming" &&
    new Date(event.date_time).getTime() > Date.now();

  return (
    <Card className="glass-card border border-white/[0.06] hover:border-white/20 flex flex-col justify-between transition-all duration-300 hover:-translate-y-1 shadow-xl group bg-[#0D0D0D]/90 rounded-3xl overflow-hidden">
      <div>
        {/* Poster Header Section: Tall, centered, object-contain */}
        <div className="relative h-72 sm:h-80 w-full overflow-hidden rounded-t-3xl bg-neutral-950 flex items-center justify-center p-2 border-b border-white/[0.06]">
          {/* Ambient blurred backdrop for seamless fit */}
          {event.poster_url && (
            <img
              src={event.poster_url}
              alt=""
              aria-hidden="true"
              className="absolute inset-0 h-full w-full object-cover blur-2xl opacity-20 scale-110 pointer-events-none"
            />
          )}

          {/* Fully visible, uncropped poster */}
          <img
            src={event.poster_url}
            alt={event.title}
            className="relative z-10 max-h-full max-w-full object-contain object-center rounded-2xl transition-transform duration-500 group-hover:scale-[1.02]"
            loading="lazy"
          />
        </div>

        {/* Badges & Status Strip (Positioned clearly below the poster, preventing any text overlap) */}
        <div className="px-5 pt-4 flex items-center justify-between gap-2">
          <Badge variant={event.status as "upcoming" | "ongoing" | "completed"} className="capitalize text-xs font-semibold">
            {event.status}
          </Badge>
          <span className="text-[11px] font-medium text-neutral-300 bg-white/[0.04] px-2.5 py-0.5 rounded-full border border-white/10">
            {event.category}
          </span>
        </div>

        {/* Optional Live Countdown Bar (Cleanly separated from poster) */}
        {hasUpcomingCountdown && (
          <div className="px-5 pt-2.5">
            <div className="flex items-center gap-2 p-2 rounded-2xl bg-white/[0.03] border border-white/[0.06]">
              <Clock className="h-3.5 w-3.5 text-neutral-400 shrink-0 ml-1" />
              <CountdownTimer targetDate={event.date_time} size="sm" />
            </div>
          </div>
        )}

        <CardHeader className="pt-3 pb-2 px-5">
          <CardTitle className="text-lg sm:text-xl font-bold leading-snug text-neutral-100 group-hover:text-neutral-200 transition-colors">
            <Link href={`/events/${event.id}`}>{event.title}</Link>
          </CardTitle>
          <CardDescription className="text-xs text-neutral-400 line-clamp-2 mt-1 leading-relaxed">
            {event.description}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-3 pt-1 px-5 text-xs text-neutral-400">
          <div className="flex items-center gap-2">
            <Calendar className="h-3.5 w-3.5 text-neutral-400 shrink-0" />
            <span className="text-neutral-300 font-medium">
              {new Date(event.date_time).toLocaleDateString("en-IN", {
                weekday: "short",
                day: "numeric",
                month: "short",
                year: "numeric",
                hour: "numeric",
                minute: "2-digit",
              })}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <MapPin className="h-3.5 w-3.5 text-neutral-400 shrink-0" />
            <span className="truncate text-neutral-300">{event.venue}</span>
          </div>

          {/* Dynamic Registration Progress Bar */}
          <div className="pt-1 space-y-1">
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-neutral-400 flex items-center gap-1">
                <Users className="h-3 w-3 text-neutral-400" /> Slots Booked:
              </span>
              <span className="font-semibold text-neutral-200 font-mono">
                {registeredCount} / {maxCapacity} ({capacityPercent}%)
              </span>
            </div>
            <div className="w-full h-1.5 bg-neutral-800 rounded-full overflow-hidden">
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
        </CardContent>
      </div>

      <CardFooter className="pt-3 border-t border-white/[0.06] flex items-center gap-2 p-5">
        <Button asChild variant="outline" size="sm" className="flex-1 text-xs rounded-full border-white/10 text-neutral-300 hover:bg-white/[0.06] hover:border-white/20">
          <Link href={`/events/${event.id}`} className="flex items-center justify-center gap-1">
            <span>Details</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </Button>
        <div className="flex-1">
          <EventRegistrationModal event={event} />
        </div>
      </CardFooter>
    </Card>
  );
}
