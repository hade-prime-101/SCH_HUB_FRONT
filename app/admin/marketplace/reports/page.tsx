"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft, Flag, CheckCircle2, Loader2, AlertTriangle, X, RefreshCw,
} from "lucide-react";
import { marketplaceApi } from "@/lib/api/marketplace";

type FilterTab = "ALL" | "UNRESOLVED" | "RESOLVED";

interface MarketplaceReport {
  id:          string;
  targetType:  string;
  targetId:    string;
  reason:      string;
  details?:    string;
  isResolved?: boolean;
  createdAt:   string;
  reporter?:   { id: string; fullName: string };
}

const FILTER_TABS: FilterTab[] = ["ALL", "UNRESOLVED", "RESOLVED"];

const TARGET_BADGE: Record<string, string> = {
  listing:       "bg-blue-100 text-blue-700",
  accommodation: "bg-emerald-100 text-emerald-700",
  service:       "bg-violet-100 text-violet-700",
};

const REASON_LABEL: Record<string, string> = {
  SPAM:                 "Spam",
  FAKE_LISTING:         "Fake listing",
  INAPPROPRIATE_CONTENT:"Inappropriate content",
  SCAM:                 "Scam",
  WRONG_CATEGORY:       "Wrong category",
  OTHER:                "Other",
};

function timeAgo(iso: string) {
  const d = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
  if (d === 0) return "today";
  if (d === 1) return "1d ago";
  return `${d}d ago`;
}

export default function AdminMarketplaceReportsPage() {
  const router = useRouter();

  const [tab,       setTab]       = useState<FilterTab>("UNRESOLVED");
  const [reports,   setReports]   = useState<MarketplaceReport[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState<string | null>(null);
  const [resolving, setResolving] = useState<string | null>(null);

  async function load() {
    setLoading(true); setError(null);
    try {
      const data = await marketplaceApi.getMarketplaceReports() as any;
      const arr  = Array.isArray(data) ? data : (data?.data ?? []);
      setReports(arr as MarketplaceReport[]);
    } catch (e: any) {
      setError(e.message || "Failed to load reports.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function handleResolve(id: string) {
    setResolving(id); setError(null);
    try {
      await marketplaceApi.resolveMarketplaceReport(id);
      setReports((prev) => prev.map((r) => r.id === id ? { ...r, isResolved: true } : r));
    } catch (e: any) { setError(e.message || "Failed to resolve."); }
    finally { setResolving(null); }
  }

  const filtered = reports.filter((r) => {
    if (tab === "RESOLVED")   return r.isResolved === true;
    if (tab === "UNRESOLVED") return !r.isResolved;
    return true;
  });

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-white px-4 pt-5 pb-4 flex items-center gap-3 border-b border-slate-100">
        <button onClick={() => router.back()} className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center shrink-0"><ArrowLeft className="w-5 h-5 text-slate-700" /></button>
        <h1 className="text-xl font-bold text-slate-900 flex-1">Marketplace Reports</h1>
        <button onClick={load} className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center shrink-0"><RefreshCw className="w-4 h-4 text-slate-500" /></button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 px-4 py-3 bg-white border-b border-slate-100">
        {FILTER_TABS.map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-full text-sm font-bold transition ${tab === t ? "bg-indigo-100 text-indigo-700" : "bg-slate-100 text-slate-500"}`}>
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
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm px-5 py-12 flex flex-col items-center gap-3 text-center">
            <Flag className="w-10 h-10 text-slate-200" />
            <p className="text-slate-400 font-medium">No {tab.toLowerCase()} reports.</p>
          </div>
        ) : (
          filtered.map((report) => (
            <div key={report.id} className="bg-white rounded-2xl shadow-sm px-5 py-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-lg ${TARGET_BADGE[report.targetType] ?? "bg-slate-100 text-slate-600"}`}>
                    {report.targetType}
                  </span>
                  <span className="text-xs font-bold bg-slate-100 text-slate-600 px-2.5 py-1 rounded-lg">
                    {REASON_LABEL[report.reason] ?? report.reason}
                  </span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {report.isResolved
                    ? <span className="flex items-center gap-1 text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg"><CheckCircle2 className="w-3 h-3" /> Resolved</span>
                    : <span className="text-xs font-bold text-amber-600 bg-amber-50 px-2 py-1 rounded-lg">Open</span>
                  }
                </div>
              </div>

              {report.details && (
                <p className="text-sm text-slate-600 mb-2 leading-relaxed">"{report.details}"</p>
              )}

              <div className="flex items-center justify-between text-xs text-slate-400 mb-3">
                <span>By {report.reporter?.fullName ?? "Anonymous"}</span>
                <span>{timeAgo(report.createdAt)}</span>
              </div>

              {!report.isResolved && (
                <button onClick={() => handleResolve(report.id)} disabled={resolving === report.id}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-indigo-500 text-white text-sm font-bold disabled:opacity-50 transition active:opacity-80">
                  {resolving === report.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                  Mark Resolved
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
