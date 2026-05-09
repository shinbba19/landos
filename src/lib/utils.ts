import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(value: number, currency = "THB"): string {
  if (value >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(2)}M ${currency}`;
  }
  return value.toLocaleString("th-TH") + " " + currency;
}

export function formatPercent(value: number): string {
  return `${value.toFixed(1)}%`;
}
