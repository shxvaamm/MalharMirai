"use client";

import * as React from "react";
import {
  Image as ImageIcon,
  Film,
  X,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  ZoomIn,
  Calendar,
  Layers,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { GalleryMedia, MOCK_GALLERY } from "@/lib/mock-data";

interface GalleryLightboxProps {
  initialMedia: GalleryMedia[];
  showCategoryFilters?: boolean;
}

export function GalleryLightbox({
  initialMedia,
}: GalleryLightboxProps) {
  const [activeMediaIndex, setActiveMediaIndex] = React.useState<number | null>(null);

  const filteredMedia = React.useMemo(() => {
    return Array.isArray(initialMedia) && initialMedia.length > 0 ? initialMedia : MOCK_GALLERY;
  }, [initialMedia]);

  const activeItem = activeMediaIndex !== null ? filteredMedia[activeMediaIndex] : null;

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (activeMediaIndex === null) return;
    setActiveMediaIndex((activeMediaIndex + 1) % filteredMedia.length);
  };

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (activeMediaIndex === null) return;
    setActiveMediaIndex((activeMediaIndex - 1 + filteredMedia.length) % filteredMedia.length);
  };

  // Keyboard navigation
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (activeMediaIndex === null) return;
      if (e.key === "Escape") setActiveMediaIndex(null);
      if (e.key === "ArrowRight") setActiveMediaIndex((prev) => (prev! + 1) % filteredMedia.length);
      if (e.key === "ArrowLeft")
        setActiveMediaIndex((prev) => (prev! - 1 + filteredMedia.length) % filteredMedia.length);
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeMediaIndex, filteredMedia.length]);

  // Subtle rhythmic aspect-ratio variations for masonry elegance
  const getAspectClass = (index: number) => {
    const pattern = index % 6;
    switch (pattern) {
      case 0:
        return "aspect-[4/5]"; // Tall portrait
      case 1:
        return "aspect-[16/10]"; // Classic landscape
      case 2:
        return "aspect-[1/1]"; // Square
      case 3:
        return "aspect-[3/4]"; // Medium portrait
      case 4:
        return "aspect-[16/11]"; // Wide
      case 5:
        return "aspect-[4/5]"; // Tall
      default:
        return "aspect-[4/3]";
    }
  };

  return (
    <div className="space-y-8">
      {/* Empty State */}
      {filteredMedia.length === 0 ? (
        <div className="p-16 text-center rounded-3xl glass-panel border border-white/[0.06] space-y-3 bg-[#0D0D0D]">
          <ImageIcon className="h-12 w-12 mx-auto text-neutral-600" />
          <h3 className="text-base font-bold text-neutral-100">No Photos Found</h3>
          <p className="text-xs text-neutral-400 max-w-sm mx-auto">
            No gallery entries are currently published under this category filter.
          </p>
        </div>
      ) : (
        /* Subtle Responsive Masonry Grid */
        <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-5 [column-fill:_balance]">
          {filteredMedia.map((item: GalleryMedia, index: number) => {
            const aspectClass = getAspectClass(index);
            const eventName = item.event_title || item.title || "Mirai Cultural Showcase";
            const dateStr = item.date || "2026";

            return (
              <div
                key={item.id}
                onClick={() => setActiveMediaIndex(index)}
                className="group relative w-full mb-5 break-inside-avoid cursor-pointer overflow-hidden rounded-3xl border border-white/[0.06] bg-[#0D0D0D] shadow-lg transition-all duration-500 hover:border-white/20 hover:shadow-2xl"
              >
                {/* Photo with subtle aspect variations */}
                <div className={`relative w-full ${aspectClass} overflow-hidden bg-black`}>
                  <img
                    src={item.media_url}
                    alt={item.title}
                    className="h-full w-full object-cover object-center transform transition-transform duration-700 ease-out group-hover:scale-105"
                    loading="lazy"
                  />

                  {/* Gentle gradient bottom scrim */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/30 to-transparent opacity-60 group-hover:opacity-90 transition-opacity duration-300" />

                  {/* Top-Right Quick Expand Icon */}
                  <div className="absolute top-3 right-3 p-2 rounded-full bg-black/80 backdrop-blur-md border border-white/10 text-neutral-300 opacity-0 group-hover:opacity-100 transition-all duration-300 transform -translate-y-1 group-hover:translate-y-0">
                    <ZoomIn className="h-3.5 w-3.5" />
                  </div>

                  {/* Elegant Hover Overlay Displaying Event Name, Date & Category */}
                  <div className="absolute inset-x-0 bottom-0 p-4 sm:p-5 flex flex-col justify-end transform translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
                    {/* Category & Date Row */}
                    <div className="flex items-center justify-between gap-2 mb-1.5 opacity-90">
                      <span className="inline-flex items-center gap-1 text-[10px] uppercase font-semibold tracking-wider px-2 py-0.5 rounded-full bg-white/[0.06] border border-white/10 text-neutral-300 backdrop-blur-md">
                        <Sparkles className="h-2.5 w-2.5 text-neutral-400" />
                        <span>{item.category.replace("_", " ")}</span>
                      </span>

                      <div className="flex items-center gap-1 text-[11px] font-medium text-neutral-400 backdrop-blur-sm px-2 py-0.5 rounded-md bg-black/60 border border-white/10 font-mono">
                        <Calendar className="h-3 w-3 text-neutral-400" />
                        <span>{dateStr}</span>
                      </div>
                    </div>

                    {/* Event Name Headline */}
                    <h3 className="text-sm font-bold text-neutral-100 leading-snug tracking-tight line-clamp-2 drop-shadow-md group-hover:text-neutral-300 transition-colors">
                      {eventName}
                    </h3>

                    {/* Secondary Caption if different from Event Name */}
                    {item.title && item.title !== eventName && (
                      <p className="text-[11px] text-neutral-400 line-clamp-1 mt-0.5 font-normal">
                        {item.title}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}


      {/* Lightbox Modal */}
      {activeItem && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={activeItem.title}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-xl p-4 sm:p-8 animate-in fade-in-0 duration-200"
          onClick={() => setActiveMediaIndex(null)}
        >
          {/* Close button */}
          <button
            type="button"
            onClick={() => setActiveMediaIndex(null)}
            className="absolute top-6 right-6 z-50 flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 hover:scale-105 transition-all border border-white/15"
            aria-label="Close Lightbox"
          >
            <X className="h-5 w-5" />
          </button>

          {/* Prev Button */}
          <button
            type="button"
            onClick={handlePrev}
            className="absolute left-4 sm:left-8 z-50 flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 hover:scale-105 transition-all border border-white/15"
            aria-label="Previous Media"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>

          {/* Next Button */}
          <button
            type="button"
            onClick={handleNext}
            className="absolute right-4 sm:right-8 z-50 flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 hover:scale-105 transition-all border border-white/15"
            aria-label="Next Media"
          >
            <ChevronRight className="h-6 w-6" />
          </button>

          {/* Centered Image Container with Meta Card */}
          <div
            className="relative max-h-[88vh] max-w-5xl w-full flex flex-col items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative max-h-[72vh] w-full flex items-center justify-center overflow-hidden rounded-2xl border border-white/15 bg-black shadow-2xl">
              <img
                key={activeItem.id || activeItem.media_url}
                src={activeItem.media_url}
                alt={activeItem.title}
                className="max-h-[72vh] w-auto max-w-full object-contain animate-in fade-in-0 zoom-in-[0.98] duration-500 ease-out"
              />
            </div>

            {/* Lightbox Meta Details */}
            <div className="mt-4 w-full max-w-2xl text-center space-y-1.5 px-4 py-3 rounded-2xl bg-neutral-950/90 backdrop-blur-xl border border-white/15 shadow-2xl">
              <div className="flex items-center justify-center gap-3">
                <span className="text-[10px] uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-full bg-white/10 border border-white/20 text-white">
                  {activeItem.category.replace("_", " ")}
                </span>
                <span className="text-xs text-neutral-400 font-mono">
                  {activeItem.date || "2026"}
                </span>
                <span className="text-xs text-neutral-500 font-mono">
                  {activeMediaIndex! + 1} / {filteredMedia.length}
                </span>
              </div>

              <h2 className="text-base sm:text-lg font-bold text-white leading-tight">
                {activeItem.event_title || activeItem.title || "Showcase"}
              </h2>

              {activeItem.title && activeItem.title !== activeItem.event_title && (
                <p className="text-xs text-neutral-400">{activeItem.title}</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
