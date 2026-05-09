export type DevelopmentStandard = "Basic" | "Standard" | "Premium";

export interface QuickCheckInput {
  projectName: string;
  location: string;
  landSizeRai: number;
  landSizeWah: number;
  acquisitionPricePerWah: number;
  estimatedSellingPricePerWah: number;
  plotCount: number;
  developmentStandard: DevelopmentStandard;
  // Optional context
  zoning: string;
  roadAccess: string;
  // Resolved values — auto-estimated unless overridden in Advanced mode
  infrastructureCostPerWah: number;
  roadDeductionPercent: number;
  // Track whether advanced overrides were applied
  advancedOverride: boolean;
}

export interface InfraLineItem {
  labelTh: string;
  label: string;
  percent: number;
  costPerWah: number;
  totalCost: number;
}

export interface InfraBreakdown {
  items: InfraLineItem[];
  totalPerWah: number;
  totalProject: number;
}

export interface AutoEstimation {
  roadDeductionPercent: number;
  infrastructureCostPerWah: number;
  rationale: string;
  infraBreakdown: InfraBreakdown;
}

export interface QuickCheckResult {
  totalLandSizeWah: number;
  acquisitionCostTotal: number;
  acquisitionTransferFee: number;
  infrastructureCostTotal: number;
  operatingCost: number;
  totalProjectCost: number;         // land + transfer fee + infra + operating
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
