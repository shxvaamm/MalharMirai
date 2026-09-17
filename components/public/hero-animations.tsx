/**
 * HeroAnimations — Subtitle, CTAs, and stat cards for the homepage hero.
 *
 * Animation (CSS — no framer-motion):
 *   Each block gets class="hero-block" with --hero-delay set to match the
 *   former Framer Motion transition delays exactly:
 *     Subtitle:  delay 420ms  (was transition(0.42))
 *     CTAs:      delay 540ms  (was transition(0.54))
 *     Stats:     delay 660ms  (was transition(0.66))
 *   Duration: 380ms (DURATION.base), easing: cubic-bezier(0.16,1,0.3,1).
 *   All values defined in globals.css @keyframes heroBlockIn / .hero-block.
 *
 *   prefers-reduced-motion: global CSS sets animation-duration 0.01ms,
 *   blocks appear instantly — no JS needed.
 *
 * This is now a Server Component (no hooks, no "use client").
 */

import * as React from "react";
import Link from "next/link";
import { Calendar, Users, ArrowRight, Compass } from "lucide-react";
import { AnimatedCounter } from "@/components/public/animated-counter";

interface HeroAnimationsProps {
  activeMembers:   string;
  eventsOrganised: string;
}

export function HeroAnimations({ activeMembers, eventsOrganised }: HeroAnimationsProps) {
  return (
    <>
      {/* Subtitle — delay 420ms */}
      <p
        className="hero-block mt-6 text-base sm:text-lg text-neutral-300 max-w-2xl mx-auto leading-relaxed drop-shadow"
        style={{ "--hero-delay": "420ms" } as React.CSSProperties}
      >
        From dance and singing to management and tech, we give students the stage to build
        skills and showcase their talent.
      </p>

      {/* CTAs — delay 540ms */}
      <div
        className="hero-block mt-8 sm:mt-9 flex flex-wrap items-center justify-center gap-3.5"
        style={{ "--hero-delay": "540ms" } as React.CSSProperties}
      >
        <Link
          href="/events"
          className="inline-flex items-center gap-2 rounded-full px-8 py-3.5 text-sm font-semibold bg-[#E5E5E5] text-neutral-950 hover:bg-white shadow-md active:scale-[0.98] transition-all duration-200 card-lift"
        >
          <Calendar className="h-4 w-4" />
          <span>Explore Upcoming Events</span>
          <ArrowRight className="h-4 w-4" />
        </Link>
        <Link
          href="/about"
          className="inline-flex items-center gap-2 rounded-full px-8 py-3.5 text-sm font-medium text-neutral-200 bg-black/50 border border-white/15 hover:border-white/30 hover:bg-black/70 transition-all duration-200 backdrop-blur-md shadow-md"
        >
          <Compass className="h-4 w-4 text-neutral-400" />
          <span>About Society</span>
        </Link>
      </div>

      {/* Stats grid — delay 660ms */}
      <div
        className="hero-block mt-12 sm:mt-14 grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl w-full mx-auto"
        style={{ "--hero-delay": "660ms" } as React.CSSProperties}
      >
        <Link
          href="/members"
          className="p-6 rounded-3xl glass-card border border-white/[0.08] bg-black/60 hover:border-white/20 hover:bg-black/80 text-center transition-all duration-200 shadow-xl group block card-lift backdrop-blur-xl"
        >
          <div className="flex items-center justify-center gap-2.5 mb-1">
            <div className="p-2.5 rounded-2xl bg-white/[0.08] text-neutral-300 group-hover:scale-110 transition-transform duration-200">
              <Users className="h-5 w-5" />
            </div>
            <AnimatedCounter
              value={activeMembers}
              duration={900}
              className="text-4xl sm:text-5xl font-extrabold text-neutral-100 font-mono tracking-tight"
            />
          </div>
          <div className="text-xs uppercase tracking-widest text-neutral-400 font-semibold mt-2 group-hover:text-neutral-200 transition-colors">
            Active Members
          </div>
          <div className="text-[11px] text-neutral-500 mt-0.5">
            Coordinators &amp; contributors across 5 departments &rarr;
          </div>
        </Link>

        <Link
          href="/events"
          className="p-6 rounded-3xl glass-card border border-white/[0.08] bg-black/60 hover:border-white/20 hover:bg-black/80 text-center transition-all duration-200 shadow-xl group block card-lift backdrop-blur-xl"
        >
          <div className="flex items-center justify-center gap-2.5 mb-1">
            <div className="p-2.5 rounded-2xl bg-white/[0.08] text-neutral-300 group-hover:scale-110 transition-transform duration-200">
              <Calendar className="h-5 w-5" />
            </div>
            <AnimatedCounter
              value={eventsOrganised}
              duration={900}
              className="text-4xl sm:text-5xl font-extrabold text-neutral-100 font-mono tracking-tight"
            />
          </div>
          <div className="text-xs uppercase tracking-widest text-neutral-400 font-semibold mt-2 group-hover:text-neutral-200 transition-colors">
            Events Organised
          </div>
          <div className="text-[11px] text-neutral-500 mt-0.5">
            Fests, showcases, workshops &amp; orientation galas &rarr;
          </div>
        </Link>
      </div>
    </>
  );
}
