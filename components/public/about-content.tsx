"use client";

/**
 * AboutContent — client wrapper for the animated sections of the About page.
 * The parent about/page.tsx is a Server Component; this component receives
 * stat strings + text as props and handles all Framer Motion animations.
 */

import React from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Target, Compass, Heart, Users, Calendar, ArrowRight } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  STAGGER_CONTAINER,
  FADE_UP,
  SCALE_IN,
  DURATION,
  EASE_OUT,
  VIEWPORT_ONCE,
  VIEWPORT_STRICT,
} from "@/lib/motion";
import { AnimatedCounter } from "@/components/public/animated-counter";

interface AboutContentProps {
  activeMembers:   string;
  eventsOrganised: string;
  aboutText:       string;
}

export function AboutContent({ activeMembers, eventsOrganised, aboutText }: AboutContentProps) {
  const prefersReducedMotion = useReducedMotion();
  const initial = prefersReducedMotion ? "visible" : "hidden";

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-16">

      {/* Page Header */}
      <motion.div
        className="text-center space-y-4 max-w-3xl mx-auto"
        variants={FADE_UP}
        initial={initial}
        animate="visible"
        transition={{ duration: DURATION.base, ease: EASE_OUT }}
      >
        <div className="flex items-center justify-center gap-2 mb-2">
          <div className="relative h-16 w-16 rounded-full overflow-hidden border border-white/15 shadow-md bg-neutral-900">
            <Image
              src="/images/malhar-logo.png"
              alt="MALHAR Logo"
              fill
              sizes="64px"
              className="object-cover brightness-105"
            />
          </div>
        </div>

        <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-neutral-100">
          About <span className="text-transparent bg-clip-text bg-gradient-to-b from-neutral-200 via-neutral-300 to-neutral-500">MALHAR</span>
        </h1>
        <p className="text-sm sm:text-base text-neutral-400 leading-relaxed max-w-2xl mx-auto">
          {aboutText}
        </p>
      </motion.div>

      {/* Core Statistics — staggered card reveal */}
      <motion.div
        className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-2xl mx-auto"
        variants={STAGGER_CONTAINER}
        initial={initial}
        whileInView="visible"
        viewport={VIEWPORT_ONCE}
      >
        {[
          { icon: Users, value: activeMembers, label: "Active Members", sub: "Coordinators & contributors across 5 departments" },
          { icon: Calendar, value: eventsOrganised, label: "Events Organised", sub: "Fests, showcases, workshops & orientation galas" },
        ].map(({ icon: Icon, value, label, sub }) => (
          <motion.div
            key={label}
            variants={FADE_UP}
            transition={{ duration: DURATION.base, ease: EASE_OUT }}
            className="glass-card p-6 sm:p-8 rounded-3xl border border-white/[0.06] text-center shadow-lg bg-[#0D0D0D]/75"
          >
            <div className="flex items-center justify-center gap-2 mb-1">
              <Icon className="h-6 w-6 text-neutral-400" />
              <AnimatedCounter
                value={value}
                duration={900}
                className="text-4xl sm:text-5xl font-extrabold text-neutral-100 font-mono tracking-tight"
              />
            </div>
            <div className="text-xs uppercase tracking-wider font-semibold text-neutral-400 mt-2">
              {label}
            </div>
            <div className="text-[11px] text-neutral-500 mt-1">{sub}</div>
          </motion.div>
        ))}
      </motion.div>

      {/* Mission, Vision & Values — staggered cascade */}
      <motion.div
        className="grid grid-cols-1 md:grid-cols-3 gap-6"
        variants={STAGGER_CONTAINER}
        initial={initial}
        whileInView="visible"
        viewport={VIEWPORT_STRICT}
      >
        {[
          {
            icon: Target,
            title: "Our Mission",
            body: "To provide an empowering cultural platform for students of Mirai School of Technology to cultivate creative talent, produce stage productions, and foster teamwork.",
          },
          {
            icon: Compass,
            title: "Our Vision",
            body: "To build a nationally celebrated collegiate cultural society known for creative innovation, high production standards, and collaborative energy.",
          },
          {
            icon: Heart,
            title: "Core Values",
            body: "Creativity, artistic discipline, student-led leadership, inclusivity, and celebrating the vibrant cultural spirit of Mirai School of Technology.",
          },
        ].map(({ icon: Icon, title, body }) => (
          <motion.div
            key={title}
            variants={SCALE_IN}
            transition={{ duration: DURATION.base, ease: EASE_OUT }}
          >
            <Card className="h-full glass-card border-white/[0.06] hover:border-white/20 rounded-3xl transition-all bg-[#0D0D0D]/75">
              <CardHeader>
                <div className="h-12 w-12 rounded-2xl bg-white/[0.04] text-neutral-300 flex items-center justify-center mb-2 shadow-inner border border-white/10">
                  <Icon className="h-6 w-6" />
                </div>
                <CardTitle className="text-xl font-bold text-neutral-100 tracking-tight">{title}</CardTitle>
              </CardHeader>
              <CardContent className="text-xs sm:text-sm text-neutral-300 leading-relaxed">
                {body}
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      {/* CTA */}
      <motion.div
        className="text-center pt-6 space-y-4"
        variants={FADE_UP}
        initial={initial}
        whileInView="visible"
        viewport={VIEWPORT_ONCE}
        transition={{ duration: DURATION.base, ease: EASE_OUT }}
      >
        <Button asChild variant="default" size="lg" className="rounded-full font-semibold px-8 bg-[#E5E5E5] text-neutral-950 hover:bg-[#D4D4D4] shadow-sm">
          <Link href="/events" className="flex items-center gap-2">
            <span>Explore Upcoming Events</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </motion.div>
    </div>
  );
}
