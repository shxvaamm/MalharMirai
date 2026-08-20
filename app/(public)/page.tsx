// Server Component — fetches stats at request time, zero client-side waterfall
import Link from "next/link";
import { Calendar, Users, ArrowRight, Compass } from "lucide-react";
import { EmergencyBanner } from "@/components/public/emergency-banner";
import { HeroSlideIndicators } from "@/components/public/hero-background-slideshow";
import { DepartmentsShowcase } from "@/components/public/departments-showcase";
import { EventsShowcase } from "@/components/public/events-showcase";
import { ScrollReveal } from "@/components/public/scroll-reveal";
import { createClient } from "@/lib/supabase/server";

// Revalidate every 60s — stats stay fresh without a full rebuild
export const revalidate = 60;

async function getStats(): Promise<{ activeMembers: string; eventsOrganised: string }> {
  try {
    const supabase = await createClient();
    const { data } = await (supabase.from("site_settings") as any)
      .select("key,value")
      .in("key", ["public_active_members", "public_events_organised"]);

    if (!data) return { activeMembers: "212+", eventsOrganised: "100+" };

    const members = data.find((d: any) => d.key === "public_active_members")?.value;
    const events  = data.find((d: any) => d.key === "public_events_organised")?.value;

    return {
      activeMembers:   members ? (String(members).includes("+") ? String(members) : `${members}+`) : "212+",
      eventsOrganised: events  ? (String(events).includes("+")  ? String(events)  : `${events}+`)  : "100+",
    };
  } catch {
    return { activeMembers: "212+", eventsOrganised: "100+" };
  }
}

export default async function HomePage() {
  // Runs on the server — stats are in the HTML before the browser parses JS
  const { activeMembers, eventsOrganised } = await getStats();

  return (
    <div className="flex flex-col gap-16 md:gap-24 pb-24 overflow-hidden">
      <EmergencyBanner />

      {/* ── Hero Section (Fits 100vh - navbar perfectly) ─────────────── */}
      <section className="relative w-full min-h-[calc(100dvh-4rem)] md:min-h-[calc(100dvh-5rem)] flex flex-col justify-center items-center px-4 sm:px-6 lg:px-8 py-10 sm:py-16 text-center">
        <div className="relative z-10 max-w-5xl mx-auto flex flex-col items-center justify-center w-full">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-white/[0.02] blur-[140px] rounded-full pointer-events-none -z-10" />

          <h1
            className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight text-neutral-100 max-w-4xl mx-auto leading-[1.12] drop-shadow-md"
            style={{ animation: "pageFadeIn 400ms cubic-bezier(0.16,1,0.3,1) both" }}
          >
            The Rhythm &amp; Creative Pulse of{" "}
            <br className="hidden sm:inline" />
            <span className="text-transparent bg-clip-text bg-gradient-to-b from-neutral-200 via-neutral-400 to-neutral-500">
              Mirai School of Technology
            </span>
          </h1>

          <p
            className="mt-6 text-base sm:text-lg text-neutral-300 max-w-2xl mx-auto leading-relaxed drop-shadow"
            style={{ animation: "pageFadeIn 400ms 80ms cubic-bezier(0.16,1,0.3,1) both" }}
          >
            From dance and singing to management and tech, we give students the stage to build
            skills and showcase their talent.
          </p>

          {/* CTAs */}
          <div
            className="mt-8 sm:mt-9 flex flex-wrap items-center justify-center gap-3.5"
            style={{ animation: "pageFadeIn 400ms 160ms cubic-bezier(0.16,1,0.3,1) both" }}
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

          {/* Stats — rendered on server, zero flash */}
          <div
            className="mt-12 sm:mt-14 grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl w-full mx-auto"
            style={{ animation: "pageFadeIn 400ms 240ms cubic-bezier(0.16,1,0.3,1) both" }}
          >
            <Link
              href="/members"
              className="p-6 rounded-3xl glass-card border border-white/[0.08] bg-black/60 hover:border-white/20 hover:bg-black/80 text-center transition-all duration-200 shadow-xl group block card-lift backdrop-blur-xl"
            >
              <div className="flex items-center justify-center gap-2.5 mb-1">
                <div className="p-2.5 rounded-2xl bg-white/[0.08] text-neutral-300 group-hover:scale-110 transition-transform duration-200">
                  <Users className="h-5 w-5" />
                </div>
                <div className="text-4xl sm:text-5xl font-extrabold text-neutral-100 font-mono tracking-tight">
                  {activeMembers}
                </div>
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
                <div className="text-4xl sm:text-5xl font-extrabold text-neutral-100 font-mono tracking-tight">
                  {eventsOrganised}
                </div>
              </div>
              <div className="text-xs uppercase tracking-widest text-neutral-400 font-semibold mt-2 group-hover:text-neutral-200 transition-colors">
                Events Organised
              </div>
              <div className="text-[11px] text-neutral-500 mt-0.5">
                Fests, showcases, workshops &amp; orientation galas &rarr;
              </div>
            </Link>
          </div>

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
              <span>Core Committee</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/members"
              className="inline-flex items-center gap-2 rounded-full px-6 py-3 text-xs sm:text-sm font-medium text-neutral-300 bg-white/[0.03] border border-white/10 hover:border-white/20 hover:text-white transition-all duration-200"
            >
              <span>All Members</span>
            </Link>
          </div>
        </div>
      </ScrollReveal>
    </div>
  );
}
