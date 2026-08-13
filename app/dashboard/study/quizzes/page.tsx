// app/dashboard/study/quizzes/page.tsx
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { apiGet } from "@/lib/api";
import type { Quiz } from "@/types/study";

export default function QuizzesListPage() {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiGet<{ data: Quiz[] }>("/study/quizzes", { page: "1", limit: "20" }).then((data: { data: Quiz[] }) => {
      setQuizzes(data.data);
      setLoading(false);
    });
  }, []);

  return (
    <div className="p-6">
      <div className="flex justify-between mb-4">
        <h1 className="text-2xl font-bold">Quizzes</h1>
        <Link href="/dashboard/study/quizzes/create" className="bg-primary text-primary-foreground px-4 py-2 rounded">
          Create Quiz
        </Link>
      </div>
      <ul className="space-y-3">
        {quizzes.map(q => (
          <li key={q.id} className="bg-card shadow p-4 rounded flex justify-between">
            <div>
              <Link href={`/dashboard/study/quizzes/${q.id}`} className="font-medium text-primary">
                {q.title}
              </Link>
              <p className="text-sm text-muted-foreground">{q.isDraft ? "Draft" : "Published"} · {q.questions.length} questions</p>
            </div>
            <Link href={`/dashboard/study/quizzes/${q.id}/attempt`} className="bg-primary/10 text-primary px-3 py-1 rounded">
              Start
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}