"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { X, ChevronLeft, ChevronRight, ZoomIn, Image as ImageIcon, Play } from "lucide-react";
import { GalleryMedia } from "@/lib/mock-data";
import {
  SCALE_IN,
  DURATION,
  EASE_OUT,
  VIEWPORT_ONCE,
  useReducedMotion,
} from "@/lib/motion";

interface GalleryCardProps {
  item: GalleryMedia;
  index: number;
  onClick: () => void;
}

function GalleryCard({ item, index, onClick }: GalleryCardProps) {
  const [imageLoaded, setImageLoaded] = React.useState(false);
  const [hasError, setHasError] = React.useState(false);
  const prefersReducedMotion = useReducedMotion();

  return (
    <motion.div
      variants={prefersReducedMotion ? undefined : SCALE_IN}
      initial={prefersReducedMotion ? undefined : { opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.32, ease: "easeOut", delay: (index % 6) * 0.04 }}
      className="break-inside-avoid mb-3 sm:mb-4 group rounded-2xl sm:rounded-3xl overflow-hidden bg-[#0D0D0D]/90 border border-white/[0.08] hover:border-white/20 transition-all duration-300 shadow-xl cursor-pointer block w-full text-left"
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick();
        }
      }}
      aria-label={item.title || "Gallery photo"}
    >
      {/* Image Container with robust aspect ratio & skeleton */}
      <div className="relative w-full min-h-[180px] bg-neutral-900/90 overflow-hidden flex items-center justify-center">
        {/* Subtle skeleton loader while image is loading */}
        {!imageLoaded && !hasError && (
          <div className="absolute inset-0 bg-neutral-900 animate-pulse flex items-center justify-center">
            <ImageIcon className="h-6 w-6 text-neutral-700 animate-pulse" />
          </div>
        )}

        {hasError ? (
          <div className="py-12 px-4 flex flex-col items-center justify-center text-neutral-500 gap-2 w-full text-center">
            <ImageIcon className="h-8 w-8 text-neutral-600" />
            <span className="text-[11px] text-neutral-400">Photo Showcase</span>
          </div>
        ) : (
          <img
            src={item.media_url}
            alt={item.title || "Gallery photo"}
            className={`w-full h-auto block object-cover group-hover:scale-105 transition-transform duration-500 ${
              imageLoaded ? "opacity-100" : "opacity-0"
            }`}
            loading="lazy"
            onLoad={() => setImageLoaded(true)}
            onError={() => setHasError(true)}
          />
        )}

        {/* Video play overlay if video media */}
        {item.media_type === "video" && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/30">
            <div className="h-9 w-9 rounded-full bg-white/90 text-neutral-950 flex items-center justify-center shadow-lg">
              <Play className="h-4 w-4 fill-current ml-0.5" />
            </div>
          </div>
        )}

        {/* Hover overlay — minimal gradient + zoom indicator */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
        <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
          <div className="p-1.5 rounded-full bg-black/70 backdrop-blur-md border border-white/20 text-white shadow-md">
            <ZoomIn className="h-3.5 w-3.5" />
          </div>
        </div>
      </div>

      {/* Visible Metadata Panel below the image */}
      <div className="p-3 sm:p-4 space-y-1.5 bg-[#0D0D0D]/90 border-t border-white/[0.04]">
        {/* Event / Category Tag Pill */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider bg-white/[0.08] text-neutral-300 border border-white/10">
            {(item.category as string) === "previous_events" || (item.category as string) === "events"
              ? "Event"
              : item.category === "workshops"
              ? "Workshop"
              : item.category === "general"
              ? "Campus"
              : (item.category as string) || "Showcase"}
          </span>
          {item.event_title && (
            <span className="text-[10px] text-neutral-400 truncate max-w-[130px]">
              {item.event_title}
            </span>
          )}
        </div>

        {/* Title */}
        <h3 className="text-xs sm:text-sm font-bold text-neutral-100 line-clamp-1 leading-snug group-hover:text-white transition-colors">
          {item.title || "Untitled Capture"}
        </h3>

        {/* Description / Subtext */}
        <p className="text-[11px] text-neutral-400 line-clamp-2 leading-relaxed">
          {item.event_title || item.date || "MALHAR Society Visual Archive"}
        </p>
      </div>
    </motion.div>
  );
}

interface GalleryGridProps {
  media: GalleryMedia[];
}

export function GalleryGrid({ media }: GalleryGridProps) {
  const [activeIndex, setActiveIndex] = React.useState<number | null>(null);
  const [selectedCategory, setSelectedCategory] = React.useState<string>("all");
  const prefersReducedMotion = useReducedMotion();

  // Categories extracted from available media
  const categories = React.useMemo(() => {
    const set = new Set<string>();
    media.forEach((item) => {
      if (item.category) set.add(item.category);
    });
    const list = Array.from(set);
    return [
      { id: "all", label: "All" },
      ...list.map((cat) => ({
        id: cat,
        label:
          cat === "previous_events" || cat === "events"
            ? "Event"
            : cat === "workshops"
            ? "Workshop"
            : cat === "general"
            ? "Campus"
            : cat.charAt(0).toUpperCase() + cat.slice(1).replace(/_/g, " "),
      })),
    ];
  }, [media]);

  const filteredMedia = React.useMemo(() => {
    if (selectedCategory === "all") return media;
    return media.filter(
      (m) =>
        m.category === selectedCategory ||
        (selectedCategory === "previous_events" && ((m.category as string) === "events" || !!m.event_title))
    );
  }, [media, selectedCategory]);

  const activeItem = activeIndex !== null ? filteredMedia[activeIndex] : null;

  const goNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (activeIndex === null) return;
    setActiveIndex((activeIndex + 1) % filteredMedia.length);
  };

  const goPrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (activeIndex === null) return;
    setActiveIndex((activeIndex - 1 + filteredMedia.length) % filteredMedia.length);
  };

  // Keyboard navigation
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (activeIndex === null) return;
      if (e.key === "Escape") setActiveIndex(null);
      if (e.key === "ArrowRight") setActiveIndex((p) => (p! + 1) % filteredMedia.length);
      if (e.key === "ArrowLeft") setActiveIndex((p) => (p! - 1 + filteredMedia.length) % filteredMedia.length);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [activeIndex, filteredMedia.length]);

  return (
    <div className="space-y-8">
      {/* Category Filter Pills (Centered above grid, matching Kaizen reference) */}
      {categories.length > 1 && (
        <div className="flex items-center justify-center gap-2 flex-wrap">
          {categories.map((cat) => {
            const isActive = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => {
                  setSelectedCategory(cat.id);
                  setActiveIndex(null);
                }}
                className={`px-4 py-1.5 rounded-full text-xs font-semibold tracking-wide transition-all duration-200 cursor-pointer ${
                  isActive
                    ? "bg-white text-neutral-950 shadow-md font-bold"
                    : "bg-white/[0.05] text-neutral-400 hover:text-neutral-100 hover:bg-white/[0.09] border border-white/10"
                }`}
              >
                {cat.label}
              </button>
            );
          })}
        </div>
      )}

      {/* Multi-column CSS Masonry Layout */}
      <div className="columns-2 sm:columns-3 lg:columns-4 gap-3 sm:gap-4">
        {filteredMedia.map((item, index) => (
          <GalleryCard
            key={item.id}
            item={item}
            index={index}
            onClick={() => setActiveIndex(index)}
          />
        ))}
      </div>

      {/* Lightbox Modal */}
      {activeItem && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={activeItem.title}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-xl p-4 sm:p-8"
          onClick={() => setActiveIndex(null)}
        >
          {/* Close Button */}
          <button
            type="button"
            onClick={() => setActiveIndex(null)}
            className="absolute top-5 right-5 z-50 h-10 w-10 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 border border-white/15 text-white transition-all cursor-pointer"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>

          {/* Previous Button */}
          {filteredMedia.length > 1 && (
            <button
              type="button"
              onClick={goPrev}
              className="absolute left-4 sm:left-8 z-50 h-11 w-11 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 border border-white/15 text-white transition-all cursor-pointer"
              aria-label="Previous"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
          )}

          {/* Next Button */}
          {filteredMedia.length > 1 && (
            <button
              type="button"
              onClick={goNext}
              className="absolute right-4 sm:right-8 z-50 h-11 w-11 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 border border-white/15 text-white transition-all cursor-pointer"
              aria-label="Next"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          )}

          {/* Lightbox Image Stage */}
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

            {/* Lightbox Metadata Strip */}
            <div className="flex items-center gap-3 text-xs text-neutral-400">
              <span className="font-medium text-neutral-200">{activeItem.title}</span>
              <span className="text-neutral-600">·</span>
              <span className="font-mono">{activeIndex! + 1} / {filteredMedia.length}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
