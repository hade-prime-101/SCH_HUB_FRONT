// app/study/summaries/[materialId]/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { apiGet } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton";
import { ArrowLeft, FileText, Clock, CheckCircle, XCircle } from "lucide-react";
import type { AISummary } from "@/types/study";

export default function SummaryDetailPage() {
  const { materialId } = useParams<{ materialId: string }>();
  const router = useRouter();
  const [summary, setSummary] = useState<AISummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const data = await apiGet(`/ai/summaries/${materialId}`);
        setSummary(data);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    })();
  }, [materialId]);

  if (loading) return <LoadingSkeleton count={1} height="h-64" radius="rounded-2xl" />;
  if (error) {
    return (
      <div className="bg-destructive/5 border border-destructive/20 rounded-xl p-6 text-destructive">
        <p>Failed to load summary: {error}</p>
      </div>
    );
  }
  if (!summary) return <div className="text-center py-12">Summary not found.</div>;

  const getStatusIcon = () => {
    switch (summary.status) {
      case "COMPLETED": return <CheckCircle className="w-5 h-5 text-success" />;
      case "PENDING":
      case "PROCESSING": return <Clock className="w-5 h-5 text-warning" />;
      case "FAILED": return <XCircle className="w-5 h-5 text-destructive" />;
      default: return null;
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Button variant="ghost" size="sm" onClick={() => router.back()} className="gap-2">
        <ArrowLeft className="w-4 h-4" />
        Back
      </Button>

      <Card>
        <CardContent className="p-6 space-y-4">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-bold">{summary.title || "Summary"}</h1>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-sm text-muted-foreground">Status:</span>
                <span className="flex items-center gap-1 text-sm font-medium">
                  {getStatusIcon()}
                  {summary.status}
                </span>
              </div>
            </div>
            <FileText className="w-6 h-6 text-muted-foreground" />
          </div>

          {summary.status === "COMPLETED" ? (
            <div className="prose prose-sm max-w-none whitespace-pre-wrap">
              {summary.content}
            </div>
          ) : summary.status === "PENDING" || summary.status === "PROCESSING" ? (
            <div className="bg-muted/50 rounded-xl p-6 text-center">
              <Clock className="w-8 h-8 text-warning mx-auto mb-2" />
              <p className="text-muted-foreground">Your summary is being generated. Please check back later.</p>
            </div>
          ) : summary.status === "FAILED" ? (
            <div className="bg-destructive/5 rounded-xl p-6 text-center text-destructive">
              <p>Summary generation failed. Please try again.</p>
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}