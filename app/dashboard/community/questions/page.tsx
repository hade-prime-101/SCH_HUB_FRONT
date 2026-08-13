"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { listQuestions, deleteQuestion } from "@/lib/api/community.api";
import type { Question } from "@/types/community";

export default function QuestionsList() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [page, setPage] = useState(1);

  useEffect(() => {
    listQuestions({ page, limit: 10 }).then((res) => setQuestions(res.data));
  }, [page]);

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this question?")) return;
    await deleteQuestion(id);
    setQuestions((prev) => prev.filter((q) => q.id !== id));
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Questions & Answers</h1>
        <Link href="/dashboard/community/questions/new" className="bg-primary text-primary-foreground px-4 py-2 rounded">
          Ask Question
        </Link>
      </div>
      {questions.map((q) => (
        <div key={q.id} className="bg-white shadow rounded p-4 mb-3 flex justify-between">
          <div>
            <Link href={`/dashboard/community/questions/${q.id}`} className="font-medium text-primary">
              {q.title}
            </Link>
            <p className="text-sm text-gray-500">
              {q.upvotes} upvotes · {q.answers.length} answers
            </p>
          </div>
          <button onClick={() => handleDelete(q.id)} className="text-destructive text-sm">Delete</button>
        </div>
      ))}
      <div className="mt-4">
        <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="btn">Prev</button>
        <span className="mx-2">Page {page}</span>
        <button onClick={() => setPage((p) => p + 1)} className="btn">Next</button>
      </div>
    </div>
  );
}