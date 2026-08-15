// app/study/quizzes/[id]/page.tsx
"use client";

import { useEffect, useState } from "react";
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { useParams, useRouter } from "next/navigation";
import { apiGet } from "@/lib/api";
import type { Quiz } from "@/types/study";
import Link from "next/link";

export default function QuizDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [quiz, setQuiz] = useState<Quiz | null>(null);

  useEffect(() => {
    apiGet(`/study/quizzes/${id}`).then(setQuiz);
  }, [id]);

  if (!quiz) return <p>Loading...</p>;

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-2">{quiz.title}</h1>
      <p className="text-muted-foreground mb-4">{quiz.description}</p>
      <p className="text-sm text-muted-foreground mb-4">
        {quiz.isDraft ? "Draft" : "Published"} · {quiz.questions.length} questions
      </p>

      <div className="flex space-x-4">
        <Link
          href={`/study/quizzes/${id}/attempt`}
          className="bg-indigo-600 text-primary-foreground px-4 py-2 rounded"
        >
          Start Attempt
        </Link>
        <Link
          href={`/study/quizzes/${id}/edit`}
          className="bg-secondary/50 px-4 py-2 rounded"
        >
          Edit Questions
        </Link>
        <Link
          href={`/study/quizzes/${id}/results`}
          className="bg-secondary/50 px-4 py-2 rounded"
        >
          View Attempts
        </Link>
      </div>
    </div>
  );
}