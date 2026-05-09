"use client";
import { formatCurrency, formatPercent, cn } from "@/lib/utils";
import type { Project, SubdivisionScenario } from "@/lib/types";
import { Brain, Grid3x3, TrendingUp } from "lucide-react";

interface Props { project: Project }

export function SubdivisionAnalysis({ project }: Props) {
  const { input, result, scenarios } = project;

  const bestScenario = scenarios.reduce((best, s) =>
    s.profitMargin > best.profitMargin ? s : best
  );

  const aiScenarioRecommendation = `The ${bestScenario.label} configuration provides the strongest balance between profitability (${formatPercent(bestScenario.profitMargin)} margin) and road allocation efficiency (${bestScenario.roadDeductionPercent}% deduction). This scenario maximises sellable yield at ${formatPercent(bestScenario.efficiency)} land efficiency with ${bestScenario.plotCount} plots averaging ${bestScenario.avgPlotSizeWah} wah² each.`;

  return (
    <div className="max-w-4xl mx-auto space-y-0">
      <div className="rounded-xl overflow-hidden border border-brand-gold/30 shadow-2xl">

        {/* Header */}
        <div className="bg-gradient-to-r from-brand-navy to-brand-navy-mid px-8 py-6 border-b border-brand-gold/20">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 rounded bg-brand-gold flex items-center justify-center">
                <span className="text-brand-navy font-serif font-bold text-xs">L</span>
              </div>
              <div>
                <span className="text-brand-gold font-serif font-bold text-base tracking-wide">LANDOS</span>
                <span className="text-brand-cream/40 text-xs block leading-none tracking-widest uppercase">Subdivision Analysis Sheet</span>
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

        {/* Summary stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 bg-brand-navy border-b border-brand-gold/20">
          {[
            { label: "Total Land", value: `${result.totalLandSizeWah} Wah²` },
            { label: "Base Plots", value: `${input.plotCount} units` },
            { label: "Base Road Ded.", value: `${input.roadDeductionPercent}%` },
            { label: "Base Sellable", value: `${result.sellableAreaWah.toFixed(0)} Wah²` },
          ].map((s, i) => (
            <div key={i} className="px-6 py-4 border-r border-brand-gold/10 last:border-r-0">
              <p className="text-brand-cream/40 text-xs uppercase tracking-wider">{s.label}</p>
              <p className="text-brand-cream font-semibold mt-0.5">{s.value}</p>
            </div>
          ))}
        </div>

        <div className="bg-brand-navy-light p-8 space-y-8">

          {/* Scenario Comparison */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Grid3x3 size={14} className="text-brand-gold" />
              <h3 className="text-brand-gold text-xs uppercase tracking-widest">Scenario Comparison</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {scenarios.map((scenario, i) => (
                <ScenarioCard
                  key={i}
                  scenario={scenario}
                  isBest={scenario.label === bestScenario.label}
                  index={i}
                />
              ))}
            </div>
          </div>

          {/* Efficiency table */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp size={14} className="text-brand-gold" />
              <h3 className="text-brand-gold text-xs uppercase tracking-widest">Subdivision Efficiency Table</h3>
            </div>
            <div className="rounded-lg border border-brand-gold/20 bg-brand-navy overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-brand-gold/15">
                    <th className="text-left px-4 py-3 text-brand-cream/40 text-xs uppercase tracking-wider font-medium">Scenario</th>
                    <th className="text-right px-4 py-3 text-brand-cream/40 text-xs uppercase tracking-wider font-medium">Plots</th>
                    <th className="text-right px-4 py-3 text-brand-cream/40 text-xs uppercase tracking-wider font-medium">Avg. Plot</th>
                    <th className="text-right px-4 py-3 text-brand-cream/40 text-xs uppercase tracking-wider font-medium">Road Ded.</th>
                    <th className="text-right px-4 py-3 text-brand-cream/40 text-xs uppercase tracking-wider font-medium">Efficiency</th>
                    <th className="text-right px-4 py-3 text-brand-cream/40 text-xs uppercase tracking-wider font-medium">Margin</th>
                    <th className="text-right px-4 py-3 text-brand-cream/40 text-xs uppercase tracking-wider font-medium">Revenue</th>
                  </tr>
                </thead>
                <tbody>
                  {scenarios.map((s, i) => (
                    <tr
                      key={i}
                      className={cn(
                        "border-b border-brand-gold/10 last:border-b-0",
                        s.label === bestScenario.label ? "bg-brand-gold/5" : ""
                      )}
                    >
                      <td className="px-4 py-3 text-brand-cream text-sm">
                        <div className="flex items-center gap-2">
                          {s.label === bestScenario.label && (
                            <span className="text-xs px-1.5 py-0.5 rounded bg-brand-gold/20 text-brand-gold border border-brand-gold/30">
                              Best
                            </span>
                          )}
                          {s.label}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right text-brand-cream/80">{s.plotCount}</td>
                      <td className="px-4 py-3 text-right text-brand-cream/80">{s.avgPlotSizeWah} wah²</td>
                      <td className="px-4 py-3 text-right text-brand-cream/80">{s.roadDeductionPercent}%</td>
                      <td className="px-4 py-3 text-right">
                        <EfficiencyBadge value={s.efficiency} />
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className={s.profitMargin >= 25 ? "text-emerald-400 font-medium" : "text-brand-cream/80"}>
                          {formatPercent(s.profitMargin)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right text-brand-cream/80">{formatCurrency(s.revenueEstimate)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Subdivision breakdown for best scenario */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <h3 className="text-brand-gold text-xs uppercase tracking-widest">Recommended Configuration — {bestScenario.label}</h3>
            </div>
            <div className="rounded-lg border border-brand-gold/30 bg-brand-navy p-5">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <BreakdownStat label="Plot Count" value={`${bestScenario.plotCount} plots`} />
                <BreakdownStat label="Avg. Plot Size" value={`${bestScenario.avgPlotSizeWah} wah²`} />
                <BreakdownStat label="Road Deduction" value={`${bestScenario.roadDeductionPercent}%`} />
                <BreakdownStat label="Sellable Area" value={`${bestScenario.sellableAreaWah} wah²`} />
              </div>

              {/* Visual land allocation */}
              <div className="mt-2">
                <p className="text-brand-cream/40 text-xs uppercase tracking-wider mb-2">Land Allocation</p>
                <div className="flex h-8 rounded-lg overflow-hidden w-full gap-0.5">
                  <div
                    className="h-full bg-emerald-500/50 flex items-center justify-center"
                    style={{ width: `${bestScenario.efficiency}%` }}
                  >
                    <span className="text-emerald-200 text-xs font-medium">Sellable {bestScenario.efficiency}%</span>
                  </div>
                  <div
                    className="h-full bg-brand-gold/30 flex items-center justify-center"
                    style={{ width: `${bestScenario.roadDeductionPercent}%` }}
                  >
                    <span className="text-brand-gold text-xs font-medium">Road {bestScenario.roadDeductionPercent}%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* AI Scenario Recommendation */}
          <div className="rounded-lg border border-brand-gold/20 bg-brand-navy p-5">
            <div className="flex items-center gap-2 mb-3">
              <Brain size={14} className="text-brand-gold" />
              <span className="text-brand-gold text-xs uppercase tracking-widest">AI Scenario Recommendation</span>
            </div>
            <p className="text-brand-cream/80 text-sm leading-relaxed italic">
              &ldquo;{aiScenarioRecommendation}&rdquo;
            </p>
          </div>

          {/* Support note */}
          <div className="rounded-lg border border-brand-gold/10 bg-brand-navy p-4">
            <p className="text-brand-cream/40 text-xs uppercase tracking-wider mb-2">Subdivision Plan Support</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs text-brand-cream/50">
              <div className="flex items-start gap-2">
                <span className="text-brand-gold mt-0.5">•</span>
                <span>Upload subdivision sketches or land office plans to enrich this analysis</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-brand-gold mt-0.5">•</span>
                <span>Actual road widths and utility corridors may increase road deduction beyond estimates</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-brand-gold mt-0.5">•</span>
                <span>Confirm subdivision plan with licensed surveyor and local land office</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-brand-navy border-t border-brand-gold/20 px-8 py-4 flex items-center justify-between">
          <p className="text-brand-cream/20 text-xs">LANDOS — Subdivision Analysis Sheet</p>
          <p className="text-brand-cream/20 text-xs">Scenario data is preliminary — confirm with land surveyor.</p>
        </div>
      </div>
    </div>
  );
}

function ScenarioCard({ scenario, isBest, index }: {
  scenario: SubdivisionScenario; isBest: boolean; index: number;
}) {
  const labels = ["Conservative", "Balanced", "Aggressive"];
  const colors = ["blue", "gold", "orange"];
  const _ = colors[index];

  return (
    <div className={cn(
      "rounded-lg border p-5 transition-all",
      isBest
        ? "border-brand-gold/50 bg-brand-gold/5 shadow-lg"
        : "border-brand-gold/15 bg-brand-navy"
    )}>
      {isBest && (
        <div className="flex items-center gap-1.5 mb-3">
          <span className="text-xs px-2 py-0.5 rounded bg-brand-gold/20 text-brand-gold border border-brand-gold/40 font-semibold">
            RECOMMENDED
          </span>
        </div>
      )}
      <p className="text-brand-cream/50 text-xs uppercase tracking-wider mb-0.5">{labels[index] ?? "Scenario"}</p>
      <p className="text-brand-cream font-serif text-lg mb-4">{scenario.plotCount} Plots</p>

      <div className="space-y-2">
        <ScenarioRow label="Avg. Plot" value={`${scenario.avgPlotSizeWah} wah²`} />
        <ScenarioRow label="Road Ded." value={`${scenario.roadDeductionPercent}%`} />
        <ScenarioRow label="Sellable" value={`${scenario.sellableAreaWah} wah²`} />
        <ScenarioRow label="Efficiency" value={formatPercent(scenario.efficiency)} />
        <div className="border-t border-brand-gold/10 pt-2">
          <ScenarioRow
            label="Margin"
            value={formatPercent(scenario.profitMargin)}
            highlight={scenario.profitMargin >= 25}
          />
          <ScenarioRow label="Revenue" value={formatCurrency(scenario.revenueEstimate)} />
        </div>
      </div>
    </div>
  );
}

function ScenarioRow({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="flex justify-between">
      <span className="text-brand-cream/40 text-xs">{label}</span>
      <span className={highlight ? "text-emerald-400 text-xs font-semibold" : "text-brand-cream/70 text-xs"}>{value}</span>
    </div>
  );
}

function EfficiencyBadge({ value }: { value: number }) {
  const color = value >= 75 ? "text-emerald-400" : value >= 65 ? "text-brand-gold" : "text-yellow-500";
  return <span className={cn("font-medium", color)}>{formatPercent(value)}</span>;
}

function BreakdownStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="text-center rounded border border-brand-gold/15 bg-brand-navy-light p-3">
      <p className="text-brand-cream/40 text-xs uppercase tracking-wider">{label}</p>
      <p className="text-brand-cream font-medium mt-0.5">{value}</p>
    </div>
  );
}
