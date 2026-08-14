// app/study/quizzes/page.tsx
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { apiGet } from "@/lib/api";
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { Brain, Plus, ChevronRight, Clock, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton";
import type { Quiz } from "@/types/study";

export default function QuizzesListPage() {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const data = await apiGet("/study/quizzes", { page: "1", limit: "20" });
        setQuizzes(data.data || data || []);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Quizzes</h1>
          <Link href="/study/quizzes/create">
            <Button>Create Quiz</Button>
          </Link>
        </div>
        <LoadingSkeleton count={3} height="h-20" radius="rounded-xl" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-destructive/5 border border-destructive/20 rounded-xl p-6 text-destructive">
        <p>Failed to load quizzes: {error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Quizzes</h1>
          <p className="text-muted-foreground text-sm">Test your knowledge and track your progress</p>
        </div>
        <Link href="/study/quizzes/create">
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Create Quiz
          </Button>
        </Link>
      </div>

      {quizzes.length === 0 ? (
        <div className="bg-card rounded-2xl border border-dashed p-12 text-center">
          <Brain className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
          <h3 className="text-lg font-semibold">No quizzes yet</h3>
          <p className="text-muted-foreground">Create your first quiz to test your knowledge.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {quizzes.map((quiz) => (
            <Link
              key={quiz.id}
              href={`/study/quizzes/${quiz.id}`}
              className="block bg-card rounded-xl border border-border p-4 hover:border-primary transition-colors"
            >
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                <div>
                  <h3 className="font-semibold text-foreground">{quiz.title}</h3>
                  <div className="flex flex-wrap items-center gap-2 mt-1 text-sm text-muted-foreground">
                    <span>{quiz.questions?.length || 0} questions</span>
                    {quiz.isDraft && <Badge variant="outline">Draft</Badge>}
                    {quiz.visibility && <Badge variant="subtle">{quiz.visibility}</Badge>}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Button variant="ghost" size="sm" asChild>
                    <Link href={`/study/quizzes/${quiz.id}/attempt`}>
                      Start
                    </Link>
                  </Button>
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}