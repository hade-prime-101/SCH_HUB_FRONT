"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  XCircle,
  Loader2,
  AlertTriangle,
  RefreshCw,
  FileText,
  Download,
  Search,
  X,
  ShieldCheck,
  ClipboardList,
} from "lucide-react";
import { studyApi } from "@/lib/api";

// ─── Types ────────────────────────────────────────────────────────────────────

type ReviewTab = "pending" | "quizzes";

interface PendingMaterial {
  id:          string;
  title:       string;
  courseCode?: string;
  type:        string;
  uploader?:   { id: string; fullName: string };
  createdAt:   string;
}

interface PendingQuiz {
  id:          string;
  title:       string;
  courseCode?: string;
  questionCount: number;
  creator?:    { id: string; fullName: string };
  createdAt:   string;
  questions?:  { id: string; text: string; approved?: boolean }[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 60)  return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24)   return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

const TYPE_BADGE: Record<string, string> = {
  PAST_QUESTION: "bg-blue-100 text-blue-700",
  NOTE:          "bg-violet-100 text-violet-700",
  HANDOUT:       "bg-amber-100 text-amber-700",
  TEXTBOOK:      "bg-emerald-100 text-emerald-700",
  SLIDE:         "bg-pink-100 text-pink-700",
  SUMMARY:       "bg-accent text-primary",
  OTHER:         "bg-muted text-muted-foreground",
};

const INPUT = "flex-1 rounded-xl border border-border bg-card px-4 py-2.5 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring text-sm";

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function MaterialsReviewPage() {
  const router = useRouter();

  const [tab, setTab]               = useState<ReviewTab>("pending");
  const [materials, setMaterials]   = useState<PendingMaterial[]>([]);
  const [quizzes, setQuizzes]       = useState<PendingQuiz[]>([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState<string | null>(null);
  const [search, setSearch]         = useState("");
  const [actionId, setActionId]     = useState<string | null>(null);

  // Review note modal
  const [reviewTarget, setReviewTarget] = useState<{ id: string; kind: "material" | "quiz" } | null>(null);
  const [reviewNote, setReviewNote]     = useState("");
  const [reviewing, setReviewing]       = useState(false);
  const [reviewDecision, setDecision]   = useState<"APPROVED" | "REJECTED" | null>(null);

  // ── fetch ──────────────────────────────────────────────────────────────────

  const loadMaterials = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const data = await studyApi.getPendingMaterials();
      setMaterials(Array.isArray(data) ? data : (data as any)?.items ?? []);
    } catch {
      setError("Couldn't load pending materials.");
    } finally {
      setLoading(false);
    }
  }, []);

  const loadQuizzes = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const data = await studyApi.getQuizzes({ status: "DRAFT" });
      setQuizzes(Array.isArray(data) ? data : (data as any)?.items ?? []);
    } catch {
      setError("Couldn't load quizzes for review.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (tab === "pending") loadMaterials();
    else loadQuizzes();
  }, [tab, loadMaterials, loadQuizzes]);

  // ── review material ────────────────────────────────────────────────────────

  async function handleReviewMaterial(id: string, decision: "APPROVED" | "REJECTED", note?: string) {
    setActionId(id); setReviewing(true);
    try {
      await studyApi.reviewMaterial(id, { decision, note });
      setMaterials(p => p.filter(m => m.id !== id));
      setReviewTarget(null);
      setReviewNote("");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Review failed.");
    } finally {
      setActionId(null); setReviewing(false);
    }
  }

  // ── approve quiz ───────────────────────────────────────────────────────────

  async function handleApproveQuiz(quiz: PendingQuiz) {
    if (!quiz.questions?.length) {
      setError("No questions to approve.");
      return;
    }
    setActionId(quiz.id);
    try {
      const approvals = quiz.questions.map(q => ({ questionId: q.id, approved: true }));
      await studyApi.approveQuiz(quiz.id, approvals);
      setQuizzes(p => p.filter(q => q.id !== quiz.id));
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to approve quiz.");
    } finally {
      setActionId(null);
    }
  }

  // ── search filter ──────────────────────────────────────────────────────────

  const filteredMaterials = materials.filter(m =>
    !search.trim() ||
    m.title.toLowerCase().includes(search.toLowerCase()) ||
    (m.courseCode?.toLowerCase().includes(search.toLowerCase()) ?? false)
  );

  const filteredQuizzes = quizzes.filter(q =>
    !search.trim() ||
    q.title.toLowerCase().includes(search.toLowerCase()) ||
    (q.courseCode?.toLowerCase().includes(search.toLowerCase()) ?? false)
  );

  return (
    <div className="min-h-screen w-full bg-muted px-6 py-6 pb-10">

      {/* ── Header ── */}
      <div className="flex items-start gap-4 mb-6">
        <button onClick={() => router.back()} aria-label="Go back" className="w-11 h-11 rounded-2xl bg-card shadow-sm flex items-center justify-center shrink-0">
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Content Review</h1>
          <p className="text-muted-foreground text-sm">Approve or reject pending submissions</p>
        </div>
      </div>

      {/* ── Tabs ── */}
      <div className="flex gap-2 mb-5">
        {(["pending", "quizzes"] as ReviewTab[]).map(t => (
          <button
            key={t}
            onClick={() => { setTab(t); setSearch(""); }}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-2xl text-sm font-bold transition-colors ${
              tab === t ? "bg-primary text-primary-foreground" : "bg-card text-muted-foreground"
            }`}
          >
            {t === "pending" ? <BookOpen className="w-4 h-4" /> : <ClipboardList className="w-4 h-4" />}
            {t === "pending" ? "Materials" : "Quizzes"}
          </button>
        ))}
      </div>

      {/* ── Search ── */}
      <div className="flex items-center gap-3 bg-card border border-border rounded-2xl px-4 py-3 mb-4">
        <Search className="w-4 h-4 text-muted-foreground shrink-0" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by title or course code…" className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none" />
        {search && <button onClick={() => setSearch("")} aria-label="Clear"><X className="w-4 h-4 text-muted-foreground" /></button>}
      </div>

      {/* ── Error ── */}
      {error && (
        <div className="flex items-center gap-3 bg-destructive/10 rounded-2xl px-4 py-3 mb-4">
          <AlertTriangle className="w-4 h-4 text-destructive shrink-0" />
          <p className="text-sm text-destructive flex-1">{error}</p>
          <button onClick={tab === "pending" ? loadMaterials : loadQuizzes} aria-label="Retry">
            <RefreshCw className="w-4 h-4 text-destructive" />
          </button>
        </div>
      )}

      {/* ── Loading ── */}
      {loading && (
        <div className="flex justify-center py-12"><Loader2 className="w-7 h-7 text-primary animate-spin" /></div>
      )}

      {/* ── Materials list ── */}
      {!loading && tab === "pending" && (
        filteredMaterials.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-16 text-center">
            <ShieldCheck className="w-12 h-12 text-muted-foreground/30" />
            <p className="font-semibold text-muted-foreground">{search ? "No results found" : "No pending materials"}</p>
            <p className="text-sm text-muted-foreground">All clear!</p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {filteredMaterials.map(m => (
              <div key={m.id} className="bg-card rounded-2xl p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0 pr-2">
                    <p className="font-bold text-foreground leading-snug">{m.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {m.uploader?.fullName ?? "Unknown"} · {timeAgo(m.createdAt)}
                    </p>
                  </div>
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-lg shrink-0 ${TYPE_BADGE[m.type] ?? TYPE_BADGE.OTHER}`}>
                    {m.type.replace("_", " ")}
                  </span>
                </div>

                {m.courseCode && (
                  <span className="inline-block text-xs font-bold text-primary bg-accent rounded-lg px-2.5 py-1 mb-4">
                    {m.courseCode}
                  </span>
                )}

                <div className="flex gap-3">
                  <button
                    onClick={() => { setReviewTarget({ id: m.id, kind: "material" }); setDecision("REJECTED"); }}
                    disabled={actionId === m.id}
                    className="flex-1 flex items-center justify-center gap-2 border border-destructive text-destructive font-semibold rounded-xl py-2.5 text-sm disabled:opacity-50"
                  >
                    {actionId === m.id && reviewDecision === "REJECTED"
                      ? <Loader2 className="w-4 h-4 animate-spin" />
                      : <XCircle className="w-4 h-4" />
                    }
                    Reject
                  </button>
                  <button
                    onClick={() => handleReviewMaterial(m.id, "APPROVED")}
                    disabled={actionId === m.id}
                    className="flex-1 flex items-center justify-center gap-2 bg-emerald-600 text-white font-semibold rounded-xl py-2.5 text-sm disabled:opacity-50"
                  >
                    {actionId === m.id && reviewDecision !== "REJECTED"
                      ? <Loader2 className="w-4 h-4 animate-spin" />
                      : <CheckCircle2 className="w-4 h-4" />
                    }
                    Approve
                  </button>
                </div>
              </div>
            ))}
          </div>
        )
      )}

      {/* ── Quizzes list ── */}
      {!loading && tab === "quizzes" && (
        filteredQuizzes.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-16 text-center">
            <ClipboardList className="w-12 h-12 text-muted-foreground/30" />
            <p className="font-semibold text-muted-foreground">{search ? "No results found" : "No quizzes pending review"}</p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {filteredQuizzes.map(q => (
              <div key={q.id} className="bg-card rounded-2xl p-5">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1 min-w-0 pr-2">
                    <p className="font-bold text-foreground leading-snug">{q.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {q.creator?.fullName ?? "Unknown"} · {timeAgo(q.createdAt)}
                    </p>
                  </div>
                  {q.courseCode && (
                    <span className="text-xs font-bold text-primary bg-accent rounded-lg px-2.5 py-1 shrink-0">
                      {q.courseCode}
                    </span>
                  )}
                </div>

                <p className="text-sm text-muted-foreground mb-4">
                  {q.questionCount} question{q.questionCount !== 1 ? "s" : ""}
                </p>

                <div className="flex gap-3">
                  <button
                    onClick={() => setReviewTarget({ id: q.id, kind: "quiz" })}
                    disabled={actionId === q.id}
                    className="flex-1 flex items-center justify-center gap-2 border border-border text-foreground font-semibold rounded-xl py-2.5 text-sm disabled:opacity-50"
                  >
                    <FileText className="w-4 h-4" /> Review
                  </button>
                  <button
                    onClick={() => handleApproveQuiz(q)}
                    disabled={actionId === q.id}
                    className="flex-1 flex items-center justify-center gap-2 bg-emerald-600 text-white font-semibold rounded-xl py-2.5 text-sm disabled:opacity-50"
                  >
                    {actionId === q.id
                      ? <Loader2 className="w-4 h-4 animate-spin" />
                      : <CheckCircle2 className="w-4 h-4" />
                    }
                    Approve All
                  </button>
                </div>
              </div>
            ))}
          </div>
        )
      )}

      {/* ── Reject / note modal ── */}
      {reviewTarget?.kind === "material" && reviewDecision === "REJECTED" && (
        <>
          <div className="fixed inset-0 bg-black/40 z-40" onClick={() => { setReviewTarget(null); setDecision(null); setReviewNote(""); }} aria-hidden="true" />
          <div className="fixed bottom-0 left-0 right-0 bg-card rounded-t-3xl z-50 px-6 pt-5 pb-10">
            <div className="w-10 h-1 rounded-full bg-muted mx-auto mb-5" />
            <h2 className="font-bold text-foreground text-xl mb-4">Reject Material</h2>
            <p className="text-sm text-muted-foreground mb-3">Provide an optional reason for rejection:</p>
            <textarea
              value={reviewNote}
              onChange={e => setReviewNote(e.target.value)}
              placeholder="e.g. Incomplete metadata, low quality scan…"
              rows={3}
              className="w-full rounded-xl border border-border bg-muted px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none mb-4"
            />
            <div className="flex gap-3">
              <button onClick={() => { setReviewTarget(null); setDecision(null); setReviewNote(""); }} className="flex-1 rounded-xl border border-border py-3 font-semibold text-foreground">Cancel</button>
              <button
                onClick={() => handleReviewMaterial(reviewTarget.id, "REJECTED", reviewNote || undefined)}
                disabled={reviewing}
                className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-destructive text-white py-3 font-semibold disabled:opacity-50"
              >
                {reviewing ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
                {reviewing ? "Rejecting…" : "Confirm Reject"}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
