import type {
  QuickCheckInput,
  QuickCheckResult,
  SubdivisionScenario,
  AutoEstimation,
  InfraBreakdown,
  DevelopmentStandard,
} from "./types";

const RAI_TO_WAH = 400;

// ─── Auto-Estimation Engine ───────────────────────────────────────────────────

const ROAD_DEDUCTION_BY_PLOTS: Array<{ maxPlots: number; base: number }> = [
  { maxPlots: 2,  base: 4  },
  { maxPlots: 5,  base: 6  },
  { maxPlots: 8,  base: 10 },
  { maxPlots: 15, base: 15 },
  { maxPlots: 25, base: 21 },
  { maxPlots: Infinity, base: 28 },
];

const INFRA_COST_BY_STANDARD: Record<DevelopmentStandard, number> = {
  Basic:    300,
  Standard: 800,
  Premium:  1800,
};

const ROAD_MULTIPLIER_BY_STANDARD: Record<DevelopmentStandard, number> = {
  Basic:    0.85,
  Standard: 1.00,
  Premium:  1.20,
};

const INFRA_COMPONENTS: Record<
  DevelopmentStandard,
  Array<{ labelTh: string; label: string; percent: number }>
> = {
  Basic: [
    { labelTh: "ถนน",              label: "Road",                percent: 55 },
    { labelTh: "ประปา",            label: "Water Supply",        percent: 15 },
    { labelTh: "ไฟฟ้า",           label: "Electricity",         percent: 15 },
    { labelTh: "ระบบระบายน้ำ",    label: "Drainage",            percent: 10 },
    { labelTh: "รั้ว / ทางเข้า", label: "Fence / Entrance",    percent: 5  },
  ],
  Standard: [
    { labelTh: "ถนน",              label: "Road",                percent: 50 },
    { labelTh: "ประปา",            label: "Water Supply",        percent: 15 },
    { labelTh: "ไฟฟ้า",           label: "Electricity",         percent: 15 },
    { labelTh: "ระบบระบายน้ำ",    label: "Drainage",            percent: 12 },
    { labelTh: "รั้ว / ภูมิทัศน์", label: "Fence / Landscaping", percent: 8 },
  ],
  Premium: [
    { labelTh: "ถนน",              label: "Road",                percent: 45 },
    { labelTh: "ประปา",            label: "Water Supply",        percent: 15 },
    { labelTh: "ไฟฟ้า",           label: "Electricity",         percent: 15 },
    { labelTh: "ระบบระบายน้ำ",    label: "Drainage",            percent: 10 },
    { labelTh: "รั้ว / ภูมิทัศน์ / สระ", label: "Fence / Landscape / Pool", percent: 15 },
  ],
};

export function computeInfraBreakdown(
  standard: DevelopmentStandard,
  infraCostPerWah: number,
  totalLandSizeWah: number
): InfraBreakdown {
  const components = INFRA_COMPONENTS[standard];
  const totalProject = totalLandSizeWah * infraCostPerWah;

  const items = components.map(c => ({
    labelTh: c.labelTh,
    label: c.label,
    percent: c.percent,
    costPerWah: Math.round(infraCostPerWah * c.percent / 100),
    totalCost: Math.round(totalProject * c.percent / 100),
  }));

  return { items, totalPerWah: infraCostPerWah, totalProject };
}

export function autoEstimate(
  plotCount: number,
  standard: DevelopmentStandard
): AutoEstimation {
  const baseRoad = ROAD_DEDUCTION_BY_PLOTS.find(r => plotCount <= r.maxPlots)?.base ?? 28;
  const roadDeductionPercent = Math.round(baseRoad * ROAD_MULTIPLIER_BY_STANDARD[standard]);
  const infrastructureCostPerWah = INFRA_COST_BY_STANDARD[standard];

  const plotLabel =
    plotCount <= 2  ? "1–2 plots" :
    plotCount <= 5  ? "3–5 plots" :
    plotCount <= 8  ? "6–8 plots" :
    plotCount <= 15 ? "9–15 plots" :
    plotCount <= 25 ? "16–25 plots" : "26+ plots";

  const standardDesc =
    standard === "Basic"    ? "minimal infrastructure" :
    standard === "Standard" ? "standard subdivision development" :
                              "premium gated development";

  const rationale =
    `${plotLabel} ${standard} standard → ${roadDeductionPercent}% road deduction, ` +
    `${infrastructureCostPerWah.toLocaleString()} THB/wah² infrastructure (${standardDesc})`;

  // Breakdown uses 0 total wah at estimation time — totalCost filled in when land size is known
  const infraBreakdown = computeInfraBreakdown(standard, infrastructureCostPerWah, 0);

  return { roadDeductionPercent, infrastructureCostPerWah, rationale, infraBreakdown };
}

// ─── Core Calculation ─────────────────────────────────────────────────────────

const ACQUISITION_TRANSFER_FEE_RATE = 0.06; // 6% — stamp duty + transfer fee + SBT (simplified)
const OPERATING_COST_RATE           = 0.10; // 10% — marketing, management, legal

export function runQuickCheck(input: QuickCheckInput): QuickCheckResult {
  const totalLandSizeWah       = input.landSizeRai * RAI_TO_WAH + input.landSizeWah;
  const sellableAreaWah        = totalLandSizeWah * (1 - input.roadDeductionPercent / 100);
  const acquisitionCostTotal   = totalLandSizeWah * input.acquisitionPricePerWah;
  const acquisitionTransferFee = Math.round(acquisitionCostTotal * ACQUISITION_TRANSFER_FEE_RATE);
  const infrastructureCostTotal = totalLandSizeWah * input.infrastructureCostPerWah;
  const operatingCost          = Math.round(
    (acquisitionCostTotal + acquisitionTransferFee + infrastructureCostTotal) * OPERATING_COST_RATE
  );
  const totalProjectCost       = acquisitionCostTotal + acquisitionTransferFee + infrastructureCostTotal + operatingCost;
  const estimatedRevenue       = sellableAreaWah * input.estimatedSellingPricePerWah;
  const grossProfit            = estimatedRevenue - totalProjectCost;
  const grossProfitMargin      = (grossProfit / estimatedRevenue) * 100;
  const roi                    = (grossProfit / totalProjectCost) * 100;

  const acquisitionRatio = input.estimatedSellingPricePerWah / input.acquisitionPricePerWah;
  const acquisitionScore = Math.min(10, Math.max(0, (acquisitionRatio - 1) * 3.5));

  const roadEfficiencyScore = Math.min(10, Math.max(0, (1 - input.roadDeductionPercent / 100) * 12));
  const roiScore = Math.min(10, Math.max(0, roi / 5));

  const zoningScores: Record<string, number> = {
    "ย.1": 9, "ย.2": 8, "ย.3": 7, "ย.4": 6,
    "พ.1": 5, "พ.2": 6, "พ.3": 5,
    "ก.1": 3, "ก.2": 4,
    "Residential": 8, "Mixed-Use": 7, "Commercial": 6, "Agricultural": 3,
  };
  const zoningScore = zoningScores[input.zoning] ?? 6;

  const roadScores: Record<string, number> = {
    "Public Road": 9, "Paved Road": 8, "Concrete Road": 8,
    "Asphalt Road": 8, "Dirt Road": 4, "No Access": 1,
  };
  const roadScore = roadScores[input.roadAccess] ?? 6;

  const marketLiquidityScore =
    input.estimatedSellingPricePerWah > 300000 ? 8 :
    input.estimatedSellingPricePerWah > 150000 ? 7 :
    input.estimatedSellingPricePerWah > 80000  ? 6 : 5;

  const landosScore =
    roiScore * 0.30 +
    acquisitionScore * 0.20 +
    roadEfficiencyScore * 0.15 +
    zoningScore * 0.15 +
    marketLiquidityScore * 0.10 +
    roadScore * 0.10;

  const recommendation =
    landosScore >= 7.5 ? "STRONG BUY" :
    landosScore >= 6.0 ? "BUY" :
    landosScore >= 4.5 ? "HOLD" : "PASS";

  return {
    totalLandSizeWah,
    acquisitionCostTotal,
    acquisitionTransferFee,
    infrastructureCostTotal,
    operatingCost,
    totalProjectCost,
    sellableAreaWah,
    estimatedRevenue,
    grossProfit,
    grossProfitMargin,
    roi,
    acquisitionScore,
    landosScore,
    recommendation,
    aiExecutiveSummary: generateExecutiveSummary(roi, grossProfitMargin, acquisitionRatio, input.roadDeductionPercent, landosScore),
    aiRiskNote: generateRiskNote(grossProfitMargin, input.roadDeductionPercent, roi, input.infrastructureCostPerWah),
  };
}

export function generateScenarios(
  input: QuickCheckInput,
  totalLandSizeWah: number,
  estimatedSellingPricePerWah: number
): SubdivisionScenario[] {
  const basePlots = input.plotCount;
  const est = autoEstimate(basePlots, input.developmentStandard);
  const baseRoad = est.roadDeductionPercent;

  const configs = [
    {
      label: `${Math.max(2, basePlots - 2)}-Plot Conservative`,
      plotCount: Math.max(2, basePlots - 2),
      road: Math.max(4, baseRoad - 4),
    },
    {
      label: `${basePlots}-Plot Balanced`,
      plotCount: basePlots,
      road: baseRoad,
    },
    {
      label: `${basePlots + 3}-Plot Aggressive`,
      plotCount: basePlots + 3,
      road: Math.min(40, baseRoad + 5),
    },
  ];

  return configs.map(cfg => {
    const sellableAreaWah = totalLandSizeWah * (1 - cfg.road / 100);
    const avgPlotSizeWah = sellableAreaWah / cfg.plotCount;
    const revenueEstimate = sellableAreaWah * estimatedSellingPricePerWah;
    const cost = totalLandSizeWah * (input.acquisitionPricePerWah + input.infrastructureCostPerWah);
    const profitMargin = ((revenueEstimate - cost) / revenueEstimate) * 100;
    const efficiency = (sellableAreaWah / totalLandSizeWah) * 100;

    return {
      label: cfg.label,
      plotCount: cfg.plotCount,
      avgPlotSizeWah: Math.round(avgPlotSizeWah * 10) / 10,
      roadDeductionPercent: cfg.road,
      sellableAreaWah: Math.round(sellableAreaWah),
      revenueEstimate: Math.round(revenueEstimate),
      profitMargin: Math.round(profitMargin * 10) / 10,
      efficiency: Math.round(efficiency * 10) / 10,
    };
  });
}

export function generateExecutiveSummary(
  roi: number, margin: number, acqRatio: number, roadDed: number, score: number
): string {
  const strength = score >= 7.5 ? "strong" : score >= 6 ? "solid" : "moderate";
  const roiText = roi >= 40 ? "exceptional" : roi >= 25 ? "attractive" : "acceptable";
  const roadText = roadDed <= 12 ? "efficient road allocation" : roadDed <= 20 ? "standard road deduction" : "high road burden";

  return (
    `This project demonstrates ${strength} acquisition economics with ${roiText} projected ROI of ${roi.toFixed(1)}%. ` +
    `The ${roadText} at ${roadDed}% supports ${margin.toFixed(1)}% gross profit margin. ` +
    `At ${acqRatio.toFixed(1)}x the acquisition-to-market price ratio, the deal presents ` +
    `${score >= 7 ? "favorable" : "moderate"} subdivision potential with LANDOS Score of ${score.toFixed(1)}/10.`
  );
}

export function generateRiskNote(
  margin: number, roadDed: number, roi: number, infraPerWah: number
): string {
  const risks: string[] = [];

  if (margin < 20) risks.push("thin profit margins leave limited buffer for cost overruns");
  if (roadDed > 25) risks.push("high road deduction significantly reduces sellable land efficiency");
  if (roi < 20)    risks.push("ROI below 20% may not satisfy investor return requirements");
  if (infraPerWah > 2500) risks.push("infrastructure cost assumptions are aggressive and may increase under detailed engineering review");

  if (risks.length === 0) {
    return "Project fundamentals appear sound. Monitor infrastructure cost execution and market absorption rate during development phase.";
  }

  return `Key risk factors: ${risks.join("; ")}. Recommend sensitivity analysis on these assumptions before final acquisition decision.`;
}
