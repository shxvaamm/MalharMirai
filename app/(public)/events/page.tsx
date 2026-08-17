"use client";

import * as React from "react";
import { Search, Calendar, AlertCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

import { EventCard } from "@/components/public/event-card";
import { useEvents } from "@/lib/hooks/use-events";

export default function EventsPage() {
  const [statusTab, setStatusTab] = React.useState<string>("all");
  const [searchQuery, setSearchQuery] = React.useState<string>("");

  const { events, loading } = useEvents("all", statusTab);

  const filteredEvents = React.useMemo(() => {
    if (!searchQuery.trim()) return events;
    const q = searchQuery.toLowerCase();
    return events.filter(
      (e) =>
        e.title.toLowerCase().includes(q) ||
        e.category.toLowerCase().includes(q) ||
        e.venue.toLowerCase().includes(q) ||
        e.description.toLowerCase().includes(q)
    );
  }, [events, searchQuery]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">
      {/* Header */}
      <div className="text-center space-y-4 max-w-3xl mx-auto">
        <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-neutral-100">
          Club <span className="text-transparent bg-clip-text bg-gradient-to-b from-neutral-200 via-neutral-300 to-neutral-500">Events & Showcases</span>
        </h1>
        <p className="text-sm sm:text-base text-neutral-400 leading-relaxed">
          Discover upcoming inter-college competitions, stage plays, acoustic nights, and fest auditions. Reserve your participant or spectator slot in real-time.
        </p>
      </div>

      {/* Filter & Search Bar */}
      <div className="glass-card p-4 sm:p-6 rounded-3xl border border-white/[0.06] space-y-4 bg-[#0D0D0D]/75">
        {/* Search */}
        <div className="relative w-full">
          <Search className="absolute left-4 top-3.5 h-4 w-4 text-neutral-400" />
          <Input
            placeholder="Search events by title, venue, or description..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-11 h-11 bg-black/60 border-white/10 text-sm rounded-full w-full text-neutral-200 placeholder:text-neutral-500"
          />
        </div>

        {/* Status Tabs */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-white/[0.06]">
          {[
            { label: "All Events", value: "all" },
            { label: "Upcoming Competitions", value: "upcoming" },
            { label: "Ongoing Showcases", value: "ongoing" },
            { label: "Past Fest Archives", value: "completed" },
          ].map((tab) => (
            <button
              key={tab.value}
              type="button"
              onClick={() => setStatusTab(tab.value)}
              className={`px-4 py-2 rounded-full text-xs font-medium transition-all ${
                statusTab === tab.value
                  ? "bg-neutral-200 text-neutral-950 font-semibold shadow-sm"
                  : "bg-white/[0.03] border border-white/10 text-neutral-400 hover:bg-white/[0.06] hover:text-neutral-200"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Events Grid */}
      {filteredEvents.length === 0 ? (
        <div className="glass-panel p-12 rounded-3xl border border-white/[0.06] text-center space-y-3 bg-[#0D0D0D]/75">
          <Calendar className="mx-auto h-12 w-12 text-neutral-600" />
          <h3 className="text-lg font-bold text-neutral-100">No events found</h3>
          <p className="text-xs text-neutral-400 max-w-sm mx-auto">
            Try adjusting your search criteria or switch status tabs.
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setSearchQuery("");
              setStatusTab("all");
            }}
            className="rounded-full border-white/10 text-neutral-300 hover:bg-white/[0.06]"
          >
            Clear Filters
          </Button>
        </div>

      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredEvents.map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>
      )}
    </div>
  );
}
