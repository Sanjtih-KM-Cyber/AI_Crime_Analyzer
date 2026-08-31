import React, { useState } from "react";
import {
  CrimeNetworkNode,
  CrimeNetworkLink,
  CDRRecord,
  FinancialRecord,
  FIRRecord,
  IntelRecord,
} from "../types";
import {
  extractEntitiesRuleBased,
  extractEntitiesWithGemini,
  parseCDRCSV,
  parseFinancialCSV,
} from "../services/nlpExtractor";
import {
  FileText,
  PhoneCall,
  Landmark,
  PlusCircle,
  Sparkles,
  Zap,
  CheckCircle2,
  AlertCircle,
  Database,
  Upload,
  Layers,
  ArrowRight,
} from "lucide-react";

interface DataIngestionHubProps {
  onIngestExtractedData: (
    nodes: CrimeNetworkNode[],
    links: CrimeNetworkLink[],
    cdrs?: CDRRecord[],
    financials?: FinancialRecord[]
  ) => void;
  onSwitchToGraph: () => void;
}

export const DataIngestionHub: React.FC<DataIngestionHubProps> = ({
  onIngestExtractedData,
  onSwitchToGraph,
}) => {
  const [activeTab, setActiveTab] = useState<"fir" | "cdr" | "financial" | "manual">("fir");

  // FIR Text State
  const [firText, setFirText] = useState<string>(
    `SPECIAL INTELLIGENCE INTERCEPT REPORT - CRIME BRANCH
Case Ref: FIR No. 209/2026 under IPC 302, 120B and NDPS Act Sec 21.

On 14th August 2026, intelligence sources confirmed that prime accused Farooq 'Chacha' Merchant (Contact: +919820011442, Handset IMEI: 864219038472911) held secret communications with wanted kingpin Vikramaditya Singhania operating out of Dubai (+971508821990).
Financial transactions indicate ₹48,00,000 was wired to Hawala banker Rameshwar 'Munshi' Joshi (VPA: munshi.trade@oksbi).
Subsequently, logistics coordinator Karan 'Rider' Saluja deployed container truck MH-04-AZ-8890 escorted by Toyota Fortuner GA-03-K-4411 driven by armed enforcer Shankar 'Chhota' Gaikwad towards the Anjuna Beach safehouse in Goa.`
  );

  const [isExtracting, setIsExtracting] = useState(false);
  const [extractionSummary, setExtractionSummary] = useState<string | null>(null);
  const [extractedNodes, setExtractedNodes] = useState<CrimeNetworkNode[]>([]);
  const [extractedLinks, setExtractedLinks] = useState<CrimeNetworkLink[]>([]);
  const [detectedSignals, setDetectedSignals] = useState<string[]>([]);

  // CDR CSV State
  const [cdrCSV, setCdrCSV] = useState<string>(
    `A_Party,B_Party,IMEI_A,IMEI_B,Timestamp,Duration_Sec,Call_Type,Tower_ID,Tower_Location,Lat,Lng
+919820011442,+971508821990,864219038472911,359871098234123,2026-08-14T23:10:00Z,340,VOICE_CALL,TOW-DONGRI-01,Dongri South Mumbai,18.9614,72.8373
+919820011442,+919811099881,864219038472911,354110982371900,2026-08-15T00:15:30Z,180,VOICE_CALL,TOW-VASHI-02,Navi Mumbai Vashi,19.033,73.0297
+919820099011,+919890123456,864219038472911,358992019283711,2026-08-15T01:10:05Z,95,VOICE_CALL,TOW-JNPT-01,Nhava Sheva Port,18.953,72.956
+919820099022,+919765432100,864219038472911,357712093847111,2026-08-15T02:05:40Z,210,VOICE_CALL,TOW-CALANGUTE-01,Calangute Goa,15.543,73.7554`
  );

  // Financial CSV State
  const [finCSV, setFinCSV] = useState<string>(
    `Sender_Acc,Sender_Name,Receiver_Acc,Receiver_Name,Amount,Timestamp,Mode,UTR,Bank,Smurfing_Flag
50200049281923,Apex Agro Exports,30918274619,Mahesh Rathod (Mule),980000,2026-08-14T11:20:00Z,RTGS,HDFC99281,HDFC Bank,true
30918274619,Mahesh Rathod,munshi.trade@oksbi,Rameshwar Joshi,950000,2026-08-14T13:45:00Z,UPI,SBIN18274,SBI UPI,true
munshi.trade@oksbi,Rameshwar Joshi,49201928371,Goa Safehouse Logistics,450000,2026-08-14T15:10:00Z,IMPS,SBIN49201,SBI,true`
  );

  // Manual Form State
  const [manualLabel, setManualLabel] = useState("");
  const [manualType, setManualType] = useState<any>("PERSON");
  const [manualRole, setManualRole] = useState("");
  const [manualPhone, setManualPhone] = useState("");
  const [manualRisk, setManualRisk] = useState(70);

  // Handlers for FIR Extraction
  const handleExtractWithAI = async () => {
    if (!firText.trim()) return;
    setIsExtracting(true);
    try {
      const res = await extractEntitiesWithGemini(firText, "FIR Police Report");
      setExtractedNodes(res.nodes);
      setExtractedLinks(res.links);
      setExtractionSummary(res.summary);
      setDetectedSignals(res.suspiciousSignals);
    } catch (e) {
      console.error(e);
    } finally {
      setIsExtracting(false);
    }
  };

  const handleExtractRuleBased = () => {
    if (!firText.trim()) return;
    const res = extractEntitiesRuleBased(firText);
    setExtractedNodes(res.nodes);
    setExtractedLinks(res.links);
    setExtractionSummary(res.summary);
    setDetectedSignals(res.suspiciousSignals);
  };

  const handleCommitExtraction = () => {
    onIngestExtractedData(extractedNodes, extractedLinks);
    onSwitchToGraph();
  };

  const handleCommitCDR = () => {
    const cdrs = parseCDRCSV(cdrCSV);
    const newNodes: CrimeNetworkNode[] = [];
    const newLinks: CrimeNetworkLink[] = [];

    cdrs.forEach((c) => {
      newNodes.push({
        id: `phone-${c.aParty.replace(/[^0-9]/g, "").slice(-10)}`,
        label: c.aParty,
        type: "PHONE",
        role: "Caller Line",
        riskScore: 70,
        confidence: 0.95,
        details: { phone: c.aParty, imei: c.imeiA, geo: { lat: c.lat, lng: c.lng, name: c.towerLocation } },
      });
      newNodes.push({
        id: `phone-${c.bParty.replace(/[^0-9]/g, "").slice(-10)}`,
        label: c.bParty,
        type: "PHONE",
        role: "Recipient Line",
        riskScore: 70,
        confidence: 0.95,
        details: { phone: c.bParty, imei: c.imeiB },
      });
      newLinks.push({
        id: `link-cdr-${c.id}`,
        source: `phone-${c.aParty.replace(/[^0-9]/g, "").slice(-10)}`,
        target: `phone-${c.bParty.replace(/[^0-9]/g, "").slice(-10)}`,
        relationType: "CALLS",
        weight: 2,
        durationSec: c.durationSec,
        timestamp: c.timestamp,
        details: `CDR Call Duration: ${c.durationSec}s at tower ${c.towerLocation}`,
        flags: c.imeiA === "864219038472911" ? ["SHARED_IMEI"] : undefined,
      });
    });

    onIngestExtractedData(newNodes, newLinks, cdrs);
    onSwitchToGraph();
  };

  const handleCommitFinancials = () => {
    const fins = parseFinancialCSV(finCSV);
    const newNodes: CrimeNetworkNode[] = [];
    const newLinks: CrimeNetworkLink[] = [];

    fins.forEach((f) => {
      newNodes.push({
        id: `acc-${f.senderAcc.slice(-6)}`,
        label: `${f.senderName} (${f.senderAcc.slice(-4)})`,
        type: "FINANCIAL",
        role: "Remitter Account",
        riskScore: 75,
        confidence: 0.9,
        details: { accountNumber: f.senderAcc, bankName: f.bankName },
      });
      newNodes.push({
        id: `acc-${f.receiverAcc.slice(-6)}`,
        label: `${f.receiverName} (${f.receiverAcc.slice(-4)})`,
        type: "FINANCIAL",
        role: "Beneficiary Account",
        riskScore: 80,
        confidence: 0.9,
        details: { accountNumber: f.receiverAcc },
      });
      newLinks.push({
        id: `link-fin-${f.id}`,
        source: `acc-${f.senderAcc.slice(-6)}`,
        target: `acc-${f.receiverAcc.slice(-6)}`,
        relationType: "FUNDS_TRANSFER",
        weight: 3,
        amount: f.amount,
        timestamp: f.timestamp,
        details: `₹${(f.amount / 100000).toFixed(2)}L transfer via ${f.mode} [UTR: ${f.utrNumber}]`,
        flags: f.isSmurfingFlag ? ["SMURFING_CHAIN", "SUSPICIOUS_HAWALA"] : undefined,
      });
    });

    onIngestExtractedData(newNodes, newLinks, undefined, fins);
    onSwitchToGraph();
  };

  const handleCreateManualNode = () => {
    if (!manualLabel.trim()) return;
    const newNode: CrimeNetworkNode = {
      id: `manual-${Date.now()}`,
      label: manualLabel,
      type: manualType,
      role: manualRole || "Field Lead",
      riskScore: manualRisk,
      confidence: 1.0,
      details: {
        phone: manualPhone,
        notes: "Manually registered by field investigator",
      },
    };
    onIngestExtractedData([newNode], []);
    setManualLabel("");
    setManualRole("");
    setManualPhone("");
    onSwitchToGraph();
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-amber-500/10 rounded-xl text-amber-400 border border-amber-500/20">
            <Database className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-100">
              Multi-Source Intelligence Ingestion Hub
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Ingest unstructured FIR narratives, CDR spreadsheets, banking ledgers, and field intelligence into the dynamic Knowledge Graph.
            </p>
          </div>
        </div>
      </div>

      {/* Tabs Bar */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab("fir")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-colors ${
            activeTab === "fir"
              ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
              : "text-slate-400 hover:text-slate-200 bg-slate-900"
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>FIR & Intelligence Text (NLP)</span>
        </button>

        <button
          onClick={() => setActiveTab("cdr")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-colors ${
            activeTab === "cdr"
              ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
              : "text-slate-400 hover:text-slate-200 bg-slate-900"
          }`}
        >
          <PhoneCall className="w-4 h-4" />
          <span>Call Detail Records (CDR Logs)</span>
        </button>

        <button
          onClick={() => setActiveTab("financial")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-colors ${
            activeTab === "financial"
              ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
              : "text-slate-400 hover:text-slate-200 bg-slate-900"
          }`}
        >
          <Landmark className="w-4 h-4" />
          <span>Banking & Hawala Transactions</span>
        </button>

        <button
          onClick={() => setActiveTab("manual")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-colors ${
            activeTab === "manual"
              ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
              : "text-slate-400 hover:text-slate-200 bg-slate-900"
          }`}
        >
          <PlusCircle className="w-4 h-4" />
          <span>Manual Field Entry</span>
        </button>
      </div>

      {/* Tab 1: FIR & Unstructured Text Ingestion */}
      {activeTab === "fir" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-300 flex items-center gap-2">
                <FileText className="w-4 h-4 text-amber-400" />
                Raw Police FIR / Case Diary Narrative:
              </span>
              <span className="text-[10px] text-slate-500 font-mono">
                Supports Indian Penal Code, NDPS, BNS, IMEIs & VPAs
              </span>
            </div>

            <textarea
              rows={9}
              value={firText}
              onChange={(e) => setFirText(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-xs text-slate-200 font-mono focus:ring-1 focus:ring-amber-500 focus:outline-none leading-relaxed"
              placeholder="Paste raw police FIR narrative or surveillance statement..."
            />

            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={handleExtractWithAI}
                disabled={isExtracting}
                className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold text-xs px-4 py-2.5 rounded-lg transition-colors flex items-center gap-2 shadow"
              >
                <Sparkles className="w-4 h-4 text-indigo-200" />
                <span>{isExtracting ? "Analyzing with Gemini AI..." : "Extract with Gemini AI"}</span>
              </button>

              <button
                onClick={handleExtractRuleBased}
                disabled={isExtracting}
                className="bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs px-4 py-2.5 rounded-lg transition-colors flex items-center gap-2 border border-slate-700"
              >
                <Zap className="w-4 h-4 text-amber-400" />
                <span>Instant Rule-Based NER Extractor</span>
              </button>
            </div>
          </div>

          {/* Extraction Preview & Merge Box */}
          <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg flex flex-col justify-between">
            <div>
              <h3 className="text-xs font-bold text-slate-200 mb-2 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                Extracted Graph Entities & Links Preview
              </h3>

              {extractionSummary ? (
                <div className="space-y-3">
                  <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-300">
                    <strong className="text-amber-400 block mb-1">Synopsis:</strong>
                    {extractionSummary}
                  </div>

                  <div>
                    <span className="text-[11px] font-semibold text-slate-400 block mb-1">
                      Discovered Entities ({extractedNodes.length}):
                    </span>
                    <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto">
                      {extractedNodes.map((n) => (
                        <span
                          key={n.id}
                          className="px-2 py-0.5 bg-slate-950 border border-slate-800 rounded text-[10px] font-mono text-slate-300"
                        >
                          {n.label} <strong className="text-amber-400">[{n.type}]</strong>
                        </span>
                      ))}
                    </div>
                  </div>

                  {detectedSignals.length > 0 && (
                    <div className="p-2.5 bg-rose-500/10 border border-rose-500/30 rounded-lg text-[11px] text-rose-300 space-y-1">
                      <strong className="block font-bold">Suspicious Identifiers:</strong>
                      {detectedSignals.map((s, idx) => (
                        <div key={idx}>• {s}</div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-6 text-center text-slate-500 text-xs flex flex-col items-center justify-center h-48 border border-dashed border-slate-800 rounded-lg">
                  <Upload className="w-6 h-6 text-slate-600 mb-2" />
                  <p>Click "Extract with Gemini AI" or "Instant Rule-Based" to parse the narrative above.</p>
                </div>
              )}
            </div>

            {extractedNodes.length > 0 && (
              <button
                onClick={handleCommitExtraction}
                className="mt-4 w-full bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2 shadow"
              >
                <span>Commit & Inject to Active Graph ({extractedNodes.length} Nodes)</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Tab 2: CDR Logs */}
      {activeTab === "cdr" && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-200 flex items-center gap-2">
              <PhoneCall className="w-4 h-4 text-sky-400" />
              Call Detail Records (CDR) CSV Ingestion Matrix:
            </span>
            <span className="text-[10px] text-slate-500 font-mono">
              Columns: A_Party, B_Party, IMEI_A, IMEI_B, Timestamp, Duration, Call_Type, Tower_ID, Location, Lat, Lng
            </span>
          </div>

          <textarea
            rows={8}
            value={cdrCSV}
            onChange={(e) => setCdrCSV(e.target.value)}
            className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-xs text-slate-200 font-mono focus:ring-1 focus:ring-amber-500 focus:outline-none"
          />

          <button
            onClick={handleCommitCDR}
            className="bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs px-5 py-2.5 rounded-lg transition-colors flex items-center gap-2 shadow"
          >
            <span>Parse & Ingest CDR Network</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Tab 3: Financial & Hawala Ledger */}
      {activeTab === "financial" && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-200 flex items-center gap-2">
              <Landmark className="w-4 h-4 text-emerald-400" />
              Banking, UPI & Hawala Ledger CSV Ingestion:
            </span>
            <span className="text-[10px] text-slate-500 font-mono">
              Columns: Sender_Acc, Sender_Name, Receiver_Acc, Receiver_Name, Amount, Timestamp, Mode, UTR, Bank, Smurfing_Flag
            </span>
          </div>

          <textarea
            rows={8}
            value={finCSV}
            onChange={(e) => setFinCSV(e.target.value)}
            className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-xs text-slate-200 font-mono focus:ring-1 focus:ring-amber-500 focus:outline-none"
          />

          <button
            onClick={handleCommitFinancials}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-5 py-2.5 rounded-lg transition-colors flex items-center gap-2 shadow"
          >
            <span>Parse & Ingest Hawala Flow Graph</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Tab 4: Manual Field Entry */}
      {activeTab === "manual" && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg max-w-2xl space-y-4">
          <h3 className="text-xs font-bold text-slate-200 flex items-center gap-2">
            <PlusCircle className="w-4 h-4 text-amber-400" />
            Field Operative Manual Entity Registration
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1">Entity Name / Identifier:</label>
              <input
                type="text"
                placeholder="e.g. Ramesh 'Kabadi' Patel"
                value={manualLabel}
                onChange={(e) => setManualLabel(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 text-slate-200 text-xs rounded-lg p-2.5 focus:ring-1 focus:ring-amber-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1">Entity Type:</label>
              <select
                value={manualType}
                onChange={(e) => setManualType(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 text-slate-200 text-xs rounded-lg p-2.5 focus:ring-1 focus:ring-amber-500 focus:outline-none"
              >
                <option value="PERSON">PERSON (Suspect / Associate)</option>
                <option value="PHONE">PHONE / SIM CARD</option>
                <option value="FINANCIAL">FINANCIAL (Bank / UPI / Hawala)</option>
                <option value="LOCATION">LOCATION (Safehouse / Port)</option>
                <option value="VEHICLE">VEHICLE (Getaway / Container)</option>
                <option value="INCIDENT">INCIDENT (FIR / Incident)</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1">Role / Function:</label>
              <input
                type="text"
                placeholder="e.g. Hawala Courier / Armorer"
                value={manualRole}
                onChange={(e) => setManualRole(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 text-slate-200 text-xs rounded-lg p-2.5 focus:ring-1 focus:ring-amber-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1">Phone / MSISDN:</label>
              <input
                type="text"
                placeholder="+91 98XXXXXXXX"
                value={manualPhone}
                onChange={(e) => setManualPhone(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 text-slate-200 text-xs rounded-lg p-2.5 focus:ring-1 focus:ring-amber-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-400 mb-1">
              Investigative Risk Score ({manualRisk}/100):
            </label>
            <input
              type="range"
              min="0"
              max="100"
              value={manualRisk}
              onChange={(e) => setManualRisk(parseInt(e.target.value, 10))}
              className="w-full accent-amber-500"
            />
          </div>

          <button
            onClick={handleCreateManualNode}
            disabled={!manualLabel.trim()}
            className="bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-slate-950 font-bold text-xs px-5 py-2.5 rounded-lg transition-colors flex items-center gap-2 shadow"
          >
            <span>Register & Add to Case Graph</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};
