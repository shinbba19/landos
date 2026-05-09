"use client";
import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 cursor-pointer",
  {
    variants: {
      variant: {
        gold: "bg-brand-gold text-brand-navy font-semibold hover:bg-brand-gold-light shadow-lg",
        navy: "bg-brand-navy-light text-brand-cream border border-brand-gold/30 hover:border-brand-gold hover:bg-brand-navy-mid",
        ghost: "text-brand-gold hover:bg-brand-navy-light",
        outline: "border border-brand-gold/40 text-brand-cream hover:bg-brand-navy-light hover:border-brand-gold",
        danger: "bg-red-900/50 text-red-200 border border-red-700/50 hover:bg-red-900",
      },
      size: {
        sm: "h-8 px-3 text-xs",
        md: "h-10 px-5",
        lg: "h-12 px-8 text-base",
        xl: "h-14 px-10 text-lg",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: {
      variant: "navy",
      size: "md",
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
      <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
