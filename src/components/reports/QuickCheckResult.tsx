import { LandosScore } from "@/components/LandosScore";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency, formatPercent } from "@/lib/utils";
import type { Project } from "@/lib/types";
import { Brain, TrendingUp, AlertTriangle, MapPin, Building2 } from "lucide-react";

interface Props { project: Project }

export function QuickCheckResult({ project }: Props) {
  const { input, result } = project;

  return (
    <div className="space-y-6">
      {/* Score banner */}
      <div className="rounded-lg border border-brand-gold/30 bg-gradient-to-r from-brand-navy-light to-brand-navy-mid p-6">
        <div className="flex items-start justify-between flex-wrap gap-6">
          <div className="flex-1 min-w-48">
            <p className="text-brand-gold text-xs uppercase tracking-widest mb-1">Quick Check Result</p>
            <h2 className="text-2xl font-serif text-brand-cream mb-1">{input.projectName}</h2>
            <div className="flex items-center gap-1.5 text-brand-cream/50 text-sm">
              <MapPin size={13} />
              <span>{input.location}</span>
            </div>
            <div className="flex items-center gap-2 mt-2">
              <Badge variant="gray"><Building2 size={10} className="mr-1" />{input.zoning}</Badge>
              <Badge variant="gray">{input.roadAccess}</Badge>
            </div>
          </div>
          <LandosScore score={result.landosScore} recommendation={result.recommendation} size="lg" />
        </div>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard label="Total ROI" value={formatPercent(result.roi)} color="gold" icon={<TrendingUp size={16} />} />
        <MetricCard label="Gross Margin" value={formatPercent(result.grossProfitMargin)} />
        <MetricCard label="Gross Profit" value={formatCurrency(result.grossProfit)} color="green" />
        <MetricCard label="Total Revenue" value={formatCurrency(result.estimatedRevenue)} />
      </div>

      {/* Cost Breakdown + Land Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle className="text-sm">Cost Breakdown</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <LineItem label="Land Size" value={`${result.totalLandSizeWah} Wah²`} />
            <LineItem label="Acquisition Cost" value={formatCurrency(result.acquisitionCostTotal)} />
            <LineItem label="Infrastructure Cost" value={formatCurrency(result.infrastructureCostTotal)} />
            <div className="border-t border-brand-gold/20 pt-3">
              <LineItem label="Total Project Cost" value={formatCurrency(result.totalProjectCost)} bold />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-sm">Revenue & Subdivision</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <LineItem label="Road Deduction" value={`${input.roadDeductionPercent}%`} />
            <LineItem label="Sellable Area" value={`${result.sellableAreaWah.toFixed(0)} Wah²`} />
            <LineItem label="Est. Plot Count" value={`${input.plotCount} plots`} />
            <div className="border-t border-brand-gold/20 pt-3">
              <LineItem label="Revenue Estimate" value={formatCurrency(result.estimatedRevenue)} bold />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* AI Intelligence */}
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

      {/* Score Factors */}
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

function LineItem({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-brand-cream/50 text-sm">{label}</span>
      <span className={bold ? "text-brand-cream font-semibold" : "text-brand-cream/80 text-sm"}>{value}</span>
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
