"use client";
import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ChevronRight, Loader2, ChevronDown, ChevronUp, Sparkles, Info, Camera, X } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { autoEstimate, runQuickCheck, generateScenarios, DEVELOPMENT_TYPES } from "@/lib/calculations";
import { saveProject } from "@/lib/store";
import { formatCurrency, formatPercent } from "@/lib/utils";
import type { DevelopmentType, QuickCheckInput, Project } from "@/lib/types";
import { cn } from "@/lib/utils";

const DEVELOPMENT_TYPES_UI: Array<{
  value: DevelopmentType;
  label: string;
  labelTh: string;
  description: string;
  ratio: string;
}> = [
  {
    value: "Land Subdivision",
    label: "Land Subdivision",
    labelTh: "ที่ดินแบ่งแปลง",
    description: "Minimal road & utility infrastructure. Suitable for simple land parcelling projects.",
    ratio: "10% of land cost",
  },
  {
    value: "Standard Housing",
    label: "Standard Housing",
    labelTh: "โครงการหมู่บ้าน",
    description: "Concrete roads, drainage, utilities, entrance gate, lighting. Typical residential moo baan.",
    ratio: "25% of land cost",
  },
  {
    value: "Premium Project",
    label: "Premium Project",
    labelTh: "โครงการพรีเมียม",
    description: "Landscape, premium entrance, clubhouse, high-end infrastructure. Luxury estate.",
    ratio: "35% of land cost",
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
  developmentType: DevelopmentType;
  zoning: string;
  roadAccess: string;
}

interface AdvancedOverrides {
  roadDeductionPercent: number | null;
  developmentCostRatioPercent: number | null; // user enters %, stored as whole number e.g. 15
}

const DEFAULT_FORM: SimpleForm = {
  projectName: "",
  location: "",
  landSizeRai: 2,
  landSizeWah: 0,
  acquisitionPricePerWah: 80000,
  estimatedSellingPricePerWah: 250000,
  plotCount: 8,
  developmentType: "Standard Housing",
  zoning: "",
  roadAccess: "",
};

export default function NewProjectPage() {
  const router = useRouter();
  const [form, setForm] = useState<SimpleForm>(DEFAULT_FORM);
  const [advanced, setAdvanced] = useState<AdvancedOverrides>({
    roadDeductionPercent: null,
    developmentCostRatioPercent: null,
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
    () => autoEstimate(form.plotCount, form.developmentType),
    [form.plotCount, form.developmentType]
  );

  const resolvedRoadDed = advanced.roadDeductionPercent ?? estimation.roadDeductionPercent;
  const resolvedRatio = advanced.developmentCostRatioPercent != null
    ? advanced.developmentCostRatioPercent / 100
    : estimation.developmentCostRatio;

  const totalWah = form.landSizeRai * 400 + form.landSizeWah;
  const landCost = totalWah * form.acquisitionPricePerWah;

  // Live preview calculation
  const preview = useMemo(() => {
    if (totalWah <= 0 || form.acquisitionPricePerWah <= 0 || form.estimatedSellingPricePerWah <= 0) return null;
    const sellable = totalWah * (1 - resolvedRoadDed / 100);
    const revenue = sellable * form.estimatedSellingPricePerWah;
    const infraCost = landCost * resolvedRatio;
    const cost = landCost + infraCost;
    const profit = revenue - cost;
    const roi = cost > 0 ? (profit / cost) * 100 : 0;
    const margin = revenue > 0 ? (profit / revenue) * 100 : 0;
    return { revenue, infraCost, cost, profit, roi, margin };
  }, [totalWah, form.acquisitionPricePerWah, form.estimatedSellingPricePerWah, resolvedRoadDed, resolvedRatio, landCost]);

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
      developmentCostRatio: resolvedRatio,
      roadDeductionPercent: resolvedRoadDed,
      zoning: form.zoning || "Residential",
      roadAccess: form.roadAccess || "Public Road",
      advancedOverride: advanced.roadDeductionPercent !== null || advanced.developmentCostRatioPercent !== null,
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

        {/* ── Development Type ── */}
        <FormSection label="Development Type">
          <div className="grid grid-cols-3 gap-3">
            {DEVELOPMENT_TYPES_UI.map(dt => (
              <button
                key={dt.value}
                type="button"
                onClick={() => set("developmentType", dt.value)}
                className={cn(
                  "rounded-lg border p-4 text-left transition-all cursor-pointer",
                  form.developmentType === dt.value
                    ? "border-brand-gold bg-brand-gold/10 shadow-lg shadow-brand-gold/10"
                    : "border-brand-gold/20 bg-brand-navy hover:border-brand-gold/40"
                )}
              >
                <div className={cn(
                  "w-2 h-2 rounded-full mb-3",
                  form.developmentType === dt.value ? "bg-brand-gold" : "bg-brand-navy-mid"
                )} />
                <p className={cn(
                  "font-semibold text-sm mb-0.5",
                  form.developmentType === dt.value ? "text-brand-gold" : "text-brand-cream"
                )}>
                  {dt.label}
                </p>
                <p className="text-brand-cream/40 text-xs">{dt.labelTh}</p>
                <p className="text-brand-gold/60 text-xs mt-1.5 font-medium">{dt.ratio}</p>
              </button>
            ))}
          </div>
          <p className="text-brand-cream/35 text-xs mt-3 leading-relaxed">
            {DEVELOPMENT_TYPES_UI.find(d => d.value === form.developmentType)?.description}
          </p>
        </FormSection>

        {/* ── LANDOS Estimation Preview ── */}
        {totalWah > 0 && form.acquisitionPricePerWah > 0 && (
          <div className="rounded-lg border border-brand-gold/25 bg-gradient-to-r from-brand-navy-mid/60 to-brand-navy p-4 space-y-4">
            <div className="flex items-center gap-2">
              <Sparkles size={13} className="text-brand-gold" />
              <span className="text-brand-gold text-xs uppercase tracking-widest">LANDOS Auto-Estimation</span>
              <span className="ml-auto text-brand-cream/30 text-xs">
                {advanced.roadDeductionPercent !== null || advanced.developmentCostRatioPercent !== null
                  ? "Advanced override active"
                  : "Smart defaults applied"}
              </span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <EstimateCard label="Road Deduction" value={`${resolvedRoadDed}%`} />
              <EstimateCard
                label="Dev. Cost"
                value={`${(resolvedRatio * 100).toFixed(0)}% of land`}
                unit=""
              />
              {preview && (
                <>
                  <EstimateCard
                    label="Est. Dev. Cost"
                    value={formatCurrency(preview.infraCost)}
                    color="gold"
                  />
                  <EstimateCard
                    label="Est. ROI"
                    value={formatPercent(preview.roi)}
                    color={preview.roi >= 25 ? "green" : preview.roi >= 15 ? "gold" : "red"}
                  />
                </>
              )}
            </div>

            {preview && (
              <div className="grid grid-cols-2 gap-2 pt-1 border-t border-brand-gold/10">
                <div className="flex justify-between text-xs">
                  <span className="text-brand-cream/35">Land Cost</span>
                  <span className="text-brand-cream/60">{formatCurrency(landCost)}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-brand-cream/35">Gross Margin</span>
                  <span className={cn(
                    "font-medium",
                    preview.margin >= 20 ? "text-emerald-400" : "text-brand-gold"
                  )}>{formatPercent(preview.margin)}</span>
                </div>
              </div>
            )}

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
              {(advanced.roadDeductionPercent !== null || advanced.developmentCostRatioPercent !== null) && (
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
                  LANDOS has auto-estimated these values from your plot count and development type.
                  Only override if you have detailed site-specific data.
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
                <Field label={`Dev. Cost Ratio % (auto: ${(estimation.developmentCostRatio * 100).toFixed(0)}%)`}>
                  <Input
                    type="number" min={1} max={60} step={1}
                    placeholder={String((estimation.developmentCostRatio * 100).toFixed(0))}
                    value={advanced.developmentCostRatioPercent ?? ""}
                    onChange={e =>
                      setAdvanced(prev => ({
                        ...prev,
                        developmentCostRatioPercent: e.target.value === "" ? null : Number(e.target.value),
                      }))
                    }
                  />
                </Field>
              </div>

              {(advanced.roadDeductionPercent !== null || advanced.developmentCostRatioPercent !== null) && (
                <button
                  type="button"
                  onClick={() => setAdvanced({ roadDeductionPercent: null, developmentCostRatioPercent: null })}
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
