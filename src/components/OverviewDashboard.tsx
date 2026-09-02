import React from "react";
import {
  CrimeNetworkNode,
  CrimeNetworkLink,
  SuspiciousPattern,
  SyndicateCommunity,
  CaseDataset,
  EvidenceFileRecord,
  InvestigatorHypothesis,
} from "../types";
import { CaseSearchQA } from "./CaseSearchQA";
import {
  ShieldAlert,
  Crown,
  Scissors,
  AlertTriangle,
  Network,
  Users,
  Phone,
  Landmark,
  MapPin,
  Truck,
  ArrowRight,
  TrendingUp,
  FileText,
  Bot,
  Activity,
  Compass,
  Building,
  CheckCircle2,
  ExternalLink,
  ChevronRight,
  Radio,
  Zap,
  FolderPlus,
  Upload,
  User,
  Quote,
  Layers,
  Sparkles,
} from "lucide-react";

interface OverviewDashboardProps {
  currentCase: CaseDataset;
  nodes: CrimeNetworkNode[];
  links: CrimeNetworkLink[];
  patterns: SuspiciousPattern[];
  communities: SyndicateCommunity[];
  cutVertices: string[];
  onSelectNode: (node: CrimeNetworkNode) => void;
  onSelectPattern: (pattern: SuspiciousPattern) => void;
  onNavigateTab: (tab: "graph" | "analytics" | "patterns" | "geo" | "ingest") => void;
  onOpenCopilot: () => void;
  onOpenDossier: () => void;
  onOpenNewCase: () => void;
  onOpenAddEvidence?: () => void;
  onOpenArchive?: () => void;
}

export const OverviewDashboard: React.FC<OverviewDashboardProps> = ({
  currentCase,
  nodes,
  links,
  patterns,
  communities,
  cutVertices,
  onSelectNode,
  onSelectPattern,
  onNavigateTab,
  onOpenCopilot,
  onOpenDossier,
  onOpenNewCase,
  onOpenAddEvidence,
  onOpenArchive,
}) => {
  // Top Kingpins
  const kingpins = nodes
    .filter((n) => n.isKingpinCandidate || n.riskScore >= 80)
    .sort((a, b) => (b.betweenness || 0) - (a.betweenness || 0))
    .slice(0, 4);

  // Cut-Vertex Nodes
  const cutVertexNodes = nodes.filter((n) => cutVertices.includes(n.id));

  // Entity breakdown counts
  const personCount = nodes.filter((n) => n.type === "PERSON").length;
  const phoneCount = nodes.filter((n) => n.type === "PHONE").length;
  const finCount = nodes.filter((n) => n.type === "FINANCIAL").length;
  const locCount = nodes.filter((n) => n.type === "LOCATION").length;
  const vehCount = nodes.filter((n) => n.type === "VEHICLE").length;

  // SIH Spec Separation Counts
  const evidenceEntitiesCount = nodes.filter((n) => n.category !== "INVESTIGATOR_KNOWLEDGE").length;
  const hypothesisEntitiesCount = nodes.filter((n) => n.category === "INVESTIGATOR_KNOWLEDGE").length;
  const needsReviewCount = nodes.filter((n) => n.reviewState === "NEEDS_REVIEW" || !n.reviewState).length;
  const confirmedCount = nodes.filter((n) => n.reviewState === "CONFIRMED").length;

  const totalEvidenceFiles = currentCase.evidenceFiles?.length || 0;
  const totalEvidenceBytes = (currentCase.evidenceFiles || []).reduce((acc, f) => acc + f.fileSize, 0);

  return (
    <div className="flex-1 bg-slate-950 p-3 sm:p-6 lg:p-8 space-y-4 sm:space-y-6 max-w-7xl mx-auto w-full pb-20 md:pb-8">
      {/* 1. Operation Header & Classification Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900/90 to-slate-950 border border-slate-800 rounded-2xl p-4 sm:p-6 relative overflow-hidden shadow-xl">
        <div className="absolute right-0 top-0 bottom-0 w-96 bg-gradient-to-l from-amber-500/5 to-transparent pointer-events-none"></div>

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 sm:gap-6 relative z-10">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="bg-amber-500/10 border border-amber-500/30 text-amber-400 font-mono text-xs font-bold px-2.5 py-0.5 rounded-md uppercase tracking-wider">
                OPERATION {currentCase.codeName}
              </span>
              <span className="bg-slate-800 border border-slate-700 text-slate-300 font-mono text-xs px-2.5 py-0.5 rounded-md">
                {currentCase.id}
              </span>
              <span className="bg-emerald-950/60 border border-emerald-500/30 text-emerald-400 font-mono text-xs font-semibold px-2.5 py-0.5 rounded-md flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                ACTIVE INVESTIGATION WORKBENCH
              </span>
            </div>

            <h1 className="text-lg sm:text-2xl lg:text-3xl font-extrabold text-slate-100 tracking-tight">
              {currentCase.name}
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 max-w-3xl leading-relaxed">
              {currentCase.description}
            </p>
          </div>

          {/* Quick Action Hub in Banner */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3 shrink-0">
            {onOpenAddEvidence && (
              <button
                onClick={onOpenAddEvidence}
                className="flex items-center gap-2 px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl bg-amber-500 text-slate-950 hover:bg-amber-400 font-bold text-xs transition-all shadow-lg shadow-amber-500/20 active:scale-95"
              >
                <Upload className="w-4 h-4" />
                <span>+ Ingest Evidence (15GB Max)</span>
              </button>
            )}
            <button
              onClick={onOpenNewCase}
              className="flex items-center gap-2 px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-semibold text-xs transition-all active:scale-95"
            >
              <FolderPlus className="w-4 h-4 text-amber-400" />
              <span>New Case</span>
            </button>
            <button
              onClick={() => onNavigateTab("graph")}
              className="flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-100 font-semibold text-xs transition-all active:scale-95"
            >
              <Network className="w-4 h-4 text-cyan-400" />
              <span>Graph Workstation</span>
            </button>
            <button
              onClick={onOpenCopilot}
              className="flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/40 text-indigo-300 font-semibold text-xs transition-all active:scale-95"
            >
              <Bot className="w-4 h-4 text-indigo-400" />
              <span>AI Copilot</span>
            </button>
            <button
              onClick={onOpenDossier}
              className="flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl bg-slate-850 hover:bg-slate-800 border border-slate-700 text-slate-200 font-semibold text-xs transition-all active:scale-95"
            >
              <FileText className="w-4 h-4 text-amber-400" />
              <span>Dossier</span>
            </button>
            {onOpenArchive && (
              <button
                onClick={onOpenArchive}
                className="flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl bg-slate-850 hover:bg-slate-800 border border-slate-700 text-amber-400 font-semibold text-xs transition-all active:scale-95"
              >
                <FolderPlus className="w-4 h-4 text-emerald-400" />
                <span>Archive / Backup</span>
              </button>
            )}
          </div>
        </div>

        {/* Agency Meta Ribbon */}
        <div className="mt-6 pt-4 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-4 text-xs text-slate-400 font-mono">
          <div className="flex items-center gap-6">
            <div>
              <span className="text-slate-400">LEAD AGENCY: </span>
              <span className="text-slate-200 font-semibold">{currentCase.leadAgency}</span>
            </div>
            <div>
              <span className="text-slate-400">INITIATED: </span>
              <span className="text-slate-200">{currentCase.date}</span>
            </div>
            <div>
              <span className="text-slate-400">EVIDENCE FILES: </span>
              <span className="text-amber-400 font-bold">{totalEvidenceFiles} Documents</span>
            </div>
          </div>
          <div className="flex items-center gap-2 text-emerald-400">
            <Radio className="w-3.5 h-3.5 animate-pulse text-emerald-400" />
            <span>REAL-TIME GRAPH SYNCHRONIZATION: ACTIVE</span>
          </div>
        </div>
      </div>

      {/* 2. SIH Blueprint Alignment Metric Cards Row */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        {/* Metric 1: Verified Evidence Entities */}
        <div className="bg-slate-900/60 border border-slate-800 hover:border-slate-700 rounded-xl p-4 transition-all">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-mono uppercase tracking-wider font-semibold">
              Evidence Entities
            </span>
            <Quote className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold text-amber-400 font-mono tracking-tight">
            {evidenceEntitiesCount}
          </div>
          <div className="text-[10px] text-slate-400 mt-1 flex items-center gap-1 font-mono">
            <span>Source-cited facts</span>
          </div>
        </div>

        {/* Metric 2: Investigator Hypotheses */}
        <div className="bg-slate-900/60 border border-slate-800 hover:border-slate-700 rounded-xl p-4 transition-all">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-mono uppercase tracking-wider font-semibold">
              Hypotheses / Leads
            </span>
            <User className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-bold text-cyan-400 font-mono tracking-tight">
            {hypothesisEntitiesCount + (currentCase.hypotheses?.length || 0)}
          </div>
          <div className="text-[10px] text-slate-400 mt-1 font-mono">
            Officer-seeded leads
          </div>
        </div>

        {/* Metric 3: Review Required */}
        <div className="bg-amber-950/20 border border-amber-500/30 hover:border-amber-500/50 rounded-xl p-4 transition-all">
          <div className="flex items-center justify-between text-amber-400 mb-2">
            <span className="text-[11px] font-mono uppercase tracking-wider font-bold">
              Needs Review
            </span>
            <AlertTriangle className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold text-amber-400 font-mono tracking-tight">
            {needsReviewCount}
          </div>
          <div className="text-[10px] text-amber-400/80 mt-1 font-mono">
            Pending IO confirmation
          </div>
        </div>

        {/* Metric 4: Kingpins Identified */}
        <div className="bg-rose-950/20 border border-rose-500/30 hover:border-rose-500/50 rounded-xl p-4 transition-all">
          <div className="flex items-center justify-between text-rose-400 mb-2">
            <span className="text-[11px] font-mono uppercase tracking-wider font-bold">
              Kingpin Candidates
            </span>
            <Crown className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-2xl font-bold text-rose-400 font-mono tracking-tight">
            {kingpins.length}
          </div>
          <div className="text-[10px] text-rose-400/80 mt-1 font-mono">
            High-betweenness HVTs
          </div>
        </div>

        {/* Metric 5: Cut-Vertices / Bottlenecks */}
        <div className="bg-purple-950/20 border border-purple-500/30 hover:border-purple-500/50 rounded-xl p-4 transition-all">
          <div className="flex items-center justify-between text-purple-400 mb-2">
            <span className="text-[11px] font-mono uppercase tracking-wider font-bold">
              Cut-Vertices
            </span>
            <Scissors className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl font-bold text-purple-400 font-mono tracking-tight">
            {cutVertices.length}
          </div>
          <div className="text-[10px] text-purple-400/80 mt-1 font-mono">
            Single points of failure
          </div>
        </div>

        {/* Metric 6: Pattern Alerts */}
        <div className="bg-indigo-950/20 border border-indigo-500/30 hover:border-indigo-500/50 rounded-xl p-4 transition-all">
          <div className="flex items-center justify-between text-indigo-400 mb-2">
            <span className="text-[11px] font-mono uppercase tracking-wider font-bold">
              Suspicious Patterns
            </span>
            <Zap className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-2xl font-bold text-indigo-400 font-mono tracking-tight">
            {patterns.length}
          </div>
          <div className="text-[10px] text-indigo-400/80 mt-1 font-mono">
            Hawala & burner swaps
          </div>
        </div>
      </div>

      {/* 3. Main Operational Panels Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6">
        {/* Left Column (7 cols): Ingested Evidence Files & Traceability */}
        <div className="lg:col-span-7 bg-slate-900/70 border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400">
                <FileText className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-100">
                  Case Evidence Dossiers ({currentCase.evidenceFiles?.length || 0})
                </h3>
                <p className="text-xs text-slate-400">
                  Cryptographically hashed files with Sec 65B traceability
                </p>
              </div>
            </div>

            {onOpenAddEvidence && (
              <button
                onClick={onOpenAddEvidence}
                className="text-xs text-amber-400 hover:text-amber-300 font-semibold flex items-center gap-1 bg-amber-500/10 px-2.5 py-1 rounded-lg border border-amber-500/20"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Bulk Upload (15GB)</span>
              </button>
            )}
          </div>

          <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
            {currentCase.evidenceFiles && currentCase.evidenceFiles.length > 0 ? (
              currentCase.evidenceFiles.map((ef) => (
                <div
                  key={ef.id}
                  className="p-3 bg-slate-950/80 hover:bg-slate-900 border border-slate-800/80 rounded-xl space-y-1.5 transition-all"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 truncate">
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20">
                        {ef.fileType}
                      </span>
                      <span className="font-bold text-slate-200 text-xs truncate">
                        {ef.fileName}
                      </span>
                    </div>
                    <span className="text-[10px] font-mono text-slate-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                      {ef.fileSizeFormatted}
                    </span>
                  </div>

                  {ef.summary && (
                    <p className="text-[11px] text-slate-400 leading-relaxed line-clamp-2">
                      {ef.summary}
                    </p>
                  )}

                  <div className="pt-1 border-t border-slate-900 flex items-center justify-between text-[10px] font-mono text-slate-400">
                    <span className="truncate max-w-[260px]">
                      Hash: {ef.fileHash.slice(0, 24)}...
                    </span>
                    <span className="text-emerald-400">
                      {ef.extractedEntitiesCount} entities extracted
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-6 bg-slate-950/40 border border-dashed border-slate-800 rounded-xl text-center text-slate-400 text-xs">
                No bulk evidence files ingested yet. Click "+ Ingest Evidence" to upload up to 15GB of PDFs, CDRs, and CCTV footage.
              </div>
            )}
          </div>
        </div>

        {/* Right Column (5 cols): High-Priority Kingpins & Cut-Vertices */}
        <div className="lg:col-span-5 bg-slate-900/70 border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-rose-500/10 text-rose-400">
                <Crown className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-100">
                  Priority Suspects & Kingpins
                </h3>
                <p className="text-xs text-slate-400">
                  Ranked by betweenness & risk scores
                </p>
              </div>
            </div>

            <button
              onClick={() => onNavigateTab("graph")}
              className="text-xs text-amber-400 hover:text-amber-300 font-medium flex items-center gap-1"
            >
              <span>Explore Graph</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
            {kingpins.map((node) => (
              <div
                key={node.id}
                onClick={() => onSelectNode(node)}
                className="p-3 bg-slate-950/80 hover:bg-slate-800/80 border border-slate-800 rounded-xl flex items-center justify-between cursor-pointer transition-colors group"
              >
                <div className="space-y-1 truncate">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-100 group-hover:text-amber-400 transition-colors truncate">
                      {node.label}
                    </span>
                    {node.isKingpinCandidate && (
                      <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                        KINGPIN
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-slate-400 truncate">
                    {node.role || "Key Suspect"}
                  </div>
                </div>

                <div className="text-right shrink-0 ml-3">
                  <div className="text-xs font-mono font-bold text-rose-400">
                    Risk {node.riskScore}/100
                  </div>
                  <div className="text-[10px] font-mono text-slate-400">
                    Betweenness: {node.betweenness || "0.00"}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 4. Natural Language Constrained Case Q&A Index */}
      <CaseSearchQA
        currentCase={currentCase}
        nodes={nodes}
        links={links}
        onSelectNode={onSelectNode}
      />

      {/* 5. Bottom Grid: Suspicious Pattern Alerts & Factions */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6">
        {/* Left Column: Suspicious Patterns */}
        <div className="lg:col-span-7 bg-slate-900/70 border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-rose-500/10 text-rose-400">
                <Zap className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-100">
                  Suspicious Forensic Patterns ({patterns.length})
                </h3>
                <p className="text-xs text-slate-400">
                  Hawala layering, burner swaps, and geo convergence
                </p>
              </div>
            </div>

            <button
              onClick={() => onNavigateTab("patterns")}
              className="text-xs text-rose-400 hover:text-rose-300 font-medium flex items-center gap-1"
            >
              <span>View All Alerts</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
            {patterns.map((pattern) => (
              <div
                key={pattern.id}
                onClick={() => onSelectPattern(pattern)}
                className="p-3 bg-slate-950/80 hover:bg-slate-800/80 border border-slate-800/90 rounded-xl space-y-1.5 cursor-pointer transition-all group"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${
                        pattern.severity === "CRITICAL"
                          ? "bg-rose-500/20 text-rose-400 border-rose-500/30"
                          : "bg-amber-500/20 text-amber-400 border-amber-500/30"
                      }`}
                    >
                      {pattern.severity}
                    </span>
                    <span className="text-xs font-bold text-slate-100 group-hover:text-rose-300 transition-colors">
                      {pattern.title}
                    </span>
                  </div>
                </div>

                <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                  {pattern.description}
                </p>

                <div className="pt-1.5 border-t border-slate-900 flex items-center justify-between text-[11px] text-amber-400/90 font-mono">
                  <span className="truncate flex items-center gap-1.5">
                    <Zap className="w-3 h-3 text-amber-400" />
                    {pattern.actionableLead}
                  </span>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-amber-400 shrink-0" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Syndicate Factions */}
        <div className="lg:col-span-5 bg-slate-900/70 border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400">
                <Users className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-100">
                  Syndicate Factions & Cells
                </h3>
                <p className="text-xs text-slate-400">
                  Louvain modularity clusters
                </p>
              </div>
            </div>

            <button
              onClick={() => onNavigateTab("analytics")}
              className="text-xs text-emerald-400 hover:text-emerald-300 font-medium flex items-center gap-1"
            >
              <span>View Structure</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-64 overflow-y-auto pr-1">
            {communities.map((comm) => (
              <div
                key={comm.id}
                className="bg-slate-950/70 border border-slate-800/90 rounded-xl p-3 space-y-1.5"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-2.5 h-2.5 rounded-full border border-slate-700 shrink-0"
                      style={{ backgroundColor: comm.color }}
                    />
                    <span className="text-xs font-bold text-slate-200 truncate">
                      {comm.name}
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-slate-400">
                    {comm.nodeIds.length} nodes
                  </span>
                </div>

                <div className="text-[11px] text-slate-400 truncate">
                  {comm.role}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
