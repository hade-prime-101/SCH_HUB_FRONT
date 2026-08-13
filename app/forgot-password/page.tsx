"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, Mail } from "lucide-react";
import { authApi } from "@/lib/api/auth";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setError(null);
    setIsLoading(true);

    try {
      await authApi.forgotPassword(email.trim());
      // Navigate to OTP page — pass email so it can be pre-filled
      router.push(
        `/verify-otp?email=${encodeURIComponent(email.trim())}&type=password-reset`,
      );
    } catch (err: any) {
      setError(err?.message || "Failed to send OTP. Please try again.");
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-background px-6 py-8 flex flex-col">
      <button
        onClick={() => router.back()}
        className="text-foreground mb-16"
        aria-label="Go back"
      >
        <ChevronLeft className="w-6 h-6" />
      </button>

      <div className="flex flex-col items-center text-center">
        <div className="w-16 h-16 rounded-lg bg-primary/10 flex items-center justify-center mb-6">
          <Mail className="w-7 h-7 text-primary" />
        </div>
        <h1 className="text-2xl font-bold text-foreground mb-2">
          Forgot Password?
        </h1>
        <p className="text-muted-foreground mb-8">
          Enter your email to receive a verification code
        </p>
      </div>

      <form onSubmit={handleSubmit} noValidate>
        <div className="relative mb-6">
          <Mail className="w-5 h-5 text-muted-foreground absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            type="email"
            placeholder="Email address"
            value={email}
            onChange={(e) => { setEmail(e.target.value); setError(null); }}
            required
            disabled={isLoading}
            autoComplete="email"
            className="w-full rounded-lg bg-muted border border-border pl-12 pr-4 py-4 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary disabled:opacity-60"
          />
        </div>

        {error && (
          <p className="text-sm text-destructive mb-4 text-center">{error}</p>
        )}

        <button
          type="submit"
          disabled={isLoading || !email.trim()}
          className="w-full rounded-lg bg-primary py-4 text-primary-foreground font-semibold shadow-md hover:shadow-lg hover:bg-primary/90 disabled:opacity-60 disabled:cursor-not-allowed transition"
        >
          {isLoading ? "Sending…" : "Send OTP"}
        </button>
      </form>

      <p className="text-center text-muted-foreground text-sm mt-8">
        Remember your password?{" "}
        <button
          type="button"
          onClick={() => router.push("/login")}
          className="font-semibold text-primary hover:text-primary/80"
        >
          Sign in
        </button>
      </p>
    </div>
  );
}
