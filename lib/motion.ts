/**
 * lib/motion.ts — Malhar Shared Animation Constants
 * ──────────────────────────────────────────────────
 * Single source of truth for all Framer Motion variants, easings, and
 * duration tokens used across the site. Consistent timing is what makes
 * the site feel "smooth" — not any single flashy effect.
 *
 * Usage:
 *   import { FADE_UP, STAGGER_CHILDREN, EASE_OUT, DURATION } from "@/lib/motion"
 */

// ── Easing functions ─────────────────────────────────────────────────────────
// Matches the cubic-bezier already used in globals.css animations
export const EASE_OUT  = [0.16, 1, 0.3, 1] as const;
export const EASE_IN   = [0.4, 0, 1, 1] as const;
export const EASE_INOUT = [0.4, 0, 0.2, 1] as const;

// ── Duration tokens (seconds) ────────────────────────────────────────────────
export const DURATION = {
  instant: 0.10,
  fast:    0.18,
  base:    0.38,
  slow:    0.55,
  slower:  0.72,
} as const;

// ── Spring presets ────────────────────────────────────────────────────────────
export const SPRING_SNAPPY = { type: "spring" as const, stiffness: 400, damping: 35 };
export const SPRING_GENTLE = { type: "spring" as const, stiffness: 280, damping: 28 };

// ── Core animation variants ───────────────────────────────────────────────────

/** Fade up — primary reveal for text blocks and cards */
export const FADE_UP = {
  hidden:  { opacity: 0, y: 14 },
  visible: { opacity: 1, y: 0  },
};

/** Fade in — no Y translation (for stat counters, badges) */
export const FADE_IN = {
  hidden:  { opacity: 0 },
  visible: { opacity: 1 },
};

/** Scale + fade — for cards that pop in */
export const SCALE_IN = {
  hidden:  { opacity: 0, scale: 0.95 },
  visible: { opacity: 1, scale: 1    },
};

/** Slide from left */
export const SLIDE_LEFT = {
  hidden:  { opacity: 0, x: -24 },
  visible: { opacity: 1, x: 0   },
};

/** Slide from right */
export const SLIDE_RIGHT = {
  hidden:  { opacity: 0, x: 24 },
  visible: { opacity: 1, x: 0  },
};

// ── Stagger containers ─────────────────────────────────────────────────────────
/** Standard stagger — 70ms between children (good for 3–8 items) */
export const STAGGER_CONTAINER = {
  hidden:  {},
  visible: {
    transition: {
      staggerChildren: 0.07,
      delayChildren:   0.05,
    },
  },
};

/** Tight stagger — 50ms (for dense grids or many items) */
export const STAGGER_TIGHT = {
  hidden:  {},
  visible: {
    transition: {
      staggerChildren: 0.05,
      delayChildren:   0.02,
    },
  },
};

/** Loose stagger — 110ms (for large hero sections with few items) */
export const STAGGER_LOOSE = {
  hidden:  {},
  visible: {
    transition: {
      staggerChildren: 0.11,
      delayChildren:   0.08,
    },
  },
};

// ── Default whileInView viewport config ────────────────────────────────────────
/** Use as: viewport={VIEWPORT_ONCE} — fires once, 20% in view */
export const VIEWPORT_ONCE = { once: true, amount: 0.2 } as const;

/** Stricter trigger — 30% in view (for large sections) */
export const VIEWPORT_STRICT = { once: true, amount: 0.3 } as const;

// ── Convenience transition objects ─────────────────────────────────────────────
export const TRANSITION_BASE = {
  duration: DURATION.base,
  ease:     EASE_OUT,
} as const;

export const TRANSITION_FAST = {
  duration: DURATION.fast,
  ease:     EASE_OUT,
} as const;

export const TRANSITION_SLOW = {
  duration: DURATION.slow,
  ease:     EASE_OUT,
} as const;

// Re-export Framer's reduced-motion hook for use in animated components
export { useReducedMotion } from "framer-motion";
