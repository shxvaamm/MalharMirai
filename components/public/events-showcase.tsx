"use client";

import * as React from "react";
import Link from "next/link";
import { Calendar, ArrowRight, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EventCard } from "@/components/public/event-card";
import { useEvents } from "@/lib/hooks/use-events";

export function EventsShowcase() {
  const { events, loading, error } = useEvents("all", "upcoming");
  const upcomingEvents = events.slice(0, 3);

  return (
    <section className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full space-y-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl sm:text-4xl font-black tracking-tight text-neutral-100">
            Upcoming <span className="text-transparent bg-clip-text bg-gradient-to-b from-neutral-200 via-neutral-300 to-neutral-500">Events</span>
          </h2>
        </div>

        <Button asChild variant="outline" size="sm" className="rounded-full border-white/10 text-neutral-300 hover:bg-white/[0.06]">
          <Link href="/events" className="flex items-center gap-1.5">
            <span>View All Events</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>

      </div>

      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="glass-panel border-border/40 rounded-2xl p-6 h-80 animate-pulse bg-card/40" />
          ))}
        </div>
      )}

      {error && !loading && (
        <div className="p-4 rounded-xl bg-rose-950/20 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2">
          <AlertCircle className="h-4 w-4 text-rose-400" />
          <span>Failed to load live events. Showing offline schedule.</span>
        </div>
      )}

      {!loading && upcomingEvents.length === 0 && (
        <div className="p-8 rounded-xl glass-panel text-center text-muted-foreground text-xs">
          No upcoming events scheduled right now. Check back soon!
        </div>
      )}

      {!loading && upcomingEvents.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {upcomingEvents.map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>
      )}
    </section>
  );
}
