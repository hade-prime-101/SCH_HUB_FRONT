"use client";

import { useCallback, useEffect, useState } from "react";
import { adminApi } from "@/lib/api/admin";
import { AlertCircle, ChevronLeft, ChevronRight, ClipboardList, Filter, RefreshCw } from "lucide-react";

interface AuditLog { id: string; action: string; createdAt: string; description?: string; performedBy?: { fullName?: string; email?: string }; }

const ACTIONS = ["ADMIN_CREATED", "ADMIN_DELETED", "ADMIN_DEACTIVATED", "ADMIN_REACTIVATED", "ADMIN_PASSWORD_RESET", "USER_BLOCKED", "USER_UNBLOCKED", "ROLE_ASSIGNED", "SCHOOL_CREATED", "SCHOOL_UPDATED", "MATERIAL_DELETED", "QUIZ_DELETED", "POST_DELETED", "LISTING_DELETED"];
const formatAction = (action: string) => action.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (letter) => letter.toUpperCase());

export default function SuperAdminAuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [action, setAction] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const limit = 20;

  const loadLogs = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const data: any = await adminApi.getAuditLogs({ page: String(page), limit: String(limit), ...(action ? { action } : {}) });
      const items = data?.items ?? data?.logs ?? (Array.isArray(data) ? data : []);
      setLogs(items); setTotal(data?.total ?? items.length);
    } catch (err: any) { setError(err.message || "Unable to load audit logs."); }
    finally { setLoading(false); }
  }, [action, page]);

  useEffect(() => { loadLogs(); }, [loadLogs]);
  const pages = Math.max(1, Math.ceil(total / limit));
  return <div className="flex flex-col gap-6">
    <div className="flex flex-wrap items-start justify-between gap-3"><div><h1 className="text-2xl font-bold text-foreground">Audit Logs</h1><p className="mt-1 text-sm text-muted-foreground">A record of platform-level administrative activity.</p></div><button onClick={loadLogs} disabled={loading} className="flex items-center gap-2 rounded-xl border border-border px-3 py-2 text-sm font-medium hover:bg-accent disabled:opacity-50"><RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} /> Refresh</button></div>
    <div className="flex flex-wrap items-center gap-2"><Filter className="h-4 w-4 text-muted-foreground" /><label htmlFor="audit-action" className="text-sm font-medium text-foreground">Action</label><select id="audit-action" value={action} onChange={(event) => { setAction(event.target.value); setPage(1); }} className="rounded-xl border border-border bg-card px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"><option value="">All actions</option>{ACTIONS.map((item) => <option key={item} value={item}>{formatAction(item)}</option>)}</select></div>
    {error && <div className="flex items-center gap-2 rounded-xl bg-destructive/10 p-4 text-sm text-destructive"><AlertCircle className="h-4 w-4 shrink-0" /> {error}</div>}
    <div className="overflow-hidden rounded-2xl bg-card"><div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground"><th className="px-4 py-3 font-medium">Action</th><th className="px-4 py-3 font-medium">Performed by</th><th className="px-4 py-3 font-medium">Details</th><th className="px-4 py-3 font-medium">Date</th></tr></thead><tbody>
      {loading ? Array.from({ length: 8 }).map((_, row) => <tr key={row} className="border-b border-border">{Array.from({ length: 4 }).map((_, cell) => <td key={cell} className="px-4 py-4"><div className="h-4 w-28 animate-pulse rounded bg-muted" /></td>)}</tr>) : logs.map((log) => <tr key={log.id} className="border-b border-border transition-colors last:border-0 hover:bg-muted/50"><td className="px-4 py-3"><span className="rounded-full bg-primary/10 px-2 py-1 text-xs font-semibold text-primary">{formatAction(log.action)}</span></td><td className="px-4 py-3"><p className="font-medium text-foreground">{log.performedBy?.fullName ?? "System"}</p>{log.performedBy?.email && <p className="text-xs text-muted-foreground">{log.performedBy.email}</p>}</td><td className="max-w-xs px-4 py-3 text-muted-foreground">{log.description ?? "—"}</td><td className="whitespace-nowrap px-4 py-3 text-xs text-muted-foreground">{new Date(log.createdAt).toLocaleString()}</td></tr>)}
    </tbody></table></div>{!loading && logs.length === 0 && <div className="flex flex-col items-center gap-2 py-12 text-center text-sm text-muted-foreground"><ClipboardList className="h-5 w-5" /> No audit logs match this filter.</div>}</div>
    {!loading && total > 0 && <div className="flex items-center justify-between"><p className="text-sm text-muted-foreground">{total} record{total === 1 ? "" : "s"} · Page {page} of {pages}</p><div className="flex gap-2"><button disabled={page === 1} onClick={() => setPage((current) => current - 1)} className="rounded-xl border border-border p-2 hover:bg-accent disabled:opacity-40" aria-label="Previous page"><ChevronLeft className="h-4 w-4" /></button><button disabled={page >= pages} onClick={() => setPage((current) => current + 1)} className="rounded-xl border border-border p-2 hover:bg-accent disabled:opacity-40" aria-label="Next page"><ChevronRight className="h-4 w-4" /></button></div></div>}
  </div>;
}
