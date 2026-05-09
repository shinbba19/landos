import type { Project } from "./types";
import { runQuickCheck, generateScenarios } from "./calculations";

const KEY = "landos_projects";

function migrateProject(p: Project): Project {
  // Re-run calculations for projects saved before acquisitionTransferFee/operatingCost were added
  if (p.result.acquisitionTransferFee == null || p.result.operatingCost == null) {
    const result = runQuickCheck(p.input);
    const scenarios = generateScenarios(p.input, result.totalLandSizeWah, p.input.estimatedSellingPricePerWah);
    return { ...p, result, scenarios };
  }
  return p;
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
