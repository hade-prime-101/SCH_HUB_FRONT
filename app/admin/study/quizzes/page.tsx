"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Loader2, Trash2, Eye } from "lucide-react";
import { listQuizzes, deleteQuiz } from "@/lib/api/study.api";
import type { Quiz } from "@/types/study";

export default function AdminQuizzesPage() {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadQuizzes = async () => {
      try {
        const data = await listQuizzes({ limit: 100 });
        setQuizzes(data.data || []);
      } catch (error) {
        console.error("Failed to load quizzes:", error);
      } finally {
        setLoading(false);
      }
    };
    loadQuizzes();
  }, []);

  const handleDelete = async (quizId: string) => {
    if (!confirm("Are you sure you want to delete this quiz?")) return;
    try {
      await deleteQuiz(quizId);
      setQuizzes(quizzes.filter((q) => q.id !== quizId));
    } catch (error) {
      console.error("Failed to delete quiz:", error);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-foreground">Quizzes Management</h2>
        <span className="text-sm text-muted-foreground">{quizzes.length} quizzes</span>
      </div>

      {quizzes.length === 0 ? (
        <div className="bg-card rounded-2xl p-12 text-center">
          <p className="text-muted-foreground">No quizzes found</p>
        </div>
      ) : (
        <div className="space-y-4">
          {quizzes.map((quiz) => (
            <div
              key={quiz.id}
              className="bg-card rounded-2xl p-6 border-l-4 border-l-purple-500"
            >
              <div className="flex justify-between items-start gap-4 mb-4">
                <div className="flex-1">
                  <h3 className="font-bold text-lg text-foreground mb-2">
                    {quiz.title}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {quiz.createdBy} • {new Date(quiz.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>

              {quiz.description && (
                <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                  {quiz.description}
                </p>
              )}

              <div className="flex gap-2 flex-wrap mb-4 text-sm">
                <span className="px-2 py-1 bg-muted text-muted-foreground rounded">
                  {quiz.questions?.length || 0} questions
                </span>
                {quiz.isDraft && (
                  <span className="px-2 py-1 bg-amber-100 text-amber-700 rounded">
                    Draft
                  </span>
                )}
              </div>

              <div className="flex gap-2">
                <Link
                  href={`/admin/study/quizzes/${quiz.id}`}
                  className="flex-1 px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors font-medium flex items-center justify-center gap-2"
                >
                  <Eye className="w-4 h-4" />
                  Review
                </Link>
                <button
                  onClick={() => handleDelete(quiz.id)}
                  className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
