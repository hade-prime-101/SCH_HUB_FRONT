"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useQuery } from "@/lib/hooks/useQuery";
import { searchUsers } from "@/lib/api/users.api";
import type { UserProfile } from "@/types/users";
import { PageHeader } from "@/components/shared/PageHeader";
import { LoadingState, EmptyState } from "@/components/shared/DashboardPrimitives";
import { ErrorState } from "@/components/shared/ErrorState";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SearchInput } from "@/components/shared/SearchInput";

export default function UserSearchPage() {
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query), 300);
    return () => clearTimeout(timer);
  }, [query]);

  const { data, loading, error, refetch } = useQuery<{ data: UserProfile[]; total: number }>(
    () => searchUsers({ q: debouncedQuery, page: 1, limit: 20 }),
    [debouncedQuery],
    { skip: !debouncedQuery }
  );

  const results = data?.data ?? [];

  return (
    <div className="max-w-3xl mx-auto">
      <PageHeader title="Search Users" description="Find users by name or email" />

      <div className="mt-4">
        <SearchInput
          placeholder="Type a name or email..."
          value={query}
          onChange={setQuery}
        />
      </div>

      {query && (
        <>
          {loading ? (
            <LoadingState label="Searching..." />
          ) : error ? (
            <ErrorState title="Search failed" description={error.message} onRetry={refetch} />
          ) : results.length === 0 ? (
            <EmptyState>No users match your search.</EmptyState>
          ) : (
            <div className="space-y-3 mt-4">
              {results.map((user) => (
                <Card key={user.id} compact className="flex items-center justify-between gap-3">
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
                  <Link href={`/dashboard/profile/${user.id}`}>
                    <Button variant="outline" size="sm">View</Button>
                  </Link>
                </Card>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}