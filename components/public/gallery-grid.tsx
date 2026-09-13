"use client";

import * as React from "react";
import { X, ChevronLeft, ChevronRight, ZoomIn } from "lucide-react";
import { GalleryMedia } from "@/lib/mock-data";

interface GalleryGridProps {
  media: GalleryMedia[];
}

export function GalleryGrid({ media }: GalleryGridProps) {
  const [activeIndex, setActiveIndex] = React.useState<number | null>(null);
  const activeItem = activeIndex !== null ? media[activeIndex] : null;

  const goNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (activeIndex === null) return;
    setActiveIndex((activeIndex + 1) % media.length);
  };

  const goPrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (activeIndex === null) return;
    setActiveIndex((activeIndex - 1 + media.length) % media.length);
  };

  // Keyboard navigation
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (activeIndex === null) return;
      if (e.key === "Escape") setActiveIndex(null);
      if (e.key === "ArrowRight") setActiveIndex((p) => (p! + 1) % media.length);
      if (e.key === "ArrowLeft") setActiveIndex((p) => (p! - 1 + media.length) % media.length);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [activeIndex, media.length]);

  return (
    <>
      {/* Uniform grid — same size cards, clean crop */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
        {media.map((item, index) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setActiveIndex(index)}
            className="group relative aspect-square w-full overflow-hidden rounded-2xl bg-neutral-900 border border-white/[0.06] hover:border-white/[0.18] transition-all duration-300 cursor-pointer"
            aria-label={item.title || "Gallery photo"}
          >
            <img
              src={item.media_url}
              alt={item.title || ""}
              className="h-full w-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
              loading="lazy"
            />

            {/* Hover overlay — minimal: just a soft gradient + zoom icon */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <div className="p-2 rounded-full bg-black/70 backdrop-blur-md border border-white/15">
                <ZoomIn className="h-4 w-4 text-white" />
              </div>
            </div>

            {/* Photo title — appears on hover at the bottom */}
            {item.title && (
              <div className="absolute inset-x-0 bottom-0 p-3 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                <p className="text-xs font-medium text-neutral-200 line-clamp-1 drop-shadow">
                  {item.title}
                </p>
              </div>
            )}
          </button>
        ))}
      </div>

      {/* Lightbox */}
      {activeItem && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={activeItem.title}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-xl p-4 sm:p-8"
          onClick={() => setActiveIndex(null)}
        >
          {/* Close */}
          <button
            type="button"
            onClick={() => setActiveIndex(null)}
            className="absolute top-5 right-5 z-50 h-10 w-10 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 border border-white/15 text-white transition-all"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>

          {/* Prev */}
          <button
            type="button"
            onClick={goPrev}
            className="absolute left-4 sm:left-8 z-50 h-11 w-11 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 border border-white/15 text-white transition-all"
            aria-label="Previous"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>

          {/* Next */}
          <button
            type="button"
            onClick={goNext}
            className="absolute right-4 sm:right-8 z-50 h-11 w-11 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 border border-white/15 text-white transition-all"
            aria-label="Next"
          >
            <ChevronRight className="h-5 w-5" />
          </button>

          {/* Image */}
          <div
            className="relative max-h-[88vh] max-w-5xl w-full flex flex-col items-center gap-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative w-full flex items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-black">
              <img
                key={activeItem.id}
                src={activeItem.media_url}
                alt={activeItem.title}
                className="max-h-[75vh] w-auto max-w-full object-contain"
              />
            </div>

            {/* Minimal meta strip */}
            {activeItem.title && (
              <div className="flex items-center gap-3 text-xs text-neutral-400">
                <span className="font-medium text-neutral-200">{activeItem.title}</span>
                <span className="text-neutral-600">·</span>
                <span className="font-mono">{activeIndex! + 1} / {media.length}</span>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
