// app/study/quizzes/[id]/attempt/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { apiGet, apiPost } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton";
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { ChevronLeft, ChevronRight, CheckCircle, XCircle } from "lucide-react";
import type { Quiz, QuizQuestion } from "@/types/study";

export default function QuizAttemptPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [currentIndex, setCurrentIndex] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState<{ score: number; total: number; correctCount: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const data = await apiGet(`/study/quizzes/${id}`);
        setQuiz(data);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const handleAnswer = (questionId: string, value: string) => {
    setAnswers(prev => ({ ...prev, [questionId]: value }));
  };

  const handleSubmit = async () => {
    if (!quiz) return;
    const payload = {
      answers: quiz.questions.map((q: QuizQuestion) => ({
        questionId: q.id,
        answer: answers[q.id] || "",
      })),
    };
    try {
      const res = await apiPost(`/study/quizzes/${id}/attempt`, payload);
      setResult(res);
      setSubmitted(true);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      setError(err.message);
    }
  };

  const goToQuestion = (index: number) => {
    if (index >= 0 && index < (quiz?.questions?.length || 0)) {
      setCurrentIndex(index);
    }
  };

  if (loading) return <LoadingSkeleton count={1} height="h-96" radius="rounded-2xl" />;
  if (error) {
    return (
      <div className="bg-destructive/5 border border-destructive/20 rounded-xl p-6 text-destructive">
        <p>{error}</p>
      </div>
    );
  }
  if (!quiz) return <div className="text-center py-12">Quiz not found.</div>;

  const questions = quiz.questions;
  const total = questions.length;
  const currentQuestion = questions[currentIndex];

  if (submitted && result) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="bg-card rounded-2xl border border-border p-6 text-center">
          <h2 className="text-2xl font-bold">Quiz Complete!</h2>
          <div className="mt-4 flex justify-center gap-8">
            <div>
              <p className="text-4xl font-bold text-primary">{result.score}</p>
              <p className="text-sm text-muted-foreground">Score</p>
            </div>
            <div>
              <p className="text-4xl font-bold">{result.correctCount}</p>
              <p className="text-sm text-muted-foreground">Correct</p>
            </div>
            <div>
              <p className="text-4xl font-bold">{result.total}</p>
              <p className="text-sm text-muted-foreground">Total</p>
            </div>
          </div>
          <div className="mt-6">
            <Button onClick={() => router.push(`/study/quizzes/${id}/results`)}>
              View Detailed Results
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-xl font-bold">{quiz.title}</h1>
        <span className="text-sm text-muted-foreground">
          Question {currentIndex + 1} of {total}
        </span>
      </div>

      <Progress value={((currentIndex + 1) / total) * 100} className="h-2" />

      <div className="bg-card rounded-2xl border border-border p-6 shadow-sm space-y-4">
        <div className="text-lg font-medium">{currentQuestion.text}</div>

        {currentQuestion.type === "MCQ" && currentQuestion.options ? (
          <RadioGroup
            value={answers[currentQuestion.id] || ""}
            onValueChange={(val) => handleAnswer(currentQuestion.id, val)}
            className="space-y-3"
          >
            {currentQuestion.options.map((opt, idx) => {
              const label = typeof opt === "string" ? opt : opt.text;
              const value = typeof opt === "string" ? opt : opt.id;
              return (
                <div key={idx} className="flex items-center space-x-2">
                  <RadioGroupItem value={value} id={`q${currentQuestion.id}-opt${idx}`} />
                  <Label htmlFor={`q${currentQuestion.id}-opt${idx}`}>{label}</Label>
                </div>
              );
            })}
          </RadioGroup>
        ) : (
          <div>
            <Label htmlFor="shortAnswer">Your Answer</Label>
            <input
              id="shortAnswer"
              type="text"
              className="w-full mt-1 p-2 border border-border rounded-lg bg-background"
              placeholder="Type your answer..."
              value={answers[currentQuestion.id] || ""}
              onChange={(e) => handleAnswer(currentQuestion.id, e.target.value)}
            />
          </div>
        )}
      </div>

      <div className="flex justify-between items-center pt-4 border-t border-border">
        <Button
          variant="outline"
          onClick={() => goToQuestion(currentIndex - 1)}
          disabled={currentIndex === 0}
        >
          <ChevronLeft className="w-4 h-4 mr-1" />
          Previous
        </Button>
        {currentIndex === total - 1 ? (
          <Button onClick={handleSubmit} disabled={Object.keys(answers).length < total}>
            Submit Quiz
          </Button>
        ) : (
          <Button onClick={() => goToQuestion(currentIndex + 1)}>
            Next
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        )}
      </div>
    </div>
  );
}