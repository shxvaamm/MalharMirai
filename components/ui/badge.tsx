import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-neutral-200 text-neutral-950 font-semibold",
        secondary:
          "border-transparent bg-neutral-800/80 text-neutral-200",
        destructive:
          "border-transparent bg-rose-600/20 text-rose-300 border-rose-600/30",
        outline: "border-white/10 text-neutral-300",
        // Malhar soft monochromatic specific status & role variants
        admin:
          "border-white/20 bg-white/[0.08] text-neutral-200 font-semibold",
        member:
          "border-white/10 bg-white/[0.03] text-neutral-400 font-medium",
        volunteer:
          "border-white/15 bg-white/[0.05] text-neutral-300 font-medium",
        upcoming:
          "border-white/15 bg-white/[0.06] text-neutral-200 font-medium",
        ongoing:
          "border-white/25 bg-white/10 text-neutral-100 font-semibold animate-pulse",
        completed:
          "border-white/5 bg-neutral-900/60 text-neutral-500 font-normal",
        urgent:
          "border-rose-500/40 bg-rose-500/20 text-rose-300 font-bold uppercase tracking-wider",
      },


    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
