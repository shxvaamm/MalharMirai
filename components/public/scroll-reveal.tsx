"use client";

/**
 * ScrollReveal — Framer Motion whileInView wrapper
 * ─────────────────────────────────────────────────
 * Drop-in replacement for the previous IntersectionObserver + CSS class version.
 * All existing call sites continue to work — same prop API, same variant names.
 *
 * Upgrade: uses Framer Motion `whileInView` + `viewport={{ once: true }}`
 * for richer, composable animations vs the old CSS class toggle.
 *
 * Reduced motion: if the user prefers reduced motion, the element renders
 * immediately in its "visible" state (no animation at all).
 */

import * as React from "react";
import { motion, useReducedMotion } from "framer-motion";
import type { MotionProps } from "framer-motion";
import { FADE_UP, SLIDE_LEFT, SLIDE_RIGHT, SCALE_IN, DURATION, EASE_OUT } from "@/lib/motion";

type RevealVariant = "reveal" | "reveal-left" | "reveal-right" | "reveal-scale";

interface ScrollRevealProps {
  children:   React.ReactNode;
  className?: string;
  variant?:   RevealVariant;
  /** Delay in milliseconds (converted to seconds for Framer) */
  delay?:     number;
  /** 0–1 — fraction of element visible before triggering (default 0.2) */
  threshold?: number;
  /** Wrapper element type (default div) */
  as?:        React.ElementType;
  /**
   * Stagger children in a grid — adds Framer staggerChildren to the container.
   * When true, wrap direct children in <ScrollRevealItem> for stagger effect.
   */
  stagger?:   boolean;
}

const VARIANT_MAP = {
  "reveal":       FADE_UP,
  "reveal-left":  SLIDE_LEFT,
  "reveal-right": SLIDE_RIGHT,
  "reveal-scale": SCALE_IN,
} as const;

const STAGGER_CONTAINER_VARIANT = {
  hidden:  {},
  visible: {
    transition: {
      staggerChildren: 0.07,
      delayChildren:   0.04,
    },
  },
};

export function ScrollReveal({
  children,
  className = "",
  variant   = "reveal",
  delay     = 0,
  threshold = 0.2,
  as: Tag   = "div",
  stagger   = false,
}: ScrollRevealProps) {
  const prefersReducedMotion = useReducedMotion();

  // If reduced motion is preferred, render statically with no animation
  if (prefersReducedMotion) {
    const StaticTag = Tag as React.ElementType;
    return <StaticTag className={className}>{children}</StaticTag>;
  }

  const MotionTag = motion[Tag as keyof typeof motion] as React.ElementType ?? motion.div;

  const variants = stagger
    ? STAGGER_CONTAINER_VARIANT
    : VARIANT_MAP[variant];

  const motionProps: MotionProps = {
    variants,
    initial:    "hidden",
    whileInView: "visible",
    viewport:   { once: true, amount: threshold },
    transition: stagger
      ? undefined  // stagger container uses its own transition via variants
      : { duration: DURATION.base, ease: EASE_OUT, delay: delay / 1000 },
  };

  return (
    <MotionTag className={className} {...motionProps}>
      {children}
    </MotionTag>
  );
}

/**
 * ScrollRevealItem — Used inside a stagger ScrollReveal container.
 * Each direct child wraps itself with this to participate in the cascade.
 */
export function ScrollRevealItem({
  children,
  className = "",
  variant   = "reveal",
}: {
  children:  React.ReactNode;
  className?: string;
  variant?:  RevealVariant;
}) {
  const prefersReducedMotion = useReducedMotion();

  if (prefersReducedMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      className={className}
      variants={VARIANT_MAP[variant]}
      transition={{ duration: DURATION.base, ease: EASE_OUT }}
    >
      {children}
    </motion.div>
  );
}
