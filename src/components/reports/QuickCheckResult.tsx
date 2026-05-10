import { LandosScore } from "@/components/LandosScore";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency, formatPercent } from "@/lib/utils";
import type { Project } from "@/lib/types";
import { Brain, TrendingUp, AlertTriangle, MapPin, Building2, Ruler } from "lucide-react";

interface Props { project: Project }

export function QuickCheckResult({ project }: Props) {
  const { input, result } = project;

  return (
    <div className="space-y-6">

      {/* Hero image */}
      {project.heroImageBase64 && (
        <div className="relative h-56 rounded-xl overflow-hidden border border-brand-gold/20">
          <img src={project.heroImageBase64} alt="Property" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-brand-navy/70 to-transparent" />
          <div className="absolute bottom-3 left-5">
            <span className="text-brand-cream/50 text-xs uppercase tracking-widest">Property Photo</span>
          </div>
        </div>
      )}

      {/* Score banner */}
      <div className="rounded-lg border border-brand-gold/30 bg-gradient-to-r from-brand-navy-light to-brand-navy-mid p-6">
        <div className="flex items-start justify-between flex-wrap gap-6">
          <div className="flex-1 min-w-48">
            <p className="text-brand-gold text-xs uppercase tracking-widest mb-1">Executive Overview</p>
            <h2 className="text-2xl font-serif text-brand-cream mb-1">{input.projectName}</h2>
            <div className="flex items-center gap-1.5 text-brand-cream/50 text-sm mb-2">
              <MapPin size={13} />
              <span>{input.location}</span>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="gray"><Building2 size={10} className="mr-1" />{input.zoning}</Badge>
              <Badge variant="gray">{input.roadAccess}</Badge>
              <Badge variant="gray">{input.developmentType}</Badge>
            </div>
          </div>
          <LandosScore score={result.landosScore} recommendation={result.recommendation} size="lg" />
        </div>
      </div>

      {/* Land Information strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <LandCell label="Land Size" value={`${result.totalLandSizeWah} wah²`} icon={<Ruler size={13} />} />
        <LandCell label="Zoning" value={input.zoning || "—"} icon={<Building2 size={13} />} />
        <LandCell label="Road Access" value={input.roadAccess || "—"} />
        <LandCell label="Sellable Area" value={`${result.sellableAreaWah.toFixed(0)} wah²`} icon={<TrendingUp size={13} />} />
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard label="Total ROI" value={formatPercent(result.roi)} color="gold" icon={<TrendingUp size={16} />} />
        <MetricCard label="Gross Profit" value={formatCurrency(result.grossProfit)} color="green" />
        <MetricCard label="Gross Margin" value={formatPercent(result.grossProfitMargin)} />
        <MetricCard label="LANDOS Score" value={`${result.landosScore.toFixed(1)} / 10`} color="gold" />
      </div>

      {/* AI Executive Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <Brain size={15} className="text-brand-gold" />
            AI Executive Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-brand-cream/80 text-sm leading-relaxed italic border-l-2 border-brand-gold/40 pl-4">
            &ldquo;{result.aiExecutiveSummary}&rdquo;
          </p>
        </CardContent>
      </Card>

      {/* Risk Analysis */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <AlertTriangle size={15} className="text-yellow-400" />
            Risk Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-brand-cream/80 text-sm leading-relaxed italic border-l-2 border-yellow-500/40 pl-4">
            &ldquo;{result.aiRiskNote}&rdquo;
          </p>
        </CardContent>
      </Card>

      {/* Acquisition Score Factors */}
      <Card>
        <CardHeader><CardTitle className="text-sm">Acquisition Score Factors</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <ScoreFactor label="ROI" note={formatPercent(result.roi)} />
            <ScoreFactor label="Acquisition Score" note={`${result.acquisitionScore.toFixed(1)}/10`} />
            <ScoreFactor label="Road Deduction" note={`${input.roadDeductionPercent}%`} />
            <ScoreFactor label="Zoning" note={input.zoning} />
            <ScoreFactor label="Road Access" note={input.roadAccess} />
            <ScoreFactor label="LANDOS Score" note={`${result.landosScore.toFixed(1)}/10`} highlight />
          </div>
        </CardContent>
      </Card>

    </div>
  );
}

function LandCell({ label, value, icon }: { label: string; value: string; icon?: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-brand-gold/15 bg-brand-navy-light px-4 py-3">
      <div className="flex items-center gap-1.5 text-brand-cream/40 mb-1">
        {icon}
        <p className="text-xs uppercase tracking-wider">{label}</p>
      </div>
      <p className="text-brand-cream text-sm font-medium">{value}</p>
    </div>
  );
}

function MetricCard({ label, value, color, icon }: {
  label: string; value: string; color?: "gold" | "green"; icon?: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border border-brand-gold/20 bg-brand-navy-light p-4">
      <p className="text-brand-cream/40 text-xs uppercase tracking-wider mb-1">{label}</p>
      <div className="flex items-center gap-1.5">
        {icon && <span className="text-brand-gold">{icon}</span>}
        <p className={
          color === "gold" ? "text-brand-gold font-semibold text-xl" :
          color === "green" ? "text-emerald-400 font-semibold text-xl" :
          "text-brand-cream font-semibold text-xl"
        }>
          {value}
        </p>
      </div>
    </div>
  );
}

function ScoreFactor({ label, note, highlight }: { label: string; note: string; highlight?: boolean }) {
  return (
    <div className="p-3 rounded border border-brand-gold/10 bg-brand-navy">
      <p className="text-brand-cream/40 text-xs uppercase tracking-wider">{label}</p>
      <p className={highlight ? "text-brand-gold font-semibold mt-0.5" : "text-brand-cream text-sm mt-0.5"}>{note}</p>
    </div>
  );
}
