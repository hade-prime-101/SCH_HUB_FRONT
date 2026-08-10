// app/dashboard/study/quizzes/[id]/attempt/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { apiGet, apiPost } from "@/lib/api";
import type { Quiz, QuizQuestion } from "@/types/study";

export default function QuizAttemptPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState<{ score: number; total: number } | null>(null);

  useEffect(() => {
    apiGet(`/study/quizzes/${id}`).then(setQuiz);
  }, [id]);

  const handleChange = (questionId: string, value: string) => {
    setAnswers(prev => ({ ...prev, [questionId]: value }));
  };

  const handleSubmit = async () => {
    const payload = { answers: quiz!.questions.map((q: QuizQuestion) => ({ questionId: q.id, answer: answers[q.id] || "" })) };
    const res = await apiPost(`/study/quizzes/${id}/attempt`, payload);
    setResult(res);
    setSubmitted(true);
  };

  if (!quiz) return <p>Loading quiz...</p>;

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">{quiz.title}</h1>
      {submitted && result ? (
        <div className="bg-green-50 p-4 rounded">
          <p className="font-bold">Your Score</p>
          <p>{result.score} / {result.total}</p>
          <button onClick={() => router.push(`/dashboard/study/quizzes/${id}/results`)} className="mt-2 text-blue-600">
            View detailed results
          </button>
        </div>
      ) : (
        <>
          {quiz.questions.map((q: QuizQuestion, idx: number) => (
            <div key={q.id} className="mb-6">
              <p className="font-medium">{idx + 1}. {q.text}</p>
              {q.type === "MCQ" && q.options ? (
                q.options.map((opt: string | { id: string; text: string }) => (
                  <label key={typeof opt === "string" ? opt : opt.id} className="block ml-4">
                    <input
                      type="radio"
                      name={q.id}
                      value={typeof opt === "string" ? opt : opt.id}
                      checked={answers[q.id] === (typeof opt === "string" ? opt : opt.id)}
                      onChange={e => handleChange(q.id, e.target.value)}
                      className="mr-2"
                    />
                    {typeof opt === "string" ? opt : opt.text}
                  </label>
                ))
              ) : (
                <input
                  type="text"
                  className="border p-1 w-full mt-1"
                  value={answers[q.id] || ""}
                  onChange={e => handleChange(q.id, e.target.value)}
                />
              )}
            </div>
          ))}
          <button onClick={handleSubmit} className="bg-purple-600 text-white px-6 py-2 rounded">
            Submit Attempt
          </button>
        </>
      )}
    </div>
  );
}