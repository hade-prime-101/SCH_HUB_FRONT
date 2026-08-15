// app/study/analytics/page.tsx
"use client";

import { useEffect, useState } from "react";
import { apiGet } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton";

export default function AnalyticsPage() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await apiGet("/study/analytics/my");
        setData(res);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <LoadingSkeleton count={4} height="h-24" radius="rounded-xl" />;
  if (error) {
    return (
      <div className="bg-destructive/5 border border-destructive/20 rounded-xl p-6 text-destructive">
        <p>Failed to load analytics: {error}</p>
      </div>
    );
  }
  if (!data) return <div className="text-center py-12">No analytics data available.</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">My Analytics</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-5">
            <p className="text-sm text-muted-foreground">Materials Uploaded</p>
            <p className="text-2xl font-bold">{data.materialsUploaded}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-sm text-muted-foreground">Quizzes Created</p>
            <p className="text-2xl font-bold">{data.quizzesCreated}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-sm text-muted-foreground">Avg Quiz Score</p>
            <p className="text-2xl font-bold">{data.averageQuizScore?.toFixed(1) ?? "—"}%</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-sm text-muted-foreground">Total Downloads</p>
            <p className="text-2xl font-bold">{data.totalDownloads}</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}