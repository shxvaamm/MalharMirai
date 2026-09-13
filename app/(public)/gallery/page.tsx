"use client";

import * as React from "react";
import { Image as ImageIcon } from "lucide-react";
import { GalleryGrid } from "@/components/public/gallery-grid";
import { EmptyState } from "@/components/public/empty-state";
import { useGallery } from "@/lib/hooks/use-gallery";

function GallerySkeleton() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
      {Array.from({ length: 12 }).map((_, i) => (
        <div
          key={i}
          className="aspect-square w-full rounded-2xl bg-neutral-900/80 animate-pulse border border-white/[0.04]"
        />
      ))}
    </div>
  );
}

export default function GalleryPage() {
  const { media, loading } = useGallery();

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-10">

      {/* Header */}
      <div className="text-center space-y-3 max-w-xl mx-auto">
        <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-neutral-100">
          Our{" "}
          <span className="text-transparent bg-clip-text bg-gradient-to-b from-neutral-200 via-neutral-300 to-neutral-500">
            Gallery
          </span>
        </h1>
        <p className="text-sm text-neutral-400">
          Photos from our events, showcases, and cultural moments at Mirai.
        </p>
      </div>

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
