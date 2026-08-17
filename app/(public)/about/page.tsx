"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { Target, Compass, Heart, Users, Calendar, ArrowRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { SOCIETY_INFO } from "@/lib/mock-data";

export default function AboutPage() {
  const [activeMembers, setActiveMembers] = React.useState<string>("");
  const [eventsOrganised, setEventsOrganised] = React.useState<string>("");

  React.useEffect(() => {
    async function fetchStats() {
      try {
        const supabase = createClient();
        const { data } = await (supabase.from("site_settings") as any).select("*");
        if (data) {
          const members = data.find((item: any) => item.key === "public_active_members")?.value;
          const events = data.find((item: any) => item.key === "public_events_organised")?.value;
          if (members) setActiveMembers(String(members).includes("+") ? String(members) : `${members}+`);
          if (events) setEventsOrganised(String(events).includes("+") ? String(events) : `${events}+`);
        }
      } catch (err) {
        console.warn("fetchStats error on about page:", err);
      }
    }
    fetchStats();
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-16">
      {/* Page Header */}
      <div className="text-center space-y-4 max-w-3xl mx-auto">
        <div className="flex items-center justify-center gap-2 mb-2">
          <div className="relative h-16 w-16 rounded-full overflow-hidden border border-white/15 shadow-md bg-neutral-900">
            <Image
              src="/images/malhar-logo.png"
              alt="MALHAR Logo"
              fill
              className="object-cover brightness-105"
            />
          </div>
        </div>

        <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-neutral-100">
          About <span className="text-transparent bg-clip-text bg-gradient-to-b from-neutral-200 via-neutral-300 to-neutral-500">MALHAR</span>
        </h1>
        <p className="text-sm sm:text-base text-neutral-400 leading-relaxed max-w-2xl mx-auto">
          {SOCIETY_INFO.aboutText}
        </p>
      </div>

      {/* Core Dynamic Statistics directly from Supabase (ONLY Active Members & Events Organised) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-2xl mx-auto">
        <div className="glass-card p-6 sm:p-8 rounded-3xl border border-white/[0.06] text-center shadow-lg bg-[#0D0D0D]/75">
          <div className="flex items-center justify-center gap-2 mb-1">
            <Users className="h-6 w-6 text-neutral-400" />
            <div
              suppressHydrationWarning
              className="text-4xl sm:text-5xl font-extrabold text-neutral-100 font-mono tracking-tight"
            >
              {activeMembers || "7+"}
            </div>
          </div>
          <div className="text-xs uppercase tracking-wider font-semibold text-neutral-400 mt-2">
            Active Members
          </div>
          <div className="text-[11px] text-neutral-500 mt-1">
            Coordinators & contributors
          </div>
        </div>

        <div className="glass-card p-6 sm:p-8 rounded-3xl border border-white/[0.06] text-center shadow-lg bg-[#0D0D0D]/75">
          <div className="flex items-center justify-center gap-2 mb-1">
            <Calendar className="h-6 w-6 text-neutral-400" />
            <div
              suppressHydrationWarning
              className="text-4xl sm:text-5xl font-extrabold text-neutral-100 font-mono tracking-tight"
            >
              {eventsOrganised || "8+"}
            </div>
          </div>
          <div className="text-xs uppercase tracking-wider font-semibold text-neutral-400 mt-2">
            Events Organised
          </div>
          <div className="text-[11px] text-neutral-500 mt-1">
            Fests, showcases, workshops & orientation galas
          </div>
        </div>
      </div>

      {/* Mission & Vision & Values Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="glass-card border-white/[0.06] hover:border-white/20 rounded-3xl transition-all bg-[#0D0D0D]/75">
          <CardHeader>
            <div className="h-12 w-12 rounded-2xl bg-white/[0.04] text-neutral-300 flex items-center justify-center mb-2 shadow-inner border border-white/10">
              <Target className="h-6 w-6" />
            </div>
            <CardTitle className="text-xl font-bold text-neutral-100 tracking-tight">Our Mission</CardTitle>
          </CardHeader>
          <CardContent className="text-xs sm:text-sm text-neutral-300 leading-relaxed">
            To provide an empowering cultural platform for students of Mirai School of Technology to cultivate creative talent, produce stage productions, and foster teamwork.
          </CardContent>
        </Card>

        <Card className="glass-card border-white/[0.06] hover:border-white/20 rounded-3xl transition-all bg-[#0D0D0D]/75">
          <CardHeader>
            <div className="h-12 w-12 rounded-2xl bg-white/[0.04] text-neutral-300 flex items-center justify-center mb-2 shadow-inner border border-white/10">
              <Compass className="h-6 w-6" />
            </div>
            <CardTitle className="text-xl font-bold text-neutral-100 tracking-tight">Our Vision</CardTitle>
          </CardHeader>
          <CardContent className="text-xs sm:text-sm text-neutral-300 leading-relaxed">
            To build a nationally celebrated collegiate cultural society known for creative innovation, high production standards, and collaborative energy.
          </CardContent>
        </Card>

        <Card className="glass-card border-white/[0.06] hover:border-white/20 rounded-3xl transition-all bg-[#0D0D0D]/75">
          <CardHeader>
            <div className="h-12 w-12 rounded-2xl bg-white/[0.04] text-neutral-300 flex items-center justify-center mb-2 shadow-inner border border-white/10">
              <Heart className="h-6 w-6" />
            </div>
            <CardTitle className="text-xl font-bold text-neutral-100 tracking-tight">Core Values</CardTitle>
          </CardHeader>
          <CardContent className="text-xs sm:text-sm text-neutral-300 leading-relaxed">
            Creativity, artistic discipline, student-led leadership, inclusivity, and celebrating the vibrant cultural spirit of Mirai School of Technology.
          </CardContent>
        </Card>
      </div>

      {/* CTA */}
      <div className="text-center pt-6 space-y-4">
        <Button asChild variant="default" size="lg" className="rounded-full font-semibold px-8 bg-[#E5E5E5] text-neutral-950 hover:bg-[#D4D4D4] shadow-sm">
          <Link href="/events" className="flex items-center gap-2">
            <span>Explore Upcoming Events</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </div>

    </div>
  );
}
