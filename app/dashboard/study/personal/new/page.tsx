// app/dashboard/study/personal/new/page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { apiPost } from "@/lib/api";
import type { CreateSessionPayload } from "@/types/study";

export default function NewSessionPage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [textContent, setTextContent] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [mode, setMode] = useState<"text" | "file">("text");
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title) return setError("Title is required");
    const formData = new FormData();
    formData.append("title", title);
    if (mode === "file" && file) {
      formData.append("file", file);
    } else if (mode === "text" && textContent) {
      formData.append("content", textContent);
    } else {
      return setError("Provide either text content or a file.");
    }
    try {
      const session = await apiPost("/personal-study/sessions", formData, true);
      router.push(`/dashboard/study/personal/${session.id}`);
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="max-w-xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">New Study Session</h1>
      {error && <div className="bg-red-100 text-red-700 p-3 rounded mb-4">{error}</div>}
      <form onSubmit={handleSubmit} className="bg-white shadow rounded p-6 space-y-4">
        <input
          type="text"
          placeholder="Session Title (e.g., Calculus Midterm)"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="border p-2 w-full"
          required
        />
        <div className="flex space-x-4">
          <button type="button" onClick={() => setMode("text")} className={`px-4 py-2 rounded ${mode === "text" ? "bg-blue-600 text-white" : "bg-gray-200"}`}>
            Paste Text
          </button>
          <button type="button" onClick={() => setMode("file")} className={`px-4 py-2 rounded ${mode === "file" ? "bg-blue-600 text-white" : "bg-gray-200"}`}>
            Upload File
          </button>
        </div>
        {mode === "text" ? (
          <textarea
            placeholder="Paste study material here..."
            value={textContent}
            onChange={(e) => setTextContent(e.target.value)}
            className="border p-2 w-full h-40"
          />
        ) : (
          <input type="file" onChange={(e) => setFile(e.target.files?.[0] || null)} />
        )}
        <button type="submit" className="bg-green-600 text-white px-6 py-2 rounded">
          Create Session
        </button>
      </form>
    </div>
  );
}