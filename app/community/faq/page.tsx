"use client";

import { useEffect, useState } from "react";
import { BookOpen, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CommunityHeader } from "@/components/community/CommunityHeader";
import { CommunityEmptyState } from "@/components/community/CommunityEmptyState";
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton";
import { ErrorMessage } from "@/components/ui/ErrorMessage";
import { listFaqs, createFaq, deleteFaq } from "@/lib/api/community.api";
import type { FAQ } from "@/types/community";

export default function FaqPage() {
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchFaqs = async () => {
      setLoading(true);
      try {
        const data = await listFaqs();
        setFaqs(data);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (err: any) {
        setError(err.message || "Failed to load FAQs");
      } finally {
        setLoading(false);
      }
    };
    fetchFaqs();
  }, []);

  const handleAdd = async () => {
    if (!question.trim() || !answer.trim()) return;
    setSubmitting(true);
    try {
      const newFaq = await createFaq({ question, answer });
      setFaqs((prev) => [...prev, newFaq]);
      setQuestion("");
      setAnswer("");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      alert(err.message || "Failed to add FAQ");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this FAQ?")) return;
    try {
      await deleteFaq(id);
      setFaqs((prev) => prev.filter((f) => f.id !== id));
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      alert(err.message || "Failed to delete FAQ");
    }
  };

  if (error) {
    return <ErrorMessage message={error} />;
  }

  return (
    <div className="pb-24">
      <CommunityHeader
        title="Frequently Asked Questions"
        description="Find answers to common questions about the community"
      />

      {/* Add FAQ form (admin-like) */}
      <div className="bg-card rounded-2xl border border-border p-5 mb-6 space-y-4">
        <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Add FAQ
        </h3>
        <input
          type="text"
          placeholder="Question"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        />
        <textarea
          placeholder="Answer"
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring h-20 resize-none"
        />
        <Button onClick={handleAdd} disabled={submitting || !question.trim() || !answer.trim()}>
          Add FAQ
        </Button>
      </div>

      {loading ? (
        <LoadingSkeleton count={3} height="h-20" />
      ) : (
        <>
          {faqs.length === 0 ? (
            <CommunityEmptyState
              icon={<BookOpen className="w-8 h-8" />}
              title="No FAQs yet"
              description="Add frequently asked questions to help the community."
            />
          ) : (
            <div className="space-y-4">
              {faqs.map((f) => (
                <Card key={f.id}>
                  <CardContent className="p-5 flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <h4 className="font-semibold text-foreground">{f.question}</h4>
                      <p className="text-sm text-muted-foreground mt-1">{f.answer}</p>
                    </div>
                    <button
                      onClick={() => handleDelete(f.id)}
                      className="shrink-0 text-muted-foreground hover:text-destructive transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}