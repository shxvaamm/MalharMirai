"use client";

/**
 * HeroAnimations — Framer Motion animated subtitle, CTAs, and stat cards
 * for the homepage hero section.
 *
 * Architecture note:
 *   Extracted from the server page.tsx so we can use Framer Motion
 *   (client-only) without making the entire page a client component.
 *   The server passes stat strings as props (already SSR'd, no flash).
 */

import * as React from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { Calendar, Users, ArrowRight, Compass } from "lucide-react";
import { FADE_UP, DURATION, EASE_OUT } from "@/lib/motion";
import { AnimatedCounter } from "@/components/public/animated-counter";

interface HeroAnimationsProps {
  activeMembers:   string;
  eventsOrganised: string;
}

export function HeroAnimations({ activeMembers, eventsOrganised }: HeroAnimationsProps) {
  const prefersReducedMotion = useReducedMotion();

  // Shared transition factory — each block gets a later delay for cascading
  const transition = (delay: number) => ({
    duration: DURATION.base,
    ease:     EASE_OUT,
    delay:    prefersReducedMotion ? 0 : delay,
  });

  const initial  = prefersReducedMotion ? "visible" : "hidden";
  const animate  = "visible";

  return (
    <>
      {/* Subtitle */}
      <motion.p
        variants={FADE_UP}
        initial={initial}
        animate={animate}
        transition={transition(0.42)}
        className="mt-6 text-base sm:text-lg text-neutral-300 max-w-2xl mx-auto leading-relaxed drop-shadow"
      >
        From dance and singing to management and tech, we give students the stage to build
        skills and showcase their talent.
      </motion.p>

      {/* CTAs */}
      <motion.div
        variants={FADE_UP}
        initial={initial}
        animate={animate}
        transition={transition(0.54)}
        className="mt-8 sm:mt-9 flex flex-wrap items-center justify-center gap-3.5"
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
      </motion.div>

      {/* Stats grid */}
      <motion.div
        variants={FADE_UP}
        initial={initial}
        animate={animate}
        transition={transition(0.66)}
        className="mt-12 sm:mt-14 grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl w-full mx-auto"
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
      </motion.div>
    </>
  );
}
