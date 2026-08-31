import React, { useState, useEffect, useMemo } from "react";
import {
  CaseDataset,
  CrimeNetworkNode,
  CrimeNetworkLink,
  SuspiciousPattern,
  SyndicateCommunity,
  ShortestPathResult,
  CDRRecord,
  FinancialRecord,
  FIRRecord,
  IntelRecord,
} from "./types";
import {
  SAMPLE_CASES,
  GARUDA_SYNDICATE_NODES,
  GARUDA_SYNDICATE_LINKS,
  GARUDA_FIRS,
  GARUDA_CDRS,
  GARUDA_FINANCIALS,
  GARUDA_INTEL,
  SHADOWVAULT_NODES,
  SHADOWVAULT_LINKS,
} from "./data/mockDatasets";
import { computeGraphAnalytics, detectSuspiciousPatterns } from "./services/graphEngine";
import { Sidebar } from "./components/Sidebar";
import { Header } from "./components/Header";
import { OverviewDashboard } from "./components/OverviewDashboard";
import { GraphCanvas } from "./components/GraphCanvas";
import { AnalyticsDashboard } from "./components/AnalyticsDashboard";
import { PatternAlerts } from "./components/PatternAlerts";
import { GeoTimelineView } from "./components/GeoTimelineView";
import { DataIngestionHub } from "./components/DataIngestionHub";
import { EntityDetailDrawer } from "./components/EntityDetailDrawer";
import { AiCopilotDrawer } from "./components/AiCopilotDrawer";
import { DossierModal } from "./components/DossierModal";
import { CreateCaseModal } from "./components/CreateCaseModal";
import { MobileBottomNav } from "./components/MobileBottomNav";

export default function App() {
  // Case Datasets
  const [allCases, setAllCases] = useState<CaseDataset[]>(SAMPLE_CASES);
  const [currentCase, setCurrentCase] = useState<CaseDataset>(SAMPLE_CASES[0]);

  // Case-specific data cache to preserve newly added records across case switching
  const [caseDataMap, setCaseDataMap] = useState<
    Record<
      string,
      {
        nodes: CrimeNetworkNode[];
        links: CrimeNetworkLink[];
        firs: FIRRecord[];
        cdrs: CDRRecord[];
        financials: FinancialRecord[];
        intels: IntelRecord[];
      }
    >
  >({
    "CASE-GARUDA-2026": {
      nodes: GARUDA_SYNDICATE_NODES,
      links: GARUDA_SYNDICATE_LINKS,
      firs: GARUDA_FIRS,
      cdrs: GARUDA_CDRS,
      financials: GARUDA_FINANCIALS,
      intels: GARUDA_INTEL,
    },
    "CASE-SHADOWVAULT-2026": {
      nodes: SHADOWVAULT_NODES,
      links: SHADOWVAULT_LINKS,
      firs: [],
      cdrs: [],
      financials: [],
      intels: [],
    },
  });

  // Raw Graph Elements for current active case
  const [nodes, setNodes] = useState<CrimeNetworkNode[]>(GARUDA_SYNDICATE_NODES);
  const [links, setLinks] = useState<CrimeNetworkLink[]>(GARUDA_SYNDICATE_LINKS);
  const [firs, setFirs] = useState<FIRRecord[]>(GARUDA_FIRS);
  const [cdrs, setCdrs] = useState<CDRRecord[]>(GARUDA_CDRS);
  const [financials, setFinancials] = useState<FinancialRecord[]>(GARUDA_FINANCIALS);
  const [intels, setIntels] = useState<IntelRecord[]>(GARUDA_INTEL);

  // Active View Tab: Defaults to 'overview' for the command dashboard experience
  const [activeTab, setActiveTab] = useState<
    "overview" | "graph" | "analytics" | "patterns" | "geo" | "ingest"
  >("overview");

  // Sidebar collapse toggle & Mobile drawer toggle
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Selection & Highlight State
  const [selectedNode, setSelectedNode] = useState<CrimeNetworkNode | null>(null);
  const [shortestPath, setShortestPath] = useState<ShortestPathResult | null>(null);
  const [selectedPattern, setSelectedPattern] = useState<SuspiciousPattern | null>(null);

  // Drawers & Modals
  const [isCopilotOpen, setIsCopilotOpen] = useState(false);
  const [isDossierOpen, setIsDossierOpen] = useState(false);
  const [isCreateCaseOpen, setIsCreateCaseOpen] = useState(false);

  // Save current case state to caseDataMap whenever nodes/links change
  useEffect(() => {
    setCaseDataMap((prev) => ({
      ...prev,
      [currentCase.id]: {
        nodes,
        links,
        firs,
        cdrs,
        financials,
        intels,
      },
    }));
  }, [nodes, links, firs, cdrs, financials, intels, currentCase.id]);

  // Switch Active Case dataset
  const handleSelectCase = (targetCase: CaseDataset) => {
    setCurrentCase(targetCase);
    setSelectedNode(null);
    setShortestPath(null);
    setSelectedPattern(null);

    const cached = caseDataMap[targetCase.id];
    if (cached) {
      setNodes(cached.nodes);
      setLinks(cached.links);
      setFirs(cached.firs);
      setCdrs(cached.cdrs);
      setFinancials(cached.financials);
      setIntels(cached.intels);
    } else if (targetCase.id === "CASE-GARUDA-2026") {
      setNodes(GARUDA_SYNDICATE_NODES);
      setLinks(GARUDA_SYNDICATE_LINKS);
      setFirs(GARUDA_FIRS);
      setCdrs(GARUDA_CDRS);
      setFinancials(GARUDA_FINANCIALS);
      setIntels(GARUDA_INTEL);
    } else if (targetCase.id === "CASE-SHADOWVAULT-2026") {
      setNodes(SHADOWVAULT_NODES);
      setLinks(SHADOWVAULT_LINKS);
      setFirs([]);
      setCdrs([]);
      setFinancials([]);
      setIntels([]);
    } else {
      // Blank or newly initialized case
      setNodes([]);
      setLinks([]);
      setFirs([]);
      setCdrs([]);
      setFinancials([]);
      setIntels([]);
    }
  };

  // Handle registering and populating a brand-new case
  const handleCreateCase = (
    newCase: CaseDataset,
    initialNodes: CrimeNetworkNode[],
    initialLinks: CrimeNetworkLink[]
  ) => {
    // 1. Update Cases List
    setAllCases((prev) => [newCase, ...prev]);

    // 2. Cache new case data
    setCaseDataMap((prev) => ({
      ...prev,
      [newCase.id]: {
        nodes: initialNodes,
        links: initialLinks,
        firs: [],
        cdrs: [],
        financials: [],
        intels: [],
      },
    }));

    // 3. Switch current active case and data
    setCurrentCase(newCase);
    setNodes(initialNodes);
    setLinks(initialLinks);
    setFirs([]);
    setCdrs([]);
    setFinancials([]);
    setIntels([]);
    setSelectedNode(null);
    setShortestPath(null);
    setSelectedPattern(null);

    // 4. If initial nodes exist, switch to graph or overview
    if (initialNodes.length > 0) {
      setActiveTab("graph");
    } else {
      setActiveTab("ingest");
    }
  };

  // Run Graph Analytics Engine (Centrality, Communities, Cut-Vertices, Patterns)
  const { analyzedNodes, communities, cutVertices } = useMemo(() => {
    return computeGraphAnalytics(nodes, links);
  }, [nodes, links]);

  const detectedPatterns = useMemo(() => {
    return detectSuspiciousPatterns(analyzedNodes, links, firs, cdrs, financials, intels);
  }, [analyzedNodes, links, firs, cdrs, financials, intels]);

  // Highlighted IDs from selected pattern
  const highlightedPatternNodeIds = useMemo(() => {
    return selectedPattern ? selectedPattern.involvedNodeIds : [];
  }, [selectedPattern]);

  const highlightedPatternLinkIds = useMemo(() => {
    return selectedPattern ? selectedPattern.involvedLinkIds : [];
  }, [selectedPattern]);

  // Handler for Ingesting Extracted NLP / CDR / Financial data
  const handleIngestExtractedData = (
    newNodes: CrimeNetworkNode[],
    newLinks: CrimeNetworkLink[],
    newCdrs?: CDRRecord[],
    newFins?: FinancialRecord[]
  ) => {
    // Merge unique nodes by ID
    setNodes((prev) => {
      const existingIds = new Set(prev.map((n) => n.id));
      const filtered = newNodes.filter((n) => !existingIds.has(n.id));
      return [...prev, ...filtered];
    });

    // Merge unique links by ID
    setLinks((prev) => {
      const existingLinkIds = new Set(prev.map((l) => l.id));
      const filtered = newLinks.filter((l) => !existingLinkIds.has(l.id));
      return [...prev, ...filtered];
    });

    if (newCdrs && newCdrs.length > 0) {
      setCdrs((prev) => [...prev, ...newCdrs]);
    }

    if (newFins && newFins.length > 0) {
      setFinancials((prev) => [...prev, ...newFins]);
    }
  };

  // Handler to initiate path finding from entity drawer
  const handleInitiatePathFind = (sourceNodeId: string) => {
    setSelectedNode(null);
    setActiveTab("analytics");
  };

  const handleSelectNodeAndFocus = (node: CrimeNetworkNode) => {
    setSelectedNode(node);
    setActiveTab("graph");
  };

  const handleSelectPatternAndFocus = (pattern: SuspiciousPattern) => {
    setSelectedPattern(pattern);
    setActiveTab("patterns");
  };

  return (
    <div className="h-screen w-screen bg-slate-950 text-slate-100 flex overflow-hidden font-sans selection:bg-amber-500 selection:text-slate-950">
      {/* 1. Collapsible Professional Left Sidebar (Desktop + Mobile slide-out drawer) */}
      <Sidebar
        currentCase={currentCase}
        allCases={allCases}
        onSelectCase={handleSelectCase}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onOpenCopilot={() => setIsCopilotOpen(true)}
        onOpenDossier={() => setIsDossierOpen(true)}
        onOpenNewCase={() => setIsCreateCaseOpen(true)}
        nodeCount={analyzedNodes.length}
        kingpinCount={analyzedNodes.filter((n) => n.isKingpinCandidate).length}
        cutVertexCount={cutVertices.length}
        patternCount={detectedPatterns.length}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        isMobileOpen={isMobileMenuOpen}
        onCloseMobile={() => setIsMobileMenuOpen(false)}
      />

      {/* 2. Main Intelligence Workstation Viewport */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden bg-slate-950">
        {/* Top Header Command Bar with Global Omnibar Search & New Case Button */}
        <Header
          currentCase={currentCase}
          allCases={allCases}
          onSelectCase={handleSelectCase}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          onOpenDossier={() => setIsDossierOpen(true)}
          onOpenCopilot={() => setIsCopilotOpen(true)}
          onOpenNewCase={() => setIsCreateCaseOpen(true)}
          onOpenMobileMenu={() => setIsMobileMenuOpen(true)}
          nodes={analyzedNodes}
          onSelectNode={handleSelectNodeAndFocus}
          nodeCount={analyzedNodes.length}
          linkCount={links.length}
          kingpinCount={analyzedNodes.filter((n) => n.isKingpinCandidate).length}
          patternCount={detectedPatterns.length}
        />

        {/* Dynamic Workspace Container */}
        <main className="flex-1 overflow-y-auto relative flex flex-col pb-16 md:pb-0">
          {/* Module 0: Executive Command Overview Dashboard */}
          {activeTab === "overview" && (
            <OverviewDashboard
              currentCase={currentCase}
              nodes={analyzedNodes}
              links={links}
              patterns={detectedPatterns}
              communities={communities}
              cutVertices={cutVertices}
              onSelectNode={handleSelectNodeAndFocus}
              onSelectPattern={handleSelectPatternAndFocus}
              onNavigateTab={setActiveTab}
              onOpenCopilot={() => setIsCopilotOpen(true)}
              onOpenDossier={() => setIsDossierOpen(true)}
              onOpenNewCase={() => setIsCreateCaseOpen(true)}
            />
          )}

          {/* Module 1: Interactive D3 Graph Workstation */}
          {activeTab === "graph" && (
            <GraphCanvas
              nodes={analyzedNodes}
              links={links}
              communities={communities}
              selectedNodeId={selectedNode?.id || null}
              onSelectNode={setSelectedNode}
              shortestPath={shortestPath}
              highlightedPatternNodeIds={highlightedPatternNodeIds}
              highlightedPatternLinkIds={highlightedPatternLinkIds}
            />
          )}

          {/* Module 2: Centrality, Influencers & Disruption Engine */}
          {activeTab === "analytics" && (
            <AnalyticsDashboard
              nodes={analyzedNodes}
              links={links}
              communities={communities}
              cutVertices={cutVertices}
              onSelectNode={(node) => {
                setSelectedNode(node);
                setActiveTab("graph");
              }}
              onSetShortestPath={setShortestPath}
              onSwitchToGraph={() => setActiveTab("graph")}
            />
          )}

          {/* Module 3: Suspicious Pattern Alert Center */}
          {activeTab === "patterns" && (
            <PatternAlerts
              patterns={detectedPatterns}
              nodes={analyzedNodes}
              onSelectPattern={setSelectedPattern}
              onFocusNode={(node) => {
                setSelectedNode(node);
                setActiveTab("graph");
              }}
              onSwitchToGraph={() => setActiveTab("graph")}
            />
          )}

          {/* Module 4: Geospatial & Spatio-Temporal Intelligence */}
          {activeTab === "geo" && (
            <GeoTimelineView
              nodes={analyzedNodes}
              links={links}
              firs={firs}
              cdrs={cdrs}
              financials={financials}
              intels={intels}
              onSelectNode={(node) => {
                setSelectedNode(node);
                setActiveTab("graph");
              }}
            />
          )}

          {/* Module 5: Multi-Source Data Ingestion Hub */}
          {activeTab === "ingest" && (
            <DataIngestionHub
              onIngestExtractedData={handleIngestExtractedData}
              onSwitchToGraph={() => setActiveTab("graph")}
            />
          )}
        </main>
      </div>

      {/* 3. Mobile Bottom Navigation Bar */}
      <MobileBottomNav
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onOpenNewCase={() => setIsCreateCaseOpen(true)}
        onOpenCopilot={() => setIsCopilotOpen(true)}
        onOpenDossier={() => setIsDossierOpen(true)}
      />

      {/* 4. Register / Create New Case Modal */}
      <CreateCaseModal
        isOpen={isCreateCaseOpen}
        onClose={() => setIsCreateCaseOpen(false)}
        onCreateCase={handleCreateCase}
      />

      {/* 5. 360-Degree Entity Detail Drawer */}
      {selectedNode && (
        <EntityDetailDrawer
          node={selectedNode}
          allNodes={analyzedNodes}
          links={links}
          onClose={() => setSelectedNode(null)}
          onSelectNeighbor={(neighbor) => setSelectedNode(neighbor)}
          onInitiatePathFind={handleInitiatePathFind}
        />
      )}

      {/* 6. AI Criminal Graph Copilot */}
      <AiCopilotDrawer
        isOpen={isCopilotOpen}
        onClose={() => setIsCopilotOpen(false)}
        nodes={analyzedNodes}
        links={links}
        patterns={detectedPatterns}
        communities={communities}
        onSelectNode={(node) => setSelectedNode(node)}
      />

      {/* 7. Court-Ready Case Intelligence Dossier */}
      <DossierModal
        isOpen={isDossierOpen}
        onClose={() => setIsDossierOpen(false)}
        currentCase={currentCase}
        nodes={analyzedNodes}
        links={links}
        patterns={detectedPatterns}
        communities={communities}
      />
    </div>
  );
}
