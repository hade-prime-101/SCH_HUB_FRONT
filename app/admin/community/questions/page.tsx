// app/dashboard/admin/community/questions/page.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { listQuestions, deleteQuestion } from "@/lib/api/community.api";
import type { Question } from "@/types/community";

export default function AdminQuestionsPage() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 10;

  useEffect(() => {
    listQuestions({ page, limit }).then((res) => {
      setQuestions(res.data);
      setTotal(res.total);
    });
  }, [page]);

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this question?")) return;
    await deleteQuestion(id);
    setQuestions((prev) => prev.filter((q) => q.id !== id));
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">All Questions</h1>
      {questions.map((q) => (
        <div
          key={q.id}
          className="bg-card shadow rounded p-4 mb-3 flex justify-between items-center"
        >
          <div>
            <Link
              href={`/dashboard/community/questions/${q.id}`}
              className="font-medium text-primary hover:underline"
            >
              {q.title}
            </Link>
            <p className="text-sm text-muted-foreground">
              {q.upvotes} upvotes · {q.answers.length} answers · by {q.author.name}
            </p>
          </div>
          <button
            onClick={() => handleDelete(q.id)}
            className="text-sm bg-red-100 text-red-700 px-2 py-1 rounded"
          >
            Delete
          </button>
        </div>
      ))}
      {total > limit && (
        <div className="flex justify-between mt-4">
          <button
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
            className="px-3 py-1 bg-secondary/50 rounded disabled:opacity-50"
          >
            Prev
          </button>
          <span>Page {page}</span>
          <button
            disabled={page * limit >= total}
            onClick={() => setPage((p) => p + 1)}
            className="px-3 py-1 bg-secondary/50 rounded disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}