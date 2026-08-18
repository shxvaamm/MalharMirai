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
      className="fixed inset-x-0 top-16 md:top-20 bottom-0 pointer-events-none z-0 overflow-hidden"
    >
      {/* Slides — Smooth 1s ease-in-out cross-fade with subtle scale effect */}
      <div
        suppressHydrationWarning
        className={`absolute inset-0 h-full w-full pointer-events-none ${opacityClassName}`}
      >
        {activeSlides.map((slide, index) => {
          const isActive = index === currentIndex;

          return (
            <div
              key={slide.id}
              className="absolute inset-0 slide-layer overflow-hidden pointer-events-none"
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
                className="object-cover object-center pointer-events-none select-auto"
                loading={index === 0 ? "eager" : "lazy"}
                priority={index === 0}
                sizes="100vw"
                unoptimized
              />
            </div>
          );
        })}
      </div>

      {/* Combined gradient overlay */}
      <div className="absolute inset-0 bg-black/25 pointer-events-none" />
      <div className="absolute inset-0 bg-gradient-to-b from-black/15 via-black/45 to-black [background:radial-gradient(ellipse_at_center,transparent_30%,#000_90%),linear-gradient(to_bottom,rgba(0,0,0,.15),rgba(0,0,0,.45),#000)] pointer-events-none" />
    </div>
  );
}

