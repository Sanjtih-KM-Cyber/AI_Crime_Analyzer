import React, { useState } from "react";
import {
  InvestigatorProfile,
  AuditLogEntry,
  UserRole,
} from "../types";
import {
  INVESTIGATOR_PROFILES,
  INITIAL_AUDIT_LOGS,
} from "../data/mockDatasets";
import {
  Shield,
  Users,
  Lock,
  CheckCircle2,
  FileCheck,
  Search,
  Key,
  Award,
  Clock,
  Download,
  AlertCircle,
  Radio,
  FileText,
  Eye,
  UserCheck,
} from "lucide-react";

interface InvestigatorRbacHubProps {
  currentOfficer: InvestigatorProfile;
  onSelectOfficer: (officer: InvestigatorProfile) => void;
  auditLogs?: AuditLogEntry[];
}

export const InvestigatorRbacHub: React.FC<InvestigatorRbacHubProps> = ({
  currentOfficer,
  onSelectOfficer,
  auditLogs = INITIAL_AUDIT_LOGS,
}) => {
  const [activeTab, setActiveTab] = useState<"profiles" | "audit" | "matrix">("profiles");
  const [auditSearch, setAuditSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<UserRole | "ALL">("ALL");

  const filteredLogs = auditLogs.filter((log) => {
    if (roleFilter !== "ALL" && log.officerRole !== roleFilter) return false;
    if (auditSearch.trim()) {
      const q = auditSearch.toLowerCase();
      return (
        log.officerName.toLowerCase().includes(q) ||
        log.actionType.toLowerCase().includes(q) ||
        log.details.toLowerCase().includes(q) ||
        log.targetLabel.toLowerCase().includes(q) ||
        log.digitalHash.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const getRoleBadge = (role: UserRole) => {
    switch (role) {
      case "LEAD_INVESTIGATOR":
        return { label: "Lead SP / Command", color: "bg-amber-500/20 text-amber-300 border-amber-500/40" };
      case "INTEL_ANALYST":
        return { label: "Intel Analyst", color: "bg-sky-500/20 text-sky-300 border-sky-500/40" };
      case "CYBER_FORENSIC":
        return { label: "Cyber Forensic Tech", color: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40" };
      case "LEGAL_MAGISTRATE":
        return { label: "Legal Prosecutor", color: "bg-purple-500/20 text-purple-300 border-purple-500/40" };
      default:
        return { label: role, color: "bg-slate-500/20 text-slate-300 border-slate-500/40" };
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Top Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-amber-500/10 rounded-xl text-amber-400 border border-amber-500/20">
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                MULTI-INVESTIGATOR CONCURRENCY & RBAC
              </span>
              <span className="text-[10px] font-mono text-slate-400">
                IMMUTABLE CHAIN-OF-CUSTODY AUDIT
              </span>
            </div>
            <h2 className="text-base font-bold text-slate-100 mt-0.5">
              Investigator Command & Security Governance
            </h2>
          </div>
        </div>

        {/* View Switcher Tabs */}
        <div className="flex items-center gap-1.5 bg-slate-950 p-1.5 rounded-xl border border-slate-800">
          <button
            onClick={() => setActiveTab("profiles")}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-semibold flex items-center gap-1.5 transition-colors ${
              activeTab === "profiles"
                ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Active Officers ({INVESTIGATOR_PROFILES.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("audit")}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-semibold flex items-center gap-1.5 transition-colors ${
              activeTab === "audit"
                ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Digital Audit Log ({auditLogs.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("matrix")}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-semibold flex items-center gap-1.5 transition-colors ${
              activeTab === "matrix"
                ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Lock className="w-3.5 h-3.5" />
            <span>RBAC Matrix</span>
          </button>
        </div>
      </div>

      {/* Tab 1: Active Officers & Role Switching */}
      {activeTab === "profiles" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {INVESTIGATOR_PROFILES.map((officer) => {
              const isCurrent = officer.id === currentOfficer.id;
              const badge = getRoleBadge(officer.role);

              return (
                <div
                  key={officer.id}
                  onClick={() => onSelectOfficer(officer)}
                  className={`bg-slate-900 border rounded-2xl p-5 cursor-pointer transition-all shadow-lg flex flex-col justify-between ${
                    isCurrent
                      ? "border-amber-500 ring-2 ring-amber-500/20 bg-slate-900/95"
                      : "border-slate-800 hover:border-slate-700 hover:bg-slate-850"
                  }`}
                >
                  <div>
                    {/* Top Status & Badge */}
                    <div className="flex items-center justify-between mb-3">
                      <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${badge.color}`}>
                        {badge.label}
                      </span>
                      <span className="flex items-center gap-1.5 text-[10px] font-mono text-emerald-400">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                        {officer.status}
                      </span>
                    </div>

                    {/* Officer Identity */}
                    <div className="flex items-center gap-3 mb-3">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-slate-950 font-mono text-sm border-2 border-slate-700"
                        style={{ backgroundColor: officer.avatarColor }}
                      >
                        {officer.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-slate-100">{officer.name}</h3>
                        <p className="text-[11px] text-slate-400">{officer.rank}</p>
                      </div>
                    </div>

                    <div className="text-[10px] font-mono text-slate-400 bg-slate-950/60 p-2 rounded-lg border border-slate-800 mb-3">
                      <div>Badge: <span className="text-slate-200">{officer.badgeNumber}</span></div>
                      <div>Dept: <span className="text-slate-200">{officer.department}</span></div>
                    </div>

                    {/* Live Activity Focus */}
                    <div className="text-[11px] text-amber-300/90 font-mono bg-amber-500/10 border border-amber-500/20 p-2.5 rounded-xl">
                      <div className="text-[9px] text-amber-500 font-bold uppercase mb-0.5">Live Session Focus:</div>
                      {officer.currentActivity}
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between">
                    <span className="text-[10px] font-mono text-slate-500">
                      {isCurrent ? "Active Session" : "Click to Switch Role"}
                    </span>
                    {isCurrent ? (
                      <span className="px-2 py-0.5 rounded bg-amber-500 text-slate-950 font-mono text-[10px] font-bold">
                        ACTIVE SESSION
                      </span>
                    ) : (
                      <span className="text-xs text-slate-400 hover:text-amber-300 font-mono">
                        Switch →
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Current Active Permissions Snapshot */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
            <h3 className="text-xs font-mono font-bold text-slate-200 uppercase tracking-wider mb-4 flex items-center gap-2">
              <Key className="w-4 h-4 text-amber-400" />
              Active Officer Cryptographic Privileges & Scope ({currentOfficer.name})
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {[
                { label: "Sign Court Dossiers", granted: currentOfficer.permissions.canSignDossier },
                { label: "Confirm Evidence", granted: currentOfficer.permissions.canConfirmEvidence },
                { label: "Reject / Strike Node", granted: currentOfficer.permissions.canRejectEvidence },
                { label: "Add Hypotheses", granted: currentOfficer.permissions.canAddHypothesis },
                { label: "Bulk 15GB Ingestion", granted: currentOfficer.permissions.canIngestData },
                { label: "Export Case Intel", granted: currentOfficer.permissions.canExportData },
              ].map((perm, idx) => (
                <div
                  key={idx}
                  className={`p-3 rounded-xl border flex flex-col justify-between ${
                    perm.granted
                      ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
                      : "bg-slate-950/60 border-slate-800 text-slate-500 opacity-60"
                  }`}
                >
                  <span className="text-xs font-semibold">{perm.label}</span>
                  <span className="mt-2 text-[10px] font-mono font-bold flex items-center gap-1">
                    {perm.granted ? (
                      <>
                        <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                        <span>AUTHORIZED</span>
                      </>
                    ) : (
                      <>
                        <Lock className="w-3 h-3 text-slate-500" />
                        <span>RESTRICTED</span>
                      </>
                    )}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Digital Audit Log */}
      {activeTab === "audit" && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search audit trail, SHA-256 hash, officer..."
                value={auditSearch}
                onChange={(e) => setAuditSearch(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500 w-full"
              />
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 font-mono">Role:</span>
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value as any)}
                className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-200 font-mono focus:outline-none focus:border-amber-500"
              >
                <option value="ALL">All Roles</option>
                <option value="LEAD_INVESTIGATOR">Lead SP</option>
                <option value="INTEL_ANALYST">Intel Analyst</option>
                <option value="CYBER_FORENSIC">Cyber Forensic</option>
                <option value="LEGAL_MAGISTRATE">Legal Prosecutor</option>
              </select>
            </div>
          </div>

          {/* Audit Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="py-2.5 px-3">Timestamp (UTC)</th>
                  <th className="py-2.5 px-3">Officer / Rank</th>
                  <th className="py-2.5 px-3">Action Type</th>
                  <th className="py-2.5 px-3">Target Entity</th>
                  <th className="py-2.5 px-3">Cryptographic Digest (SHA-256)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredLogs.map((log) => {
                  const badge = getRoleBadge(log.officerRole);
                  return (
                    <tr key={log.id} className="hover:bg-slate-850/50 transition-colors">
                      <td className="py-3 px-3 text-slate-400 whitespace-nowrap">
                        {new Date(log.timestamp).toISOString().replace("T", " ").slice(0, 19)}
                      </td>
                      <td className="py-3 px-3">
                        <strong className="text-slate-200 block font-sans text-xs">{log.officerName}</strong>
                        <span className={`text-[9px] px-1.5 py-0.2 rounded border ${badge.color}`}>
                          {badge.label}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <span className="px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-amber-300 font-bold text-[10px]">
                          {log.actionType}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <div className="text-slate-200 font-sans text-xs">{log.targetLabel}</div>
                        <div className="text-slate-500 text-[10px] truncate max-w-xs">{log.details}</div>
                      </td>
                      <td className="py-3 px-3 text-sky-400 font-mono text-[10px]">
                        <span className="bg-sky-950/40 border border-sky-800/60 px-2 py-0.5 rounded">
                          {log.digitalHash.slice(0, 24)}...
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: RBAC Matrix */}
      {activeTab === "matrix" && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
          <h3 className="text-xs font-mono font-bold text-slate-200 uppercase tracking-wider mb-2">
            Statutory Law Enforcement Access Control Matrix (SIH 26189 Standard)
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">Role Designation</th>
                  <th className="py-3 px-4 text-center">Confirm Evidence</th>
                  <th className="py-3 px-4 text-center">Add Hypotheses</th>
                  <th className="py-3 px-4 text-center">Bulk 15GB Ingest</th>
                  <th className="py-3 px-4 text-center">Sign Charge-Sheet</th>
                  <th className="py-3 px-4 text-center">Audit Log Export</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {[
                  { role: "LEAD_INVESTIGATOR (SP)", confirm: true, hypo: true, ingest: true, sign: true, export: true },
                  { role: "INTEL_ANALYST (SIO)", confirm: false, hypo: true, ingest: true, sign: false, export: true },
                  { role: "CYBER_FORENSIC (Tech)", confirm: false, hypo: false, ingest: true, sign: false, export: true },
                  { role: "LEGAL_MAGISTRATE (PP)", confirm: false, hypo: false, ingest: false, sign: false, export: true },
                ].map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-850">
                    <td className="py-3 px-4 font-bold text-slate-200">{row.role}</td>
                    <td className="py-3 px-4 text-center">{row.confirm ? "🟢 YES" : "🔴 NO"}</td>
                    <td className="py-3 px-4 text-center">{row.hypo ? "🟢 YES" : "🔴 NO"}</td>
                    <td className="py-3 px-4 text-center">{row.ingest ? "🟢 YES" : "🔴 NO"}</td>
                    <td className="py-3 px-4 text-center">{row.sign ? "🟢 YES" : "🔴 NO"}</td>
                    <td className="py-3 px-4 text-center">{row.export ? "🟢 YES" : "🔴 NO"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
