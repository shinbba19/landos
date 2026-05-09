import * as React from "react";
import { cn } from "@/lib/utils";

const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, type, ...props }, ref) => (
    <input
      type={type}
      className={cn(
        "flex h-10 w-full rounded border border-brand-gold/30 bg-brand-navy px-3 py-2 text-sm text-brand-cream placeholder:text-brand-cream/40 focus:outline-none focus:border-brand-gold focus:ring-1 focus:ring-brand-gold/50 disabled:cursor-not-allowed disabled:opacity-50 transition-colors",
        className
      )}
      ref={ref}
      {...props}
    />
  )
);
Input.displayName = "Input";

export { Input };
