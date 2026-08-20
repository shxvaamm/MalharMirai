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
      className="absolute inset-x-0 top-0 h-[calc(100dvh-4rem)] md:h-[calc(100dvh-5rem)] w-full pointer-events-none select-none z-0 overflow-hidden bg-black"
    >
      {/* Slides — Cross-fading uncropped photographs fitting full viewport */}
      <div
        suppressHydrationWarning
        className={`absolute inset-0 h-full w-full pointer-events-none select-none ${opacityClassName}`}
      >
        {activeSlides.map((slide, index) => {
          const isActive = index === currentIndex;

          return (
            <div
              key={slide.id}
              className="absolute inset-0 w-full h-full slide-layer overflow-hidden pointer-events-none select-none flex items-center justify-center"
              style={{
                opacity: isActive ? 1 : 0,
                transition: "opacity 900ms cubic-bezier(0.4, 0, 0.2, 1)",
                zIndex: isActive ? 2 : 1,
              }}
            >
              {/* Visually appropriate ambient blurred background behind the image */}
              <div className="absolute inset-0 w-full h-full overflow-hidden opacity-25 filter blur-3xl scale-110 pointer-events-none select-none">
                <Image
                  src={slide.image_url}
                  alt=""
                  fill
                  draggable={false}
                  className="object-cover object-center w-full h-full pointer-events-none select-none"
                  unoptimized
                />
              </div>

              {/* Full Uncropped Photograph — Maintaining 100% natural aspect ratio with object-contain */}
              <div className="relative w-full h-full flex items-center justify-center p-2 sm:p-4 md:p-6 pointer-events-none select-none">
                <Image
                  src={slide.image_url}
                  alt={slide.title || "MALHAR Slideshow"}
                  fill
                  draggable={false}
                  className="object-contain object-center w-full h-full pointer-events-none select-none drop-shadow-[0_10px_35px_rgba(0,0,0,0.85)]"
                  loading={index === 0 ? "eager" : "lazy"}
                  priority={index === 0}
                  sizes="100vw"
                  unoptimized
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Gentle readability overlays: top scrim and bottom fade */}
      <div className="absolute inset-0 bg-black/40 pointer-events-none select-none" />
      <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-black pointer-events-none select-none" />
    </div>
  );
}

