import type { Project, QuickCheckInput, DevelopmentType } from "./types";
import { runQuickCheck, generateScenarios, DEVELOPMENT_TYPES } from "./calculations";

const KEY = "landos_projects";

function migrateProject(p: Project): Project {
  // Cast to access old fields that may exist on pre-migration localStorage data
  const input = p.input as QuickCheckInput & {
    developmentStandard?: string;
    infrastructureCostPerWah?: number;
  };

  const needsMigration =
    p.result.acquisitionTransferFee == null ||
    p.result.operatingCost == null ||
    !input.developmentType;

  if (!needsMigration) return p;

  const stdMap: Record<string, DevelopmentType> = {
    Basic: "Land Subdivision",
    Standard: "Standard Housing",
    Premium: "Premium Project",
  };

  const devType: DevelopmentType =
    stdMap[input.developmentStandard ?? "Standard"] ?? "Standard Housing";

  const migratedInput: QuickCheckInput = {
    projectName:              input.projectName,
    location:                 input.location,
    landSizeRai:              input.landSizeRai,
    landSizeWah:              input.landSizeWah,
    acquisitionPricePerWah:   input.acquisitionPricePerWah,
    estimatedSellingPricePerWah: input.estimatedSellingPricePerWah,
    plotCount:                input.plotCount,
    developmentType:          devType,
    zoning:                   input.zoning,
    roadAccess:               input.roadAccess,
    developmentCostRatio:     DEVELOPMENT_TYPES[devType].ratio,
    roadDeductionPercent:     input.roadDeductionPercent,
    advancedOverride:         false,
  };

  const result = runQuickCheck(migratedInput);
  const scenarios = generateScenarios(migratedInput, result.totalLandSizeWah, migratedInput.estimatedSellingPricePerWah);
  return { ...p, input: migratedInput, result, scenarios };
}

export function getProjects(): Project[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? "[]");
  } catch {
    return [];
  }
}

export function saveProject(project: Project): void {
  const projects = getProjects();
  const idx = projects.findIndex(p => p.id === project.id);
  if (idx >= 0) {
    projects[idx] = project;
  } else {
    projects.unshift(project);
  }
  localStorage.setItem(KEY, JSON.stringify(projects));
}

export function getProject(id: string): Project | null {
  const raw = getProjects().find(p => p.id === id);
  if (!raw) return null;
  const migrated = migrateProject(raw);
  if (migrated !== raw) saveProject(migrated);
  return migrated;
}

export function deleteProject(id: string): void {
  const projects = getProjects().filter(p => p.id !== id);
  localStorage.setItem(KEY, JSON.stringify(projects));
}
