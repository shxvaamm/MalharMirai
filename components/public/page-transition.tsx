"use client";

import * as React from "react";
import { usePathname } from "next/navigation";

/**
 * Lightweight page transition — 250ms fade + 12px slide up.
 * No curtain overlay (removes 280ms of unnecessary delay).
 * key={pathname} forces React to unmount/remount on route change.
 */
export function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  return (
    <div key={pathname} className="flex flex-col flex-1 min-h-0 page-fade-in">
      {children}
    </div>
  );
}
