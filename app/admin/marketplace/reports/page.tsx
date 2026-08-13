"use client";
import { useEffect, useState } from "react";
import { listReports, resolveReport } from "@/lib/api/marketplace.api";
import type { ContentReport } from "@/types/marketplace";

export default function AdminReportsPage() {
  const [reports, setReports] = useState<ContentReport[]>([]);

  useEffect(() => { listReports().then(setReports); }, []);

  const handleResolve = async (id: string) => {
    await resolveReport(id);
    setReports(prev => prev.filter(r => r.id !== id));
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Reports</h1>
      {reports.map(r => (
        <div key={r.id} className="bg-card shadow rounded p-4 mb-3 flex justify-between items-center">
          <div>
            <p className="font-medium">{r.targetType.toUpperCase()} - {r.targetId}</p>
            <p className="text-sm text-muted-foreground">Reason: {r.reason}</p>
            <p className="text-xs text-muted-foreground/70">Reported by {r.reporterId}</p>
          </div>
          <button onClick={() => handleResolve(r.id)} className="bg-success text-primary-foreground px-3 py-1 rounded">
            Resolve
          </button>
        </div>
      ))}
    </div>
  );
}