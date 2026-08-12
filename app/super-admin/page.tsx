"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { getPlatformStats } from "@/lib/api/super-admin.api";
import type { PlatformStats } from "@/types/super-admin";

export default function SuperAdminDashboard() {
  const [stats, setStats] = useState<PlatformStats | null>(null);

  useEffect(() => { getPlatformStats().then(setStats); }, []);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Platform Overview</h1>
      {stats ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard label="Total Users" value={stats.totalUsers} />
          <StatCard label="Total Schools" value={stats.totalSchools} />
          <StatCard label="Total Materials" value={stats.totalMaterials} />
          <StatCard label="Total Quizzes" value={stats.totalQuizzes} />
        </div>
      ) : (
        <p>Loading stats...</p>
      )}
      <div className="mt-8 grid grid-cols-2 gap-4">
        <Link href="/dashboard/super-admin/admins" className="bg-white shadow rounded p-4 hover:shadow-md">
          Manage Admins
        </Link>
        <Link href="/dashboard/super-admin/schools" className="bg-white shadow rounded p-4 hover:shadow-md">
          Manage Schools
        </Link>
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-white shadow rounded p-4">
      <p className="text-sm text-gray-500">{label}</p>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  );
}