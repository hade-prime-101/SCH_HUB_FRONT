"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Swords,
  Trophy,
  Clock,
  CheckCircle2,
  XCircle,
  Loader2,
  AlertTriangle,
  RefreshCw,
  Plus,
  ChevronRight,
  Shield,
  Target,
  Users,
  X,
} from "lucide-react";
import { communityApi } from "@/lib/api/community";

// ─── Types ────────────────────────────────────────────────────────────────────

type ChallengeStatus = "PENDING" | "ACCEPTED" | "DECLINED" | "COMPLETED" | "EXPIRED";

interface Challenge {
  id:               string;
  status:           ChallengeStatus;
  quizId:           string;
  quizTitle?:       string;
  senderGroup?:     { id: string; name: string };
  receiverGroup?:   { id: string; name: string };
  expiresAt?:       string;
  createdAt:        string;
  result?: {
    senderScore:   number;
    receiverScore: number;
    winnerId?:     string;
  };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function timeLeft(iso?: string): string {
  if (!iso) return "No expiry";
  const ms = new Date(iso).getTime() - Date.now();
  if (ms <= 0) return "Expired";
  const hrs = Math.floor(ms / 3_600_000);
  const mins = Math.floor((ms % 3_600_000) / 60_000);
  if (hrs > 0) return `${hrs}h ${mins}m left`;
  return `${mins}m left`;
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

const STATUS_CONFIG: Record<ChallengeStatus, { label: string; badge: string }> = {
  PENDING:   { label: "Pending",   badge: "bg-amber-100 text-amber-700" },
  ACCEPTED:  { label: "Accepted",  badge: "bg-blue-100 text-blue-700" },
  DECLINED:  { label: "Declined",  badge: "bg-muted text-muted-foreground" },
  COMPLETED: { label: "Completed", badge: "bg-emerald-100 text-emerald-700" },
  EXPIRED:   { label: "Expired",   badge: "bg-muted text-muted-foreground" },
};

const INPUT  = "w-full rounded-xl border border-border bg-muted px-4 py-2.5 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring text-sm";
const SELECT = "w-full rounded-xl border border-border bg-muted px-4 py-2.5 text-foreground focus:outline-none focus:ring-2 focus:ring-ring appearance-none text-sm";

// ─── Challenge Card ───────────────────────────────────────────────────────────

function ChallengeCard({
  challenge,
  groupId,
  onAccept,
  onDecline,
  acting,
}: {
  challenge:  Challenge;
  groupId:    string;
  onAccept:   (id: string) => void;
  onDecline:  (id: string) => void;
  acting:     boolean;
}) {
  const cfg = STATUS_CONFIG[challenge.status];
  const isSender   = challenge.senderGroup?.id === groupId;
  const opponent   = isSender ? challenge.receiverGroup : challenge.senderGroup;
  const isPending  = challenge.status === "PENDING" && !isSender;
  const isComplete = challenge.status === "COMPLETED";

  return (
    <div className="bg-card rounded-2xl p-5">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-accent flex items-center justify-center shrink-0">
            <Swords className="w-4 h-4 text-primary" />
          </div>
          <div>
            <p className="font-bold text-foreground text-sm">
              {isSender ? "Challenge sent" : "Challenge received"}
            </p>
            <p className="text-xs text-muted-foreground">{timeAgo(challenge.createdAt)}</p>
          </div>
        </div>
        <span className={`text-xs font-bold px-2.5 py-1 rounded-lg ${cfg.badge}`}>
          {cfg.label}
        </span>
      </div>

      {/* Quiz + opponent */}
      <div className="bg-muted rounded-xl px-4 py-3 mb-4">
        <div className="flex items-center gap-2 mb-1">
          <Target className="w-4 h-4 text-primary shrink-0" />
          <p className="font-semibold text-foreground text-sm truncate">
            {challenge.quizTitle ?? challenge.quizId}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-muted-foreground shrink-0" />
          <p className="text-sm text-muted-foreground">
            vs. <span className="font-semibold text-foreground">{opponent?.name ?? "Unknown Group"}</span>
          </p>
        </div>
      </div>

      {/* Expiry */}
      {challenge.status === "PENDING" && challenge.expiresAt && (
        <p className="text-xs text-muted-foreground flex items-center gap-1 mb-4">
          <Clock className="w-3.5 h-3.5" />
          {timeLeft(challenge.expiresAt)}
        </p>
      )}

      {/* Result */}
      {isComplete && challenge.result && (
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="rounded-xl bg-accent p-3 text-center">
            <p className="text-xs text-muted-foreground mb-0.5">Your score</p>
            <p className="text-2xl font-black text-primary">
              {isSender ? challenge.result.senderScore : challenge.result.receiverScore}%
            </p>
          </div>
          <div className="rounded-xl bg-muted p-3 text-center">
            <p className="text-xs text-muted-foreground mb-0.5">Their score</p>
            <p className="text-2xl font-black text-foreground">
              {isSender ? challenge.result.receiverScore : challenge.result.senderScore}%
            </p>
          </div>
        </div>
      )}

      {/* Actions */}
      {isPending && (
        <div className="flex gap-3">
          <button
            onClick={() => onDecline(challenge.id)}
            disabled={acting}
            className="flex-1 flex items-center justify-center gap-2 border border-destructive text-destructive font-semibold rounded-xl py-2.5 text-sm disabled:opacity-50"
          >
            {acting ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
            Decline
          </button>
          <button
            onClick={() => onAccept(challenge.id)}
            disabled={acting}
            className="flex-1 flex items-center justify-center gap-2 bg-primary text-primary-foreground font-semibold rounded-xl py-2.5 text-sm disabled:opacity-50"
          >
            {acting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
            Accept
          </button>
        </div>
      )}

      {isComplete && challenge.quizId && (
        <Link
          href={`/dashboard/community/groups/${groupId}/leaderboard?quizId=${challenge.quizId}`}
          className="w-full flex items-center justify-center gap-2 bg-card border border-border text-foreground font-semibold rounded-xl py-2.5 text-sm"
        >
          <Trophy className="w-4 h-4 text-amber-500" /> View Leaderboard
          <ChevronRight className="w-4 h-4" />
        </Link>
      )}
    </div>
  );
}

// ─── New challenge sheet ──────────────────────────────────────────────────────

function NewChallengeSheet({
  groupId,
  onClose,
  onCreated,
}: {
  groupId:   string;
  onClose:   () => void;
  onCreated: () => void;
}) {
  const [receiverGroupId, setReceiver] = useState("");
  const [quizId, setQuizId]           = useState("");
  const [expiresIn, setExpiresIn]     = useState("24");
  const [submitting, setSubmitting]   = useState(false);
  const [error, setError]             = useState<string | null>(null);

  async function handleCreate() {
    if (!receiverGroupId.trim() || !quizId.trim()) {
      setError("Opponent group ID and quiz ID are required.");
      return;
    }
    setSubmitting(true); setError(null);
    try {
      await communityApi.createChallenge(groupId, {
        receiverGroupId: receiverGroupId.trim(),
        quizId:          quizId.trim(),
        expiresInHours:  Number(expiresIn) || 24,
      });
      onCreated();
      onClose();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to create challenge.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <div className="fixed inset-0 bg-black/40 z-40" onClick={onClose} aria-hidden="true" />
      <div className="fixed bottom-0 left-0 right-0 bg-card rounded-t-3xl z-50 px-6 pt-5 pb-10">
        <div className="w-10 h-1 rounded-full bg-muted mx-auto mb-5" />
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-xl font-bold text-foreground">New Challenge</h2>
          <button onClick={onClose} aria-label="Close"><X className="w-5 h-5 text-muted-foreground" /></button>
        </div>

        {error && (
          <div className="flex items-center gap-2 bg-destructive/10 rounded-xl px-3 py-2 mb-4 text-destructive text-sm">
            <AlertTriangle className="w-3.5 h-3.5 shrink-0" /> {error}
          </div>
        )}

        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-foreground">Opponent Group ID *</label>
            <input value={receiverGroupId} onChange={e => setReceiver(e.target.value)} placeholder="Paste the group ID to challenge" className={INPUT} />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-foreground">Quiz ID *</label>
            <input value={quizId} onChange={e => setQuizId(e.target.value)} placeholder="Paste the quiz ID to use" className={INPUT} />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-foreground">Expires in</label>
            <select value={expiresIn} onChange={e => setExpiresIn(e.target.value)} className={SELECT}>
              {["6", "12", "24", "48", "72"].map(h => (
                <option key={h} value={h}>{h} hours</option>
              ))}
            </select>
          </div>

          <button
            onClick={handleCreate}
            disabled={submitting}
            className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground font-bold rounded-xl py-3.5 disabled:opacity-50 mt-2"
          >
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Swords className="w-4 h-4" />}
            {submitting ? "Sending…" : "Send Challenge"}
          </button>
        </div>
      </div>
    </>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function GroupChallengesPage() {
  const router   = useRouter();
  const params   = useParams();
  const groupId  = params.groupId as string;

  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState<string | null>(null);
  const [actingId, setActingId]     = useState<string | null>(null);
  const [showNew, setShowNew]       = useState(false);

  // ── Guard ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!groupId) router.replace("/dashboard/community/groups");
  }, [groupId, router]);

  // ── fetch ──────────────────────────────────────────────────────────────────

  const load = useCallback(async () => {
    if (!groupId) return;
    setLoading(true); setError(null);
    try {
      const data = await communityApi.getGroupChallenges(groupId);
      setChallenges(Array.isArray(data) ? data : []);
    } catch {
      setError("Couldn't load challenges.");
    } finally {
      setLoading(false);
    }
  }, [groupId]);

  useEffect(() => { load(); }, [load]);

  // ── accept ─────────────────────────────────────────────────────────────────

  async function handleAccept(challengeId: string) {
    setActingId(challengeId);
    try {
      await communityApi.acceptChallenge(groupId, challengeId);
      setChallenges(p => p.map(c => c.id === challengeId ? { ...c, status: "ACCEPTED" } : c));
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to accept challenge.");
    } finally {
      setActingId(null);
    }
  }

  // ── decline ────────────────────────────────────────────────────────────────

  async function handleDecline(challengeId: string) {
    setActingId(challengeId);
    try {
      await communityApi.declineChallenge(groupId, challengeId);
      setChallenges(p => p.map(c => c.id === challengeId ? { ...c, status: "DECLINED" } : c));
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to decline challenge.");
    } finally {
      setActingId(null);
    }
  }

  // ── split by status ────────────────────────────────────────────────────────

  const pending   = challenges.filter(c => c.status === "PENDING");
  const active    = challenges.filter(c => c.status === "ACCEPTED");
  const completed = challenges.filter(c => c.status === "COMPLETED");
  const other     = challenges.filter(c => c.status === "DECLINED" || c.status === "EXPIRED");

  return (
    <div className="min-h-screen w-full bg-muted px-6 py-6 pb-10">

      {/* ── Header ── */}
      <div className="flex items-start gap-4 mb-6">
        <button
          onClick={() => router.back()}
          aria-label="Go back"
          className="w-11 h-11 rounded-2xl bg-card shadow-sm flex items-center justify-center shrink-0"
        >
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-foreground">Challenges</h1>
          <p className="text-muted-foreground text-sm">Quiz battles with other groups</p>
        </div>
        <button
          onClick={() => setShowNew(true)}
          className="flex items-center gap-1.5 bg-primary text-primary-foreground text-sm font-semibold rounded-xl px-4 py-2.5 shadow-lg shadow-primary/20 shrink-0"
        >
          <Plus className="w-4 h-4" /> Challenge
        </button>
      </div>

      {/* ── Error ── */}
      {error && (
        <div className="flex items-center gap-3 bg-destructive/10 rounded-2xl px-4 py-3 mb-4">
          <AlertTriangle className="w-4 h-4 text-destructive shrink-0" />
          <p className="text-sm text-destructive flex-1">{error}</p>
          <button onClick={load} aria-label="Retry"><RefreshCw className="w-4 h-4 text-destructive" /></button>
        </div>
      )}

      {/* ── Loading ── */}
      {loading && (
        <div className="flex justify-center py-20"><Loader2 className="w-7 h-7 text-primary animate-spin" /></div>
      )}

      {!loading && challenges.length === 0 && (
        <div className="flex flex-col items-center gap-3 py-20 text-center">
          <div className="w-16 h-16 rounded-2xl bg-accent flex items-center justify-center">
            <Swords className="w-8 h-8 text-primary" />
          </div>
          <p className="font-bold text-foreground">No challenges yet</p>
          <p className="text-sm text-muted-foreground">Challenge another group to a quiz battle!</p>
          <button
            onClick={() => setShowNew(true)}
            className="mt-2 flex items-center gap-2 bg-primary text-primary-foreground font-bold rounded-xl px-5 py-3 shadow-lg shadow-primary/20"
          >
            <Swords className="w-4 h-4" /> Send a Challenge
          </button>
        </div>
      )}

      {/* ── Pending section ── */}
      {pending.length > 0 && (
        <div className="mb-5">
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-3">
            Incoming ({pending.length})
          </p>
          <div className="flex flex-col gap-4">
            {pending.map(c => (
              <ChallengeCard
                key={c.id}
                challenge={c}
                groupId={groupId}
                onAccept={handleAccept}
                onDecline={handleDecline}
                acting={actingId === c.id}
              />
            ))}
          </div>
        </div>
      )}

      {/* ── Active section ── */}
      {active.length > 0 && (
        <div className="mb-5">
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-3">
            Active ({active.length})
          </p>
          <div className="flex flex-col gap-4">
            {active.map(c => (
              <ChallengeCard
                key={c.id}
                challenge={c}
                groupId={groupId}
                onAccept={handleAccept}
                onDecline={handleDecline}
                acting={actingId === c.id}
              />
            ))}
          </div>
        </div>
      )}

      {/* ── Completed section ── */}
      {completed.length > 0 && (
        <div className="mb-5">
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-3">
            Completed ({completed.length})
          </p>
          <div className="flex flex-col gap-4">
            {completed.map(c => (
              <ChallengeCard
                key={c.id}
                challenge={c}
                groupId={groupId}
                onAccept={handleAccept}
                onDecline={handleDecline}
                acting={actingId === c.id}
              />
            ))}
          </div>
        </div>
      )}

      {/* ── Declined/Expired ── */}
      {other.length > 0 && (
        <div className="mb-5">
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-3">
            Past ({other.length})
          </p>
          <div className="flex flex-col gap-4">
            {other.map(c => (
              <ChallengeCard
                key={c.id}
                challenge={c}
                groupId={groupId}
                onAccept={handleAccept}
                onDecline={handleDecline}
                acting={actingId === c.id}
              />
            ))}
          </div>
        </div>
      )}

      {showNew && (
        <NewChallengeSheet
          groupId={groupId}
          onClose={() => setShowNew(false)}
          onCreated={load}
        />
      )}
    </div>
  );
}
