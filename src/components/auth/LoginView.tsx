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
  Eye,
  EyeOff,
  Briefcase,
  Layers,
  FileCheck,
  ChevronRight,
  ShieldAlert,
} from "lucide-react";

export const LoginView: React.FC = () => {
  const { login, requestAccess } = useAuth();
  const [viewMode, setViewMode] = useState<"signin" | "request">("signin");

  // Sign in form state
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [accountStatusNotice, setAccountStatusNotice] = useState<{
    status: "PENDING" | "REJECTED" | "SUSPENDED";
    message: string;
  } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Request access form state
  const [reqFullName, setReqFullName] = useState("");
  const [reqEmail, setReqEmail] = useState("");
  const [reqBadgeId, setReqBadgeId] = useState("");
  const [reqAgency, setReqAgency] = useState("");
  const [reqDepartment, setReqDepartment] = useState("");
  const [reqRole, setReqRole] = useState<"LEAD_INVESTIGATOR" | "FORENSIC_INVESTIGATOR">("LEAD_INVESTIGATOR");
  const [reqReason, setReqReason] = useState("");
  const [reqError, setReqError] = useState<string | null>(null);

  // Confirmation modal / screen state
  const [submissionReceipt, setSubmissionReceipt] = useState<{
    requestId: string;
    fullName: string;
    email: string;
    badgeId: string;
    agency: string;
    requestedRole: "LEAD_INVESTIGATOR" | "FORENSIC_INVESTIGATOR";
  } | null>(null);

  const isSignInFormValid = identifier.trim().length > 0 && password.length > 0;
  const isRequestFormValid =
    reqFullName.trim().length > 0 &&
    reqEmail.trim().length > 0 &&
    reqBadgeId.trim().length > 0 &&
    reqAgency.trim().length > 0 &&
    reqDepartment.trim().length > 0;

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isSignInFormValid) return;

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
    if (!isRequestFormValid) {
      setReqError("Please complete all required fields marked with an asterisk (*).");
      return;
    }

    setIsSubmitting(true);
    setReqError(null);

    try {
      const res: any = await requestAccess({
        full_name: reqFullName.trim(),
        official_id: reqBadgeId.trim(),
        official_email: reqEmail.trim().toLowerCase(),
        agency: reqAgency.trim(),
        designation: "Investigative Officer",
        department: reqDepartment.trim(),
        requested_role: reqRole,
        reason_for_access: reqReason.trim() || "Operational criminal network analysis and evidence interdiction.",
      });

      const generatedReqId =
        res?.request_id ||
        `REQ-${Date.now().toString().slice(-6)}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

      setSubmissionReceipt({
        requestId: generatedReqId,
        fullName: reqFullName.trim(),
        email: reqEmail.trim().toLowerCase(),
        badgeId: reqBadgeId.trim(),
        agency: reqAgency.trim(),
        requestedRole: reqRole,
      });

      // Clear request inputs
      setReqFullName("");
      setReqEmail("");
      setReqBadgeId("");
      setReqAgency("");
      setReqDepartment("");
      setReqReason("");
    } catch (err: any) {
      setReqError(err.message || "Failed to submit access request. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetToSignIn = () => {
    setViewMode("signin");
    setSubmissionReceipt(null);
    setLoginError(null);
    setAccountStatusNotice(null);
    setReqError(null);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between selection:bg-amber-500/30 selection:text-amber-200">
      {/* Top Bar Header */}
      <header className="border-b border-slate-800 bg-slate-950/95 backdrop-blur-md px-4 sm:px-8 py-3.5 flex items-center justify-between z-10">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 font-mono font-black text-sm shadow-sm shadow-amber-500/5">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm sm:text-base tracking-tight text-slate-100">
                CRIM-INTEL OS
              </span>
              <span className="font-mono text-[9px] px-1.5 py-0.5 rounded bg-slate-900 border border-slate-700 text-amber-400 font-semibold uppercase tracking-wider">
                RESTRICTED
              </span>
            </div>
            <p className="text-[11px] text-slate-400 hidden sm:block">
              National Security Intelligence & Criminal Network Interdiction Platform
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono text-slate-400 bg-slate-900/80 px-2.5 py-1 rounded-lg border border-slate-800">
          <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0 animate-pulse" />
          <span className="text-[11px] tracking-wide text-slate-300">SECURE AUTHENTICATION GATEWAY</span>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col justify-center items-center px-4 py-8 sm:py-12">
        {/* ================= 1. SUBMISSION RECEIPT VIEW ================= */}
        {submissionReceipt ? (
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 sm:p-8">
            <div className="flex items-center gap-3 mb-5 pb-4 border-b border-slate-800">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-bold text-slate-100 tracking-tight uppercase">
                  Access Request Submitted
                </h2>
                <p className="text-xs text-slate-400">
                  Your request has been securely submitted for administrator review.
                </p>
              </div>
            </div>

            {/* Request Summary Receipt Card */}
            <div className="bg-slate-950 border border-slate-800/80 rounded-xl p-4 space-y-3 mb-6">
              <div className="flex items-center justify-between pb-2.5 border-b border-slate-800/60">
                <span className="text-xs text-slate-400">Request Reference</span>
                <span className="font-mono text-xs font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                  {submissionReceipt.requestId}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-slate-400 block text-[11px]">Applicant Name</span>
                  <span className="text-slate-200 font-medium">{submissionReceipt.fullName}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Official Email</span>
                  <span className="text-slate-200 font-mono text-[11px] truncate block">
                    {submissionReceipt.email}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Employee / Badge ID</span>
                  <span className="text-slate-200 font-mono text-[11px]">{submissionReceipt.badgeId}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Agency</span>
                  <span className="text-slate-200 font-medium truncate block">
                    {submissionReceipt.agency}
                  </span>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between">
                <div>
                  <span className="text-slate-400 block text-[11px]">Requested Role</span>
                  <span className="text-xs font-semibold text-slate-200">
                    {submissionReceipt.requestedRole === "LEAD_INVESTIGATOR"
                      ? "Lead Investigator"
                      : "Forensic Investigator"}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-slate-400 block text-[11px]">Clearance Status</span>
                  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                    PENDING ADMIN APPROVAL
                  </span>
                </div>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 text-xs text-slate-400 leading-relaxed mb-6">
              <div className="flex items-start gap-2">
                <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <span>
                  Access will remain unavailable until an authorized administrator approves this request.
                  Once verified, your account credentials will become active.
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleResetToSignIn}
              className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs sm:text-sm transition-all border border-slate-700 flex items-center justify-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Return to Sign In</span>
            </button>
          </div>
        ) : viewMode === "signin" ? (
          /* ================= 2. OFFICER SIGN IN VIEW ================= */
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 sm:p-8">
            <div className="mb-6 text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 mb-3">
                <Lock className="w-5 h-5" />
              </div>
              <h2 className="text-xl font-bold text-slate-100 tracking-tight">Secure Officer Sign In</h2>
              <p className="text-xs text-slate-400 mt-1">
                Authenticate with your authorized government credentials.
              </p>
            </div>

            {/* Account Status Notices */}
            {accountStatusNotice && (
              <div
                className={`p-3.5 rounded-xl mb-5 text-xs flex items-start gap-2.5 border ${
                  accountStatusNotice.status === "PENDING"
                    ? "bg-amber-500/10 border-amber-500/30 text-amber-300"
                    : "bg-rose-500/10 border-rose-500/30 text-rose-300"
                }`}
              >
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                <div>
                  <strong className="block font-semibold">
                    {accountStatusNotice.status === "PENDING"
                      ? "Pending Admin Approval"
                      : accountStatusNotice.status === "REJECTED"
                      ? "Access Request Rejected"
                      : "Account Suspended"}
                  </strong>
                  <span className="text-[11px] leading-normal">{accountStatusNotice.message}</span>
                </div>
              </div>
            )}

            {/* Login Error Notice */}
            {loginError && !accountStatusNotice && (
              <div className="p-3.5 rounded-xl mb-5 bg-rose-500/10 border border-rose-500/30 text-xs text-rose-300 flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <span className="text-[11px] leading-normal">{loginError}</span>
              </div>
            )}

            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label
                  htmlFor="official-identifier"
                  className="block text-xs font-semibold text-slate-300 mb-1.5"
                >
                  Official Email / Badge ID <span className="text-amber-400">*</span>
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    id="official-identifier"
                    type="text"
                    required
                    autoComplete="username"
                    value={identifier}
                    onChange={(e) => {
                      setIdentifier(e.target.value);
                      if (loginError) setLoginError(null);
                    }}
                    placeholder="e.g. officer@agency.gov.in or BADGE-ID"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-10 pr-3.5 py-2.5 text-xs sm:text-sm text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-amber-500 focus:border-amber-500 font-mono transition-colors"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="official-password"
                  className="block text-xs font-semibold text-slate-300 mb-1.5"
                >
                  Password <span className="text-amber-400">*</span>
                </label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    id="official-password"
                    type={showPassword ? "text" : "password"}
                    required
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (loginError) setLoginError(null);
                    }}
                    placeholder="••••••••••••"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-10 pr-10 py-2.5 text-xs sm:text-sm text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-amber-500 focus:border-amber-500 font-mono transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting || !isSignInFormValid}
                className="w-full mt-2 py-3 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs sm:text-sm transition-all shadow-md shadow-amber-500/10 flex items-center justify-center gap-2 active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <span className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                    <span>Verifying Credentials...</span>
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
                }}
                className="text-xs text-amber-400 hover:text-amber-300 font-semibold transition-colors inline-flex items-center gap-1 group"
              >
                <span>Request Access</span>
                <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </button>
            </div>
          </div>
        ) : (
          /* ================= 3. REQUEST ACCESS VIEW ================= */
          <div className="w-full max-w-xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 sm:p-8">
            <div className="mb-6 flex items-start justify-between gap-4 pb-4 border-b border-slate-800">
              <div>
                <h2 className="text-lg font-bold text-slate-100 tracking-tight">
                  Access Clearance Request
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Submit official credentials for administrator security review.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setViewMode("signin");
                  setReqError(null);
                }}
                className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-slate-100 transition-colors shrink-0"
                title="Return to Sign In"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
            </div>

            {reqError && (
              <div className="p-3.5 rounded-xl mb-5 bg-rose-500/10 border border-rose-500/30 text-xs text-rose-300 flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <span className="text-[11px] leading-normal">{reqError}</span>
              </div>
            )}

            <form onSubmit={handleRequestSubmit} className="space-y-5">
              {/* Section 1: IDENTITY */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-300 uppercase tracking-wider">
                  <User className="w-3.5 h-3.5 text-amber-400" />
                  <span>1. Identity</span>
                </div>

                <div>
                  <label htmlFor="req-fullname" className="block text-xs font-semibold text-slate-300 mb-1">
                    Full Name <span className="text-amber-400">*</span>
                  </label>
                  <input
                    id="req-fullname"
                    type="text"
                    required
                    value={reqFullName}
                    onChange={(e) => setReqFullName(e.target.value)}
                    placeholder="e.g. Officer Vikramaditya Rathore"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-amber-500 transition-colors"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="req-email" className="block text-xs font-semibold text-slate-300 mb-1">
                      Official Email <span className="text-amber-400">*</span>
                    </label>
                    <input
                      id="req-email"
                      type="email"
                      required
                      value={reqEmail}
                      onChange={(e) => setReqEmail(e.target.value)}
                      placeholder="officer@agency.gov.in"
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-amber-500 font-mono transition-colors"
                    />
                  </div>
                  <div>
                    <label htmlFor="req-badge" className="block text-xs font-semibold text-slate-300 mb-1">
                      Employee / Badge ID <span className="text-amber-400">*</span>
                    </label>
                    <input
                      id="req-badge"
                      type="text"
                      required
                      value={reqBadgeId}
                      onChange={(e) => setReqBadgeId(e.target.value)}
                      placeholder="e.g. NCB-SIT-774"
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-amber-500 font-mono transition-colors"
                    />
                  </div>
                </div>
              </div>

              {/* Section 2: ORGANIZATION */}
              <div className="space-y-3 pt-3 border-t border-slate-800">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-300 uppercase tracking-wider">
                  <Building className="w-3.5 h-3.5 text-amber-400" />
                  <span>2. Organization</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="req-agency" className="block text-xs font-semibold text-slate-300 mb-1">
                      Agency <span className="text-amber-400">*</span>
                    </label>
                    <input
                      id="req-agency"
                      type="text"
                      required
                      value={reqAgency}
                      onChange={(e) => setReqAgency(e.target.value)}
                      placeholder="e.g. Narcotics Control Bureau"
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-amber-500 transition-colors"
                    />
                  </div>
                  <div>
                    <label htmlFor="req-dept" className="block text-xs font-semibold text-slate-300 mb-1">
                      Department / Unit <span className="text-amber-400">*</span>
                    </label>
                    <input
                      id="req-dept"
                      type="text"
                      required
                      value={reqDepartment}
                      onChange={(e) => setReqDepartment(e.target.value)}
                      placeholder="e.g. Special Operations Unit"
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-amber-500 transition-colors"
                    />
                  </div>
                </div>
              </div>

              {/* Section 3: ACCESS REQUEST */}
              <div className="space-y-3 pt-3 border-t border-slate-800">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-300 uppercase tracking-wider">
                  <Briefcase className="w-3.5 h-3.5 text-amber-400" />
                  <span>3. Access Request</span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-2">
                    Requested Operational Role <span className="text-amber-400">*</span>
                  </label>

                  <div className="grid grid-cols-1 gap-2.5">
                    {/* Role Option 1: Lead Investigator */}
                    <label
                      className={`p-3 rounded-xl border text-left cursor-pointer transition-all flex items-start gap-3 ${
                        reqRole === "LEAD_INVESTIGATOR"
                          ? "bg-amber-500/10 border-amber-500/40 text-slate-100 shadow-sm"
                          : "bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700"
                      }`}
                    >
                      <input
                        type="radio"
                        name="requested_role"
                        value="LEAD_INVESTIGATOR"
                        checked={reqRole === "LEAD_INVESTIGATOR"}
                        onChange={() => setReqRole("LEAD_INVESTIGATOR")}
                        className="mt-1 text-amber-500 focus:ring-amber-500"
                      />
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-xs text-amber-300">
                            LEAD INVESTIGATOR
                          </span>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-400">
                            COMMAND
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 mt-1 leading-normal">
                          Investigation command, network analysis, threat radar, case management and restricted AI Copilot.
                        </p>
                      </div>
                    </label>

                    {/* Role Option 2: Forensic Investigator */}
                    <label
                      className={`p-3 rounded-xl border text-left cursor-pointer transition-all flex items-start gap-3 ${
                        reqRole === "FORENSIC_INVESTIGATOR"
                          ? "bg-emerald-500/10 border-emerald-500/40 text-slate-100 shadow-sm"
                          : "bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700"
                      }`}
                    >
                      <input
                        type="radio"
                        name="requested_role"
                        value="FORENSIC_INVESTIGATOR"
                        checked={reqRole === "FORENSIC_INVESTIGATOR"}
                        onChange={() => setReqRole("FORENSIC_INVESTIGATOR")}
                        className="mt-1 text-emerald-500 focus:ring-emerald-500"
                      />
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-xs text-emerald-300">
                            FORENSIC INVESTIGATOR
                          </span>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-400">
                            LAB / INTAKE
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 mt-1 leading-normal">
                          Evidence ingestion, forensic analysis, CDR/IMEI analysis and chain-of-custody operations.
                        </p>
                      </div>
                    </label>

                    {/* Non-selectable Admin Governance Note */}
                    <div className="p-2.5 rounded-xl bg-slate-950/40 border border-slate-800/80 text-[11px] text-slate-400 flex items-start gap-2">
                      <Layers className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-semibold text-slate-300">ADMIN: </span>
                        <span>
                          User approval, role assignment, access control and system governance.
                          (Provisioned internally by system administrators; self-registration is restricted).
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <label htmlFor="req-reason" className="block text-xs font-semibold text-slate-300 mb-1">
                    Reason / Operational Justification
                  </label>
                  <textarea
                    id="req-reason"
                    rows={2}
                    value={reqReason}
                    onChange={(e) => setReqReason(e.target.value)}
                    placeholder="Specify case assignment, operational jurisdiction, or interdiction tasks..."
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-amber-500 transition-colors"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting || !isRequestFormValid}
                className="w-full mt-2 py-3 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs sm:text-sm transition-all shadow-md shadow-amber-500/10 flex items-center justify-center gap-2 active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <span className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                    <span>Submitting Request...</span>
                  </>
                ) : (
                  <>
                    <FileCheck className="w-4 h-4 stroke-[2.5]" />
                    <span>Submit Access Request</span>
                  </>
                )}
              </button>
            </form>

            <div className="mt-4 text-center">
              <button
                type="button"
                onClick={() => setViewMode("signin")}
                className="text-xs text-slate-400 hover:text-slate-200 transition-colors"
              >
                ← Return to Sign In
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Clean Enterprise Footer */}
      <footer className="border-t border-slate-800 bg-slate-950/95 backdrop-blur-md px-4 sm:px-8 py-3 text-xs text-slate-400 flex flex-col sm:flex-row items-center justify-between gap-2 z-10">
        <span>CRIM-INTEL OS • Restricted to Authorized Law Enforcement Personnel</span>
        <span className="font-mono text-[11px] text-slate-400">
          Section 65B Indian Evidence Act Compliant
        </span>
      </footer>
    </div>
  );
};
