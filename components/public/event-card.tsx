"use client";

import Link from "next/link";
import { Calendar, MapPin, ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { EventRegistrationModal } from "@/components/public/event-registration-modal";
import { ClubEvent } from "@/lib/mock-data";
import { getEffectiveEventStatus } from "@/lib/utils";

interface EventCardProps {
  event: ClubEvent;
}

function formatEventDate(dateString: string) {
  const d = new Date(dateString);
  return {
    date: d.toLocaleDateString("en-IN", {
      weekday: "short",
      day: "numeric",
      month: "short",
      year: "numeric",
    }),
    time: d.toLocaleTimeString("en-IN", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    }),
  };
}

export function EventCard({ event }: EventCardProps) {
  const effectiveStatus = getEffectiveEventStatus(event);
  const isPast = effectiveStatus === "completed";

  const isDeadlinePassed = event.registration_deadline
    ? new Date(event.registration_deadline).getTime() < Date.now()
    : false;

  const isClosed = isPast || isDeadlinePassed;

  const { date, time } = formatEventDate(event.date_time);

  // Status chip styling
  const statusChip = {
    upcoming: "border border-white/30 text-neutral-200 bg-transparent",
    ongoing: "bg-white text-neutral-950 border-transparent font-bold",
    completed: "bg-neutral-800 text-neutral-400 border-transparent",
  }[effectiveStatus] ?? "border border-white/20 text-neutral-300 bg-transparent";

  return (
    <article className="group flex flex-col bg-[#0D0D0D]/85 border border-white/[0.06] hover:border-white/[0.15] rounded-2xl overflow-hidden transition-all duration-300 hover:-translate-y-0.5 shadow-lg">

      {/* Poster — clean crop, no blurred backdrop */}
      <Link href={`/events/${event.id}`} className="block shrink-0">
        <div className="relative aspect-video w-full overflow-hidden bg-neutral-900">
          {event.poster_url ? (
            <img
              src={event.poster_url}
              alt={event.title}
              className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-neutral-700">
              <Calendar className="h-8 w-8" />
            </div>
          )}
          {/* Subtle top gradient for badge legibility */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-transparent pointer-events-none" />

          {/* Status + Category chips */}
          <div className="absolute top-3 left-3 flex items-center gap-2">
            <span className={`text-[10px] font-semibold px-2.5 py-0.5 rounded-full capitalize backdrop-blur-md ${statusChip}`}>
              {effectiveStatus === "completed" ? "Past" : effectiveStatus}
            </span>
            {event.category && (
              <span className="text-[10px] font-medium px-2.5 py-0.5 rounded-full bg-black/70 border border-white/10 text-neutral-300 backdrop-blur-md capitalize">
                {event.category}
              </span>
            )}
          </div>
        </div>
      </Link>

      {/* Card body */}
      <div className="flex flex-col flex-1 p-4 gap-3">

        {/* Title */}
        <Link href={`/events/${event.id}`}>
          <h3 className="text-base font-bold text-neutral-100 leading-snug line-clamp-2 group-hover:text-neutral-300 transition-colors">
            {event.title}
          </h3>
        </Link>

        {/* Meta: date + venue */}
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 text-[12px] text-neutral-400">
            <Calendar className="h-3.5 w-3.5 shrink-0 text-neutral-500" />
            <span>{date} &middot; {time}</span>
          </div>
          <div className="flex items-center gap-2 text-[12px] text-neutral-400">
            <MapPin className="h-3.5 w-3.5 shrink-0 text-neutral-500" />
            <span className="truncate">{event.venue}</span>
          </div>
        </div>

        {/* Short description */}
        {event.description && (
          <p className="text-[12px] text-neutral-500 leading-relaxed line-clamp-2">
            {event.description}
          </p>
        )}

        {/* CTA row — pushes to bottom */}
        <div className="mt-auto pt-2 border-t border-white/[0.06] flex items-center gap-2">
          {!isClosed ? (
            <div className="flex-1">
              <EventRegistrationModal event={event} />
            </div>
          ) : (
            <span className="flex-1 text-center text-[11px] text-neutral-600 font-medium py-2">
              {effectiveStatus === "completed" && new Date(event.date_time).getTime() < Date.now()
                ? "Event ended"
                : "Registration closed"}
            </span>
          )}
          <Link
            href={`/events/${event.id}`}
            className="inline-flex items-center gap-1 text-[11px] font-medium text-neutral-400 hover:text-neutral-200 transition-colors shrink-0 px-3 py-2 rounded-xl hover:bg-white/[0.04]"
          >
            <span>Details</span>
            <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      </div>
    </article>
  );
}
