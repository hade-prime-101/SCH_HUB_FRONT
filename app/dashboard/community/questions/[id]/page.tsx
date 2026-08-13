"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
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

  useEffect(() => {
    getQuestion(id).then(setQuestion);
  }, [id]);

  const handleAnswerSubmit = async () => {
    if (!answer.trim()) return;
    const newAns = await createAnswer(id, { content: answer });
    setQuestion((prev) =>
      prev ? { ...prev, answers: [...prev.answers, newAns] } : prev
    );
    setAnswer("");
  };

  const handleAccept = async (answerId: string) => {
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
  };

  if (!question) return <p>Loading...</p>;

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-2">{question.title}</h1>
      <p className="text-muted-foreground mb-4">{question.content}</p>
      <div className="flex gap-3 mb-6">
        <button onClick={() => upvoteQuestion(id)} className="bg-gray-200 px-3 py-1 rounded">👍 Upvote</button>
        <button onClick={() => report(id, { reason: "Spam", type: "QUESTION" })} className="text-destructive underline">Report</button>
      </div>

      <h2 className="text-lg font-semibold mb-3">Answers ({question.answers.length})</h2>
      {question.answers.map((a) => (
        <div key={a.id} className={`p-3 rounded mb-3 ${a.isAccepted ? "bg-success/10 border border-success" : "bg-gray-50"}`}>
          <p className="font-medium text-sm">{a.author.name}</p>
          <p>{a.content}</p>
          <div className="flex gap-2 mt-1">
            {!a.isAccepted && (
              <button onClick={() => handleAccept(a.id)} className="text-sm text-success underline">
                Accept
              </button>
            )}
            <span className="text-xs">{a.upvotes} upvotes</span>
          </div>
        </div>
      ))}

      <div className="mt-6 flex gap-2">
        <input
          type="text"
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          placeholder="Your answer..."
          className="border p-2 flex-1"
        />
        <button onClick={handleAnswerSubmit} className="bg-primary text-primary-foreground px-4 py-2 rounded">
          Post Answer
        </button>
      </div>
    </div>
  );
}