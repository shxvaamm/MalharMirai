// Server Component — fetches stats at request time, zero client-side waterfall
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { EmergencyBanner } from "@/components/public/emergency-banner";
import { HeroSlideIndicators } from "@/components/public/hero-background-slideshow";
import { DepartmentsShowcase } from "@/components/public/departments-showcase";
import { EventsShowcase } from "@/components/public/events-showcase";
import { ScrollReveal } from "@/components/public/scroll-reveal";
import { HeroHeading } from "@/components/public/hero-heading";
import { HeroAnimations } from "@/components/public/hero-animations";
import { getLivePublicStats } from "@/lib/queries/stats";

// Revalidate every 60s — stats stay fresh without a full rebuild
export const revalidate = 60;

export default async function HomePage() {
  // Runs on the server — live counts auto-computed from database collections
  const { activeMembers, eventsOrganised } = await getLivePublicStats();

  return (
    <div className="flex flex-col gap-16 md:gap-24 pb-24 overflow-hidden bg-transparent">
      <EmergencyBanner />

      {/* ── Hero Section (Fits 100vh - navbar perfectly) ─────────────── */}
      <section className="relative w-full min-h-[calc(100dvh-4rem)] md:min-h-[calc(100dvh-5rem)] flex flex-col justify-center items-center px-4 sm:px-6 lg:px-8 py-10 sm:py-16 text-center">
        <div className="relative z-10 max-w-5xl mx-auto flex flex-col items-center justify-center w-full">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-white/[0.02] blur-[140px] rounded-full pointer-events-none -z-10" />

          {/* Staggered word-by-word hero heading — client component */}
          <HeroHeading
            prefix="The Rhythm & Creative Pulse of"
            highlight="Mirai School of Technology"
            className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight text-neutral-100 max-w-4xl mx-auto leading-[1.18] sm:leading-[1.15] lg:leading-[1.14] pb-1 drop-shadow-md text-center"
          />

          {/* Subtitle, CTAs, and Stats animated via shared Framer Motion client component */}
          <HeroAnimations
            activeMembers={activeMembers}
            eventsOrganised={eventsOrganised}
          />

          {/* Slide Indicators for the Hero Section */}
          <HeroSlideIndicators />
        </div>
      </section>

      {/* ── Events & Departments — client components with their own skeletons ── */}
      <EventsShowcase />
      <DepartmentsShowcase />

      {/* ── Members CTA Banner ──────────────────────────────────────── */}
      <ScrollReveal
        variant="reveal-scale"
        threshold={0.1}
        className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full"
      >
        <div className="p-8 sm:p-10 rounded-3xl border border-white/[0.06] hover:border-white/15 transition-all duration-300 bg-gradient-to-br from-white/[0.03] to-white/[0.01] backdrop-blur-xl flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl card-lift">
          <div className="space-y-2 text-center md:text-left">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-neutral-100">
              Meet the Creative Force of{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-b from-neutral-200 via-neutral-300 to-neutral-500">
                MALHAR
              </span>
            </h2>
            <p className="text-xs sm:text-sm text-neutral-400 max-w-xl">
              Meet the coordinators, executive members, and contributors shaping student life
              and cultural moments at Mirai.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <Link
              href="/leadership"
              className="inline-flex items-center gap-2 rounded-full px-6 py-3 text-xs sm:text-sm font-semibold bg-[#E5E5E5] text-neutral-950 hover:bg-white shadow-sm transition-all duration-200 active:scale-[0.97]"
            >
              <span>Meet the Team</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </ScrollReveal>
    </div>
  );
}
