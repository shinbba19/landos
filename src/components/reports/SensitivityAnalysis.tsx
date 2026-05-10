"use client";
import { useMemo } from "react";
import { formatCurrency, formatPercent, cn } from "@/lib/utils";
import { runQuickCheck, DEVELOPMENT_TYPES } from "@/lib/calculations";
import type { Project, QuickCheckInput, DevelopmentType } from "@/lib/types";
import { BarChart2, Target, TrendingDown } from "lucide-react";

const STEPS = [-0.20, -0.10, 0, 0.10, 0.20];
const STEP_LABELS = ["-20%", "-10%", "Base", "+10%", "+20%"];

function roiColor(roi: number): string {
  if (roi >= 30) return "text-emerald-400";
  if (roi >= 20) return "text-brand-gold";
  if (roi >= 10) return "text-yellow-400";
  return "text-red-400";
}

function roiBg(roi: number): string {
  if (roi >= 30) return "bg-emerald-400/10";
  if (roi >= 20) return "bg-brand-gold/10";
  if (roi >= 10) return "bg-yellow-400/10";
  return "bg-red-400/10";
}

function buildROIMatrix(input: QuickCheckInput) {
  return STEPS.map((acqStep, ri) => ({
    acqPrice: Math.round(input.acquisitionPricePerWah * (1 + acqStep)),
    stepLabel: STEP_LABELS[ri],
    cells: STEPS.map((sellStep, ci) => {
      const r = runQuickCheck({
        ...input,
        acquisitionPricePerWah: Math.round(input.acquisitionPricePerWah * (1 + acqStep)),
        estimatedSellingPricePerWah: Math.round(input.estimatedSellingPricePerWah * (1 + sellStep)),
      });
      return {
        roi: r.roi,
        sellPrice: Math.round(input.estimatedSellingPricePerWah * (1 + sellStep)),
        stepLabel: STEP_LABELS[ci],
        isBase: acqStep === 0 && sellStep === 0,
      };
    }),
  }));
}

export function SensitivityAnalysis({ project }: { project: Project }) {
  const { input, result } = project;

  const matrix = useMemo(() => buildROIMatrix(input), [input]);

  const devCostRows = useMemo(() =>
    (Object.keys(DEVELOPMENT_TYPES) as DevelopmentType[]).map(type => {
      const r = runQuickCheck({ ...input, developmentCostRatio: DEVELOPMENT_TYPES[type].ratio });
      return { type, meta: DEVELOPMENT_TYPES[type], result: r };
    }), [input]);

  const breakEvenSellPricePerWah = result.sellableAreaWah > 0
    ? Math.round(result.totalProjectCost / result.sellableAreaWah)
    : 0;
  const maxAcqPricePerWah = result.totalLandSizeWah > 0
    ? Math.round(
        (result.sellableAreaWah * input.estimatedSellingPricePerWah) /
        (result.totalLandSizeWah * (1 + 0.06 + input.developmentCostRatio) * 1.10)
      )
    : 0;

  const sellBuffer = breakEvenSellPricePerWah > 0
    ? ((input.estimatedSellingPricePerWah - breakEvenSellPricePerWah) / breakEvenSellPricePerWah) * 100
    : 0;
  const acqHeadroom = maxAcqPricePerWah > 0
    ? ((maxAcqPricePerWah - input.acquisitionPricePerWah) / maxAcqPricePerWah) * 100
    : 0;

  return (
    <div className="max-w-5xl mx-auto space-y-0">
      <div className="rounded-xl overflow-hidden border border-brand-gold/30 shadow-2xl">

        {/* ── Header ── */}
        <div className="bg-gradient-to-r from-brand-navy to-brand-navy-mid px-8 py-6 border-b border-brand-gold/20">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 rounded bg-brand-gold flex items-center justify-center">
                <span className="text-brand-navy font-serif font-bold text-xs">L</span>
              </div>
              <div>
                <span className="text-brand-gold font-serif font-bold text-base tracking-wide">LANDOS</span>
                <span className="text-brand-cream/40 text-xs block leading-none tracking-widest uppercase">Sensitivity Analysis</span>
              </div>
            </div>
            <p className="text-brand-cream/30 text-xs">
              {new Date(project.createdAt).toLocaleDateString("en-GB", {
                day: "2-digit", month: "long", year: "numeric",
              })}
            </p>
          </div>
          <h1 className="text-2xl font-serif text-brand-cream">{input.projectName}</h1>
          <p className="text-brand-cream/50 text-sm">{input.location}</p>
        </div>

        {/* ── Stats bar ── */}
        <div className="grid grid-cols-2 md:grid-cols-4 border-b border-brand-gold/20">
          {[
            { label: "Base ROI",       value: formatPercent(result.roi) },
            { label: "Gross Margin",   value: formatPercent(result.grossProfitMargin) },
            { label: "Acq Price/wah²", value: formatCurrency(input.acquisitionPricePerWah) },
            { label: "Sell Price/wah²",value: formatCurrency(input.estimatedSellingPricePerWah) },
          ].map((s, i) => (
            <div key={i} className="px-6 py-4 border-r border-brand-gold/10 last:border-r-0 bg-brand-navy-light">
              <p className="text-brand-cream/40 text-xs uppercase tracking-wider">{s.label}</p>
              <p className="text-brand-cream font-semibold mt-0.5">{s.value}</p>
            </div>
          ))}
        </div>

        <div className="bg-brand-navy-light divide-y divide-brand-gold/10">

          {/* ── Section 1: ROI Sensitivity Matrix ── */}
          <section className="px-8 py-6">
            <SectionHeader number="1" title="การวิเคราะห์ความไวต่อ ROI" subtitle="ROI Sensitivity Matrix" icon={<BarChart2 size={13} />} />
            <p className="text-brand-cream/40 text-xs mt-1 mb-4">
              Rows = acquisition price variation · Columns = selling price variation
            </p>
            <div className="overflow-x-auto">
              <table className="min-w-[580px] w-full text-xs border-collapse">
                <thead>
                  <tr>
                    <th className="text-left px-3 py-2.5 text-brand-cream/30 font-normal border-b border-brand-gold/15 bg-brand-navy rounded-tl-lg">
                      Acq ↓ / Sell →
                    </th>
                    {matrix[0].cells.map((cell, ci) => (
                      <th key={ci} className={cn(
                        "text-center px-3 py-2.5 border-b border-brand-gold/15 bg-brand-navy font-medium",
                        ci === 4 && "rounded-tr-lg"
                      )}>
                        <span className="text-brand-cream/80 block">{formatCurrency(cell.sellPrice)}</span>
                        <span className={cn("block text-[10px]", ci === 2 ? "text-brand-gold" : "text-brand-cream/30")}>{cell.stepLabel}</span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {matrix.map((row, ri) => (
                    <tr key={ri} className="border-b border-brand-gold/8 last:border-b-0">
                      <td className={cn(
                        "px-3 py-2.5 bg-brand-navy font-medium",
                        ri === 4 && "rounded-bl-lg"
                      )}>
                        <span className="text-brand-cream/80 block">{formatCurrency(row.acqPrice)}</span>
                        <span className={cn("block text-[10px]", ri === 2 ? "text-brand-gold" : "text-brand-cream/30")}>{row.stepLabel}</span>
                      </td>
                      {row.cells.map((cell, ci) => (
                        <td key={ci} className={cn(
                          "px-3 py-2.5 text-center font-semibold",
                          roiBg(cell.roi),
                          cell.isBase && "ring-2 ring-brand-gold ring-inset",
                          ri === 4 && ci === 4 && "rounded-br-lg"
                        )}>
                          <span className={roiColor(cell.roi)}>{cell.roi.toFixed(1)}%</span>
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Legend */}
            <div className="flex items-center gap-4 mt-3 flex-wrap">
              <span className="text-brand-cream/30 text-xs">ROI legend:</span>
              {[
                { color: "bg-emerald-400/20 text-emerald-400", label: "≥ 30% — Excellent" },
                { color: "bg-brand-gold/20 text-brand-gold", label: "20–30% — Good" },
                { color: "bg-yellow-400/20 text-yellow-400", label: "10–20% — Marginal" },
                { color: "bg-red-400/20 text-red-400", label: "< 10% — Poor" },
              ].map((s, i) => (
                <span key={i} className={cn("text-xs px-2 py-0.5 rounded", s.color)}>{s.label}</span>
              ))}
            </div>
          </section>

          {/* ── Section 2: Development Cost Sensitivity ── */}
          <section className="px-8 py-6">
            <SectionHeader number="2" title="ความไวต่อต้นทุน" subtitle="Development Cost Sensitivity" icon={<TrendingDown size={13} />} />
            <div className="rounded-lg border border-brand-gold/20 bg-brand-navy overflow-hidden mt-4">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-brand-gold/15">
                    <th className="text-left px-4 py-3 text-brand-cream/40 text-xs uppercase tracking-wider font-medium">Type</th>
                    <th className="text-right px-4 py-3 text-brand-cream/40 text-xs uppercase tracking-wider font-medium">Ratio</th>
                    <th className="text-right px-4 py-3 text-brand-cream/40 text-xs uppercase tracking-wider font-medium">Infra Cost</th>
                    <th className="text-right px-4 py-3 text-brand-cream/40 text-xs uppercase tracking-wider font-medium">Total Cost</th>
                    <th className="text-right px-4 py-3 text-brand-cream/40 text-xs uppercase tracking-wider font-medium">ROI</th>
                    <th className="text-right px-4 py-3 text-brand-cream/40 text-xs uppercase tracking-wider font-medium">Margin</th>
                  </tr>
                </thead>
                <tbody>
                  {devCostRows.map(({ type, meta, result: r }) => {
                    const isCurrent = type === input.developmentType;
                    return (
                      <tr key={type} className={cn(
                        "border-b border-brand-gold/10 last:border-b-0",
                        isCurrent ? "bg-brand-gold/5" : "hover:bg-brand-navy-light/20"
                      )}>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <span className="text-brand-cream/80 text-sm">{type}</span>
                            {isCurrent && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-brand-gold/20 text-brand-gold border border-brand-gold/30">
                                Current
                              </span>
                            )}
                          </div>
                          <span className="text-brand-cream/40 text-xs">{meta.labelTh}</span>
                        </td>
                        <td className="px-4 py-3 text-right text-brand-cream/60 text-sm">{(meta.ratio * 100).toFixed(0)}%</td>
                        <td className="px-4 py-3 text-right text-brand-cream/70 text-sm">{formatCurrency(r.infrastructureCostTotal)}</td>
                        <td className="px-4 py-3 text-right text-brand-cream/80 text-sm font-medium">{formatCurrency(r.totalProjectCost)}</td>
                        <td className={cn("px-4 py-3 text-right text-sm font-semibold", roiColor(r.roi))}>{formatPercent(r.roi)}</td>
                        <td className={cn(
                          "px-4 py-3 text-right text-sm",
                          r.grossProfitMargin >= 20 ? "text-emerald-400" : "text-brand-cream/60"
                        )}>
                          {formatPercent(r.grossProfitMargin)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>

          {/* ── Section 3: Break-Even Analysis ── */}
          <section className="px-8 py-6">
            <SectionHeader number="3" title="จุดคุ้มทุน" subtitle="Break-Even Analysis" icon={<Target size={13} />} />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">

              {/* Break-even selling price */}
              <div className="rounded-lg border border-brand-gold/20 bg-brand-navy overflow-hidden divide-y divide-brand-gold/10">
                <div className="px-5 py-4">
                  <p className="text-brand-cream/40 text-xs uppercase tracking-wider">Minimum Selling Price</p>
                  <p className="text-brand-gold text-2xl font-serif mt-1">{formatCurrency(breakEvenSellPricePerWah)}/wah²</p>
                  <p className="text-brand-cream/40 text-xs mt-1">Per wah² to achieve ROI = 0%</p>
                </div>
                <div className="px-5 py-3">
                  <p className="text-brand-cream/40 text-xs mb-1">Current selling price: {formatCurrency(input.estimatedSellingPricePerWah)}/wah²</p>
                  <p className={cn("text-sm font-medium", sellBuffer >= 0 ? "text-emerald-400" : "text-red-400")}>
                    {sellBuffer >= 0
                      ? `↑ ${sellBuffer.toFixed(1)}% above break-even — safe margin`
                      : `↓ ${Math.abs(sellBuffer).toFixed(1)}% below break-even — project at a loss`}
                  </p>
                </div>
              </div>

              {/* Maximum acquisition price */}
              <div className="rounded-lg border border-brand-gold/20 bg-brand-navy overflow-hidden divide-y divide-brand-gold/10">
                <div className="px-5 py-4">
                  <p className="text-brand-cream/40 text-xs uppercase tracking-wider">Maximum Acquisition Price</p>
                  <p className="text-brand-gold text-2xl font-serif mt-1">{formatCurrency(maxAcqPricePerWah)}/wah²</p>
                  <p className="text-brand-cream/40 text-xs mt-1">Maximum land cost at current selling price</p>
                </div>
                <div className="px-5 py-3">
                  <p className="text-brand-cream/40 text-xs mb-1">Current acquisition: {formatCurrency(input.acquisitionPricePerWah)}/wah²</p>
                  <p className={cn("text-sm font-medium", acqHeadroom >= 0 ? "text-emerald-400" : "text-red-400")}>
                    {acqHeadroom >= 0
                      ? `↑ ${acqHeadroom.toFixed(1)}% headroom before break-even`
                      : `↓ ${Math.abs(acqHeadroom).toFixed(1)}% over the maximum — project at a loss`}
                  </p>
                </div>
              </div>
            </div>
            <p className="text-brand-cream/25 text-xs mt-3 italic">
              Break-even figures assume current development cost ratio ({(input.developmentCostRatio * 100).toFixed(0)}%) and road deduction ({input.roadDeductionPercent}%). Changes to these parameters will shift thresholds.
            </p>
          </section>

        </div>

        {/* Footer */}
        <div className="bg-brand-navy border-t border-brand-gold/20 px-8 py-4 flex items-center justify-between">
          <p className="text-brand-cream/20 text-xs">LANDOS — Sensitivity Analysis</p>
          <p className="text-brand-cream/20 text-xs">Figures are estimates — verify with professional advisors.</p>
        </div>
      </div>
    </div>
  );
}

function SectionHeader({ number, title, subtitle, icon }: {
  number: string; title: string; subtitle: string; icon?: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-3">
      <div className="w-6 h-6 rounded-full bg-brand-gold/20 border border-brand-gold/40 flex items-center justify-center shrink-0">
        <span className="text-brand-gold text-xs font-bold">{number}</span>
      </div>
      <div className="flex items-center gap-2">
        {icon && <span className="text-brand-gold">{icon}</span>}
        <span className="text-brand-gold text-xs uppercase tracking-widest">{title}</span>
        <span className="text-brand-cream/40 text-xs">— {subtitle}</span>
      </div>
    </div>
  );
}
