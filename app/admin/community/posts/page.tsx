// app/dashboard/admin/community/posts/page.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { listPosts, deletePost, pinPost } from "@/lib/api/community.api";
import type { Post } from "@/types/community";

export default function AdminPostsPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 10;

  useEffect(() => {
    listPosts({ page, limit }).then((res) => {
      setPosts(res.data);
      setTotal(res.total);
    });
  }, [page]);

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this post permanently?")) return;
    await deletePost(id);
    setPosts((prev) => prev.filter((p) => p.id !== id));
  };

  const handlePin = async (id: string, currentPin: boolean) => {
    await pinPost(id, !currentPin);
    setPosts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, isPinned: !currentPin } : p))
    );
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">All Posts</h1>
      {posts.map((post) => (
        <div
          key={post.id}
          className="bg-card shadow rounded p-4 mb-3 flex justify-between items-start"
        >
          <div>
            <div className="flex items-center gap-2">
              {post.isPinned && (
                <span className="text-yellow-600 text-xs font-bold uppercase">Pinned</span>
              )}
              <Link
                href={`/dashboard/community/posts/${post.id}`}
                className="font-medium text-primary hover:underline"
              >
                {post.title}
              </Link>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              by {post.author.name} · {post.upvotes} upvotes · {post.comments.length} comments
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => handlePin(post.id, post.isPinned)}
              className="text-sm bg-secondary/50 px-2 py-1 rounded"
            >
              {post.isPinned ? "Unpin" : "Pin"}
            </button>
            <button
              onClick={() => handleDelete(post.id)}
              className="text-sm bg-red-100 text-red-700 px-2 py-1 rounded"
            >
              Delete
            </button>
          </div>
        </div>
      ))}
      {total > limit && (
        <div className="flex justify-between mt-4">
          <button
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
            className="px-3 py-1 bg-secondary/50 rounded disabled:opacity-50"
          >
            Prev
          </button>
          <span>Page {page}</span>
          <button
            disabled={page * limit >= total}
            onClick={() => setPage((p) => p + 1)}
            className="px-3 py-1 bg-secondary/50 rounded disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}