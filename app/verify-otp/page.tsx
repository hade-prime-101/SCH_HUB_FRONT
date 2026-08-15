"use client";

import { useState, useRef, useEffect, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { ChevronLeft, ShieldCheck, AlertTriangle } from "lucide-react";
import { authApi } from "@/lib/api/auth";
import type { OtpType } from "@/types/auth";

const RESEND_COUNTDOWN = 45;

function VerifyOtpPageContent() {
  const router      = useRouter();
  const searchParams = useSearchParams();

  const email   = searchParams.get("email") ?? "";
  const rawType = searchParams.get("type")  ?? "";

  // Map URL param to backend OtpType
  const otpType: OtpType =
    rawType === "password-reset" ? "PASSWORD_RESET" : "EMAIL_VERIFICATION";

  const title    = otpType === "PASSWORD_RESET" ? "Reset Password" : "Verify Your Email";
  const subtitle = "Enter the 6-digit code sent to";

  const [digits, setDigits] = useState<string[]>(Array(6).fill(""));
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const [isLoading,  setIsLoading]  = useState(false);
  const [error,      setError]      = useState<string | null>(null);
  const [countdown,  setCountdown]  = useState(RESEND_COUNTDOWN);
  const [isResending,setIsResending]= useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Guard: missing email param ────────────────────────────────────────────
  const missingEmail = !email.trim();

  const startCountdown = useCallback(() => {
    setCountdown(RESEND_COUNTDOWN);
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) { clearInterval(timerRef.current!); return 0; }
        return prev - 1;
      });
    }, 1000);
  }, []);

  useEffect(() => {
    if (missingEmail) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    startCountdown();
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [startCountdown, missingEmail]);

  const handleChange = (index: number, value: string) => {
    const clean = value.replace(/[^0-9]/g, "").slice(-1);
    const next  = [...digits];
    next[index] = clean;
    setDigits(next);
    if (clean && index < 5) inputRefs.current[index + 1]?.focus();
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/[^0-9]/g, "").slice(0, 6);
    if (!pasted) return;
    const next = Array(6).fill("");
    pasted.split("").forEach((ch, i) => { next[i] = ch; });
    setDigits(next);
    inputRefs.current[Math.min(pasted.length, 5)]?.focus();
  };

  const handleVerify = async () => {
    const otp = digits.join("");
    if (otp.length < 6) { setError("Please enter the complete 6-digit code."); return; }

    setError(null);
    setIsLoading(true);

    try {
      await authApi.verifyOtp(email, otp, otpType);

      if (otpType === "PASSWORD_RESET") {
        router.push(
          `/reset-password?email=${encodeURIComponent(email)}&otp=${encodeURIComponent(otp)}`,
        );
      } else {
        // EMAIL_VERIFICATION — sync HTTP-only cookie so splash check works,
        // then go to dashboard. Tokens were stored at registration time.
        const storedToken = typeof window !== "undefined"
          ? localStorage.getItem("auth_token")
          : null;
        if (storedToken) {
          await fetch("/api/auth/set-cookie", {
            method:  "POST",
            headers: { "Content-Type": "application/json" },
            body:    JSON.stringify({ accessToken: storedToken }),
          }).catch(() => {});
        }
        router.push("/dashboard");
      }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      setError(err?.message || "Invalid or expired code. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    if (countdown > 0 || isResending) return;
    setIsResending(true);
    setError(null);
    try {
      await authApi.resendOtp(email, otpType);
      setDigits(Array(6).fill(""));
      inputRefs.current[0]?.focus();
      startCountdown();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      setError(err?.message || "Failed to resend code. Please try again.");
    } finally {
      setIsResending(false);
    }
  };

  const formattedCountdown = `00:${String(countdown).padStart(2, "0")}`;

  // ── Missing email guard — let user enter their email instead of dead end ──
  const [manualEmail, setManualEmail] = useState("");
  const [manualEmailError, setManualEmailError] = useState<string | null>(null);

  if (missingEmail) {
    return (
      <div className="min-h-screen w-full bg-background px-6 py-8 flex flex-col items-center justify-center gap-5">
        <div className="w-16 h-16 rounded-lg bg-primary flex items-center justify-center">
          <ShieldCheck className="w-7 h-7 text-primary-foreground" />
        </div>
        <div className="text-center">
          <h1 className="text-xl font-bold text-foreground mb-2">Verify Your Email</h1>
          <p className="text-muted-foreground text-sm max-w-xs">
            Enter your registered email address to receive a verification code.
          </p>
        </div>
        <div className="w-full max-w-xs flex flex-col gap-3">
          <input
            type="email"
            value={manualEmail}
            onChange={e => { setManualEmail(e.target.value); setManualEmailError(null); }}
            placeholder="your@email.com"
            className="w-full rounded-lg border-2 border-primary/20 bg-primary/5 px-4 py-4 text-foreground focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
          {manualEmailError && (
            <p className="text-destructive text-sm text-center">{manualEmailError}</p>
          )}
          <button
            onClick={async () => {
              if (!manualEmail.trim()) { setManualEmailError("Please enter your email."); return; }
              try {
                await authApi.resendOtp(manualEmail.trim(), "EMAIL_VERIFICATION");
                router.replace(`/verify-otp?email=${encodeURIComponent(manualEmail.trim())}&type=email-verification`);
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              } catch (e: any) {
                setManualEmailError(e?.message?.trim() || "Failed to send code. Please try again.");
              }
            }}
            className="w-full rounded-lg bg-primary py-4 text-primary-foreground font-semibold hover:bg-primary/90 transition"
          >
            Send Verification Code
          </button>
          <button
            onClick={() => router.push("/login")}
            className="w-full rounded-lg border border-border py-4 text-foreground font-semibold hover:bg-muted transition"
          >
            Back to Sign In
          </button>
        </div>
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
        <div className="w-16 h-16 rounded-lg bg-primary flex items-center justify-center mb-6">
          <ShieldCheck className="w-7 h-7 text-primary-foreground" />
        </div>
        <h1 className="text-2xl font-bold text-foreground mb-2">{title}</h1>
        <p className="text-muted-foreground">{subtitle}</p>
        <p className="text-foreground font-semibold">{email}</p>
      </div>

      <div className="flex justify-center gap-3 mb-6">
        {digits.map((digit, i) => (
          <input
            key={i}
            ref={el => { inputRefs.current[i] = el; }}
            value={digit}
            onChange={e => handleChange(i, e.target.value)}
            onKeyDown={e => handleKeyDown(i, e)}
            onPaste={i === 0 ? handlePaste : undefined}
            inputMode="numeric"
            maxLength={1}
            disabled={isLoading}
            aria-label={`OTP digit ${i + 1}`}
            className="w-12 h-14 rounded-lg border-2 border-primary/20 bg-primary/5 text-center text-xl font-bold text-foreground focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:opacity-60"
          />
        ))}
      </div>

      {error && (
        <p className="text-sm text-destructive mb-4 text-center">{error}</p>
      )}

      <p className="text-center text-muted-foreground mb-8">
        Didn&apos;t receive code?{" "}
        {countdown > 0 ? (
          <span className="text-primary font-medium">Resend in {formattedCountdown}</span>
        ) : (
          <button
            onClick={handleResend}
            disabled={isResending}
            className="text-primary font-medium hover:text-primary/80 disabled:opacity-60"
          >
            {isResending ? "Resending…" : "Resend"}
          </button>
        )}
      </p>

      <button
        onClick={handleVerify}
        disabled={isLoading || digits.join("").length < 6}
        className="w-full rounded-lg bg-primary py-4 text-primary-foreground font-semibold shadow-md hover:shadow-lg hover:bg-primary/90 disabled:opacity-60 disabled:cursor-not-allowed transition"
      >
        {isLoading ? "Verifying…" : "Verify"}
      </button>
    </div>
  );
}

export default function VerifyOtpPage() {
  return (
    <Suspense fallback={null}>
      <VerifyOtpPageContent />
    </Suspense>
  );
}
