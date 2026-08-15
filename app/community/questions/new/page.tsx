"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { CommunityHeader } from "@/components/community/CommunityHeader";
import { ErrorMessage } from "@/components/ui/ErrorMessage";
import { createQuestion } from "@/lib/api/community.api";

export default function NewQuestion() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await createQuestion({ title, content });
      router.push("/community/questions");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      setError(err.message || "Failed to ask question");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="pb-24 max-w-2xl mx-auto">
      <CommunityHeader title="Ask a Question" />

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
            placeholder="What do you need help with?"
            className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            required
          />
        </div>
        <div>
          <label htmlFor="content" className="block text-sm font-medium text-foreground mb-1">
            Details
          </label>
          <textarea
            id="content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Describe your question in detail..."
            className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring h-40 resize-none"
            required
          />
        </div>
        <div className="flex justify-end gap-3">
          <Button variant="outline" type="button" onClick={() => router.back()}>
            Cancel
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? "Posting..." : "Post Question"}
          </Button>
        </div>
      </form>
    </div>
  );
}