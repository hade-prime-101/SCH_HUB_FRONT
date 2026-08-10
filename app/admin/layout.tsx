"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AdminSidebar from "@/components/admin/AdminSidebar";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("auth_token");
    if (!token) { router.replace("/login"); return; }
    try {
      const user = JSON.parse(localStorage.getItem("auth_user") ?? "{}");
      if (user?.role !== "SCHOOL_ADMIN" && user?.role !== "SUPER_ADMIN") {
        router.replace("/dashboard");
        return;
      }
    } catch {}
    setChecked(true);
  }, [router]);

  if (!checked) return null;

  return (
    <div className="flex min-h-screen bg-muted">
      <AdminSidebar />
      <main className="flex-1 lg:p-8 p-4 pt-18 lg:pt-8 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
