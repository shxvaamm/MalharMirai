"use client";

import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-full text-sm font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default:
          "bg-[#E5E5E5] text-neutral-950 font-semibold shadow-sm hover:bg-[#D4D4D4]",
        destructive:
          "bg-rose-600/90 text-white shadow-sm hover:bg-rose-500",
        outline:
          "border border-white/10 bg-white/[0.03] text-neutral-200 shadow-sm hover:bg-white/[0.07] hover:border-white/20",
        secondary:
          "bg-neutral-800/80 text-neutral-200 shadow-sm hover:bg-neutral-700",
        ghost: "text-neutral-400 hover:bg-white/[0.06] hover:text-neutral-200",
        link: "text-neutral-300 underline-offset-4 hover:underline hover:text-white",
        malhar:
          "bg-[#E5E5E5] text-neutral-950 font-semibold shadow-sm hover:bg-[#D4D4D4]",
        malharOutline:
          "border border-white/10 bg-white/[0.03] text-neutral-200 hover:bg-white/[0.07] hover:border-white/20",
      },
      size: {
        default: "h-10 px-5 py-2",
        sm:      "h-8 px-4 text-xs",
        lg:      "h-12 px-8 text-sm",
        icon:    "h-10 w-10 p-0",
      },
    },
    defaultVariants: {
      variant: "default",
      size:    "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

/**
 * Button — Framer Motion enhanced with subtle scale hover/tap feedback.
 *
 * Scale values: whileHover 1.03, whileTap 0.97 — understated, crisp.
 * Ghost and link variants skip scale to keep them feeling lightweight.
 *
 * When `asChild` is true, we use Slot (not motion.button) to render the
 * child element directly. The parent motion.div wrapper still applies the
 * scale effect in that case.
 */
const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const noScale = variant === "ghost" || variant === "link";

    const Comp = asChild ? Slot : "button";

    if (asChild) {
      // When rendering a child element (e.g. Link), wrap with motion.div for scale
      return (
        <motion.div
          whileHover={noScale ? {} : { scale: 1.03 }}
          whileTap={noScale   ? {} : { scale: 0.97 }}
          transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
          style={{ display: "inline-flex" }}
        >
          <Comp
            className={cn(buttonVariants({ variant, size, className }))}
            // @ts-ignore — Slot accepts ref forwarding
            ref={ref}
            {...props}
          />
        </motion.div>
      );
    }

    return (
      <motion.button
        whileHover={noScale ? {} : { scale: 1.03 }}
        whileTap={noScale   ? {} : { scale: 0.97 }}
        transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...(props as any)}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
