"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createPost } from "@/lib/api/community.api";

export default function NewPost() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [section, setSection] = useState("GENERAL");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await createPost({ title, content, section: section as any });
    router.push("/dashboard/community/posts");
  };

  return (
    <div className="max-w-xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Create Post</h1>
      <form onSubmit={handleSubmit} className="bg-white shadow rounded p-6 space-y-4">
        <input
          type="text" placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)}
          className="border p-2 w-full" required
        />
        <select value={section} onChange={(e) => setSection(e.target.value)} className="border p-2 w-full">
          <option value="GENERAL">General</option>
          <option value="ACADEMICS">Academics</option>
          <option value="CAREER">Career</option>
          <option value="EVENTS">Events</option>
          <option value="NOTICE_BOARD">Notice Board</option>
        </select>
        <textarea
          placeholder="Content" value={content} onChange={(e) => setContent(e.target.value)}
          className="border p-2 w-full h-40" required
        />
        <button type="submit" className="bg-primary text-primary-foreground px-4 py-2 rounded">
          Publish
        </button>
      </form>
    </div>
  );
}