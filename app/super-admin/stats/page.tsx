"use client";
import { useEffect, useState } from "react";
import { getPlatformStats, getSchoolStats } from "@/lib/api/super-admin.api";
import type { PlatformStats, SchoolStats } from "@/types/super-admin";

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-white rounded p-4 shadow text-center">
      <p className="text-gray-500 text-sm">{label}</p>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  );
}

export default function StatsPage() {
  const [platform, setPlatform] = useState<PlatformStats | null>(null);
  const [school, setSchool] = useState<SchoolStats | null>(null);

  useEffect(() => {
    getPlatformStats().then(setPlatform);
    getSchoolStats().then(setSchool);
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Analytics</h1>
      <h2 className="text-lg font-semibold mb-2">Platform Stats</h2>
      {platform ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <StatCard label="Total Users" value={platform.totalUsers} />
          <StatCard label="Total Schools" value={platform.totalSchools} />
          <StatCard label="Total Materials" value={platform.totalMaterials} />
          <StatCard label="Total Quizzes" value={platform.totalQuizzes} />
        </div>
      ) : <p>Loading...</p>}
      <h2 className="text-lg font-semibold mb-2">Your School Stats</h2>
      {school ? (
        <div className="grid grid-cols-3 gap-4">
          <StatCard label="Users" value={school.totalUsers} />
          <StatCard label="Materials" value={school.totalMaterials} />
          <StatCard label="Quizzes" value={school.totalQuizzes} />
        </div>
      ) : <p>Loading...</p>}
    </div>
  );
}