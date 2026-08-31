import React, { useEffect, useRef, useState, useMemo } from "react";
import * as d3 from "d3";
import {
  CrimeNetworkNode,
  CrimeNetworkLink,
  EntityType,
  RelationType,
  SyndicateCommunity,
  ShortestPathResult,
  InformationCategory,
  ReviewState,
} from "../types";
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  RefreshCw,
  Search,
  Filter,
  User,
  Phone,
  Landmark,
  MapPin,
  Truck,
  Building,
  AlertCircle,
  Eye,
  Crown,
  Share2,
  Scissors,
  Layers,
  ChevronDown,
  ChevronUp,
  Radio,
  SlidersHorizontal,
  X,
  Quote,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";

interface GraphCanvasProps {
  nodes: CrimeNetworkNode[];
  links: CrimeNetworkLink[];
  communities: SyndicateCommunity[];
  selectedNodeId: string | null;
  onSelectNode: (node: CrimeNetworkNode | null) => void;
  onSelectLink?: (link: CrimeNetworkLink) => void;
  shortestPath: ShortestPathResult | null;
  highlightedPatternNodeIds?: string[];
  highlightedPatternLinkIds?: string[];
}

export const GraphCanvas: React.FC<GraphCanvasProps> = ({
  nodes,
  links,
  communities,
  selectedNodeId,
  onSelectNode,
  onSelectLink,
  shortestPath,
  highlightedPatternNodeIds = [],
  highlightedPatternLinkIds = [],
}) => {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Canvas Control State
  const [sizingMetric, setSizingMetric] = useState<"betweenness" | "degree" | "pageRank" | "risk">("betweenness");
  const [colorMode, setColorMode] = useState<"community" | "type" | "risk">("community");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<InformationCategory | "ALL">("ALL");
  const [selectedReviewState, setSelectedReviewState] = useState<ReviewState | "ALL">("ALL");
  const [selectedTypes, setSelectedTypes] = useState<EntityType[]>([
    "PERSON",
    "PHONE",
    "FINANCIAL",
    "LOCATION",
    "VEHICLE",
    "ORGANIZATION",
    "INCIDENT",
  ]);
  const [minRisk, setMinRisk] = useState<number>(0);
  const [onlyKingpins, setOnlyKingpins] = useState(false);
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);

  // Key Kingpins & Cut-Vertices for quick target chips
  const keyTargets = useMemo(() => {
    return nodes
      .filter((n) => n.isKingpinCandidate || n.isCutVertex)
      .sort((a, b) => (b.betweenness || 0) - (a.betweenness || 0))
      .slice(0, 5);
  }, [nodes]);

  // Filtered nodes and links based on UI controls
  const filteredNodes = useMemo(() => {
    return nodes.filter((n) => {
      if (!selectedTypes.includes(n.type)) return false;
      if (n.riskScore < minRisk) return false;
      if (onlyKingpins && !n.isKingpinCandidate) return false;

      // Category filter (Evidence vs Investigator Hypothesis)
      if (selectedCategory !== "ALL") {
        if (selectedCategory === "INVESTIGATOR_KNOWLEDGE" && n.category !== "INVESTIGATOR_KNOWLEDGE") return false;
        if (selectedCategory === "EVIDENCE" && n.category === "INVESTIGATOR_KNOWLEDGE") return false;
      }

      // Review State filter
      if (selectedReviewState !== "ALL") {
        const review = n.reviewState || "NEEDS_REVIEW";
        if (review !== selectedReviewState) return false;
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = n.label.toLowerCase().includes(q);
        const matchRole = (n.role || "").toLowerCase().includes(q);
        const matchAlias = (n.aliases || []).some((a) => a.toLowerCase().includes(q));
        const matchPhone = (n.details?.phone || "").includes(q);
        const matchPlate = (n.details?.vehiclePlate || "").toLowerCase().includes(q);
        if (!matchName && !matchRole && !matchAlias && !matchPhone && !matchPlate) return false;
      }
      return true;
    });
  }, [nodes, selectedTypes, minRisk, onlyKingpins, selectedCategory, selectedReviewState, searchQuery]);

  const filteredNodeIds = useMemo(() => new Set(filteredNodes.map((n) => n.id)), [filteredNodes]);

  const filteredLinks = useMemo(() => {
    return links.filter((l) => {
      const s = typeof l.source === "object" ? (l.source as any).id : l.source;
      const t = typeof l.target === "object" ? (l.target as any).id : l.target;
      return filteredNodeIds.has(s) && filteredNodeIds.has(t);
    });
  }, [links, filteredNodeIds]);

  // Color Mapping helpers
  const getEntityTypeColor = (type: EntityType) => {
    switch (type) {
      case "PERSON":
        return "#f97316"; // Orange
      case "PHONE":
        return "#38bdf8"; // Sky Blue
      case "FINANCIAL":
        return "#10b981"; // Emerald Green
      case "LOCATION":
        return "#a855f7"; // Purple
      case "VEHICLE":
        return "#eab308"; // Yellow
      case "ORGANIZATION":
        return "#06b6d4"; // Cyan
      case "INCIDENT":
        return "#f43f5e"; // Rose
      default:
        return "#94a3b8";
    }
  };

  const getNodeColor = (node: CrimeNetworkNode) => {
    if (colorMode === "type") {
      return getEntityTypeColor(node.type);
    }
    if (colorMode === "risk") {
      if (node.riskScore >= 85) return "#ef4444";
      if (node.riskScore >= 70) return "#f97316";
      if (node.riskScore >= 50) return "#eab308";
      return "#10b981";
    }
    // Default: community color
    const comm = communities.find((c) => c.id === node.communityId);
    return comm?.color || getEntityTypeColor(node.type);
  };

  // Node Size Calculator
  const getNodeRadius = (node: CrimeNetworkNode) => {
    let base = 14;
    if (sizingMetric === "betweenness") {
      const b = node.betweenness || 0;
      base = 12 + Math.min(26, b * 70);
    } else if (sizingMetric === "degree") {
      const d = node.degree || 1;
      base = 12 + Math.min(24, d * 3);
    } else if (sizingMetric === "pageRank") {
      const pr = node.pageRank || 0.05;
      base = 12 + Math.min(26, pr * 200);
    } else if (sizingMetric === "risk") {
      base = 10 + (node.riskScore / 100) * 18;
    }
    if (node.isKingpinCandidate) base += 4;
    return base;
  };

  // D3 Force Simulation Setup
  useEffect(() => {
    if (!svgRef.current || !containerRef.current) return;

    const width = containerRef.current.clientWidth || 900;
    const height = containerRef.current.clientHeight || 650;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    // Background tactical grid
    const defs = svg.append("defs");
    const pattern = defs
      .append("pattern")
      .attr("id", "tactical-grid")
      .attr("width", 40)
      .attr("height", 40)
      .attr("patternUnits", "userSpaceOnUse");

    pattern
      .append("path")
      .attr("d", "M 40 0 L 0 0 0 40")
      .attr("fill", "none")
      .attr("stroke", "rgba(51, 65, 85, 0.25)")
      .attr("stroke-width", "0.75");

    svg
      .append("rect")
      .attr("width", "100%")
      .attr("height", "100%")
      .attr("fill", "url(#tactical-grid)")
      .style("pointer-events", "none");

    const g = svg.append("g").attr("class", "graph-container");

    // D3 Zoom Setup
    const zoom = d3
      .zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.15, 5])
      .on("zoom", (event) => {
        g.attr("transform", event.transform);
      });

    svg.call(zoom);
    svg.call(
      zoom.transform,
      d3.zoomIdentity.translate(width / 2, height / 2).scale(0.85)
    );

    // Deep clones to prevent mutation
    const simNodes: (CrimeNetworkNode & d3.SimulationNodeDatum)[] = filteredNodes.map((n) => ({
      ...n,
    }));
    const simLinks: (CrimeNetworkLink & d3.SimulationLinkDatum<CrimeNetworkNode & d3.SimulationNodeDatum>)[] = filteredLinks.map((l) => ({
      ...l,
      source: typeof l.source === "object" ? (l.source as any).id : l.source,
      target: typeof l.target === "object" ? (l.target as any).id : l.target,
    }));

    // Setup Force Simulation
    const simulation = d3
      .forceSimulation(simNodes)
      .force(
        "link",
        d3
          .forceLink<CrimeNetworkNode & d3.SimulationNodeDatum, any>(simLinks)
          .id((d) => d.id)
          .distance((d) => (d.weight ? 150 / d.weight : 110))
      )
      .force("charge", d3.forceManyBody().strength(-350))
      .force("center", d3.forceCenter(0, 0))
      .force("collision", d3.forceCollide<CrimeNetworkNode>().radius((d) => getNodeRadius(d) + 18));

    // Render Links
    const linkGroup = g.append("g").attr("class", "links");
    const link = linkGroup
      .selectAll("line")
      .data(simLinks)
      .enter()
      .append("line")
      .style("cursor", "pointer")
      .attr("stroke", (d) => {
        const isPatternLink = highlightedPatternLinkIds.includes(d.id);
        const isShortestPathLink =
          shortestPath &&
          shortestPath.hops.some(
            (h, i) =>
              (h === (d.source as any).id && shortestPath.hops[i + 1] === (d.target as any).id) ||
              (h === (d.target as any).id && shortestPath.hops[i + 1] === (d.source as any).id)
          );

        if (isShortestPathLink) return "#f59e0b"; // Gold
        if (isPatternLink) return "#f43f5e"; // Rose Red
        if (d.category === "INVESTIGATOR_KNOWLEDGE") return "#c084fc"; // Purple for Hypotheses
        return "rgba(100, 116, 139, 0.45)"; // Slate
      })
      .attr("stroke-width", (d) => {
        const isShortestPathLink =
          shortestPath &&
          shortestPath.hops.some(
            (h, i) =>
              (h === (d.source as any).id && shortestPath.hops[i + 1] === (d.target as any).id) ||
              (h === (d.target as any).id && shortestPath.hops[i + 1] === (d.source as any).id)
          );
        if (isShortestPathLink) return 3.5;
        if (highlightedPatternLinkIds.includes(d.id)) return 3;
        return Math.min(4, Math.max(1.5, (d.weight || 1) * 0.8));
      })
      .attr("stroke-dasharray", (d) => {
        if (d.category === "INVESTIGATOR_KNOWLEDGE") return "3,3";
        return d.flags && d.flags.length > 0 ? "4,4" : "none";
      })
      .attr("opacity", 0.8)
      .on("click", (event, d) => {
        event.stopPropagation();
        if (onSelectLink) {
          const originalLink = links.find((l) => l.id === d.id) || (d as CrimeNetworkLink);
          onSelectLink(originalLink);
        }
      });

    // Link Labels
    const linkLabelGroup = g.append("g").attr("class", "link-labels");
    const linkLabel = linkLabelGroup
      .selectAll("text")
      .data(simLinks.filter((l) => l.relationType && l.relationType !== "ASSOCIATED_WITH"))
      .enter()
      .append("text")
      .text((d) => d.relationType.replace(/_/g, " ").toLowerCase())
      .attr("font-size", "8px")
      .attr("fill", "rgba(148, 163, 184, 0.6)")
      .attr("text-anchor", "middle")
      .attr("font-family", "monospace")
      .style("pointer-events", "none");

    // Render Nodes Group
    const nodeGroup = g.append("g").attr("class", "nodes");
    const node = nodeGroup
      .selectAll<SVGGElement, CrimeNetworkNode & d3.SimulationNodeDatum>("g")
      .data(simNodes)
      .enter()
      .append("g")
      .attr("class", "node-group")
      .style("cursor", "pointer")
      .call(
        d3
          .drag<SVGGElement, CrimeNetworkNode & d3.SimulationNodeDatum>()
          .on("start", (event, d) => {
            if (!event.active) simulation.alphaTarget(0.3).restart();
            d.fx = d.x;
            d.fy = d.y;
          })
          .on("drag", (event, d) => {
            d.fx = event.x;
            d.fy = event.y;
          })
          .on("end", (event, d) => {
            if (!event.active) simulation.alphaTarget(0);
            d.fx = null;
            d.fy = null;
          })
      );

    // Node Outer Glow / Halo for Kingpins or Shortest Path
    node
      .filter((d) => d.isKingpinCandidate || (shortestPath && shortestPath.hops.includes(d.id)) || highlightedPatternNodeIds.includes(d.id))
      .append("circle")
      .attr("r", (d) => getNodeRadius(d) + 8)
      .attr("fill", (d) => {
        if (shortestPath && shortestPath.hops.includes(d.id)) return "rgba(245, 158, 11, 0.25)";
        if (highlightedPatternNodeIds.includes(d.id)) return "rgba(244, 63, 94, 0.3)";
        return "rgba(245, 158, 11, 0.2)";
      })
      .attr("stroke", (d) => {
        if (shortestPath && shortestPath.hops.includes(d.id)) return "#f59e0b";
        if (highlightedPatternNodeIds.includes(d.id)) return "#f43f5e";
        return "#eab308";
      })
      .attr("stroke-width", 1.5)
      .attr("stroke-dasharray", "4,3")
      .attr("class", "animate-pulse");

    // Main Node Circle
    node
      .append("circle")
      .attr("r", (d) => getNodeRadius(d))
      .attr("fill", (d) => getNodeColor(d))
      .attr("stroke", (d) => {
        if (d.id === selectedNodeId) return "#38bdf8";
        if (d.isCutVertex) return "#a855f7";
        if (d.category === "INVESTIGATOR_KNOWLEDGE") return "#c084fc";
        return "rgba(15, 23, 42, 0.9)";
      })
      .attr("stroke-width", (d) => (d.id === selectedNodeId ? 3.5 : 2))
      .attr("filter", "drop-shadow(0 2px 6px rgba(0,0,0,0.6))");

    // Node Icons
    node
      .append("text")
      .attr("text-anchor", "middle")
      .attr("dy", ".3em")
      .attr("font-size", (d) => `${Math.max(9, getNodeRadius(d) * 0.75)}px`)
      .attr("fill", "#0f172a")
      .attr("font-weight", "bold")
      .attr("font-family", "monospace")
      .style("pointer-events", "none")
      .text((d) => {
        if (d.type === "PERSON") return "👤";
        if (d.type === "PHONE") return "📱";
        if (d.type === "FINANCIAL") return "🏦";
        if (d.type === "LOCATION") return "📍";
        if (d.type === "VEHICLE") return "🚗";
        if (d.type === "ORGANIZATION") return "🏢";
        return "•";
      });

    // Node Labels
    node
      .append("text")
      .text((d) => d.label)
      .attr("x", 0)
      .attr("y", (d) => getNodeRadius(d) + 13)
      .attr("text-anchor", "middle")
      .attr("font-size", "11px")
      .attr("font-weight", (d) => (d.isKingpinCandidate || d.id === selectedNodeId ? "bold" : "500"))
      .attr("fill", (d) => {
        if (d.id === selectedNodeId) return "#38bdf8";
        if (d.isKingpinCandidate) return "#fbbf24";
        return "#f1f5f9";
      })
      .attr("stroke", "#020617")
      .attr("stroke-width", 3)
      .attr("paint-order", "stroke")
      .style("pointer-events", "none");

    // Category / Review Tag
    node
      .append("text")
      .text((d) => {
        if (d.category === "INVESTIGATOR_KNOWLEDGE") return "[HYPO]";
        if (d.reviewState === "CONFIRMED") return "✓ EVID";
        if (d.role) return d.role;
        return "";
      })
      .attr("x", 0)
      .attr("y", (d) => getNodeRadius(d) + 24)
      .attr("text-anchor", "middle")
      .attr("font-size", "9px")
      .attr("fill", (d) => (d.category === "INVESTIGATOR_KNOWLEDGE" ? "#c084fc" : "rgba(148, 163, 184, 0.8)"))
      .attr("font-family", "monospace")
      .attr("stroke", "#020617")
      .attr("stroke-width", 2.5)
      .attr("paint-order", "stroke")
      .style("pointer-events", "none");

    // Node Hover & Click Handlers
    node.on("click", (event, d) => {
      event.stopPropagation();
      onSelectNode(d);
    });

    node.on("mouseenter", (event, d) => {
      setHoveredNodeId(d.id);
    });

    node.on("mouseleave", () => {
      setHoveredNodeId(null);
    });

    // Tick Handler
    simulation.on("tick", () => {
      link
        .attr("x1", (d: any) => d.source.x)
        .attr("y1", (d: any) => d.source.y)
        .attr("x2", (d: any) => d.target.x)
        .attr("y2", (d: any) => d.target.y);

      linkLabel
        .attr("x", (d: any) => (d.source.x + d.target.x) / 2)
        .attr("y", (d: any) => (d.source.y + d.target.y) / 2 - 4);

      node.attr("transform", (d: any) => `translate(${d.x},${d.y})`);
    });

    return () => {
      simulation.stop();
    };
  }, [
    filteredNodes,
    filteredLinks,
    selectedNodeId,
    sizingMetric,
    colorMode,
    shortestPath,
    highlightedPatternNodeIds,
    highlightedPatternLinkIds,
  ]);

  const handleZoom = (scaleFactor: number) => {
    if (!svgRef.current) return;
    const svg = d3.select(svgRef.current);
    svg.transition().duration(250).call(d3.zoom<SVGSVGElement, unknown>().scaleBy as any, scaleFactor);
  };

  const handleResetZoom = () => {
    if (!svgRef.current || !containerRef.current) return;
    const width = containerRef.current.clientWidth || 900;
    const height = containerRef.current.clientHeight || 650;
    const svg = d3.select(svgRef.current);
    svg
      .transition()
      .duration(350)
      .call(
        d3.zoom<SVGSVGElement, unknown>().transform as any,
        d3.zoomIdentity.translate(width / 2, height / 2).scale(0.85)
      );
  };

  const toggleTypeFilter = (type: EntityType) => {
    setSelectedTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  };

  return (
    <div ref={containerRef} className="relative w-full h-[calc(100vh-64px)] bg-slate-950 overflow-hidden flex flex-col select-none">
      {/* 1. Top HUD Control Bar */}
      <div className="absolute top-4 left-4 right-4 z-20 flex flex-wrap items-center justify-between gap-3 pointer-events-none">
        {/* Left Toolbar Controls */}
        <div className="flex flex-wrap items-center gap-2 pointer-events-auto bg-slate-900/90 backdrop-blur-md p-2 rounded-xl border border-slate-800 shadow-2xl">
          {/* Quick Search */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Filter canvas nodes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-slate-950 border border-slate-700/80 text-slate-200 text-xs rounded-lg pl-8 pr-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-amber-500 w-36 sm:w-48"
            />
          </div>

          {/* Sizing Metric Selector */}
          <div className="hidden sm:flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800 text-[11px]">
            <span className="text-slate-400 font-mono font-medium px-1.5">Size:</span>
            <button
              onClick={() => setSizingMetric("betweenness")}
              className={`px-2 py-0.5 rounded-md font-medium transition-colors ${
                sizingMetric === "betweenness"
                  ? "bg-amber-500/20 text-amber-300 font-semibold border border-amber-500/30"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Betweenness
            </button>
            <button
              onClick={() => setSizingMetric("degree")}
              className={`px-2 py-0.5 rounded-md font-medium transition-colors ${
                sizingMetric === "degree"
                  ? "bg-amber-500/20 text-amber-300 font-semibold border border-amber-500/30"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Degree
            </button>
          </div>

          {/* Category Filter Toggle */}
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800 text-[11px]">
            <button
              onClick={() => setSelectedCategory("ALL")}
              className={`px-2 py-0.5 rounded-md font-medium ${
                selectedCategory === "ALL"
                  ? "bg-indigo-500/20 text-indigo-300 font-semibold"
                  : "text-slate-400"
              }`}
            >
              All
            </button>
            <button
              onClick={() => setSelectedCategory("EVIDENCE")}
              className={`px-2 py-0.5 rounded-md font-medium ${
                selectedCategory === "EVIDENCE"
                  ? "bg-amber-500/20 text-amber-300 font-semibold"
                  : "text-slate-400"
              }`}
            >
              Evidence Only
            </button>
            <button
              onClick={() => setSelectedCategory("INVESTIGATOR_KNOWLEDGE")}
              className={`px-2 py-0.5 rounded-md font-medium ${
                selectedCategory === "INVESTIGATOR_KNOWLEDGE"
                  ? "bg-purple-500/20 text-purple-300 font-semibold"
                  : "text-slate-400"
              }`}
            >
              Hypotheses
            </button>
          </div>

          {/* Filter Panel Toggle */}
          <button
            onClick={() => setIsFilterPanelOpen(!isFilterPanelOpen)}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
              isFilterPanelOpen
                ? "bg-amber-500/20 text-amber-300 border-amber-500/40"
                : "bg-slate-950 text-slate-300 border-slate-700/80 hover:bg-slate-850"
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Filters</span>
          </button>
        </div>

        {/* Right Toolbar: Quick HVTs & Zoom Controls */}
        <div className="flex items-center gap-2 pointer-events-auto">
          {/* Quick Target Chips */}
          <div className="hidden lg:flex items-center gap-1.5 bg-slate-900/90 backdrop-blur-md p-1.5 rounded-xl border border-slate-800 shadow-xl">
            <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider px-1.5 font-bold">
              Focus:
            </span>
            {keyTargets.map((target) => (
              <button
                key={target.id}
                onClick={() => onSelectNode(target)}
                className={`px-2 py-1 rounded-lg text-[11px] font-mono font-semibold transition-all flex items-center gap-1 ${
                  selectedNodeId === target.id
                    ? "bg-amber-500 text-slate-950 font-bold"
                    : "bg-slate-950 text-slate-300 hover:text-amber-300 border border-slate-800 hover:border-amber-500/40"
                }`}
              >
                {target.isKingpinCandidate && <Crown className="w-3 h-3 text-amber-400" />}
                {target.isCutVertex && !target.isKingpinCandidate && <Scissors className="w-3 h-3 text-purple-400" />}
                <span className="truncate max-w-[110px]">{target.label}</span>
              </button>
            ))}
          </div>

          {/* Zoom Action Group */}
          <div className="flex items-center gap-1 bg-slate-900/90 backdrop-blur-md p-1.5 rounded-xl border border-slate-800 shadow-xl">
            <button
              onClick={() => handleZoom(1.25)}
              className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
              title="Zoom In"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleZoom(0.8)}
              className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
              title="Zoom Out"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <button
              onClick={handleResetZoom}
              className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
              title="Recenter Canvas"
            >
              <Maximize2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Expanded Filter Panel Drawer */}
      {isFilterPanelOpen && (
        <div className="absolute top-18 left-4 z-20 w-80 bg-slate-900/95 backdrop-blur-md border border-slate-800 rounded-2xl p-4 shadow-2xl space-y-4 animate-in fade-in duration-150">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-amber-400" />
              <span className="text-xs font-bold text-slate-100 uppercase tracking-wider font-mono">
                Advanced Canvas Filters
              </span>
            </div>
            <button
              onClick={() => setIsFilterPanelOpen(false)}
              className="text-slate-400 hover:text-slate-200"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Entity Type Toggle Chips */}
          <div className="space-y-2">
            <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">
              Entity Classifications
            </span>
            <div className="grid grid-cols-2 gap-1.5">
              {[
                { type: "PERSON" as const, label: "Persons", color: "text-orange-400" },
                { type: "PHONE" as const, label: "Phones / SIMs", color: "text-sky-400" },
                { type: "FINANCIAL" as const, label: "Bank / VPAs", color: "text-emerald-400" },
                { type: "LOCATION" as const, label: "Safehouses", color: "text-purple-400" },
                { type: "VEHICLE" as const, label: "Vehicles", color: "text-yellow-400" },
                { type: "ORGANIZATION" as const, label: "Front Shells", color: "text-cyan-400" },
              ].map((item) => {
                const isSelected = selectedTypes.includes(item.type);
                return (
                  <button
                    key={item.type}
                    onClick={() => toggleTypeFilter(item.type)}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-medium border text-left flex items-center justify-between transition-colors ${
                      isSelected
                        ? "bg-slate-950 border-amber-500/40 text-slate-100"
                        : "bg-slate-950/40 border-slate-800 text-slate-500 line-through"
                    }`}
                  >
                    <span className={isSelected ? item.color : "text-slate-500"}>
                      {item.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Review State Filter */}
          <div className="space-y-1.5">
            <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">
              Investigator Review Status
            </span>
            <div className="grid grid-cols-3 gap-1">
              <button
                onClick={() => setSelectedReviewState("ALL")}
                className={`py-1 rounded text-[10px] font-mono font-semibold ${
                  selectedReviewState === "ALL"
                    ? "bg-slate-700 text-white"
                    : "bg-slate-950 text-slate-400 border border-slate-800"
                }`}
              >
                All
              </button>
              <button
                onClick={() => setSelectedReviewState("CONFIRMED")}
                className={`py-1 rounded text-[10px] font-mono font-semibold ${
                  selectedReviewState === "CONFIRMED"
                    ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                    : "bg-slate-950 text-slate-400 border border-slate-800"
                }`}
              >
                Confirmed
              </button>
              <button
                onClick={() => setSelectedReviewState("NEEDS_REVIEW")}
                className={`py-1 rounded text-[10px] font-mono font-semibold ${
                  selectedReviewState === "NEEDS_REVIEW"
                    ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                    : "bg-slate-950 text-slate-400 border border-slate-800"
                }`}
              >
                Needs Review
              </button>
            </div>
          </div>

          {/* Minimum Risk Threshold Slider */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-slate-400">Min Threat Risk:</span>
              <span className="text-amber-400 font-bold">{minRisk} / 100</span>
            </div>
            <input
              type="range"
              min={0}
              max={95}
              step={5}
              value={minRisk}
              onChange={(e) => setMinRisk(parseInt(e.target.value))}
              className="w-full accent-amber-500 bg-slate-950 h-1.5 rounded-lg cursor-pointer"
            />
          </div>
        </div>
      )}

      {/* Main SVG Visualization Canvas */}
      <svg ref={svgRef} className="w-full h-full cursor-grab active:cursor-grabbing" />
    </div>
  );
};
