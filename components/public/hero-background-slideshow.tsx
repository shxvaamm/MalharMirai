"use client";

import * as React from "react";
import Image from "next/image";
import { useHeroSlides } from "@/lib/hooks/use-hero-slides";

interface HeroBackgroundSlideshowProps {
  intervalMs?: number;
  opacityClassName?: string;
}

export function HeroBackgroundSlideshow({
  intervalMs = 4500,
  opacityClassName = "opacity-70",
}: HeroBackgroundSlideshowProps) {
  const { activeSlides } = useHeroSlides();
  const [currentIndex, setCurrentIndex] = React.useState(0);
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  // Auto-advance slides with smooth cross-fade intervals
  React.useEffect(() => {
    if (!activeSlides || activeSlides.length <= 1) return;

    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % activeSlides.length);
    }, intervalMs);

    return () => clearInterval(timer);
  }, [activeSlides, intervalMs]);

  if (!mounted || !activeSlides || activeSlides.length === 0) {
    return null;
  }

  return (
    /*
     * FIXED VIEWPORT BACKGROUND
     * ─────────────────────────
     * `fixed` pins the element to the viewport, not the document.
     * It is removed from normal flow so content scrolls freely over it.
     * `pointer-events-none` on every layer ensures links/buttons stay clickable.
     * `z-0` keeps it behind the navbar (z-50) and main content (z-10).
     *
     * Mobile note: `position: fixed` is reliable across all modern mobile browsers.
     * We intentionally avoid `background-attachment: fixed` (CSS-only) because
     * iOS Safari disables it on <video> / scroll containers. This JS approach
     * with `position: fixed` is the most cross-browser-compatible solution.
     */
    <div
      aria-hidden="true"
      suppressHydrationWarning
      className="fixed inset-0 w-full h-full pointer-events-none select-none z-0 overflow-hidden"
    >
      {/* Slides Container */}
      <div
        suppressHydrationWarning
        className={`absolute inset-0 h-full w-full pointer-events-none select-none ${opacityClassName}`}
      >
        {activeSlides.map((slide, index) => {
          const isActive = index === currentIndex;

          return (
            <div
              key={slide.id}
              className="absolute inset-0 w-full h-full pointer-events-none select-none"
              style={{
                opacity: isActive ? 1 : 0,
                transition: "opacity 900ms cubic-bezier(0.4, 0, 0.2, 1)",
                zIndex: isActive ? 2 : 1,
              }}
            >
              <Image
                src={slide.image_url}
                alt={slide.title || "MALHAR Slideshow"}
                fill
                draggable={false}
                className="object-cover object-center w-full h-full pointer-events-none select-none"
                loading={index === 0 ? "eager" : "lazy"}
                priority={index === 0}
                sizes="100vw"
                unoptimized
              />
            </div>
          );
        })}
      </div>

      {/* Overlays: dark tint for text readability + vertical fade to black at bottom */}
      <div className="absolute inset-0 bg-black/30 pointer-events-none select-none" style={{ zIndex: 3 }} />
      <div className="absolute inset-0 bg-gradient-to-b from-black/55 via-black/10 via-60% to-black pointer-events-none select-none" style={{ zIndex: 4 }} />
    </div>
  );
}

export function HeroSlideIndicators() {
  const { activeSlides } = useHeroSlides();
  const [currentIndex, setCurrentIndex] = React.useState(0);
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  React.useEffect(() => {
    if (!activeSlides || activeSlides.length <= 1) return;

    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % activeSlides.length);
    }, 4500);

    return () => clearInterval(timer);
  }, [activeSlides]);

  if (!mounted || !activeSlides || activeSlides.length <= 1) {
    return null;
  }

  return (
    <div className="flex items-center justify-center gap-1.5 sm:gap-2 pt-6 pointer-events-auto select-none">
      {activeSlides.map((slide, index) => (
        <span
          key={slide.id}
          className={`h-1.5 rounded-full transition-all duration-300 ${
            index === currentIndex
              ? "w-7 sm:w-8 bg-white shadow-[0_0_10px_rgba(255,255,255,0.8)]"
              : "w-2 bg-white/30"
          }`}
        />
      ))}
    </div>
  );
}

