"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft, ShieldCheck, UserCheck, UserX, Loader2, AlertTriangle, X,
  CheckCircle2, XCircle, RefreshCw,
} from "lucide-react";
import { marketplaceApi } from "@/lib/api/marketplace";
import { adminApi } from "@/lib/api/admin";

type StatusTab = "PENDING" | "APPROVED" | "REJECTED";

interface Agent {
  id?:             string;
  userId?:         string;
  user?:           { id: string; fullName: string; email: string };
  businessName?:   string;
  businessAddress?: string;
  phoneNumber?:    string;
  studentIdUrl?:   string;
  status?:         string;
  createdAt?:      string;
  fullName?:       string;
  email?:          string;
}

const TABS: StatusTab[] = ["PENDING", "APPROVED", "REJECTED"];

const TAB_STYLE: Record<StatusTab, string> = {
  PENDING:  "bg-amber-100 text-amber-700",
  APPROVED: "bg-emerald-100 text-emerald-700",
  REJECTED: "bg-rose-100 text-rose-600",
};

export default function AdminMarketplaceAgentsPage() {
  const router = useRouter();

  const [tab,      setTab]      = useState<StatusTab>("PENDING");
  const [agents,   setAgents]   = useState<Agent[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState<string | null>(null);
  const [acting,   setActing]   = useState<string | null>(null);
  const [rejectId, setRejectId] = useState<string | null>(null);
  const [rejectNote, setRejectNote] = useState("");

  async function load(status: StatusTab) {
    setLoading(true); setError(null);
    try {
      const data = await adminApi.getSchoolAdminAgents(status);
      setAgents(Array.isArray(data) ? (data as Agent[]) : []);
    } catch {
      // Fallback to marketplace pending list for PENDING tab
      try {
        if (status === "PENDING") {
          const data = await marketplaceApi.getPendingAgents();
          setAgents(Array.isArray(data) ? (data as Agent[]) : []);
        } else {
          setAgents([]);
        }
      } catch (e: any) {
        setError(e.message || "Failed to load agents.");
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(tab); }, [tab]);

  async function handleApprove(agent: Agent) {
    const uid = agent.userId ?? agent.user?.id ?? agent.id ?? "";
    setActing(uid); setError(null);
    try {
      await marketplaceApi.reviewAgent(uid, "APPROVED");
      setAgents((prev) => prev.filter((a) => (a.userId ?? a.user?.id ?? a.id) !== uid));
    } catch (e: any) { setError(e.message || "Failed to approve."); }
    finally { setActing(null); }
  }

  async function handleReject(agent: Agent) {
    const uid = agent.userId ?? agent.user?.id ?? agent.id ?? "";
    setActing(uid); setError(null);
    try {
      await marketplaceApi.reviewAgent(uid, "REJECTED", rejectNote);
      setAgents((prev) => prev.filter((a) => (a.userId ?? a.user?.id ?? a.id) !== uid));
      setRejectId(null); setRejectNote("");
    } catch (e: any) { setError(e.message || "Failed to reject."); }
    finally { setActing(null); }
  }

  async function handleRevoke(agent: Agent) {
    const uid = agent.userId ?? agent.user?.id ?? agent.id ?? "";
    setActing(uid); setError(null);
    try {
      await adminApi.revokeAgent(uid);
      setAgents((prev) => prev.filter((a) => (a.userId ?? a.user?.id ?? a.id) !== uid));
    } catch (e: any) { setError(e.message || "Failed to revoke."); }
    finally { setActing(null); }
  }

  function agentName(a: Agent) { return a.user?.fullName ?? a.fullName ?? "Unknown"; }
  function agentEmail(a: Agent) { return a.user?.email ?? a.email ?? "—"; }
  function agentUid(a: Agent) { return a.userId ?? a.user?.id ?? a.id ?? ""; }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-white px-4 pt-5 pb-4 flex items-center gap-3 border-b border-slate-100">
        <button onClick={() => router.back()} className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center shrink-0"><ArrowLeft className="w-5 h-5 text-slate-700" /></button>
        <h1 className="text-xl font-bold text-slate-900 flex-1">House Agent Applications</h1>
        <button onClick={() => load(tab)} className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center shrink-0"><RefreshCw className="w-4 h-4 text-slate-500" /></button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 px-4 py-3 bg-white border-b border-slate-100 overflow-x-auto">
        {TABS.map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`shrink-0 px-4 py-2 rounded-full text-sm font-bold transition ${tab === t ? TAB_STYLE[t] : "bg-slate-100 text-slate-500"}`}>
            {t}
          </button>
        ))}
      </div>

      <div className="px-4 py-4 max-w-2xl mx-auto flex flex-col gap-3">
        {error && (
          <div className="flex items-center justify-between bg-rose-50 text-rose-600 rounded-2xl px-4 py-3 text-sm font-medium">
            <span>{error}</span><button onClick={() => setError(null)}><X className="w-4 h-4" /></button>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-16"><Loader2 className="w-8 h-8 text-indigo-400 animate-spin" /></div>
        ) : agents.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm px-5 py-12 flex flex-col items-center gap-3 text-center">
            <ShieldCheck className="w-10 h-10 text-slate-200" />
            <p className="text-slate-400 font-medium">No {tab.toLowerCase()} applications.</p>
          </div>
        ) : (
          agents.map((agent) => {
            const uid = agentUid(agent);
            const isActing = acting === uid;
            return (
              <div key={uid} className="bg-white rounded-2xl shadow-sm px-5 py-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="font-bold text-slate-900">{agentName(agent)}</p>
                    <p className="text-sm text-slate-400">{agentEmail(agent)}</p>
                  </div>
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-lg ${TAB_STYLE[tab]}`}>{tab}</span>
                </div>

                {agent.businessName && (
                  <div className="flex flex-col gap-1 text-sm text-slate-600 mb-3">
                    <p><span className="font-medium text-slate-700">Business:</span> {agent.businessName}</p>
                    {agent.businessAddress && <p><span className="font-medium text-slate-700">Address:</span> {agent.businessAddress}</p>}
                    {agent.phoneNumber && <p><span className="font-medium text-slate-700">Phone:</span> {agent.phoneNumber}</p>}
                    {agent.studentIdUrl && (
                      <a href={agent.studentIdUrl} target="_blank" rel="noopener noreferrer" className="text-indigo-500 font-medium underline-offset-2 underline text-xs">View Student ID</a>
                    )}
                  </div>
                )}

                {agent.createdAt && (
                  <p className="text-xs text-slate-400 mb-3">Applied {new Date(agent.createdAt).toLocaleDateString()}</p>
                )}

                {/* Reject note input */}
                {rejectId === uid && (
                  <div className="mb-3">
                    <input
                      value={rejectNote}
                      onChange={(e) => setRejectNote(e.target.value)}
                      placeholder="Rejection reason (optional)"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-rose-300"
                    />
                  </div>
                )}

                <div className="flex gap-2">
                  {tab === "PENDING" && (
                    <>
                      <button onClick={() => handleApprove(agent)} disabled={isActing}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-emerald-500 text-white text-sm font-bold disabled:opacity-50 transition active:opacity-80">
                        {isActing ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserCheck className="w-4 h-4" />} Approve
                      </button>
                      {rejectId === uid ? (
                        <button onClick={() => handleReject(agent)} disabled={isActing}
                          className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-rose-500 text-white text-sm font-bold disabled:opacity-50 transition active:opacity-80">
                          {isActing ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />} Confirm Reject
                        </button>
                      ) : (
                        <button onClick={() => setRejectId(uid)}
                          className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl border-2 border-rose-200 text-rose-500 text-sm font-bold transition active:bg-rose-50">
                          <UserX className="w-4 h-4" /> Reject
                        </button>
                      )}
                    </>
                  )}
                  {tab === "APPROVED" && (
                    <button onClick={() => handleRevoke(agent)} disabled={isActing}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl border-2 border-rose-200 text-rose-500 text-sm font-bold disabled:opacity-50 transition active:bg-rose-50">
                      {isActing ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserX className="w-4 h-4" />} Revoke Agent Status
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
