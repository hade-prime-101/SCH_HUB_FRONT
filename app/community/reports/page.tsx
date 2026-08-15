"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CommunityHeader } from "@/components/community/CommunityHeader";
import { CommunityEmptyState } from "@/components/community/CommunityEmptyState";
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton";
import { ErrorMessage } from "@/components/ui/ErrorMessage";
import { listReports, resolveReport } from "@/lib/api/community.api";
import type { Report } from "@/types/community";

export default function ReportsPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchReports = async () => {
      setLoading(true);
      try {
        const res = await listReports({ page: 1, limit: 50, resolved: false });
        setReports(res.data);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (err: any) {
        setError(err.message || "Failed to load reports");
      } finally {
        setLoading(false);
      }
    };
    fetchReports();
  }, []);

  const handleResolve = async (reportId: string) => {
    if (!confirm("Resolve this report?")) return;
    try {
      await resolveReport(reportId);
      setReports((prev) => prev.filter((r) => r.id !== reportId));
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      alert(err.message || "Failed to resolve report");
    }
  };

  if (error) {
    return <ErrorMessage message={error} />;
  }

  return (
    <div className="pb-24">
      <CommunityHeader
        title="Reported Content"
        description="Review and resolve content that has been flagged by users"
      />

      {loading ? (
        <LoadingSkeleton count={3} height="h-20" />
      ) : (
        <>
          {reports.length === 0 ? (
            <CommunityEmptyState
              icon={<Check className="w-8 h-8" />}
              title="All clear!"
              description="No pending reports. Your community is safe and respectful."
            />
          ) : (
            <div className="space-y-4">
              {reports.map((r) => (
                <Card key={r.id}>
                  <CardContent className="p-5 flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-xl bg-warning/10 text-warning flex items-center justify-center shrink-0">
                        <AlertTriangle className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="font-medium text-foreground">
                          {r.type} reported
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Reason: {r.reason}
                        </p>
                        <p className="text-xs text-muted-foreground/70 mt-0.5">
                          ID: {r.targetId} · {new Date(r.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleResolve(r.id)}
                      className="shrink-0"
                    >
                      Resolve
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}