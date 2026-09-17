import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
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

/**
 * CSS transition values that replicate the previous Framer Motion
 * whileHover { scale: 1.03 } / whileTap { scale: 0.97 } behaviour.
 * Duration 150 ms, easing cubic-bezier(0.16, 1, 0.3, 1) — identical to the
 * former motion transition. GPU-composited, no JS cost.
 */
const SCALE_TRANSITION = "transform 0.15s cubic-bezier(0.16,1,0.3,1)";

/**
 * Button — subtle scale hover/tap feedback via CSS transforms.
 *
 * Scale values: hover 1.03, active 0.97 — understated, crisp.
 * Ghost and link variants skip scale to keep them feeling lightweight.
 *
 * When `asChild` is true, we use Slot to render the child element directly,
 * wrapped in a plain div that carries the CSS scale transition.
 */
export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, style, ...props }, ref) => {
    const noScale = variant === "ghost" || variant === "link";

    const scaleStyle: React.CSSProperties = noScale
      ? {}
      : {
          transition: SCALE_TRANSITION,
        };

    const hoverActiveClass = noScale
      ? ""
      : "hover:scale-[1.03] active:scale-[0.97]";

    if (asChild) {
      return (
        <div
          className={cn("inline-flex", hoverActiveClass)}
          style={scaleStyle}
        >
          <Slot
            className={cn(buttonVariants({ variant, size, className }))}
            // @ts-ignore — Slot accepts ref forwarding
            ref={ref}
            {...props}
          />
        </div>
      );
    }

    return (
      <button
        className={cn(
          buttonVariants({ variant, size, className }),
          hoverActiveClass
        )}
        style={{ ...scaleStyle, ...style }}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
