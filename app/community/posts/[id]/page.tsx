"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { ThumbsUp, MessageSquare, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CommunityHeader } from "@/components/community/CommunityHeader";
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton";
import { ErrorMessage } from "@/components/ui/ErrorMessage";
import { getPost, createComment, upvotePost, report } from "@/lib/api/community.api";
import type { Post } from "@/types/community";

export default function PostDetail() {
  const { id } = useParams<{ id: string }>();
  const [post, setPost] = useState<Post | null>(null);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reportError, setReportError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPost = async () => {
      setLoading(true);
      try {
        const data = await getPost(id);
        setPost(data);
      } catch (err: any) {
        setError(err.message || "Post not found");
      } finally {
        setLoading(false);
      }
    };
    fetchPost();
  }, [id]);

  const handleComment = async () => {
    if (!comment.trim()) return;
    setSubmitting(true);
    try {
      const newComment = await createComment(id, { content: comment });
      setPost((prev) =>
        prev ? { ...prev, comments: [...prev.comments, newComment] } : prev
      );
      setComment("");
    } catch (err: any) {
      alert(err.message || "Failed to post comment");
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpvote = async () => {
    if (!post) return;
    try {
      await upvotePost(post.id);
      setPost({ ...post, upvotes: post.upvotes + 1 });
    } catch (err: any) {
      alert(err.message || "Failed to upvote");
    }
  };

  const handleReport = async () => {
    if (!confirm("Report this post as inappropriate?")) return;
    try {
      await report(id, { reason: "Inappropriate content", type: "POST" });
      setReportError("Report submitted successfully.");
      setTimeout(() => setReportError(null), 3000);
    } catch (err: any) {
      alert(err.message || "Failed to report");
    }
  };

  if (loading) {
    return (
      <div className="pb-24">
        <LoadingSkeleton count={1} height="h-48" />
        <div className="mt-6 space-y-4">
          <LoadingSkeleton count={2} height="h-20" />
        </div>
      </div>
    );
  }

  if (error || !post) {
    return <ErrorMessage message={error || "Post not found"} />;
  }

  return (
    <div className="pb-24">
      <CommunityHeader title={post.title} />

      <div className="space-y-6">
        <Card>
          <CardContent className="p-5 space-y-4">
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>by {post.author.name}</span>
              <span>{new Date(post.createdAt).toLocaleDateString()}</span>
            </div>
            <div className="prose prose-sm max-w-none text-foreground">
              {post.content}
            </div>
            <div className="flex flex-wrap items-center gap-4 pt-2 border-t border-border">
              <Button size="sm" variant="outline" onClick={handleUpvote}>
                <ThumbsUp className="w-4 h-4 mr-1.5" />
                {post.upvotes}
              </Button>
              <Button size="sm" variant="ghost" onClick={handleReport}>
                <AlertCircle className="w-4 h-4 mr-1.5" />
                Report
              </Button>
              {reportError && (
                <span className="text-sm text-success">{reportError}</span>
              )}
            </div>
          </CardContent>
        </Card>

        <div>
          <h2 className="text-lg font-semibold text-foreground mb-4">
            Comments ({post.comments.length})
          </h2>
          {post.comments.length === 0 ? (
            <p className="text-sm text-muted-foreground">No comments yet.</p>
          ) : (
            <div className="space-y-3">
              {post.comments.map((c) => (
                <Card key={c.id}>
                  <CardContent className="p-4 space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">{c.author.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {new Date(c.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-sm">{c.content}</p>
                    <p className="text-xs text-muted-foreground">
                      {c.upvotes} upvotes
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        <div className="flex gap-3">
          <input
            type="text"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Write a comment..."
            className="flex-1 rounded-xl border border-border bg-background px-4 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <Button onClick={handleComment} disabled={submitting || !comment.trim()}>
            Send
          </Button>
        </div>
      </div>
    </div>
  );
}