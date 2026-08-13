// app/dashboard/super-admin/school-audit-logs/page.tsx
"use client";
import { useEffect, useState } from "react";
import { getSchoolAuditLogs } from "@/lib/api/super-admin.api";
import type { AuditLog } from "@/types/super-admin";

export default function SchoolAuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 20;

  useEffect(() => {
    getSchoolAuditLogs({ page, limit }).then((res) => {
      setLogs(res.data);
      setTotal(res.total);
    });
  }, [page]);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">School Audit Logs</h1>
      <table className="w-full bg-card shadow rounded">
        <thead className="bg-muted">
          <tr>
            <th className="p-2 text-left">Action</th>
            <th className="p-2 text-left">Actor</th>
            <th className="p-2 text-left">Date</th>
          </tr>
        </thead>
        <tbody>
          {logs.map((log) => (
            <tr key={log.id} className="border-t">
              <td className="p-2">{log.action}</td>
              <td className="p-2">{log.actorId}</td>
              <td className="p-2">{new Date(log.createdAt).toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="flex justify-between mt-4">
        <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="btn">Prev</button>
        <span>Page {page}</span>
        <button disabled={page * limit >= total} onClick={() => setPage((p) => p + 1)} className="btn">Next</button>
      </div>
    </div>
  );
}