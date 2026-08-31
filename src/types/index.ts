export type EntityType =
  | "PERSON"
  | "PHONE"
  | "FINANCIAL"
  | "LOCATION"
  | "VEHICLE"
  | "ORGANIZATION"
  | "INCIDENT";

export type RelationType =
  | "CALLS"
  | "FUNDS_TRANSFER"
  | "CO_ACCUSED"
  | "TRAVELLED_WITH"
  | "ASSOCIATED_WITH"
  | "OWNS"
  | "OPERATES_FROM"
  | "MEMBER_OF"
  | "LOCATED_AT";

export interface GeoLocation {
  lat: number;
  lng: number;
  name: string;
  address?: string;
}

export interface CrimeNetworkNode {
  id: string;
  label: string;
  type: EntityType;
  role?: string;
  aliases?: string[];
  riskScore: number; // 0 - 100
  confidence: number; // 0 - 1
  details?: {
    notes?: string;
    phone?: string;
    imei?: string;
    accountNumber?: string;
    bankName?: string;
    ifsc?: string;
    vehiclePlate?: string;
    vehicleModel?: string;
    firNumber?: string;
    station?: string;
    address?: string;
    geo?: GeoLocation;
    firstSeen?: string;
    lastSeen?: string;
    status?: "ACTIVE" | "WANTED" | "ARRESTED" | "SURVEILLANCE" | "FLAGGED";
  };
  // Graph Analytics Metrics
  degree?: number;
  inDegree?: number;
  outDegree?: number;
  betweenness?: number;
  closeness?: number;
  pageRank?: number;
  communityId?: number;
  communityName?: string;
  isKingpinCandidate?: boolean;
  isCutVertex?: boolean; // Single point of failure/bridge
  sourceDocumentIds?: string[];
  // D3 physics coordinates
  x?: number;
  y?: number;
  vx?: number;
  vy?: number;
  fx?: number | null;
  fy?: number | null;
}

export interface CrimeNetworkLink {
  id: string;
  source: string | CrimeNetworkNode;
  target: string | CrimeNetworkNode;
  relationType: RelationType;
  weight: number; // strength or frequency of link
  frequency?: number; // e.g. call count, transaction count
  amount?: number; // for financial transfers in INR
  durationSec?: number; // for phone calls
  timestamp?: string; // ISO date string
  details?: string;
  sourceDocumentId?: string;
  flags?: Array<
    | "SUSPICIOUS_HAWALA"
    | "NIGHT_CALL"
    | "SHARED_IMEI"
    | "SMURFING_CHAIN"
    | "GEO_TOWER_MATCH"
    | "HIGH_FREQUENCY"
    | "BURST_COMMUNICATION"
  >;
}

export interface FIRRecord {
  id: string;
  firNumber: string;
  date: string;
  policeStation: string;
  district: string;
  state: string;
  sections: string[]; // e.g. ["IPC 302", "IPC 120B", "NDPS Sec 21"]
  complainant: string;
  accused: string[];
  briefNarrative: string;
  status: "REGISTERED" | "CHARGESHEETED" | "UNDER_INVESTIGATION" | "CLOSED";
  extractedEntityIds?: string[];
}

export interface CDRRecord {
  id: string;
  aParty: string; // Calling Number
  bParty: string; // Called Number
  imeiA: string;
  imeiB?: string;
  timestamp: string;
  durationSec: number;
  callType: "VOICE_CALL" | "SMS" | "VOIP_SIGNAL";
  towerId: string;
  towerLocation: string;
  lat: number;
  lng: number;
}

export interface FinancialRecord {
  id: string;
  senderAcc: string;
  senderName: string;
  receiverAcc: string;
  receiverName: string;
  amount: number;
  timestamp: string;
  mode: "NEFT" | "RTGS" | "IMPS" | "UPI" | "HAWALA_CASH" | "CRYPTO";
  utrNumber: string;
  bankName?: string;
  isSmurfingFlag?: boolean;
}

export interface IntelRecord {
  id: string;
  date: string;
  sourceType: "FIELD_AGENT" | "HUMINT" | "TECHNICAL_SURVEILLANCE" | "INTERCEPT" | "INFORMANTS";
  location: string;
  lat: number;
  lng: number;
  vehiclePlate?: string;
  suspectsObserved: string[];
  description: string;
  reliabilityScore: number; // 1 to 5
}

export type PatternType =
  | "BURNER_SWAP"
  | "HAWALA_LAYERING"
  | "GEO_CONVERGENCE"
  | "KINGPIN_SHIELD"
  | "BURST_COMMUNICATION"
  | "MULE_CLUSTER";

export interface SuspiciousPattern {
  id: string;
  type: PatternType;
  title: string;
  severity: "CRITICAL" | "HIGH" | "MEDIUM";
  description: string;
  involvedNodeIds: string[];
  involvedLinkIds: string[];
  evidenceData: Record<string, any>;
  actionableLead: string;
  detectedAt: string;
}

export interface SyndicateCommunity {
  id: number;
  name: string;
  role: string;
  color: string;
  nodeIds: string[];
  keyLeaderId?: string;
}

export interface ShortestPathResult {
  path: string[];
  links: string[];
  totalHops: number;
  summary: string;
}

export interface GraphFilterState {
  searchQuery: string;
  selectedEntityTypes: EntityType[];
  selectedRelationTypes: RelationType[];
  minRiskScore: number;
  selectedCommunity: number | "ALL";
  onlyKingpins: boolean;
  onlySuspicious: boolean;
  timeRange: {
    start: string;
    end: string;
  };
}

export interface CourtDossier {
  caseTitle: string;
  caseNumber: string;
  generatedAt: string;
  classification: string;
  executiveSummary: string;
  keySuspects: Array<{
    id: string;
    name: string;
    role: string;
    riskScore: number;
    centralityMetric: string;
    knownAliases: string[];
    allegedActs: string;
  }>;
  subSyndicateBreakdown: Array<{
    communityName: string;
    purpose: string;
    memberCount: number;
    topLeader: string;
  }>;
  suspiciousPatternsDetected: Array<{
    patternTitle: string;
    severity: string;
    evidenceSummary: string;
    actionableLead: string;
  }>;
  actionableNextSteps: string[];
}

export interface CaseDataset {
  id: string;
  name: string;
  codeName: string;
  description: string;
  date: string;
  leadAgency: string;
  nodes: CrimeNetworkNode[];
  links: CrimeNetworkLink[];
  firs: FIRRecord[];
  cdrs: CDRRecord[];
  financials: FinancialRecord[];
  intels: IntelRecord[];
}
