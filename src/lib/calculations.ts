import type {
  QuickCheckInput,
  QuickCheckResult,
  SubdivisionScenario,
  AutoEstimation,
  DevelopmentType,
} from "./types";

const RAI_TO_WAH = 400;

// ─── Development Type Model ───────────────────────────────────────────────────

export const DEVELOPMENT_TYPES: Record<DevelopmentType, {
  ratio: number;
  labelTh: string;
  includes: string;
}> = {
  "Land Subdivision": {
    ratio: 0.10,
    labelTh: "ที่ดินแบ่งแปลง",
    includes: "Simple road, electric, minimal infrastructure",
  },
  "Standard Housing": {
    ratio: 0.25,
    labelTh: "โครงการหมู่บ้าน",
    includes: "Concrete roads, drainage, utilities, lighting, entrance gate",
  },
  "Premium Project": {
    ratio: 0.35,
    labelTh: "โครงการพรีเมียม",
    includes: "Landscape, premium entrance, clubhouse, high-end infrastructure",
  },
};

// ─── Auto-Estimation Engine ───────────────────────────────────────────────────

const ROAD_DEDUCTION_BY_PLOTS: Array<{ maxPlots: number; base: number }> = [
  { maxPlots: 2,  base: 4  },
  { maxPlots: 5,  base: 6  },
  { maxPlots: 8,  base: 10 },
  { maxPlots: 15, base: 15 },
  { maxPlots: 25, base: 21 },
  { maxPlots: Infinity, base: 28 },
];

const ROAD_MULTIPLIER: Record<DevelopmentType, number> = {
  "Land Subdivision": 0.85,
  "Standard Housing": 1.00,
  "Premium Project":  1.20,
};

export function autoEstimate(
  plotCount: number,
  developmentType: DevelopmentType
): AutoEstimation {
  const baseRoad = ROAD_DEDUCTION_BY_PLOTS.find(r => plotCount <= r.maxPlots)?.base ?? 28;
  const roadDeductionPercent = Math.round(baseRoad * ROAD_MULTIPLIER[developmentType]);
  const { ratio: developmentCostRatio, labelTh } = DEVELOPMENT_TYPES[developmentType];

  const plotLabel =
    plotCount <= 2  ? "1–2 plots" :
    plotCount <= 5  ? "3–5 plots" :
    plotCount <= 8  ? "6–8 plots" :
    plotCount <= 15 ? "9–15 plots" :
    plotCount <= 25 ? "16–25 plots" : "26+ plots";

  const rationale =
    `${plotLabel} ${developmentType} (${labelTh}) → ${roadDeductionPercent}% road deduction, ` +
    `${(developmentCostRatio * 100).toFixed(0)}% of land cost for development`;

  return { roadDeductionPercent, developmentCostRatio, rationale };
}

// ─── Validation / Reality Check ───────────────────────────────────────────────

export function generateValidationWarnings(
  roi: number,
  grossProfitMargin: number,
  acquisitionRatio: number,
  developmentCostRatio: number,
  roadDeductionPercent: number,
): string[] {
  const warnings: string[] = [];
  if (acquisitionRatio > 6)
    warnings.push("Selling price assumption is very high relative to acquisition price. Verify with recent comparable sales.");
  if (roi > 80)
    warnings.push("Projected ROI exceeds 80% — assumptions may be overly optimistic. Review land cost, selling price, and development cost inputs.");
  if (developmentCostRatio < 0.08)
    warnings.push("Development cost ratio is below 8% of land cost. This may underestimate actual infrastructure requirements.");
  if (grossProfitMargin < 15)
    warnings.push("Gross margin below 15% leaves limited buffer for cost overruns or market softening.");
  if (roadDeductionPercent < 5)
    warnings.push("Road deduction below 5% is unusually low for any subdivision. Confirm with surveyor.");
  if (acquisitionRatio < 1.5)
    warnings.push("Selling price is less than 1.5× acquisition price. Acquisition economics appear challenging — re-verify market comparables.");
  return warnings;
}

// ─── Core Calculation ─────────────────────────────────────────────────────────

const ACQUISITION_TRANSFER_FEE_RATE = 0.06; // stamp duty + transfer fee + SBT (simplified)
const OPERATING_COST_RATE           = 0.10; // marketing, management, legal

export function runQuickCheck(input: QuickCheckInput): QuickCheckResult {
  const totalLandSizeWah       = input.landSizeRai * RAI_TO_WAH + input.landSizeWah;
  const sellableAreaWah        = totalLandSizeWah * (1 - input.roadDeductionPercent / 100);
  const acquisitionCostTotal   = totalLandSizeWah * input.acquisitionPricePerWah;
  const acquisitionTransferFee = Math.round(acquisitionCostTotal * ACQUISITION_TRANSFER_FEE_RATE);
  const infrastructureCostTotal = Math.round(acquisitionCostTotal * input.developmentCostRatio);
  const operatingCost          = Math.round(
    (acquisitionCostTotal + acquisitionTransferFee + infrastructureCostTotal) * OPERATING_COST_RATE
  );
  const totalProjectCost       = acquisitionCostTotal + acquisitionTransferFee + infrastructureCostTotal + operatingCost;
  const estimatedRevenue       = sellableAreaWah * input.estimatedSellingPricePerWah;
  const grossProfit            = estimatedRevenue - totalProjectCost;
  const grossProfitMargin      = estimatedRevenue > 0 ? (grossProfit / estimatedRevenue) * 100 : 0;
  const roi                    = totalProjectCost > 0 ? (grossProfit / totalProjectCost) * 100 : 0;

  const acquisitionRatio = input.acquisitionPricePerWah > 0
    ? input.estimatedSellingPricePerWah / input.acquisitionPricePerWah
    : 1;
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

  const validationWarnings = generateValidationWarnings(
    roi, grossProfitMargin, acquisitionRatio, input.developmentCostRatio, input.roadDeductionPercent
  );

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
    validationWarnings,
    aiExecutiveSummary: generateExecutiveSummary(roi, grossProfitMargin, acquisitionRatio, input.roadDeductionPercent, landosScore),
    aiRiskNote: generateRiskNote(grossProfitMargin, input.roadDeductionPercent, roi, input.developmentCostRatio),
  };
}

export function generateScenarios(
  input: QuickCheckInput,
  totalLandSizeWah: number,
  estimatedSellingPricePerWah: number
): SubdivisionScenario[] {
  const basePlots = input.plotCount;
  const est = autoEstimate(basePlots, input.developmentType);
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

  const acquisitionCost = totalLandSizeWah * input.acquisitionPricePerWah;

  return configs.map(cfg => {
    const sellableAreaWah = totalLandSizeWah * (1 - cfg.road / 100);
    const avgPlotSizeWah = sellableAreaWah / cfg.plotCount;
    const revenueEstimate = sellableAreaWah * estimatedSellingPricePerWah;
    const cost = acquisitionCost * (1 + input.developmentCostRatio);
    const profitMargin = revenueEstimate > 0 ? ((revenueEstimate - cost) / revenueEstimate) * 100 : 0;
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
  margin: number, roadDed: number, roi: number, developmentCostRatio: number
): string {
  const risks: string[] = [];

  if (margin < 20) risks.push("thin profit margins leave limited buffer for cost overruns");
  if (roadDed > 25) risks.push("high road deduction significantly reduces sellable land efficiency");
  if (roi < 20)    risks.push("ROI below 20% may not satisfy investor return requirements");
  if (developmentCostRatio > 0.40) risks.push("development cost assumptions are aggressive and may increase under detailed review");

  if (risks.length === 0) {
    return "Project fundamentals appear sound. Monitor development cost execution and market absorption rate during development phase.";
  }

  return `Key risk factors: ${risks.join("; ")}. Recommend sensitivity analysis on these assumptions before final acquisition decision.`;
}
