"use client";

import { useState } from "react";
import Link from "next/link";
import { usePaginatedQuery } from "@/lib/hooks/usePaginatedQuery";
import { listUsers } from "@/lib/api/users.api";
import type { UserProfile } from "@/types/users";
import { PageHeader } from "@/components/shared/PageHeader";
import { LoadingState, EmptyState } from "@/components/shared/DashboardPrimitives";
import { ErrorState } from "@/components/shared/ErrorState";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SearchInput } from "@/components/shared/SearchInput";
import { Pagination } from "@/components/ui/Pagination";

export default function UsersPage() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const limit = 10;

  const { data, total, loading, error, refetch } = usePaginatedQuery<UserProfile>(
    ({ page, limit }) => listUsers({ page, limit, search: search || undefined }),
    { page, limit }
  );

  if (loading) return <LoadingState label="Loading users" />;
  if (error) return <ErrorState title="Failed to load users" description={error.message} onRetry={refetch} />;

  return (
    <div className="max-w-4xl mx-auto">
      <PageHeader title="All Users" description="Browse and manage users" />

      <div className="mt-4">
        <SearchInput
          placeholder="Search by name or email..."
          value={search}
          onChange={(val) => {
            setSearch(val);
            setPage(1);
          }}
        />
      </div>

      {!data || data.length === 0 ? (
        <EmptyState>No users found.</EmptyState>
      ) : (
        <>
          <div className="space-y-3 mt-4">
            {data.map((user) => (
              <Card key={user.id} compact className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  {user.avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={user.avatarUrl}
                      alt={user.name}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-accent flex items-center justify-center text-primary font-bold">
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="font-semibold text-foreground truncate">{user.name}</p>
                    <p className="text-sm text-muted-foreground truncate">{user.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-xs bg-muted px-2 py-1 rounded-full text-muted-foreground">
                    {user.role}
                  </span>
                  <Link href={`/dashboard/profile/${user.id}`}>
                    <Button variant="outline" size="sm">View</Button>
                  </Link>
                </div>
              </Card>
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