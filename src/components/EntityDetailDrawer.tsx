import React, { useState } from "react";
import { CrimeNetworkNode, CrimeNetworkLink, ReviewState } from "../types";
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
  CheckCircle2,
  XCircle,
  HelpCircle,
  Quote,
  User,
  Send,
  GitMerge,
  ExternalLink,
} from "lucide-react";

interface EntityDetailDrawerProps {
  node: CrimeNetworkNode | null;
  allNodes: CrimeNetworkNode[];
  links: CrimeNetworkLink[];
  onClose: () => void;
  onSelectNeighbor: (node: CrimeNetworkNode) => void;
  onInitiatePathFind: (sourceNodeId: string) => void;
  onUpdateReviewState?: (nodeId: string, newState: ReviewState) => void;
  onAddNote?: (nodeId: string, noteText: string) => void;
  onSelectLink?: (link: CrimeNetworkLink) => void;
}

export const EntityDetailDrawer: React.FC<EntityDetailDrawerProps> = ({
  node,
  allNodes,
  links,
  onClose,
  onSelectNeighbor,
  onInitiatePathFind,
  onUpdateReviewState,
  onAddNote,
  onSelectLink,
}) => {
  const [newNoteText, setNewNoteText] = useState("");

  if (!node) return null;

  const currentReview = node.reviewState || "NEEDS_REVIEW";

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

  const handleAddNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNoteText.trim() || !onAddNote) return;
    onAddNote(node.id, newNoteText.trim());
    setNewNoteText("");
  };

  const getReviewBadge = (state: ReviewState) => {
    switch (state) {
      case "CONFIRMED":
        return {
          label: "CONFIRMED EVIDENCE",
          color: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40",
          icon: CheckCircle2,
        };
      case "REJECTED":
        return {
          label: "REJECTED LEAD",
          color: "bg-rose-500/20 text-rose-300 border-rose-500/40",
          icon: XCircle,
        };
      case "UNCERTAIN":
        return {
          label: "UNCERTAIN / PENDING",
          color: "bg-purple-500/20 text-purple-300 border-purple-500/40",
          icon: HelpCircle,
        };
      case "NEEDS_REVIEW":
      default:
        return {
          label: "REVIEW REQUIRED",
          color: "bg-amber-500/20 text-amber-300 border-amber-500/40",
          icon: AlertTriangle,
        };
    }
  };

  const badgeInfo = getReviewBadge(currentReview);
  const BadgeIcon = badgeInfo.icon;

  return (
    <>
      <div
        className="fixed inset-0 bg-slate-950/75 backdrop-blur-sm z-40 transition-opacity"
        onClick={onClose}
      />
      <div className="fixed inset-y-0 right-0 z-50 w-full sm:w-[500px] bg-slate-900/98 backdrop-blur-xl border-l border-slate-800 shadow-2xl flex flex-col justify-between overflow-y-auto animate-in slide-in-from-right duration-300">
        {/* Drawer Header */}
        <div>
          <div className="p-4 sm:p-5 border-b border-slate-800 flex items-start justify-between bg-slate-950/80">
            <div className="flex items-start gap-3">
              <div className="p-2.5 bg-slate-900 rounded-xl border border-slate-800 text-amber-400 mt-0.5">
                {node.isKingpinCandidate ? (
                  <Crown className="w-6 h-6 text-amber-400" />
                ) : (
                  <ShieldAlert className="w-6 h-6 text-slate-300" />
                )}
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-1.5 mb-1">
                  <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-semibold">
                    {node.type}
                  </span>
                  <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border flex items-center gap-1 ${badgeInfo.color}`}>
                    <BadgeIcon className="w-3 h-3" />
                    <span>{badgeInfo.label}</span>
                  </span>
                  {node.category === "INVESTIGATOR_KNOWLEDGE" && (
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">
                      INVESTIGATOR HYPOTHESIS
                    </span>
                  )}
                  {node.isKingpinCandidate && (
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      KINGPIN CANDIDATE
                    </span>
                  )}
                </div>
                <h2 className="text-base font-bold text-slate-100">{node.label}</h2>
                <p className="text-xs text-slate-400">{node.role || "Unclassified Network Entity"}</p>
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
          <div className="p-4 sm:p-5 space-y-5 text-xs">
            {/* Review Decision Controller */}
            {onUpdateReviewState && (
              <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
                <div className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">
                  Investigator Review Decision
                </div>
                <div className="grid grid-cols-4 gap-1.5">
                  <button
                    onClick={() => onUpdateReviewState(node.id, "CONFIRMED")}
                    className={`py-1.5 px-2 rounded-lg text-[10px] font-bold transition-all flex flex-col items-center justify-center gap-1 border ${
                      currentReview === "CONFIRMED"
                        ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/60 ring-1 ring-emerald-500/30"
                        : "bg-slate-900 border-slate-800 text-slate-400 hover:text-emerald-300"
                    }`}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Confirm</span>
                  </button>

                  <button
                    onClick={() => onUpdateReviewState(node.id, "NEEDS_REVIEW")}
                    className={`py-1.5 px-2 rounded-lg text-[10px] font-bold transition-all flex flex-col items-center justify-center gap-1 border ${
                      currentReview === "NEEDS_REVIEW"
                        ? "bg-amber-500/20 text-amber-300 border-amber-500/60 ring-1 ring-amber-500/30"
                        : "bg-slate-900 border-slate-800 text-slate-400 hover:text-amber-300"
                    }`}
                  >
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>Review</span>
                  </button>

                  <button
                    onClick={() => onUpdateReviewState(node.id, "UNCERTAIN")}
                    className={`py-1.5 px-2 rounded-lg text-[10px] font-bold transition-all flex flex-col items-center justify-center gap-1 border ${
                      currentReview === "UNCERTAIN"
                        ? "bg-purple-500/20 text-purple-300 border-purple-500/60 ring-1 ring-purple-500/30"
                        : "bg-slate-900 border-slate-800 text-slate-400 hover:text-purple-300"
                    }`}
                  >
                    <HelpCircle className="w-3.5 h-3.5" />
                    <span>Uncertain</span>
                  </button>

                  <button
                    onClick={() => onUpdateReviewState(node.id, "REJECTED")}
                    className={`py-1.5 px-2 rounded-lg text-[10px] font-bold transition-all flex flex-col items-center justify-center gap-1 border ${
                      currentReview === "REJECTED"
                        ? "bg-rose-500/20 text-rose-300 border-rose-500/60 ring-1 ring-rose-500/30"
                        : "bg-slate-900 border-slate-800 text-slate-400 hover:text-rose-300"
                    }`}
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    <span>Reject</span>
                  </button>
                </div>
              </div>
            )}

            {/* Possible Duplicates / Resolution Alert */}
            {node.possibleDuplicates && node.possibleDuplicates.length > 0 && (
              <div className="p-3 bg-amber-500/10 border border-amber-500/40 rounded-xl space-y-2">
                <div className="flex items-center gap-1.5 text-amber-400 font-bold text-[11px]">
                  <GitMerge className="w-3.5 h-3.5" />
                  <span>Potential Same-Entity Duplicate Detected</span>
                </div>
                <div className="space-y-1.5">
                  {node.possibleDuplicates.map((dup, idx) => (
                    <div
                      key={idx}
                      className="p-2 bg-slate-900/90 border border-slate-800 rounded-lg flex items-center justify-between"
                    >
                      <div>
                        <div className="font-bold text-slate-200">{dup.candidateLabel}</div>
                        <div className="text-[10px] text-slate-400">{dup.matchReason}</div>
                      </div>
                      <span className="text-[10px] font-mono text-amber-300 bg-amber-500/20 px-2 py-0.5 rounded">
                        {Math.round(dup.similarityScore * 100)}% Match
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* SECTION A: VERIFIED EVIDENCE-DERIVED FACTS (Exact Document Snippets) */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Quote className="w-3.5 h-3.5" />
                  <span>Evidence-Derived Source Citations</span>
                </span>
                <span className="text-[10px] font-mono text-slate-400">
                  {node.sourceSnippets?.length || 1} Document Sources
                </span>
              </div>

              <div className="space-y-2">
                {node.sourceSnippets && node.sourceSnippets.length > 0 ? (
                  node.sourceSnippets.map((snippet, idx) => (
                    <div
                      key={idx}
                      className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-1.5"
                    >
                      <div className="flex items-center justify-between text-[10px]">
                        <span className="font-semibold text-slate-300 flex items-center gap-1 truncate">
                          <FileText className="w-3 h-3 text-amber-400 shrink-0" />
                          <span className="truncate">{snippet.docName}</span>
                        </span>
                        <span className="font-mono text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20 shrink-0">
                          {snippet.locator || `Page ${snippet.page || 1}`}
                        </span>
                      </div>
                      <blockquote className="pl-2.5 border-l-2 border-amber-500/50 text-slate-300 text-[11px] italic bg-amber-500/5 p-1.5 rounded-r">
                        "{snippet.snippet}"
                      </blockquote>
                    </div>
                  ))
                ) : (
                  <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-1.5">
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="font-semibold text-slate-300 flex items-center gap-1 truncate">
                        <FileText className="w-3 h-3 text-amber-400 shrink-0" />
                        <span>Case File Documentation</span>
                      </span>
                      <span className="font-mono text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">
                        Primary Record
                      </span>
                    </div>
                    <blockquote className="pl-2.5 border-l-2 border-amber-500/50 text-slate-300 text-[11px] italic bg-amber-500/5 p-1.5 rounded-r">
                      "{node.details?.notes || "Entity recorded in active investigative dossier."}"
                    </blockquote>
                  </div>
                )}
              </div>
            </div>

            {/* Risk Gauge & Metrics */}
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-3.5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-slate-400">Criminal Threat Risk:</span>
                <span className="font-mono text-xs font-bold text-amber-400">
                  {node.riskScore} / 100
                </span>
              </div>
              <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden border border-slate-800">
                <div
                  className={`h-full rounded-full ${
                    node.riskScore >= 85
                      ? "bg-rose-500"
                      : node.riskScore >= 70
                      ? "bg-amber-500"
                      : "bg-emerald-500"
                  }`}
                  style={{ width: `${node.riskScore}%` }}
                />
              </div>
            </div>

            {/* Graph Topology Matrix */}
            <div>
              <div className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-indigo-400" />
                <span>Graph Topology & Centrality</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2.5 bg-slate-950 border border-slate-800 rounded-lg">
                  <span className="text-[10px] text-slate-400 block">Betweenness</span>
                  <strong className="text-xs font-mono text-amber-400">{node.betweenness || "0.0000"}</strong>
                  <p className="text-[9px] text-slate-400 mt-0.5">Bridge bottleneck score</p>
                </div>

                <div className="p-2.5 bg-slate-950 border border-slate-800 rounded-lg">
                  <span className="text-[10px] text-slate-400 block">Connections</span>
                  <strong className="text-xs font-mono text-slate-200">{node.degree || neighbors.length} Links</strong>
                  <p className="text-[9px] text-slate-400 mt-0.5">Direct contact volume</p>
                </div>

                <div className="p-2.5 bg-slate-950 border border-slate-800 rounded-lg">
                  <span className="text-[10px] text-slate-400 block">PageRank</span>
                  <strong className="text-xs font-mono text-slate-200">{node.pageRank || "0.0000"}</strong>
                  <p className="text-[9px] text-slate-400 mt-0.5">Structural influence</p>
                </div>

                <div className="p-2.5 bg-slate-950 border border-slate-800 rounded-lg">
                  <span className="text-[10px] text-slate-400 block">Syndicate Faction</span>
                  <strong className="text-xs font-bold text-indigo-400 truncate block">
                    {node.communityName || "Cell #1"}
                  </strong>
                  <p className="text-[9px] text-slate-400 mt-0.5">Louvain cluster</p>
                </div>
              </div>
            </div>

            {/* Technical Identifiers */}
            <div>
              <div className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider mb-2">
                Technical Identifiers & Intelligence
              </div>
              <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-2 text-xs text-slate-300">
                {node.aliases && node.aliases.length > 0 && (
                  <div className="flex items-start justify-between">
                    <span className="text-slate-400">Aliases:</span>
                    <span className="font-semibold text-slate-200">{node.aliases.join(", ")}</span>
                  </div>
                )}

                {node.details?.phone && (
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Phone:</span>
                    <span className="font-mono font-semibold text-sky-400">{node.details.phone}</span>
                  </div>
                )}

                {node.details?.imei && (
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">IMEI:</span>
                    <span className="font-mono font-semibold text-sky-300">{node.details.imei}</span>
                  </div>
                )}

                {node.details?.accountNumber && (
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Account / VPA:</span>
                    <span className="font-mono font-semibold text-emerald-400">
                      {node.details.accountNumber}
                    </span>
                  </div>
                )}

                {node.details?.vehiclePlate && (
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Plate:</span>
                    <span className="font-mono font-semibold text-yellow-400">
                      {node.details.vehiclePlate}
                    </span>
                  </div>
                )}

                {node.details?.address && (
                  <div className="flex items-start justify-between">
                    <span className="text-slate-400">Base / Geo:</span>
                    <span className="text-right text-slate-300 max-w-[200px]">{node.details.address}</span>
                  </div>
                )}
              </div>
            </div>

            {/* SECTION B: INVESTIGATOR NOTES & WORKING HYPOTHESES (Non-Evidence) */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5" />
                  <span>Investigator Notes & Leads (Non-Evidence)</span>
                </span>
                <span className="text-[10px] font-mono text-slate-400">
                  {node.investigatorNotesList?.length || 0} Entries
                </span>
              </div>

              <div className="space-y-1.5">
                {node.investigatorNotesList && node.investigatorNotesList.length > 0 ? (
                  node.investigatorNotesList.map((note) => (
                    <div
                      key={note.id}
                      className="p-2.5 bg-slate-950 border border-slate-800 rounded-xl space-y-1"
                    >
                      <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
                        <span className="font-bold text-cyan-400">{note.author}</span>
                        <span>{new Date(note.timestamp).toLocaleTimeString()}</span>
                      </div>
                      <p className="text-slate-200 text-xs">{note.text}</p>
                    </div>
                  ))
                ) : (
                  <div className="p-2.5 bg-slate-950/60 border border-dashed border-slate-800 rounded-xl text-center text-slate-400 text-[11px]">
                    No officer hypotheses or informant leads logged yet.
                  </div>
                )}

                {onAddNote && (
                  <form onSubmit={handleAddNote} className="flex gap-2 pt-1">
                    <input
                      type="text"
                      placeholder="Add investigator note or working lead..."
                      value={newNoteText}
                      onChange={(e) => setNewNoteText(e.target.value)}
                      className="flex-1 bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-amber-500"
                    />
                    <button
                      type="submit"
                      disabled={!newNoteText.trim()}
                      className="p-2 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl disabled:opacity-40 transition-colors"
                    >
                      <Send className="w-3.5 h-3.5" />
                    </button>
                  </form>
                )}
              </div>
            </div>

            {/* 1-Hop Connected Entities */}
            <div>
              <div className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center justify-between">
                <span>Direct Link Connections ({neighbors.length})</span>
                <span className="text-[9px] text-slate-400 font-normal">Click edge to inspect evidence</span>
              </div>

              <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                {neighbors.map(({ node: otherNode, link }, idx) => {
                  if (!otherNode) return null;
                  return (
                    <div
                      key={idx}
                      className="p-2 bg-slate-950 hover:bg-slate-800/80 border border-slate-800 rounded-lg flex items-center justify-between cursor-pointer transition-colors group"
                    >
                      <div
                        onClick={() => onSelectNeighbor(otherNode)}
                        className="flex-1 truncate"
                      >
                        <span className="text-xs font-semibold text-slate-200 group-hover:text-amber-400 truncate block">
                          {otherNode.label}
                        </span>
                        <span className="text-[10px] text-slate-400 block">
                          {link.details || link.relationType}
                        </span>
                      </div>
                      {onSelectLink && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectLink(link);
                          }}
                          className="px-2 py-1 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 rounded text-[10px] font-mono border border-indigo-500/30 shrink-0 ml-2"
                        >
                          Evidence Trace
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Drawer Bottom Actions */}
        <div className="p-4 sm:p-5 border-t border-slate-800 bg-slate-950/90 flex items-center gap-3">
          <button
            onClick={() => onInitiatePathFind(node.id)}
            className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs py-2.5 rounded-xl transition-colors flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20"
          >
            <Share2 className="w-4 h-4" />
            <span>Trace Connection Path to Target Suspect</span>
          </button>
        </div>
      </div>
    </>
  );
};
