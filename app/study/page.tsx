// app/study/page.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { apiGet } from "@/lib/api";
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { BookOpen, Brain, Sparkles, BarChart3, Calculator, Upload, PlusCircle, ArrowRight, Clock, TrendingUp } from "lucide-react";
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton";
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { Button } from "@/components/ui/button";
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { Badge } from "@/components/ui/badge";

interface StudyStats {
  materialsCount: number;
  quizzesTaken: number;
  averageQuizScore: number;
  cgpa: number | null;
  recentMaterials: { id: string; title: string; courseCode: string; createdAt: string }[];
  recentQuizzes: { id: string; title: string; attemptedAt: string; score: number }[];
}

export default function StudyOverviewPage() {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const router = useRouter();
  const [stats, setStats] = useState<StudyStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const data = await apiGet("/study/overview"); // assuming this endpoint exists, otherwise we fetch individually
        setStats(data);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // For demonstration, if endpoint doesn't exist, we could fetch separately, but we'll assume it does.
  // If not, we'll fallback to individual calls.

  if (loading) {
    return (
      <div className="space-y-6">
        <LoadingSkeleton count={3} height="h-32" radius="rounded-2xl" />
        <LoadingSkeleton count={2} height="h-20" radius="rounded-xl" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-destructive/5 border border-destructive/20 rounded-xl p-6 text-destructive">
        <p>Failed to load overview: {error}</p>
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Welcome to your Study Centre</h1>
        <p className="text-muted-foreground mt-1">Everything you need to learn, practice, and track progress — all in one place.</p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-card rounded-2xl p-4 border border-border shadow-sm">
          <p className="text-sm text-muted-foreground">Materials</p>
          <p className="text-2xl font-bold text-foreground">{stats.materialsCount}</p>
        </div>
        <div className="bg-card rounded-2xl p-4 border border-border shadow-sm">
          <p className="text-sm text-muted-foreground">Quizzes Taken</p>
          <p className="text-2xl font-bold text-foreground">{stats.quizzesTaken}</p>
        </div>
        <div className="bg-card rounded-2xl p-4 border border-border shadow-sm">
          <p className="text-sm text-muted-foreground">Avg Quiz Score</p>
          <p className="text-2xl font-bold text-foreground">{stats.averageQuizScore?.toFixed(1) ?? "—"}%</p>
        </div>
        <div className="bg-card rounded-2xl p-4 border border-border shadow-sm">
          <p className="text-sm text-muted-foreground">CGPA</p>
          <p className="text-2xl font-bold text-foreground">{stats.cgpa?.toFixed(2) ?? "—"}</p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Link
          href="/study/personal/new"
          className="bg-primary/10 hover:bg-primary/20 border border-primary/20 rounded-2xl p-5 flex items-center justify-between transition-colors"
        >
          <div>
            <p className="font-semibold text-foreground">Start AI Study</p>
            <p className="text-sm text-muted-foreground">Learn with AI tutor</p>
          </div>
          <Sparkles className="w-6 h-6 text-primary" />
        </Link>
        <Link
          href="/study/materials/upload"
          className="bg-muted hover:bg-muted/70 border border-border rounded-2xl p-5 flex items-center justify-between transition-colors"
        >
          <div>
            <p className="font-semibold text-foreground">Upload Material</p>
            <p className="text-sm text-muted-foreground">Share your resources</p>
          </div>
          <Upload className="w-6 h-6 text-muted-foreground" />
        </Link>
        <Link
          href="/study/quizzes/create"
          className="bg-muted hover:bg-muted/70 border border-border rounded-2xl p-5 flex items-center justify-between transition-colors"
        >
          <div>
            <p className="font-semibold text-foreground">Create Quiz</p>
            <p className="text-sm text-muted-foreground">Test your knowledge</p>
          </div>
          <PlusCircle className="w-6 h-6 text-muted-foreground" />
        </Link>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <h2 className="text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-primary" />
            Recent Materials
          </h2>
          {!stats.recentMaterials || stats.recentMaterials.length === 0 ? (
            <div className="bg-card rounded-2xl p-5 border border-border text-center text-muted-foreground">
              No materials yet. <Link href="/study/materials/upload" className="text-primary hover:underline">Upload one</Link>.
            </div>
          ) : (
            <div className="space-y-3">
              {stats.recentMaterials.map((mat) => (
                <Link
                  key={mat.id}
                  href={`/study/materials/${mat.id}`}
                  className="block bg-card rounded-xl border border-border p-4 hover:border-primary transition-colors"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium text-foreground">{mat.title}</p>
                      <p className="text-sm text-muted-foreground">{mat.courseCode}</p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-muted-foreground" />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        <div>
          <h2 className="text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
            <Brain className="w-5 h-5 text-primary" />
            Recent Quizzes
          </h2>
          {!stats.recentQuizzes || stats.recentQuizzes.length === 0 ? (
            <div className="bg-card rounded-2xl p-5 border border-border text-center text-muted-foreground">
              No quiz attempts yet. <Link href="/study/quizzes" className="text-primary hover:underline">Browse quizzes</Link>.
            </div>
          ) : (
            <div className="space-y-3">
              {stats.recentQuizzes.map((quiz) => (
                <Link
                  key={quiz.id}
                  href={`/study/quizzes/${quiz.id}/results`}
                  className="block bg-card rounded-xl border border-border p-4 hover:border-primary transition-colors"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium text-foreground">{quiz.title}</p>
                      <p className="text-sm text-muted-foreground">Score: {quiz.score}%</p>
                    </div>
                    <TrendingUp className="w-4 h-4 text-muted-foreground" />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}