import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-full text-sm font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 select-none",
  {
    variants: {
      variant: {
        default:
          "bg-[#E5E5E5] text-neutral-950 font-semibold shadow-sm hover:bg-[#D4D4D4] active:scale-[0.98]",
        destructive:
          "bg-rose-600/90 text-white shadow-sm hover:bg-rose-500 active:scale-[0.98]",
        outline:
          "border border-white/10 bg-white/[0.03] text-neutral-200 shadow-sm hover:bg-white/[0.07] hover:border-white/20 active:scale-[0.98]",
        secondary:
          "bg-neutral-800/80 text-neutral-200 shadow-sm hover:bg-neutral-700 active:scale-[0.98]",
        ghost: "text-neutral-400 hover:bg-white/[0.06] hover:text-neutral-200",
        link: "text-neutral-300 underline-offset-4 hover:underline hover:text-white",
        malhar:
          "bg-[#E5E5E5] text-neutral-950 font-semibold shadow-sm hover:bg-[#D4D4D4] active:scale-[0.98]",
        malharOutline:
          "border border-white/10 bg-white/[0.03] text-neutral-200 hover:bg-white/[0.07] hover:border-white/20 active:scale-[0.98]",
      },


      size: {
        default: "h-10 px-5 py-2",
        sm: "h-8 px-4 text-xs",
        lg: "h-12 px-8 text-sm",
        icon: "h-10 w-10 p-0",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);


export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
