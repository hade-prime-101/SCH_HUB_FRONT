// app/study/personal/page.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { apiGet, apiDelete } from "@/lib/api";
import { Plus, BookOpen, Calendar, Trash2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton";
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
      const data = await apiGet("/ai/personal-study/sessions");
      setSessions(data.data || data || []);
    } catch (err: any) {
      setError(err.message);
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
    } catch (err: any) {
      setError(err.message);
    } finally {
      setDeleting(null);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Personal AI Study</h1>
          <Link href="/study/personal/new">
            <Button>New Session</Button>
          </Link>
        </div>
        <LoadingSkeleton count={3} height="h-24" radius="rounded-xl" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-destructive/5 border border-destructive/20 rounded-xl p-6 text-destructive">
        <p>Failed to load sessions: {error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Personal AI Study</h1>
          <p className="text-muted-foreground">Interactive AI‑powered tutoring sessions</p>
        </div>
        <Link href="/study/personal/new">
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            New Session
          </Button>
        </Link>
      </div>

      {sessions.length === 0 ? (
        <div className="bg-card rounded-2xl border border-dashed p-12 text-center">
          <BookOpen className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
          <h3 className="text-lg font-semibold">No study sessions yet</h3>
          <p className="text-muted-foreground">Create your first session and let AI help you learn.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {sessions.map((s) => (
            <div
              key={s.id}
              className="bg-card rounded-xl border border-border hover:border-primary transition-colors"
            >
              <Link href={`/study/personal/${s.id}`} className="block p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold text-foreground">{s.title}</h3>
                    {s.courseCode && (
                      <p className="text-sm text-muted-foreground">{s.courseCode}</p>
                    )}
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                      <Calendar className="w-3 h-3" />
                      <span>{new Date(s.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" asChild>
                      <Link href={`/study/personal/${s.id}`}>
                        <ArrowRight className="w-4 h-4" />
                      </Link>
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => { e.preventDefault(); handleDelete(s.id); }}
                      disabled={deleting === s.id}
                      className="text-destructive hover:text-destructive/80"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}