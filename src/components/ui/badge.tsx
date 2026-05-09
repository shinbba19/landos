import * as React from "react";
import { cn } from "@/lib/utils";

type BadgeVariant = "gold" | "green" | "red" | "blue" | "gray";

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
}

const variantClasses: Record<BadgeVariant, string> = {
  gold: "bg-brand-gold/20 text-brand-gold border-brand-gold/30",
  green: "bg-emerald-900/40 text-emerald-300 border-emerald-700/40",
  red: "bg-red-900/40 text-red-300 border-red-700/40",
  blue: "bg-blue-900/40 text-blue-300 border-blue-700/40",
  gray: "bg-brand-navy-mid text-brand-cream/60 border-brand-gold/10",
};

export function Badge({ variant = "gold", className, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded border px-2 py-0.5 text-xs font-medium uppercase tracking-wide",
        variantClasses[variant],
        className
      )}
      {...props}
    />
  );
}
