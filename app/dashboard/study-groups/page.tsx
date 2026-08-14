"use client";

import { useState } from "react";
import Link from "next/link";
import { usePaginatedQuery } from "@/lib/hooks/usePaginatedQuery";
import { listGroups } from "@/lib/api/study-groups.api";
import type { StudyGroup } from "@/types/study-groups";
import { PageHeader } from "@/components/shared/PageHeader";
import { LoadingState, EmptyState } from "@/components/shared/DashboardPrimitives";
import { ErrorState } from "@/components/shared/ErrorState";
import { Pagination } from "@/components/ui/Pagination";
import { Button } from "@/components/ui/button";
import { GroupCard } from "@/components/study-groups/GroupCard";

export default function MyGroupsPage() {
  const [page, setPage] = useState(1);
  const limit = 10;

  const { data, total, loading, error, refetch } = usePaginatedQuery<StudyGroup>(
    ({ page, limit }) => listGroups({ page, limit }),
    { page, limit }
  );

  if (loading) return <LoadingState label="Loading your groups" />;
  if (error) return <ErrorState title="Failed to load groups" description={error.message} onRetry={refetch} />;

  return (
    <div>
      <PageHeader
        title="My Study Groups"
        actions={
          <Link href="/dashboard/study-groups/create">
            <Button>New Group</Button>
          </Link>
        }
      />

      {!data || data.length === 0 ? (
        <EmptyState>You haven't joined any groups yet.</EmptyState>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            {data.map((group) => (
              <GroupCard key={group.id} group={group} />
            ))}
          </div>

          {total > limit && (
            <Pagination
              currentPage={page}
              totalPages={Math.ceil(total / limit)}
              onPageChange={setPage}
              showPageNumber
            />
          )}
        </>
      )}
    </div>
  );
}