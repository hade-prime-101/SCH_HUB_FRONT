"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CommunityHeader } from "@/components/community/CommunityHeader";
import { QuestionCard } from "@/components/community/QuestionCard";
import { CommunityEmptyState } from "@/components/community/CommunityEmptyState";
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton";
import { ErrorMessage } from "@/components/ui/ErrorMessage";
import { Pagination } from "@/components/ui/Pagination";
import { listQuestions, deleteQuestion } from "@/lib/api/community.api";
import type { Question } from "@/types/community";

export default function QuestionsList() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const limit = 10;

  useEffect(() => {
    const fetchQuestions = async () => {
      setLoading(true);
      try {
        const res = await listQuestions({ page, limit });
        setQuestions(res.data);
        setTotal(res.total);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (err: any) {
        setError(err.message || "Failed to load questions");
      } finally {
        setLoading(false);
      }
    };
    fetchQuestions();
  }, [page]);

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this question?")) return;
    try {
      await deleteQuestion(id);
      setQuestions((prev) => prev.filter((q) => q.id !== id));
      setTotal((t) => t - 1);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      alert(err.message || "Failed to delete question");
    }
  };

  if (error) {
    return <ErrorMessage message={error} />;
  }

  return (
    <div className="pb-24">
      <CommunityHeader
        title="Questions & Answers"
        description="Ask questions and help others learn"
        action={
          <Button asChild>
            <Link href="/community/questions/new">
              <Plus className="w-4 h-4 mr-1.5" />
              Ask Question
            </Link>
          </Button>
        }
      />

      {loading ? (
        <LoadingSkeleton count={3} height="h-24" />
      ) : (
        <>
          {questions.length === 0 ? (
            <CommunityEmptyState
              icon={<Plus className="w-8 h-8" />}
              title="No questions yet"
              description="Be the first to ask a question!"
              action={
                <Button asChild>
                  <Link href="/community/questions/new">Ask Question</Link>
                </Button>
              }
            />
          ) : (
            <div className="space-y-4">
              {questions.map((q) => (
                <QuestionCard
                  key={q.id}
                  question={q}
                  onDelete={handleDelete}
                  showActions
                />
              ))}
            </div>
          )}

          {total > limit && (
            <Pagination
              currentPage={page}
              totalPages={Math.ceil(total / limit)}
              onPageChange={setPage}
              showPageNumber
            />
          )}
        </>
      )}
    </div>
  );
}