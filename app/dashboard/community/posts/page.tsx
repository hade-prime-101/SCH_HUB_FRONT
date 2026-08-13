"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { listPosts, deletePost, pinPost } from "@/lib/api/community.api";
import type { Post } from "@/types/community";

export default function PostsList() {
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
    if (!confirm("Delete this post?")) return;
    await deletePost(id);
    setPosts((prev) => prev.filter((p) => p.id !== id));
  };

  const handlePin = async (id: string, isPinned: boolean) => {
    await pinPost(id, !isPinned);
    setPosts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, isPinned: !isPinned } : p))
    );
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Discussion Posts</h1>
        <Link href="/dashboard/community/posts/new" className="bg-primary text-primary-foreground px-4 py-2 rounded">
          New Post
        </Link>
      </div>
      {posts.map((post) => (
        <div key={post.id} className="bg-white shadow rounded p-4 mb-3 flex justify-between items-start">
          <div>
            <div className="flex items-center gap-2">
              {post.isPinned && <span className="text-yellow-600 text-xs font-bold uppercase">Pinned</span>}
              <Link href={`/dashboard/community/posts/${post.id}`} className="font-medium text-primary hover:underline">
                {post.title}
              </Link>
            </div>
            <p className="text-sm text-gray-500 mt-1">
              by {post.author.name} · {post.upvotes} upvotes · {post.comments.length} comments
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => handlePin(post.id, post.isPinned)}
              className="text-sm bg-gray-200 px-2 py-1 rounded"
            >
              {post.isPinned ? "Unpin" : "Pin"}
            </button>
            <button onClick={() => handleDelete(post.id)} className="text-sm bg-destructive/10 text-destructive px-2 py-1 rounded">
              Delete
            </button>
          </div>
        </div>
      ))}
      {total > limit && (
        <div className="flex justify-between mt-4">
          <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="btn">Prev</button>
          <span>Page {page}</span>
          <button disabled={page * limit >= total} onClick={() => setPage((p) => p + 1)} className="btn">Next</button>
        </div>
      )}
    </div>
  );
}