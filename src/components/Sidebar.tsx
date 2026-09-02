import React from "react";
import {
  ShieldAlert,
  LayoutDashboard,
  Network,
  Layers,
  AlertTriangle,
  MapPin,
  Database,
  Bot,
  FileText,
  ChevronRight,
  Radio,
  Lock,
  Compass,
  FolderGit2,
  Plus,
  X,
  PlusCircle,
  ShieldCheck,
  UserCheck,
} from "lucide-react";
import { CaseDataset } from "../types";

interface SidebarProps {
  currentCase: CaseDataset;
  allCases: CaseDataset[];
  onSelectCase: (c: CaseDataset) => void;
  activeTab: "overview" | "graph" | "analytics" | "patterns" | "geo" | "ingest" | "rbac";
  onTabChange: (tab: "overview" | "graph" | "analytics" | "patterns" | "geo" | "ingest" | "rbac") => void;
  onOpenCopilot: () => void;
  onOpenDossier: () => void;
  onOpenNewCase: () => void;
  onOpenMyCases?: () => void;
  nodeCount: number;
  kingpinCount: number;
  cutVertexCount: number;
  patternCount: number;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentCase,
  allCases,
  onSelectCase,
  activeTab,
  onTabChange,
  onOpenCopilot,
  onOpenDossier,
  onOpenNewCase,
  onOpenMyCases,
  nodeCount,
  kingpinCount,
  cutVertexCount,
  patternCount,
  isCollapsed,
  onToggleCollapse,
  isMobileOpen = false,
  onCloseMobile,
}) => {
  const navItems = [
    {
      id: "overview" as const,
      label: "Command Overview",
      subtitle: "Executive Intel & Threat Radar",
      icon: LayoutDashboard,
      badge: null,
    },
    {
      id: "graph" as const,
      label: "Graph Workstation",
      subtitle: "Force-Directed Analyst Canvas",
      icon: Network,
      badge: `${nodeCount} nodes`,
      badgeColor: "bg-slate-800 text-slate-300 border-slate-700",
    },
    {
      id: "analytics" as const,
      label: "Centrality & Bottlenecks",
      subtitle: "Betweenness & Cut-Vertices",
      icon: Layers,
      badge: `${kingpinCount} HVTs`,
      badgeColor: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    },
    {
      id: "patterns" as const,
      label: "Threat Patterns & Leads",
      subtitle: "Burner, Hawala & Convergence",
      icon: AlertTriangle,
      badge: `${patternCount} alerts`,
      badgeColor: "bg-rose-500/10 text-rose-400 border-rose-500/20",
    },
    {
      id: "geo" as const,
      label: "Geospatial & Timeline",
      subtitle: "GIS Triangulation & Chronology",
      icon: MapPin,
      badge: null,
    },
    {
      id: "ingest" as const,
      label: "Evidence Ingestion",
      subtitle: "FIR, Diary NLP & CDR Parser",
      icon: Database,
      badge: "NLP AI",
      badgeColor: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    },
    {
      id: "rbac" as const,
      label: "RBAC & Concurrency",
      subtitle: "Multi-Officer & Chain-of-Custody",
      icon: ShieldCheck,
      badge: "4 Active",
      badgeColor: "bg-purple-500/10 text-purple-400 border-purple-500/20",
    },
  ];

  const handleNavClick = (tabId: "overview" | "graph" | "analytics" | "patterns" | "geo" | "ingest" | "rbac") => {
    onTabChange(tabId);
    if (onCloseMobile) {
      onCloseMobile();
    }
  };

  const handleCopilotClick = () => {
    onOpenCopilot();
    if (onCloseMobile) onCloseMobile();
  };

  const handleDossierClick = () => {
    onOpenDossier();
    if (onCloseMobile) onCloseMobile();
  };

  const handleNewCaseClick = () => {
    onOpenNewCase();
    if (onCloseMobile) onCloseMobile();
  };

  return (
    <>
      {/* Mobile Drawer Backdrop */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 md:hidden transition-opacity"
          onClick={onCloseMobile}
        />
      )}

      {/* Main Sidebar (Desktop fixed + Mobile slide-out drawer) */}
      <aside
        className={`h-screen bg-slate-950/98 border-r border-slate-800/80 flex flex-col justify-between transition-all duration-300 select-none z-50 shrink-0 ${
          /* Desktop behavior */
          isCollapsed ? "md:w-18" : "md:w-72"
        } ${
          /* Mobile Drawer behavior */
          isMobileOpen
            ? "fixed inset-y-0 left-0 w-72 shadow-2xl flex translate-x-0"
            : "hidden md:flex"
        }`}
      >
        {/* Top Section: Agency Branding */}
        <div className="p-4 border-b border-slate-800/80 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="h-10 w-10 shrink-0 rounded-xl bg-gradient-to-br from-amber-500/20 to-amber-600/5 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-lg shadow-amber-500/5">
                <ShieldAlert className="w-5 h-5" />
              </div>
              {(!isCollapsed || isMobileOpen) && (
                <div className="truncate">
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono text-[10px] font-bold text-amber-400 tracking-wider uppercase">
                      CRIM-INTEL OS
                    </span>
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  </div>
                  <h2 className="text-sm font-bold text-slate-100 truncate tracking-tight">
                    National Security AI
                  </h2>
                </div>
              )}
            </div>

            {/* Desktop Collapse Toggle / Mobile Close Button */}
            <div className="flex items-center gap-1">
              {isMobileOpen ? (
                <button
                  onClick={onCloseMobile}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 md:hidden"
                >
                  <X className="w-5 h-5" />
                </button>
              ) : (
                <button
                  onClick={onToggleCollapse}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-850 transition-colors hidden md:block"
                  title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
                >
                  <ChevronRight
                    className={`w-4 h-4 transition-transform duration-200 ${
                      isCollapsed ? "" : "rotate-180"
                    }`}
                  />
                </button>
              )}
            </div>
          </div>

          {(!isCollapsed || isMobileOpen) && (
            <div className="bg-slate-900/60 border border-slate-800 rounded-lg p-2.5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Lock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <div className="text-[11px] font-mono text-slate-300 font-medium truncate">
                  CONFIDENTIAL // LEA
                </div>
              </div>
              <span className="text-[10px] font-mono font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-500/30 px-1.5 py-0.5 rounded">
                AIR-GAPPED
              </span>
            </div>
          )}
        </div>

        {/* Middle Section: Navigation Modules */}
        <div className="flex-1 overflow-y-auto px-3 py-3 space-y-1.5 no-scrollbar">
          {(!isCollapsed || isMobileOpen) && (
            <div className="px-3 pb-1.5 text-[10px] font-mono font-semibold tracking-wider text-slate-400 uppercase flex items-center justify-between">
              <span>Intelligence Modules</span>
            </div>
          )}

          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all relative group ${
                  isActive
                    ? "bg-amber-500/10 text-amber-400 border border-amber-500/30 shadow-sm font-semibold"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/70 border border-transparent"
                }`}
                title={isCollapsed && !isMobileOpen ? item.label : undefined}
              >
                <div
                  className={`p-1.5 rounded-lg shrink-0 transition-colors ${
                    isActive
                      ? "bg-amber-500/20 text-amber-300"
                      : "bg-slate-900 text-slate-400 group-hover:text-slate-200 group-hover:bg-slate-800"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                </div>

                {(!isCollapsed || isMobileOpen) && (
                  <div className="flex-1 truncate">
                    <div className="flex items-center justify-between">
                      <span className="text-xs tracking-tight truncate">
                        {item.label}
                      </span>
                      {item.badge && (
                        <span
                          className={`text-[10px] font-mono px-1.5 py-0.2 rounded border font-medium ${
                            item.badgeColor || "bg-slate-800 text-slate-400 border-slate-700"
                          }`}
                        >
                          {item.badge}
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-slate-400 block truncate font-normal">
                      {item.subtitle}
                    </span>
                  </div>
                )}

                {isActive && (
                  <span className="absolute left-0 top-2 bottom-2 w-1 bg-amber-400 rounded-r"></span>
                )}
              </button>
            );
          })}

          {/* Tactical Operations Section */}
          {(!isCollapsed || isMobileOpen) && (
            <div className="pt-3 pb-1.5 px-3 text-[10px] font-mono font-semibold tracking-wider text-slate-400 uppercase">
              Tactical Operations
            </div>
          )}

          <button
            onClick={handleCopilotClick}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-left transition-all border border-indigo-500/30 bg-gradient-to-r from-indigo-950/40 to-slate-900 text-indigo-300 hover:text-indigo-200 hover:border-indigo-500/50 shadow-sm`}
            title="AI Criminal Graph Copilot"
          >
            <div className="p-1.5 rounded-lg bg-indigo-500/20 text-indigo-400 shrink-0">
              <Bot className="w-4 h-4" />
            </div>
            {(!isCollapsed || isMobileOpen) && (
              <div className="flex-1 truncate">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold tracking-tight">AI Graph Copilot</span>
                  <span className="text-[9px] font-mono bg-indigo-500/20 text-indigo-300 px-1.5 py-0.5 rounded border border-indigo-500/40">
                    GEMINI
                  </span>
                </div>
                <span className="text-[10px] text-slate-400 block truncate font-normal">
                  Multi-hop hypothesis reasoning
                </span>
              </div>
            )}
          </button>

          <button
            onClick={handleDossierClick}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-left transition-all border border-amber-500/30 bg-gradient-to-r from-amber-950/40 to-slate-900 text-amber-300 hover:text-amber-200 hover:border-amber-500/50 shadow-sm`}
            title="Court-Ready Case Dossier"
          >
            <div className="p-1.5 rounded-lg bg-amber-500/20 text-amber-400 shrink-0">
              <FileText className="w-4 h-4" />
            </div>
            {(!isCollapsed || isMobileOpen) && (
              <div className="flex-1 truncate">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold tracking-tight">Judicial Dossier</span>
                  <span className="text-[9px] font-mono bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded border border-amber-500/40">
                    CRPC
                  </span>
                </div>
                <span className="text-[10px] text-slate-400 block truncate font-normal">
                  Generate court chargesheet
                </span>
              </div>
            )}
          </button>
        </div>

        {/* Bottom Section: Active Target Case Card & Add New Case Button */}
        <div className="p-3 border-t border-slate-800/80 bg-slate-900/50">
          {!isCollapsed || isMobileOpen ? (
            <div className="space-y-2.5">
              <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
                <span className="flex items-center gap-1.5">
                  <FolderGit2 className="w-3.5 h-3.5 text-amber-400" />
                  ACTIVE OPERATION
                </span>
                <span className="text-[10px] text-slate-300 font-bold bg-slate-800 px-1.5 py-0.5 rounded">
                  {currentCase.codeName}
                </span>
              </div>

              {/* Case Dropdown */}
              <select
                value={currentCase.id}
                onChange={(e) => {
                  const target = allCases.find((c) => c.id === e.target.value);
                  if (target) onSelectCase(target);
                }}
                className="w-full bg-slate-950 border border-slate-700/80 text-slate-200 text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-amber-500 font-medium cursor-pointer"
              >
                {allCases.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.codeName} — {c.name}
                  </option>
                ))}
              </select>

              {/* Add New Case Action Button */}
              <div className="flex gap-1.5">
                <button
                  onClick={handleNewCaseClick}
                  className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2.5 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 text-amber-300 text-xs font-bold transition-all shadow-sm active:scale-95 group"
                >
                  <Plus className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
                  <span>+ New Case</span>
                </button>
                {onOpenMyCases && (
                  <button
                    onClick={() => {
                      onOpenMyCases();
                      if (onCloseMobile) onCloseMobile();
                    }}
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-amber-400 transition-colors"
                    title="View All Case Workspaces & Access Requests"
                  >
                    <FolderGit2 className="w-4 h-4" />
                  </button>
                )}
              </div>

              <div className="flex items-center justify-between text-[10px] text-slate-400 px-1">
                <span className="truncate max-w-[140px]">{currentCase.leadAgency}</span>
                <span className="font-mono">{currentCase.date}</span>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <button
                onClick={handleNewCaseClick}
                className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 hover:bg-amber-500/30 transition-colors"
                title="Register New Case"
              >
                <Plus className="w-4 h-4" />
              </button>
              <div
                className="w-8 h-8 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 text-xs font-mono font-bold"
                title={`${currentCase.codeName} - ${currentCase.name}`}
              >
                {currentCase.codeName.slice(0, 2)}
              </div>
            </div>
          )}
        </div>
      </aside>
    </>
  );
};
