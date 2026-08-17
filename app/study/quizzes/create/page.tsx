"use client";

import * as React from "react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { apiPost } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function CreateQuizPage() {
  const router = useRouter();
  const [materialId, setMaterialId] = useState("");
  const [numQuestions, setNumQuestions] = useState(5);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

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

      {error && (
        <div className="bg-destructive/5 border border-destructive/20 rounded-xl p-4 text-destructive text-sm">
          {error}
        </div>
      )}

      <div className="bg-card rounded-2xl border border-border p-6 space-y-4">
        <div>
          <Label htmlFor="materialId">Material ID *</Label>
          <Input
            id="materialId"
            value={materialId}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setMaterialId(e.currentTarget.value)}
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
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNumQuestions(Number(e.currentTarget.value))}
          />
        </div>
        <Button onClick={handleGenerate} disabled={loading}>
          {loading ? "Generating..." : "Generate Quiz"}
        </Button>
      </div>
    </div>
  );
}
