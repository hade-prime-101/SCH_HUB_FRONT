"use client";

import * as React from "react";
// app/study/quizzes/create/page.tsx

import { useState } from "react";
import { useRouter } from "next/navigation";
import { apiPost } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function CreateQuizPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"manual" | "generate">("manual");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [materialId, setMaterialId] = useState("");
  const [numQuestions, setNumQuestions] = useState(5);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleCreate = async () => {
    if (!title) return setError("Title is required");
    setLoading(true);
    try {
      const quiz = await apiPost("/study/quizzes", { title, description });
      router.push(`/study/quizzes/${quiz.id}/edit`);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = async () => {
    if (!materialId) return setError("Material ID is required");
    setLoading(true);
    try {
      const quiz = await apiPost("/study/quizzes/generate-from-material", {
        materialId,
        numQuestions,
      });
      router.push(`/study/quizzes/${quiz.id}`);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Create Quiz</h1>

      <div className="flex gap-3 bg-muted/50 rounded-xl p-1">
        <button
          onClick={() => setMode("manual")}
          className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition ${
            mode === "manual" ? "bg-card shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Manual
        </button>
        <button
          onClick={() => setMode("generate")}
          className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition ${
            mode === "generate" ? "bg-card shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Generate from Material
        </button>
      </div>

      {error && (
        <div className="bg-destructive/5 border border-destructive/20 rounded-xl p-4 text-destructive text-sm">
          {error}
        </div>
      )}

      {mode === "manual" ? (
        <div className="bg-card rounded-2xl border border-border p-6 space-y-4">
          <div>
            <Label htmlFor="title">Quiz Title *</Label>
            <Input id="title" value={title} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTitle(e.target.value)} required />
          </div>
          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" value={description} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDescription(e.target.value)} rows={3} />
          </div>
          <Button onClick={handleCreate} disabled={loading}>
            {loading ? "Creating..." : "Create & Edit Questions"}
          </Button>
        </div>
      ) : (
        <div className="bg-card rounded-2xl border border-border p-6 space-y-4">
          <div>
            <Label htmlFor="materialId">Material ID *</Label>
            <Input
              id="materialId"
              value={materialId}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setMaterialId(e.target.value)}
              placeholder="Enter material ID"
            />
          </div>
          <div>
            <Label htmlFor="numQuestions">Number of Questions</Label>
            <Input
              id="numQuestions"
              type="number"
              min={1}
              max={20}
              value={numQuestions}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNumQuestions(Number(e.target.value))}
            />
          </div>
          <Button onClick={handleGenerate} disabled={loading}>
            {loading ? "Generating..." : "Generate Quiz"}
          </Button>
        </div>
      )}
    </div>
  );
}
