"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Loader2, CheckCircle } from "lucide-react";
import { getQuiz, approveQuizQuestions } from "@/lib/api/study.api";
import type { Quiz } from "@/types/study";

export default function AdminQuizReviewPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [approvedQuestions, setApprovedQuestions] = useState<Set<string>>(new Set());

  useEffect(() => {
    const loadQuiz = async () => {
      try {
        const data = await getQuiz(id as string);
        setQuiz(data);
      } catch (error) {
        console.error("Failed to load quiz:", error);
      } finally {
        setLoading(false);
      }
    };
    loadQuiz();
  }, [id]);

  const toggleQuestionApproval = (questionId: string) => {
    const updated = new Set(approvedQuestions);
    if (updated.has(questionId)) {
      updated.delete(questionId);
    } else {
      updated.add(questionId);
    }
    setApprovedQuestions(updated);
  };

  const handleApproveQuiz = async () => {
    if (!quiz) return;
    setSubmitting(true);
    try {
      const approvals = quiz.questions?.map((q) => ({
        questionId: q.id,
        approved: approvedQuestions.has(q.id),
      })) || [];
      await approveQuizQuestions(id as string, approvals);
      router.push("/admin/study/quizzes");
    } catch (error) {
      console.error("Failed to approve quiz:", error);
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!quiz) {
    return (
      <div className="bg-card rounded-2xl p-12 text-center">
        <p className="text-muted-foreground">Quiz not found</p>
      </div>
    );
  }

  return (
    <div>
      <Link
        href="/admin/study/quizzes"
        className="flex items-center gap-2 text-primary hover:text-primary/80 mb-6 w-fit"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Quizzes
      </Link>

      <div className="space-y-6">
        {/* Quiz Header */}
        <div className="bg-card rounded-2xl p-8 border border-border">
          <h1 className="text-3xl font-bold text-foreground mb-2">{quiz.title}</h1>
          {quiz.description && (
            <p className="text-muted-foreground mb-4">{quiz.description}</p>
          )}

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground uppercase text-xs tracking-wider mb-1">Questions</p>
              <p className="font-medium text-foreground">{quiz.questions?.length || 0}</p>
            </div>
            <div>
              <p className="text-muted-foreground uppercase text-xs tracking-wider mb-1">Submitted</p>
              <p className="font-medium text-foreground">
                {new Date(quiz.createdAt).toLocaleDateString()}
              </p>
            </div>
            {quiz.isDraft && (
              <div>
                <p className="text-muted-foreground uppercase text-xs tracking-wider mb-1">Status</p>
                <span className="px-2 py-1 bg-amber-100 text-amber-700 rounded text-xs font-medium">
                  Draft
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Questions Review */}
        {quiz.questions && quiz.questions.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-foreground">Review Questions</h2>
            {quiz.questions.map((question) => {
              const isApproved = approvedQuestions.has(question.id);
              return (
                <div
                  key={question.id}
                  className={`bg-card rounded-2xl p-6 border-l-4 ${
                    isApproved ? "border-l-green-500" : "border-l-gray-300"
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <button
                      onClick={() => toggleQuestionApproval(question.id)}
                      className={`flex-shrink-0 w-6 h-6 rounded-full border-2 transition-colors mt-1 ${
                        isApproved
                          ? "bg-green-500 border-green-500"
                          : "border-gray-300 hover:border-green-500"
                      }`}
                    >
                      {isApproved && (
                        <CheckCircle className="w-full h-full text-primary-foreground p-0.5" />
                      )}
                    </button>

                    <div className="flex-1">
                      <p className="font-medium text-foreground mb-2">{question.text}</p>

                      {question.options && question.options.length > 0 && (
                        <div className="mt-3 space-y-2">
                          {question.options.map((option, idx) => (
                            <p key={idx} className="text-sm text-muted-foreground ml-4">
                              {String.fromCharCode(65 + idx)}. {typeof option === 'string' ? option : option.text}
                            </p>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            onClick={handleApproveQuiz}
            disabled={submitting}
            className="flex-1 px-6 py-3 bg-success text-primary-foreground rounded-lg hover:bg-green-700 transition-colors font-medium disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {submitting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <CheckCircle className="w-4 h-4" />
            )}
            Approve Quiz
          </button>
          <Link
            href="/admin/study/quizzes"
            className="px-6 py-3 border border-border text-foreground rounded-lg hover:bg-accent transition-colors font-medium text-center"
          >
            Cancel
          </Link>
        </div>
      </div>
    </div>
  );
}
