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
    <div
      aria-hidden="true"
      suppressHydrationWarning
      className="fixed inset-0 w-full h-full pointer-events-none select-none z-0 overflow-hidden"
    >
      {/* Slides — Smooth 900ms ease-in-out cross-fade spanning full horizontal length */}
      <div
        suppressHydrationWarning
        className={`absolute inset-0 h-full w-full pointer-events-none select-none ${opacityClassName}`}
      >
        {activeSlides.map((slide, index) => {
          const isActive = index === currentIndex;

          return (
            <div
              key={slide.id}
              className="absolute inset-0 w-full h-full slide-layer overflow-hidden pointer-events-none select-none"
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

      {/* Clean full-width horizontal gradient overlay without side-cutoff vignette */}
      <div className="absolute inset-0 bg-black/35 pointer-events-none select-none" />
      <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/25 to-black pointer-events-none select-none" />
    </div>
  );
}

