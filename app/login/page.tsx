"use client";

import { useState, useEffect, Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { MdFingerprint } from "react-icons/md";
import { MdCheckCircle } from "react-icons/md";
import { icons } from "@/types/icons";
import { useAuth } from "@/lib/hooks/useAuth";
import { authApi } from "@/lib/api/auth";
import { LoginForm } from "@/components/shared/LoginForm";
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton";

function LoginPageContent() {
  const { login, loading: authLoading, error: authError, isAuthenticated } = useAuth();
  const searchParams = useSearchParams();
  const resetSuccess = searchParams.get("reset") === "success";

  const [isBiometricAvailable, setIsBiometricAvailable] = useState(false);
  const [isMobileDevice, setIsMobileDevice] = useState<boolean>(false);
  const [biometricError, setBiometricError] = useState<string | null>(null);
  const [biometricLoading, setBiometricLoading] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(
    authError || null,
  );
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  // Detect mobile device and biometric availability on mount
  useEffect(() => {
    checkMobileDevice();
    checkBiometricAvailability();
    setIsCheckingAuth(false);
  }, []);

  // Redirect already-authenticated users away from the login page
  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      const redirect = localStorage.getItem("dashboard_redirect");
      const destination =
        redirect === "admin_dashboard"       ? "/admin" :
        redirect === "super_admin_dashboard" ? "/super-admin" :
        "/dashboard";
      window.location.replace(destination);
    }
  }, [isAuthenticated, authLoading]);

  // Update login error when auth error changes
  useEffect(() => {
    if (authError) {
      setLoginError(authError);
    }
  }, [authError]);

  const checkMobileDevice = () => {
    const userAgent =
      navigator.userAgent || navigator.vendor || (window as any).opera;
    const isMobile =
      /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(
        userAgent.toLowerCase(),
      ) ||
      /iPad|iPhone|iPod/.test(userAgent) ||
      (navigator.maxTouchPoints > 0 && navigator.maxTouchPoints > 2);

    setIsMobileDevice(isMobile);
  };

  const checkBiometricAvailability = async () => {
    try {
      if (!window.PublicKeyCredential) {
        return;
      }

      const available =
        await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();

      if (available) {
        setIsBiometricAvailable(true);
        setBiometricError(null);
      }
    } catch (error) {
      console.error("Biometric availability check error:", error);
    }
  };

  const handleBiometricAuth = async () => {
    if (!isMobileDevice || !isBiometricAvailable) {
      setBiometricError(
        "Biometric authentication is not available on this device",
      );
      return;
    }

    setBiometricLoading(true);
    setBiometricError(null);

    try {
      const storedCredentials = localStorage.getItem("biometric_credentials");

      if (!storedCredentials) {
        setBiometricError(
          "No biometric credentials registered. Please log in with email and password first.",
        );
        setBiometricLoading(false);
        return;
      }

      let credentialIds: any[] = [];
      try {
        credentialIds = JSON.parse(storedCredentials);
      } catch (e) {
        setBiometricError(
          "Invalid stored credentials. Please log in with email and password again.",
        );
        localStorage.removeItem("biometric_credentials");
        setBiometricLoading(false);
        return;
      }

      if (credentialIds.length === 0) {
        setBiometricError(
          "No biometric credentials found. Please register first.",
        );
        setBiometricLoading(false);
        return;
      }

      // Get challenge from server
      const challengeResponse = await fetch("/api/auth/biometric-challenge", {
        method: "POST",
      });

      if (!challengeResponse.ok) {
        setBiometricError("Failed to initiate biometric authentication");
        setBiometricLoading(false);
        return;
      }

      const { challenge } = await challengeResponse.json();
      const decodedChallenge = new Uint8Array(
        atob(challenge)
          .split("")
          .map((c) => c.charCodeAt(0)),
      );

      // Prepare assertion options
      const assertionOptions = {
        challenge: decodedChallenge,
        allowCredentials: credentialIds.map((id: string) => ({
          id: new Uint8Array(
            atob(id)
              .split("")
              .map((c) => c.charCodeAt(0)),
          ),
          type: "public-key" as const,
          transports: ["internal" as const],
        })),
        userVerification: "preferred" as const,
        timeout: 60000,
      };

      // Trigger biometric authentication
      const assertion = (await navigator.credentials.get({
        publicKey: assertionOptions,
      })) as any;

      if (assertion) {
        // Verify with backend
        const verifyResponse = await fetch("/api/auth/biometric-verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: btoa(
              String.fromCharCode.apply(
                null,
                Array.from(new Uint8Array(assertion.id)),
              ),
            ),
            clientDataJSON: btoa(
              String.fromCharCode.apply(
                null,
                Array.from(new Uint8Array(assertion.response.clientDataJSON)),
              ),
            ),
            authenticatorData: btoa(
              String.fromCharCode.apply(
                null,
                Array.from(
                  new Uint8Array(assertion.response.authenticatorData),
                ),
              ),
            ),
            signature: btoa(
              String.fromCharCode.apply(
                null,
                Array.from(new Uint8Array(assertion.response.signature)),
              ),
            ),
          }),
        });

        if (verifyResponse.ok) {
          const data = await verifyResponse.json();
          // Sync access token to HTTP-only cookie so the splash auth check works
          if (data?.accessToken) {
            await fetch("/api/auth/set-cookie", {
              method:  "POST",
              headers: { "Content-Type": "application/json" },
              body:    JSON.stringify({ accessToken: data.accessToken }),
            });
            localStorage.setItem("auth_token", data.accessToken);
          }
          if (data?.refreshToken) {
            localStorage.setItem("refresh_token", data.refreshToken);
          }
          if (data?.user) {
            localStorage.setItem("auth_user", JSON.stringify(data.user));
          }
          if (data?.dashboardRedirect) {
            localStorage.setItem("dashboard_redirect", data.dashboardRedirect);
          }
          // Respect role-based redirect
          const destination =
            data?.dashboardRedirect === "admin_dashboard"       ? "/admin" :
            data?.dashboardRedirect === "super_admin_dashboard" ? "/super-admin" :
            "/dashboard";
          window.location.href = destination;
        } else {
          const errorData = await verifyResponse.json();
          setBiometricError(
            errorData.message || "Biometric authentication failed",
          );
        }
      }
    } catch (error: any) {
      if (error.name === "NotAllowedError") {
        setBiometricError(
          "Biometric authentication was cancelled or not recognized",
        );
      } else if (error.name === "InvalidStateError") {
        setBiometricError("No matching biometric credential found");
      } else if (error.name === "TimeoutError") {
        setBiometricError("Biometric authentication timeout. Please try again");
      } else if (error.name === "NotSupportedError") {
        setBiometricError(
          "Biometric authentication is not supported on this device",
        );
      } else if (error.name === "AbortError") {
        setBiometricError("Biometric authentication was aborted");
      } else if (error.name === "SecurityError") {
        setBiometricError(
          "Security error: Biometric authentication is not allowed in this context",
        );
      } else {
        setBiometricError(
          error.message || "Failed to authenticate with biometrics",
        );
      }
      console.error("Biometric auth error:", error);
    } finally {
      setBiometricLoading(false);
    }
  };

  const handleLoginSubmit = async (email: string, password: string) => {
    setLoginError(null);
    try {
      const redirect = await login(email, password);
      // Route to the correct dashboard based on the user's role
      const destination =
        redirect === "course_rep_dashboard"           ? "/dashboard" :
        redirect === "event_orchestrator_dashboard"   ? "/dashboard" :
        redirect === "house_agent_dashboard"          ? "/dashboard" :
        redirect === "admin_dashboard"                ? "/admin" :
        redirect === "super_admin_dashboard"          ? "/super-admin" :
        "/dashboard";
      window.location.href = destination;
    } catch (error: any) {
      const msg: string = error.message || "";
      // If the backend signals the email is not yet verified, redirect to the
      // OTP verification page so the user can request a new code and verify.
      const isUnverified =
        msg.toLowerCase().includes("not verified") ||
        msg.toLowerCase().includes("email not verified") ||
        msg.toLowerCase().includes("verify your email") ||
        msg.toLowerCase().includes("account not verified") ||
        error.status === 403;

      if (isUnverified) {
        window.location.href = `/verify-otp?email=${encodeURIComponent(email)}&type=email-verification`;
        return;
      }

      setLoginError(msg || "Login failed. Please check your credentials.");
    }
  };

  // ── Dev bypass — skip auth when no backend is running ──────────────────────
  const isDev = process.env.NEXT_PUBLIC_API_URL?.includes("localhost");
  function handleDevBypass() {
    localStorage.setItem("auth_token", "dev-token");
    localStorage.setItem("refresh_token", "dev-refresh");
    localStorage.setItem(
      "auth_user",
      JSON.stringify({
        id: "dev-user",
        fullName: "Sarah Chen",
        email: "sarah@example.com",
        role: "STUDENT",
        level: "300",
      }),
    );
    localStorage.setItem("dashboard_redirect", "mobile_app");
    // Sync to HTTP-only cookie so the splash auth check works in dev
    fetch("/api/auth/set-cookie", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ accessToken: "dev-token" }),
    }).finally(() => { window.location.href = "/dashboard"; });
  }

  if (isCheckingAuth || authLoading) {
    return <LoadingSkeleton />;
  }

  return (
    <div className="min-h-screen w-full bg-[linear-gradient(135deg,#f8fafc_0%,#eef2ff_100%)] px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-6xl flex-col overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_20px_50px_rgba(15,23,42,0.08)] lg:flex-row">
        <div className="flex flex-1 flex-col justify-center bg-slate-50/70 px-6 py-10 sm:px-10 lg:px-12">
          <div className="mb-8">
            <Image
              src={icons.Logo}
              alt="Loopz"
              width={180}
              height={64}
              className="h-16 w-auto object-contain"
              priority
            />
          </div>

          <div className="mb-6">
            <h1 className="text-[24px] font-bold text-slate-900">Sign in</h1>
            <p className="mt-1 text-[14px] text-slate-500">Continue to your account</p>
          </div>

          {/* Password reset success banner */}
          {resetSuccess && (
            <div className="mb-4 flex items-center gap-2 rounded-[12px] border border-emerald-200 bg-emerald-50 px-4 py-3">
              <MdCheckCircle className="h-5 w-5 shrink-0 text-emerald-500" />
              <p className="text-sm font-medium text-emerald-700">
                Password reset successful. Sign in with your new password.
              </p>
            </div>
          )}

          <LoginForm
            onSubmit={handleLoginSubmit}
            isLoading={authLoading}
            error={loginError}
          />

          {isMobileDevice && (
            <>
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-200"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="bg-white px-2 text-slate-500">or</span>
                </div>
              </div>

              {biometricError && biometricError !== "" && (
                <div className="mb-4 rounded-[12px] border border-amber-200 bg-amber-50 p-3">
                  <p className="text-xs text-amber-700">{biometricError}</p>
                </div>
              )}

              <button
                type="button"
                onClick={handleBiometricAuth}
                disabled={!isBiometricAvailable || biometricLoading}
                className={`flex w-full items-center justify-center gap-2 rounded-[12px] border px-4 py-3 font-semibold transition ${
                  isBiometricAvailable
                    ? "border-indigo-200 bg-white text-indigo-600 hover:border-indigo-300 hover:bg-indigo-50"
                    : "cursor-not-allowed border-slate-200 text-slate-400"
                }`}
              >
                {biometricLoading ? (
                  <>
                    <MdFingerprint className="h-5 w-5 animate-spin" />
                    Authenticating...
                  </>
                ) : (
                  <>
                    <MdFingerprint className="h-5 w-5" />
                    Use biometrics
                  </>
                )}
              </button>

              {!isBiometricAvailable && (
                <p className="mt-2 text-center text-xs text-slate-500">
                  Biometric authentication not available on this device
                </p>
              )}
            </>
          )}

          <div className="mt-6 text-center">
            <p className="text-sm text-slate-600">
              Don&apos;t have an account?{" "}
              <Link href="/register" className="font-semibold text-indigo-600 transition hover:text-indigo-700">
                Sign Up
              </Link>
            </p>
          </div>
        </div>

        <div className="hidden flex-1 items-center justify-center bg-indigo-600 p-10 lg:flex">
          <div className="max-w-sm rounded-[24px] border border-white/20 bg-white/10 p-8 text-white backdrop-blur-sm">
            <p className="text-sm uppercase tracking-[0.3em] text-indigo-100">SchHub</p>
            <h2 className="mt-3 text-3xl font-semibold">Stay connected to your school life.</h2>
            <p className="mt-4 text-sm leading-6 text-indigo-100">
              Manage classes, updates, and communication from one place with a secure sign-in experience.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoadingSkeleton />}>
      <LoginPageContent />
    </Suspense>
  );
}
