"use client";

import { useState, useEffect, useCallback } from "react";
import { adminApi } from "@/lib/api/admin";
import {
  Building2, ShieldCheck, ShieldX, Clock, CheckCircle2, XCircle,
  AlertCircle, RefreshCw, Search, X, Loader2, Phone, MapPin,
} from "lucide-react";

type FilterStatus = "PENDING" | "APPROVED" | "REJECTED" | "ALL";

interface Agent {
  userId:          string;
  fullName?:       string;
  email?:          string;
  businessName:    string;
  businessAddress: string;
  phoneNumber:     string;
  status?:         string;
  createdAt?:      string;
}

const STATUS_BADGE: Record<string, string> = {
  PENDING:  "bg-amber-100 text-amber-700",
  APPROVED: "bg-emerald-100 text-emerald-700",
  REJECTED: "bg-destructive/10 text-destructive",
};

function initials(name: string) {
  return name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
}

function timeAgo(iso?: string) {
  if (!iso) return "";
  const d = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
  return d === 0 ? "today" : d === 1 ? "yesterday" : `${d}d ago`;
}

export default function AdminAgentsPage() {
  const [agents, setAgents]       = useState<Agent[]>([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState<string | null>(null);
  const [filter, setFilter]       = useState<FilterStatus>("ALL");
  const [search, setSearch]       = useState("");
  const [actionId, setActionId]   = useState<string | null>(null);
  const [confirmRevoke, setConfirm] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const status = filter === "ALL" ? undefined : filter as "PENDING" | "APPROVED" | "REJECTED";
      const data = await adminApi.getSchoolAdminAgents(status);
      setAgents(Array.isArray(data) ? data : []);
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  }, [filter]);

  useEffect(() => { load(); }, [load]);

  async function handleRevoke(userId: string) {
    setActionId(userId);
    try {
      await adminApi.revokeAgent(userId);
      setAgents(p => p.map(a => a.userId === userId ? { ...a, status: "REJECTED" } : a));
      setConfirm(null);
    } catch (e: any) { setError(e.message); }
    finally { setActionId(null); }
  }

  const visible = agents.filter(a =>
    !search.trim() ||
    a.businessName.toLowerCase().includes(search.toLowerCase()) ||
    (a.fullName?.toLowerCase().includes(search.toLowerCase()) ?? false)
  );

  const FILTERS: FilterStatus[] = ["ALL", "PENDING", "APPROVED", "REJECTED"];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">House Agents</h1>
          <p className="text-muted-foreground text-sm mt-1">Manage verified accommodation agents in your school</p>
        </div>
        <button onClick={load} disabled={loading} className="p-2 rounded-xl border border-border hover:bg-accent disabled:opacity-50 transition-colors">
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {/* Filter chips */}
      <div className="flex gap-2 flex-wrap">
        {FILTERS.map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
              filter === f ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-accent"
            }`}
          >
            {f === "ALL" ? "All" : f.charAt(0) + f.slice(1).toLowerCase()}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search agents…"
          className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        />
        {search && (
          <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2">
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        )}
      </div>

      {error && (
        <div className="bg-destructive/10 text-destructive rounded-xl p-4 flex items-center gap-2 text-sm">
          <AlertCircle className="w-4 h-4 shrink-0" /> {error}
        </div>
      )}

      {loading ? (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 5 }).map((_, i) => <div key={i} className="bg-card rounded-2xl p-5 h-24 animate-pulse" />)}
        </div>
      ) : visible.length === 0 ? (
        <div className="bg-card rounded-2xl p-10 flex flex-col items-center gap-3 text-center">
          <Building2 className="w-10 h-10 text-muted-foreground/30" />
          <p className="text-muted-foreground text-sm">{search ? "No agents match your search." : "No agents found."}</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {visible.map(agent => (
            <div key={agent.userId} className="bg-card rounded-2xl p-5">
              <div className="flex items-start gap-3 mb-3">
                <div className="w-11 h-11 rounded-full bg-accent flex items-center justify-center text-sm font-bold text-primary shrink-0">
                  {initials(agent.fullName ?? agent.businessName)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-foreground">{agent.fullName ?? "—"}</p>
                  <p className="text-sm text-muted-foreground">{agent.businessName}</p>
                </div>
                <div className="flex flex-col items-end gap-1 shrink-0">
                  {agent.status && (
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-lg ${STATUS_BADGE[agent.status] ?? "bg-muted text-muted-foreground"}`}>
                      {agent.status}
                    </span>
                  )}
                  {agent.createdAt && (
                    <span className="text-xs text-muted-foreground">{timeAgo(agent.createdAt)}</span>
                  )}
                </div>
              </div>

              <div className="flex flex-col gap-1 text-sm text-muted-foreground mb-4">
                <span className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 shrink-0" />{agent.businessAddress}</span>
                <span className="flex items-center gap-1.5"><Phone className="w-3.5 h-3.5 shrink-0" />{agent.phoneNumber}</span>
              </div>

              {agent.status === "APPROVED" && (
                confirmRevoke === agent.userId ? (
                  <div className="bg-destructive/5 border border-destructive/20 rounded-xl p-4">
                    <p className="text-sm font-semibold text-foreground mb-3">Revoke this agent's access?</p>
                    <div className="flex gap-3">
                      <button onClick={() => setConfirm(null)} className="flex-1 rounded-xl border border-border py-2.5 text-sm font-semibold text-foreground">Cancel</button>
                      <button
                        onClick={() => handleRevoke(agent.userId)}
                        disabled={actionId === agent.userId}
                        className="flex-1 rounded-xl bg-destructive text-white py-2.5 text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
                      >
                        {actionId === agent.userId ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldX className="w-4 h-4" />}
                        {actionId === agent.userId ? "Revoking…" : "Confirm Revoke"}
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => setConfirm(agent.userId)}
                    className="w-full flex items-center justify-center gap-2 border border-destructive/40 text-destructive font-semibold rounded-xl py-2.5 text-sm hover:bg-destructive/5 transition-colors"
                  >
                    <ShieldX className="w-4 h-4" /> Revoke Agent Access
                  </button>
                )
              )}

              {agent.status === "REJECTED" && (
                <div className="flex items-center gap-2 text-xs text-destructive bg-destructive/5 rounded-xl px-4 py-2.5">
                  <XCircle className="w-4 h-4 shrink-0" /> Access revoked
                </div>
              )}

              {agent.status === "PENDING" && (
                <div className="flex items-center gap-2 text-xs text-amber-600 bg-amber-50 rounded-xl px-4 py-2.5">
                  <Clock className="w-4 h-4 shrink-0" /> Pending review from marketplace admin
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
