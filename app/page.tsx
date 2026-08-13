"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

export default function SplashPage() {
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("auth_token");
    if (!token) {
      router.replace("/login");
      return;
    }

    let role: string | undefined;
    try {
      const userRaw = localStorage.getItem("auth_user");
      if (userRaw) role = JSON.parse(userRaw).role;
    } catch {}

    const redirect = localStorage.getItem("dashboard_redirect");
    const routeMap: Record<string, string> = {
      mobile_app:                    "/dashboard",
      course_rep_dashboard:          "/dashboard",
      event_orchestrator_dashboard:  "/dashboard",
      house_agent_dashboard:         "/dashboard",
      admin_dashboard:               "/admin",
      super_admin_dashboard:         "/super-admin",
    };

    if (role === "SUPER_ADMIN") {
      router.replace("/super-admin");
    } else if (role === "SCHOOL_ADMIN") {
      router.replace("/admin");
    } else {
      router.replace(routeMap[redirect ?? ""] ?? "/dashboard");
    }
  }, [router]);

  return (
    <div
      className="relative h-screen w-screen flex flex-col items-center justify-center"
      style={{ background: "linear-gradient(135deg, var(--primary) 0%, var(--primary) 50%, var(--primary) 100%)" }}
    >
      {/* Subtle radial glow behind logo */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 60% 40% at 50% 48%, rgba(255,255,255,0.12) 0%, transparent 70%)",
        }}
      />

      {/* Logo */}
      <div className="flex flex-col items-center gap-0 z-10">
        <Image
          src="/loopz-logo.png"
          alt="Loopz"
          width={260}
          height={120}
          priority
          className="drop-shadow-[0_0_32px_rgba(255,255,255,0.3)]"
          style={{ objectFit: "contain" }}
        />
      </div>

      {/* Spinner */}
      <div className="absolute bottom-[15%]">
        <div
          className="h-10 w-10 animate-spin rounded-full border-[3px] border-t-transparent"
          style={{ borderColor: "rgba(255,255,255,0.3)", borderTopColor: "transparent" }}
        />
      </div>

      {/* Footer */}
      <footer className="absolute bottom-6 text-sm" style={{ color: "rgba(255,255,255,0.35)" }}>
        Version 1.0.0
      </footer>
    </div>
  );
}
