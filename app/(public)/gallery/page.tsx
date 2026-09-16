"use client";

import * as React from "react";
import { Image as ImageIcon } from "lucide-react";
import { GalleryGrid } from "@/components/public/gallery-grid";
import { EmptyState } from "@/components/public/empty-state";
import { useGallery } from "@/lib/hooks/use-gallery";
import { ScrollReveal } from "@/components/public/scroll-reveal";

function GallerySkeleton() {
  const heights = [280, 400, 320, 460, 300, 380, 340, 440, 290, 410, 310, 430];
  return (
    <div className="columns-2 sm:columns-3 lg:columns-4 gap-3 sm:gap-4">
      {heights.map((h, i) => (
        <div
          key={i}
          className="break-inside-avoid mb-3 sm:mb-4 rounded-2xl sm:rounded-3xl bg-[#0D0D0D]/90 border border-white/[0.06] overflow-hidden animate-pulse shadow-lg"
          style={{ animationDelay: `${i * 50}ms` }}
        >
          <div
            className="w-full bg-neutral-900/80"
            style={{ height: `${h * 0.65}px` }}
          />
          <div className="p-3.5 sm:p-4 space-y-2 border-t border-white/[0.04]">
            <div className="h-3 w-12 bg-neutral-800/80 rounded-full" />
            <div className="h-4 w-3/4 bg-neutral-800/60 rounded-md" />
            <div className="h-3 w-1/2 bg-neutral-800/40 rounded-md" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function GalleryPage() {
  const { media, loading } = useGallery();

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-10">

      {/* Header */}
      <ScrollReveal variant="reveal" className="text-center space-y-3 max-w-xl mx-auto">
        <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-neutral-100">
          Our{" "}
          <span className="text-transparent bg-clip-text bg-gradient-to-b from-neutral-200 via-neutral-300 to-neutral-500">
            Gallery
          </span>
        </h1>
        <p className="text-sm text-neutral-400">
          Photos from our events, showcases, and cultural moments at Mirai.
        </p>
      </ScrollReveal>

      {/* Content */}
      {loading ? (
        <GallerySkeleton />
      ) : media.length > 0 ? (
        <GalleryGrid media={media} />
      ) : (
        <EmptyState
          icon={<ImageIcon className="h-7 w-7" />}
          headline="No photos yet — but we're just getting started."
          subtext="Our gallery fills up after every event. Follow us on Instagram for the latest photos from MALHAR."
          showInstagramCta={true}
        />
      )}
    </div>
  );
}
