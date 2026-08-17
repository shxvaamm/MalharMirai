"use client";

import * as React from "react";
import { Award, Trophy, Star, Sparkles, Calendar } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const milestones = [
  {
    year: "2025",
    title: "Foundation by Batch 2025–29",
    description: "Initiated by foundational members of the 2025–29 batch at Mirai School of Technology to build a premier collegiate cultural society.",
    tag: "Founding",
  },
  {
    year: "2025",
    title: "Inaugural Cultural Galas & 5 Wings",
    description: "Established the five core pillars: Media, Design, Management, Technical, and PR Department to anchor all productions.",
    tag: "Expansion",
  },
  {
    year: "2026",
    title: "Campus-Wide Fests & Stage Showcases",
    description: "Producing flagship events including Dhwani Acoustic Night, Nritya Darpan, Rhapsody Rock, and Spotlight Theatre.",
    tag: "Showcase",
  },
  {
    year: "2026",
    title: "Full Digital Platform & Student Roster",
    description: "Modernizing student event registrations, artist directories, real-time notices, and digital stage coordination.",
    tag: "Present Era",
  },
];

export function TimelineSection() {
  return (
    <div className="relative border-l border-white/10 ml-4 sm:ml-8 space-y-8 py-4">
      {milestones.map((m, index) => (
        <div key={index} className="relative pl-6 sm:pl-8 group">
          {/* Timeline Node Dot */}
          <div className="absolute -left-[9px] top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-black border-2 border-neutral-400 group-hover:scale-125 group-hover:bg-neutral-200 transition-all shadow-sm" />

          <div className="glass-panel p-5 sm:p-6 rounded-3xl border border-white/[0.06] bg-[#0D0D0D]/75 group-hover:border-white/20 transition-all shadow-lg">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
              <span className="text-xl sm:text-2xl font-bold text-neutral-100 font-mono">
                {m.year}
              </span>
              <Badge variant="member" className="text-[10px]">
                {m.tag}
              </Badge>
            </div>
            <h3 className="text-base sm:text-lg font-bold text-neutral-100 mb-1">
              {m.title}
            </h3>
            <p className="text-xs sm:text-sm text-neutral-400 leading-relaxed">
              {m.description}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
