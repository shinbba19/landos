"use client";
import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ChevronRight, Loader2, ChevronDown, ChevronUp, Sparkles, Info, Camera, X } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { autoEstimate, runQuickCheck, generateScenarios, computeInfraBreakdown } from "@/lib/calculations";
import { saveProject } from "@/lib/store";
import { formatCurrency, formatPercent } from "@/lib/utils";
import type { DevelopmentStandard, QuickCheckInput, Project } from "@/lib/types";
import { cn } from "@/lib/utils";

const DEVELOPMENT_STANDARDS: Array<{
  value: DevelopmentStandard;
  label: string;
  description: string;
  detail: string;
}> = [
  {
    value: "Basic",
    label: "Basic",
    description: "Simple subdivision",
    detail: "Minimal road & utility infrastructure. Suitable for simple land parcelling or rural plots.",
  },
  {
    value: "Standard",
    label: "Standard",
    description: "Normal moo baan",
    detail: "Standard road width, drainage, and utility connections. Typical residential subdivision project.",
  },
  {
    value: "Premium",
    label: "Premium",
    description: "Gated / luxury estate",
    detail: "Wider roads, perimeter fencing, landscaping, guard post. Higher-end residential or luxury estate.",
  },
];

const ZONING_OPTIONS = [
  "ย.1", "ย.2", "ย.3", "ย.4",
  "พ.1", "พ.2", "พ.3",
  "ก.1", "ก.2",
  "Residential", "Mixed-Use", "Commercial", "Agricultural",
];

const ROAD_OPTIONS = [
  "Public Road", "Paved Road", "Concrete Road",
  "Asphalt Road", "Dirt Road", "No Access",
];

interface SimpleForm {
  projectName: string;
  location: string;
  landSizeRai: number;
  landSizeWah: number;
  acquisitionPricePerWah: number;
  estimatedSellingPricePerWah: number;
  plotCount: number;
  developmentStandard: DevelopmentStandard;
  zoning: string;
  roadAccess: string;
}

interface AdvancedOverrides {
  roadDeductionPercent: number | null;
  infrastructureCostPerWah: number | null;
}

const DEFAULT_FORM: SimpleForm = {
  projectName: "",
  location: "",
  landSizeRai: 2,
  landSizeWah: 0,
  acquisitionPricePerWah: 80000,
  estimatedSellingPricePerWah: 250000,
  plotCount: 8,
  developmentStandard: "Standard",
  zoning: "",
  roadAccess: "",
};

export default function NewProjectPage() {
  const router = useRouter();
  const [form, setForm] = useState<SimpleForm>(DEFAULT_FORM);
  const [advanced, setAdvanced] = useState<AdvancedOverrides>({
    roadDeductionPercent: null,
    infrastructureCostPerWah: null,
  });
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [loading, setLoading] = useState(false);
  const [heroImageBase64, setHeroImageBase64] = useState<string | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);

  function set<K extends keyof SimpleForm>(key: K, value: SimpleForm[K]) {
    setForm(prev => ({ ...prev, [key]: value }));
  }

  // Live auto-estimation
  const estimation = useMemo(
    () => autoEstimate(form.plotCount, form.developmentStandard),
    [form.plotCount, form.developmentStandard]
  );

  const resolvedRoadDed = advanced.roadDeductionPercent ?? estimation.roadDeductionPercent;
  const resolvedInfra = advanced.infrastructureCostPerWah ?? estimation.infrastructureCostPerWah;
  const totalWah = form.landSizeRai * 400 + form.landSizeWah;

  // Live preview calculation
  const preview = useMemo(() => {
    if (totalWah <= 0 || form.acquisitionPricePerWah <= 0 || form.estimatedSellingPricePerWah <= 0) return null;
    const sellable = totalWah * (1 - resolvedRoadDed / 100);
    const revenue = sellable * form.estimatedSellingPricePerWah;
    const cost = totalWah * (form.acquisitionPricePerWah + resolvedInfra);
    const profit = revenue - cost;
    const roi = (profit / cost) * 100;
    const margin = (profit / revenue) * 100;
    return { revenue, cost, profit, roi, margin };
  }, [totalWah, form.acquisitionPricePerWah, form.estimatedSellingPricePerWah, resolvedRoadDed, resolvedInfra]);

  function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    setImageError(null);
    const file = e.target.files?.[0];
    if (!file) return;
    if (!["image/jpeg", "image/png"].includes(file.type)) {
      setImageError("Only JPG and PNG files are allowed.");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setImageError("Image must be under 2MB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setHeroImageBase64(reader.result as string);
    reader.readAsDataURL(file);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const input: QuickCheckInput = {
      ...form,
      infrastructureCostPerWah: resolvedInfra,
      roadDeductionPercent: resolvedRoadDed,
      zoning: form.zoning || "Residential",
      roadAccess: form.roadAccess || "Public Road",
      advancedOverride: advanced.roadDeductionPercent !== null || advanced.infrastructureCostPerWah !== null,
    };
    const result = runQuickCheck(input);
    const scenarios = generateScenarios(input, totalWah, form.estimatedSellingPricePerWah);

    try {
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input, result }),
      });
      if (res.ok) {
        const ai = await res.json();
        if (ai.executiveSummary) result.aiExecutiveSummary = ai.executiveSummary;
        if (ai.riskNote) result.aiRiskNote = ai.riskNote;
      }
    } catch {
      // keep rule-based fallback already in result
    }

    const project: Project = {
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      heroImageBase64: heroImageBase64 ?? undefined,
      input,
      result,
      scenarios,
    };
    saveProject(project);
    router.push(`/projects/${project.id}`);
  }

  return (
    <div className="max-w-2xl mx-auto px-6 py-10">
      {/* Page header */}
      <div className="mb-8">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-brand-cream/50 hover:text-brand-cream text-sm mb-4 transition-colors"
        >
          <ArrowLeft size={14} />
          Back to Projects
        </Link>
        <div className="flex items-start gap-3">
          <div className="mt-1 w-8 h-8 rounded-full bg-brand-gold/15 border border-brand-gold/30 flex items-center justify-center shrink-0">
            <Sparkles size={15} className="text-brand-gold" />
          </div>
          <div>
            <h1 className="text-2xl font-serif text-brand-cream leading-tight">New Land Analysis</h1>
            <p className="text-brand-cream/50 text-sm mt-1">
              Enter basic land information — LANDOS handles the rest.
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">

        {/* ── Project Identity ── */}
        <FormSection label="Project">
          <div className="space-y-3">
            <Field label="Project Name">
              <Input
                placeholder="e.g. Chaengwattana Land Project"
                value={form.projectName}
                onChange={e => set("projectName", e.target.value)}
                required
              />
            </Field>
            <Field label="Location">
              <Input
                placeholder="e.g. Bang Yai, Nonthaburi"
                value={form.location}
                onChange={e => set("location", e.target.value)}
                required
              />
            </Field>
          </div>
        </FormSection>

        {/* ── Property Photo ── */}
        <FormSection label="Property Photo (Optional)">
          <div>
            {!heroImageBase64 ? (
              <label className="flex flex-col items-center gap-2 p-6 rounded-lg border border-dashed border-brand-gold/30 bg-brand-navy cursor-pointer hover:border-brand-gold/50 transition-colors">
                <Camera size={24} className="text-brand-gold/40" />
                <span className="text-brand-cream/40 text-sm">Upload a property photo</span>
                <span className="text-brand-cream/25 text-xs">JPG or PNG, max 2MB</span>
                <input
                  type="file"
                  accept="image/jpeg,image/png"
                  className="hidden"
                  onChange={handleImageUpload}
                />
              </label>
            ) : (
              <div className="relative rounded-lg overflow-hidden border border-brand-gold/30">
                <img src={heroImageBase64} alt="Property" className="w-full h-48 object-cover" />
                <button
                  type="button"
                  onClick={() => setHeroImageBase64(null)}
                  className="absolute top-2 right-2 p-1.5 rounded bg-brand-navy/80 text-brand-cream/60 hover:text-red-400 transition-colors"
                >
                  <X size={14} />
                </button>
              </div>
            )}
            {imageError && <p className="text-red-400 text-xs mt-2">{imageError}</p>}
          </div>
        </FormSection>

        {/* ── Land Size ── */}
        <FormSection label="Land Size">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Rai">
              <Input
                type="number" min={0} step={1}
                value={form.landSizeRai}
                onChange={e => set("landSizeRai", Number(e.target.value))}
                required
              />
            </Field>
            <Field label="Wah²">
              <Input
                type="number" min={0} max={399} step={1}
                value={form.landSizeWah}
                onChange={e => set("landSizeWah", Number(e.target.value))}
              />
            </Field>
          </div>
          {totalWah > 0 && (
            <p className="text-brand-cream/35 text-xs mt-2">
              {totalWah} wah² total &nbsp;·&nbsp; {(totalWah * 4).toFixed(0)} m²
            </p>
          )}
        </FormSection>

        {/* ── Pricing ── */}
        <FormSection label="Pricing">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Acquisition Price / Wah² (THB)">
              <Input
                type="number" min={0}
                value={form.acquisitionPricePerWah}
                onChange={e => set("acquisitionPricePerWah", Number(e.target.value))}
                required
              />
            </Field>
            <Field label="Estimated Selling Price / Wah² (THB)">
              <Input
                type="number" min={0}
                value={form.estimatedSellingPricePerWah}
                onChange={e => set("estimatedSellingPricePerWah", Number(e.target.value))}
                required
              />
            </Field>
          </div>
          {form.acquisitionPricePerWah > 0 && form.estimatedSellingPricePerWah > 0 && (
            <p className="text-brand-cream/35 text-xs mt-2">
              Price multiplier: {(form.estimatedSellingPricePerWah / form.acquisitionPricePerWah).toFixed(1)}×
            </p>
          )}
        </FormSection>

        {/* ── Plot Count ── */}
        <FormSection label="Estimated Plot Count">
          <div className="flex items-center gap-4">
            <div className="w-32">
              <Input
                type="number" min={1}
                value={form.plotCount}
                onChange={e => set("plotCount", Math.max(1, Number(e.target.value)))}
                required
              />
            </div>
            <p className="text-brand-cream/40 text-sm">plots</p>
          </div>
        </FormSection>

        {/* ── Development Standard ── */}
        <FormSection label="Development Standard">
          <div className="grid grid-cols-3 gap-3">
            {DEVELOPMENT_STANDARDS.map(std => (
              <button
                key={std.value}
                type="button"
                onClick={() => set("developmentStandard", std.value)}
                className={cn(
                  "rounded-lg border p-4 text-left transition-all cursor-pointer",
                  form.developmentStandard === std.value
                    ? "border-brand-gold bg-brand-gold/10 shadow-lg shadow-brand-gold/10"
                    : "border-brand-gold/20 bg-brand-navy hover:border-brand-gold/40"
                )}
              >
                <div className={cn(
                  "w-2 h-2 rounded-full mb-3",
                  form.developmentStandard === std.value ? "bg-brand-gold" : "bg-brand-navy-mid"
                )} />
                <p className={cn(
                  "font-semibold text-sm mb-0.5",
                  form.developmentStandard === std.value ? "text-brand-gold" : "text-brand-cream"
                )}>
                  {std.label}
                </p>
                <p className="text-brand-cream/50 text-xs">{std.description}</p>
              </button>
            ))}
          </div>
          <p className="text-brand-cream/35 text-xs mt-3 leading-relaxed">
            {DEVELOPMENT_STANDARDS.find(s => s.value === form.developmentStandard)?.detail}
          </p>
        </FormSection>

        {/* ── LANDOS Estimation Preview ── */}
        {totalWah > 0 && form.acquisitionPricePerWah > 0 && (
          <div className="rounded-lg border border-brand-gold/25 bg-gradient-to-r from-brand-navy-mid/60 to-brand-navy p-4 space-y-4">
            <div className="flex items-center gap-2">
              <Sparkles size={13} className="text-brand-gold" />
              <span className="text-brand-gold text-xs uppercase tracking-widest">LANDOS Auto-Estimation</span>
              <span className="ml-auto text-brand-cream/30 text-xs">
                {advanced.roadDeductionPercent !== null || advanced.infrastructureCostPerWah !== null
                  ? "Advanced override active"
                  : "Smart defaults applied"}
              </span>
            </div>

            {/* Top KPIs */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <EstimateCard label="Road Deduction" value={`${resolvedRoadDed}%`} />
              <EstimateCard label="Infra Cost / Wah²" value={formatCurrency(resolvedInfra).replace(" THB", "")} unit="THB" />
              {preview && (
                <>
                  <EstimateCard label="Est. ROI" value={formatPercent(preview.roi)} color={preview.roi >= 25 ? "green" : preview.roi >= 15 ? "gold" : "red"} />
                  <EstimateCard label="Gross Margin" value={formatPercent(preview.margin)} color={preview.margin >= 20 ? "green" : "gold"} />
                </>
              )}
            </div>

            {/* Infrastructure Breakdown */}
            <InfraBreakdownPreview
              standard={form.developmentStandard}
              infraCostPerWah={resolvedInfra}
              totalLandSizeWah={totalWah}
            />

            <p className="text-brand-cream/30 text-xs italic">{estimation.rationale}</p>
          </div>
        )}

        {/* ── Optional Context ── */}
        <details className="group">
          <summary className="flex items-center justify-between cursor-pointer py-3 px-4 rounded-lg border border-brand-gold/15 bg-brand-navy hover:border-brand-gold/30 transition-colors list-none">
            <span className="text-brand-cream/60 text-sm">Optional: Zoning & Road Access</span>
            <ChevronDown size={15} className="text-brand-cream/30 group-open:rotate-180 transition-transform" />
          </summary>
          <div className="mt-3 grid grid-cols-2 gap-3 px-1">
            <Field label="Zoning Type">
              <select
                className="flex h-10 w-full rounded border border-brand-gold/30 bg-brand-navy px-3 py-2 text-sm text-brand-cream focus:outline-none focus:border-brand-gold transition-colors"
                value={form.zoning}
                onChange={e => set("zoning", e.target.value)}
              >
                <option value="" className="bg-brand-navy text-brand-cream/50">Not specified</option>
                {ZONING_OPTIONS.map(z => (
                  <option key={z} value={z} className="bg-brand-navy">{z}</option>
                ))}
              </select>
            </Field>
            <Field label="Road Access">
              <select
                className="flex h-10 w-full rounded border border-brand-gold/30 bg-brand-navy px-3 py-2 text-sm text-brand-cream focus:outline-none focus:border-brand-gold transition-colors"
                value={form.roadAccess}
                onChange={e => set("roadAccess", e.target.value)}
              >
                <option value="" className="bg-brand-navy text-brand-cream/50">Not specified</option>
                {ROAD_OPTIONS.map(r => (
                  <option key={r} value={r} className="bg-brand-navy">{r}</option>
                ))}
              </select>
            </Field>
          </div>
        </details>

        {/* ── Advanced Settings ── */}
        <div className="rounded-lg border border-brand-gold/10 overflow-hidden">
          <button
            type="button"
            onClick={() => setShowAdvanced(v => !v)}
            className="w-full flex items-center justify-between px-4 py-3 bg-brand-navy hover:bg-brand-navy-light transition-colors text-left"
          >
            <div className="flex items-center gap-2">
              <span className="text-brand-cream/40 text-sm">Advanced Developer Settings</span>
              {(advanced.roadDeductionPercent !== null || advanced.infrastructureCostPerWah !== null) && (
                <span className="text-xs px-1.5 py-0.5 rounded bg-brand-gold/20 text-brand-gold border border-brand-gold/30">
                  Override active
                </span>
              )}
            </div>
            {showAdvanced
              ? <ChevronUp size={15} className="text-brand-cream/30" />
              : <ChevronDown size={15} className="text-brand-cream/30" />}
          </button>

          {showAdvanced && (
            <div className="px-4 pb-4 pt-3 bg-brand-navy border-t border-brand-gold/10 space-y-4">
              <div className="flex items-start gap-2 p-3 rounded bg-brand-navy-mid">
                <Info size={13} className="text-brand-gold/60 mt-0.5 shrink-0" />
                <p className="text-brand-cream/40 text-xs leading-relaxed">
                  LANDOS has auto-estimated these values from your plot count and development standard.
                  Only override if you have detailed engineering or site-specific data.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Field label={`Road Deduction % (auto: ${estimation.roadDeductionPercent}%)`}>
                  <Input
                    type="number" min={0} max={60} step={0.5}
                    placeholder={String(estimation.roadDeductionPercent)}
                    value={advanced.roadDeductionPercent ?? ""}
                    onChange={e =>
                      setAdvanced(prev => ({
                        ...prev,
                        roadDeductionPercent: e.target.value === "" ? null : Number(e.target.value),
                      }))
                    }
                  />
                </Field>
                <Field label={`Infra Cost / Wah² (auto: ${estimation.infrastructureCostPerWah.toLocaleString()})`}>
                  <Input
                    type="number" min={0}
                    placeholder={String(estimation.infrastructureCostPerWah)}
                    value={advanced.infrastructureCostPerWah ?? ""}
                    onChange={e =>
                      setAdvanced(prev => ({
                        ...prev,
                        infrastructureCostPerWah: e.target.value === "" ? null : Number(e.target.value),
                      }))
                    }
                  />
                </Field>
              </div>

              {(advanced.roadDeductionPercent !== null || advanced.infrastructureCostPerWah !== null) && (
                <button
                  type="button"
                  onClick={() => setAdvanced({ roadDeductionPercent: null, infrastructureCostPerWah: null })}
                  className="text-xs text-brand-gold/60 hover:text-brand-gold transition-colors"
                >
                  ↺ Reset to LANDOS auto-estimate
                </button>
              )}
            </div>
          )}
        </div>

        {/* ── Submit ── */}
        <Button type="submit" variant="gold" size="xl" className="w-full" disabled={loading}>
          {loading ? (
            <><Loader2 size={18} className="animate-spin" /> Analyzing Land...</>
          ) : (
            <>Generate Feasibility Report <ChevronRight size={18} /></>
          )}
        </Button>

        <p className="text-center text-brand-cream/25 text-xs">
          LANDOS generates investor-ready reports from your inputs. All calculations are deterministic and transparent.
        </p>
      </form>
    </div>
  );
}

// ─── Infrastructure Breakdown Preview ────────────────────────────────────────

function InfraBreakdownPreview({
  standard, infraCostPerWah, totalLandSizeWah,
}: {
  standard: DevelopmentStandard;
  infraCostPerWah: number;
  totalLandSizeWah: number;
}) {
  const breakdown = computeInfraBreakdown(standard, infraCostPerWah, totalLandSizeWah);
  const hasTotal = totalLandSizeWah > 0;

  const ICONS: Record<string, string> = {
    "ถนน": "🛣",
    "ประปา": "💧",
    "ไฟฟ้า": "⚡",
    "ระบบระบายน้ำ": "🌊",
    "รั้ว / ทางเข้า": "🚪",
    "รั้ว / ภูมิทัศน์": "🌿",
    "รั้ว / ภูมิทัศน์ / สระ": "🏊",
  };

  return (
    <div>
      <p className="text-brand-cream/35 text-xs uppercase tracking-widest mb-2">Infrastructure Breakdown</p>
      <div className="rounded border border-brand-gold/10 bg-brand-navy overflow-hidden">
        {breakdown.items.map((item, i) => (
          <div
            key={i}
            className="flex items-center gap-3 px-3 py-2 border-b border-brand-gold/8 last:border-b-0"
          >
            <span className="text-base w-5 shrink-0">{ICONS[item.labelTh] ?? "•"}</span>
            <div className="flex-1 min-w-0">
              <div className="flex items-baseline gap-1.5">
                <span className="text-brand-cream/80 text-xs font-medium">{item.labelTh}</span>
                <span className="text-brand-cream/30 text-xs">({item.label})</span>
              </div>
              {/* Bar */}
              <div className="w-full h-1 rounded-full bg-brand-navy-mid mt-1 overflow-hidden">
                <div
                  className="h-full rounded-full bg-brand-gold/40"
                  style={{ width: `${item.percent}%` }}
                />
              </div>
            </div>
            <div className="text-right shrink-0">
              <p className="text-brand-cream/70 text-xs">{item.costPerWah.toLocaleString()} /wah²</p>
              {hasTotal && (
                <p className="text-brand-cream/35 text-xs">{formatCurrency(item.totalCost)}</p>
              )}
            </div>
            <span className="text-brand-cream/30 text-xs w-8 text-right shrink-0">{item.percent}%</span>
          </div>
        ))}
        {/* Total row */}
        <div className="flex items-center justify-between px-3 py-2 bg-brand-navy-mid">
          <span className="text-brand-cream/50 text-xs uppercase tracking-wider">Total Infrastructure</span>
          <div className="text-right">
            <span className="text-brand-cream text-xs font-semibold">
              {breakdown.totalPerWah.toLocaleString()} THB/wah²
            </span>
            {hasTotal && (
              <span className="text-brand-cream/50 text-xs ml-2">
                = {formatCurrency(breakdown.totalProject)}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function FormSection({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-brand-gold/15 bg-brand-navy-light overflow-hidden">
      <div className="px-4 py-2.5 border-b border-brand-gold/10 bg-brand-navy">
        <p className="text-brand-cream/40 text-xs uppercase tracking-widest">{label}</p>
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <Label className="block mb-1.5">{label}</Label>
      {children}
    </div>
  );
}

function EstimateCard({
  label, value, unit, color,
}: {
  label: string; value: string; unit?: string; color?: "green" | "gold" | "red";
}) {
  const valueClass =
    color === "green" ? "text-emerald-400" :
    color === "gold"  ? "text-brand-gold" :
    color === "red"   ? "text-red-400" :
    "text-brand-cream";

  return (
    <div className="rounded border border-brand-gold/10 bg-brand-navy px-3 py-2">
      <p className="text-brand-cream/35 text-xs uppercase tracking-wider leading-tight">{label}</p>
      <p className={cn("font-semibold text-sm mt-0.5", valueClass)}>
        {value}{unit && <span className="text-brand-cream/30 text-xs ml-0.5">{unit}</span>}
      </p>
    </div>
  );
}
