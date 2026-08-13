"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { MarketplacePageHeader } from "@/components/marketplace/MarketplacePageHeader";
import { JobCard } from "@/components/marketplace/JobCard";
import { MarketplaceEmptyState } from "@/components/marketplace/MarketplaceEmptyState";
import { Pagination } from "@/components/ui/Pagination";
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton";
import { listJobs, deleteJob } from "@/lib/api/marketplace.api";
import type { Job } from "@/types/marketplace";
import { Briefcase } from "lucide-react";

export default function JobsPage() {
  const router = useRouter();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const limit = 10;

  useEffect(() => {
    setLoading(true);
    listJobs({ page, limit })
      .then((res) => {
        setJobs(res.data);
        setTotal(res.total);
      })
      .finally(() => setLoading(false));
  }, [page]);

  const filtered = jobs.filter((j) =>
    j.title.toLowerCase().includes(search.toLowerCase()) ||
    (j.company?.toLowerCase().includes(search.toLowerCase()))
  );

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this job?")) return;
    await deleteJob(id);
    setJobs((prev) => prev.filter((j) => j.id !== id));
  };

  return (
    <div>
      <MarketplacePageHeader
        title="Jobs"
        description="Find campus job opportunities"
        createLabel="Post a Job"
        onCreate={() => router.push("/marketplace/jobs/new")}
        showSearch
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search jobs..."
      />
      {loading ? (
        <div className="grid grid-cols-1 gap-4">
          {[...Array(4)].map((_, i) => <LoadingSkeleton key={i} height="h-28" />)}
        </div>
      ) : filtered.length === 0 ? (
        <MarketplaceEmptyState
          icon={<Briefcase className="h-8 w-8" />}
          title="No jobs posted yet"
          description="Be the first to post a job or try a different search."
          actionLabel="Post a Job"
          onAction={() => router.push("/marketplace/jobs/new")}
        />
      ) : (
        <>
          <div className="space-y-3">
            {filtered.map((job) => (
              <div key={job.id} className="relative">
                <JobCard job={job} />
                <button
                  onClick={() => handleDelete(job.id)}
                  className="absolute right-4 top-4 text-xs text-destructive hover:underline"
                >
                  Delete
                </button>
              </div>
            ))}
          </div>
          <Pagination
            currentPage={page}
            totalPages={Math.ceil(total / limit)}
            onPageChange={setPage}
            loading={loading}
          />
        </>
      )}
    </div>
  );
}