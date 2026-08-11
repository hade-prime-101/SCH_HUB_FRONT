"use client";
import { useEffect, useState } from "react";
import { listReports, resolveReport } from "@/lib/api/community.api";
import type { Report } from "@/types/community";

export default function ReportsPage() {
  const [reports, setReports] = useState<Report[]>([]);

  useEffect(() => {
    listReports({ page: 1, limit: 50, resolved: false }).then((res) => setReports(res.data));
  }, []);

  const handleResolve = async (reportId: string) => {
    await resolveReport(reportId);
    setReports((prev) => prev.filter((r) => r.id !== reportId));
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Reported Content</h1>
      {reports.map((r) => (
        <div key={r.id} className="bg-white shadow rounded p-4 mb-3 flex justify-between items-center">
          <div>
            <p className="font-medium">{r.type} reported</p>
            <p className="text-sm text-gray-600">Reason: {r.reason}</p>
            <p className="text-xs text-gray-400">ID: {r.targetId}</p>
          </div>
          <button onClick={() => handleResolve(r.id)} className="bg-green-600 text-white px-3 py-1 rounded">
            Resolve
          </button>
        </div>
      ))}
    </div>
  );
}