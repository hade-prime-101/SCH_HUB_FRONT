// app/dashboard/admin/community/notices/page.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { listPosts, deletePost, pinPost } from "@/lib/api/community.api";
import type { Post } from "@/types/community";

export default function AdminNoticesPage() {
  const [notices, setNotices] = useState<Post[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 10;

  const fetchNotices = () => {
    // Only fetch posts from the NOTICE_BOARD section
    listPosts({ page, limit, section: "NOTICE_BOARD" }).then((res) => {
      setNotices(res.data);
      setTotal(res.total);
    });
  };

  useEffect(() => {
    fetchNotices();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this notice?")) return;
    await deletePost(id);
    setNotices((prev) => prev.filter((n) => n.id !== id));
  };

  const handlePin = async (id: string, currentPin: boolean) => {
    await pinPost(id, !currentPin);
    setNotices((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isPinned: !currentPin } : n))
    );
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Notice Board</h1>
        <Link
          href="/dashboard/admin/community/notices/new"
          className="bg-primary text-primary-foreground px-4 py-2 rounded"
        >
          New Notice
        </Link>
      </div>

      {notices.length === 0 ? (
        <p className="text-muted-foreground">No notices posted yet.</p>
      ) : (
        notices.map((notice) => (
          <div
            key={notice.id}
            className="bg-card shadow rounded p-4 mb-3 flex justify-between items-start"
          >
            <div>
              <div className="flex items-center gap-2">
                {notice.isPinned && (
                  <span className="text-yellow-600 text-xs font-bold uppercase">Pinned</span>
                )}
                <span className="font-medium">{notice.title}</span>
              </div>
              <p className="text-sm text-muted-foreground mt-1">{notice.content.slice(0, 150)}...</p>
              <p className="text-xs text-muted-foreground/70 mt-1">
                Posted {new Date(notice.createdAt).toLocaleDateString()} · {notice.upvotes} upvotes
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => handlePin(notice.id, notice.isPinned)}
                className="text-sm bg-secondary/50 px-2 py-1 rounded"
              >
                {notice.isPinned ? "Unpin" : "Pin"}
              </button>
              <button
                onClick={() => handleDelete(notice.id)}
                className="text-sm bg-red-100 text-red-700 px-2 py-1 rounded"
              >
                Delete
              </button>
            </div>
          </div>
        ))
      )}

      {total > limit && (
        <div className="flex justify-between mt-4">
          <button
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
            className="px-3 py-1 bg-secondary/50 rounded disabled:opacity-50"
          >
            Prev
          </button>
          <span>Page {page} of {Math.ceil(total / limit)}</span>
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