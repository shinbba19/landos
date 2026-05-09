"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { MapPin, TrendingUp, Building2, Plus, Trash2 } from "lucide-react";
import { getProjects, deleteProject } from "@/lib/store";
import { formatCurrency, formatPercent } from "@/lib/utils";
import { LandosScore } from "@/components/LandosScore";
import { Button } from "@/components/ui/button";
import type { Project } from "@/lib/types";

export default function DashboardPage() {
  const [projects, setProjects] = useState<Project[]>([]);

  useEffect(() => {
    setProjects(getProjects());
  }, []);

  function handleDelete(id: string, e: React.MouseEvent) {
    e.preventDefault();
    if (confirm("Delete this project?")) {
      deleteProject(id);
      setProjects(getProjects());
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-10">
      {/* Header */}
      <div className="flex items-end justify-between mb-10">
        <div>
          <p className="text-brand-gold text-xs uppercase tracking-widest mb-2">Portfolio Intelligence</p>
          <h1 className="text-3xl font-serif text-brand-cream">Land Acquisition Projects</h1>
          <p className="text-brand-cream/50 text-sm mt-1">
            {projects.length} {projects.length === 1 ? "project" : "projects"} analyzed
          </p>
        </div>
        <Link href="/projects/new">
          <Button variant="gold" size="lg" className="gap-2">
            <Plus size={18} />
            New Analysis
          </Button>
        </Link>
      </div>

      {projects.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {projects.map(project => (
            <ProjectCard
              key={project.id}
              project={project}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function ProjectCard({
  project,
  onDelete,
}: {
  project: Project;
  onDelete: (id: string, e: React.MouseEvent) => void;
}) {
  const { input, result } = project;

  return (
    <Link href={`/projects/${project.id}`} className="group block">
      <div className="rounded-lg border border-brand-gold/20 bg-brand-navy-light hover:border-brand-gold/50 transition-all duration-200 overflow-hidden">
        {/* Top stripe */}
        <div className="h-1 bg-gradient-to-r from-brand-gold-dark via-brand-gold to-brand-gold-light" />

        <div className="p-5">
          {/* Title row */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1 min-w-0">
              <h3 className="font-serif text-brand-cream text-lg leading-tight truncate">
                {input.projectName}
              </h3>
              <div className="flex items-center gap-1.5 mt-1">
                <MapPin size={12} className="text-brand-gold/60 shrink-0" />
                <span className="text-brand-cream/50 text-xs truncate">{input.location}</span>
              </div>
            </div>
            <button
              onClick={(e) => onDelete(project.id, e)}
              className="ml-2 p-1.5 rounded text-brand-cream/20 hover:text-red-400 hover:bg-red-900/20 transition-colors shrink-0"
            >
              <Trash2 size={14} />
            </button>
          </div>

          {/* Key metrics */}
          <div className="grid grid-cols-3 gap-3 mb-4">
            <Metric label="Land Size" value={`${input.landSizeRai}rai ${input.landSizeWah}wah`} />
            <Metric label="ROI" value={formatPercent(result.roi)} highlight />
            <Metric label="Gross Margin" value={formatPercent(result.grossProfitMargin)} />
          </div>

          <div className="grid grid-cols-2 gap-3 mb-4">
            <Metric label="Acq. Cost" value={formatCurrency(result.acquisitionCostTotal)} />
            <Metric label="Revenue Est." value={formatCurrency(result.estimatedRevenue)} />
          </div>

          {/* Divider */}
          <div className="border-t border-brand-gold/10 pt-4">
            <div className="flex items-center justify-between">
              <LandosScore score={result.landosScore} recommendation={result.recommendation} size="sm" />
              <div className="flex items-center gap-1.5 text-brand-cream/40 text-xs">
                <Building2 size={12} />
                <span>{input.zoning}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}

function Metric({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div>
      <p className="text-brand-cream/40 text-xs uppercase tracking-wider mb-0.5">{label}</p>
      <p className={highlight ? "text-brand-gold font-semibold text-sm" : "text-brand-cream text-sm"}>
        {value}
      </p>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="w-20 h-20 rounded-full border-2 border-brand-gold/20 flex items-center justify-center mb-6">
        <TrendingUp size={36} className="text-brand-gold/40" />
      </div>
      <h2 className="text-2xl font-serif text-brand-cream mb-2">No Projects Yet</h2>
      <p className="text-brand-cream/50 text-sm max-w-sm mb-8">
        Start your first land acquisition analysis. Enter land details to generate investor-ready feasibility reports.
      </p>
      <Link href="/projects/new">
        <Button variant="gold" size="lg">
          <Plus size={18} />
          Start First Analysis
        </Button>
      </Link>
    </div>
  );
}
