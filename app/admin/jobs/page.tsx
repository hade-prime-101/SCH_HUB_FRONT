"use client";

import { useEffect, useState, useCallback } from "react";
import { marketplaceApi } from "@/lib/api/marketplace";
import { Briefcase, CheckCircle, XCircle, Trash2, AlertCircle, X } from "lucide-react";

interface Job {
  id: string;
  title: string;
  description?: string;
  type: string;
  pay?: string;
  location?: string;
  approvalStatus?: string;
  poster?: { fullName: string };
  createdAt: string;
}

type Tab = "pending" | "all";

const TYPE_BADGE: Record<string, string> = {
  INTERNSHIP:  "bg-violet-100 text-violet-700",
  PART_TIME:   "bg-blue-100 text-blue-700",
  CAMPUS_JOB:  "bg-emerald-100 text-emerald-700",
  FREELANCE:   "bg-amber-100 text-amber-700",
};

function RejectModal({ onClose, onConfirm }: { onClose: () => void; onConfirm: (reason: string) => void }) {
  const [reason, setReason] = useState("");
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-card rounded-2xl w-full max-w-sm p-6 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-foreground">Reject Job</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted"><X className="w-4 h-4" /></button>
        </div>
        <textarea
          rows={3}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Reason for rejection…"
          className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none mb-4"
        />
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-border text-sm font-medium hover:bg-muted transition-colors">Cancel</button>
          <button
            disabled={!reason.trim()}
            onClick={() => onConfirm(reason)}
            className="flex-1 py-2.5 rounded-xl bg-destructive text-white text-sm font-medium hover:opacity-90 disabled:opacity-50 transition-opacity"
          >
            Reject
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AdminJobsPage() {
  const [tab, setTab]           = useState<Tab>("pending");
  const [jobs, setJobs]         = useState<Job[]>([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState<string | null>(null);
  const [actionId, setActionId] = useState<string | null>(null);
  const [rejectTarget, setRejectTarget] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const data: any = tab === "pending"
        ? await marketplaceApi.getPendingJobs()
        : await marketplaceApi.getJobs({ limit: "50" });
      const items = data?.items ?? data?.jobs ?? (Array.isArray(data) ? data : []);
      setJobs(items);
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  }, [tab]);

  useEffect(() => { load(); }, [load]);

  async function approve(id: string) {
    setActionId(id);
    try {
      await marketplaceApi.approveJob(id);
      setJobs((prev) => prev.filter((j) => j.id !== id));
    } catch (e: any) { alert(e.message); }
    finally { setActionId(null); }
  }

  async function reject(id: string, reason: string) {
    setActionId(id);
    setRejectTarget(null);
    try {
      await marketplaceApi.rejectJob(id, reason);
      setJobs((prev) => prev.filter((j) => j.id !== id));
    } catch (e: any) { alert(e.message); }
    finally { setActionId(null); }
  }

  async function remove(id: string) {
    if (!confirm("Delete this job listing?")) return;
    setActionId(id);
    try {
      await marketplaceApi.deleteJob(id);
      setJobs((prev) => prev.filter((j) => j.id !== id));
    } catch (e: any) { alert(e.message); }
    finally { setActionId(null); }
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Jobs</h1>
        <p className="text-muted-foreground text-sm mt-1">Approve or reject job listings</p>
      </div>

      <div className="flex gap-2">
        {(["pending", "all"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors capitalize ${
              tab === t ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-accent"
            }`}
          >
            {t === "pending" ? "Pending Approval" : "All Jobs"}
          </button>
        ))}
      </div>

      {error && (
        <div className="bg-destructive/10 text-destructive rounded-xl p-4 flex items-center gap-2 text-sm">
          <AlertCircle className="w-4 h-4 shrink-0" /> {error}
        </div>
      )}

      {loading ? (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="bg-card rounded-2xl p-5 h-28 animate-pulse" />
          ))}
        </div>
      ) : jobs.length === 0 ? (
        <div className="bg-card rounded-2xl p-10 text-center text-muted-foreground text-sm">
          {tab === "pending" ? "No pending jobs." : "No job listings found."}
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {jobs.map((job) => (
            <div key={job.id} className="bg-card rounded-2xl p-4 flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <Briefcase className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <p className="font-semibold text-foreground">{job.title}</p>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${TYPE_BADGE[job.type] ?? "bg-muted text-muted-foreground"}`}>
                    {job.type}
                  </span>
                </div>
                {job.description && (
                  <p className="text-xs text-muted-foreground line-clamp-2 mb-1">{job.description}</p>
                )}
                <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                  {job.pay      && <span>{job.pay}</span>}
                  {job.location && <span>{job.location}</span>}
                  {job.poster   && <span>by {job.poster.fullName}</span>}
                  <span>{new Date(job.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
              <div className="flex gap-1 shrink-0">
                {tab === "pending" ? (
                  <>
                    <button
                      disabled={actionId === job.id}
                      onClick={() => approve(job.id)}
                      title="Approve"
                      className="p-1.5 rounded-lg hover:bg-emerald-100 text-muted-foreground hover:text-emerald-600 transition-colors disabled:opacity-50"
                    >
                      <CheckCircle className="w-4 h-4" />
                    </button>
                    <button
                      disabled={actionId === job.id}
                      onClick={() => setRejectTarget(job.id)}
                      title="Reject"
                      className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors disabled:opacity-50"
                    >
                      <XCircle className="w-4 h-4" />
                    </button>
                  </>
                ) : (
                  <button
                    disabled={actionId === job.id}
                    onClick={() => remove(job.id)}
                    title="Delete"
                    className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors disabled:opacity-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {rejectTarget && (
        <RejectModal
          onClose={() => setRejectTarget(null)}
          onConfirm={(reason) => reject(rejectTarget, reason)}
        />
      )}
    </div>
  );
}
