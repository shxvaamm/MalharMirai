"use client";

import * as React from "react";
import { usePathname } from "next/navigation";

/**
 * Lightweight page transition — 240ms fade + subtle slide.
 * key={pathname} forces React to unmount/remount on route change.
 * Using CSS animation via globals.css .page-fade-in for GPU compositing.
 */
export function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  return (
    <div key={pathname} className="flex flex-col flex-1 min-h-0 page-fade-in" style={{ isolation: "isolate" }}>
      {children}
    </div>
  );
}
