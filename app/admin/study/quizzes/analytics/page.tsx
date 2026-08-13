"use client";

import { useState, useEffect } from "react";
import { Loader2, TrendingUp, Users, BarChart3, CheckCircle } from "lucide-react";
import { getAdminQuizAnalytics, listQuizzes } from "@/lib/api/study.api";
import type { Quiz } from "@/types/study";

export default function AdminQuizAnalyticsPage() {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedQuizId, setSelectedQuizId] = useState<string | null>(null);
  const [analytics, setAnalytics] = useState<any>(null);

  useEffect(() => {
    const loadQuizzes = async () => {
      try {
        const data = await listQuizzes({ limit: 100 });
        const quizList = data.data || [];
        setQuizzes(quizList);
        if (quizList.length > 0) {
          setSelectedQuizId(quizList[0].id);
        }
      } catch (error) {
        console.error("Failed to load quizzes:", error);
      } finally {
        setLoading(false);
      }
    };
    loadQuizzes();
  }, []);

  useEffect(() => {
    if (!selectedQuizId) return;

    const loadAnalytics = async () => {
      try {
        const data = await getAdminQuizAnalytics({ quizId: selectedQuizId });
        setAnalytics(data);
      } catch (error) {
        console.error("Failed to load analytics:", error);
      }
    };
    loadAnalytics();
  }, [selectedQuizId]);

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const selectedQuiz = quizzes.find((q) => q.id === selectedQuizId);

  return (
    <div>
      <h2 className="text-2xl font-bold text-foreground mb-6">Quiz Analytics</h2>

      {/* Top Stats */}
      {analytics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-card rounded-2xl p-6 border border-border">
            <div className="flex items-center gap-3 mb-3">
              <Users className="w-6 h-6 text-primary" />
              <h3 className="font-medium text-foreground">Attempts</h3>
            </div>
            <p className="text-3xl font-bold text-foreground">
              {analytics.totalAttempts || 0}
            </p>
          </div>

          <div className="bg-card rounded-2xl p-6 border border-border">
            <div className="flex items-center gap-3 mb-3">
              <BarChart3 className="w-6 h-6 text-purple-600" />
              <h3 className="font-medium text-foreground">Avg Score</h3>
            </div>
            <p className="text-3xl font-bold text-foreground">
              {analytics.averageScore ? analytics.averageScore.toFixed(1) : "0"}%
            </p>
          </div>

          <div className="bg-card rounded-2xl p-6 border border-border">
            <div className="flex items-center gap-3 mb-3">
              <TrendingUp className="w-6 h-6 text-green-600" />
              <h3 className="font-medium text-foreground">Pass Rate</h3>
            </div>
            <p className="text-3xl font-bold text-foreground">
              {analytics.passRate || "0"}%
            </p>
          </div>

          <div className="bg-card rounded-2xl p-6 border border-border">
            <div className="flex items-center gap-3 mb-3">
              <CheckCircle className="w-6 h-6 text-emerald-600" />
              <h3 className="font-medium text-foreground">Students</h3>
            </div>
            <p className="text-3xl font-bold text-foreground">
              {analytics.uniqueStudents || 0}
            </p>
          </div>
        </div>
      )}

      {/* Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Quiz List */}
        <div className="lg:col-span-1">
          <div className="bg-card rounded-2xl p-6 border border-border">
            <h3 className="font-bold text-foreground mb-4">Quizzes</h3>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {quizzes.map((quiz) => (
                <button
                  key={quiz.id}
                  onClick={() => setSelectedQuizId(quiz.id)}
                  className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${
                    selectedQuizId === quiz.id
                      ? "bg-primary text-primary-foreground"
                      : "hover:bg-accent text-foreground"
                  }`}
                >
                  <p className="font-medium text-sm line-clamp-1">{quiz.title}</p>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Details */}
        <div className="lg:col-span-3">
          {selectedQuiz && (
            <div className="bg-card rounded-2xl p-6 border border-border">
              <h3 className="font-bold text-foreground mb-4">{selectedQuiz.title}</h3>
              <div className="space-y-3 text-sm">
                {selectedQuiz.description && (
                  <div>
                    <p className="text-muted-foreground uppercase text-xs tracking-wider mb-1">Description</p>
                    <p className="text-foreground">{selectedQuiz.description}</p>
                  </div>
                )}
                <div>
                  <p className="text-muted-foreground uppercase text-xs tracking-wider mb-1">Questions</p>
                  <p className="text-foreground font-medium">{selectedQuiz.questions?.length || 0}</p>
                </div>
                <div>
                  <p className="text-muted-foreground uppercase text-xs tracking-wider mb-1">Created</p>
                  <p className="text-foreground">
                    {new Date(selectedQuiz.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
