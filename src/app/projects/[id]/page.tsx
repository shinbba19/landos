"use client";
import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getProject } from "@/lib/store";
import type { Project } from "@/lib/types";
import { QuickCheckResult } from "@/components/reports/QuickCheckResult";
import { InvestorSummary } from "@/components/reports/InvestorSummary";
import { ExecutiveFeasibility } from "@/components/reports/ExecutiveFeasibility";
import { SubdivisionAnalysis } from "@/components/reports/SubdivisionAnalysis";
import { DetailSheet } from "@/components/reports/DetailSheet";
import { cn } from "@/lib/utils";

const TABS = [
  { id: "quick-check",      label: "Summary" },
  { id: "investor-summary", label: "Investor Report" },
  { id: "feasibility",      label: "Costs" },
  { id: "subdivision",      label: "Subdivision" },
  { id: "detail-sheet",     label: "Feasibility" },
];

export default function ProjectPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [project, setProject] = useState<Project | null>(null);
  const [activeTab, setActiveTab] = useState("quick-check");
  const reportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const p = getProject(id);
    if (!p) {
      router.push("/");
      return;
    }
    setProject(p);
  }, [id, router]);

  function handleExportPDF() {
    window.print();
  }


  if (!project) return null;

  return (
    <div className="min-h-screen">
      {/* Project Header */}
      <div className="print:hidden border-b border-brand-gold/20 bg-brand-navy-light">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-brand-cream/50 hover:text-brand-cream text-sm mb-3 transition-colors"
          >
            <ArrowLeft size={14} />
            All Projects
          </Link>
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-serif text-brand-cream">{project.input.projectName}</h1>
              <p className="text-brand-cream/50 text-sm mt-0.5">{project.input.location}</p>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportPDF}
                className="text-brand-cream/60 border-brand-gold/30 hover:border-brand-gold hover:text-brand-cream"
              >
                <Download size={14} className="mr-1.5" />Export PDF
              </Button>
              <div className="text-right text-xs text-brand-cream/30">
                <p>Analysis Date</p>
                <p>{new Date(project.createdAt).toLocaleDateString("en-GB", {
                  day: "2-digit", month: "short", year: "numeric"
                })}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tab bar */}
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex gap-0 border-b border-brand-gold/10">
            {TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "px-5 py-3 text-sm font-medium border-b-2 transition-all -mb-px",
                  activeTab === tab.id
                    ? "border-brand-gold text-brand-gold"
                    : "border-transparent text-brand-cream/50 hover:text-brand-cream hover:border-brand-gold/30"
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Tab Content */}
      <div ref={reportRef} className="max-w-7xl mx-auto px-6 py-8 print:px-0 print:py-0" id="report-content">
        {activeTab === "quick-check"      && <QuickCheckResult project={project} />}
        {activeTab === "investor-summary" && <InvestorSummary project={project} />}
        {activeTab === "feasibility"      && <ExecutiveFeasibility project={project} />}
        {activeTab === "subdivision"      && <SubdivisionAnalysis project={project} />}
        {activeTab === "detail-sheet"     && <DetailSheet project={project} />}
      </div>
    </div>
  );
}
