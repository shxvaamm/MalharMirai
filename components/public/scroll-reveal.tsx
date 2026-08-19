"use client";

import * as React from "react";

type RevealVariant = "reveal" | "reveal-left" | "reveal-right" | "reveal-scale";

interface ScrollRevealProps {
  children: React.ReactNode;
  className?: string;
  variant?: RevealVariant;
  delay?: number;       // ms
  threshold?: number;   // 0–1
  as?: React.ElementType;
  stagger?: boolean;    // adds stagger-children to the wrapper
}

/**
 * Wraps children and animates them into view when they enter the viewport.
 * Uses IntersectionObserver — zero layout jank, no layout thrashing.
 * rootMargin triggers reveal slightly before element is fully in view.
 */
export function ScrollReveal({
  children,
  className = "",
  variant = "reveal",
  delay = 0,
  threshold = 0.08,
  as: Tag = "div",
  stagger = false,
}: ScrollRevealProps) {
  const ref = React.useRef<HTMLElement>(null);

  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Apply delay inline before observing to avoid FOUC
    if (delay) el.style.transitionDelay = `${delay}ms`;

    // Check if already visible (e.g. above the fold on load)
    const rect = el.getBoundingClientRect();
    if (rect.top < window.innerHeight && rect.bottom > 0) {
      // Small rAF so CSS transition has time to register
      requestAnimationFrame(() => {
        el.classList.add("reveal-visible");
      });
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.classList.add("reveal-visible");
          observer.unobserve(el); // fire once
        }
      },
      { threshold, rootMargin: "0px 0px -32px 0px" }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [delay, threshold]);

  return (
    // @ts-ignore — dynamic tag
    <Tag
      ref={ref}
      className={`${variant} ${stagger ? "stagger-children" : ""} ${className}`}
    >
      {children}
    </Tag>
  );
}
