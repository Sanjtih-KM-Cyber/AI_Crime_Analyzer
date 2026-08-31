import React, { useState } from "react";
import {
  FolderPlus,
  X,
  ShieldAlert,
  Building,
  Calendar,
  FileText,
  Users,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Layers,
  ArrowRight,
  Plus,
  Trash2,
  Upload,
} from "lucide-react";
import { CaseDataset, CrimeNetworkNode, CrimeNetworkLink, EntityType } from "../types";

interface CreateCaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateCase: (newCase: CaseDataset, initialNodes: CrimeNetworkNode[], initialLinks: CrimeNetworkLink[]) => void;
}

interface TemplatePreset {
  id: string;
  title: string;
  tagline: string;
  agency: string;
  classification: string;
  nodes: CrimeNetworkNode[];
  links: CrimeNetworkLink[];
}

const TEMPLATE_PRESETS: TemplatePreset[] = [
  {
    id: "blank",
    title: "Blank Investigation",
    tagline: "Start fresh and build intelligence via manual entry or NLP ingestion",
    agency: "State Police Special Task Force",
    classification: "Organized Crime Syndicate",
    nodes: [],
    links: [],
  },
  {
    id: "interstate-gang",
    title: "Inter-State Extortion & Arms Gang",
    tagline: "Pre-seeded with kingpin, shooter cell, courier network, and safehouses",
    agency: "Anti-Extortion Cell (AEC)",
    classification: "Extortion & Illegal Firearms",
    nodes: [
      {
        id: "p-chhatarpal",
        label: "Chhatarpal 'Don' Gurjar",
        type: "PERSON",
        role: "Gang Leader & Extortion Handler",
        aliases: ["CP", "Gurjar Bhai"],
        riskScore: 94,
        confidence: 0.95,
        details: {
          phone: "+919811099881",
          status: "WANTED",
          notes: "Directs extortion calls to real estate developers.",
        },
      },
      {
        id: "p-subhash-shooter",
        label: "Subhash 'Katta' Yadav",
        type: "PERSON",
        role: "Chief Shooter & Enforcer",
        riskScore: 88,
        confidence: 0.92,
        details: {
          phone: "+919811022334",
          status: "ACTIVE",
          notes: "Procures illegal desi kattas and executes warning fires.",
        },
      },
      {
        id: "loc-safehouse-meerut",
        label: "Meerut Highway Godown",
        type: "LOCATION",
        role: "Weapons Cache & Hideout",
        riskScore: 78,
        confidence: 0.9,
        details: {
          address: "NH-58 Bypass, Meerut, UP",
        },
      },
      {
        id: "fin-shell-extort",
        label: "Gurjar Real Estate VPA",
        type: "FINANCIAL",
        role: "Protection Money Collection",
        riskScore: 85,
        confidence: 0.88,
        details: {
          accountNumber: "gurjarestate@okhdfcbank",
        },
      },
    ],
    links: [
      {
        id: "link-cp-1",
        source: "p-chhatarpal",
        target: "p-subhash-shooter",
        relationType: "ASSOCIATED_WITH",
        weight: 9,
        details: "Direct command instructions for firing incident",
      },
      {
        id: "link-cp-2",
        source: "p-subhash-shooter",
        target: "loc-safehouse-meerut",
        relationType: "LOCATED_AT",
        weight: 7,
        details: "Frequent night arrivals",
      },
      {
        id: "link-cp-3",
        source: "p-chhatarpal",
        target: "fin-shell-extort",
        relationType: "OWNS",
        weight: 9,
        details: "Controlled extortion proceeds account",
      },
    ],
  },
  {
    id: "crypto-ponzi",
    title: "Darknet Crypto & Investment Scam",
    tagline: "Pre-seeded with fraudulent Telegram bots, mule banks, and USDT wash trades",
    agency: "Cyber Crime Cell & Enforcement Directorate",
    classification: "Financial Cyber Fraud / PMLA",
    nodes: [
      {
        id: "p-cyber-boss",
        label: "Mastermind 'Cipher-X'",
        type: "PERSON",
        role: "Darknet Operator & Crypto Launderer",
        aliases: ["Cipher-X", "ShadowAdmin"],
        riskScore: 96,
        confidence: 0.94,
        details: {
          status: "WANTED",
          notes: "Manages offshore liquidity pools and Telegram task fraud groups.",
        },
      },
      {
        id: "fin-usdt-wallet",
        label: "TRC20 Wallet: T9x...8F2Q",
        type: "FINANCIAL",
        role: "Primary Tumbler Wallet",
        riskScore: 91,
        confidence: 0.95,
        details: {
          accountNumber: "T9xK72mNpQRt98F2QLa1009",
        },
      },
      {
        id: "p-mule-agent",
        label: "Rohan V. (Mule Account Aggregator)",
        type: "PERSON",
        role: "Mule Account Vendor",
        riskScore: 82,
        confidence: 0.9,
        details: {
          phone: "+919711883321",
          status: "ACTIVE",
        },
      },
    ],
    links: [
      {
        id: "link-crypto-1",
        source: "p-cyber-boss",
        target: "fin-usdt-wallet",
        relationType: "OWNS",
        weight: 9,
        details: "Transfers victim funds directly to TRC-20 wallet",
      },
      {
        id: "link-crypto-2",
        source: "p-mule-agent",
        target: "fin-usdt-wallet",
        relationType: "FUNDS_TRANSFER",
        weight: 8,
        amount: 4500000,
        details: "Layered fiat-to-crypto deposits",
      },
    ],
  },
];

export const CreateCaseModal: React.FC<CreateCaseModalProps> = ({
  isOpen,
  onClose,
  onCreateCase,
}) => {
  const [selectedTemplate, setSelectedTemplate] = useState<string>("blank");
  const [name, setName] = useState("");
  const [codeName, setCodeName] = useState("");
  const [description, setDescription] = useState("");
  const [leadAgency, setLeadAgency] = useState("National Crime Intelligence Directorate");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);

  // Initial suspect cards
  const [initialSuspects, setInitialSuspects] = useState<
    Array<{ name: string; role: string; phone: string; risk: number }>
  >([{ name: "", role: "Primary Target", phone: "", risk: 80 }]);

  if (!isOpen) return null;

  const handleTemplateChange = (templateId: string) => {
    setSelectedTemplate(templateId);
    const tmpl = TEMPLATE_PRESETS.find((t) => t.id === templateId);
    if (tmpl) {
      if (templateId === "interstate-gang") {
        setName("Inter-State Extortion & Arms Syndicate");
        setCodeName("OP-VAJRA-SHIELD");
        setDescription(
          "Targeting cross-border arms trafficking, protection rackets, and shooter networks spanning Delhi-NCR and Western UP."
        );
        setLeadAgency("Anti-Extortion Cell (Special Cell)");
      } else if (templateId === "crypto-ponzi") {
        setName("Cross-Border Cyber & USDT Laundering Web");
        setCodeName("OP-CIPHER-WASH");
        setDescription(
          "Unraveling darknet Ponzi syndicates routing illicit retail investor funds through mule UPI accounts and overseas TRC-20 crypto tumblers."
        );
        setLeadAgency("Cyber Crime Task Force & ED");
      } else {
        setName("");
        setCodeName("");
        setDescription("");
        setLeadAgency("Special Operations Group (SOG)");
      }
    }
  };

  const handleAddSuspectField = () => {
    setInitialSuspects((prev) => [
      ...prev,
      { name: "", role: "Key Associate", phone: "", risk: 65 },
    ]);
  };

  const handleRemoveSuspectField = (index: number) => {
    setInitialSuspects((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSuspectChange = (
    index: number,
    field: "name" | "role" | "phone" | "risk",
    value: string | number
  ) => {
    setInitialSuspects((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const tmpl = TEMPLATE_PRESETS.find((t) => t.id === selectedTemplate);
    const initialNodes: CrimeNetworkNode[] = tmpl?.nodes ? [...tmpl.nodes] : [];
    const initialLinks: CrimeNetworkLink[] = tmpl?.links ? [...tmpl.links] : [];

    // Add any manually entered suspects
    initialSuspects.forEach((suspect, idx) => {
      if (suspect.name.trim()) {
        const id = `suspect-custom-${Date.now()}-${idx}`;
        initialNodes.push({
          id,
          label: suspect.name.trim(),
          type: "PERSON",
          role: suspect.role || "Suspect",
          riskScore: suspect.risk || 70,
          confidence: 0.85,
          details: {
            phone: suspect.phone.trim() || undefined,
            status: "ACTIVE",
            firstSeen: date,
          },
        });
      }
    });

    const generatedCode =
      codeName.trim().toUpperCase() ||
      `OP-INTEL-${Math.floor(1000 + Math.random() * 9000)}`;

    const newCaseId = `CASE-${generatedCode.replace(/[^A-Z0-9]/g, "-")}-2026`;

    const newCaseDataset: CaseDataset = {
      id: newCaseId,
      name: name.trim() || `Operation ${generatedCode}`,
      codeName: generatedCode,
      description:
        description.trim() ||
        "Multi-agency criminal network analysis and AI intelligence case.",
      date: date || new Date().toISOString().split("T")[0],
      leadAgency:
        leadAgency.trim() || "National Crime Intelligence Directorate",
      nodes: initialNodes,
      links: initialLinks,
      firs: [],
      cdrs: [],
      financials: [],
      intels: [],
    };

    onCreateCase(newCaseDataset, initialNodes, initialLinks);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-3xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Top Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 bg-slate-950/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-500/10 rounded-xl text-amber-400 border border-amber-500/20">
              <FolderPlus className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  NEW INVESTIGATION
                </span>
                <span className="text-[10px] font-mono text-slate-400">
                  CONFIDENTIAL // LEA
                </span>
              </div>
              <h2 className="text-sm sm:text-base font-bold text-slate-100 mt-0.5">
                Register New Tactical Intelligence Operation
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {/* Step 1: Investigation Template Selector */}
          <div className="space-y-3">
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider font-mono flex items-center gap-2">
              <span>1. Select Investigation Starter Template</span>
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {TEMPLATE_PRESETS.map((tmpl) => {
                const isSelected = selectedTemplate === tmpl.id;
                return (
                  <div
                    key={tmpl.id}
                    onClick={() => handleTemplateChange(tmpl.id)}
                    className={`p-3.5 rounded-xl border cursor-pointer transition-all flex flex-col justify-between ${
                      isSelected
                        ? "bg-amber-500/10 border-amber-500/60 shadow-md shadow-amber-500/10 ring-1 ring-amber-500/30"
                        : "bg-slate-950/60 border-slate-800 hover:border-slate-700 hover:bg-slate-900"
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span
                          className={`text-xs font-bold ${
                            isSelected ? "text-amber-300" : "text-slate-200"
                          }`}
                        >
                          {tmpl.title}
                        </span>
                        {isSelected && (
                          <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400 leading-relaxed">
                        {tmpl.tagline}
                      </p>
                    </div>

                    <div className="mt-3 pt-2 border-t border-slate-800/80 text-[10px] font-mono text-slate-400 flex items-center justify-between">
                      <span>{tmpl.nodes.length} Nodes</span>
                      <span className="text-amber-400/80">{tmpl.classification}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Step 2: Core Operation Metadata */}
          <div className="space-y-4 pt-2 border-t border-slate-800">
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider font-mono">
              2. Operation & Intelligence Metadata
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-slate-300 font-medium block mb-1.5">
                  Operation Code Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. OP-GARUDA-2026 or OP-VAJRA"
                  value={codeName}
                  onChange={(e) => setCodeName(e.target.value.toUpperCase())}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs font-mono font-bold text-amber-400 focus:outline-none focus:ring-1 focus:ring-amber-500 uppercase placeholder-slate-600"
                />
              </div>

              <div>
                <label className="text-xs text-slate-300 font-medium block mb-1.5">
                  Operation / Case Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Garuda Inter-State Arms & Hawala Web"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs font-semibold text-slate-100 focus:outline-none focus:ring-1 focus:ring-amber-500 placeholder-slate-600"
                />
              </div>

              <div>
                <label className="text-xs text-slate-300 font-medium block mb-1.5">
                  Lead Investigating Agency
                </label>
                <input
                  type="text"
                  placeholder="e.g. Special Task Force, NCB, ED, Cyber Cell"
                  value={leadAgency}
                  onChange={(e) => setLeadAgency(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-amber-500 placeholder-slate-600"
                />
              </div>

              <div>
                <label className="text-xs text-slate-300 font-medium block mb-1.5">
                  Initiation / FIR Date
                </label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-amber-500 font-mono"
                />
              </div>
            </div>

            <div>
              <label className="text-xs text-slate-300 font-medium block mb-1.5">
                Executive Intelligence Brief / FIR Context
              </label>
              <textarea
                rows={2}
                placeholder="Describe syndicate operational scope, modus operandi, jurisdictions, and intelligence objectives..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-amber-500 placeholder-slate-600 resize-none"
              />
            </div>
          </div>

          {/* Step 3: Initial Prime Suspects (Optional Quick Add) */}
          <div className="space-y-3 pt-2 border-t border-slate-800">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider font-mono">
                3. Seed Prime Suspects (Optional)
              </label>
              <button
                type="button"
                onClick={handleAddSuspectField}
                className="text-xs text-amber-400 hover:text-amber-300 font-semibold flex items-center gap-1 bg-amber-500/10 px-2 py-1 rounded-md border border-amber-500/20"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Suspect</span>
              </button>
            </div>

            <div className="space-y-2">
              {initialSuspects.map((suspect, idx) => (
                <div
                  key={idx}
                  className="p-3 bg-slate-950/80 border border-slate-800 rounded-xl grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-center"
                >
                  <div className="sm:col-span-4">
                    <input
                      type="text"
                      placeholder="Suspect Name / Alias"
                      value={suspect.name}
                      onChange={(e) =>
                        handleSuspectChange(idx, "name", e.target.value)
                      }
                      className="w-full bg-slate-900 border border-slate-700/80 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-amber-500 font-medium"
                    />
                  </div>

                  <div className="sm:col-span-3">
                    <input
                      type="text"
                      placeholder="Role (e.g. Courier, Handler)"
                      value={suspect.role}
                      onChange={(e) =>
                        handleSuspectChange(idx, "role", e.target.value)
                      }
                      className="w-full bg-slate-900 border border-slate-700/80 rounded-lg px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none focus:ring-1 focus:ring-amber-500"
                    />
                  </div>

                  <div className="sm:col-span-3">
                    <input
                      type="text"
                      placeholder="Phone (+91...)"
                      value={suspect.phone}
                      onChange={(e) =>
                        handleSuspectChange(idx, "phone", e.target.value)
                      }
                      className="w-full bg-slate-900 border border-slate-700/80 rounded-lg px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none focus:ring-1 focus:ring-amber-500 font-mono"
                    />
                  </div>

                  <div className="sm:col-span-2 flex items-center justify-end gap-2">
                    <div className="text-[10px] font-mono text-amber-400 bg-slate-900 px-2 py-1 rounded border border-slate-800">
                      Risk {suspect.risk}
                    </div>
                    {initialSuspects.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveSuspectField(idx)}
                        className="p-1 text-slate-400 hover:text-rose-400"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Modal Footer Actions */}
          <div className="pt-4 border-t border-slate-800 flex items-center justify-between gap-3">
            <div className="text-[11px] text-slate-400 font-mono hidden sm:block">
              Case state and graphs persist live across workspace sessions.
            </div>

            <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 text-xs font-bold rounded-xl transition-all shadow-lg shadow-amber-500/20 flex items-center gap-2"
              >
                <FolderPlus className="w-4 h-4" />
                <span>Initialize Case Operation</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
