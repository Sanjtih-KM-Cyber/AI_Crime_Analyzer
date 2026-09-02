import React, { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import {
  Shield,
  Lock,
  User,
  Building,
  KeyRound,
  AlertTriangle,
  CheckCircle2,
  BadgeCheck,
  ArrowLeft,
  FileText,
} from "lucide-react";

export const LoginView: React.FC = () => {
  const { login, requestAccess } = useAuth();
  const [viewMode, setViewMode] = useState<"signin" | "request">("signin");

  // Sign in form state
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState<string | null>(null);
  const [accountStatusNotice, setAccountStatusNotice] = useState<{
    status: "PENDING" | "REJECTED" | "SUSPENDED" | null;
    message: string;
  } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Request access form state
  const [reqFullName, setReqFullName] = useState("");
  const [reqEmail, setReqEmail] = useState("");
  const [reqBadgeId, setReqBadgeId] = useState("");
  const [reqAgencyDepartment, setReqAgencyDepartment] = useState("");
  const [reqRole, setReqRole] = useState<"LEAD_INVESTIGATOR" | "FORENSIC_INVESTIGATOR">("LEAD_INVESTIGATOR");
  const [reqReason, setReqReason] = useState("");
  const [reqPassword, setReqPassword] = useState("");
  const [reqConfirmPassword, setReqConfirmPassword] = useState("");
  const [reqSuccessMsg, setReqSuccessMsg] = useState<string | null>(null);
  const [reqError, setReqError] = useState<string | null>(null);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim() || !password) {
      setLoginError("Please enter your Official Email / Badge ID and Password.");
      return;
    }

    setIsSubmitting(true);
    setLoginError(null);
    setAccountStatusNotice(null);

    try {
      await login(identifier.trim(), password);
    } catch (err: any) {
      const status = err.data?.status;
      if (status === "PENDING" || err.message?.toLowerCase().includes("pending")) {
        setAccountStatusNotice({
          status: "PENDING",
          message: "Your access request is awaiting administrator approval.",
        });
      } else if (status === "REJECTED" || err.message?.toLowerCase().includes("rejected")) {
        setAccountStatusNotice({
          status: "REJECTED",
          message: "Your access request was rejected. Contact your administrator.",
        });
      } else if (status === "SUSPENDED" || err.message?.toLowerCase().includes("suspended")) {
        setAccountStatusNotice({
          status: "SUSPENDED",
          message: "Your account has been suspended. Contact your administrator.",
        });
      } else {
        setLoginError(err.message || "Invalid credentials. Please verify your identifier and password.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRequestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setReqError(null);
    setReqSuccessMsg(null);

    if (
      !reqFullName.trim() ||
      !reqEmail.trim() ||
      !reqBadgeId.trim() ||
      !reqAgencyDepartment.trim() ||
      !reqPassword
    ) {
      setReqError("Please complete all required fields.");
      return;
    }

    if (reqPassword !== reqConfirmPassword) {
      setReqError("Passwords do not match. Please re-enter.");
      return;
    }

    if (reqPassword.length < 6) {
      setReqError("Password must be at least 6 characters in length.");
      return;
    }

    setIsSubmitting(true);

    try {
      await requestAccess({
        full_name: reqFullName.trim(),
        official_id: reqBadgeId.trim(),
        official_email: reqEmail.trim().toLowerCase(),
        agency: reqAgencyDepartment.trim(),
        designation: "Investigative Officer",
        department: reqAgencyDepartment.trim(),
        requested_role: reqRole,
        reason_for_access: reqReason.trim() || "Operational case analysis and interdiction tasks.",
        password: reqPassword,
      });

      setReqSuccessMsg(
        "Access request submitted. Your account must be approved by an administrator before you can access CRIM-INTEL OS."
      );
      // Reset form
      setReqFullName("");
      setReqEmail("");
      setReqBadgeId("");
      setReqAgencyDepartment("");
      setReqReason("");
      setReqPassword("");
      setReqConfirmPassword("");
    } catch (err: any) {
      setReqError(err.message || "Failed to submit access request. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between selection:bg-amber-500/30 selection:text-amber-200">
      {/* Top Bar Header */}
      <header className="border-b border-slate-800/80 bg-slate-950/90 backdrop-blur-md px-4 sm:px-8 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 font-mono font-black text-sm shadow-md shadow-amber-500/10">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-bold text-sm sm:text-base tracking-tight text-slate-100 flex items-center gap-2">
              <span>CRIM-INTEL OS</span>
              <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-slate-900 border border-slate-700 text-amber-400 font-semibold uppercase">
                RESTRICTED
              </span>
            </h1>
            <p className="text-[11px] text-slate-400">
              National Security Intelligence & Criminal Network Interdiction Platform
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          <span className="hidden sm:inline">Secure Air-Gapped Gateway</span>
        </div>
      </header>

      {/* Main Sign In / Request Access Container */}
      <main className="flex-1 max-w-md w-full mx-auto p-4 sm:p-6 flex flex-col justify-center my-6">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 sm:p-8">
          {viewMode === "signin" ? (
            /* ================= OFFICER SIGN IN ================= */
            <div>
              <div className="mb-6 text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 mb-3">
                  <Lock className="w-6 h-6" />
                </div>
                <h2 className="text-xl font-bold text-slate-100 tracking-tight">Officer Sign In</h2>
                <p className="text-xs text-slate-400 mt-1">
                  Authenticate with your authorized government credentials
                </p>
              </div>

              {/* Account Status Notices */}
              {accountStatusNotice && (
                <div
                  className={`p-3.5 rounded-xl mb-4 text-xs flex items-start gap-2.5 border ${
                    accountStatusNotice.status === "PENDING"
                      ? "bg-amber-500/10 border-amber-500/30 text-amber-300"
                      : "bg-rose-500/10 border-rose-500/30 text-rose-300"
                  }`}
                >
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                  <div>
                    <strong className="block font-semibold">
                      {accountStatusNotice.status === "PENDING"
                        ? "Approval Pending"
                        : accountStatusNotice.status === "REJECTED"
                        ? "Access Rejected"
                        : "Account Suspended"}
                    </strong>
                    <span>{accountStatusNotice.message}</span>
                  </div>
                </div>
              )}

              {/* Login Error Notice */}
              {loginError && !accountStatusNotice && (
                <div className="p-3.5 rounded-xl mb-4 bg-rose-500/10 border border-rose-500/30 text-xs text-rose-300 flex items-start gap-2.5">
                  <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  <span>{loginError}</span>
                </div>
              )}

              <form onSubmit={handleLoginSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Official Email / Badge ID
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      autoComplete="username"
                      value={identifier}
                      onChange={(e) => setIdentifier(e.target.value)}
                      placeholder="e.g. officer@agency.gov.in or BADGE-ID"
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-10 pr-3.5 py-2.5 text-xs sm:text-sm text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-amber-500 font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Password
                  </label>
                  <div className="relative">
                    <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="password"
                      required
                      autoComplete="current-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-10 pr-3.5 py-2.5 text-xs sm:text-sm text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-amber-500 font-mono"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full mt-2 py-3 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs sm:text-sm transition-all shadow-lg shadow-amber-500/10 flex items-center justify-center gap-2 active:scale-[0.99] disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <span className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                      <span>Authenticating...</span>
                    </>
                  ) : (
                    <>
                      <BadgeCheck className="w-4 h-4 stroke-[2.5]" />
                      <span>Sign In</span>
                    </>
                  )}
                </button>
              </form>

              <div className="mt-6 pt-5 border-t border-slate-800 text-center">
                <button
                  type="button"
                  onClick={() => {
                    setViewMode("request");
                    setLoginError(null);
                    setAccountStatusNotice(null);
                    setReqError(null);
                    setReqSuccessMsg(null);
                  }}
                  className="text-xs text-amber-400 hover:text-amber-300 font-semibold transition-colors"
                >
                  Request Access →
                </button>
              </div>
            </div>
          ) : (
            /* ================= REQUEST ACCESS ================= */
            <div>
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-slate-100 tracking-tight">Request Access</h2>
                  <p className="text-xs text-slate-400">
                    Submit registration for administrator clearance
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setViewMode("signin");
                    setReqError(null);
                    setReqSuccessMsg(null);
                  }}
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                  title="Back to Sign In"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
              </div>

              {reqSuccessMsg && (
                <div className="p-3.5 rounded-xl mb-4 bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-300 flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <strong className="block font-semibold mb-1">Access Request Submitted</strong>
                    <span>{reqSuccessMsg}</span>
                    <button
                      type="button"
                      onClick={() => setViewMode("signin")}
                      className="mt-2.5 text-xs font-bold text-emerald-400 underline hover:text-emerald-300 block"
                    >
                      Return to Sign In
                    </button>
                  </div>
                </div>
              )}

              {reqError && (
                <div className="p-3.5 rounded-xl mb-4 bg-rose-500/10 border border-rose-500/30 text-xs text-rose-300 flex items-start gap-2.5">
                  <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  <span>{reqError}</span>
                </div>
              )}

              <form onSubmit={handleRequestSubmit} className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={reqFullName}
                    onChange={(e) => setReqFullName(e.target.value)}
                    placeholder="e.g. Officer Vikramaditya Rathore"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-amber-500"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Official Email *
                    </label>
                    <input
                      type="email"
                      required
                      value={reqEmail}
                      onChange={(e) => setReqEmail(e.target.value)}
                      placeholder="officer@agency.gov.in"
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-amber-500 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Badge / Employee ID *
                    </label>
                    <input
                      type="text"
                      required
                      value={reqBadgeId}
                      onChange={(e) => setReqBadgeId(e.target.value)}
                      placeholder="e.g. NCB-7749"
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-amber-500 font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Department / Agency *
                  </label>
                  <input
                    type="text"
                    required
                    value={reqAgencyDepartment}
                    onChange={(e) => setReqAgencyDepartment(e.target.value)}
                    placeholder="e.g. Narcotics Control Bureau / Special Cell"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Requested Operational Role *
                  </label>
                  <select
                    value={reqRole}
                    onChange={(e) => setReqRole(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-amber-400 font-semibold focus:outline-none focus:ring-1 focus:ring-amber-500"
                  >
                    <option value="LEAD_INVESTIGATOR">LEAD_INVESTIGATOR (Investigation Command & Graph Intelligence)</option>
                    <option value="FORENSIC_INVESTIGATOR">FORENSIC_INVESTIGATOR (Digital Forensics, CDR & Evidence Lab)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Reason for Access
                  </label>
                  <textarea
                    rows={2}
                    value={reqReason}
                    onChange={(e) => setReqReason(e.target.value)}
                    placeholder="Case assignment, jurisdiction, or operational scope..."
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2 text-xs text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-amber-500"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Password *
                    </label>
                    <input
                      type="password"
                      required
                      value={reqPassword}
                      onChange={(e) => setReqPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-amber-500 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Confirm Password *
                    </label>
                    <input
                      type="password"
                      required
                      value={reqConfirmPassword}
                      onChange={(e) => setReqConfirmPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-amber-500 font-mono"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full mt-2 py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs sm:text-sm transition-all shadow-md shadow-amber-500/10 flex items-center justify-center gap-2 active:scale-[0.99] disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <span className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                      <span>Submitting Request...</span>
                    </>
                  ) : (
                    <>
                      <Building className="w-4 h-4" />
                      <span>Submit Access Request</span>
                    </>
                  )}
                </button>
              </form>

              <div className="mt-4 text-center">
                <button
                  type="button"
                  onClick={() => setViewMode("signin")}
                  className="text-xs text-slate-400 hover:text-slate-200"
                >
                  ← Return to Officer Sign In
                </button>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950/90 backdrop-blur-md px-4 sm:px-8 py-3 text-center text-xs text-slate-400 flex flex-col sm:flex-row items-center justify-between gap-2">
        <span>CRIM-INTEL OS • Restricted to Authorized Law Enforcement Personnel</span>
        <span className="font-mono text-[11px] text-slate-400">
          Section 65B Indian Evidence Act Compliant
        </span>
      </footer>
    </div>
  );
};
