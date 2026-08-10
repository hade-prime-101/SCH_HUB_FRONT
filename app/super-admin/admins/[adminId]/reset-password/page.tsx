"use client";

import { useState } from "react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import { ArrowLeft, Eye, EyeOff, Loader2, CheckCircle2, X, KeyRound } from "lucide-react";
import { adminApi } from "@/lib/api/admin";

function passwordStrength(pw: string): { label: string; color: string; width: string } {
  if (pw.length === 0) return { label: "", color: "bg-slate-200", width: "0%" };
  if (pw.length < 6)   return { label: "Weak",   color: "bg-rose-400",   width: "33%" };
  if (pw.length < 10)  return { label: "Fair",   color: "bg-amber-400",  width: "66%" };
  return                      { label: "Strong", color: "bg-emerald-500", width: "100%" };
}

export default function ResetAdminPasswordPage() {
  const router       = useRouter();
  const params       = useParams();
  const searchParams = useSearchParams();
  const adminId      = params?.adminId as string;
  const adminName    = searchParams.get("adminName") ?? "Admin";

  const [password,  setPassword]  = useState("");
  const [confirm,   setConfirm]   = useState("");
  const [showPw,    setShowPw]    = useState(false);
  const [showConf,  setShowConf]  = useState(false);
  const [loading,   setLoading]   = useState(false);
  const [success,   setSuccess]   = useState(false);
  const [error,     setError]     = useState<string | null>(null);

  const strength = passwordStrength(password);
  const mismatch = confirm.length > 0 && password !== confirm;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 8) { setError("Password must be at least 8 characters."); return; }
    if (password !== confirm) { setError("Passwords do not match."); return; }
    setLoading(true); setError(null);
    try {
      await adminApi.resetAdminPassword(adminId, password);
      setSuccess(true);
      setTimeout(() => router.back(), 2000);
    } catch (e: any) { setError(e.message || "Failed to reset password."); }
    finally { setLoading(false); }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-white px-4 pt-5 pb-4 flex items-center gap-3 border-b border-slate-100">
        <button onClick={() => router.back()} className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center shrink-0" aria-label="Go back">
          <ArrowLeft className="w-5 h-5 text-slate-700" />
        </button>
        <h1 className="text-xl font-bold text-slate-900">Reset Admin Password</h1>
      </div>

      <form onSubmit={handleSubmit} className="px-4 py-5 max-w-md mx-auto flex flex-col gap-4">

        {/* Admin name */}
        <div className="bg-white rounded-2xl shadow-sm px-5 py-4 flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center shrink-0">
            <KeyRound className="w-6 h-6 text-indigo-500" />
          </div>
          <div>
            <p className="font-bold text-slate-900">{adminName}</p>
            <p className="text-xs text-slate-400 mt-0.5">Setting a new password for this admin</p>
          </div>
        </div>

        {/* Error / success */}
        {error && (
          <div className="flex items-center justify-between bg-rose-50 text-rose-600 rounded-2xl px-4 py-3 text-sm font-medium">
            <span>{error}</span><button type="button" onClick={() => setError(null)}><X className="w-4 h-4" /></button>
          </div>
        )}
        {success && (
          <div className="flex items-center gap-3 bg-emerald-50 text-emerald-700 rounded-2xl px-4 py-3 text-sm font-medium">
            <CheckCircle2 className="w-5 h-5 shrink-0" /> Password reset successfully! Redirecting…
          </div>
        )}

        {/* New password */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-semibold text-slate-700">New Password *</label>
          <div className="relative">
            <input
              type={showPw ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              placeholder="Min. 8 characters"
              className="w-full px-4 py-3 pr-11 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
            />
            <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
              {showPw ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
          {password.length > 0 && (
            <div>
              <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden mt-1">
                <div className={`h-full rounded-full transition-all ${strength.color}`} style={{ width: strength.width }} />
              </div>
              <p className={`text-xs mt-1 font-medium ${strength.color.replace("bg-", "text-")}`}>{strength.label}</p>
            </div>
          )}
        </div>

        {/* Confirm password */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-semibold text-slate-700">Confirm Password *</label>
          <div className="relative">
            <input
              type={showConf ? "text" : "password"}
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              required
              placeholder="Re-enter password"
              className={`w-full px-4 py-3 pr-11 rounded-xl border text-sm focus:outline-none focus:ring-2 ${
                mismatch ? "border-rose-300 focus:ring-rose-300" : "border-slate-200 focus:ring-indigo-300"
              }`}
            />
            <button type="button" onClick={() => setShowConf(!showConf)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
              {showConf ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
          {mismatch && <p className="text-xs text-rose-500">Passwords do not match.</p>}
        </div>

        <button type="submit" disabled={loading || success}
          className="w-full rounded-2xl bg-indigo-500 py-4 font-bold text-white shadow-lg shadow-indigo-100 flex items-center justify-center gap-2 disabled:opacity-50 transition active:opacity-90">
          {loading ? <><Loader2 className="w-5 h-5 animate-spin" /> Resetting…</> : "Reset Password"}
        </button>
      </form>
    </div>
  );
}
