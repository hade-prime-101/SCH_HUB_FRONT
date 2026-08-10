"use client";

import { useState, useEffect, useCallback } from "react";
import BottomNav from "@/components/shared/BottomNav";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Search,
  Filter,
  Plus,
  MessageSquare,
  ChevronUp,
  MessageCircle,
  Loader2,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react";
import { communityApi } from "@/lib/api/community";
import BackButton from "@/components/shared/BackButton";

// ─── Types ────────────────────────────────────────────────────────────────────

type QuestionType =
  | "COURSE_HELP"
  | "ASSIGNMENT_HELP"
  | "CONCEPT_EXPLANATION"
  | "EXAM_PREP"
  | "PROJECT_GUIDANCE";

interface Question {
  id: string;
  title: string;
  type: QuestionType;
  courseTag: string;
  isAnonymous: boolean;
  isMentorQuestion: boolean;
  isSolved: boolean;
  upvoteCount: number;
  answerCount: number;
  createdAt: string;
  author?: {
    id: string;
    fullName: string;
  };
}

// ─── Constants ────────────────────────────────────────────────────────────────

const TYPE_CHIPS: QuestionType[] = [
  "COURSE_HELP",
  "ASSIGNMENT_HELP",
  "CONCEPT_EXPLANATION",
  "EXAM_PREP",
  "PROJECT_GUIDANCE",
];

const TYPE_LABEL: Record<QuestionType, string> = {
  COURSE_HELP:         "Course Help",
  ASSIGNMENT_HELP:     "Assignment Help",
  CONCEPT_EXPLANATION: "Concept",
  EXAM_PREP:           "Exam Prep",
  PROJECT_GUIDANCE:    "Project",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins  = Math.floor(diff / 60000);
  const hours = Math.floor(mins / 60);
  const days  = Math.floor(hours / 24);
  if (mins  < 1)  return "Just now";
  if (mins  < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days  < 7)  return `${days}d ago`;
  return new Date(iso).toLocaleDateString([], { month: "short", day: "numeric" });
}

function initials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

// ─── Question Card ────────────────────────────────────────────────────────────

function QuestionCard({
  q,
  onUpvote,
  upvoting,
}: {
  q: Question;
  onUpvote: (id: string) => void;
  upvoting: boolean;
}) {
  const displayName = q.isAnonymous ? "Anonymous" : (q.author?.fullName ?? "Unknown");
  const displayInitials = q.isAnonymous ? "?" : initials(displayName);

  return (
    <Link
      href={`/dashboard/community/qa/${q.id}`}
      className="block rounded-2xl border border-border bg-card p-5 active:scale-[0.99] transition"
    >
      {/* Badges row */}
      <div className="flex items-center gap-2 mb-3 flex-wrap">
        <span className="text-xs font-bold border border-border rounded-lg px-2.5 py-1 text-foreground">
          {q.courseTag}
        </span>
        <span className="text-xs font-bold bg-muted rounded-lg px-2.5 py-1 text-muted-foreground">
          {TYPE_LABEL[q.type]}
        </span>
        {q.isMentorQuestion && (
          <span className="text-xs font-bold bg-accent text-primary rounded-lg px-2.5 py-1">
            Mentor
          </span>
        )}
        {q.isSolved && (
          <span className="ml-auto flex items-center gap-1 text-xs font-bold border border-emerald-300 text-emerald-600 rounded-lg px-2.5 py-1">
            <CheckCircle2 className="w-3 h-3" /> Answered
          </span>
        )}
      </div>

      {/* Title */}
      <h3 className="font-bold text-lg text-foreground leading-snug mb-3">
        {q.title}
      </h3>

      {/* Author row */}
      <div className="flex items-center gap-2 mb-3">
        <span className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs font-bold text-foreground shrink-0">
          {displayInitials}
        </span>
        <span className="font-semibold text-foreground text-sm">{displayName}</span>
        <span className="text-muted-foreground text-sm">· {timeAgo(q.createdAt)}</span>
        {q.isAnonymous && (
          <span className="text-muted-foreground text-sm">· Anonymous</span>
        )}
      </div>

      {/* Stats row */}
      <div className="flex items-center gap-4 text-muted-foreground text-sm">
        <span className="flex items-center gap-1.5">
          <MessageSquare className="w-4 h-4" /> {q.answerCount ?? 0} answers
        </span>
        <button
          onClick={(e) => { e.preventDefault(); onUpvote(q.id); }}
          disabled={upvoting}
          className={`flex items-center gap-1 transition ${
            upvoting ? "opacity-50" : "hover:text-primary"
          }`}
          aria-label="Upvote question"
        >
          <ChevronUp className="w-4 h-4" />
          <span>{q.upvoteCount ?? 0}</span>
        </button>
      </div>
    </Link>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function QAListPage() {
  const router = useRouter();

  const [questions, setQuestions]     = useState<Question[]>([]);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState<string | null>(null);
  const [activeType, setActiveType]   = useState<QuestionType | null>(null);
  const [courseSearch, setCourseSearch] = useState("");
  const [solvedOnly, setSolvedOnly]   = useState(false);
  const [mentorOnly, setMentorOnly]   = useState(false);
  const [upvotingId, setUpvotingId]   = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params: Record<string, string> = { limit: "30" };
      if (activeType)   params.type        = activeType;
      if (solvedOnly)   params.isSolved    = "true";
      if (mentorOnly)   params.isMentorQuestion = "true";
      if (courseSearch.trim()) params.courseTag = courseSearch.trim().toUpperCase();

      const res = await communityApi.getQuestions(params);
      setQuestions(Array.isArray(res) ? res : (res?.data ?? []));
    } catch (e: any) {
      setError(e.message || "Failed to load questions.");
    } finally {
      setLoading(false);
    }
  }, [activeType, solvedOnly, mentorOnly, courseSearch]);

  useEffect(() => { load(); }, [load]);

  async function handleUpvote(id: string) {
    setUpvotingId(id);
    try {
      await communityApi.upvoteQuestion(id);
      setQuestions((prev) =>
        prev.map((q) =>
          q.id === id ? { ...q, upvoteCount: (q.upvoteCount ?? 0) + 1 } : q,
        ),
      );
    } catch (e: any) {
      /* silent — upvote is non-critical */
    } finally {
      setUpvotingId(null);
    }
  }

  return (
    <div className="min-h-screen w-full bg-background px-6 py-6 pb-24">
      {/* Header */}
      <div className="flex items-start justify-between mb-5">
        <div className="flex items-center gap-3">
          <BackButton href="/dashboard/community" />
          <div>
            <p className="text-xs font-bold tracking-widest text-muted-foreground uppercase">
              SCH Hub
            </p>
            <h1 className="text-3xl font-bold text-foreground">Q&amp;A</h1>
          </div>
        </div>
        <Link
          href="/dashboard/community/qa/ask"
          className="text-foreground font-medium mt-2 text-sm hover:text-primary transition"
        >
          Ask question
        </Link>
      </div>

      {/* Type chips */}
      <div className="flex gap-2 overflow-x-auto mb-4 pb-1 scrollbar-none">
        {TYPE_CHIPS.map((t) => (
          <button
            key={t}
            onClick={() => setActiveType(activeType === t ? null : t)}
            className={`shrink-0 text-xs font-bold tracking-wide px-3 py-2.5 rounded-xl transition ${
              activeType === t
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground"
            }`}
          >
            {TYPE_LABEL[t]}
          </button>
        ))}
      </div>

      {/* Course search */}
      <div className="flex items-center gap-3 rounded-xl bg-muted px-4 py-3 mb-4">
        <Search className="w-4 h-4 text-muted-foreground shrink-0" />
        <input
          value={courseSearch}
          onChange={(e) => setCourseSearch(e.target.value)}
          placeholder="Filter by course code"
          className="flex-1 bg-transparent text-foreground placeholder:text-muted-foreground focus:outline-none text-sm uppercase"
        />
        {courseSearch && (
          <button onClick={() => setCourseSearch("")} aria-label="Clear">
            <Filter className="w-4 h-4 text-muted-foreground" />
          </button>
        )}
      </div>

      {/* Toggle filters */}
      <div className="flex gap-2 mb-5">
        <button
          onClick={() => setSolvedOnly((v) => !v)}
          className={`text-sm font-semibold px-4 py-2 rounded-xl transition ${
            solvedOnly
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-muted-foreground"
          }`}
        >
          Solved only
        </button>
        <button
          onClick={() => setMentorOnly((v) => !v)}
          className={`text-sm font-semibold px-4 py-2 rounded-xl transition ${
            mentorOnly
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-muted-foreground"
          }`}
        >
          Mentor questions
        </button>
      </div>

      <div className="h-px bg-border mb-5" />

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <AlertTriangle className="w-10 h-10 text-destructive" />
          <p className="text-destructive font-medium text-center">{error}</p>
          <button onClick={load} className="text-primary text-sm font-semibold underline">
            Retry
          </button>
        </div>
      ) : questions.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-2">
          <MessageCircle className="w-10 h-10 text-muted-foreground" />
          <p className="text-muted-foreground font-medium">No questions found</p>
          <Link
            href="/dashboard/community/qa/ask"
            className="text-primary text-sm font-semibold underline mt-1"
          >
            Be the first to ask
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {questions.map((q) => (
            <QuestionCard
              key={q.id}
              q={q}
              onUpvote={handleUpvote}
              upvoting={upvotingId === q.id}
            />
          ))}
        </div>
      )}

      {/* FAB */}
      <Link
        href="/dashboard/community/qa/ask"
        className="fixed bottom-24 right-6 flex items-center gap-2 bg-primary text-primary-foreground font-semibold rounded-full px-5 py-3.5 shadow-lg active:scale-95 transition"
      >
        <Plus className="w-5 h-5" /> Ask question
      </Link>

      {/* Community bottom nav */}
      <BottomNav />
    </div>
  );
}
