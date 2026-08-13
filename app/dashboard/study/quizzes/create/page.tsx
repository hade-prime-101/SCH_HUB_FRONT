// app/dashboard/study/quizzes/create/page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { apiPost } from "@/lib/api";
import type { QuizCreatePayload } from "@/types/study";

export default function CreateQuizPage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [mode, setMode] = useState<"manual" | "generate">("manual");
  const [materialId, setMaterialId] = useState("");
  const [numQuestions, setNumQuestions] = useState(5);

  const handleCreate = async () => {
    try {
      const quiz = await apiPost("/study/quizzes", { title, description });
      router.push(`/dashboard/study/quizzes/${quiz.id}/edit`);
    } catch (err) {
      alert("Failed to create quiz");
    }
  };

  const handleGenerate = async () => {
    try {
      const quiz = await apiPost("/study/quizzes/generate-from-material", {
        materialId,
        numQuestions,
      });
      router.push(`/dashboard/study/quizzes/${quiz.id}`);
    } catch (err) {
      alert("Failed to generate quiz");
    }
  };

  return (
    <div className="max-w-xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Create Quiz</h1>
      <div className="flex space-x-4 mb-6">
        <button
          onClick={() => setMode("manual")}
          className={`px-4 py-2 rounded ${mode === "manual" ? "bg-primary text-primary-foreground" : "bg-gray-200"}`}
        >
          Manual
        </button>
        <button
          onClick={() => setMode("generate")}
          className={`px-4 py-2 rounded ${mode === "generate" ? "bg-primary text-primary-foreground" : "bg-gray-200"}`}
        >
          Generate from Material
        </button>
      </div>

      {mode === "manual" ? (
        <div className="bg-white shadow rounded p-6 space-y-4">
          <input
            type="text" placeholder="Quiz Title" value={title}
            onChange={e => setTitle(e.target.value)} className="border p-2 w-full" required
          />
          <textarea
            placeholder="Description" value={description}
            onChange={e => setDescription(e.target.value)} className="border p-2 w-full"
          />
          <button onClick={handleCreate} className="bg-primary text-primary-foreground px-6 py-2 rounded">
            Create & Edit Questions
          </button>
        </div>
      ) : (
        <div className="bg-white shadow rounded p-6 space-y-4">
          <input
            type="text" placeholder="Material ID" value={materialId}
            onChange={e => setMaterialId(e.target.value)} className="border p-2 w-full"
          />
          <input
            type="number" value={numQuestions} min={1} max={20}
            onChange={e => setNumQuestions(parseInt(e.target.value))} className="border p-2 w-full"
          />
          <button onClick={handleGenerate} className="bg-success text-white px-6 py-2 rounded">
            Generate
          </button>
        </div>
      )}
    </div>
  );
}