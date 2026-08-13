"use client";

import { useState, useEffect, useCallback } from "react";
import { adminApi } from "@/lib/api/admin";
import { ClipboardList, AlertCircle, RefreshCw, Search, X, ChevronLeft, ChevronRight } from "lucide-react";

interface AuditLog {
  id:           string;
  action:       string;
  entity?:      string;
  entityId?:    string;
  createdAt:    string;
  performedBy?: { id: string; fullName: string; role?: string };
  metadata?:    Record<string, unknown>;
}

const ACTION_BADGE: Record<string, string> = {
  CREATE: "bg-emerald-100 text-emerald-700",
  UPDATE: "bg-accent text-primary",
  DELETE: "bg-destructive/10 text-destructive",
  LOGIN:  "bg-accent text-primary",
  BLOCK:  "bg-amber-100 text-amber-700",
};

function badge(action: string) {
  const key = Object.keys(ACTION_BADGE).find(k => action.toUpperCase().includes(k));
  return key ? ACTION_BADGE[key] : "bg-muted text-muted-foreground";
}

function initials(name: string) {
  return name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
}

export default function AdminAuditLogsPage() {
  const [logs, setLogs]       = useState<AuditLog[]>([]);
  const [total, setTotal]     = useState(0);
  const [page, setPage]       = useState(1);
  const [search, setSearch]   = useState("");
  const [query, setQuery]     = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);
  const limit = 20;

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const params: Record<string, string> = { page: String(page), limit: String(limit) };
      if (query) params.search = query;
      const data: any = await adminApi.getSchoolAdminAuditLogs(params);
      const items = data?.items ?? data?.logs ?? (Array.isArray(data) ? data : []);
      setLogs(items);
      setTotal(data?.total ?? items.length);
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  }, [page, query]);

  useEffect(() => { load(); }, [load]);

  const pages = Math.max(1, Math.ceil(total / limit));

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setPage(1);
    setQuery(search);
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Audit Logs</h1>
          <p className="text-muted-foreground text-sm mt-1">All actions performed within your school</p>
        </div>
        <button onClick={load} disabled={loading} className="p-2 rounded-xl border border-border hover:bg-accent disabled:opacity-50 transition-colors">
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {/* Search */}
      <form onSubmit={handleSearch} className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search actions…"
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
          {search && (
            <button type="button" onClick={() => { setSearch(""); setQuery(""); setPage(1); }} className="absolute right-3 top-1/2 -translate-y-1/2">
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          )}
        </div>
        <button type="submit" className="px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity">Search</button>
      </form>

      {error && (
        <div className="bg-destructive/10 text-destructive rounded-xl p-4 flex items-center gap-2 text-sm">
          <AlertCircle className="w-4 h-4 shrink-0" /> {error}
        </div>
      )}

      {loading ? (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 8 }).map((_, i) => <div key={i} className="bg-card rounded-2xl p-4 h-16 animate-pulse" />)}
        </div>
      ) : logs.length === 0 ? (
        <div className="bg-card rounded-2xl p-10 flex flex-col items-center gap-3 text-center">
          <ClipboardList className="w-10 h-10 text-muted-foreground/30" />
          <p className="text-muted-foreground text-sm">No audit logs found.</p>
        </div>
      ) : (
        <div className="bg-card rounded-2xl overflow-hidden">
          <div className="divide-y divide-border">
            {logs.map(log => (
              <div key={log.id} className="flex items-start gap-4 px-5 py-4">
                {/* Performer avatar */}
                <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center text-xs font-bold text-foreground shrink-0">
                  {log.performedBy ? initials(log.performedBy.fullName) : "?"}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-0.5">
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-lg ${badge(log.action)}`}>
                      {log.action}
                    </span>
                    {log.entity && (
                      <span className="text-xs text-muted-foreground bg-muted rounded-lg px-2 py-0.5">
                        {log.entity}
                      </span>
                    )}
                  </div>
                  {log.performedBy && (
                    <p className="text-xs text-muted-foreground">by {log.performedBy.fullName}{log.performedBy.role ? ` (${log.performedBy.role})` : ""}</p>
                  )}
                </div>

                <p className="text-xs text-muted-foreground shrink-0 text-right">
                  {new Date(log.createdAt).toLocaleDateString([], { month: "short", day: "numeric" })}
                  <br />
                  {new Date(log.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Pagination */}
      {pages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">Page {page} of {pages} · {total} total</p>
          <div className="flex gap-2">
            <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="p-2 rounded-xl border border-border hover:bg-accent disabled:opacity-40 transition-colors">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button disabled={page === pages} onClick={() => setPage(p => p + 1)} className="p-2 rounded-xl border border-border hover:bg-accent disabled:opacity-40 transition-colors">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
