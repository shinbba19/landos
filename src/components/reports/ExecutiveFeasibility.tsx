import { formatCurrency, formatPercent } from "@/lib/utils";
import type { Project } from "@/lib/types";
import { Brain, AlertTriangle, Scale, Wrench, TrendingUp, FileText } from "lucide-react";
import { LandosScore } from "@/components/LandosScore";
import { computeInfraBreakdown } from "@/lib/calculations";

interface Props { project: Project }

export function ExecutiveFeasibility({ project }: Props) {
  const { input, result } = project;
  const totalCostPerWah = result.totalProjectCost / result.totalLandSizeWah;
  const marginOnCost = ((result.grossProfit / result.totalProjectCost) * 100);
  const landCostPercent   = (result.acquisitionCostTotal    / result.totalProjectCost * 100).toFixed(1);
  const transferFeePercent= (result.acquisitionTransferFee  / result.totalProjectCost * 100).toFixed(1);
  const infraCostPercent  = (result.infrastructureCostTotal / result.totalProjectCost * 100).toFixed(1);
  const opCostPercent     = (result.operatingCost           / result.totalProjectCost * 100).toFixed(1);

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
                <span className="text-brand-cream/40 text-xs block leading-none tracking-widest uppercase">Executive Feasibility Sheet</span>
              </div>
            </div>
            <p className="text-brand-cream/30 text-xs">
              {new Date(project.createdAt).toLocaleDateString("en-GB", {
                day: "2-digit", month: "long", year: "numeric",
              })}
            </p>
          </div>

          <h1 className="text-2xl font-serif text-brand-cream">{input.projectName}</h1>
          <p className="text-brand-cream/50 text-sm">{input.location} · {input.zoning} · {input.roadAccess}</p>
        </div>

        {/* Executive KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-4 bg-brand-navy-light border-b border-brand-gold/20">
          {[
            { label: "Total Dev. Cost", value: formatCurrency(result.totalProjectCost) },
            { label: "Revenue Estimate", value: formatCurrency(result.estimatedRevenue) },
            { label: "Gross Profit", value: formatCurrency(result.grossProfit) },
            { label: "Project ROI", value: formatPercent(result.roi) },
          ].map((k, i) => (
            <div key={i} className="px-6 py-4 border-r border-brand-gold/10 last:border-r-0">
              <p className="text-brand-cream/40 text-xs uppercase tracking-wider">{k.label}</p>
              <p className="text-brand-cream font-semibold text-lg mt-0.5">{k.value}</p>
            </div>
          ))}
        </div>

        <div className="bg-brand-navy-light p-8 space-y-8">

          {/* Infrastructure Breakdown */}
          <Section icon={<Wrench size={14} />} title="Infrastructure & Cost Breakdown">
            <div className="space-y-4">

              {/* Top-level cost split */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="rounded-lg border border-brand-gold/20 bg-brand-navy p-5">
                  <h4 className="text-brand-cream/60 text-xs uppercase tracking-widest mb-3">Total Cost Structure</h4>
                  <CostBar label="Land Acquisition" amount={result.acquisitionCostTotal} percent={Number(landCostPercent)} color="gold" />
                  <CostBar label="Transfer Fee / Tax (6%)" amount={result.acquisitionTransferFee} percent={Number(transferFeePercent)} color="orange" />
                  <CostBar label="Infrastructure" amount={result.infrastructureCostTotal} percent={Number(infraCostPercent)} color="blue" />
                  <CostBar label="Operating Cost (10%)" amount={result.operatingCost} percent={Number(opCostPercent)} color="purple" />
                  <div className="border-t border-brand-gold/20 pt-3 mt-3 space-y-1.5">
                    <Row label="Total Land Area" value={`${result.totalLandSizeWah} Wah²`} />
                    <Row label="Development Standard" value={input.developmentStandard} />
                    <Row label="All-in Cost / Wah²" value={formatCurrency(totalCostPerWah)} bold />
                  </div>
                </div>

                <div className="rounded-lg border border-brand-gold/20 bg-brand-navy p-5">
                  <h4 className="text-brand-cream/60 text-xs uppercase tracking-widest mb-3">Revenue Structure</h4>
                  <Row label="Sellable Area" value={`${result.sellableAreaWah.toFixed(0)} Wah²`} />
                  <Row label="Road Deduction" value={`${input.roadDeductionPercent}%`} />
                  <Row label="Selling Price / Wah²" value={formatCurrency(input.estimatedSellingPricePerWah)} />
                  <Row label="Plot Count" value={`${input.plotCount} plots`} />
                  <div className="border-t border-brand-gold/20 pt-3 mt-3">
                    <Row label="Revenue Estimate" value={formatCurrency(result.estimatedRevenue)} bold />
                  </div>
                </div>
              </div>

              {/* Infrastructure line-item breakdown */}
              <InfraLineBreakdown
                standard={input.developmentStandard}
                infraCostPerWah={input.infrastructureCostPerWah}
                totalLandSizeWah={result.totalLandSizeWah}
              />
            </div>
          </Section>

          {/* Profit Projection */}
          <Section icon={<TrendingUp size={14} />} title="Profit Projection">
            <div className="rounded-lg border border-brand-gold/20 bg-brand-navy p-5">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <ProfitMetric label="Gross Profit" value={formatCurrency(result.grossProfit)} color="green" />
                <ProfitMetric label="Gross Margin" value={formatPercent(result.grossProfitMargin)} color="green" />
                <ProfitMetric label="Return on Cost" value={formatPercent(marginOnCost)} color="gold" />
                <ProfitMetric label="ROI" value={formatPercent(result.roi)} color="gold" />
              </div>

              {/* Visual profit bar */}
              <div className="mt-5">
                <div className="flex items-center justify-between text-xs text-brand-cream/40 mb-1.5">
                  <span>Cost ({formatPercent(100 - result.grossProfitMargin)})</span>
                  <span>Profit ({formatPercent(result.grossProfitMargin)})</span>
                </div>
                <div className="w-full h-4 rounded-full bg-brand-navy-mid overflow-hidden flex">
                  <div
                    className="h-full bg-brand-gold/40 rounded-l-full transition-all"
                    style={{ width: `${100 - result.grossProfitMargin}%` }}
                  />
                  <div
                    className="h-full bg-emerald-500/60 rounded-r-full transition-all"
                    style={{ width: `${result.grossProfitMargin}%` }}
                  />
                </div>
              </div>
            </div>
          </Section>

          {/* Acquisition Logic */}
          <Section icon={<Scale size={14} />} title="Acquisition Logic">
            <div className="rounded-lg border border-brand-gold/20 bg-brand-navy p-5 space-y-2">
              <Row label="Acquisition Price / Wah²" value={formatCurrency(input.acquisitionPricePerWah)} />
              <Row label="Market Selling Price / Wah²" value={formatCurrency(input.estimatedSellingPricePerWah)} />
              <Row label="Price Multiplier" value={`${(input.estimatedSellingPricePerWah / input.acquisitionPricePerWah).toFixed(2)}×`} bold />
              <div className="border-t border-brand-gold/10 pt-3 mt-2">
                <p className="text-brand-cream/40 text-xs">
                  {(input.estimatedSellingPricePerWah / input.acquisitionPricePerWah) >= 2.5
                    ? "Strong acquisition economics — significant value creation between acquisition and market price."
                    : (input.estimatedSellingPricePerWah / input.acquisitionPricePerWah) >= 1.8
                    ? "Reasonable acquisition spread — leaves adequate margin after infrastructure and development."
                    : "Tight acquisition spread — margins are sensitive to cost overruns and market fluctuations."}
                </p>
              </div>
            </div>
          </Section>

          {/* Legal Observations */}
          <Section icon={<FileText size={14} />} title="Legal Observations">
            <div className="rounded-lg border border-brand-gold/20 bg-brand-navy p-5 space-y-3">
              <LegalNote
                label="Ownership Transfer"
                note="Transfer fees and taxes (approx. 2–3% of assessed value) should be included in total acquisition cost assumptions."
              />
              <LegalNote
                label="Zoning Compliance"
                note={`${input.zoning} zoning classification — confirm permitted residential subdivision density with local authority (อบต. / อบจ.) prior to acquisition.`}
              />
              <LegalNote
                label="Land Title"
                note="Verify Chanote (โฉนดที่ดิน) title status. NS-3K or Sor Por Kor titles carry additional transfer and conversion requirements."
              />
              <LegalNote
                label="Subdivision Approval"
                note="Subdivision projects above 1 rai typically require Land Subdivision Act (พ.ร.บ. จัดสรรที่ดิน) compliance and EIA/subdivision permit."
              />
            </div>
          </Section>

          {/* AI Insights */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="rounded-lg border border-brand-gold/20 bg-brand-navy p-5">
              <div className="flex items-center gap-2 mb-3">
                <Brain size={14} className="text-brand-gold" />
                <span className="text-brand-gold text-xs uppercase tracking-widest">Strategic Interpretation</span>
              </div>
              <p className="text-brand-cream/80 text-sm leading-relaxed italic">
                &ldquo;{result.aiExecutiveSummary}&rdquo;
              </p>
            </div>
            <div className="rounded-lg border border-yellow-500/20 bg-yellow-900/10 p-5">
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle size={14} className="text-yellow-400" />
                <span className="text-yellow-400 text-xs uppercase tracking-widest">Risk Factors</span>
              </div>
              <p className="text-brand-cream/80 text-sm leading-relaxed italic">
                &ldquo;{result.aiRiskNote}&rdquo;
              </p>
            </div>
          </div>

          {/* LANDOS Score */}
          <div className="rounded-lg border border-brand-gold/30 bg-gradient-to-r from-brand-gold/5 to-transparent p-6 flex items-center justify-between flex-wrap gap-6">
            <div>
              <p className="text-brand-gold text-xs uppercase tracking-widest mb-2">Project Summary</p>
              <p className="text-brand-cream text-sm max-w-sm">
                {result.aiExecutiveSummary.split(".")[0]}.
              </p>
            </div>
            <LandosScore score={result.landosScore} recommendation={result.recommendation} size="md" />
          </div>
        </div>

        {/* Footer */}
        <div className="bg-brand-navy border-t border-brand-gold/20 px-8 py-4 flex items-center justify-between">
          <p className="text-brand-cream/20 text-xs">LANDOS — Executive Feasibility Sheet</p>
          <p className="text-brand-cream/20 text-xs">All figures are preliminary estimates based on provided assumptions.</p>
        </div>
      </div>
    </div>
  );
}

function Section({ title, icon, children }: { title: string; icon?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        {icon && <span className="text-brand-gold">{icon}</span>}
        <h3 className="text-brand-gold text-xs uppercase tracking-widest">{title}</h3>
      </div>
      {children}
    </div>
  );
}

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className="flex items-center justify-between py-1">
      <span className="text-brand-cream/50 text-sm">{label}</span>
      <span className={bold ? "text-brand-cream font-semibold" : "text-brand-cream/80 text-sm"}>{value}</span>
    </div>
  );
}

function CostBar({ label, amount, percent, color }: {
  label: string; amount: number; percent: number; color: "gold" | "blue" | "orange" | "purple";
}) {
  const barColor =
    color === "gold"   ? "bg-brand-gold/60" :
    color === "orange" ? "bg-orange-500/50" :
    color === "purple" ? "bg-purple-500/50" :
    "bg-blue-500/50";
  return (
    <div>
      <div className="flex items-center justify-between text-xs mb-1">
        <span className="text-brand-cream/60">{label}</span>
        <span className="text-brand-cream/60">{formatCurrency(amount)} ({percent.toFixed(1)}%)</span>
      </div>
      <div className="h-2 rounded-full bg-brand-navy-mid overflow-hidden">
        <div className={`h-full rounded-full ${barColor}`} style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}

function ProfitMetric({ label, value, color }: { label: string; value: string; color: "gold" | "green" }) {
  return (
    <div className="text-center p-3 rounded border border-brand-gold/15 bg-brand-navy-light">
      <p className="text-brand-cream/40 text-xs uppercase tracking-wider">{label}</p>
      <p className={color === "gold" ? "text-brand-gold font-semibold text-lg mt-0.5" : "text-emerald-400 font-semibold text-lg mt-0.5"}>
        {value}
      </p>
    </div>
  );
}

function LegalNote({ label, note }: { label: string; note: string }) {
  return (
    <div className="border-l-2 border-brand-gold/30 pl-3">
      <p className="text-brand-cream/70 text-xs font-semibold uppercase tracking-wide">{label}</p>
      <p className="text-brand-cream/50 text-xs mt-0.5 leading-relaxed">{note}</p>
    </div>
  );
}

const INFRA_ICONS: Record<string, string> = {
  "ถนน": "🛣",
  "ประปา": "💧",
  "ไฟฟ้า": "⚡",
  "ระบบระบายน้ำ": "🌊",
  "รั้ว / ทางเข้า": "🚪",
  "รั้ว / ภูมิทัศน์": "🌿",
  "รั้ว / ภูมิทัศน์ / สระ": "🏊",
};

function InfraLineBreakdown({
  standard, infraCostPerWah, totalLandSizeWah,
}: {
  standard: import("@/lib/types").DevelopmentStandard;
  infraCostPerWah: number;
  totalLandSizeWah: number;
}) {
  const breakdown = computeInfraBreakdown(standard, infraCostPerWah, totalLandSizeWah);

  return (
    <div className="rounded-lg border border-brand-gold/20 bg-brand-navy overflow-hidden">
      <div className="px-5 py-3 border-b border-brand-gold/15 flex items-center justify-between">
        <h4 className="text-brand-cream/60 text-xs uppercase tracking-widest">Infrastructure Line Items</h4>
        <span className="text-brand-cream/30 text-xs">{standard} Standard</span>
      </div>

      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-brand-gold/10">
            <th className="text-left px-5 py-2.5 text-brand-cream/35 text-xs uppercase tracking-wider font-medium">Component</th>
            <th className="text-right px-5 py-2.5 text-brand-cream/35 text-xs uppercase tracking-wider font-medium w-12">%</th>
            <th className="text-right px-5 py-2.5 text-brand-cream/35 text-xs uppercase tracking-wider font-medium">Cost / Wah²</th>
            <th className="text-right px-5 py-2.5 text-brand-cream/35 text-xs uppercase tracking-wider font-medium">Total (Project)</th>
          </tr>
        </thead>
        <tbody>
          {breakdown.items.map((item, i) => (
            <tr key={i} className="border-b border-brand-gold/8 last:border-b-0">
              <td className="px-5 py-3">
                <div className="flex items-center gap-2.5">
                  <span className="text-base">{INFRA_ICONS[item.labelTh] ?? "•"}</span>
                  <div>
                    <p className="text-brand-cream/90 text-sm">{item.labelTh}</p>
                    <p className="text-brand-cream/35 text-xs">{item.label}</p>
                  </div>
                </div>
              </td>
              <td className="px-5 py-3 text-right">
                <div className="flex items-center justify-end gap-2">
                  <div className="w-12 h-1.5 rounded-full bg-brand-navy-mid overflow-hidden">
                    <div className="h-full rounded-full bg-brand-gold/50" style={{ width: `${item.percent}%` }} />
                  </div>
                  <span className="text-brand-cream/50 text-xs w-7 text-right">{item.percent}%</span>
                </div>
              </td>
              <td className="px-5 py-3 text-right text-brand-cream/80 text-sm">
                {item.costPerWah.toLocaleString()} THB
              </td>
              <td className="px-5 py-3 text-right text-brand-cream/80 text-sm">
                {formatCurrency(item.totalCost)}
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="bg-brand-navy-mid border-t border-brand-gold/20">
            <td className="px-5 py-3 text-brand-cream/60 text-xs uppercase tracking-wider font-semibold" colSpan={2}>
              Total Infrastructure
            </td>
            <td className="px-5 py-3 text-right text-brand-cream font-semibold text-sm">
              {breakdown.totalPerWah.toLocaleString()} THB/wah²
            </td>
            <td className="px-5 py-3 text-right text-brand-cream font-semibold text-sm">
              {formatCurrency(breakdown.totalProject)}
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
