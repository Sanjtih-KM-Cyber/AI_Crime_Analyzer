import React from "react";
import { CrimeNetworkNode, CrimeNetworkLink } from "../types";
import {
  X,
  ShieldAlert,
  Crown,
  Phone,
  Landmark,
  MapPin,
  Truck,
  FileText,
  Activity,
  Share2,
  AlertTriangle,
  Radio,
  Scissors,
  ArrowRight,
} from "lucide-react";

interface EntityDetailDrawerProps {
  node: CrimeNetworkNode | null;
  allNodes: CrimeNetworkNode[];
  links: CrimeNetworkLink[];
  onClose: () => void;
  onSelectNeighbor: (node: CrimeNetworkNode) => void;
  onInitiatePathFind: (sourceNodeId: string) => void;
}

export const EntityDetailDrawer: React.FC<EntityDetailDrawerProps> = ({
  node,
  allNodes,
  links,
  onClose,
  onSelectNeighbor,
  onInitiatePathFind,
}) => {
  if (!node) return null;

  // Find all direct 1-hop links
  const connectedLinks = links.filter((l) => {
    const s = typeof l.source === "object" ? l.source.id : l.source;
    const t = typeof l.target === "object" ? l.target.id : l.target;
    return s === node.id || t === node.id;
  });

  const neighbors = connectedLinks.map((l) => {
    const s = typeof l.source === "object" ? l.source.id : l.source;
    const t = typeof l.target === "object" ? l.target.id : l.target;
    const otherId = s === node.id ? t : s;
    const otherNode = allNodes.find((n) => n.id === otherId);
    return {
      node: otherNode,
      link: l,
      direction: s === node.id ? "OUT" : "IN",
    };
  });

  return (
    <>
      <div
        className="fixed inset-0 bg-slate-950/75 backdrop-blur-sm z-40 transition-opacity"
        onClick={onClose}
      />
      <div className="fixed inset-y-0 right-0 z-50 w-full sm:w-[480px] bg-slate-900/98 backdrop-blur-xl border-l border-slate-800 shadow-2xl flex flex-col justify-between overflow-y-auto animate-in slide-in-from-right duration-300">
        {/* Drawer Header */}
      <div>
        <div className="p-5 border-b border-slate-800 flex items-start justify-between">
          <div className="flex items-start gap-3">
            <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800 text-amber-400 mt-0.5">
              {node.isKingpinCandidate ? (
                <Crown className="w-6 h-6 text-amber-400" />
              ) : (
                <ShieldAlert className="w-6 h-6 text-slate-300" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-semibold">
                  {node.type}
                </span>
                {node.isKingpinCandidate && (
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    KINGPIN CANDIDATE
                  </span>
                )}
                {node.isCutVertex && (
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30">
                    CUT VERTEX
                  </span>
                )}
              </div>
              <h2 className="text-base font-bold text-slate-100 mt-1">{node.label}</h2>
              <p className="text-xs text-slate-400">{node.role || "Unclassified Entity"}</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 space-y-6">
          {/* Risk Gauge Bar */}
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-400">Criminal Threat Risk Score:</span>
              <span className="font-mono text-sm font-bold text-amber-400">
                {node.riskScore} / 100
              </span>
            </div>
            <div className="w-full bg-slate-900 h-2.5 rounded-full overflow-hidden border border-slate-800">
              <div
                className={`h-full rounded-full ${
                  node.riskScore >= 85
                    ? "bg-rose-500"
                    : node.riskScore >= 70
                    ? "bg-amber-500"
                    : "bg-emerald-500"
                }`}
                style={{ width: `${node.riskScore}%` }}
              ></div>
            </div>
          </div>

          {/* Graph Centrality Topology Matrix */}
          <div>
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-indigo-400" />
              Graph Topology Metrics:
            </h3>
            <div className="grid grid-cols-2 gap-2.5 text-xs">
              <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg">
                <span className="text-[11px] text-slate-400 block">Betweenness Centrality</span>
                <strong className="text-sm font-mono text-amber-400">{node.betweenness || "0.0000"}</strong>
                <p className="text-[10px] text-slate-500 mt-0.5">Control of communication flow</p>
              </div>

              <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg">
                <span className="text-[11px] text-slate-400 block">Degree Centrality</span>
                <strong className="text-sm font-mono text-slate-200">{node.degree || 0} Links</strong>
                <p className="text-[10px] text-slate-500 mt-0.5">Direct contact volume</p>
              </div>

              <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg">
                <span className="text-[11px] text-slate-400 block">PageRank Score</span>
                <strong className="text-sm font-mono text-slate-200">{node.pageRank || "0.0000"}</strong>
                <p className="text-[10px] text-slate-500 mt-0.5">Structural hierarchy weight</p>
              </div>

              <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg">
                <span className="text-[11px] text-slate-400 block">Syndicate Faction</span>
                <strong className="text-xs font-bold text-indigo-400 truncate block">
                  {node.communityName || "Cell #1"}
                </strong>
                <p className="text-[10px] text-slate-500 mt-0.5">Louvain cluster</p>
              </div>
            </div>
          </div>

          {/* Technical Intelligence & Identifiers */}
          <div>
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2.5">
              Technical Identifiers & Intelligence:
            </h3>
            <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-2.5 text-xs text-slate-300">
              {node.aliases && node.aliases.length > 0 && (
                <div className="flex items-start justify-between">
                  <span className="text-slate-500">Known Aliases:</span>
                  <span className="font-semibold text-slate-200">{node.aliases.join(", ")}</span>
                </div>
              )}

              {node.details?.phone && (
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Phone Number:</span>
                  <span className="font-mono font-semibold text-sky-400">{node.details.phone}</span>
                </div>
              )}

              {node.details?.imei && (
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Handset IMEI:</span>
                  <span className="font-mono font-semibold text-sky-300">{node.details.imei}</span>
                </div>
              )}

              {node.details?.accountNumber && (
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Bank / VPA Account:</span>
                  <span className="font-mono font-semibold text-emerald-400">
                    {node.details.accountNumber}
                  </span>
                </div>
              )}

              {node.details?.vehiclePlate && (
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Vehicle Registration:</span>
                  <span className="font-mono font-semibold text-yellow-400">
                    {node.details.vehiclePlate}
                  </span>
                </div>
              )}

              {node.details?.address && (
                <div className="flex items-start justify-between">
                  <span className="text-slate-500">Known Safehouse / Base:</span>
                  <span className="text-right text-slate-300 max-w-[240px]">{node.details.address}</span>
                </div>
              )}

              {node.details?.notes && (
                <div className="pt-2 border-t border-slate-800/80">
                  <span className="text-slate-500 block mb-1">Intelligence Remarks:</span>
                  <p className="text-[11px] text-slate-400 leading-relaxed">{node.details.notes}</p>
                </div>
              )}
            </div>
          </div>

          {/* 1-Hop Connected Entities */}
          <div>
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2.5 flex items-center justify-between">
              <span>Direct Link Connections ({neighbors.length}):</span>
            </h3>

            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {neighbors.map(({ node: otherNode, link }, idx) => {
                if (!otherNode) return null;
                return (
                  <div
                    key={idx}
                    onClick={() => onSelectNeighbor(otherNode)}
                    className="p-2.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-lg flex items-center justify-between cursor-pointer transition-colors group"
                  >
                    <div>
                      <span className="text-xs font-semibold text-slate-200 group-hover:text-amber-400">
                        {otherNode.label}
                      </span>
                      <span className="text-[10px] text-slate-500 block">
                        {link.details || link.relationType}
                      </span>
                    </div>
                    <div className="text-right">
                      {link.amount && (
                        <span className="text-[11px] font-mono font-bold text-emerald-400 block">
                          ₹{(link.amount / 100000).toFixed(1)}L
                        </span>
                      )}
                      {link.frequency && (
                        <span className="text-[10px] font-mono text-slate-400 block">
                          {link.frequency} interactions
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Drawer Bottom Actions */}
      <div className="p-5 border-t border-slate-800 bg-slate-950/80 flex items-center gap-3">
        <button
          onClick={() => onInitiatePathFind(node.id)}
          className="w-full bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2 shadow"
        >
          <Share2 className="w-4 h-4" />
          <span>Trace Path to Another Suspect</span>
        </button>
      </div>
      </div>
    </>
  );
};
