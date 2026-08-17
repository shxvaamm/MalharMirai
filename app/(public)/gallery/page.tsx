"use client";

import * as React from "react";
import { GalleryLightbox } from "@/components/public/gallery-lightbox";
import { useGallery } from "@/lib/hooks/use-gallery";

export default function GalleryPage() {
  const { media } = useGallery();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">
      {/* Header */}
      <div className="text-center space-y-4 max-w-3xl mx-auto">
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-neutral-100">
          Visual <span className="text-transparent bg-clip-text bg-gradient-to-b from-neutral-200 via-neutral-300 to-neutral-500">Chronicles & Moments</span>
        </h1>
        <p className="text-sm sm:text-base text-neutral-400 leading-relaxed max-w-2xl mx-auto">
          A glimpse into our stage showcases, cultural celebrations, performance arts, and behind-the-scenes memories at Mirai School of Technology.
        </p>
      </div>

      {/* Immediate Rendered Masonry Gallery Grid */}
      <GalleryLightbox initialMedia={media} showCategoryFilters={false} />
    </div>
  );
}

