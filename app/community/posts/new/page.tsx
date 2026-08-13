"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { CommunityHeader } from "@/components/community/CommunityHeader";
import { ErrorMessage } from "@/components/ui/ErrorMessage";
import { createPost } from "@/lib/api/community.api";
import type { PostSection } from "@/types/community";

export default function NewPost() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [section, setSection] = useState<PostSection>("GENERAL");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await createPost({ title, content, section });
      router.push("/community/posts");
    } catch (err: any) {
      setError(err.message || "Failed to create post");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="pb-24 max-w-2xl mx-auto">
      <CommunityHeader title="Create Post" />

      <form onSubmit={handleSubmit} className="space-y-5">
        {error && <ErrorMessage message={error} />}
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-foreground mb-1">
            Title
          </label>
          <input
            id="title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="What's on your mind?"
            className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            required
          />
        </div>
        <div>
          <label htmlFor="section" className="block text-sm font-medium text-foreground mb-1">
            Category
          </label>
          <select
            id="section"
            value={section}
            onChange={(e) => setSection(e.target.value as PostSection)}
            className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="GENERAL">General</option>
            <option value="ACADEMICS">Academics</option>
            <option value="CAREER">Career</option>
            <option value="EVENTS">Events</option>
            <option value="NOTICE_BOARD">Notice Board</option>
          </select>
        </div>
        <div>
          <label htmlFor="content" className="block text-sm font-medium text-foreground mb-1">
            Content
          </label>
          <textarea
            id="content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Write your post here..."
            className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring h-40 resize-none"
            required
          />
        </div>
        <div className="flex justify-end gap-3">
          <Button variant="outline" type="button" onClick={() => router.back()}>
            Cancel
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? "Publishing..." : "Publish"}
          </Button>
        </div>
      </form>
    </div>
  );
}