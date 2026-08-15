"use client";

import * as React from "react";
// app/study/quizzes/[id]/edit/page.tsx

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { apiGet, apiPatch } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, X } from "lucide-react";
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton";
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import type { Quiz, QuizQuestionInput } from "@/types/study";

export default function EditQuizPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [questions, setQuestions] = useState<QuizQuestionInput[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const data = await apiGet(`/study/quizzes/${id}`);
        setTitle(data.title);
        setQuestions(
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          data.questions.map((q: any) => ({
            text: q.text,
            type: q.type,
            options: q.options ? [...q.options] : undefined,
            correctAnswer: q.correctAnswer?.toString() || "",
          }))
        );
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const addQuestion = () => {
    setQuestions([...questions, { text: "", type: "MCQ", options: [""], correctAnswer: "" }]);
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const updateQuestion = (index: number, field: keyof QuizQuestionInput, value: any) => {
    const updated = [...questions];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (updated[index] as any)[field] = value;
    setQuestions(updated);
  };

  const updateOption = (qIndex: number, optIndex: number, value: string) => {
    const updated = [...questions];
    if (updated[qIndex].options) {
      updated[qIndex].options![optIndex] = value;
      setQuestions(updated);
    }
  };

  const addOption = (qIndex: number) => {
    const updated = [...questions];
    updated[qIndex].options = [...(updated[qIndex].options || []), ""];
    setQuestions(updated);
  };

  const removeQuestion = (index: number) => {
    setQuestions(questions.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    try {
      await apiPatch(`/study/quizzes/${id}`, { title, questions });
      router.push(`/study/quizzes/${id}`);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      setError(err.message);
    }
  };

  if (loading) return <LoadingSkeleton count={2} height="h-64" radius="rounded-2xl" />;
  if (error) {
    return (
      <div className="bg-destructive/5 border border-destructive/20 rounded-xl p-6 text-destructive">
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Edit Quiz</h1>

      <div className="bg-card rounded-2xl border border-border p-6 space-y-4">
        <div>
          <Label htmlFor="title">Title</Label>
          <Input id="title" value={title} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTitle(e.target.value)} />
        </div>
      </div>

      <div>
        <h2 className="text-lg font-semibold mb-3">Questions</h2>
        {questions.map((q, qi) => (
          <div key={qi} className="bg-card rounded-2xl border border-border p-5 mb-4 relative">
            <button
              type="button"
              onClick={() => removeQuestion(qi)}
              className="absolute top-3 right-3 text-destructive hover:text-destructive/80"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="space-y-3">
              <div>
                <Label htmlFor={`q${qi}-text`}>Question Text</Label>
                <Textarea
                  id={`q${qi}-text`}
                  value={q.text}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateQuestion(qi, "text", e.target.value)}
                  rows={2}
                />
              </div>
              <div>
                <Label htmlFor={`q${qi}-type`}>Type</Label>
                <Select
                  value={q.type}
                  onValueChange={(val) => updateQuestion(qi, "type", val as "MCQ" | "TRUE_FALSE" | "SHORT_ANSWER")}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MCQ">Multiple Choice</SelectItem>
                    <SelectItem value="TRUE_FALSE">True/False</SelectItem>
                    <SelectItem value="SHORT_ANSWER">Short Answer</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {q.type === "MCQ" && (
                <div>
                  <Label>Options</Label>
                  {q.options?.map((opt, oi) => (
                    <div key={oi} className="flex gap-2 mt-1">
                      <Input
                        value={opt}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateOption(qi, oi, e.target.value)}
                        placeholder={`Option ${oi + 1}`}
                      />
                    </div>
                  ))}
                  <Button variant="ghost" size="sm" onClick={() => addOption(qi)} className="mt-2">
                    <Plus className="w-4 h-4 mr-1" />
                    Add Option
                  </Button>
                </div>
              )}
              <div>
                <Label htmlFor={`q${qi}-answer`}>Correct Answer</Label>
                <Input
                  id={`q${qi}-answer`}
                  value={q.correctAnswer || ""}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateQuestion(qi, "correctAnswer", e.target.value)}
                />
              </div>
            </div>
          </div>
        ))}
        <Button variant="outline" onClick={addQuestion} className="w-full">
          <Plus className="w-4 h-4 mr-2" />
          Add Question
        </Button>
      </div>

      <div className="flex gap-3">
        <Button onClick={handleSave}>Save Quiz</Button>
        <Button variant="outline" onClick={() => router.back()}>Cancel</Button>
      </div>
    </div>
  );
}
