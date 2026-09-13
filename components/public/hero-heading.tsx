"use client";

/**
 * HeroHeading — Staggered word-by-word reveal for the homepage hero.
 *
 * Architecture note:
 *   The parent (page.tsx) is a Server Component. We extract only the animated
 *   heading into this client component so the rest of the page stays server-
 *   rendered. Props carry the text segments from the server.
 *
 * Animation:
 *   - Parent motion.div: staggerChildren via STAGGER_LOOSE
 *   - Each word span: FADE_UP variant (opacity 0→1, y 14→0)
 *   - Respects prefers-reduced-motion — renders static if user prefers it.
 */

import * as React from "react";
import { motion, useReducedMotion } from "framer-motion";
import { FADE_UP, STAGGER_LOOSE, DURATION, EASE_OUT } from "@/lib/motion";

interface HeroHeadingProps {
  /** Plain text prefix before the gradient span, e.g. "The Rhythm & Creative Pulse of" */
  prefix: string;
  /** Gradient-highlighted text, e.g. "Mirai School of Technology" */
  highlight: string;
  className?: string;
}

function splitWords(text: string): string[] {
  return text.trim().split(/\s+/);
}

const HERO_STAGGER = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.035,
      delayChildren: 0.02,
    },
  },
};

const WORD_TRANSITION = {
  duration: 0.26,
  ease: EASE_OUT,
};

export function HeroHeading({ prefix, highlight, className = "" }: HeroHeadingProps) {
  const prefersReducedMotion = useReducedMotion();

  const prefixWords   = splitWords(prefix);
  const highlightWords = splitWords(highlight);

  // If user prefers reduced motion, render the heading statically (no animation).
  if (prefersReducedMotion) {
    return (
      <h1 className={className}>
        {prefix}{" "}
        <br className="hidden sm:inline" />
        <span className="text-transparent bg-clip-text bg-gradient-to-b from-white via-neutral-200 to-neutral-300">
          {highlight}
        </span>
      </h1>
    );
  }

  return (
    <motion.h1
      className={className}
      variants={HERO_STAGGER}
      initial="hidden"
      animate="visible"
    >
      {/* Prefix words — plain white */}
      {prefixWords.map((word, i) => (
        <motion.span
          key={`prefix-${i}`}
          variants={FADE_UP}
          transition={WORD_TRANSITION}
          style={{ display: "inline-block", marginRight: "0.28em" }}
        >
          {word}
        </motion.span>
      ))}

      {/* Responsive break before the highlighted school name */}
      <br className="hidden sm:inline" />

      {/* Highlight words — gradient text */}
      <span
        className="text-transparent bg-clip-text bg-gradient-to-b from-white via-neutral-200 to-neutral-300"
        style={{ display: "inline" }}
      >
        {highlightWords.map((word, i) => (
          <motion.span
            key={`highlight-${i}`}
            variants={FADE_UP}
            transition={WORD_TRANSITION}
            style={{ display: "inline-block", marginRight: i < highlightWords.length - 1 ? "0.28em" : 0 }}
          >
            {word}
          </motion.span>
        ))}
      </span>
    </motion.h1>
  );
}
