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
    <div className="min-h-screen w-full bg-white px-6 py-8 flex flex-col">
      <button
        onClick={() => router.back()}
        className="text-slate-700 mb-16"
        aria-label="Go back"
      >
        <ChevronLeft className="w-6 h-6" />
      </button>

      <div className="flex flex-col items-center text-center">
        <div className="w-16 h-16 rounded-2xl bg-indigo-50 flex items-center justify-center mb-6">
          <Mail className="w-7 h-7 text-indigo-500" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900 mb-2">
          Forgot Password?
        </h1>
        <p className="text-slate-500 mb-8">
          Enter your email to receive a verification code
        </p>
      </div>

      <form onSubmit={handleSubmit} noValidate>
        <div className="relative mb-6">
          <Mail className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            type="email"
            placeholder="Email address"
            value={email}
            onChange={(e) => { setEmail(e.target.value); setError(null); }}
            required
            disabled={isLoading}
            autoComplete="email"
            className="w-full rounded-2xl bg-slate-50 border border-slate-100 pl-12 pr-4 py-4 text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-400 disabled:opacity-60"
          />
        </div>

        {error && (
          <p className="text-sm text-red-500 mb-4 text-center">{error}</p>
        )}

        <button
          type="submit"
          disabled={isLoading || !email.trim()}
          className="w-full rounded-2xl bg-indigo-500 py-4 text-white font-semibold shadow-lg shadow-indigo-200 disabled:opacity-60 disabled:cursor-not-allowed transition"
        >
          {isLoading ? "Sending…" : "Send OTP"}
        </button>
      </form>

      <p className="text-center text-slate-500 text-sm mt-8">
        Remember your password?{" "}
        <button
          type="button"
          onClick={() => router.push("/login")}
          className="font-semibold text-indigo-600 hover:text-indigo-700"
        >
          Sign in
        </button>
      </p>
    </div>
  );
}
