"use client";

import { useState, useMemo, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ChevronLeft, Lock, Eye, EyeOff, Check, Circle, AlertTriangle } from "lucide-react";
import { authApi } from "@/lib/api/auth";

function ResetPasswordPageContent() {
  const router      = useRouter();
  const searchParams = useSearchParams();

  const email = searchParams.get("email") ?? "";
  const otp   = searchParams.get("otp")   ?? "";

  const [password, setPassword]         = useState("");
  const [confirm, setConfirm]           = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm]   = useState(false);
  const [isLoading, setIsLoading]       = useState(false);
  const [error, setError]               = useState<string | null>(null);

  // Guard: if required params are missing the user landed here incorrectly
  const missingParams = !email || !otp;

  const checks = useMemo(
    () => ({
      length:  password.length >= 8,
      case:    /[a-z]/.test(password) && /[A-Z]/.test(password),
      number:  /[0-9]/.test(password),
      special: /[^A-Za-z0-9]/.test(password),
    }),
    [password],
  );

  const score = Object.values(checks).filter(Boolean).length;
  const strengthLabel = ["Weak", "Fair", "Good", "Strong"][Math.max(score - 1, 0)] || "Weak";
  const strengthColor =
    score <= 1 ? "bg-red-400" :
    score <= 3 ? "bg-amber-400" :
                 "bg-emerald-400";

  const isValid = score === 4 && password === confirm && password.length > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid || missingParams) return;

    setError(null);
    setIsLoading(true);

    try {
      await authApi.resetPassword({ email, otp, password, confirmPassword: confirm });
      router.push("/login?reset=success");
    } catch (err: any) {
      setError(err?.message || "Failed to reset password. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // ── Missing params guard ──────────────────────────────────────────────────
  if (missingParams) {
    return (
      <div className="min-h-screen w-full bg-white px-6 py-8 flex flex-col items-center justify-center gap-5">
        <div className="w-16 h-16 rounded-2xl bg-red-50 flex items-center justify-center">
          <AlertTriangle className="w-7 h-7 text-red-500" />
        </div>
        <div className="text-center">
          <h1 className="text-xl font-bold text-slate-900 mb-2">Invalid Reset Link</h1>
          <p className="text-slate-500 text-sm max-w-xs">
            This link is missing required information. Please request a new password reset.
          </p>
        </div>
        <button
          onClick={() => router.push("/forgot-password")}
          className="w-full max-w-xs rounded-2xl bg-indigo-500 py-4 text-white font-semibold"
        >
          Request New Reset
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-white px-6 py-8 flex flex-col">
      <button
        onClick={() => router.back()}
        className="text-slate-700 mb-16"
        aria-label="Go back"
      >
        <ChevronLeft className="w-6 h-6" />
      </button>

      <div className="flex flex-col items-center text-center mb-8">
        <div className="w-16 h-16 rounded-2xl bg-indigo-50 flex items-center justify-center mb-6">
          <Lock className="w-7 h-7 text-indigo-500" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900 mb-2">
          Create New Password
        </h1>
        <p className="text-slate-500">Enter a new password for</p>
        <p className="text-slate-800 font-semibold text-sm mt-0.5">{email}</p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
        {/* New password */}
        <div className="relative">
          <Lock className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => { setPassword(e.target.value); setError(null); }}
            placeholder="New password"
            autoComplete="new-password"
            disabled={isLoading}
            className="w-full rounded-2xl bg-slate-50 border border-slate-100 pl-12 pr-12 py-4 text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-400 disabled:opacity-60"
          />
          <button
            type="button"
            onClick={() => setShowPassword(v => !v)}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400"
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
          </button>
        </div>

        {/* Confirm password */}
        <div className="relative">
          <Lock className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            type={showConfirm ? "text" : "password"}
            value={confirm}
            onChange={(e) => { setConfirm(e.target.value); setError(null); }}
            placeholder="Confirm password"
            autoComplete="new-password"
            disabled={isLoading}
            className="w-full rounded-2xl bg-slate-50 border border-slate-100 pl-12 pr-12 py-4 text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-400 disabled:opacity-60"
          />
          <button
            type="button"
            onClick={() => setShowConfirm(v => !v)}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400"
            aria-label={showConfirm ? "Hide confirm password" : "Show confirm password"}
          >
            {showConfirm ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
          </button>
        </div>

        {/* Mismatch hint */}
        {confirm.length > 0 && password !== confirm && (
          <p className="text-sm text-red-500 -mt-2">Passwords do not match.</p>
        )}

        {/* Strength meter */}
        {password.length > 0 && (
          <div>
            <div className="flex gap-1.5 mb-2">
              {[0, 1, 2, 3].map(i => (
                <span
                  key={i}
                  className={`h-1.5 flex-1 rounded-full transition-colors ${
                    i < score ? strengthColor : "bg-slate-200"
                  }`}
                />
              ))}
            </div>
            <p className="text-sm font-medium text-slate-600 mb-3">{strengthLabel}</p>

            <div className="flex flex-col gap-1.5">
              {[
                { key: "length"  as const, label: "At least 8 characters" },
                { key: "case"    as const, label: "Uppercase and lowercase letters" },
                { key: "number"  as const, label: "At least one number" },
                { key: "special" as const, label: "At least one special character" },
              ].map(({ key, label }) => (
                <div key={key} className="flex items-center gap-2">
                  {checks[key]
                    ? <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                    : <Circle className="w-4 h-4 text-slate-300 shrink-0" />
                  }
                  <span className={`text-sm ${checks[key] ? "text-slate-600" : "text-slate-400"}`}>
                    {label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {error && (
          <p className="text-sm text-red-500 text-center">{error}</p>
        )}

        <button
          type="submit"
          disabled={!isValid || isLoading}
          className="w-full rounded-2xl bg-indigo-500 py-4 text-white font-semibold shadow-lg shadow-indigo-200 mt-2 disabled:opacity-60 disabled:cursor-not-allowed transition"
        >
          {isLoading ? "Resetting…" : "Reset Password"}
        </button>
      </form>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ResetPasswordPageContent />
    </Suspense>
  );
}
