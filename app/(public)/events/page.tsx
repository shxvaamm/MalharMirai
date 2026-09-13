"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Calendar, Radio, Clock } from "lucide-react";
import { EventCard } from "@/components/public/event-card";
import { EmptyState } from "@/components/public/empty-state";
import { useEvents } from "@/lib/hooks/use-events";
import { ClubEvent } from "@/lib/mock-data";
import { STAGGER_CONTAINER, FADE_UP, DURATION, EASE_OUT, VIEWPORT_ONCE } from "@/lib/motion";

// ─── Status ordering ─────────────────────────────────────────────────────────
const STATUS_ORDER: Record<string, number> = { ongoing: 0, upcoming: 1, completed: 2 };

function sortEvents(events: ClubEvent[]): ClubEvent[] {
  return [...events].sort((a, b) => {
    const sa = STATUS_ORDER[a.status] ?? 99;
    const sb = STATUS_ORDER[b.status] ?? 99;
    if (sa !== sb) return sa - sb;
    // Within the same status, sort ascending by date
    return new Date(a.date_time).getTime() - new Date(b.date_time).getTime();
  });
}

// ─── Loading skeleton ─────────────────────────────────────────────────────────
function EventsSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="rounded-2xl border border-white/[0.06] bg-neutral-900/80 animate-pulse"
        >
          <div className="aspect-video w-full bg-neutral-800/60 rounded-t-2xl" />
          <div className="p-4 space-y-3">
            <div className="h-4 w-3/4 bg-neutral-800 rounded" />
            <div className="h-3 w-1/2 bg-neutral-800/60 rounded" />
            <div className="h-3 w-2/3 bg-neutral-800/60 rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Tab definitions ──────────────────────────────────────────────────────────
const TABS = [
  { label: "All", value: "all",       icon: null },
  { label: "Ongoing",  value: "ongoing",  icon: Radio },
  { label: "Upcoming", value: "upcoming", icon: Clock },
  { label: "Past",     value: "completed", icon: Calendar },
] as const;

type TabValue = (typeof TABS)[number]["value"];

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function EventsPage() {
  const [activeTab, setActiveTab] = React.useState<TabValue>("all");
  const { events: allEvents, loading } = useEvents("all", "all");

  // Sorted flat list: Ongoing → Upcoming → Past
  const sorted = React.useMemo(() => sortEvents(allEvents), [allEvents]);

  // Filtered by tab
  const displayed = React.useMemo(() => {
    if (activeTab === "all") return sorted;
    return sorted.filter((e) => e.status === activeTab);
  }, [sorted, activeTab]);

  // Count per tab for badge hints
  const counts = React.useMemo(() => ({
    all:       allEvents.length,
    ongoing:   allEvents.filter((e) => e.status === "ongoing").length,
    upcoming:  allEvents.filter((e) => e.status === "upcoming").length,
    completed: allEvents.filter((e) => e.status === "completed").length,
  }), [allEvents]);

  const emptyMessages: Record<TabValue, { headline: string; subtext: string }> = {
    all:       { headline: "No events scheduled right now", subtext: "We announce upcoming fests, workshops, and competitions on Instagram first — follow us to be the first to know." },
    ongoing:   { headline: "No ongoing events at the moment", subtext: "Check back during our next competition or showcase." },
    upcoming:  { headline: "No upcoming events yet", subtext: "Watch our Instagram for announcements about our next fest or workshop." },
    completed: { headline: "No past events to show", subtext: "As MALHAR grows, our archive of past events will appear here." },
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-10">

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <motion.div
        className="text-center space-y-3 max-w-2xl mx-auto"
        variants={FADE_UP}
        initial="hidden"
        animate="visible"
        transition={{ duration: DURATION.base, ease: EASE_OUT }}
      >
        <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-neutral-100">
          Events &{" "}
          <span className="text-transparent bg-clip-text bg-gradient-to-b from-neutral-200 via-neutral-300 to-neutral-500">
            Showcases
          </span>
        </h1>
        <p className="text-sm text-neutral-400 leading-relaxed">
          Competitions, stage plays, acoustic nights, and cultural showcases at Mirai School of Technology.
        </p>
      </motion.div>

      {/* ── Status Tabs — layoutId sliding active indicator ── */}
      <motion.div
        className="flex items-center justify-center gap-2 flex-wrap"
        variants={FADE_UP}
        initial="hidden"
        animate="visible"
        transition={{ duration: DURATION.base, ease: EASE_OUT, delay: 0.12 }}
      >
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.value;
          const count = counts[tab.value];
          return (
            <button
              key={tab.value}
              type="button"
              onClick={() => setActiveTab(tab.value)}
              className={`relative inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-medium transition-colors duration-200 ${
                isActive
                  ? "text-neutral-950 font-semibold"
                  : "bg-white/[0.03] border border-white/10 text-neutral-400 hover:bg-white/[0.06] hover:text-neutral-200 hover:border-white/20"
              }`}
            >
              {/* Sliding active pill via layoutId */}
              {isActive && (
                <motion.span
                  layoutId="events-tab-pill"
                  className="absolute inset-0 rounded-full bg-neutral-200"
                  transition={{ type: "spring", stiffness: 400, damping: 35 }}
                />
              )}
              <span className="relative z-10 flex items-center gap-1.5">
                {Icon && <Icon className="h-3 w-3" />}
                <span>{tab.label}</span>
                {count > 0 && (
                  <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded-full ${
                    isActive ? "bg-neutral-950/20" : "bg-white/[0.06]"
                  }`}>
                    {count}
                  </span>
                )}
              </span>
            </button>
          );
        })}
      </motion.div>

      {/* ── Content ────────────────────────────────────────────────────── */}
      {loading && allEvents.length === 0 ? (
        <EventsSkeleton />
      ) : displayed.length === 0 ? (
        <EmptyState
          icon={<Calendar className="h-7 w-7" />}
          headline={emptyMessages[activeTab].headline}
          subtext={emptyMessages[activeTab].subtext}
          showInstagramCta={activeTab !== "completed"}
        />
      ) : (
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5"
            variants={STAGGER_CONTAINER}
            initial="hidden"
            animate="visible"
            exit={{ opacity: 0, transition: { duration: 0.15 } }}
            viewport={VIEWPORT_ONCE}
          >
            {displayed.map((event) => (
              <motion.div
                key={event.id}
                variants={FADE_UP}
                transition={{ duration: DURATION.base, ease: EASE_OUT }}
              >
                <EventCard event={event} />
              </motion.div>
            ))}
          </motion.div>
        </AnimatePresence>
      )}
    </div>
  );
}
