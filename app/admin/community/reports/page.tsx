// app/dashboard/admin/community/reports/page.tsx
"use client";

import { useEffect, useState } from "react";
import { listReports, resolveReport } from "@/lib/api/community.api";
import type { Report } from "@/types/community";

export default function AdminReportsPage() {
  const [reports, setReports] = useState<Report[]>([]);

  useEffect(() => {
    listReports({ page: 1, limit: 50, resolved: false }).then((res) =>
      setReports(res.data)
    );
  }, []);

  const handleResolve = async (reportId: string) => {
    await resolveReport(reportId);
    setReports((prev) => prev.filter((r) => r.id !== reportId));
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Resolved Reports</h1>
      {reports.length === 0 && <p className="text-muted-foreground">No pending reports.</p>}
      {reports.map((r) => (
        <div
          key={r.id}
          className="bg-card shadow rounded p-4 mb-3 flex justify-between items-center"
        >
          <div>
            <p className="font-medium">
              {r.type} ID: {r.targetId}
            </p>
            <p className="text-sm text-muted-foreground">Reason: {r.reason}</p>
            <p className="text-xs text-muted-foreground/70">Reported: {new Date(r.createdAt).toLocaleDateString()}</p>
          </div>
          <button
            onClick={() => handleResolve(r.id)}
            className="bg-success text-primary-foreground px-3 py-1 rounded text-sm"
          >
            Resolve
          </button>
        </div>
      ))}
    </div>
  );
}