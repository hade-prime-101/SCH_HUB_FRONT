"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  ArrowLeft,
  MoreVertical,
  ArrowUp,
  MessageCircle,
  CheckCircle2,
  Trash2,
  Loader2,
  AlertTriangle,
  XCircle,
} from "lucide-react";
import { communityApi } from "@/lib/api/community";

// ─── Types ────────────────────────────────────────────────────────────────────

type QuestionType =
  | "COURSE_HELP"
  | "ASSIGNMENT_HELP"
  | "CONCEPT_EXPLANATION"
  | "EXAM_PREP"
  | "PROJECT_GUIDANCE";

interface Answer {
  id: string;
  content: string;
  upvoteCount: number;
  isAccepted: boolean;
  createdAt: string;
  author?: { id: string; fullName: string };
  isAnonymous?: boolean;
}

interface Question {
  id: string;
  title: string;
  content?: string;
  type: QuestionType;
  courseTag: string;
  isAnonymous: boolean;
  isMentorQuestion: boolean;
  isSolved: boolean;
  upvoteCount: number;
  createdAt: string;
  author?: { id: string; fullName: string };
  answers: Answer[];
}

// ─── Constants ────────────────────────────────────────────────────────────────

const TYPE_LABEL: Record<QuestionType, string> = {
  COURSE_HELP:          "Course Help",
  ASSIGNMENT_HELP:      "Assignment Help",
  CONCEPT_EXPLANATION:  "Concept Explanation",
  EXAM_PREP:            "Exam Prep",
  PROJECT_GUIDANCE:     "Project Guidance",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function timeAgo(iso: string): string {
  const diff  = Date.now() - new Date(iso).getTime();
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
  return name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
}

// ─── Answer Card ──────────────────────────────────────────────────────────────

function AnswerCard({
  answer,
  questionId,
  onUpvote,
  onAccept,
  onDelete,
  upvoting,
  accepting,
  deleting,
}: {
  answer: Answer;
  questionId: string;
  onUpvote: (id: string) => void;
  onAccept: (id: string) => void;
  onDelete: (id: string) => void;
  upvoting: boolean;
  accepting: boolean;
  deleting: boolean;
}) {
  const name = answer.isAnonymous ? "Anonymous" : (answer.author?.fullName ?? "Unknown");

  return (
    <div className="flex flex-col gap-3 pb-5 border-b border-border last:border-0 last:pb-0">
      {/* Author row */}
      <div className="flex items-center gap-2">
        <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center text-xs font-bold text-foreground shrink-0">
          {answer.isAnonymous ? "?" : initials(name)}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-foreground">{name}</p>
          <p className="text-xs text-muted-foreground">{timeAgo(answer.createdAt)}</p>
        </div>
        {answer.isAccepted && (
          <span className="flex items-center gap-1 text-xs font-bold text-emerald-600 border border-emerald-300 rounded-lg px-2.5 py-1">
            <CheckCircle2 className="w-3 h-3" /> Accepted
          </span>
        )}
      </div>

      {/* Content */}
      <p className="text-foreground leading-relaxed">{answer.content}</p>

      {/* Actions */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => onUpvote(answer.id)}
          disabled={upvoting}
          className="flex items-center gap-1.5 text-muted-foreground text-sm hover:text-primary transition disabled:opacity-50"
          aria-label="Upvote answer"
        >
          <ArrowUp className="w-4 h-4" />
          {answer.upvoteCount ?? 0}
        </button>

        {!answer.isAccepted && (
          <button
            onClick={() => onAccept(answer.id)}
            disabled={accepting}
            className="flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline transition disabled:opacity-50"
          >
            {accepting
              ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
              : <CheckCircle2 className="w-3.5 h-3.5" />
            }
            Accept
          </button>
        )}

        <button
          onClick={() => onDelete(answer.id)}
          disabled={deleting}
          className="ml-auto flex items-center gap-1.5 text-sm text-destructive hover:opacity-70 transition disabled:opacity-50"
          aria-label="Delete answer"
        >
          {deleting
            ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
            : <Trash2 className="w-3.5 h-3.5" />
          }
        </button>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function QuestionDetailPage() {
  const router   = useRouter();
  const params   = useParams();
  const questionId = params.questionId as string;

  const [question, setQuestion]       = useState<Question | null>(null);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState<string | null>(null);
  const [menuOpen, setMenuOpen]       = useState(false);
  const [deleting, setDeleting]       = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  // answer input
  const [answerText, setAnswerText]         = useState("");
  const [submitting, setSubmitting]         = useState(false);
  const [upvotingPost, setUpvotingPost]     = useState(false);
  const [upvotingAnswer, setUpvotingAnswer] = useState<string | null>(null);
  const [acceptingAnswer, setAcceptingAnswer] = useState<string | null>(null);
  const [deletingAnswer, setDeletingAnswer]   = useState<string | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await communityApi.getQuestion(questionId);
        if (!cancelled) setQuestion(data);
      } catch (e: any) {
        if (!cancelled) setError(e.message || "Failed to load question.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [questionId]);

  async function handleUpvoteQuestion() {
    if (!question) return;
    setUpvotingPost(true);
    try {
      await communityApi.upvoteQuestion(questionId);
      setQuestion((q) => q ? { ...q, upvoteCount: (q.upvoteCount ?? 0) + 1 } : q);
    } finally {
      setUpvotingPost(false);
    }
  }

  async function handleUpvoteAnswer(id: string) {
    setUpvotingAnswer(id);
    try {
      await communityApi.upvoteAnswer(id);
      setQuestion((q) => q ? {
        ...q,
        answers: q.answers.map((a) =>
          a.id === id ? { ...a, upvoteCount: (a.upvoteCount ?? 0) + 1 } : a,
        ),
      } : q);
    } finally {
      setUpvotingAnswer(null);
    }
  }

  async function handleAcceptAnswer(id: string) {
    if (!question) return;
    setAcceptingAnswer(id);
    try {
      await communityApi.acceptAnswer(questionId, id);
      setQuestion((q) => q ? {
        ...q,
        isSolved: true,
        answers: q.answers.map((a) =>
          a.id === id ? { ...a, isAccepted: true } : a,
        ),
      } : q);
    } catch (e: any) {
      setActionError(e.message || "Failed to accept answer.");
    } finally {
      setAcceptingAnswer(null);
    }
  }

  async function handleDeleteAnswer(id: string) {
    setDeletingAnswer(id);
    try {
      await communityApi.deleteAnswer(id);
      setQuestion((q) => q ? {
        ...q,
        answers: q.answers.filter((a) => a.id !== id),
      } : q);
    } catch (e: any) {
      setActionError(e.message || "Failed to delete answer.");
    } finally {
      setDeletingAnswer(null);
    }
  }

  async function handleDeleteQuestion() {
    if (!confirm("Delete this question?")) return;
    setDeleting(true);
    try {
      await communityApi.deleteQuestion(questionId);
      router.replace("/dashboard/community/qa");
    } catch (e: any) {
      setActionError(e.message || "Failed to delete question.");
      setDeleting(false);
    }
  }

  async function handleSubmitAnswer() {
    if (!answerText.trim()) return;
    setSubmitting(true);
    try {
      const newAnswer = await communityApi.postAnswer(questionId, answerText.trim());
      setQuestion((q) => q ? { ...q, answers: [...q.answers, newAnswer] } : q);
      setAnswerText("");
    } catch (e: any) {
      setActionError(e.message || "Failed to post answer.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen w-full bg-muted pb-32">
      {/* Header */}
      <div className="bg-card px-4 py-4 flex items-center justify-between relative">
        <button onClick={() => router.back()} aria-label="Go back">
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <div className="text-center">
          <h1 className="font-serif text-xl font-bold text-foreground">Question</h1>
          <p className="text-muted-foreground text-sm">SCH Hub</p>
        </div>
        <button onClick={() => setMenuOpen((v) => !v)} aria-label="More options">
          <MoreVertical className="w-5 h-5 text-foreground" />
        </button>

        {/* Context menu */}
        {menuOpen && (
          <div className="absolute right-4 top-14 bg-card rounded-2xl shadow-lg border border-border py-2 w-44 z-10">
            <button
              onClick={handleDeleteQuestion}
              disabled={deleting}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-destructive hover:bg-destructive/10 transition"
            >
              {deleting
                ? <Loader2 className="w-4 h-4 animate-spin" />
                : <Trash2 className="w-4 h-4" />
              }
              Delete
            </button>
          </div>
        )}
      </div>

      {/* Action error banner */}
      {actionError && (
        <div className="mx-4 mt-2 flex items-center gap-3 bg-destructive/10 rounded-2xl px-4 py-3">
          <AlertTriangle className="w-4 h-4 text-destructive shrink-0" />
          <p className="text-sm text-destructive flex-1">{actionError}</p>
          <button onClick={() => setActionError(null)} aria-label="Dismiss">
            <XCircle className="w-4 h-4 text-destructive" />
          </button>
        </div>
      )}

      {/* Loading / Error */}
      {loading && (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
        </div>
      )}
      {error && (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <AlertTriangle className="w-10 h-10 text-destructive" />
          <p className="text-destructive font-medium">{error}</p>
          <button onClick={() => router.back()} className="text-primary text-sm font-semibold underline">
            Go back
          </button>
        </div>
      )}

      {question && (
        <>
          {/* Question card */}
          <div className="bg-card m-4 rounded-2xl p-5">
            {/* Author row */}
            <div className="flex items-center gap-3 mb-3 flex-wrap">
              <div className="w-11 h-11 rounded-full bg-muted flex items-center justify-center text-sm font-bold text-foreground shrink-0">
                {question.isAnonymous ? "?" : initials(question.author?.fullName ?? "?")}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-foreground">
                  {question.isAnonymous ? "Anonymous" : (question.author?.fullName ?? "Unknown")}
                </p>
              </div>
              <span className="text-xs font-bold border border-border rounded-lg px-2.5 py-1 text-foreground">
                {question.courseTag}
              </span>
              {question.isMentorQuestion && (
                <span className="text-xs font-bold bg-accent text-primary rounded-lg px-2.5 py-1">
                  Mentor
                </span>
              )}
            </div>

            {/* Type + time */}
            <p className="text-sm text-muted-foreground mb-3">
              {TYPE_LABEL[question.type]} · {timeAgo(question.createdAt)}
            </p>

            {/* Title */}
            <h2 className="text-xl font-bold text-foreground leading-snug mb-3">
              {question.title}
            </h2>

            {/* Content */}
            {question.content && (
              <p className="text-foreground leading-relaxed mb-4">{question.content}</p>
            )}

            {/* Stats */}
            <div className="flex items-center gap-4 text-muted-foreground text-sm flex-wrap">
              <button
                onClick={handleUpvoteQuestion}
                disabled={upvotingPost}
                className="flex items-center gap-1 hover:text-primary transition disabled:opacity-50"
                aria-label="Upvote question"
              >
                <ArrowUp className="w-4 h-4" />
                {question.upvoteCount ?? 0}
              </button>
              <span className="flex items-center gap-1">
                <MessageCircle className="w-4 h-4" />
                {question.answers.length} answers
              </span>
              {question.isSolved && (
                <span className="flex items-center gap-1 text-xs font-bold text-emerald-600 border border-emerald-300 rounded-lg px-2.5 py-1">
                  <CheckCircle2 className="w-3 h-3" /> Solved
                </span>
              )}
            </div>
          </div>

          {/* Answers */}
          <div className="bg-card mx-4 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-serif text-xl font-bold text-foreground">Answers</h2>
              <span className="text-muted-foreground font-medium">{question.answers.length}</span>
            </div>

            {question.answers.length === 0 ? (
              <p className="text-center text-muted-foreground py-6">
                No answers yet. Be the first!
              </p>
            ) : (
              <div className="flex flex-col gap-5">
                {question.answers.map((a) => (
                  <AnswerCard
                    key={a.id}
                    answer={a}
                    questionId={questionId}
                    onUpvote={handleUpvoteAnswer}
                    onAccept={handleAcceptAnswer}
                    onDelete={handleDeleteAnswer}
                    upvoting={upvotingAnswer === a.id}
                    accepting={acceptingAnswer === a.id}
                    deleting={deletingAnswer === a.id}
                  />
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {/* Answer input */}
      <div className="fixed bottom-0 left-0 right-0 bg-card border-t border-border px-4 py-3">
        <div className="flex items-center gap-3">
          <input
            ref={inputRef}
            value={answerText}
            onChange={(e) => setAnswerText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSubmitAnswer();
              }
            }}
            placeholder="Write an answer…"
            className="flex-1 bg-muted rounded-full px-4 py-2.5 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <button
            onClick={handleSubmitAnswer}
            disabled={submitting || !answerText.trim()}
            aria-label="Post answer"
            className="w-10 h-10 rounded-full bg-primary flex items-center justify-center shrink-0 disabled:opacity-50 transition"
          >
            {submitting
              ? <Loader2 className="w-5 h-5 text-primary-foreground animate-spin" />
              : <ArrowUp className="w-5 h-5 text-primary-foreground" />
            }
          </button>
        </div>
      </div>

      {/* Close menu on outside tap */}
      {menuOpen && (
        <div className="fixed inset-0 z-0" onClick={() => setMenuOpen(false)} />
      )}
    </div>
  );
}
