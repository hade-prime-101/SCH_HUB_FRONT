// app/dashboard/study/quizzes/[id]/edit/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { apiGet, apiPost, apiPatch, apiDelete } from "@/lib/api";
import type { Quiz, QuizQuestionInput } from "@/types/study";

export default function EditQuizPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [questions, setQuestions] = useState<QuizQuestionInput[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiGet(`/study/quizzes/${id}`).then((quiz: Quiz) => {
      setTitle(quiz.title);
      setQuestions(
        quiz.questions.map((q: any) => ({
          text: q.text,
          type: q.type,
          options: q.options ? [...q.options] : undefined,
          correctAnswer: q.correctAnswer?.toString() || "",
        }))
      );
      setLoading(false);
    });
  }, [id]);

  const addQuestion = () => {
    setQuestions([...questions, { text: "", type: "MCQ", options: [""], correctAnswer: "" }]);
  };

  const handleQuestionChange = (index: number, field: keyof QuizQuestionInput, value: any) => {
    const updated = [...questions];
    (updated[index] as any)[field] = value;
    setQuestions(updated);
  };

  const handleOptionChange = (qIndex: number, optIndex: number, value: string) => {
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
    await apiPatch(`/study/quizzes/${id}`, { title, questions });
    router.push(`/dashboard/study/quizzes/${id}`);
  };

  if (loading) return <p>Loading...</p>;

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Edit Quiz</h1>
      <div className="mb-4">
        <label className="block font-medium">Title</label>
        <input
          type="text"
          value={title}
          onChange={e => setTitle(e.target.value)}
          className="border p-2 w-full"
        />
      </div>

      <h2 className="text-lg font-semibold mb-2">Questions</h2>
      {questions.map((q, qi) => (
        <div key={qi} className="bg-card shadow rounded p-4 mb-4 relative">
          <button
            onClick={() => removeQuestion(qi)}
            className="absolute top-2 right-2 text-destructive"
          >
            ✕
          </button>
          <div className="mb-2">
            <label className="block text-sm">Question Text</label>
            <input
              type="text"
              value={q.text}
              onChange={e => handleQuestionChange(qi, "text", e.target.value)}
              className="border p-2 w-full"
            />
          </div>
          <div className="mb-2">
            <label className="block text-sm">Type</label>
            <select
              value={q.type}
              onChange={e => handleQuestionChange(qi, "type", e.target.value)}
              className="border p-2 w-full"
            >
              <option value="MCQ">Multiple Choice</option>
              <option value="TRUE_FALSE">True/False</option>
              <option value="SHORT_ANSWER">Short Answer</option>
            </select>
          </div>
          {q.type === "MCQ" && (
            <div className="mb-2">
              <label className="block text-sm">Options</label>
              {q.options?.map((opt, oi) => (
                <div key={oi} className="flex gap-2 mb-1">
                  <input
                    type="text"
                    value={opt}
                    onChange={e => handleOptionChange(qi, oi, e.target.value)}
                    className="border p-1 flex-1"
                  />
                </div>
              ))}
              <button type="button" onClick={() => addOption(qi)} className="text-sm text-primary">
                + Add option
              </button>
            </div>
          )}
          <div>
            <label className="block text-sm">Correct Answer</label>
            <input
              type="text"
              value={q.correctAnswer || ""}
              onChange={e => handleQuestionChange(qi, "correctAnswer", e.target.value)}
              className="border p-2 w-full"
            />
          </div>
        </div>
      ))}

      <button onClick={addQuestion} className="bg-secondary/50 px-4 py-2 rounded mb-4">
        + Add Question
      </button>

      <div className="mt-4">
        <button onClick={handleSave} className="bg-primary text-primary-foreground px-6 py-2 rounded">
          Save Quiz
        </button>
      </div>
    </div>
  );
}