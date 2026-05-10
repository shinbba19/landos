"use client";
import { useState, useEffect } from "react";
import { formatCurrency, formatPercent, cn } from "@/lib/utils";
import type { Project, DevelopmentType } from "@/lib/types";
import { DEVELOPMENT_TYPES } from "@/lib/calculations";
import { AlertTriangle, Settings2, Sliders } from "lucide-react";

interface Props {
  project: Project;
  onInfraCostChange?: (cost: number) => void;
}

// ─── Infrastructure line items (local state only — not persisted) ─────────────

interface InfraItem { quantity: number; unitPrice: number; }
interface InfraItems {
  road:          InfraItem;  // sq.m.
  drainage:      InfraItem;  // m
  electricity:   InfraItem;  // m
  waterSupply:   InfraItem;  // m
  fence:         InfraItem;  // m
  lighting:      InfraItem;  // units
  landscape:     InfraItem;  // sq.m.
  gate:          InfraItem;  // sets
  landFilling:   InfraItem;  // m³
  other:         number;     // direct THB
}

const ITEM_META: Array<{
  key: keyof Omit<InfraItems, "other">;
  label: string;
  unit: string;
  defaultPrice: number;
}> = [
  { key: "road",        label: "Road (Asphalt / Concrete)", unit: "sq.m.",  defaultPrice: 600 },
  { key: "drainage",    label: "Drainage",                  unit: "m",      defaultPrice: 1200 },
  { key: "electricity", label: "Electricity / Cabling",     unit: "m",      defaultPrice: 1500 },
  { key: "waterSupply", label: "Water Supply",              unit: "m",      defaultPrice: 400 },
  { key: "fence",       label: "Fence / Perimeter Wall",    unit: "m",      defaultPrice: 2000 },
  { key: "lighting",    label: "Street Lighting",           unit: "units",  defaultPrice: 45000 },
  { key: "landscape",   label: "Landscape / Greenery",      unit: "sq.m.",  defaultPrice: 300 },
  { key: "gate",        label: "Gate / Entrance",           unit: "sets",   defaultPrice: 500000 },
  { key: "landFilling", label: "Land Filling / Grading",    unit: "m³",     defaultPrice: 200 },
];

// Distribute saved infrastructure cost proportionally so the default advanced total ≈ saved total
const ITEM_WEIGHTS: Record<keyof Omit<InfraItems, "other">, number> = {
  road: 0.42, drainage: 0.10, electricity: 0.13, waterSupply: 0.08,
  fence: 0.10, lighting: 0.07, landscape: 0.05, gate: 0.03, landFilling: 0.02,
};

function seedItems(savedInfraCost: number): InfraItems {
  const seed = (key: keyof Omit<InfraItems, "other">): InfraItem => {
    const meta = ITEM_META.find(m => m.key === key)!;
    const alloc = savedInfraCost * ITEM_WEIGHTS[key];
    return {
      quantity: Math.max(0, Math.round(alloc / meta.defaultPrice)),
      unitPrice: meta.defaultPrice,
    };
  };
  return {
    road:        seed("road"),
    drainage:    seed("drainage"),
    electricity: seed("electricity"),
    waterSupply: seed("waterSupply"),
    fence:       seed("fence"),
    lighting:    seed("lighting"),
    landscape:   seed("landscape"),
    gate:        seed("gate"),
    landFilling: seed("landFilling"),
    other:       0,
  };
}

function sumItems(items: InfraItems): number {
  return ITEM_META.reduce((acc, m) => acc + items[m.key].quantity * items[m.key].unitPrice, 0)
    + items.other;
}

const DEV_TYPE_LIST: DevelopmentType[] = ["Land Subdivision", "Standard Housing", "Premium Project"];

export function FeasibilityReport({ project, onInfraCostChange }: Props) {
  const { input, result } = project;

  const [mode, setMode] = useState<"simple" | "advanced">("simple");
  const [simpleType, setSimpleType] = useState<DevelopmentType>(input.developmentType);
  const [items, setItems] = useState<InfraItems>(() => seedItems(result.infrastructureCostTotal));

  // ── Live financials ──────────────────────────────────────────────────────
  const infraCost = mode === "simple"
    ? Math.round(result.acquisitionCostTotal * DEVELOPMENT_TYPES[simpleType].ratio)
    : sumItems(items);

  // Report live infra cost to parent so Detail Sheet stays in sync
  useEffect(() => {
    onInfraCostChange?.(infraCost);
  }, [infraCost, onInfraCostChange]);

  const totalCost   = result.acquisitionCostTotal + result.acquisitionTransferFee + infraCost + result.operatingCost;
  const grossProfit = result.estimatedRevenue - totalCost;
  const roi         = totalCost > 0 ? (grossProfit / totalCost) * 100 : 0;
  const margin      = result.estimatedRevenue > 0 ? (grossProfit / result.estimatedRevenue) * 100 : 0;

  function updateItem(key: keyof Omit<InfraItems, "other">, field: "quantity" | "unitPrice", raw: string) {
    const val = parseFloat(raw) || 0;
    setItems(prev => ({ ...prev, [key]: { ...prev[key], [field]: val } }));
  }

  return (
    <div className="space-y-6">

      {/* ── Validation Warnings ── */}
      {result.validationWarnings && result.validationWarnings.length > 0 && (
        <div className="rounded-lg border border-yellow-500/40 bg-yellow-500/5 p-5">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle size={14} className="text-yellow-400" />
            <span className="text-yellow-400 text-xs uppercase tracking-widest">Reality Check — Review Before Proceeding</span>
          </div>
          <ul className="space-y-1.5">
            {result.validationWarnings.map((w, i) => (
              <li key={i} className="text-brand-cream/70 text-sm flex items-start gap-2">
                <span className="text-yellow-500 mt-0.5 shrink-0">•</span>
                {w}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* ── Report card ── */}
      <div className="rounded-xl overflow-hidden border border-brand-gold/30">

        {/* Header */}
        <div className="bg-gradient-to-r from-brand-navy to-brand-navy-mid px-8 py-5 border-b border-brand-gold/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 rounded bg-brand-gold flex items-center justify-center">
                <span className="text-brand-navy font-serif font-bold text-xs">L</span>
              </div>
              <div>
                <span className="text-brand-gold font-serif font-bold text-base tracking-wide">LANDOS</span>
                <span className="text-brand-cream/40 text-xs block leading-none tracking-widest uppercase">Feasibility Analysis</span>
              </div>
            </div>
            <p className="text-brand-cream/30 text-xs">
              {new Date(project.createdAt).toLocaleDateString("en-GB", {
                day: "2-digit", month: "long", year: "numeric",
              })}
            </p>
          </div>
          <h1 className="text-xl font-serif text-brand-cream mt-4">{input.projectName}</h1>
          <p className="text-brand-cream/50 text-sm">{input.location}</p>
        </div>

        {/* Mode toggle */}
        <div className="bg-brand-navy px-8 py-4 flex items-center gap-3 border-b border-brand-gold/10">
          <span className="text-brand-cream/40 text-xs uppercase tracking-wider mr-2">Infrastructure Mode</span>
          <button
            onClick={() => setMode("simple")}
            className={cn(
              "flex items-center gap-1.5 px-4 py-2 rounded text-sm font-medium transition-all",
              mode === "simple"
                ? "bg-brand-gold text-brand-navy"
                : "text-brand-cream/50 hover:text-brand-cream border border-brand-gold/20 hover:border-brand-gold/50"
            )}
          >
            <Settings2 size={13} />
            Simple
          </button>
          <button
            onClick={() => setMode("advanced")}
            className={cn(
              "flex items-center gap-1.5 px-4 py-2 rounded text-sm font-medium transition-all",
              mode === "advanced"
                ? "bg-brand-gold text-brand-navy"
                : "text-brand-cream/50 hover:text-brand-cream border border-brand-gold/20 hover:border-brand-gold/50"
            )}
          >
            <Sliders size={13} />
            Advanced
          </button>
        </div>

        <div className="bg-brand-navy-light p-8 space-y-8">

          {/* ── SIMPLE MODE ── */}
          {mode === "simple" && (
            <div>
              <p className="text-brand-gold text-xs uppercase tracking-widest mb-4">Development Type</p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {DEV_TYPE_LIST.map(devType => {
                  const meta = DEVELOPMENT_TYPES[devType];
                  const cost = Math.round(result.acquisitionCostTotal * meta.ratio);
                  const isSelected = simpleType === devType;
                  return (
                    <button
                      key={devType}
                      onClick={() => setSimpleType(devType)}
                      className={cn(
                        "text-left rounded-lg border p-5 transition-all",
                        isSelected
                          ? "border-brand-gold bg-brand-gold/10 shadow-lg"
                          : "border-brand-gold/15 bg-brand-navy hover:border-brand-gold/40"
                      )}
                    >
                      {isSelected && (
                        <span className="text-xs px-2 py-0.5 rounded bg-brand-gold/20 text-brand-gold border border-brand-gold/40 font-semibold block w-fit mb-3">
                          SELECTED
                        </span>
                      )}
                      <p className="text-brand-cream/50 text-xs uppercase tracking-wider mb-0.5">{devType}</p>
                      <p className="text-brand-cream/40 text-xs mb-2">{meta.labelTh}</p>
                      <p className={cn(
                        "font-serif text-2xl mb-3",
                        isSelected ? "text-brand-gold" : "text-brand-cream"
                      )}>
                        {(meta.ratio * 100).toFixed(0)}%
                      </p>
                      <div className="border-t border-brand-gold/15 pt-3 space-y-1.5">
                        <ScenarioRow label="of land cost" value="" />
                        <ScenarioRow label="Land Cost" value={formatCurrency(result.acquisitionCostTotal)} />
                        <ScenarioRow label="Est. Dev. Cost" value={formatCurrency(cost)} highlight={isSelected} />
                      </div>
                      <p className="text-brand-cream/30 text-xs mt-3 leading-relaxed">{meta.includes}</p>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── ADVANCED MODE ── */}
          {mode === "advanced" && (
            <div>
              <p className="text-brand-gold text-xs uppercase tracking-widest mb-4">Infrastructure Line Items</p>
              <div className="rounded-lg border border-brand-gold/20 bg-brand-navy overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-brand-gold/15">
                      <th className="text-left px-4 py-3 text-brand-cream/40 text-xs uppercase tracking-wider font-medium">Item</th>
                      <th className="text-right px-4 py-3 text-brand-cream/40 text-xs uppercase tracking-wider font-medium">Qty</th>
                      <th className="text-center px-4 py-3 text-brand-cream/40 text-xs uppercase tracking-wider font-medium">Unit</th>
                      <th className="text-right px-4 py-3 text-brand-cream/40 text-xs uppercase tracking-wider font-medium">Unit Price (THB)</th>
                      <th className="text-right px-4 py-3 text-brand-cream/40 text-xs uppercase tracking-wider font-medium">Total (THB)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ITEM_META.map(({ key, label, unit }) => {
                      const item = items[key];
                      const total = item.quantity * item.unitPrice;
                      return (
                        <tr key={key} className="border-b border-brand-gold/10 last:border-b-0 hover:bg-brand-navy-light/30 transition-colors">
                          <td className="px-4 py-3 text-brand-cream/80 text-sm">{label}</td>
                          <td className="px-4 py-3 text-right">
                            <input
                              type="number"
                              min={0}
                              value={item.quantity || ""}
                              onChange={e => updateItem(key, "quantity", e.target.value)}
                              className="w-24 text-right bg-brand-navy-mid border border-brand-gold/20 rounded px-2 py-1 text-brand-cream text-sm focus:outline-none focus:border-brand-gold/60"
                            />
                          </td>
                          <td className="px-4 py-3 text-center text-brand-cream/50 text-xs">{unit}</td>
                          <td className="px-4 py-3 text-right">
                            <input
                              type="number"
                              min={0}
                              value={item.unitPrice || ""}
                              onChange={e => updateItem(key, "unitPrice", e.target.value)}
                              className="w-28 text-right bg-brand-navy-mid border border-brand-gold/20 rounded px-2 py-1 text-brand-cream text-sm focus:outline-none focus:border-brand-gold/60"
                            />
                          </td>
                          <td className="px-4 py-3 text-right text-brand-cream/80 font-medium">
                            {total > 0 ? formatCurrency(total) : "—"}
                          </td>
                        </tr>
                      );
                    })}
                    {/* Other */}
                    <tr className="border-b border-brand-gold/10 hover:bg-brand-navy-light/30 transition-colors">
                      <td className="px-4 py-3 text-brand-cream/80 text-sm">Other / Utilities</td>
                      <td className="px-4 py-3" colSpan={3} />
                      <td className="px-4 py-3 text-right">
                        <input
                          type="number"
                          min={0}
                          value={items.other || ""}
                          onChange={e => setItems(prev => ({ ...prev, other: parseFloat(e.target.value) || 0 }))}
                          className="w-28 text-right bg-brand-navy-mid border border-brand-gold/20 rounded px-2 py-1 text-brand-cream text-sm focus:outline-none focus:border-brand-gold/60"
                          placeholder="฿ amount"
                        />
                      </td>
                    </tr>
                    {/* Subtotal */}
                    <tr className="bg-brand-navy-mid">
                      <td colSpan={4} className="px-4 py-3 text-brand-cream/50 text-xs uppercase tracking-wider font-medium text-right">
                        Total Infrastructure Cost
                      </td>
                      <td className="px-4 py-3 text-right text-brand-gold font-semibold">
                        {formatCurrency(infraCost)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p className="text-brand-cream/25 text-xs mt-3 leading-relaxed">
                Default infrastructure prices are preliminary assumptions and should be adjusted based on actual site conditions and contractor quotations.
              </p>
            </div>
          )}

          {/* ── Financial Summary (always visible) ── */}
          <div>
            <p className="text-brand-gold text-xs uppercase tracking-widest mb-4">Financial Summary</p>
            <div className="rounded-lg border border-brand-gold/20 bg-brand-navy overflow-hidden">
              <div className="divide-y divide-brand-gold/10">
                <FinRow label="Estimated Revenue" value={formatCurrency(result.estimatedRevenue)} />
                <div className="px-5 py-1 bg-brand-navy-mid">
                  <p className="text-brand-cream/30 text-xs uppercase tracking-wider py-1">Cost Breakdown</p>
                </div>
                <FinRow label="Land Acquisition" value={formatCurrency(result.acquisitionCostTotal)} indent />
                <FinRow label="Transfer Fee (6%)" value={formatCurrency(result.acquisitionTransferFee)} indent />
                <FinRow
                  label={mode === "simple"
                    ? `Development Cost — ${simpleType} (${(DEVELOPMENT_TYPES[simpleType].ratio * 100).toFixed(0)}%)`
                    : "Development Cost — Advanced"
                  }
                  value={formatCurrency(infraCost)}
                  indent
                  highlight={infraCost !== result.infrastructureCostTotal}
                />
                <FinRow label="Operating Cost" value={formatCurrency(result.operatingCost)} indent />
                <FinRow label="Total Project Cost" value={formatCurrency(totalCost)} bold />
                <div className="px-5 py-4 flex items-center justify-between bg-brand-navy-mid">
                  <span className="text-brand-cream/60 text-sm font-medium">Net Profit</span>
                  <span className={cn(
                    "text-xl font-semibold",
                    grossProfit >= 0 ? "text-emerald-400" : "text-red-400"
                  )}>
                    {formatCurrency(grossProfit)}
                  </span>
                </div>
                <FinRow label="Return on Investment (ROI)" value={formatPercent(roi)} highlight={roi >= 20} />
                <FinRow label="Gross Margin" value={formatPercent(margin)} />
              </div>
            </div>
          </div>

          {/* Disclosure */}
          <p className="text-brand-cream/25 text-xs text-center">
            Infrastructure explorer — original saved development cost: {formatCurrency(result.infrastructureCostTotal)}. Changes here are not saved.
          </p>

        </div>

        {/* Footer */}
        <div className="bg-brand-navy border-t border-brand-gold/20 px-8 py-4 flex items-center justify-between">
          <p className="text-brand-cream/20 text-xs">LANDOS — Feasibility Analysis</p>
          <p className="text-brand-cream/20 text-xs">All figures are pre-tax estimates. Consult a financial advisor.</p>
        </div>
      </div>
    </div>
  );
}

function ScenarioRow({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="flex justify-between">
      <span className="text-brand-cream/40 text-xs">{label}</span>
      <span className={cn("text-xs", highlight ? "text-brand-gold font-semibold" : "text-brand-cream/70")}>{value}</span>
    </div>
  );
}

function FinRow({ label, value, bold, indent, highlight }: {
  label: string; value: string; bold?: boolean; indent?: boolean; highlight?: boolean;
}) {
  return (
    <div className={cn("px-5 py-3 flex items-center justify-between", indent && "pl-8")}>
      <span className={cn("text-sm", bold ? "text-brand-cream font-semibold" : "text-brand-cream/60")}>{label}</span>
      <span className={cn(
        "text-sm",
        bold ? "text-brand-cream font-bold" : "text-brand-cream/80",
        highlight && "text-brand-gold font-medium"
      )}>
        {value}
      </span>
    </div>
  );
}
