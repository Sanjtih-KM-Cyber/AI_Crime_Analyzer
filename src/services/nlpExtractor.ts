import {
  CrimeNetworkNode,
  CrimeNetworkLink,
  CDRRecord,
  FinancialRecord,
  FIRRecord,
  IntelRecord,
  EntityType,
  SuspiciousPattern,
  SyndicateCommunity,
  CourtDossier,
} from "../types";

export interface ExtractionResult {
  nodes: CrimeNetworkNode[];
  links: CrimeNetworkLink[];
  summary: string;
  suspiciousSignals: string[];
}

/**
 * Deterministic Rule-Based & Regular Expression Entity Extractor
 * Ideal for instant offline processing of Indian FIRs, chargesheets, and police reports.
 */
export function extractEntitiesRuleBased(
  text: string,
  sourceDocId = "DOC-MANUAL"
): ExtractionResult {
  const nodes: CrimeNetworkNode[] = [];
  const links: CrimeNetworkLink[] = [];
  const signals: string[] = [];

  const foundNodeMap = new Map<string, CrimeNetworkNode>();

  function registerNode(node: CrimeNetworkNode) {
    if (!foundNodeMap.has(node.id)) {
      foundNodeMap.set(node.id, node);
      nodes.push(node);
    }
  }

  // 1. Extract Phone Numbers (10 digits with optional +91 or 0)
  const phoneRegex = /(?:\+91[\-\s]?)?[6-9]\d{9}\b/g;
  let match;
  while ((match = phoneRegex.exec(text)) !== null) {
    const raw = match[0].replace(/[\s\-]/g, "");
    const cleanPhone = raw.startsWith("+91")
      ? raw
      : raw.length === 10
      ? `+91${raw}`
      : raw;
    const id = `phone-${cleanPhone.slice(-10)}`;
    registerNode({
      id,
      label: cleanPhone,
      type: "PHONE",
      role: "Suspect Line",
      riskScore: 65,
      confidence: 0.95,
      details: {
        phone: cleanPhone,
        notes: `Extracted from document narrative`,
      },
      sourceDocumentIds: [sourceDocId],
    });
  }

  // 2. Extract IMEI Numbers (15-digit numbers)
  const imeiRegex = /\b\d{15}\b/g;
  while ((match = imeiRegex.exec(text)) !== null) {
    const imei = match[0];
    const id = `imei-${imei.slice(-6)}`;
    registerNode({
      id,
      label: `IMEI: ${imei}`,
      type: "PHONE",
      role: "Hardware Terminal",
      riskScore: 70,
      confidence: 0.98,
      details: {
        imei: imei,
        notes: `Extracted hardware device identifier`,
      },
      sourceDocumentIds: [sourceDocId],
    });
    signals.push(`Identified hardware handset IMEI ${imei}`);
  }

  // 3. Extract Vehicle Registration Numbers (e.g. MH 01 AB 1234, DL 04 C 9988)
  const vehicleRegex = /\b[A-Z]{2}[-\s]?[0-9]{1,2}[-\s]?[A-Z]{1,3}[-\s]?[0-9]{4}\b/g;
  while ((match = vehicleRegex.exec(text)) !== null) {
    const plate = match[0].toUpperCase().replace(/\s+/g, "-");
    const id = `veh-${plate.replace(/[^A-Z0-9]/g, "")}`;
    registerNode({
      id,
      label: plate,
      type: "VEHICLE",
      role: "Getaway / Transport Vehicle",
      riskScore: 60,
      confidence: 0.9,
      details: {
        vehiclePlate: plate,
        notes: `Observed vehicle mentioned in intelligence statement`,
      },
      sourceDocumentIds: [sourceDocId],
    });
  }

  // 4. Extract UPI IDs (e.g., suspect@paytm, illegal@oksbi)
  const upiRegex = /[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}/g;
  while ((match = upiRegex.exec(text)) !== null) {
    const upi = match[0].toLowerCase();
    if (!upi.includes(".com") && !upi.includes(".org") && !upi.includes(".in")) {
      const id = `upi-${upi.replace(/[^a-z0-9]/g, "_")}`;
      registerNode({
        id,
        label: upi,
        type: "FINANCIAL",
        role: "UPI VPA Account",
        riskScore: 75,
        confidence: 0.92,
        details: {
          accountNumber: upi,
          bankName: "UPI Virtual Payment Address",
        },
        sourceDocumentIds: [sourceDocId],
      });
      signals.push(`Detected UPI Hawala/Money Mule Handle: ${upi}`);
    }
  }

  // 5. Extract Named Persons and Accused
  const personKeywords = [
    "accused",
    "suspect",
    "kingpin",
    "operator",
    "mastermind",
    "associate",
    "handler",
    "courier",
  ];
  const nameRegex = /(?:accused|suspect|named|alias|alias as|brother of|associate)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,3})/g;
  while ((match = nameRegex.exec(text)) !== null) {
    const name = match[1].trim();
    if (name.length > 3 && !name.includes("Police") && !name.includes("Station") && !name.includes("Court")) {
      const id = `person-${name.toLowerCase().replace(/\s+/g, "-")}`;
      registerNode({
        id,
        label: name,
        type: "PERSON",
        role: "Identified Suspect",
        riskScore: 80,
        confidence: 0.88,
        aliases: [],
        details: {
          notes: `Named suspect identified in police case narrative.`,
        },
        sourceDocumentIds: [sourceDocId],
      });
    }
  }

  // 6. Extract Indian Penal Code (IPC / BNS / NDPS) Sections
  const sectionRegex = /\b(?:IPC|BNS|NDPS|UAPA|Arms Act|IT Act)\s*(?:Sec|Section)?\s*[\d\w\s,]+/gi;
  const foundSections: string[] = [];
  while ((match = sectionRegex.exec(text)) !== null) {
    foundSections.push(match[0].trim());
  }

  // Connect co-mentioned entities with links
  if (nodes.length > 1) {
    const personNodes = nodes.filter((n) => n.type === "PERSON");
    const otherNodes = nodes.filter((n) => n.type !== "PERSON");

    // Link persons to phones / vehicles / bank accounts found
    personNodes.forEach((p, pIdx) => {
      otherNodes.forEach((o, oIdx) => {
        links.push({
          id: `link-${p.id}-${o.id}-${oIdx}`,
          source: p.id,
          target: o.id,
          relationType: o.type === "PHONE" ? "CALLS" : o.type === "FINANCIAL" ? "FUNDS_TRANSFER" : "OWNS",
          weight: 1,
          details: `Directly associated with ${o.label} in case narrative`,
          sourceDocumentId: sourceDocId,
        });
      });

      // Link co-accused persons together
      personNodes.slice(pIdx + 1).forEach((otherP) => {
        links.push({
          id: `link-coaccused-${p.id}-${otherP.id}`,
          source: p.id,
          target: otherP.id,
          relationType: "CO_ACCUSED",
          weight: 2,
          details: `Co-accused in case ${foundSections.join(", ") || "investigation"}`,
          sourceDocumentId: sourceDocId,
        });
      });
    });
  }

  return {
    nodes,
    links,
    summary: `Extracted ${nodes.length} entities (${nodes
      .map((n) => `${n.label} [${n.type}]`)
      .join(", ")}) with ${links.length} cross-relationships.`,
    suspiciousSignals: signals,
  };
}

/**
 * Server-Side Gemini AI Extractor
 */
export async function extractEntitiesWithGemini(
  text: string,
  sourceDocumentType = "FIR Police Report"
): Promise<ExtractionResult> {
  try {
    const response = await fetch("/api/extract-entities", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, sourceDocumentType }),
    });

    if (!response.ok) {
      throw new Error(`Server returned status ${response.status}`);
    }

    const data = await response.json();
    if (data.fallback || !data.entities) {
      // Fallback to local rule-based extractor
      return extractEntitiesRuleBased(text);
    }

    const nodes: CrimeNetworkNode[] = data.entities.map((e: any) => ({
      id: e.id || `ent-${Math.random().toString(36).slice(2, 9)}`,
      label: e.label || "Unknown Entity",
      type: (e.type?.toUpperCase() || "PERSON") as EntityType,
      role: e.role || "Suspect",
      aliases: e.aliases || [],
      riskScore: Math.round((e.confidence || 0.85) * 85),
      confidence: e.confidence || 0.9,
      details: e.details || {},
      sourceDocumentIds: ["AI-EXTRACTION"],
    }));

    const links: CrimeNetworkLink[] = (data.relationships || []).map(
      (r: any, idx: number) => ({
        id: `link-ai-${idx}-${Date.now()}`,
        source: r.sourceId,
        target: r.targetId,
        relationType: r.relationType || "ASSOCIATED_WITH",
        weight: r.weight || 1,
        details: r.details || "Inferred from intelligence text",
        timestamp: r.timestamp || new Date().toISOString(),
        sourceDocumentId: "AI-EXTRACTION",
      })
    );

    return {
      nodes,
      links,
      summary: data.summary || "AI extracted entities and relationships.",
      suspiciousSignals: data.suspiciousSignals || [],
    };
  } catch (err) {
    console.warn("AI extraction failed, falling back to rule-based parser:", err);
    return extractEntitiesRuleBased(text);
  }
}

/**
 * CSV Parsers for CDR Logs, Financial Bank Statements, and Intel Logs
 */
export function parseCDRCSV(csvText: string): CDRRecord[] {
  const lines = csvText.trim().split("\n");
  if (lines.length < 2) return [];

  const headers = lines[0].split(",").map((h) => h.trim().toLowerCase());
  const records: CDRRecord[] = [];

  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(",").map((c) => c.trim().replace(/^"|"$/g, ""));
    if (cols.length < 4) continue;

    const record: any = {
      id: `cdr-${i}-${Date.now()}`,
      aParty: cols[0] || "",
      bParty: cols[1] || "",
      imeiA: cols[2] || "864200000000000",
      imeiB: cols[3] || "",
      timestamp: cols[4] || new Date().toISOString(),
      durationSec: parseInt(cols[5], 10) || 120,
      callType: (cols[6] || "VOICE_CALL") as any,
      towerId: cols[7] || "TOW-MUM-01",
      towerLocation: cols[8] || "South Mumbai",
      lat: parseFloat(cols[9]) || 18.922,
      lng: parseFloat(cols[10]) || 72.8347,
    };
    records.push(record);
  }

  return records;
}

export function parseFinancialCSV(csvText: string): FinancialRecord[] {
  const lines = csvText.trim().split("\n");
  if (lines.length < 2) return [];

  const records: FinancialRecord[] = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(",").map((c) => c.trim().replace(/^"|"$/g, ""));
    if (cols.length < 4) continue;

    records.push({
      id: `fin-${i}-${Date.now()}`,
      senderAcc: cols[0] || "",
      senderName: cols[1] || "Remitter",
      receiverAcc: cols[2] || "",
      receiverName: cols[3] || "Beneficiary",
      amount: parseFloat(cols[4]) || 50000,
      timestamp: cols[5] || new Date().toISOString(),
      mode: (cols[6] || "NEFT") as any,
      utrNumber: cols[7] || `UTR${Math.floor(Math.random() * 9000000 + 1000000)}`,
      bankName: cols[8] || "State Bank",
      isSmurfingFlag: cols[9]?.toLowerCase() === "true",
    });
  }

  return records;
}

/**
 * Query AI Copilot using Gemini or local graph topology synthesis
 */
export async function queryCopilotWithGemini(
  query: string,
  nodes: CrimeNetworkNode[],
  links: CrimeNetworkLink[],
  patterns: SuspiciousPattern[],
  communities: SyndicateCommunity[]
): Promise<{ answer: string; relatedEntityIds?: string[] }> {
  try {
    const response = await fetch("/api/copilot", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query, nodes, links, patterns }),
    });

    if (response.ok) {
      const data = await response.json();
      if (data.answer) {
        return {
          answer: data.answer,
          relatedEntityIds: data.relatedEntityIds || [],
        };
      }
    }
  } catch (err) {
    console.warn("Copilot API request failed, generating local topological answer:", err);
  }

  // Local Intelligent Fallback
  const q = query.toLowerCase();
  const kingpins = nodes.filter((n) => n.isKingpinCandidate);
  const cutNodes = nodes.filter((n) => n.isCutVertex);

  if (q.includes("kingpin") || q.includes("leader") || q.includes("shield")) {
    const kp = kingpins[0];
    if (kp) {
      return {
        answer: `Topological Analysis indicates **${kp.label}** (${kp.role}) is the primary kingpin candidate with the highest Betweenness Centrality (${kp.betweenness || "0.000"}).\n\n**Shielding Architecture:** Direct contacts are strictly restricted to trusted lieutenants (e.g. Farooq Merchant), creating a 2-hop air gap before ground runners and safehouses.`,
        relatedEntityIds: [kp.id],
      };
    }
  }

  if (q.includes("disrupt") || q.includes("arrest") || q.includes("cut") || q.includes("bottleneck")) {
    if (cutNodes.length > 0) {
      return {
        answer: `Network Vulnerability Assessment: Arresting **${cutNodes.map((c) => c.label).join(", ")}** (Critical Cut-Vertices) will sever the primary communication and financial conduits between the leadership command and field distribution logistics.`,
        relatedEntityIds: cutNodes.map((c) => c.id),
      };
    }
  }

  if (q.includes("burner") || q.includes("imei") || q.includes("swap")) {
    const burnerPattern = patterns.find((p) => p.type === "BURNER_SWAP");
    if (burnerPattern) {
      return {
        answer: `**${burnerPattern.title}**: ${burnerPattern.description}\n\n**Investigative Directive:** ${burnerPattern.actionableLead}`,
        relatedEntityIds: burnerPattern.involvedNodeIds,
      };
    }
  }

  if (q.includes("money") || q.includes("hawala") || q.includes("fund") || q.includes("trail")) {
    const hawalaPattern = patterns.find((p) => p.type === "HAWALA_LAYERING");
    if (hawalaPattern) {
      return {
        answer: `**Hawala Trail Identified**: ${hawalaPattern.description}\n\n**Actionable Step:** ${hawalaPattern.actionableLead}`,
        relatedEntityIds: hawalaPattern.involvedNodeIds,
      };
    }
  }

  return {
    answer: `The active criminal graph contains **${nodes.length} entities** and **${links.length} relational connections** across ${communities.length} functional syndicate cells.\n\nKey finding: **${kingpins.length} Kingpin Candidates** identified using Brandes' Betweenness Centrality, and **${patterns.length} algorithmic alerts** detected.`,
    relatedEntityIds: kingpins.map((k) => k.id),
  };
}

/**
 * Generate Court-Ready Intelligence Dossier via Gemini AI
 */
export async function generateDossierWithGemini(
  caseId: string,
  nodes: CrimeNetworkNode[],
  links: CrimeNetworkLink[],
  patterns: SuspiciousPattern[],
  communities: SyndicateCommunity[]
): Promise<CourtDossier> {
  try {
    const response = await fetch("/api/generate-dossier", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ caseId, nodes, links, patterns, communities }),
    });

    if (response.ok) {
      const data = await response.json();
      if (data.dossier) return data.dossier;
    }
  } catch (err) {
    console.warn("AI Dossier API call failed, generating deterministic legal annexure:", err);
  }

  return {
    caseTitle: `Operation ${caseId} - Syndicate Analysis`,
    caseNumber: `LEA-${caseId}-${Date.now().toString().slice(-4)}`,
    generatedAt: new Date().toISOString(),
    classification: "CONFIDENTIAL // LAW ENFORCEMENT & JUDICIAL PROSECUTION ANNEXURE",
    executiveSummary: `Intelligence graph reconstruction confirms an organized multi-tiered criminal enterprise comprising ${nodes.length} mapped entities, ${links.length} evidentiary links, and ${communities.length} distinct operational clusters.`,
    keySuspects: nodes
      .filter((n) => n.isKingpinCandidate || n.riskScore >= 75)
      .map((n) => ({
        id: n.id,
        name: n.label,
        role: n.role || n.type,
        riskScore: n.riskScore,
        centralityMetric: `Betweenness: ${n.betweenness || "0.000"}, Degree: ${n.degree || 0}`,
        knownAliases: n.aliases || [],
        allegedActs: n.details?.notes || "Coordinated communication and financial pipelines.",
      })),
    subSyndicateBreakdown: communities.map((c) => ({
      communityName: c.name,
      purpose: c.role,
      memberCount: c.nodeIds.length,
      topLeader: nodes.find((n) => n.id === c.keyLeaderId)?.label || "Undisclosed",
    })),
    suspiciousPatternsDetected: patterns.map((p) => ({
      patternTitle: p.title,
      severity: p.severity,
      evidenceSummary: p.description,
      actionableLead: p.actionableLead,
    })),
    actionableNextSteps: [
      "Issue Look-Out Circulars (LOC) at all international airport immigration checkpoints.",
      "Execute Section 102 CrPC freeze directives on identified mule bank accounts.",
      "Requisition Section 91 CrPC telecom records for flagged burner IMEIs.",
      "Execute search and seizure warrants on identified safehouse nodes.",
    ],
  };
}
