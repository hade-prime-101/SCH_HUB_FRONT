// app/study/personal/page.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { apiGet, apiDelete } from "@/lib/api";
import { Trash2, Plus, BookOpen, Calendar } from "lucide-react";
import type { PersonalStudySession } from "@/types/study";

export default function PersonalStudyListPage() {
  const router = useRouter();
  const [sessions, setSessions] = useState<PersonalStudySession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  const fetchSessions = async () => {
    try {
      setError(null);
      setLoading(true);
      const data = await apiGet("/ai/personal-study/sessions");
      setSessions(data.data || data || []);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      const message = err?.message || "Failed to load sessions";
      if (message.includes("No token") || err?.status === 401) {
        setError("You must be logged in to view sessions. Redirecting to login...");
        setTimeout(() => router.push("/login"), 2000);
      } else {
        setError(message);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchSessions(); }, []);

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this session and all its data?")) return;
    try {
      setDeleting(id);
      await apiDelete(`/ai/personal-study/sessions/${id}`);
      setSessions(sessions.filter(s => s.id !== id));
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      setError(err?.message || "Failed to delete session");
    } finally {
      setDeleting(null);
    }
  };

  if (error && loading) {
    return (
      <div className="max-w-2xl mx-auto py-8">
        <div className="bg-destructive/5 border border-destructive/20 rounded-lg p-4">
          <p className="text-destructive font-medium">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-1">Personal AI Study</h1>
          <p className="text-muted-foreground">Interactive tutoring sessions powered by AI</p>
        </div>
        <Link href="/study/personal/new" className="bg-primary hover:opacity-90 text-primary-foreground px-6 py-2 rounded-lg font-medium transition-opacity flex items-center gap-2">
          <Plus size={20} />
          New Session
        </Link>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading your sessions...</p>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!loading && sessions.length === 0 && (
        <div className="text-center py-16 bg-gradient-to-br from-primary/5 to-primary/10 rounded-lg border-2 border-dashed border-primary/20">
          <BookOpen size={48} className="text-primary/40 mx-auto mb-4" />
          <h3 className="text-2xl font-semibold text-gray-900 mb-2">No study sessions yet</h3>
          <p className="text-muted-foreground mb-2">Create your first personal AI study session</p>
          <p className="text-sm text-muted-foreground mb-6">Upload materials or select existing ones and let AI tutor you</p>
          <Link href="/study/personal/new" className="bg-primary hover:opacity-90 text-primary-foreground px-6 py-2 rounded-lg font-medium transition-opacity inline-block">
            Start Your First Session
          </Link>
        </div>
      )}

      {/* Sessions Grid */}
      {!loading && sessions.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {sessions.map((s) => (
            <div
              key={s.id}
              className="bg-card rounded-lg border border-gray-200 hover:shadow-lg transition-shadow duration-200 overflow-hidden group"
            >
              <Link
                href={`/study/personal/${s.id}`}
                className="block p-6 hover:bg-muted transition-colors"
              >
                <div className="flex items-start justify-between mb-3">
                  <BookOpen size={24} className="text-primary" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2 group-hover:text-primary transition">
                  {s.title}
                </h3>
                {s.courseCode && (
                  <p className="text-sm text-muted-foreground mb-3">{s.courseCode}</p>
                )}
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Calendar size={16} />
                  <span>{new Date(s.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                </div>
              </Link>
              
              <div className="px-6 py-3 bg-muted border-t border-gray-200 flex justify-between items-center">
                <Link
                  href={`/study/personal/${s.id}`}
                  className="text-primary hover:text-primary/80 font-medium text-sm"
                >
                  Continue →
                </Link>
                <button
                  onClick={() => handleDelete(s.id)}
                  disabled={deleting === s.id}
                  className="p-2 text-destructive hover:bg-destructive/5 rounded transition-colors disabled:opacity-50"
                  title="Delete session"
                >
                  {deleting === s.id ? (
                    <div className="w-4 h-4 border-2 border-red-300 border-t-red-600 rounded-full animate-spin"></div>
                  ) : (
                    <Trash2 size={18} />
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Error Message */}
      {error && !loading && (
        <div className="bg-destructive/5 border border-destructive/20 rounded-lg p-4">
          <p className="text-destructive font-medium">{error}</p>
        </div>
      )}
    </div>
  );
}