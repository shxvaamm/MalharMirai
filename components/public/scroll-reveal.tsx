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
 */
export function ScrollReveal({
  children,
  className = "",
  variant = "reveal",
  delay = 0,
  threshold = 0.12,
  as: Tag = "div",
  stagger = false,
}: ScrollRevealProps) {
  const ref = React.useRef<HTMLElement>(null);

  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.classList.add("reveal-visible");
          observer.unobserve(el); // fire once
        }
      },
      { threshold }
    );

    // Apply delay inline
    if (delay) el.style.transitionDelay = `${delay}ms`;

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
