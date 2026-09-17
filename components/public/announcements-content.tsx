"use client";

import * as React from "react";
import { Bell, AlertTriangle, Calendar } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAnnouncements } from "@/lib/hooks/use-announcements";
import { ScrollReveal } from "@/components/public/scroll-reveal";
import { Announcement } from "@/lib/mock-data";

interface AnnouncementsContentProps {
  initialAnnouncements?: Announcement[];
}

export function AnnouncementsContent({ initialAnnouncements }: AnnouncementsContentProps) {
  const { announcements, loading } = useAnnouncements(undefined, initialAnnouncements);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8 sm:space-y-10">
      {/* Header */}
      <ScrollReveal variant="reveal" className="text-center space-y-4 max-w-3xl mx-auto">
        <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-neutral-100">
          Club <span className="text-transparent bg-clip-text bg-gradient-to-b from-neutral-200 via-neutral-300 to-neutral-500">Announcements</span>
        </h1>
        <p className="text-sm sm:text-base text-neutral-400 leading-relaxed">
          Stay updated with audition calls, rehearsal schedules, fest logistical circulars, and emergency alerts directly from the executive council.
        </p>
      </ScrollReveal>

      {/* Notices Feed */}
      <div className="space-y-4 max-w-4xl mx-auto">
        {announcements.map((item, index) => (
          <ScrollReveal
            key={item.id}
            variant="reveal"
            delay={index * 65}
            threshold={0.1}
          >
            <Card
              className={`glass-panel transition-all hover:border-white/30 bg-[#0A0A0A] ${
                item.is_emergency
                  ? "border-rose-500/80 bg-rose-950/20 shadow-lg shadow-rose-950/30"
                  : item.priority === "urgent"
                  ? "border-white/30 bg-white/[0.03]"
                  : "border-white/[0.08]"
              }`}
            >
              <CardHeader className="pb-2">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
                  <div className="flex items-center gap-2">
                    {item.is_emergency && (
                      <Badge variant="destructive" className="flex items-center gap-1 animate-pulse text-[10px]">
                        <AlertTriangle className="h-3 w-3" />
                        EMERGENCY NOTICE
                      </Badge>
                    )}
                    <Badge variant={item.priority === "urgent" ? "urgent" : "secondary"} className="text-[10px]">
                      {item.priority}
                    </Badge>
                  </div>
                  <span className="text-xs text-neutral-400 flex items-center gap-1.5 font-mono">
                    <Calendar className="h-3.5 w-3.5 text-neutral-400" />
                    {new Date(item.created_at).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </span>
                </div>

                <CardTitle className="text-lg sm:text-xl font-bold text-white tracking-tight">
                  {item.title}
                </CardTitle>
              </CardHeader>

              <CardContent className="space-y-3 pt-1">
                <p className="text-xs sm:text-sm text-neutral-300 leading-relaxed whitespace-pre-line">
                  {item.content}
                </p>
              </CardContent>
            </Card>
          </ScrollReveal>
        ))}

        {announcements.length === 0 && !loading && (
          <ScrollReveal variant="reveal" threshold={0.1}>
            <div className="glass-panel p-12 rounded-2xl text-center space-y-2 border border-white/[0.08] bg-[#0A0A0A]">
              <Bell className="mx-auto h-8 w-8 text-neutral-500" />
              <h4 className="text-base font-bold text-white">No Circulars Found</h4>
              <p className="text-xs text-neutral-400">No circulars or official announcements have been published yet.</p>
            </div>
          </ScrollReveal>
        )}
      </div>
    </div>
  );
}
