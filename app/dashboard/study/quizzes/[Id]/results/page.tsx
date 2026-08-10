// app/dashboard/study/quizzes/[id]/results/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { apiGet } from "@/lib/api";
import type { QuizAttempt } from "@/types/study";

export default function QuizResultsPage() {
  const { id } = useParams<{ id: string }>();
  const [attempts, setAttempts] = useState<QuizAttempt[]>([]);

  useEffect(() => {
    apiGet<QuizAttempt[]>(`/study/quizzes/${id}/attempts`).then((data: QuizAttempt[]) => setAttempts(data));
  }, [id]);

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Attempt History</h1>
      {attempts.length === 0 ? (
        <p>No attempts yet.</p>
      ) : (
        <ul className="space-y-3">
          {attempts.map((att, i) => (
            <li key={att.id} className="bg-white shadow rounded p-4">
              <p className="font-medium">Attempt #{i + 1}</p>
              <p>Score: {att.score} / {att.total}</p>
              <p className="text-sm text-gray-500">{new Date(att.submittedAt).toLocaleString()}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}