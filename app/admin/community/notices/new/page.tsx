"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";
import { communityApi } from "@/lib/api/community";

export default function NewNoticePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    priority: "normal" as "low" | "normal" | "high",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.content.trim()) {
      alert("Please fill in all fields");
      return;
    }

    setLoading(true);
    try {
      await communityApi.createNotice(formData);
      router.push("/admin/community/notices");
    } catch (error) {
      console.error("Failed to create notice:", error);
      alert("Failed to create notice");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <Link
        href="/admin/community/notices"
        className="flex items-center gap-2 text-primary hover:text-primary/80 mb-6 w-fit"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Notices
      </Link>

      <div className="max-w-2xl bg-card rounded-2xl p-8 border border-border">
        <h2 className="text-2xl font-bold text-foreground mb-6">Create New Notice</h2>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Title
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Enter notice title"
              className="w-full px-4 py-3 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Content
            </label>
            <textarea
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              placeholder="Enter notice content"
              rows={8}
              className="w-full px-4 py-3 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none"
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Priority
            </label>
            <div className="grid grid-cols-3 gap-3">
              {(["low", "normal", "high"] as const).map((priority) => (
                <button
                  key={priority}
                  type="button"
                  onClick={() => setFormData({ ...formData, priority })}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors capitalize ${
                    formData.priority === priority
                      ? priority === "high"
                        ? "bg-red-100 text-red-700"
                        : priority === "low"
                          ? "bg-green-100 text-green-700"
                          : "bg-blue-100 text-blue-700"
                      : "bg-muted text-muted-foreground hover:bg-accent"
                  }`}
                  disabled={loading}
                >
                  {priority}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-4 pt-4">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity font-medium disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {loading ? "Publishing..." : "Publish Notice"}
            </button>
            <Link
              href="/admin/community/notices"
              className="flex-1 px-6 py-3 border border-border text-foreground rounded-lg hover:bg-accent transition-colors font-medium text-center"
            >
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
