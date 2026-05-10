"use client";
import { useState } from "react";
import { formatCurrency, formatPercent, cn } from "@/lib/utils";
import type { Project } from "@/lib/types";

interface Props {
  project: Project;
  onInfraCostChange?: (cost: number) => void;
}

// ─── Infrastructure line-item definitions ────────────────────────────────────

interface InfraItem { quantity: number; unitPrice: number; }
interface InfraItems {
  road:        InfraItem;
  drainage:    InfraItem;
  electricity: InfraItem;
  waterSupply: InfraItem;
  fence:       InfraItem;
  lighting:    InfraItem;
  landscape:   InfraItem;
  gate:        InfraItem;
  landFilling: InfraItem;
  other:       number;
}

const ITEM_META: Array<{ key: keyof Omit<InfraItems, "other">; label: string; labelTh: string; unit: string; unitPrice: number }> = [
  { key: "road",        label: "Road (Asphalt / Concrete)", labelTh: "ถนน",              unit: "sq.m.",  unitPrice: 600    },
  { key: "drainage",    label: "Drainage System",           labelTh: "ระบบระบายน้ำ",     unit: "m",      unitPrice: 1200   },
  { key: "electricity", label: "Electricity / Cabling",     labelTh: "ระบบไฟฟ้า",        unit: "m",      unitPrice: 1500   },
  { key: "waterSupply", label: "Water Supply",              labelTh: "ระบบประปา",        unit: "m",      unitPrice: 400    },
  { key: "fence",       label: "Fence / Perimeter Wall",    labelTh: "รั้ว / กำแพง",     unit: "m",      unitPrice: 2000   },
  { key: "lighting",    label: "Street Lighting",           labelTh: "ไฟถนน",            unit: "units",  unitPrice: 45000  },
  { key: "landscape",   label: "Landscape / Greenery",      labelTh: "ภูมิสถาปัตย์",    unit: "sq.m.",  unitPrice: 300    },
  { key: "gate",        label: "Gate / Entrance",           labelTh: "ประตูทางเข้า",     unit: "sets",   unitPrice: 500000 },
  { key: "landFilling", label: "Land Filling / Grading",    labelTh: "ปรับถม",           unit: "m³",     unitPrice: 200    },
];

const ITEM_WEIGHTS: Record<keyof Omit<InfraItems, "other">, number> = {
  road: 0.42, drainage: 0.10, electricity: 0.13, waterSupply: 0.08,
  fence: 0.10, lighting: 0.07, landscape: 0.05, gate: 0.03, landFilling: 0.02,
};

function seedItems(savedInfraCost: number): InfraItems {
  const seed = (key: keyof Omit<InfraItems, "other">): InfraItem => {
    const meta = ITEM_META.find(m => m.key === key)!;
    const alloc = savedInfraCost * ITEM_WEIGHTS[key];
    return { quantity: Math.max(0, Math.round(alloc / meta.unitPrice)), unitPrice: meta.unitPrice };
  };
  return {
    road: seed("road"), drainage: seed("drainage"), electricity: seed("electricity"),
    waterSupply: seed("waterSupply"), fence: seed("fence"), lighting: seed("lighting"),
    landscape: seed("landscape"), gate: seed("gate"), landFilling: seed("landFilling"),
    other: 0,
  };
}

function sumItems(items: InfraItems): number {
  return ITEM_META.reduce((acc, m) => acc + items[m.key].quantity * items[m.key].unitPrice, 0) + items.other;
}

const MAX_PLOT_ROWS = 20;

export function DetailSheet2({ project, onInfraCostChange }: Props) {
  const { input, result } = project;

  const [items, setItems] = useState<InfraItems>(() => seedItems(result.infrastructureCostTotal));

  const liveInfra = sumItems(items);
  const isLive = liveInfra !== result.infrastructureCostTotal;

  function updateQty(key: keyof Omit<InfraItems, "other">, raw: string) {
    const qty = Math.max(0, parseFloat(raw) || 0);
    const next = { ...items, [key]: { ...items[key], quantity: qty } };
    setItems(next);
    onInfraCostChange?.(sumItems(next));
  }

  function updateOther(raw: string) {
    const val = parseFloat(raw) || 0;
    const next = { ...items, other: val };
    setItems(next);
    onInfraCostChange?.(sumItems(next));
  }

  // ── Derived land proportions ──────────────────────────────────────────────
  const totalWah    = result.totalLandSizeWah;
  const roadWah     = Math.round(totalWah * (input.roadDeductionPercent / 100) * 10) / 10;
  const sellWah     = result.sellableAreaWah;
  const avgPlotWah  = Math.round((sellWah / input.plotCount) * 10) / 10;
  const plotSizeSqm = Math.round(avgPlotWah * 4 * 10) / 10;

  // ── Per-plot with live infra ──────────────────────────────────────────────
  const landPerPlot      = Math.round(avgPlotWah * input.acquisitionPricePerWah);
  const infraPerPlot     = Math.round(liveInfra / input.plotCount);
  const transferPerPlot  = Math.round(result.acquisitionTransferFee / input.plotCount);
  const opPerPlot        = Math.round(result.operatingCost / input.plotCount);
  const totalCostPerPlot = landPerPlot + infraPerPlot + transferPerPlot + opPerPlot;
  const sellingPerPlot   = Math.round(avgPlotWah * input.estimatedSellingPricePerWah);
  const profitPerPlot    = sellingPerPlot - totalCostPerPlot;

  // ── Live financial totals ─────────────────────────────────────────────────
  const liveTotalCost = result.acquisitionCostTotal + result.acquisitionTransferFee + liveInfra + result.operatingCost;
  const liveProfit    = result.estimatedRevenue - liveTotalCost;
  const liveRoi       = liveTotalCost > 0 ? (liveProfit / liveTotalCost) * 100 : 0;
  const liveMargin    = result.estimatedRevenue > 0 ? (liveProfit / result.estimatedRevenue) * 100 : 0;

  const displayPlots = Math.min(input.plotCount, MAX_PLOT_ROWS);
  const hiddenPlots  = input.plotCount - displayPlots;

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
                <span className="text-brand-cream/40 text-xs block leading-none tracking-widest uppercase">Detailed Cost Breakdown</span>
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

        <div className="bg-brand-navy-light divide-y divide-brand-gold/10">

          {/* ── Section 0: สัดส่วนที่ดิน ── */}
          <section className="px-8 py-6">
            <SectionHeader number="0" title="สัดส่วนที่ดิน" subtitle="Land Proportion" />
            <div className="rounded-lg border border-brand-gold/20 bg-brand-navy overflow-hidden mt-4">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-brand-gold/15">
                    <th className="text-left px-4 py-3 text-brand-cream/40 text-xs uppercase tracking-wider font-medium">รายการ / Item</th>
                    <th className="text-right px-4 py-3 text-brand-cream/40 text-xs uppercase tracking-wider font-medium">wah²</th>
                    <th className="text-right px-4 py-3 text-brand-cream/40 text-xs uppercase tracking-wider font-medium">sq.m.</th>
                    <th className="text-right px-4 py-3 text-brand-cream/40 text-xs uppercase tracking-wider font-medium">%</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-brand-gold/10">
                    <td className="px-4 py-3 text-brand-cream/80">ถนน / Road &amp; Common Area</td>
                    <td className="px-4 py-3 text-right text-brand-cream/80">{roadWah.toLocaleString()}</td>
                    <td className="px-4 py-3 text-right text-brand-cream/80">{(roadWah * 4).toLocaleString()}</td>
                    <td className="px-4 py-3 text-right text-brand-cream/60">{input.roadDeductionPercent}%</td>
                  </tr>
                  <tr className="border-b border-brand-gold/10">
                    <td className="px-4 py-3 text-brand-cream/80">พื้นที่ขาย / Sellable Area</td>
                    <td className="px-4 py-3 text-right text-brand-cream/80">{sellWah.toFixed(1)}</td>
                    <td className="px-4 py-3 text-right text-brand-cream/80">{(sellWah * 4).toFixed(1)}</td>
                    <td className="px-4 py-3 text-right text-emerald-400">{(100 - input.roadDeductionPercent).toFixed(1)}%</td>
                  </tr>
                  <tr className="bg-brand-navy-mid">
                    <td className="px-4 py-3 text-brand-cream font-semibold">รวม / Total</td>
                    <td className="px-4 py-3 text-right text-brand-cream font-semibold">{totalWah.toLocaleString()}</td>
                    <td className="px-4 py-3 text-right text-brand-cream font-semibold">{(totalWah * 4).toLocaleString()}</td>
                    <td className="px-4 py-3 text-right text-brand-cream font-semibold">100%</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div className="grid grid-cols-3 gap-3 mt-3">
              <StatCell label="Total Plots" value={`${input.plotCount} plots`} />
              <StatCell label="Avg. Plot Size" value={`${avgPlotWah} wah² (${plotSizeSqm} sq.m.)`} />
              <StatCell label="Zoning / Road" value={`${input.zoning || "—"} · ${input.roadAccess || "—"}`} />
            </div>
          </section>

          {/* ── Section 1: ต้นทุนที่ดินทั้งสิ้น ── */}
          <section className="px-8 py-6">
            <SectionHeader number="1" title="ต้นทุนที่ดินทั้งสิ้น" subtitle="Total Land Acquisition Cost" />
            <div className="rounded-lg border border-brand-gold/20 bg-brand-navy overflow-hidden mt-4 divide-y divide-brand-gold/10">
              <DetailRow label="ราคาที่ดิน / Acquisition Price" value={`${input.acquisitionPricePerWah.toLocaleString()} THB/wah²`} />
              <DetailRow label="ขนาดที่ดินรวม / Total Land Size" value={`${totalWah.toLocaleString()} wah² (${input.landSizeRai} rai ${input.landSizeWah} wah²)`} />
              <DetailRow label="ค่าที่ดิน / Land Cost" value={formatCurrency(result.acquisitionCostTotal)} />
              <DetailRow label="ค่าโอน / Transfer Fee (6%)" value={formatCurrency(result.acquisitionTransferFee)} />
              <DetailRow
                label="รวมต้นทุนที่ดิน / Total Acquisition Investment"
                value={formatCurrency(result.acquisitionCostTotal + result.acquisitionTransferFee)}
                bold
              />
            </div>
          </section>

          {/* ── Section 2: ต้นทุนพัฒนาสาธารณูปโภค — Editable Line Items ── */}
          <section className="px-8 py-6">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <SectionHeader number="2" title="ต้นทุนพัฒนาสาธารณูปโภค" subtitle="Infrastructure Development Cost" />
              {isLive && (
                <span className="text-xs px-2 py-0.5 rounded bg-brand-gold/20 text-brand-gold border border-brand-gold/30">
                  Modified — saved: {formatCurrency(result.infrastructureCostTotal)}
                </span>
              )}
            </div>
            <p className="text-brand-cream/30 text-xs mt-1 mb-4">
              Adjust quantities to match your site conditions. Unit prices are fixed reference rates.
            </p>
            <div className="rounded-lg border border-brand-gold/20 bg-brand-navy overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm min-w-[640px]">
                  <thead>
                    <tr className="border-b border-brand-gold/15">
                      <th className="text-left px-4 py-3 text-brand-cream/40 text-xs uppercase tracking-wider font-medium">รายการ / Item</th>
                      <th className="text-center px-4 py-3 text-brand-cream/40 text-xs uppercase tracking-wider font-medium">Unit</th>
                      <th className="text-right px-4 py-3 text-brand-cream/40 text-xs uppercase tracking-wider font-medium">Quantity</th>
                      <th className="text-right px-4 py-3 text-brand-cream/40 text-xs uppercase tracking-wider font-medium">Unit Price (THB)</th>
                      <th className="text-right px-4 py-3 text-brand-cream/40 text-xs uppercase tracking-wider font-medium">Total (THB)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ITEM_META.map(({ key, label, labelTh, unit, unitPrice }) => {
                      const qty   = items[key].quantity;
                      const total = qty * unitPrice;
                      return (
                        <tr key={key} className="border-b border-brand-gold/10 hover:bg-brand-navy-light/20 transition-colors">
                          <td className="px-4 py-3">
                            <p className="text-brand-cream/80 text-sm">{label}</p>
                            <p className="text-brand-cream/40 text-xs">{labelTh}</p>
                          </td>
                          <td className="px-4 py-3 text-center text-brand-cream/50 text-xs">{unit}</td>
                          <td className="px-4 py-3 text-right">
                            <input
                              type="number"
                              min={0}
                              value={qty || ""}
                              onChange={e => updateQty(key, e.target.value)}
                              className="w-24 text-right bg-brand-navy-mid border border-brand-gold/20 rounded px-2 py-1.5 text-brand-cream text-sm focus:outline-none focus:border-brand-gold/60 transition-colors"
                            />
                          </td>
                          <td className="px-4 py-3 text-right text-brand-cream/50 text-sm">
                            {unitPrice.toLocaleString()}
                          </td>
                          <td className="px-4 py-3 text-right text-brand-cream/80 font-medium text-sm">
                            {total > 0 ? formatCurrency(total) : "—"}
                          </td>
                        </tr>
                      );
                    })}

                    {/* Other / Miscellaneous */}
                    <tr className="border-b border-brand-gold/10 hover:bg-brand-navy-light/20 transition-colors">
                      <td className="px-4 py-3">
                        <p className="text-brand-cream/80 text-sm">Other / Miscellaneous</p>
                        <p className="text-brand-cream/40 text-xs">อื่นๆ</p>
                      </td>
                      <td className="px-4 py-3 text-center text-brand-cream/50 text-xs">—</td>
                      <td className="px-4 py-3" colSpan={2} />
                      <td className="px-4 py-3 text-right">
                        <input
                          type="number"
                          min={0}
                          value={items.other || ""}
                          onChange={e => updateOther(e.target.value)}
                          placeholder="0"
                          className="w-28 text-right bg-brand-navy-mid border border-brand-gold/20 rounded px-2 py-1.5 text-brand-cream text-sm focus:outline-none focus:border-brand-gold/60 transition-colors"
                        />
                      </td>
                    </tr>

                    {/* Subtotal */}
                    <tr className="bg-brand-navy-mid">
                      <td colSpan={4} className="px-4 py-3 text-right text-brand-cream/50 text-xs uppercase tracking-wider font-medium">
                        รวมค่าพัฒนา / Total Infrastructure Cost
                      </td>
                      <td className={cn("px-4 py-3 text-right font-bold text-sm", isLive ? "text-brand-gold" : "text-brand-cream")}>
                        {formatCurrency(liveInfra)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 mt-3">
              <StatCell label="Per Wah² Equivalent" value={`${totalWah > 0 ? Math.round(liveInfra / totalWah).toLocaleString() : "—"} THB/wah²`} />
              <StatCell label="Per Plot (average)" value={formatCurrency(infraPerPlot)} />
            </div>
            <p className="text-brand-cream/25 text-xs mt-2 italic">
              Unit prices are reference rates. Adjust quantities based on actual site measurements and contractor quotations.
            </p>
          </section>

          {/* ── Section 3: ต้นทุนการขาย — Per-Plot Table ── */}
          <section className="px-8 py-6">
            <SectionHeader number="3" title="ต้นทุนการขาย" subtitle="Per-Plot Sales Analysis" />
            <div className="rounded-lg border border-brand-gold/20 bg-brand-navy overflow-hidden mt-4">
              <div className="overflow-x-auto">
                <table className="w-full text-sm min-w-[960px]">
                  <thead>
                    <tr className="border-b border-brand-gold/15">
                      <th className="text-center px-3 py-3 text-brand-cream/40 text-xs uppercase tracking-wider font-medium">แปลง</th>
                      <th className="text-right px-3 py-3 text-brand-cream/40 text-xs uppercase tracking-wider font-medium">wah²</th>
                      <th className="text-right px-3 py-3 text-brand-cream/40 text-xs uppercase tracking-wider font-medium">sq.m.</th>
                      <th className="text-right px-3 py-3 text-brand-cream/40 text-xs uppercase tracking-wider font-medium">ค่าที่ดิน</th>
                      <th className="text-right px-3 py-3 text-brand-cream/40 text-xs uppercase tracking-wider font-medium">ค่าพัฒนา</th>
                      <th className="text-right px-3 py-3 text-brand-cream/40 text-xs uppercase tracking-wider font-medium">ค่าโอน</th>
                      <th className="text-right px-3 py-3 text-brand-cream/40 text-xs uppercase tracking-wider font-medium">ค่าดำเนินการ</th>
                      <th className="text-right px-3 py-3 text-brand-cream/40 text-xs uppercase tracking-wider font-medium">รวมต้นทุน</th>
                      <th className="text-right px-3 py-3 text-brand-cream/40 text-xs uppercase tracking-wider font-medium">ราคาขาย</th>
                      <th className="text-right px-3 py-3 text-brand-cream/40 text-xs uppercase tracking-wider font-medium">กำไร</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Array.from({ length: displayPlots }, (_, i) => (
                      <tr key={i} className={cn(
                        "border-b border-brand-gold/8 last:border-b-0",
                        i % 2 === 0 ? "bg-transparent" : "bg-brand-navy-light/20"
                      )}>
                        <td className="px-3 py-2.5 text-center text-brand-cream/60 text-xs">{i + 1}</td>
                        <td className="px-3 py-2.5 text-right text-brand-cream/80 text-xs">{avgPlotWah}</td>
                        <td className="px-3 py-2.5 text-right text-brand-cream/80 text-xs">{plotSizeSqm}</td>
                        <td className="px-3 py-2.5 text-right text-brand-cream/70 text-xs">{landPerPlot.toLocaleString()}</td>
                        <td className={cn("px-3 py-2.5 text-right text-xs", isLive ? "text-brand-gold" : "text-brand-cream/70")}>{infraPerPlot.toLocaleString()}</td>
                        <td className="px-3 py-2.5 text-right text-brand-cream/70 text-xs">{transferPerPlot.toLocaleString()}</td>
                        <td className="px-3 py-2.5 text-right text-brand-cream/70 text-xs">{opPerPlot.toLocaleString()}</td>
                        <td className={cn("px-3 py-2.5 text-right text-xs font-medium", isLive ? "text-brand-gold" : "text-brand-cream/80")}>{totalCostPerPlot.toLocaleString()}</td>
                        <td className="px-3 py-2.5 text-right text-brand-gold text-xs font-medium">{sellingPerPlot.toLocaleString()}</td>
                        <td className={cn(
                          "px-3 py-2.5 text-right text-xs font-semibold",
                          profitPerPlot >= 0 ? "text-emerald-400" : "text-red-400"
                        )}>
                          {profitPerPlot.toLocaleString()}
                        </td>
                      </tr>
                    ))}
                    {hiddenPlots > 0 && (
                      <tr className="border-b border-brand-gold/10 bg-brand-navy-mid">
                        <td colSpan={10} className="px-3 py-2 text-center text-brand-cream/30 text-xs">
                          … and {hiddenPlots} more plots (identical size — equal-plot model)
                        </td>
                      </tr>
                    )}
                    {/* Total row */}
                    <tr className="bg-brand-navy-mid border-t border-brand-gold/20">
                      <td className="px-3 py-3 text-brand-cream/60 text-xs font-semibold text-center">รวม</td>
                      <td className="px-3 py-3 text-right text-brand-cream/80 text-xs font-semibold">{sellWah.toFixed(1)}</td>
                      <td className="px-3 py-3 text-right text-brand-cream/80 text-xs font-semibold">{(sellWah * 4).toFixed(1)}</td>
                      <td className="px-3 py-3 text-right text-brand-cream/70 text-xs font-semibold">{result.acquisitionCostTotal.toLocaleString()}</td>
                      <td className={cn("px-3 py-3 text-right text-xs font-semibold", isLive ? "text-brand-gold" : "text-brand-cream/70")}>{liveInfra.toLocaleString()}</td>
                      <td className="px-3 py-3 text-right text-brand-cream/70 text-xs font-semibold">{result.acquisitionTransferFee.toLocaleString()}</td>
                      <td className="px-3 py-3 text-right text-brand-cream/70 text-xs font-semibold">{result.operatingCost.toLocaleString()}</td>
                      <td className={cn("px-3 py-3 text-right font-bold text-xs", isLive ? "text-brand-gold" : "text-brand-cream")}>{liveTotalCost.toLocaleString()}</td>
                      <td className="px-3 py-3 text-right text-brand-gold font-bold text-xs">{result.estimatedRevenue.toLocaleString()}</td>
                      <td className={cn(
                        "px-3 py-3 text-right font-bold text-xs",
                        liveProfit >= 0 ? "text-emerald-400" : "text-red-400"
                      )}>
                        {liveProfit.toLocaleString()}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
            <p className="text-brand-cream/25 text-xs mt-2">
              Equal-plot model — all {input.plotCount} plots assumed identical size at {avgPlotWah} wah² ({plotSizeSqm} sq.m.) each.
            </p>
          </section>

          {/* ── Section 4: สรุปสุท — Financial Summary ── */}
          <section className="px-8 py-6">
            <SectionHeader number="4" title="สรุปสุท" subtitle="Financial Summary" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">

              <div className="rounded-lg border border-brand-gold/20 bg-brand-navy overflow-hidden divide-y divide-brand-gold/10">
                <div className="px-5 py-4">
                  <p className="text-brand-cream/40 text-xs uppercase tracking-wider">ยอดขายรวมสุทธิ / Net Revenue</p>
                  <p className="text-brand-gold text-2xl font-serif mt-1">{formatCurrency(result.estimatedRevenue)}</p>
                </div>
                <div className="px-5 py-4">
                  <p className="text-brand-cream/40 text-xs uppercase tracking-wider">มูลค่าการลงทุน / Total Investment</p>
                  <p className={cn("text-xl font-semibold mt-1", isLive ? "text-brand-gold" : "text-brand-cream")}>{formatCurrency(liveTotalCost)}</p>
                </div>
                <div className="px-5 py-4 bg-brand-navy-mid">
                  <p className="text-brand-cream/40 text-xs uppercase tracking-wider">กำไรสุทธิ / Net Profit</p>
                  <p className={cn("text-2xl font-serif mt-1", liveProfit >= 0 ? "text-emerald-400" : "text-red-400")}>
                    {formatCurrency(liveProfit)}
                  </p>
                </div>
              </div>

              <div className="rounded-lg border border-brand-gold/20 bg-brand-navy overflow-hidden divide-y divide-brand-gold/10">
                <div className="px-5 py-3">
                  <p className="text-brand-cream/40 text-xs uppercase tracking-wider mb-2">รายละเอียดการลงทุน / Investment Breakdown</p>
                  <div className="space-y-1.5">
                    <SummaryRow label="ค่าที่ดิน / Land Cost" value={formatCurrency(result.acquisitionCostTotal)} />
                    <SummaryRow label="ค่าพัฒนาโครงการ / Development Cost" value={formatCurrency(liveInfra)} highlight={isLive} />
                    <SummaryRow label="ค่าโอนสิทธิ์ / Transfer Fee" value={formatCurrency(result.acquisitionTransferFee)} />
                    <SummaryRow label="ค่าดำเนินการ / Operating Cost" value={formatCurrency(result.operatingCost)} />
                  </div>
                </div>
                <div className="px-5 py-3 grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-brand-cream/40 text-xs uppercase tracking-wider">ROI</p>
                    <p className={cn("text-xl font-semibold mt-0.5", liveRoi >= 20 ? "text-brand-gold" : "text-brand-cream")}>
                      {formatPercent(liveRoi)}
                    </p>
                  </div>
                  <div>
                    <p className="text-brand-cream/40 text-xs uppercase tracking-wider">Gross Margin</p>
                    <p className={cn("text-xl font-semibold mt-0.5", liveMargin >= 20 ? "text-emerald-400" : "text-brand-cream")}>
                      {formatPercent(liveMargin)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>

        </div>

        {/* Footer */}
        <div className="bg-brand-navy border-t border-brand-gold/20 px-8 py-4 flex items-center justify-between">
          <p className="text-brand-cream/20 text-xs">LANDOS — Detailed Cost Breakdown</p>
          <p className="text-brand-cream/20 text-xs">Equal-plot model. Unit prices are reference rates — verify with contractors.</p>
        </div>
      </div>
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function SectionHeader({ number, title, subtitle }: { number: string; title: string; subtitle: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="w-6 h-6 rounded-full bg-brand-gold/20 border border-brand-gold/40 flex items-center justify-center shrink-0">
        <span className="text-brand-gold text-xs font-bold">{number}</span>
      </div>
      <div>
        <span className="text-brand-gold text-xs uppercase tracking-widest">{title}</span>
        <span className="text-brand-cream/40 text-xs ml-2">— {subtitle}</span>
      </div>
    </div>
  );
}

function DetailRow({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className="px-4 py-3 flex items-center justify-between">
      <span className="text-brand-cream/60 text-sm">{label}</span>
      <span className={cn("text-sm", bold ? "text-brand-cream font-bold" : "text-brand-cream/80")}>{value}</span>
    </div>
  );
}

function StatCell({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded border border-brand-gold/10 bg-brand-navy px-3 py-2">
      <p className="text-brand-cream/40 text-xs uppercase tracking-wider">{label}</p>
      <p className="text-brand-cream text-sm font-medium mt-0.5">{value}</p>
    </div>
  );
}

function SummaryRow({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-brand-cream/50 text-xs">├ {label}</span>
      <span className={cn("text-xs font-medium", highlight ? "text-brand-gold" : "text-brand-cream/80")}>{value}</span>
    </div>
  );
}
