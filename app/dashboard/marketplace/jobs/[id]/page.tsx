"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getJob, deleteJob, reportContent } from "@/lib/api/marketplace.api";
import type { Job } from "@/types/marketplace";
import Link from "next/link";

export default function JobDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [job, setJob] = useState<Job | null>(null);

  useEffect(() => { getJob(id).then(setJob); }, [id]);

  const handleDelete = async () => {
    if (!confirm("Delete?")) return;
    await deleteJob(id);
    router.push("/dashboard/marketplace/jobs");
  };

  const handleReport = async () => {
    const reason = prompt("Reason for report?");
    if (!reason) return;
    await reportContent({ targetType: "job", targetId: id, reason });
    alert("Reported.");
  };

  if (!job) return <p>Loading...</p>;

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold">{job.title}</h1>
      <p className="text-sm text-muted-foreground">{job.company} · {job.location}</p>
      <p className="text-sm text-muted-foreground">{job.salary}</p>
      <p className="mt-4">{job.description}</p>
      <p className="text-xs text-muted-foreground/70 mt-2">Status: {job.status}</p>
      <div className="flex gap-3 mt-4">
        <Link href={`/dashboard/marketplace/jobs/${id}/edit`} className="bg-primary text-primary-foreground px-3 py-1 rounded">Edit</Link>
        <button onClick={handleDelete} className="bg-destructive text-primary-foreground px-3 py-1 rounded">Delete</button>
        <button onClick={handleReport} className="text-destructive underline">Report</button>
      </div>
    </div>
  );
}