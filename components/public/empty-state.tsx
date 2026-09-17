import * as React from "react";
import Link from "next/link";
import { Instagram, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  /** Lucide icon component or any ReactNode to show above the headline */
  icon?: React.ReactNode;
  headline: string;
  subtext?: string;
  /** Show the Instagram CTA link — defaults true */
  showInstagramCta?: boolean;
  /** Extra action (e.g. "Clear Filters" button) rendered below the Instagram CTA */
  action?: React.ReactNode;
  className?: string;
}

/**
 * Reusable empty-state component.
 * Shows an icon, headline, subtext, and an Instagram CTA.
 * Used on Events, Gallery, and any other async-fetched content section.
 */
export function EmptyState({
  icon,
  headline,
  subtext,
  showInstagramCta = true,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-5 py-16 px-6 rounded-3xl",
        "border border-white/[0.06] bg-[#0D0D0D]/75 backdrop-blur-sm text-center",
        className
      )}
    >
      {/* Icon ring */}
      {icon && (
        <div className="flex items-center justify-center h-16 w-16 rounded-full bg-white/[0.04] border border-white/10 text-neutral-500 shadow-inner">
          {icon}
        </div>
      )}

      {/* Text */}
      <div className="space-y-2 max-w-sm">
        <h3 className="text-base font-bold text-neutral-100 tracking-tight">{headline}</h3>
        {subtext && (
          <p className="text-xs text-neutral-400 leading-relaxed">{subtext}</p>
        )}
      </div>

      {/* Instagram CTA */}
      {showInstagramCta && (
        <a
          href="https://www.instagram.com/malhar_mirai.hiet/"
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-xs font-semibold
                     bg-white/[0.04] border border-white/10 text-neutral-300
                     hover:bg-white/[0.08] hover:border-white/20 hover:text-white
                     transition-all duration-200 group"
        >
          <Instagram className="h-3.5 w-3.5 text-neutral-400 group-hover:text-white transition-colors" />
          <span>Follow us @malhar_mirai.hiet</span>
          <ExternalLink className="h-3 w-3 text-neutral-500 group-hover:text-neutral-300 transition-colors" />
        </a>
      )}

      {/* Optional extra action (e.g. Clear Filters button) */}
      {action && <div className="mt-1">{action}</div>}
    </div>
  );
}
