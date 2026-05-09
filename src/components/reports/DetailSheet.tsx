import { formatCurrency } from "@/lib/utils";
import { computeInfraBreakdown } from "@/lib/calculations";
import type { Project } from "@/lib/types";

interface Props { project: Project }

// ─── Helpers ─────────────────────────────────────────────────────────────────

function toRaiNganWah(wah: number): string {
  const rai  = Math.floor(wah / 400);
  const ngan = Math.floor((wah % 400) / 100);
  const rem  = Math.round(wah % 100);
  return `${rai}-${ngan}-${rem}`;
}

function sqm(wah: number): string {
  return (wah * 4).toLocaleString("th-TH", { maximumFractionDigits: 1 });
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export function DetailSheet({ project }: Props) {
  const { input, result } = project;

  const totalWah       = result.totalLandSizeWah;
  const roadWah        = Math.round(totalWah * input.roadDeductionPercent / 100);
  const sellableWah    = result.sellableAreaWah;

  // ── Pull directly from aligned result ──
  const landCostTotal  = result.acquisitionCostTotal;
  const transferFee    = result.acquisitionTransferFee;
  const infraTotal     = result.infrastructureCostTotal;
  const operatingCost  = result.operatingCost;
  const totalCost      = result.totalProjectCost;
  const allInPerWah    = totalCost / sellableWah;

  // ── Section 3: per-plot (pro-rata from aligned totals) ──
  const avgPlotWah    = sellableWah / input.plotCount;
  const sellingPerWah = input.estimatedSellingPricePerWah;
  const costPerPlot   = totalCost / input.plotCount;
  const opCostPerPlot = operatingCost / input.plotCount;

  interface PlotRow {
    plotNo:      number;
    sizeWah:     number;
    allInCost:   number;
    opCost:      number;
    sellingPrice:number;
    sellingPerWah:number;
  }

  const plots: PlotRow[] = Array.from({ length: input.plotCount }, (_, i) => {
    const sz = parseFloat(avgPlotWah.toFixed(2));
    const sp = sz * sellingPerWah;
    return {
      plotNo:       i + 1,
      sizeWah:      sz,
      allInCost:    costPerPlot - opCostPerPlot,
      opCost:       opCostPerPlot,
      sellingPrice: sp,
      sellingPerWah: sp / sz,
    };
  });

  const totalRevenue = result.estimatedRevenue;
  const grossProfit  = result.grossProfit;

  const infraBreakdown = computeInfraBreakdown(
    input.developmentStandard,
    input.infrastructureCostPerWah,
    totalWah
  );

  return (
    <div className="max-w-5xl mx-auto space-y-0">
      <div className="rounded-xl overflow-hidden border border-brand-gold/30 shadow-2xl">

        {/* ── Report Header ── */}
        <div className="bg-gradient-to-r from-brand-navy to-brand-navy-mid px-8 py-5 border-b border-brand-gold/20">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 rounded bg-brand-gold flex items-center justify-center">
                <span className="text-brand-navy font-serif font-bold text-xs">L</span>
              </div>
              <div>
                <span className="text-brand-gold font-serif font-bold text-base tracking-wide">LANDOS</span>
                <span className="text-brand-cream/40 text-xs block leading-none tracking-widest uppercase">Detail Feasibility Sheet</span>
              </div>
            </div>
            <p className="text-brand-cream/30 text-xs">
              {new Date(project.createdAt).toLocaleDateString("th-TH", {
                day: "2-digit", month: "long", year: "numeric",
              })}
            </p>
          </div>
          <h1 className="text-2xl font-serif text-brand-cream">{input.projectName}</h1>
          <p className="text-brand-cream/50 text-sm">{input.location} · {input.developmentStandard} Standard</p>
        </div>

        <div className="bg-brand-navy-light p-8 space-y-10">

          {/* ════════════════════════════════════════════════════
              SECTION 0 — สัดส่วนที่ดินย่อย
          ════════════════════════════════════════════════════ */}
          <Section label="0" title="สัดส่วนที่ดินย่อย" subtitle="Land Subdivision Proportions">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-brand-gold/20">
                  <Th align="left">รายการ</Th>
                  <Th>ขนาด (ตร.ม.)</Th>
                  <Th>ขนาด (วา²)</Th>
                  <Th>ไร่-งาน-วา</Th>
                  <Th>%</Th>
                </tr>
              </thead>
              <tbody>
                <Tr>
                  <Td label>ที่ดินทั้งหมด</Td>
                  <Td>{sqm(totalWah)}</Td>
                  <Td>{totalWah.toLocaleString()}</Td>
                  <Td>{toRaiNganWah(totalWah)}</Td>
                  <Td>100%</Td>
                </Tr>
                <Tr>
                  <Td label>ตัดถนน / โครงสร้างสาธารณะ</Td>
                  <Td>{sqm(roadWah)}</Td>
                  <Td>{roadWah.toLocaleString()}</Td>
                  <Td>{toRaiNganWah(roadWah)}</Td>
                  <Td>{input.roadDeductionPercent.toFixed(1)}%</Td>
                </Tr>
                <TrHighlight>
                  <Td label bold>ที่ดินขายได้สุทธิ</Td>
                  <Td bold>{sqm(sellableWah)}</Td>
                  <Td bold>{Math.round(sellableWah).toLocaleString()}</Td>
                  <Td bold>{toRaiNganWah(Math.round(sellableWah))}</Td>
                  <Td bold>{(100 - input.roadDeductionPercent).toFixed(1)}%</Td>
                </TrHighlight>
              </tbody>
            </table>
          </Section>

          {/* ════════════════════════════════════════════════════
              SECTION 1 — ค่าราคาต้นทุนที่ดิน
          ════════════════════════════════════════════════════ */}
          <Section label="1" title="ค่าราคาต้นทุนที่ดิน" subtitle="Land Acquisition Cost">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-brand-gold/20">
                  <Th align="left">รายการ</Th>
                  <Th>ขนาด (วา²)</Th>
                  <Th>ราคา / วา²</Th>
                  <Th>ค่าที่ดิน</Th>
                  <Th>ค่าโอน / ภาษี</Th>
                  <Th>รวมทั้งหมด</Th>
                </tr>
              </thead>
              <tbody>
                <Tr>
                  <Td label>ที่ดิน (ซื้อ)</Td>
                  <Td>{totalWah.toLocaleString()}</Td>
                  <Td>{formatCurrency(input.acquisitionPricePerWah)}</Td>
                  <Td>{formatCurrency(landCostTotal)}</Td>
                  <Td>{formatCurrency(transferFee)}</Td>
                  <Td>{formatCurrency(landCostTotal + transferFee)}</Td>
                </Tr>
                <Tr>
                  <Td label>ค่าพัฒนาสาธารณูปโภค</Td>
                  <Td>{roadWah.toLocaleString()}</Td>
                  <Td>{formatCurrency(Math.round(infraTotal / roadWah))}</Td>
                  <Td>{formatCurrency(infraTotal)}</Td>
                  <Td>—</Td>
                  <Td>{formatCurrency(infraTotal)}</Td>
                </Tr>
                <TrHighlight>
                  <Td label bold>ที่ดินพัฒนาแล้ว (ต้นทุน / วา² ขายได้)</Td>
                  <Td bold>{Math.round(sellableWah).toLocaleString()}</Td>
                  <Td bold>{formatCurrency(allInPerWah)}</Td>
                  <Td bold>{formatCurrency(totalCost)}</Td>
                  <Td>—</Td>
                  <Td bold>{formatCurrency(totalCost)}</Td>
                </TrHighlight>
              </tbody>
            </table>
            <p className="text-brand-cream/30 text-xs mt-2 pl-1">
              ค่าโอน / ภาษี ประมาณ 6% ของราคาที่ดิน (อากรแสตมป์ + ค่าธรรมเนียมโอน + ภาษีธุรกิจเฉพาะ)
            </p>
          </Section>

          {/* ════════════════════════════════════════════════════
              SECTION 2 — ค่าการพัฒนาสาธารณูปโภค
          ════════════════════════════════════════════════════ */}
          <Section label="2" title="ค่าการพัฒนาสาธารณูปโภค" subtitle="Infrastructure Development Cost">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-brand-gold/20">
                  <Th align="left">รายการ</Th>
                  <Th align="left">รายละเอียด</Th>
                  <Th>ขนาด (วา²)</Th>
                  <Th>บาท / วา²</Th>
                  <Th>%</Th>
                  <Th>รวม</Th>
                </tr>
              </thead>
              <tbody>
                {infraBreakdown.items.map((item, i) => {
                  const costPerRoadWah = Math.round(item.totalCost / roadWah);
                  return (
                    <Tr key={i}>
                      <Td label>
                        <span className="flex items-center gap-2">
                          <span>{INFRA_ICONS[item.labelTh] ?? "•"}</span>
                          <span>{item.labelTh}</span>
                        </span>
                      </Td>
                      <Td align="left"><span className="text-brand-cream/40">{item.label}</span></Td>
                      <Td>{roadWah.toLocaleString()}</Td>
                      <Td>{costPerRoadWah.toLocaleString()}</Td>
                      <Td>{item.percent}%</Td>
                      <Td>{formatCurrency(item.totalCost)}</Td>
                    </Tr>
                  );
                })}
                <TrHighlight>
                  <Td label bold>รวมค่าพัฒนา</Td>
                  <Td align="left"><span className="text-brand-cream/40">{input.developmentStandard} Standard</span></Td>
                  <Td bold>{roadWah.toLocaleString()}</Td>
                  <Td bold>{Math.round(infraTotal / roadWah).toLocaleString()}</Td>
                  <Td bold>100%</Td>
                  <Td bold>{formatCurrency(infraBreakdown.totalProject)}</Td>
                </TrHighlight>
              </tbody>
            </table>
            <p className="text-brand-cream/30 text-xs mt-2 pl-1">
              ขนาดสาธารณูปโภค = พื้นที่ตัดถนน {roadWah.toLocaleString()} วา² · ค่าพัฒนาต่อวา²ขายได้ = {formatCurrency(Math.round(infraTotal / sellableWah))}
            </p>
          </Section>

          {/* ════════════════════════════════════════════════════
              SECTION 3 — ราคาจำหน่ายรายแปลง
          ════════════════════════════════════════════════════ */}
          <Section label="3" title="ราคาจำหน่ายรายแปลง" subtitle="Per-Plot Sales Pricing">
            <div className="overflow-x-auto -mx-1">
              <table className="w-full text-sm min-w-[780px]">
                <thead>
                  <tr className="border-b border-brand-gold/20">
                    <Th align="left">แปลง</Th>
                    <Th>ขนาด (วา²)</Th>
                    <Th>ต้นทุน / วา²</Th>
                    <Th>ต้นทุนแปลง</Th>
                    <Th>ค่าดำเนินการ 10%</Th>
                    <Th>ราคาขายรวม</Th>
                    <Th>ราคา / วา²</Th>
                  </tr>
                </thead>
                <tbody>
                  {plots.map((p, i) => (
                    <Tr key={i}>
                      <Td label>แปลงที่ {p.plotNo}</Td>
                      <Td>{p.sizeWah.toFixed(1)}</Td>
                      <Td>{formatCurrency(allInPerWah)}</Td>
                      <Td>{formatCurrency(p.allInCost)}</Td>
                      <Td>{formatCurrency(p.opCost)}</Td>
                      <Td highlight>{formatCurrency(p.sellingPrice)}</Td>
                      <Td>{formatCurrency(p.sellingPerWah)}</Td>
                    </Tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-brand-gold/30 bg-brand-navy-mid">
                    <td className="px-4 py-3 text-brand-cream/50 text-xs uppercase tracking-wider font-semibold" colSpan={3}>
                      รวมทั้งหมด ({input.plotCount} แปลง)
                    </td>
                    <td className="px-4 py-2.5 text-right text-brand-cream font-semibold text-sm">
                      {formatCurrency(totalCost - operatingCost)}
                    </td>
                    <td className="px-4 py-2.5 text-right text-brand-cream font-semibold text-sm">
                      {formatCurrency(operatingCost)}
                    </td>
                    <td className="px-4 py-2.5 text-right text-emerald-400 font-bold text-sm">
                      {formatCurrency(totalRevenue)}
                    </td>
                    <td className="px-4 py-2.5 text-right text-brand-gold font-semibold text-sm">
                      {formatCurrency(sellingPerWah)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
            <p className="text-brand-cream/30 text-xs mt-2 pl-1">
              ค่าดำเนินการ 10% ของ (ที่ดิน + ค่าโอน + สาธารณูปโภค)
            </p>
          </Section>

          {/* ════════════════════════════════════════════════════
              SECTION 4 — สรุปผล
          ════════════════════════════════════════════════════ */}
          <Section label="4" title="สรุปผล" subtitle="Project Summary">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

              {/* Cost stack */}
              <div className="rounded-lg border border-brand-gold/20 bg-brand-navy overflow-hidden">
                <div className="px-5 py-3 border-b border-brand-gold/15">
                  <p className="text-brand-cream/50 text-xs uppercase tracking-widest">ต้นทุนรวมโครงการ</p>
                </div>
                <div className="p-4 space-y-2.5">
                  <SummaryRow label="ค่าที่ดิน" value={formatCurrency(landCostTotal)} />
                  <SummaryRow label="ค่าโอน / ภาษี (6%)" value={formatCurrency(transferFee)} />
                  <SummaryRow label="ค่าพัฒนาสาธารณูปโภค" value={formatCurrency(infraTotal)} />
                  <SummaryRow label="ค่าดำเนินการ (10%)" value={formatCurrency(operatingCost)} />
                  <div className="border-t border-brand-gold/20 pt-2.5">
                    <SummaryRow label="รวมต้นทุนทั้งหมด" value={formatCurrency(totalCost)} bold />
                  </div>
                </div>
              </div>

              {/* Profit box */}
              <div className="rounded-lg border border-brand-gold/20 bg-brand-navy overflow-hidden">
                <div className="px-5 py-3 border-b border-brand-gold/15">
                  <p className="text-brand-cream/50 text-xs uppercase tracking-widest">ผลกำไร</p>
                </div>
                <div className="p-4 space-y-2.5">
                  <SummaryRow label="มูลค่าขายรวม" value={formatCurrency(totalRevenue)} />
                  <SummaryRow label="ต้นทุนรวม" value={formatCurrency(totalCost)} />
                  <div className="border-t border-brand-gold/20 pt-2.5">
                    <SummaryRow
                      label="กำไรสุทธิ"
                      value={formatCurrency(grossProfit)}
                      bold
                      color={grossProfit > 0 ? "green" : "red"}
                    />
                  </div>
                  <div className="mt-3 pt-3 border-t border-brand-gold/10 grid grid-cols-2 gap-3">
                    <MiniStat
                      label="Gross Margin"
                      value={`${((grossProfit / totalRevenue) * 100).toFixed(1)}%`}
                      color="gold"
                    />
                    <MiniStat
                      label="ROI on Cost"
                      value={`${((grossProfit / totalCost) * 100).toFixed(1)}%`}
                      color="gold"
                    />
                  </div>
                </div>
              </div>
            </div>
          </Section>

        </div>

        {/* Footer */}
        <div className="bg-brand-navy border-t border-brand-gold/20 px-8 py-4 flex items-center justify-between">
          <p className="text-brand-cream/20 text-xs">LANDOS — Detail Feasibility Sheet</p>
          <p className="text-brand-cream/20 text-xs">ตัวเลขเป็นการประมาณการเบื้องต้น ยังไม่รวมต้นทุนจริง</p>
        </div>
      </div>
    </div>
  );
}

// ─── Table primitives ────────────────────────────────────────────────────────

function Section({ label, title, subtitle, children }: {
  label: string; title: string; subtitle: string; children: React.ReactNode;
}) {
  return (
    <div>
      <div className="flex items-baseline gap-3 mb-3">
        <span className="text-brand-gold/50 text-xs font-mono">{label}.</span>
        <h3 className="text-brand-cream font-serif text-base">{title}</h3>
        <span className="text-brand-cream/30 text-xs">{subtitle}</span>
      </div>
      <div className="rounded-lg border border-brand-gold/20 bg-brand-navy overflow-hidden">
        {children}
      </div>
    </div>
  );
}

function Th({ children, align = "right" }: { children?: React.ReactNode; align?: "left" | "right" }) {
  return (
    <th className={`px-4 py-2.5 text-brand-cream/40 text-xs uppercase tracking-wider font-medium ${align === "left" ? "text-left" : "text-right"}`}>
      {children}
    </th>
  );
}

function Tr({ children }: { children: React.ReactNode }) {
  return <tr className="border-b border-brand-gold/8 hover:bg-brand-gold/3 transition-colors">{children}</tr>;
}

function TrHighlight({ children }: { children: React.ReactNode }) {
  return <tr className="border-t border-brand-gold/20 bg-brand-navy-mid">{children}</tr>;
}

function Td({ children, label, bold, highlight, align = "right" }: {
  children: React.ReactNode; label?: boolean; bold?: boolean; highlight?: boolean; align?: "left" | "right";
}) {
  return (
    <td className={`px-4 py-2.5 text-sm ${align === "left" ? "text-left" : "text-right"} ${
      highlight ? "text-emerald-400 font-semibold" :
      bold ? "text-brand-cream font-semibold" :
      label ? "text-brand-cream/70 text-left" :
      "text-brand-cream/70"
    }`}>
      {children}
    </td>
  );
}

function SummaryRow({ label, value, bold, color }: {
  label: string; value: string; bold?: boolean; color?: "green" | "red";
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-brand-cream/50 text-sm">{label}</span>
      <span className={
        color === "green" ? "text-emerald-400 font-bold text-base" :
        color === "red"   ? "text-red-400 font-bold text-base" :
        bold ? "text-brand-cream font-semibold" :
        "text-brand-cream/70 text-sm"
      }>
        {value}
      </span>
    </div>
  );
}

function MiniStat({ label, value, color }: { label: string; value: string; color?: "gold" }) {
  return (
    <div className="rounded border border-brand-gold/15 bg-brand-navy-light p-2.5 text-center">
      <p className="text-brand-cream/35 text-xs uppercase tracking-wider">{label}</p>
      <p className={color === "gold" ? "text-brand-gold font-semibold mt-0.5" : "text-brand-cream font-semibold mt-0.5"}>
        {value}
      </p>
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
