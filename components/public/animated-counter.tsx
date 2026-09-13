"use client";

/**
 * AnimatedCounter — Count-up animation for stat numbers.
 *
 * Features:
 * - Parses strings like "7+", "5+" → animates numeric part, appends suffix
 * - Uses requestAnimationFrame for smooth easeOut animation
 * - Triggered by IntersectionObserver (once) — only counts when in view
 * - Falls back to static text when prefers-reduced-motion is set
 * - No external dependency (pure rAF hook)
 *
 * Usage:
 *   <AnimatedCounter value="7+" duration={900} className="..." />
 */

import * as React from "react";
import { useReducedMotion } from "framer-motion";

interface AnimatedCounterProps {
  /** Stat string, e.g. "7+", "5+", "100" */
  value:       string;
  /** Animation duration in ms (default 900) */
  duration?:   number;
  className?:  string;
}

function parseStatValue(raw: string): { num: number; suffix: string } {
  const match = raw.match(/^(\d+)(.*)$/);
  if (!match) return { num: 0, suffix: raw };
  return { num: parseInt(match[1], 10), suffix: match[2] ?? "" };
}

function easeOut(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

export function AnimatedCounter({
  value,
  duration = 900,
  className = "",
}: AnimatedCounterProps) {
  const prefersReducedMotion = useReducedMotion();
  const { num, suffix } = parseStatValue(value);
  const [count, setCount] = React.useState(0);
  const [hasAnimated, setHasAnimated] = React.useState(false);
  const containerRef = React.useRef<HTMLSpanElement>(null);

  React.useEffect(() => {
    // Instantly show final value if reduced motion is preferred
    if (prefersReducedMotion) {
      setCount(num);
      return;
    }

    const el = containerRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated) {
          setHasAnimated(true);
          observer.unobserve(el);

          const startTime = performance.now();

          const tick = (now: number) => {
            const elapsed = now - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const eased = easeOut(progress);
            setCount(Math.round(eased * num));

            if (progress < 1) {
              requestAnimationFrame(tick);
            } else {
              setCount(num); // ensure we land exactly on the final value
            }
          };

          requestAnimationFrame(tick);
        }
      },
      { threshold: 0.5 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [num, duration, hasAnimated, prefersReducedMotion]);

  return (
    <span ref={containerRef} className={className}>
      {count}{suffix}
    </span>
  );
}
