"use client";

/**
 * ScrollReveal — Pure CSS IntersectionObserver reveal wrapper.
 * ─────────────────────────────────────────────────────────────
 * Replaces the previous Framer Motion whileInView implementation.
 * Zero framer-motion dependency. Uses the existing CSS classes defined
 * in globals.css: .reveal, .reveal-left, .reveal-right, .reveal-scale,
 * .reveal-visible, .stagger-children, .stagger-item, .is-revealed.
 *
 * API is fully backward-compatible — all existing call sites work unchanged.
 *
 * Reduced motion: if prefers-reduced-motion is set, the element renders
 * immediately visible with no animation (matches previous behaviour).
 */

import * as React from "react";

type RevealVariant = "reveal" | "reveal-left" | "reveal-right" | "reveal-scale";

interface ScrollRevealProps {
  children:   React.ReactNode;
  className?: string;
  variant?:   RevealVariant;
  /** Delay in milliseconds */
  delay?:     number;
  /** 0–1 — fraction of element visible before triggering (default 0.2) */
  threshold?: number;
  /** Wrapper element type (default div) */
  as?:        React.ElementType;
  /**
   * Stagger children — adds sequential transition-delays to direct children.
   * Wrap direct children in <ScrollRevealItem> for per-item control,
   * or use bare children which will receive the stagger-item class automatically.
   */
  stagger?:   boolean;
}

/** Map variant prop to the CSS class from globals.css */
const VARIANT_CLASS: Record<RevealVariant, string> = {
  "reveal":       "reveal",
  "reveal-left":  "reveal-left",
  "reveal-right": "reveal-right",
  "reveal-scale": "reveal-scale",
};

function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function ScrollReveal({
  children,
  className = "",
  variant   = "reveal",
  delay     = 0,
  threshold = 0.05,
  as: Tag   = "div",
  stagger   = false,
}: ScrollRevealProps) {
  const ref = React.useRef<HTMLElement>(null);

  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const triggerReveal = () => {
      el.classList.add("reveal-visible");
      if (stagger) {
        el.querySelectorAll<HTMLElement>(":scope > .stagger-item").forEach((child) => {
          child.classList.add("is-revealed");
        });
      }
    };

    // Skip animation entirely for reduced-motion users
    if (prefersReducedMotion()) {
      el.style.opacity = "1";
      el.style.transform = "none";
      if (stagger) {
        el.querySelectorAll<HTMLElement>(":scope > *").forEach((child) => {
          child.style.opacity = "1";
          child.style.transform = "none";
        });
      }
      return;
    }

    if (typeof IntersectionObserver === "undefined") {
      triggerReveal();
      return;
    }

    // Dynamic threshold: If the element is tall relative to the viewport
    // (e.g. on mobile where cards stack in 1 column creating a 5,000px+ tall grid),
    // a threshold of 0.2 is physically impossible to reach because the intersection ratio
    // can never exceed (viewportHeight / elementHeight). In that case, safeThreshold MUST be 0
    // so it reveals immediately when the element scrolls into view.
    const isTall = el.offsetHeight > (typeof window !== "undefined" ? window.innerHeight * 0.4 : 400);
    const safeThreshold = isTall ? 0 : Math.min(threshold, 0.05);

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        observer.unobserve(el);
        clearTimeout(safetyTimer);
        triggerReveal();
      },
      { threshold: safeThreshold }
    );
    observer.observe(el);

    // Fallback: If for any reason IntersectionObserver callback doesn't fire
    // (e.g. mobile viewport zoom or browser layout delays), ensure content is never stuck invisible
    const safetyTimer = setTimeout(() => {
      observer.disconnect();
      triggerReveal();
    }, 2000);

    return () => {
      clearTimeout(safetyTimer);
      observer.disconnect();
    };
  }, [stagger, threshold]);

  const variantClass = VARIANT_CLASS[variant];

  // For stagger, children are cloned to inject stagger-item + --reveal-i (capped to max 8 items)
  const renderedChildren = stagger
    ? React.Children.map(children, (child, i) => {
        if (!React.isValidElement(child)) return child;
        return React.cloneElement(child as React.ReactElement<any>, {
          className: [
            "stagger-item",
            (child.props as any).className ?? "",
          ]
            .join(" ")
            .trim(),
          style: {
            ...((child.props as any).style ?? {}),
            "--reveal-i": Math.min(i, 8),
          },
        });
      })
    : children;

  return React.createElement(
    Tag as string,
    {
      ref,
      className: [variantClass, className].join(" ").trim(),
      style: delay > 0 ? { transitionDelay: `${delay}ms` } : undefined,
    },
    renderedChildren
  );
}

/**
 * ScrollRevealItem — Wraps a single child for use inside a stagger ScrollReveal.
 * Apply className and variant as needed; the parent stagger container handles
 * the IntersectionObserver trigger.
 */
export function ScrollRevealItem({
  children,
  className = "",
}: {
  children:  React.ReactNode;
  className?: string;
}) {
  // Just a pass-through; the parent ScrollReveal adds stagger-item + --reveal-i
  return <div className={className}>{children}</div>;
}
