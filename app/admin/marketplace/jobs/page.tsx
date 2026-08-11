"use client";
import { useEffect, useState } from "react";
import { listPendingJobs, approveJob, rejectJob } from "@/lib/marketplace.api";
import type { Job } from "@/types/marketplace";

export default function AdminJobsPage() {
  const [jobs, setJobs] = useState<Job[]>([]);

  useEffect(() => { listPendingJobs().then(setJobs); }, []);

  const handleApprove = async (id: string) => {
    await approveJob(id);
    setJobs(prev => prev.filter(j => j.id !== id));
  };

  const handleReject = async (id: string) => {
    const reason = prompt('Reason for rejection?');
    if (!reason) return;
    await rejectJob(id, { reason });
    setJobs(prev => prev.filter(j => j.id !== id));
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Pending Jobs</h1>
      {jobs.map(job => (
        <div key={job.id} className="bg-white shadow rounded p-4 mb-3 flex justify-between">
          <div>
            <p className="font-medium">{job.title}</p>
            <p className="text-sm text-gray-600">{job.company} · {job.location}</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => handleApprove(job.id)} className="bg-green-600 text-white px-3 py-1 rounded">Approve</button>
            <button onClick={() => handleReject(job.id)} className="bg-red-600 text-white px-3 py-1 rounded">Reject</button>
          </div>
        </div>
      ))}
    </div>
  );
}