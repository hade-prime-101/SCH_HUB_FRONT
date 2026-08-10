"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import SuperAdminSidebar from "@/components/super-admin/SuperAdminSidebar";

export default function SuperAdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("auth_token");
    if (!token) { router.replace("/login"); return; }
    try {
      const user = JSON.parse(localStorage.getItem("auth_user") ?? "{}");
      if (user?.role !== "SUPER_ADMIN") {
        router.replace("/dashboard");
        return;
      }
    } catch {}
    setChecked(true);
  }, [router]);

  if (!checked) return null;

  return (
    <div className="flex min-h-screen bg-muted">
      <SuperAdminSidebar />
      <main className="flex-1 overflow-y-auto p-4 pt-20 lg:p-8">
        {children}
      </main>
    </div>
  );
}
