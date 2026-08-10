// app/dashboard/study/summaries/[materialId]/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { apiGet } from "@/lib/api";
import type { AISummary } from "@/types/study";

export default function SummaryDetailPage() {
  const { materialId } = useParams<{ materialId: string }>();
  const [summary, setSummary] = useState<AISummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    apiGet(`/ai/summaries/${materialId}`)
      .then(setSummary)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [materialId]);

  if (loading) return <p>Loading summary...</p>;
  if (error) return <p className="text-red-600">Error: {error}</p>;
  if (!summary) return <p>Summary not found.</p>;

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Summary for {summary.title}</h1>
      <div className="bg-white shadow rounded p-6 whitespace-pre-wrap">
        {summary.status === "PENDING" || summary.status === "PROCESSING" ? (
          <p className="text-yellow-600">Your summary is being generated. Please check back later.</p>
        ) : summary.status === "FAILED" ? (
          <p className="text-red-600">Summary generation failed.</p>
        ) : (
          <p>{summary.content}</p>
        )}
      </div>
    </div>
  );
}