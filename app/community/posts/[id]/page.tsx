"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { getPost, createComment, upvotePost, report } from "@/lib/api/community.api";
import type { Post, Comment } from "@/types/community";

export default function PostDetail() {
  const { id } = useParams<{ id: string }>();
  const [post, setPost] = useState<Post | null>(null);
  const [comment, setComment] = useState("");
  const [submittingComment, setSubmittingComment] = useState(false);

  useEffect(() => {
    getPost(id).then(setPost);
  }, [id]);

  const handleComment = async () => {
    if (!comment.trim()) return;
    setSubmittingComment(true);
    try {
      const newComment = await createComment(id, { content: comment });
      setPost((prev) =>
        prev ? { ...prev, comments: [...prev.comments, newComment] } : prev
      );
      setComment("");
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleUpvote = async () => {
    if (!post) return;
    await upvotePost(post.id);
    setPost({ ...post, upvotes: post.upvotes + 1 });
  };

  const handleReport = async () => {
    await report(id, { reason: "Inappropriate content", type: "POST" });
    alert("Report submitted.");
  };

  if (!post) return <p>Loading...</p>;

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-2">{post.title}</h1>
      <p className="text-muted-foreground mb-4">by {post.author.name} · {post.upvotes} upvotes</p>
      <div className="prose mb-6">{post.content}</div>
      <div className="flex gap-3 mb-6">
        <button onClick={handleUpvote} className="bg-secondary/50 px-3 py-1 rounded">👍 Upvote</button>
        <button onClick={handleReport} className="text-destructive underline text-sm">Report</button>
      </div>

      <h2 className="text-lg font-semibold mb-3">Comments ({post.comments.length})</h2>
      <div className="space-y-3 mb-6">
        {post.comments.map((c) => (
          <div key={c.id} className="bg-muted p-3 rounded">
            <p className="font-medium text-sm">{c.author.name}</p>
            <p>{c.content}</p>
            <p className="text-xs text-muted-foreground/70">{c.upvotes} upvotes</p>
          </div>
        ))}
      </div>

      <div className="flex gap-2">
        <input
          type="text"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Write a comment..."
          className="border p-2 flex-1"
        />
        <button onClick={handleComment} disabled={submittingComment} className="bg-primary text-primary-foreground px-4 py-2 rounded">
          Send
        </button>
      </div>
    </div>
  );
}