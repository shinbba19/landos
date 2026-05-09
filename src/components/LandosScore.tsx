import { cn } from "@/lib/utils";

interface LandosScoreProps {
  score: number;
  recommendation: string;
  size?: "sm" | "md" | "lg";
}

export function LandosScore({ score, recommendation, size = "md" }: LandosScoreProps) {
  const scoreColor =
    score >= 7.5 ? "text-emerald-400" :
    score >= 6.0 ? "text-brand-gold" :
    score >= 4.5 ? "text-yellow-500" : "text-red-400";

  const recColor =
    recommendation === "STRONG BUY" ? "bg-emerald-900/40 text-emerald-300 border-emerald-600/40" :
    recommendation === "BUY" ? "bg-brand-gold/20 text-brand-gold border-brand-gold/40" :
    recommendation === "HOLD" ? "bg-yellow-900/40 text-yellow-300 border-yellow-600/40" :
    "bg-red-900/40 text-red-300 border-red-600/40";

  const segments = 10;
  const filled = Math.round(score);

  if (size === "sm") {
    return (
      <div className="flex items-center gap-3">
        <span className={cn("text-2xl font-serif font-bold", scoreColor)}>{score.toFixed(1)}</span>
        <span className="text-brand-cream/40 text-sm">/10</span>
        <span className={cn("text-xs px-2 py-0.5 rounded border font-semibold tracking-wide", recColor)}>
          {recommendation}
        </span>
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col gap-3", size === "lg" ? "items-center" : "")}>
      <div className="flex items-end gap-2">
        <span className={cn("font-serif font-bold leading-none", scoreColor,
          size === "lg" ? "text-6xl" : "text-4xl"
        )}>
          {score.toFixed(1)}
        </span>
        <span className="text-brand-cream/40 text-lg mb-1">/10</span>
      </div>

      <div className="flex gap-1">
        {Array.from({ length: segments }).map((_, i) => (
          <div
            key={i}
            className={cn(
              "h-1.5 rounded-full transition-all",
              size === "lg" ? "w-7" : "w-5",
              i < filled
                ? score >= 7.5 ? "bg-emerald-400" : score >= 6 ? "bg-brand-gold" : "bg-yellow-500"
                : "bg-brand-navy-mid"
            )}
          />
        ))}
      </div>

      <span className={cn("self-start text-xs px-2.5 py-1 rounded border font-semibold tracking-widest uppercase", recColor)}>
        {recommendation}
      </span>

      <p className="text-xs text-brand-cream/40 uppercase tracking-widest">LANDOS Score</p>
    </div>
  );
}
