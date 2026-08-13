// app/study/summaries/page.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { apiGet } from "@/lib/api";
import { BarChart3, Plus, Clock, CheckCircle, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton";
import type { AISummary } from "@/types/study";

export default function SummariesListPage() {
  const [summaries, setSummaries] = useState<AISummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const data = await apiGet("/ai/summaries");
        setSummaries(data.data || data || []);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return <Badge variant="success" className="flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Completed</Badge>;
      case "PENDING":
      case "PROCESSING":
        return <Badge variant="warning" className="flex items-center gap-1"><Clock className="w-3 h-3" /> Processing</Badge>;
      case "FAILED":
        return <Badge variant="destructive" className="flex items-center gap-1"><XCircle className="w-3 h-3" /> Failed</Badge>;
      default:
        return <Badge variant="subtle">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">AI Summaries</h1>
          <Link href="/study/summaries/request">
            <Button>Request Summary</Button>
          </Link>
        </div>
        <LoadingSkeleton count={3} height="h-16" radius="rounded-xl" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-destructive/5 border border-destructive/20 rounded-xl p-6 text-destructive">
        <p>Failed to load summaries: {error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">AI Summaries</h1>
          <p className="text-muted-foreground">AI‑generated summaries of your study materials</p>
        </div>
        <Link href="/study/summaries/request">
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Request Summary
          </Button>
        </Link>
      </div>

      {summaries.length === 0 ? (
        <div className="bg-card rounded-2xl border border-dashed p-12 text-center">
          <BarChart3 className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
          <h3 className="text-lg font-semibold">No summaries yet</h3>
          <p className="text-muted-foreground">Request a summary from a study material.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {summaries.map((s) => (
            <Link
              key={s.materialId}
              href={`/study/summaries/${s.materialId}`}
              className="block bg-card rounded-xl border border-border p-4 hover:border-primary transition-colors"
            >
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                <div>
                  <h3 className="font-semibold text-foreground">{s.title || "Untitled"}</h3>
                  <div className="flex flex-wrap items-center gap-2 mt-1">
                    {getStatusBadge(s.status)}
                    <span className="text-xs text-muted-foreground">
                      {new Date(s.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                <Button variant="ghost" size="sm">View</Button>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}