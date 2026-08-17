"use client";

import * as React from "react";
import Link from "next/link";
import { AlertTriangle, BellRing, ArrowRight, X } from "lucide-react";
import { useAnnouncements } from "@/lib/hooks/use-announcements";

export function EmergencyBanner() {
  const { emergencyAlert } = useAnnouncements();
  const [dismissed, setDismissed] = React.useState(false);

  if (!emergencyAlert || dismissed) return null;

  return (
    <aside aria-label="Urgent Announcements" className="relative w-full bg-gradient-to-r from-rose-900 via-neutral-900 to-rose-950 text-neutral-100 px-4 py-2.5 shadow-lg border-b border-rose-500/20">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-xs sm:text-sm">
        <div className="flex items-center gap-2.5 font-medium">
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-rose-500/20 backdrop-blur-sm animate-pulse">
            {emergencyAlert.is_emergency ? (
              <AlertTriangle className="h-3.5 w-3.5 text-rose-300" />
            ) : (
              <BellRing className="h-3.5 w-3.5 text-neutral-300" />
            )}
          </span>
          <span className="font-bold uppercase tracking-wider bg-black/40 border border-white/10 px-2 py-0.5 rounded-full text-[10px] text-neutral-200">
            {emergencyAlert.is_emergency ? "Urgent Alert" : "Important"}
          </span>
          <span className="truncate max-w-xl font-semibold text-neutral-200">
            {emergencyAlert.title}
          </span>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <Link
            href="/announcements"
            className="inline-flex items-center gap-1 font-semibold text-neutral-300 underline hover:text-white transition-colors"
          >
            <span>View Full Notice</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
          <button
            type="button"
            onClick={() => setDismissed(true)}
            className="rounded-full p-1 hover:bg-white/10 transition-colors text-neutral-400 hover:text-white"
            aria-label="Dismiss alert"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
