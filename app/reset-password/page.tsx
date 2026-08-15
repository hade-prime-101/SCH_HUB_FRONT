"use client";

import { useState, useMemo, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ChevronLeft, Lock, Eye, EyeOff, Check, Circle, AlertTriangle } from "lucide-react";
import { authApi } from "@/lib/api/auth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

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
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const strengthColor =
    score <= 1 ? "bg-destructive" :
    score <= 3 ? "bg-warning" :
                 "bg-success";

  const isValid = score === 4 && password === confirm && password.length > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid || missingParams) return;

    setError(null);
    setIsLoading(true);

    try {
      await authApi.resetPassword({ email, otp, password, confirmPassword: confirm });
      router.push("/login?reset=success");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      setError(err?.message || "Failed to reset password. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  if (missingParams) {
    return (
      <div className="min-h-screen w-full bg-background px-6 py-8 flex flex-col items-center justify-center gap-5">
        <Card className="max-w-sm w-full p-6 text-center">
          <div className="w-16 h-16 rounded-lg bg-destructive/10 flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-7 h-7 text-destructive" />
          </div>
          <h1 className="text-xl font-bold text-foreground mb-2">Invalid Reset Link</h1>
          <p className="text-muted-foreground text-sm max-w-xs mx-auto">
            This password reset link is missing, invalid, or has expired.
          </p>
          <div className="mt-6">
            <Button
              onClick={() => router.push("/forgot-password")}
              className="w-full"
            >
              Request New Reset
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-background px-6 py-8 flex flex-col">
      <button
        onClick={() => router.back()}
        className="text-foreground mb-16"
        aria-label="Go back"
      >
        <ChevronLeft className="w-6 h-6" />
      </button>

      <div className="flex flex-col items-center text-center mb-8">
        <div className="w-16 h-16 rounded-lg bg-primary/10 flex items-center justify-center mb-6">
          <Lock className="w-7 h-7 text-primary" />
        </div>
        <h1 className="text-2xl font-bold text-foreground mb-2">
          Create New Password
        </h1>
        <p className="text-muted-foreground">Enter a new password for</p>
        <p className="text-foreground font-semibold text-sm mt-0.5">{email}</p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
        <div className="relative">
          <Lock className="w-5 h-5 text-muted-foreground absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => { setPassword(e.target.value); setError(null); }}
            placeholder="New password"
            autoComplete="new-password"
            disabled={isLoading}
            className="w-full rounded-lg bg-muted border border-border pl-12 pr-12 py-4 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary disabled:opacity-60"
          />
          <button
            type="button"
            onClick={() => setShowPassword(v => !v)}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition"
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
          </button>
        </div>

        <div className="relative">
          <Lock className="w-5 h-5 text-muted-foreground absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            type={showConfirm ? "text" : "password"}
            value={confirm}
            onChange={(e) => { setConfirm(e.target.value); setError(null); }}
            placeholder="Confirm password"
            autoComplete="new-password"
            disabled={isLoading}
            className="w-full rounded-lg bg-muted border border-border pl-12 pr-12 py-4 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary disabled:opacity-60"
          />
          <button
            type="button"
            onClick={() => setShowConfirm(v => !v)}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition"
            aria-label={showConfirm ? "Hide confirm password" : "Show confirm password"}
          >
            {showConfirm ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
          </button>
        </div>

        {confirm.length > 0 && password !== confirm && (
          <p className="text-sm text-destructive -mt-2">Passwords do not match.</p>
        )}

        {password.length > 0 && (
          <div>
            <div className="flex gap-1.5 mb-2">
              {[0, 1, 2, 3].map(i => (
                <span
                  key={i}
                  className={`h-1.5 flex-1 rounded-full transition-colors ${
                    i < score
                      ? score <= 1 ? 'bg-destructive' :
                        score <= 3 ? 'bg-warning' :
                        'bg-success'
                      : 'bg-muted'
                  }`}
                />
              ))}
            </div>
            <p className="text-sm font-medium text-muted-foreground mb-3">{strengthLabel}</p>

            <div className="flex flex-col gap-1.5">
              {[
                { key: "length"  as const, label: "At least 8 characters" },
                { key: "case"    as const, label: "Uppercase and lowercase letters" },
                { key: "number"  as const, label: "At least one number" },
                { key: "special" as const, label: "At least one special character" },
              ].map(({ key, label }) => (
                <div key={key} className="flex items-center gap-2">
                  {checks[key]
                    ? <Check className="w-4 h-4 text-success shrink-0" />
                    : <Circle className="w-4 h-4 text-muted shrink-0" />
                  }
                  <span className={`text-sm ${checks[key] ? "text-muted-foreground" : "text-muted-foreground/60"}`}>
                    {label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {error && (
          <p className="text-sm text-destructive text-center">{error}</p>
        )}

        <button
          type="submit"
          disabled={!isValid || isLoading}
          className="w-full rounded-lg bg-primary py-4 text-primary-foreground font-semibold shadow-md hover:shadow-lg hover:bg-primary/90 mt-2 disabled:opacity-60 disabled:cursor-not-allowed transition"
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