// app/dashboard/study/summaries/page.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { apiGet } from "@/lib/api";
import type { AISummary } from "@/types/study";

export default function SummariesListPage() {
  const [summaries, setSummaries] = useState<AISummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiGet("/ai/summaries").then((data) => {
      setSummaries(data.data || data);
      setLoading(false);
    });
  }, []);

  if (loading) return <p>Loading summaries...</p>;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">AI Summaries</h1>
        <Link href="/dashboard/study/summaries/request" className="bg-primary text-primary-foreground px-4 py-2 rounded">
          Request Summary
        </Link>
      </div>
      {summaries.length === 0 ? (
        <p className="text-muted-foreground">No summaries yet.</p>
      ) : (
        <div className="grid gap-4">
          {summaries.map((s) => (
            <div key={s.materialId} className="bg-card shadow rounded p-4 flex justify-between items-center">
              <div>
                <Link href={`/dashboard/study/summaries/${s.materialId}`} className="font-medium text-primary hover:underline">
                  {s.title}
                </Link>
                <p className="text-sm text-muted-foreground">Status: {s.status}</p>
              </div>
              <span className="text-xs text-muted-foreground/70">{new Date(s.createdAt).toLocaleDateString()}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}