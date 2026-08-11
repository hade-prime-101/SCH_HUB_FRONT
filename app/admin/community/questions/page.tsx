"use client";

import { useState, useEffect } from "react";
import { Loader2, Trash2, CheckCircle } from "lucide-react";
import { communityApi } from "@/lib/api/community";
import type { Question } from "@/types/community";

export default function AdminQuestionsPage() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "solved" | "unsolved">("all");

  useEffect(() => {
    const loadQuestions = async () => {
      try {
        const data = await communityApi.getQuestions({ limit: "100" });
        setQuestions(Array.isArray(data) ? data : data?.data ?? []);
      } catch (error) {
        console.error("Failed to load questions:", error);
      } finally {
        setLoading(false);
      }
    };
    loadQuestions();
  }, []);

  const handleDelete = async (questionId: string) => {
    if (!confirm("Are you sure you want to delete this question?")) return;
    try {
      await communityApi.deleteQuestion(questionId);
      setQuestions(questions.filter((q) => q.id !== questionId));
    } catch (error) {
      console.error("Failed to delete question:", error);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const filteredQuestions = questions.filter((question) => {
    if (filter === "solved") return question.isSolved;
    if (filter === "unsolved") return !question.isSolved;
    return true;
  });

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-foreground">Questions Management</h2>
        <span className="text-sm text-muted-foreground">{filteredQuestions.length} questions</span>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-3 mb-6">
        {(["all", "solved", "unsolved"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setFilter(tab)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors capitalize ${
              filter === tab
                ? "bg-primary text-primary-foreground"
                : "bg-card text-foreground hover:bg-accent"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {filteredQuestions.length === 0 ? (
        <div className="bg-card rounded-2xl p-12 text-center">
          <p className="text-muted-foreground">No questions found</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredQuestions.map((question) => (
            <div key={question.id} className="bg-card rounded-2xl p-6 border border-border">
              <div className="flex justify-between items-start gap-4 mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-bold text-foreground line-clamp-1">
                      {question.title}
                    </h3>
                    {question.isSolved && (
                      <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded">
                        Solved
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-1">
                    {question.content}
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">
                    {question.author?.fullName ?? "Anonymous"} • {new Date(question.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 justify-between">
                <div className="flex gap-4 text-sm text-muted-foreground">
                  <span>👍 {question.upvotes}</span>
                  <span>💬 {question.answerCount ?? 0} answers</span>
                  {question.courseTag && <span>📚 {question.courseTag}</span>}
                </div>

                <button
                  onClick={() => handleDelete(question.id)}
                  className="p-2 hover:bg-red-100 rounded-lg transition-colors"
                >
                  <Trash2 className="w-5 h-5 text-red-600" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
