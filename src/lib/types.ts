export type DevelopmentType = "Land Subdivision" | "Standard Housing" | "Premium Project";

export interface QuickCheckInput {
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
  // Resolved values — auto-estimated unless overridden in Advanced mode
  developmentCostRatio: number;   // fraction of land cost, e.g. 0.10 / 0.25 / 0.35
  roadDeductionPercent: number;
  advancedOverride: boolean;
}

export interface AutoEstimation {
  roadDeductionPercent: number;
  developmentCostRatio: number;
  rationale: string;
}

export interface QuickCheckResult {
  totalLandSizeWah: number;
  acquisitionCostTotal: number;
  acquisitionTransferFee: number;
  infrastructureCostTotal: number;
  operatingCost: number;
  totalProjectCost: number;
  sellableAreaWah: number;
  estimatedRevenue: number;
  grossProfit: number;
  grossProfitMargin: number;
  roi: number;
  acquisitionScore: number;
  landosScore: number;
  recommendation: "STRONG BUY" | "BUY" | "HOLD" | "PASS";
  aiExecutiveSummary: string;
  aiRiskNote: string;
  validationWarnings: string[];
}

export interface SubdivisionScenario {
  label: string;
  plotCount: number;
  avgPlotSizeWah: number;
  roadDeductionPercent: number;
  sellableAreaWah: number;
  revenueEstimate: number;
  profitMargin: number;
  efficiency: number;
}

export interface Project {
  id: string;
  createdAt: string;
  heroImageBase64?: string;
  input: QuickCheckInput;
  result: QuickCheckResult;
  scenarios: SubdivisionScenario[];
}
