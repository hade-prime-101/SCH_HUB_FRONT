"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getJob, deleteJob, reportContent } from "@/lib/api/marketplace.api";
import type { Job } from "@/types/marketplace";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton";
import { ArrowLeft, AlertTriangle } from "lucide-react";
import Link from "next/link";

export default function JobDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getJob(id)
      .then(setJob)
      .catch(() => setError("Job not found"))
      .finally(() => setLoading(false));
  }, [id]);

  const handleDelete = async () => {
    if (!confirm("Delete this job?")) return;
    await deleteJob(id);
    router.push("/marketplace/jobs");
  };

  const handleReport = async () => {
    const reason = prompt("Reason for report?");
    if (!reason) return;
    await reportContent({ targetType: "job", targetId: id, reason });
    alert("Reported.");
  };

  if (loading) return <LoadingSkeleton height="h-96" />;
  if (error || !job) {
    return (
      <div className="text-center py-20">
        <p className="text-destructive">{error || "Job not found"}</p>
        <Button asChild className="mt-4"><Link href="/marketplace/jobs">Back to jobs</Link></Button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <Button variant="ghost" size="sm" onClick={() => router.back()} className="gap-1">
        <ArrowLeft className="h-4 w-4" /> Back
      </Button>
      <div className="space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">{job.title}</h1>
            <p className="text-sm text-muted-foreground">{job.company} · {job.location}</p>
            {job.salary && <p className="text-sm font-medium text-primary">{job.salary}</p>}
          </div>
          <Badge variant={job.status === "APPROVED" ? "success" : job.status === "PENDING" ? "warning" : "destructive"}>
            {job.status}
          </Badge>
        </div>
        <Card className="p-5">
          <p className="text-muted-foreground whitespace-pre-wrap">{job.description}</p>
        </Card>
        <div className="flex flex-wrap gap-3">
          <Button asChild><Link href={`/marketplace/jobs/${id}/edit`}>Edit</Link></Button>
          <Button variant="destructive" onClick={handleDelete}>Delete</Button>
          <Button variant="ghost" onClick={handleReport} className="text-destructive">
            <AlertTriangle className="mr-1 h-4 w-4" /> Report
          </Button>
        </div>
      </div>
    </div>
  );
}