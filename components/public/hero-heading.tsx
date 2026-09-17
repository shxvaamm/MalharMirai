/**
 * HeroHeading — Staggered word-by-word reveal for the homepage hero.
 *
 * Animation (CSS — no framer-motion):
 *   Each word is wrapped in a <span class="hero-word"> with --word-i set
 *   to its index. CSS @keyframes heroWordIn animates opacity 0→1 + Y 14→0.
 *   Delay formula: 20ms + (index × 35ms) — matches the former Framer config:
 *     delayChildren: 0.02  →  20ms base
 *     staggerChildren: 0.035 → 35ms per word
 *   Duration: 260ms, easing: cubic-bezier(0.16,1,0.3,1) — identical to
 *   the former WORD_TRANSITION ({ duration: 0.26, ease: EASE_OUT }).
 *
 *   prefers-reduced-motion: the global CSS rule sets animation-duration to
 *   0.01ms, so words appear instantly — no JS branching needed.
 *
 * This is now a Server Component (no hooks, no "use client").
 */

import * as React from "react";

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

export function HeroHeading({ prefix, highlight, className = "" }: HeroHeadingProps) {
  const prefixWords    = splitWords(prefix);
  const highlightWords = splitWords(highlight);

  // Total prefix word count — used to continue the index into highlight words
  // so the stagger delay is monotonically increasing across both runs.
  const prefixCount = prefixWords.length;

  return (
    <h1 className={className}>
      {/* Prefix words — plain white, each staggered by index */}
      {prefixWords.map((word, i) => (
        <span
          key={`prefix-${i}`}
          className="hero-word"
          style={{ "--word-i": i } as React.CSSProperties}
        >
          {word}
        </span>
      ))}

      {/* Responsive break before the highlighted school name */}
      <br className="hidden sm:inline" />

      {/* Highlight words — gradient applied per-word so bg-clip-text clips to the
          span's own direct text node (not children). Using a wrapper span with
          bg-clip-text doesn't work when all text is inside inline-block children:
          the wrapper has no direct text nodes to clip to, so the gradient is
          invisible. Applying the classes per-span is unambiguous in all browsers. */}
      {highlightWords.map((word, i) => (
        <span
          key={`highlight-${i}`}
          className={`hero-word text-transparent bg-clip-text bg-gradient-to-b from-white via-neutral-200 to-neutral-300${i === highlightWords.length - 1 ? " hero-word-last" : ""}`}
          style={{ "--word-i": prefixCount + i } as React.CSSProperties}
        >
          {word}
        </span>
      ))}
    </h1>
  );
}
