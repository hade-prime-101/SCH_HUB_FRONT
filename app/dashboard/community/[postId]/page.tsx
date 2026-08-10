"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  ArrowLeft,
  MoreVertical,
  ArrowUp,
  MessageCircle,
  Smile,
  Heart,
  ThumbsUp,
  Flag,
  Trash2,
  Pin,
  Loader2,
  AlertTriangle,
  Lightbulb,
  X,
} from "lucide-react";
import { communityApi } from "@/lib/api/community";

// ─── Types ────────────────────────────────────────────────────────────────────

type ReactionType = "LIKE" | "HELPFUL" | "INSIGHTFUL" | "FUNNY" | "SUPPORT";
type ReportReason = "SPAM" | "INAPPROPRIATE" | "HARASSMENT" | "MISINFORMATION" | "OTHER";

interface Comment {
  id: string;
  content: string;
  upvoteCount: number;
  createdAt: string;
  author?: { id: string; fullName: string };
  isAnonymous?: boolean;
  replies?: Comment[];
}

interface Reaction {
  type: ReactionType;
  count: number;
}

interface Post {
  id: string;
  content: string;
  section: string;
  priority: string;
  isAnonymous: boolean;
  isPinned: boolean;
  upvoteCount: number;
  createdAt: string;
  courseTag?: string;
  author?: { id: string; fullName: string; role?: string; department?: string };
  comments: Comment[];
  reactions: Reaction[];
  attachments?: string[];
}

// ─── Constants ────────────────────────────────────────────────────────────────

const REACTION_CONFIG: Record<ReactionType, { icon: React.ElementType; label: string }> = {
  LIKE:       { icon: ThumbsUp,  label: "Like" },
  HELPFUL:    { icon: Smile,     label: "Helpful" },
  INSIGHTFUL: { icon: Lightbulb, label: "Insightful" },
  FUNNY:      { icon: Smile,     label: "Funny" },
  SUPPORT:    { icon: Heart,     label: "Support" },
};

const REPORT_REASONS: ReportReason[] = [
  "SPAM", "INAPPROPRIATE", "HARASSMENT", "MISINFORMATION", "OTHER",
];

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

function reactionCount(reactions: Reaction[], type: ReactionType): number {
  return reactions.find((r) => r.type === type)?.count ?? 0;
}

// ─── Report Modal ─────────────────────────────────────────────────────────────

function ReportModal({
  onReport,
  onClose,
  reporting,
}: {
  onReport: (reason: ReportReason, details: string) => void;
  onClose: () => void;
  reporting: boolean;
}) {
  const [reason, setReason]   = useState<ReportReason>("SPAM");
  const [details, setDetails] = useState("");

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40">
      <div className="w-full max-w-lg bg-card rounded-t-3xl p-6 pb-10 flex flex-col gap-4">
        <h2 className="text-lg font-bold text-foreground">Report Post</h2>
        <div className="flex flex-wrap gap-2">
          {REPORT_REASONS.map((r) => (
            <button
              key={r}
              onClick={() => setReason(r)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition ${
                reason === r
                  ? "bg-destructive text-white border-destructive"
                  : "border-border text-muted-foreground"
              }`}
            >
              {r}
            </button>
          ))}
        </div>
        <textarea
          value={details}
          onChange={(e) => setDetails(e.target.value)}
          placeholder="Additional details (optional)"
          rows={3}
          className="w-full rounded-xl bg-muted border border-border px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
        />
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 rounded-2xl border border-border py-3 text-foreground font-semibold"
          >
            Cancel
          </button>
          <button
            onClick={() => onReport(reason, details)}
            disabled={reporting}
            className="flex-1 rounded-2xl bg-destructive text-white font-semibold py-3 flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {reporting && <Loader2 className="w-4 h-4 animate-spin" />}
            {reporting ? "Reporting…" : "Report"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Comment Item ─────────────────────────────────────────────────────────────

function CommentItem({
  comment,
  isReply = false,
  onUpvote,
  onReply,
  upvoting,
}: {
  comment: Comment;
  isReply?: boolean;
  onUpvote: (id: string) => void;
  onReply: (id: string, author: string) => void;
  upvoting: boolean;
}) {
  const name = comment.isAnonymous ? "Anonymous" : (comment.author?.fullName ?? "Unknown");

  return (
    <div className={`flex gap-3 ${isReply ? "ml-11 mt-4" : ""}`}>
      <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-xs font-bold text-foreground shrink-0">
        {comment.isAnonymous ? "?" : initials(name)}
      </div>
      <div className="flex-1">
        <div className="flex items-center justify-between">
          <p className="font-bold text-foreground">{name}</p>
          <button
            onClick={() => onUpvote(comment.id)}
            disabled={upvoting}
            className={`flex items-center gap-1 text-muted-foreground text-sm transition hover:text-primary ${
              upvoting ? "opacity-50" : ""
            }`}
            aria-label="Upvote comment"
          >
            <ArrowUp className="w-4 h-4" />
            {comment.upvoteCount ?? 0}
          </button>
        </div>
        <p className="text-muted-foreground text-sm mb-1">{timeAgo(comment.createdAt)}</p>
        <p className="text-foreground">{comment.content}</p>
        {!isReply && (
          <button
            onClick={() => onReply(comment.id, name)}
            className="text-muted-foreground font-semibold text-sm mt-1 hover:text-primary transition"
          >
            Reply
          </button>
        )}
        {/* Nested replies */}
        {comment.replies?.map((r) => (
          <CommentItem
            key={r.id}
            comment={r}
            isReply
            onUpvote={onUpvote}
            onReply={onReply}
            upvoting={upvoting}
          />
        ))}
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function PostDetailPage() {
  const router    = useRouter();
  const params    = useParams();
  const postId    = params.postId as string;

  const [post, setPost]               = useState<Post | null>(null);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState<string | null>(null);
  const [menuOpen, setMenuOpen]       = useState(false);
  const [showReactions, setShowReactions] = useState(false);
  const [showReport, setShowReport]   = useState(false);

  // Comment state
  const [commentText, setCommentText] = useState("");
  const [replyTo, setReplyTo]         = useState<{ id: string; author: string } | null>(null);
  const [submittingComment, setSubmittingComment] = useState(false);
  const [upvotingComment, setUpvotingComment]     = useState<string | null>(null);
  const [upvotingPost, setUpvotingPost]           = useState(false);
  const [reactingType, setReactingType]           = useState<ReactionType | null>(null);
  const [reporting, setReporting]                 = useState(false);
  const [deleting, setDeleting]                   = useState(false);
  const [actionError, setActionError]             = useState<string | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await communityApi.getPost(postId);
        if (!cancelled) setPost(data);
      } catch (e: any) {
        if (!cancelled) setError(e.message || "Failed to load post.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [postId]);

  async function handleUpvotePost() {
    if (!post) return;
    setUpvotingPost(true);
    try {
      await communityApi.upvotePost(postId);
      setPost((p) => p ? { ...p, upvoteCount: (p.upvoteCount ?? 0) + 1 } : p);
    } finally {
      setUpvotingPost(false);
    }
  }

  async function handleReact(type: ReactionType) {
    if (!post) return;
    setReactingType(type);
    try {
      await communityApi.reactToPost(postId, type);
      setPost((p) => {
        if (!p) return p;
        const existing = p.reactions.find((r) => r.type === type);
        const reactions = existing
          ? p.reactions.map((r) => r.type === type ? { ...r, count: r.count + 1 } : r)
          : [...p.reactions, { type, count: 1 }];
        return { ...p, reactions };
      });
      setShowReactions(false);
    } finally {
      setReactingType(null);
    }
  }

  async function handleUpvoteComment(id: string) {
    setUpvotingComment(id);
    try {
      await communityApi.upvoteComment(id);
      setPost((p) => {
        if (!p) return p;
        const bump = (comments: Comment[]): Comment[] =>
          comments.map((c) => {
            if (c.id === id) return { ...c, upvoteCount: (c.upvoteCount ?? 0) + 1 };
            if (c.replies)   return { ...c, replies: bump(c.replies) };
            return c;
          });
        return { ...p, comments: bump(p.comments) };
      });
    } finally {
      setUpvotingComment(null);
    }
  }

  function handleReply(id: string, author: string) {
    setReplyTo({ id, author });
    setCommentText(`@${author} `);
    inputRef.current?.focus();
  }

  async function handleSubmitComment() {
    if (!commentText.trim()) return;
    setSubmittingComment(true);
    try {
      const newComment = await communityApi.addComment(
        postId,
        commentText.trim(),
        replyTo?.id ?? null,
      );
      setPost((p) => {
        if (!p) return p;
        if (replyTo) {
          const inject = (comments: Comment[]): Comment[] =>
            comments.map((c) =>
              c.id === replyTo.id
                ? { ...c, replies: [...(c.replies ?? []), newComment] }
                : c,
            );
          return { ...p, comments: inject(p.comments) };
        }
        return { ...p, comments: [...p.comments, newComment] };
      });
      setCommentText("");
      setReplyTo(null);
    } catch (e: any) {
      setActionError(e.message || "Failed to post comment.");
    } finally {
      setSubmittingComment(false);
    }
  }

  async function handleDelete() {
    if (!confirm("Delete this post?")) return;
    setDeleting(true);
    try {
      await communityApi.deletePost(postId);
      router.replace("/dashboard/community");
    } catch (e: any) {
      setActionError(e.message || "Failed to delete post.");
      setDeleting(false);
    }
  }

  async function handlePin() {
    if (!post) return;
    try {
      await communityApi.pinPost(postId, !post.isPinned);
      setPost((p) => p ? { ...p, isPinned: !p.isPinned } : p);
    } catch (e: any) {
      setActionError(e.message || "Failed to pin post.");
    }
    setMenuOpen(false);
  }

  async function handleReport(reason: ReportReason, details: string) {
    setReporting(true);
    try {
      await communityApi.reportPost(postId, reason, details);
      setShowReport(false);
    } catch (e: any) {
      setActionError(e.message || "Failed to report post.");
    } finally {
      setReporting(false);
    }
  }

  const totalComments = post
    ? post.comments.reduce((acc, c) => acc + 1 + (c.replies?.length ?? 0), 0)
    : 0;

  return (
    <div className="min-h-screen w-full bg-muted pb-32">
      {/* Header */}
      <div className="bg-card px-4 py-4 flex items-center justify-between relative">
        <button onClick={() => router.back()} aria-label="Go back">
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <div className="text-center">
          <h1 className="font-serif text-xl font-bold text-foreground">Post Detail</h1>
          <p className="text-muted-foreground text-sm">SCH Hub</p>
        </div>
        <button
          onClick={() => setMenuOpen((v) => !v)}
          aria-label="More options"
        >
          <MoreVertical className="w-5 h-5 text-foreground" />
        </button>

        {/* Context menu */}
        {menuOpen && (
          <div className="absolute right-4 top-14 bg-card rounded-2xl shadow-lg border border-border py-2 w-44 z-10">
            <button
              onClick={() => { setShowReport(true); setMenuOpen(false); }}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-foreground hover:bg-muted transition"
            >
              <Flag className="w-4 h-4" /> Report
            </button>
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-destructive hover:bg-destructive/10 transition"
            >
              {deleting
                ? <Loader2 className="w-4 h-4 animate-spin" />
                : <Trash2 className="w-4 h-4" />
              }
              Delete
            </button>
            <button
              onClick={handlePin}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-foreground hover:bg-muted transition"
            >
              <Pin className="w-4 h-4" />
              {post?.isPinned ? "Unpin" : "Pin"}
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
            <X className="w-4 h-4 text-destructive" />
          </button>
        </div>
      )}

      {/* Loading / Error */}
      {loading && (        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
        </div>
      )}
      {error && (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <AlertTriangle className="w-10 h-10 text-destructive" />
          <p className="text-destructive font-medium">{error}</p>
          <button
            onClick={() => router.back()}
            className="text-primary text-sm font-semibold underline"
          >
            Go back
          </button>
        </div>
      )}

      {post && (
        <>
          {/* Post card */}
          <div className="bg-card m-4 rounded-2xl p-5">
            {/* Author row */}
            <div className="flex items-center gap-3 mb-3 flex-wrap">
              <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center text-sm font-bold text-foreground shrink-0">
                {post.isAnonymous ? "?" : initials(post.author?.fullName ?? "?")}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-foreground">
                  {post.isAnonymous ? "Anonymous" : (post.author?.fullName ?? "Unknown")}
                </p>
                {post.author?.department && (
                  <p className="text-xs text-muted-foreground">{post.author.department}</p>
                )}
              </div>
              {post.courseTag && (
                <span className="text-xs font-semibold border border-border rounded-lg px-2.5 py-1 text-foreground">
                  {post.courseTag}
                </span>
              )}
              {post.author?.role && (
                <span className="text-xs font-semibold bg-muted rounded-lg px-2.5 py-1 text-muted-foreground">
                  {post.author.role}
                </span>
              )}
              {post.isPinned && (
                <span className="text-xs font-semibold bg-accent text-primary rounded-lg px-2.5 py-1">
                  📌 Pinned
                </span>
              )}
            </div>

            <p className="text-muted-foreground text-sm mb-3">{timeAgo(post.createdAt)}</p>
            <p className="text-foreground mb-4 leading-relaxed">{post.content}</p>

            {/* Attachments placeholder */}
            {post.attachments && post.attachments.length > 0 && (
              <div className="grid grid-cols-2 gap-2 mb-4">
                {post.attachments.slice(0, 4).map((a, i) => (
                  <div key={i} className="aspect-[4/3] rounded-xl bg-muted flex items-center justify-center text-xs text-muted-foreground">
                    {a}
                  </div>
                ))}
              </div>
            )}

            {/* Stats / actions */}
            <div className="flex items-center gap-4 text-muted-foreground text-sm flex-wrap">
              <button
                onClick={handleUpvotePost}
                disabled={upvotingPost}
                className="flex items-center gap-1 hover:text-primary transition disabled:opacity-50"
                aria-label="Upvote post"
              >
                <ArrowUp className="w-4 h-4" />
                {post.upvoteCount ?? 0}
              </button>
              <span className="flex items-center gap-1">
                <MessageCircle className="w-4 h-4" />
                {totalComments} comments
              </span>
              {/* Reactions summary */}
              {(["HELPFUL", "SUPPORT", "LIKE"] as ReactionType[]).map((type) => {
                const cfg   = REACTION_CONFIG[type];
                const count = reactionCount(post.reactions, type);
                if (count === 0 && !showReactions) return null;
                return (
                  <button
                    key={type}
                    onClick={() => handleReact(type)}
                    disabled={reactingType !== null}
                    className="flex items-center gap-1 hover:text-primary transition disabled:opacity-50"
                    aria-label={`React ${cfg.label}`}
                  >
                    <cfg.icon className="w-4 h-4" />
                    {count > 0 && count}
                  </button>
                );
              })}
              <button
                onClick={() => setShowReactions((v) => !v)}
                className="flex items-center gap-1 hover:text-primary transition"
                aria-label="Show all reactions"
              >
                <Smile className="w-4 h-4" />
              </button>
            </div>

            {/* Expanded reactions */}
            {showReactions && (
              <div className="flex gap-3 mt-3 pt-3 border-t border-border flex-wrap">
                {(Object.keys(REACTION_CONFIG) as ReactionType[]).map((type) => {
                  const cfg   = REACTION_CONFIG[type];
                  const count = reactionCount(post.reactions, type);
                  return (
                    <button
                      key={type}
                      onClick={() => handleReact(type)}
                      disabled={reactingType !== null}
                      className="flex items-center gap-1.5 bg-muted rounded-xl px-3 py-1.5 text-sm font-medium text-foreground hover:bg-accent transition disabled:opacity-50"
                    >
                      <cfg.icon className="w-4 h-4" />
                      {cfg.label}
                      {count > 0 && <span className="text-muted-foreground">{count}</span>}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Comments */}
          <div className="bg-card mx-4 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-serif text-xl font-bold text-foreground">Comments</h2>
              <span className="text-muted-foreground font-medium">{totalComments}</span>
            </div>
            {post.comments.length === 0 ? (
              <p className="text-center text-muted-foreground py-6">
                No comments yet. Be the first!
              </p>
            ) : (
              <div className="flex flex-col gap-5">
                {post.comments.map((c) => (
                  <CommentItem
                    key={c.id}
                    comment={c}
                    onUpvote={handleUpvoteComment}
                    onReply={handleReply}
                    upvoting={upvotingComment === c.id}
                  />
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {/* Comment input */}
      <div className="fixed bottom-0 left-0 right-0 bg-card border-t border-border px-4 py-3">
        {replyTo && (
          <div className="flex items-center justify-between text-xs text-muted-foreground mb-2 px-1">
            <span>Replying to <strong className="text-foreground">{replyTo.author}</strong></span>
            <button
              onClick={() => { setReplyTo(null); setCommentText(""); }}
              className="text-destructive font-semibold"
            >
              Cancel
            </button>
          </div>
        )}
        <div className="flex items-center gap-3">
          <input
            ref={inputRef}
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSubmitComment(); } }}
            placeholder="Write a comment…"
            className="flex-1 bg-muted rounded-full px-4 py-2.5 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <button
            onClick={handleSubmitComment}
            disabled={submittingComment || !commentText.trim()}
            aria-label="Post comment"
            className="w-10 h-10 rounded-full bg-primary flex items-center justify-center shrink-0 disabled:opacity-50 transition"
          >
            {submittingComment
              ? <Loader2 className="w-5 h-5 text-primary-foreground animate-spin" />
              : <ArrowUp className="w-5 h-5 text-primary-foreground" />
            }
          </button>
        </div>
      </div>

      {/* Report modal */}
      {showReport && (
        <ReportModal
          onReport={handleReport}
          onClose={() => setShowReport(false)}
          reporting={reporting}
        />
      )}

      {/* Close menu on outside tap */}
      {menuOpen && (
        <div
          className="fixed inset-0 z-0"
          onClick={() => setMenuOpen(false)}
        />
      )}
    </div>
  );
}
