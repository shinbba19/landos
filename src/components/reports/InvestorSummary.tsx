import { LandosScore } from "@/components/LandosScore";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatPercent } from "@/lib/utils";
import type { Project } from "@/lib/types";
import { MapPin, Building2, Road, TrendingUp, Brain, AlertTriangle, Grid3x3 } from "lucide-react";

interface Props { project: Project }

export function InvestorSummary({ project }: Props) {
  const { input, result } = project;
  const acqPriceRatio = (input.estimatedSellingPricePerWah / input.acquisitionPricePerWah).toFixed(1);
  const infraCostPerWah = result.totalLandSizeWah > 0
    ? Math.round(result.infrastructureCostTotal / result.totalLandSizeWah)
    : 0;

  return (
    <div className="space-y-0 max-w-4xl mx-auto">
      {/* Report Shell */}
      <div className="rounded-xl overflow-hidden border border-brand-gold/30 shadow-2xl">

        {/* Report Header */}
        <div className="bg-gradient-to-r from-brand-navy to-brand-navy-mid px-8 py-6 border-b border-brand-gold/20">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 rounded bg-brand-gold flex items-center justify-center">
                <span className="text-brand-navy font-serif font-bold text-xs">L</span>
              </div>
              <div>
                <span className="text-brand-gold font-serif font-bold text-base tracking-wide">LANDOS</span>
                <span className="text-brand-cream/40 text-xs block leading-none tracking-widest uppercase">Investor Summary</span>
              </div>
            </div>
            <div className="text-right">
              <p className="text-brand-cream/30 text-xs">Prepared</p>
              <p className="text-brand-cream/60 text-xs">
                {new Date(project.createdAt).toLocaleDateString("en-GB", {
                  day: "2-digit", month: "long", year: "numeric",
                })}
              </p>
            </div>
          </div>

          {/* Hero info */}
          <h1 className="text-3xl font-serif text-brand-cream mb-1">{input.projectName}</h1>
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1.5 text-brand-cream/60 text-sm">
              <MapPin size={13} />
              <span>{input.location}</span>
            </div>
            <Badge variant="gold">{input.zoning}</Badge>
            <Badge variant="gray">{input.roadAccess}</Badge>
          </div>
        </div>

        {/* Hero stats bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 border-b border-brand-gold/20">
          {[
            { label: "Land Size", value: `${input.landSizeRai} rai ${input.landSizeWah} wah²` },
            { label: "Acquisition / Wah²", value: formatCurrency(input.acquisitionPricePerWah) },
            { label: "Market Price / Wah²", value: formatCurrency(input.estimatedSellingPricePerWah) },
            { label: "Price Multiplier", value: `${acqPriceRatio}×` },
          ].map((s, i) => (
            <div key={i} className="px-6 py-4 border-r border-brand-gold/10 last:border-r-0">
              <p className="text-brand-cream/40 text-xs uppercase tracking-wider">{s.label}</p>
              <p className="text-brand-cream font-semibold mt-0.5">{s.value}</p>
            </div>
          ))}
        </div>

        {/* Main content */}
        <div className="bg-brand-navy-light p-8 space-y-8">

          {/* ROI + Score side by side */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <SectionLabel icon={<TrendingUp size={13} />} label="Return Summary" />
              <div className="grid grid-cols-2 gap-3 mt-3">
                <Stat label="Project ROI" value={formatPercent(result.roi)} color="gold" />
                <Stat label="Gross Margin" value={formatPercent(result.grossProfitMargin)} />
                <Stat label="Gross Profit" value={formatCurrency(result.grossProfit)} color="green" />
                <Stat label="Total Cost" value={formatCurrency(result.totalProjectCost)} />
              </div>
            </div>

            <div className="flex flex-col">
              <SectionLabel label="LANDOS Intelligence Score" />
              <div className="flex-1 flex items-center justify-center mt-3 rounded-lg border border-brand-gold/20 bg-brand-navy p-6">
                <LandosScore score={result.landosScore} recommendation={result.recommendation} size="lg" />
              </div>
            </div>
          </div>

          {/* Acquisition + Subdivision */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <SectionLabel icon={<Building2 size={13} />} label="Acquisition Intelligence" />
              <div className="mt-3 space-y-2 rounded-lg border border-brand-gold/20 bg-brand-navy p-4">
                <InfoRow label="Acquisition Cost" value={formatCurrency(result.acquisitionCostTotal)} />
                <InfoRow label="Infrastructure Cost" value={formatCurrency(result.infrastructureCostTotal)} />
                <InfoRow label="Infra Cost / Wah²" value={`${infraCostPerWah.toLocaleString()} THB/wah²`} />
                <div className="border-t border-brand-gold/10 pt-2 mt-2">
                  <InfoRow label="Total Project Cost" value={formatCurrency(result.totalProjectCost)} bold />
                </div>
              </div>
            </div>

            <div>
              <SectionLabel icon={<Grid3x3 size={13} />} label="Subdivision Overview" />
              <div className="mt-3 space-y-2 rounded-lg border border-brand-gold/20 bg-brand-navy p-4">
                <InfoRow label="Total Area" value={`${result.totalLandSizeWah} Wah²`} />
                <InfoRow label="Road Deduction" value={`${input.roadDeductionPercent}%`} />
                <InfoRow label="Sellable Area" value={`${result.sellableAreaWah.toFixed(0)} Wah²`} />
                <div className="border-t border-brand-gold/10 pt-2 mt-2">
                  <InfoRow label="Estimated Plots" value={`${input.plotCount} units`} bold />
                </div>
              </div>
            </div>
          </div>

          {/* Road access */}
          <div>
            <SectionLabel icon={<Road size={13} />} label="Road Access Observation" />
            <div className="mt-3 rounded-lg border border-brand-gold/20 bg-brand-navy p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-brand-gold/10 border border-brand-gold/30 flex items-center justify-center">
                  <Road size={16} className="text-brand-gold" />
                </div>
                <div>
                  <p className="text-brand-cream font-medium">{input.roadAccess}</p>
                  <p className="text-brand-cream/50 text-sm">
                    {input.roadAccess === "Public Road" || input.roadAccess === "Paved Road"
                      ? "Favorable road access — supports strong market appeal and accessibility."
                      : input.roadAccess === "Dirt Road"
                      ? "Road improvement required — infrastructure budget should account for access road development."
                      : "Assess road access feasibility before finalizing acquisition decision."}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* AI Insights */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="rounded-lg border border-brand-gold/20 bg-brand-navy p-4">
              <div className="flex items-center gap-2 mb-3">
                <Brain size={14} className="text-brand-gold" />
                <span className="text-brand-gold text-xs uppercase tracking-widest">AI Executive Summary</span>
              </div>
              <p className="text-brand-cream/80 text-sm leading-relaxed italic">
                &ldquo;{result.aiExecutiveSummary}&rdquo;
              </p>
            </div>
            <div className="rounded-lg border border-yellow-500/20 bg-yellow-900/10 p-4">
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle size={14} className="text-yellow-400" />
                <span className="text-yellow-400 text-xs uppercase tracking-widest">Risk Note</span>
              </div>
              <p className="text-brand-cream/80 text-sm leading-relaxed italic">
                &ldquo;{result.aiRiskNote}&rdquo;
              </p>
            </div>
          </div>

          {/* Market Estimate */}
          <div className="rounded-lg border border-brand-gold/30 bg-gradient-to-r from-brand-gold/5 to-transparent p-6">
            <div className="flex items-start justify-between flex-wrap gap-4">
              <div>
                <p className="text-brand-gold text-xs uppercase tracking-widest mb-1">Revenue Estimate</p>
                <p className="text-3xl font-serif text-brand-cream">{formatCurrency(result.estimatedRevenue)}</p>
                <p className="text-brand-cream/40 text-xs mt-1">
                  Based on {result.sellableAreaWah.toFixed(0)} wah² sellable @ {formatCurrency(input.estimatedSellingPricePerWah)}/wah²
                </p>
              </div>
              <div className="text-right">
                <p className="text-brand-gold text-xs uppercase tracking-widest mb-1">Gross Profit</p>
                <p className="text-2xl font-serif text-emerald-400">{formatCurrency(result.grossProfit)}</p>
                <p className="text-brand-cream/40 text-xs mt-1">Margin: {formatPercent(result.grossProfitMargin)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-brand-navy border-t border-brand-gold/20 px-8 py-4 flex items-center justify-between">
          <p className="text-brand-cream/20 text-xs">LANDOS — Land Development Intelligence System</p>
          <p className="text-brand-cream/20 text-xs">Confidential — For Internal Use Only</p>
        </div>
      </div>
    </div>
  );
}

function SectionLabel({ label, icon }: { label: string; icon?: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2">
      {icon && <span className="text-brand-gold">{icon}</span>}
      <h3 className="text-brand-gold text-xs uppercase tracking-widest">{label}</h3>
    </div>
  );
}

function Stat({ label, value, color }: { label: string; value: string; color?: "gold" | "green" }) {
  return (
    <div className="rounded border border-brand-gold/15 bg-brand-navy p-3">
      <p className="text-brand-cream/40 text-xs uppercase tracking-wider">{label}</p>
      <p className={
        color === "gold" ? "text-brand-gold font-semibold mt-0.5" :
        color === "green" ? "text-emerald-400 font-semibold mt-0.5" :
        "text-brand-cream font-medium mt-0.5 text-sm"
      }>
        {value}
      </p>
    </div>
  );
}

function InfoRow({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-brand-cream/40 text-sm">{label}</span>
      <span className={bold ? "text-brand-cream font-semibold" : "text-brand-cream/70 text-sm"}>{value}</span>
    </div>
  );
}
