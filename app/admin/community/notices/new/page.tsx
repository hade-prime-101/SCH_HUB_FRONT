// app/dashboard/admin/community/notices/new/page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createNoticePost } from "@/lib/api/community.api";

export default function NewNoticePage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !content) return setError("Title and content are required");
    try {
      await createNoticePost({ title, content });
      router.push("/dashboard/admin/community/posts");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="max-w-xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Post a Notice</h1>
      {error && <div className="bg-red-100 text-red-700 p-3 rounded mb-4">{error}</div>}
      <form onSubmit={handleSubmit} className="bg-card shadow rounded p-6 space-y-4">
        <input
          type="text"
          placeholder="Notice title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="border p-2 w-full"
          required
        />
        <textarea
          placeholder="Notice content"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="border p-2 w-full h-40"
          required
        />
        <button type="submit" className="bg-primary text-primary-foreground px-4 py-2 rounded">
          Publish Notice
        </button>
      </form>
    </div>
  );
}