"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export function Navbar() {
  const pathname = usePathname();

  return (
    <header className="fixed top-0 left-0 right-0 z-50 h-16 border-b border-brand-gold/20 bg-brand-navy/95 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto h-full px-6 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3">
          <div className="w-8 h-8 rounded bg-gradient-to-br from-brand-gold to-brand-gold-dark flex items-center justify-center">
            <span className="text-brand-navy font-serif font-bold text-sm">L</span>
          </div>
          <div>
            <span className="text-brand-cream font-serif font-bold text-lg tracking-wide">LANDOS</span>
            <span className="text-brand-gold/60 text-xs block leading-none tracking-widest uppercase">
              Intelligence System
            </span>
          </div>
        </Link>

        <nav className="flex items-center gap-1">
          <Link
            href="/"
            className={cn(
              "px-4 py-2 rounded text-sm transition-colors",
              pathname === "/"
                ? "text-brand-gold bg-brand-gold/10"
                : "text-brand-cream/60 hover:text-brand-cream hover:bg-brand-navy-light"
            )}
          >
            Projects
          </Link>
          <Link
            href="/projects/new"
            className="ml-2 px-4 py-2 rounded text-sm bg-brand-gold text-brand-navy font-semibold hover:bg-brand-gold-light transition-colors"
          >
            + New Analysis
          </Link>
        </nav>
      </div>
    </header>
  );
}
