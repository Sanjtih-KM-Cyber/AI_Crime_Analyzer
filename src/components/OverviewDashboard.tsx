import React from "react";
import {
  CrimeNetworkNode,
  CrimeNetworkLink,
  SuspiciousPattern,
  SyndicateCommunity,
  CaseDataset,
} from "../types";
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
  const orgCount = nodes.filter((n) => n.type === "ORGANIZATION").length;

  // Average Network Risk
  const avgRisk = nodes.length > 0 ? Math.round(nodes.reduce((acc, n) => acc + n.riskScore, 0) / nodes.length) : 0;

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
                ACTIVE SURVEILLANCE MATRIX
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
            <button
              onClick={onOpenNewCase}
              className="flex items-center gap-2 px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl bg-amber-500 text-slate-950 hover:bg-amber-400 font-bold text-xs transition-all shadow-lg shadow-amber-500/20 active:scale-95"
            >
              <FolderPlus className="w-4 h-4" />
              <span>+ Register New Case</span>
            </button>
            <button
              onClick={() => onNavigateTab("graph")}
              className="flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-100 font-semibold text-xs transition-all active:scale-95"
            >
              <Network className="w-4 h-4 text-amber-400" />
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
              <span className="text-slate-400">LEGAL JURISDICTION: </span>
              <span className="text-slate-200">NDPS / BNS / PMLA</span>
            </div>
          </div>
          <div className="flex items-center gap-2 text-amber-400">
            <Radio className="w-3.5 h-3.5 animate-pulse text-amber-400" />
            <span>REAL-TIME CENTRALITY ENGINE: BRANDES & LOUVAIN MODULARITY ACTIVE</span>
          </div>
        </div>
      </div>

      {/* 2. Executive KPI Cards Row */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        {/* Metric 1: Total Mapped Nodes */}
        <div className="bg-slate-900/60 border border-slate-800 hover:border-slate-700 rounded-xl p-4 transition-all">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-mono uppercase tracking-wider font-semibold">
              Mapped Entities
            </span>
            <Network className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl font-bold text-slate-100 font-mono tracking-tight">
            {nodes.length}
          </div>
          <div className="text-[10px] text-slate-400 mt-1 flex items-center gap-1 font-mono">
            <span>{personCount} P</span> • <span>{phoneCount} T</span> • <span>{finCount} B</span>
          </div>
        </div>

        {/* Metric 2: Relational Connections */}
        <div className="bg-slate-900/60 border border-slate-800 hover:border-slate-700 rounded-xl p-4 transition-all">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-mono uppercase tracking-wider font-semibold">
              Evidentiary Links
            </span>
            <TrendingUp className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-bold text-cyan-400 font-mono tracking-tight">
            {links.length}
          </div>
          <div className="text-[10px] text-slate-400 mt-1 font-mono">
            Across {communities.length} syndicate cells
          </div>
        </div>

        {/* Metric 3: Kingpins Identified */}
        <div className="bg-amber-950/20 border border-amber-500/30 hover:border-amber-500/50 rounded-xl p-4 transition-all">
          <div className="flex items-center justify-between text-amber-400 mb-2">
            <span className="text-[11px] font-mono uppercase tracking-wider font-bold">
              Kingpin Candidates
            </span>
            <Crown className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold text-amber-400 font-mono tracking-tight">
            {kingpins.length}
          </div>
          <div className="text-[10px] text-amber-400/80 mt-1 font-mono">
            High-Betweenness HVT
          </div>
        </div>

        {/* Metric 4: Critical Cut-Vertices */}
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
            Structural choke points
          </div>
        </div>

        {/* Metric 5: Suspicious Pattern Alerts */}
        <div className="bg-rose-950/20 border border-rose-500/30 hover:border-rose-500/50 rounded-xl p-4 transition-all">
          <div className="flex items-center justify-between text-rose-400 mb-2">
            <span className="text-[11px] font-mono uppercase tracking-wider font-bold">
              Pattern Alerts
            </span>
            <AlertTriangle className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-2xl font-bold text-rose-400 font-mono tracking-tight">
            {patterns.length}
          </div>
          <div className="text-[10px] text-rose-400/80 mt-1 font-mono">
            {patterns.filter((p) => p.severity === "CRITICAL").length} Critical severity
          </div>
        </div>

        {/* Metric 6: Network Threat Index */}
        <div className="bg-slate-900/60 border border-slate-800 hover:border-slate-700 rounded-xl p-4 transition-all">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-mono uppercase tracking-wider font-semibold">
              Threat Risk Index
            </span>
            <Activity className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold text-slate-100 font-mono tracking-tight flex items-center gap-1.5">
            <span>{avgRisk}</span>
            <span className="text-xs text-slate-400 font-normal">/100</span>
          </div>
          <div className="w-full bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
            <div
              className={`h-full rounded-full ${
                avgRisk > 70 ? "bg-rose-500" : avgRisk > 40 ? "bg-amber-500" : "bg-emerald-500"
              }`}
              style={{ width: `${avgRisk}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* 3. Main Operational Intelligence Grid (2x2 Grid) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column 1: High-Value Target Watchlist */}
        <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400">
                <Crown className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-100">
                  Key Syndicate Leaders & Kingpins
                </h3>
                <p className="text-xs text-slate-400">
                  Ranked by Betweenness Centrality & 2-hop topological shielding
                </p>
              </div>
            </div>
            <button
              onClick={() => onNavigateTab("analytics")}
              className="text-xs text-amber-400 hover:text-amber-300 font-medium flex items-center gap-1"
            >
              <span>Full Rankings</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3">
            {kingpins.map((node) => (
              <div
                key={node.id}
                onClick={() => onSelectNode(node)}
                className="group bg-slate-950/70 hover:bg-slate-900 border border-slate-800/90 hover:border-amber-500/40 rounded-xl p-3.5 flex items-center justify-between transition-all cursor-pointer"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0 font-mono font-bold text-sm group-hover:scale-105 transition-transform">
                    {node.label.charAt(0)}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-bold text-slate-100 group-hover:text-amber-300 transition-colors truncate">
                        {node.label}
                      </span>
                      {node.isKingpinCandidate && (
                        <span className="text-[10px] font-mono font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30 px-1.5 py-0.2 rounded">
                          KINGPIN
                        </span>
                      )}
                      {node.isCutVertex && (
                        <span className="text-[10px] font-mono font-bold bg-purple-500/20 text-purple-400 border border-purple-500/30 px-1.5 py-0.2 rounded">
                          CHOKEPOINT
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-slate-400 truncate">
                      {node.role || "Operational Target"}
                      {node.aliases && node.aliases.length > 0 && ` (Alias: ${node.aliases.join(", ")})`}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4 shrink-0 pl-3">
                  <div className="text-right font-mono">
                    <div className="text-xs font-bold text-amber-400">
                      BC: {node.betweenness || "0.000"}
                    </div>
                    <div className="text-[10px] text-slate-400">Risk: {node.riskScore}/100</div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-amber-400 group-hover:translate-x-0.5 transition-all" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column 1: Network Bottlenecks & Cut-Vertices */}
        <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-purple-500/10 text-purple-400">
                <Scissors className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-100">
                  Critical Structural Chokepoints (Cut-Vertices)
                </h3>
                <p className="text-xs text-slate-400">
                  Single points of failure: Arresting these entities severs the syndicate
                </p>
              </div>
            </div>
            <button
              onClick={() => onNavigateTab("analytics")}
              className="text-xs text-purple-400 hover:text-purple-300 font-medium flex items-center gap-1"
            >
              <span>Vulnerability Matrix</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3">
            {cutVertexNodes.length > 0 ? (
              cutVertexNodes.slice(0, 4).map((node) => (
                <div
                  key={node.id}
                  onClick={() => onSelectNode(node)}
                  className="group bg-slate-950/70 hover:bg-slate-900 border border-slate-800/90 hover:border-purple-500/40 rounded-xl p-3.5 flex items-center justify-between transition-all cursor-pointer"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400 shrink-0 font-mono font-bold text-sm">
                      <Scissors className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-slate-100 group-hover:text-purple-300 transition-colors truncate">
                          {node.label}
                        </span>
                        <span className="text-[10px] font-mono font-bold bg-purple-500/20 text-purple-400 border border-purple-500/30 px-1.5 py-0.2 rounded">
                          DISRUPTIVE TARGET
                        </span>
                      </div>
                      <div className="text-xs text-slate-400 truncate">
                        {node.role || "Intermediary Bridge"} • Degree: {node.degree || 0}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0 pl-3">
                    <span className="text-xs font-mono font-semibold text-purple-400 bg-purple-950/40 border border-purple-500/30 px-2 py-1 rounded">
                      High Impact
                    </span>
                    <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-purple-400 transition-colors" />
                  </div>
                </div>
              ))
            ) : (
              <div className="p-6 text-center text-slate-400 text-xs font-mono">
                No single cut-vertices identified in this component topology.
              </div>
            )}
          </div>
        </div>

        {/* Left Column 2: Algorithmic Threat Patterns Radar */}
        <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-rose-500/10 text-rose-400">
                <AlertTriangle className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-100">
                  Active Algorithmic Threat Alerts
                </h3>
                <p className="text-xs text-slate-400">
                  Burner hopping, Hawala layering & Geo-spatial convergence
                </p>
              </div>
            </div>
            <button
              onClick={() => onNavigateTab("patterns")}
              className="text-xs text-rose-400 hover:text-rose-300 font-medium flex items-center gap-1"
            >
              <span>All ({patterns.length}) Alerts</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3">
            {patterns.slice(0, 3).map((pattern) => (
              <div
                key={pattern.id}
                onClick={() => onSelectPattern(pattern)}
                className="group bg-slate-950/70 hover:bg-slate-900 border border-slate-800/90 hover:border-rose-500/40 rounded-xl p-3.5 space-y-2 transition-all cursor-pointer"
              >
                <div className="flex items-start justify-between gap-3">
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
                  <span className="text-[10px] font-mono text-slate-400 shrink-0">
                    Confidence: {Math.round(pattern.confidence * 100)}%
                  </span>
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

        {/* Right Column 2: Functional Syndicate Factions */}
        <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 space-y-4">
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
                  Algorithmic Louvain modularity clusters
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {communities.map((comm) => (
              <div
                key={comm.id}
                className="bg-slate-950/70 border border-slate-800/90 rounded-xl p-3.5 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-3 h-3 rounded-full border border-slate-700 shrink-0"
                      style={{ backgroundColor: comm.color }}
                    ></span>
                    <span className="text-xs font-bold text-slate-200 truncate">
                      {comm.name}
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-slate-400">
                    {comm.nodeIds.length} members
                  </span>
                </div>

                <div className="text-[11px] text-slate-400 font-medium">
                  {comm.role}
                </div>

                <div className="text-[10px] font-mono text-slate-400 pt-1 border-t border-slate-900 truncate">
                  Key Leader:{" "}
                  <span className="text-slate-200 font-semibold">
                    {nodes.find((n) => n.id === comm.keyLeaderId)?.label || "Undisclosed"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
