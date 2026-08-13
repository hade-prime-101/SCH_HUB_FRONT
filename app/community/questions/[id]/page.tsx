"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { ThumbsUp, CheckCircle, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CommunityHeader } from "@/components/community/CommunityHeader";
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton";
import { ErrorMessage } from "@/components/ui/ErrorMessage";
import {
  getQuestion,
  createAnswer,
  upvoteQuestion,
  acceptAnswer,
  report,
} from "@/lib/api/community.api";
import type { Question, Answer } from "@/types/community";

export default function QuestionDetail() {
  const { id } = useParams<{ id: string }>();
  const [question, setQuestion] = useState<Question | null>(null);
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reportSuccess, setReportSuccess] = useState<string | null>(null);

  useEffect(() => {
    const fetchQuestion = async () => {
      setLoading(true);
      try {
        const data = await getQuestion(id);
        setQuestion(data);
      } catch (err: any) {
        setError(err.message || "Question not found");
      } finally {
        setLoading(false);
      }
    };
    fetchQuestion();
  }, [id]);

  const handleAnswerSubmit = async () => {
    if (!answer.trim()) return;
    setSubmitting(true);
    try {
      const newAns = await createAnswer(id, { content: answer });
      setQuestion((prev) =>
        prev ? { ...prev, answers: [...prev.answers, newAns] } : prev
      );
      setAnswer("");
    } catch (err: any) {
      alert(err.message || "Failed to post answer");
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpvote = async () => {
    if (!question) return;
    try {
      await upvoteQuestion(question.id);
      setQuestion({ ...question, upvotes: question.upvotes + 1 });
    } catch (err: any) {
      alert(err.message || "Failed to upvote");
    }
  };

  const handleAccept = async (answerId: string) => {
    try {
      await acceptAnswer(id, answerId);
      setQuestion((prev) =>
        prev
          ? {
              ...prev,
              acceptedAnswerId: answerId,
              answers: prev.answers.map((a) => ({
                ...a,
                isAccepted: a.id === answerId,
              })),
            }
          : prev
      );
    } catch (err: any) {
      alert(err.message || "Failed to accept answer");
    }
  };

  const handleReport = async () => {
    if (!confirm("Report this question as inappropriate?")) return;
    try {
      await report(id, { reason: "Inappropriate content", type: "QUESTION" });
      setReportSuccess("Report submitted.");
      setTimeout(() => setReportSuccess(null), 3000);
    } catch (err: any) {
      alert(err.message || "Failed to report");
    }
  };

  if (loading) {
    return (
      <div className="pb-24">
        <LoadingSkeleton count={1} height="h-40" />
        <div className="mt-6 space-y-4">
          <LoadingSkeleton count={3} height="h-20" />
        </div>
      </div>
    );
  }

  if (error || !question) {
    return <ErrorMessage message={error || "Question not found"} />;
  }

  return (
    <div className="pb-24">
      <CommunityHeader title={question.title} />

      <div className="space-y-6">
        <Card>
          <CardContent className="p-5 space-y-4">
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>asked by {question.author.name}</span>
              <span>{new Date(question.createdAt).toLocaleDateString()}</span>
            </div>
            <div className="prose prose-sm max-w-none text-foreground">
              {question.content}
            </div>
            <div className="flex flex-wrap items-center gap-4 pt-2 border-t border-border">
              <Button size="sm" variant="outline" onClick={handleUpvote}>
                <ThumbsUp className="w-4 h-4 mr-1.5" />
                {question.upvotes}
              </Button>
              <Button size="sm" variant="ghost" onClick={handleReport}>
                <AlertCircle className="w-4 h-4 mr-1.5" />
                Report
              </Button>
              {reportSuccess && (
                <span className="text-sm text-success">{reportSuccess}</span>
              )}
            </div>
          </CardContent>
        </Card>

        <div>
          <h2 className="text-lg font-semibold text-foreground mb-4">
            Answers ({question.answers.length})
          </h2>
          {question.answers.length === 0 ? (
            <p className="text-sm text-muted-foreground">No answers yet. Be the first!</p>
          ) : (
            <div className="space-y-4">
              {question.answers.map((a) => (
                <Card
                  key={a.id}
                  className={a.isAccepted ? "border-success bg-success/5" : ""}
                >
                  <CardContent className="p-4 space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">{a.author.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {new Date(a.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-sm">{a.content}</p>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span>{a.upvotes} upvotes</span>
                      {a.isAccepted && (
                        <Badge variant="success" size="sm" className="gap-1">
                          <CheckCircle className="w-3 h-3" />
                          Accepted
                        </Badge>
                      )}
                      {!a.isAccepted && !question.acceptedAnswerId && (
                        <Button
                          size="xs"
                          variant="ghost"
                          onClick={() => handleAccept(a.id)}
                          className="text-success hover:bg-success/10"
                        >
                          Accept
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        <div className="flex gap-3">
          <input
            type="text"
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            placeholder="Write your answer..."
            className="flex-1 rounded-xl border border-border bg-background px-4 py-2.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <Button onClick={handleAnswerSubmit} disabled={submitting || !answer.trim()}>
            Post Answer
          </Button>
        </div>
      </div>
    </div>
  );
}