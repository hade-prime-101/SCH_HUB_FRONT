// app/study/quizzes/[id]/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { apiGet } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton";
import { ArrowLeft, Edit, FileText, BarChart } from "lucide-react";
import type { Quiz } from "@/types/study";

export default function QuizDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const data = await apiGet(`/study/quizzes/${id}`);
        setQuiz(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  if (loading) return <LoadingSkeleton count={1} height="h-64" radius="rounded-2xl" />;
  if (error) {
    return (
      <div className="bg-destructive/5 border border-destructive/20 rounded-xl p-6 text-destructive">
        <p>{error}</p>
      </div>
    );
  }
  if (!quiz) return <div className="text-center py-12">Quiz not found.</div>;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Button variant="ghost" size="sm" onClick={() => router.back()} className="gap-2">
        <ArrowLeft className="w-4 h-4" />
        Back
      </Button>

      <div className="bg-card rounded-2xl border border-border p-6 shadow-sm space-y-4">
        <div>
          <h1 className="text-2xl font-bold">{quiz.title}</h1>
          {quiz.description && <p className="text-muted-foreground mt-1">{quiz.description}</p>}
          <div className="flex flex-wrap items-center gap-2 mt-2">
            <Badge variant="outline">{quiz.questions?.length || 0} questions</Badge>
            {quiz.isDraft && <Badge variant="destructive">Draft</Badge>}
            {quiz.visibility && <Badge variant="subtle">{quiz.visibility}</Badge>}
          </div>
        </div>

        <div className="flex flex-wrap gap-3 pt-4 border-t border-border">
          <Button asChild>
            <Link href={`/study/quizzes/${id}/attempt`}>Start Attempt</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href={`/study/quizzes/${id}/edit`}>
              <Edit className="w-4 h-4 mr-2" />
              Edit
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href={`/study/quizzes/${id}/results`}>
              <BarChart className="w-4 h-4 mr-2" />
              Results
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}