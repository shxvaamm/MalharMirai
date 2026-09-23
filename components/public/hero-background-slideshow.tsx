"use client";

import * as React from "react";
import Image from "next/image";
import { useHeroSlides } from "@/lib/hooks/use-hero-slides";
import { HeroSlide } from "@/lib/mock-data";

interface HeroBackgroundSlideshowProps {
  intervalMs?: number;
  opacityClassName?: string;
  /** Server-fetched slides passed from the layout Server Component.
   *  Eliminates the client-side fetch waterfall on first render. */
  initialSlides?: HeroSlide[];
}

export function HeroBackgroundSlideshow({
  intervalMs = 4500,
  opacityClassName = "opacity-70",
  initialSlides,
}: HeroBackgroundSlideshowProps) {
  // Pass initialSlides into the hook so it seeds state with the server-provided
  // admin photos immediately — no flash of dummy/default slides on first render.
  const { activeSlides } = useHeroSlides(initialSlides);
  const [currentIndex, setCurrentIndex] = React.useState(0);

  // Auto-advance slides with smooth cross-fade intervals
  React.useEffect(() => {
    if (activeSlides.length <= 1) return;

    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % activeSlides.length);
    }, intervalMs);

    return () => clearInterval(timer);
  }, [activeSlides.length, intervalMs]);

  // Always render the container — it holds the dark overlay that the whole site needs.
  // When activeSlides is empty (server gave [] and client fetch is still in-flight),
  // the image layer is empty and only the dark tint renders — no stock/dummy image.

  return (
    /*
     * GLOBAL FIXED VIEWPORT BACKGROUND
     * ──────────────────────────────────
     * Rules that make this work correctly:
     *
     * 1. `position: fixed` + `inset: 0` → pins to viewport, not the document.
     *    Content scrolls over it freely. Works on all pages the layout covers.
     *
     * 2. `z-index: -1` → sits below ALL content, navbar, modals, dropdowns.
     *    Using -1 instead of 0 avoids any risk of blocking interactions even
     *    without pointer-events-none (though we still add it for safety).
     *
     * 3. NO `transform`, NO `will-change: transform` on the container wrapper.
     *    Those CSS properties create a new stacking context which would trap
     *    fixed children and break their viewport-relative positioning.
     *    Only slide children use `will-change: opacity` for the fade transition.
     *
     * 4. `overflow: hidden` clips images to the viewport bounds without
     *    creating a stacking context (unlike transform).
     *
     * Root cause of previous failures:
     *    `transform: translateZ(0)` on <body> in globals.css created a stacking
     *    context on body itself, making fixed elements fixed relative to body
     *    (which scrolls) rather than the viewport. Removed in globals.css.
     */
    <div
      aria-hidden="true"
      suppressHydrationWarning
      style={{
        position: "fixed",
        inset: 0,
        width: "100vw",
        height: "100vh",
        zIndex: -1,
        pointerEvents: "none",
        userSelect: "none",
        overflow: "hidden",
      }}
    >
      {/* Slides — cross-fade between images */}
      <div
        suppressHydrationWarning
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          pointerEvents: "none",
        }}
        className={opacityClassName}
      >
        {activeSlides.map((slide, index) => {
          const isActive = index === currentIndex;
          // Priority-load slide 0 (above the fold).
          // Eagerly load slides 1-2 so they're ready before the first transition.
          // The rest lazy-load to avoid wasting bandwidth.
          const isPriority = index === 0;
          const loadingAttr = index <= 2 ? "eager" : "lazy";

          return (
            <div
              key={slide.id}
              style={{
                position: "absolute",
                inset: 0,
                width: "100%",
                height: "100%",
                opacity: isActive ? 1 : 0,
                transition: "opacity 900ms cubic-bezier(0.4, 0, 0.2, 1)",
                zIndex: isActive ? 2 : 1,
                willChange: "opacity",
                pointerEvents: "none",
              }}
            >
              <Image
                src={slide.image_url}
                alt={slide.title || "MALHAR Slideshow"}
                fill
                draggable={false}
                style={{
                  objectFit: "cover",
                  objectPosition: "center",
                  pointerEvents: "none",
                  userSelect: "none",
                }}
                loading={loadingAttr}
                priority={isPriority}
                sizes="100vw"
                quality={90}
              />
            </div>
          );
        })}
      </div>

      {/* Uniform dark tint — keeps text readable on all sections without blurring the image */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "rgba(0,0,0,0.60)",
          zIndex: 5,
          pointerEvents: "none",
        }}
      />
    </div>
  );
}


// ── HeroSlideIndicators ────────────────────────────────────────────────────────
// Kept separate so the homepage can render dots independently of the background.
// Accepts the same initialSlides prop for consistency so both components share
// the same initial data and stay in sync.

interface HeroSlideIndicatorsProps {
  initialSlides?: HeroSlide[];
}

export function HeroSlideIndicators({ initialSlides }: HeroSlideIndicatorsProps = {}) {
  // Pass initialSlides into the hook so indicators start in sync with the background.
  const { activeSlides } = useHeroSlides(initialSlides);
  const [currentIndex, setCurrentIndex] = React.useState(0);
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  React.useEffect(() => {
    if (activeSlides.length <= 1) return;

    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % activeSlides.length);
    }, 4500);

    return () => clearInterval(timer);
  }, [activeSlides.length]);

  // Only hide dots on server / pre-mount to avoid hydration mismatch for indicators
  if (!mounted || activeSlides.length <= 1) {
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

