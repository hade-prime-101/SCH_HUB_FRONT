"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  Trophy,
  Medal,
  Crown,
  Loader2,
  AlertTriangle,
  RefreshCw,
  Users,
  Target,
} from "lucide-react";
import { communityApi } from "@/lib/api/community";

// ─── Types ────────────────────────────────────────────────────────────────────

interface LeaderboardEntry {
  rank:       number;
  userId:     string;
  fullName:   string;
  score:      number;
  timeTaken?: number; // seconds
  attempts?:  number;
}

interface LeaderboardData {
  quizTitle?:   string;
  quizId:       string;
  groupName?:   string;
  entries:      LeaderboardEntry[];
  totalAttempts?: number;
  averageScore?:  number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatTime(secs?: number): string {
  if (!secs) return "—";
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}

function scoreColour(score: number): string {
  if (score >= 80) return "text-emerald-600";
  if (score >= 60) return "text-primary";
  if (score >= 40) return "text-amber-600";
  return "text-destructive";
}

function initials(name: string): string {
  return name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
}

// ─── Rank icon ────────────────────────────────────────────────────────────────

function RankIcon({ rank }: { rank: number }) {
  if (rank === 1) return <Crown  className="w-5 h-5 text-amber-500" />;
  if (rank === 2) return <Medal  className="w-5 h-5 text-slate-400" />;
  if (rank === 3) return <Medal  className="w-5 h-5 text-amber-700" />;
  return <span className="w-5 h-5 flex items-center justify-center text-xs font-bold text-muted-foreground">{rank}</span>;
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function GroupLeaderboardPage() {
  const router        = useRouter();
  const params        = useParams();
  const searchParams  = useSearchParams();
  const groupId       = params.groupId as string;
  const quizId        = searchParams.get("quizId") ?? "";

  const [data, setData]       = useState<LeaderboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!quizId) { setError("No quiz specified."); setLoading(false); return; }
    setLoading(true); setError(null);
    try {
      const res = await communityApi.getGroupQuizLeaderboard(groupId, quizId);
      setData(res as LeaderboardData);
    } catch {
      setError("Couldn't load leaderboard.");
    } finally {
      setLoading(false);
    }
  }, [groupId, quizId]);

  useEffect(() => { load(); }, [load]);

  const top3    = data?.entries.slice(0, 3) ?? [];
  const theRest = data?.entries.slice(3) ?? [];

  // ── Missing quizId guard ────────────────────────────────────────────────────
  if (!quizId && !loading) {
    return (
      <div className="min-h-screen w-full bg-muted flex flex-col items-center justify-center gap-4 px-6">
        <AlertTriangle className="w-10 h-10 text-destructive" />
        <p className="text-foreground font-bold text-lg">No quiz specified</p>
        <p className="text-muted-foreground text-sm text-center">
          This leaderboard requires a quiz ID. Go back to the challenges page.
        </p>
        <button
          onClick={() => router.replace(`/dashboard/community/groups/${groupId}/challenges`)}
          className="bg-primary text-primary-foreground font-semibold rounded-2xl px-6 py-3"
        >
          Back to Challenges
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-muted px-6 py-6 pb-10">

      {/* ── Header ── */}
      <div className="flex items-start gap-4 mb-6">
        <button onClick={() => router.back()} aria-label="Go back" className="w-11 h-11 rounded-2xl bg-card shadow-sm flex items-center justify-center shrink-0">
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Leaderboard</h1>
          <p className="text-muted-foreground text-sm">
            {data?.quizTitle ?? "Quiz"}{data?.groupName ? ` · ${data.groupName}` : ""}
          </p>
        </div>
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

      {!loading && data && (
        <>
          {/* ── Stats summary ── */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            <div className="bg-card rounded-2xl p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center shrink-0">
                <Users className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Attempts</p>
                <p className="text-xl font-bold text-foreground">{data.totalAttempts ?? data.entries.length}</p>
              </div>
            </div>
            <div className="bg-card rounded-2xl p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center shrink-0">
                <Target className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Avg Score</p>
                <p className="text-xl font-bold text-foreground">
                  {data.averageScore != null ? `${data.averageScore}%` : "—"}
                </p>
              </div>
            </div>
          </div>

          {/* ── Top 3 podium ── */}
          {top3.length > 0 && (
            <div className="bg-card rounded-2xl p-5 mb-5">
              <div className="flex items-center gap-2 mb-5">
                <Trophy className="w-5 h-5 text-amber-500" />
                <h2 className="font-bold text-foreground">Top Performers</h2>
              </div>

              {/* Podium visual */}
              <div className="flex items-end justify-center gap-4 mb-5 h-28">
                {/* 2nd place */}
                {top3[1] && (
                  <div className="flex flex-col items-center gap-2 flex-1">
                    <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center text-sm font-bold text-foreground">
                      {initials(top3[1].fullName)}
                    </div>
                    <p className="text-xs font-semibold text-foreground text-center truncate w-full">{top3[1].fullName.split(" ")[0]}</p>
                    <div className="w-full bg-slate-200 rounded-t-xl flex items-center justify-center h-14">
                      <span className="text-slate-600 font-black text-lg">2</span>
                    </div>
                  </div>
                )}

                {/* 1st place */}
                {top3[0] && (
                  <div className="flex flex-col items-center gap-2 flex-1">
                    <Crown className="w-5 h-5 text-amber-500" />
                    <div className="w-14 h-14 rounded-full bg-amber-100 flex items-center justify-center text-base font-bold text-amber-700 ring-2 ring-amber-400">
                      {initials(top3[0].fullName)}
                    </div>
                    <p className="text-xs font-bold text-foreground text-center truncate w-full">{top3[0].fullName.split(" ")[0]}</p>
                    <div className="w-full bg-amber-400 rounded-t-xl flex items-center justify-center h-20">
                      <span className="text-white font-black text-xl">1</span>
                    </div>
                  </div>
                )}

                {/* 3rd place */}
                {top3[2] && (
                  <div className="flex flex-col items-center gap-2 flex-1">
                    <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center text-sm font-bold text-foreground">
                      {initials(top3[2].fullName)}
                    </div>
                    <p className="text-xs font-semibold text-foreground text-center truncate w-full">{top3[2].fullName.split(" ")[0]}</p>
                    <div className="w-full bg-amber-800/20 rounded-t-xl flex items-center justify-center h-10">
                      <span className="text-amber-800 font-black text-lg">3</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Top 3 scores */}
              <div className="flex flex-col gap-2">
                {top3.map(entry => (
                  <div key={entry.userId} className="flex items-center gap-3 py-2 border-b border-border last:border-0">
                    <RankIcon rank={entry.rank} />
                    <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center text-xs font-bold text-foreground shrink-0">
                      {initials(entry.fullName)}
                    </div>
                    <p className="font-semibold text-foreground flex-1 truncate">{entry.fullName}</p>
                    {entry.timeTaken && (
                      <p className="text-xs text-muted-foreground shrink-0">{formatTime(entry.timeTaken)}</p>
                    )}
                    <p className={`text-lg font-black shrink-0 ${scoreColour(entry.score)}`}>{entry.score}%</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Full rankings ── */}
          {theRest.length > 0 && (
            <div className="bg-card rounded-2xl p-5">
              <h2 className="font-bold text-foreground mb-4">All Rankings</h2>
              <div className="flex flex-col gap-0">
                {theRest.map(entry => (
                  <div key={entry.userId} className="flex items-center gap-3 py-3 border-b border-border last:border-0">
                    <RankIcon rank={entry.rank} />
                    <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center text-xs font-bold text-foreground shrink-0">
                      {initials(entry.fullName)}
                    </div>
                    <p className="font-semibold text-foreground flex-1 truncate">{entry.fullName}</p>
                    {entry.timeTaken && (
                      <p className="text-xs text-muted-foreground shrink-0">{formatTime(entry.timeTaken)}</p>
                    )}
                    <p className={`text-base font-bold shrink-0 ${scoreColour(entry.score)}`}>{entry.score}%</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Empty ── */}
          {data.entries.length === 0 && (
            <div className="flex flex-col items-center gap-3 py-20 text-center">
              <Trophy className="w-12 h-12 text-muted-foreground/30" />
              <p className="font-semibold text-muted-foreground">No scores yet</p>
              <p className="text-sm text-muted-foreground">Be the first to attempt this quiz!</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
