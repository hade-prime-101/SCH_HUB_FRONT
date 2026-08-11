"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { listJobs, deleteJob } from "@/lib/marketplace.api";
import type { Job } from "@/types/marketplace";

export default function JobsPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 10;

  useEffect(() => {
    listJobs({ page, limit }).then((res) => {
      setJobs(res.data);
      setTotal(res.total);
    });
  }, [page]);

  const handleDelete = async (id: string) => {
    await deleteJob(id);
    setJobs((prev) => prev.filter((j) => j.id !== id));
  };

  return (
    <div>
      <div className="flex justify-between mb-4">
        <h1 className="text-2xl font-bold">Jobs</h1>
        <Link href="/dashboard/marketplace/jobs/new" className="bg-blue-600 text-white px-4 py-2 rounded">
          Post a Job
        </Link>
      </div>
      <div className="space-y-3">
        {jobs.map((job) => (
          <div key={job.id} className="bg-white shadow rounded p-4 flex justify-between items-center">
            <div>
              <Link href={`/dashboard/marketplace/jobs/${job.id}`} className="font-medium text-blue-600">
                {job.title}
              </Link>
              <p className="text-sm text-gray-600">{job.company} · {job.location} · {job.salary}</p>
              <p className="text-xs text-gray-400">{job.status}</p>
            </div>
            <button onClick={() => handleDelete(job.id)} className="text-red-600 text-sm">Delete</button>
          </div>
        ))}
      </div>
      <div className="flex justify-between mt-4">
        <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="btn">Prev</button>
        <span>Page {page}</span>
        <button disabled={page * limit >= total} onClick={() => setPage((p) => p + 1)} className="btn">Next</button>
      </div>
    </div>
  );
}