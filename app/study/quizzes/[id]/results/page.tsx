// app/study/quizzes/[id]/results/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { apiGet } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton";
import { ArrowLeft, CheckCircle, XCircle } from "lucide-react";
import type { QuizAttempt } from "@/types/study";

export default function QuizResultsPage() {
  const { id } = useParams<{ id: string }>();
  const [attempts, setAttempts] = useState<QuizAttempt[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const data = await apiGet(`/study/quizzes/${id}/attempts`);
        setAttempts(data.data || data || []);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  if (loading) return <LoadingSkeleton count={3} height="h-16" radius="rounded-xl" />;
  if (error) {
    return (
      <div className="bg-destructive/5 border border-destructive/20 rounded-xl p-6 text-destructive">
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => window.history.back()}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <h1 className="text-2xl font-bold">Attempt History</h1>
      </div>

      {attempts.length === 0 ? (
        <div className="bg-card rounded-2xl border border-dashed p-12 text-center">
          <p className="text-muted-foreground">No attempts yet. Take the quiz to see results here.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {attempts.map((att, idx) => (
            <div key={att.id} className="bg-card rounded-xl border border-border p-4 flex justify-between items-center">
              <div>
                <p className="font-medium">Attempt #{idx + 1}</p>
                <p className="text-sm text-muted-foreground">
                  {new Date(att.submittedAt).toLocaleString()}
                </p>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold">
                  {att.score} / {att.total}
                </p>
                <p className="text-sm text-muted-foreground">
                  {att.correctCount !== undefined && `${att.correctCount} correct`}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}