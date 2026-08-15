"use client";

import { useQuery } from "@/lib/hooks/useQuery";
import { getBookmarks } from "@/lib/api/users.api";
import type { Bookmark } from "@/types/users";
import { PageHeader } from "@/components/shared/PageHeader";
import { LoadingState, EmptyState } from "@/components/shared/DashboardPrimitives";
import { ErrorState } from "@/components/shared/ErrorState";
import { Card } from "@/components/ui/card";

export default function BookmarksPage() {
  const { data, loading, error, refetch } = useQuery<Bookmark[]>(
    () => getBookmarks(),
    []
  );

  if (loading) return <LoadingState label="Loading bookmarks" />;
  if (error) return <ErrorState title="Failed to load bookmarks" description={error.message} onRetry={refetch} />;

  return (
    <div className="max-w-3xl mx-auto p-4 md:p-6">
      <PageHeader title="Bookmarks" description="Your saved items" />

      {!data || data.length === 0 ? (
        <EmptyState>No bookmarks.</EmptyState>
      ) : (
        <div className="space-y-2 mt-4">
          {data.map((b) => (
            <Card key={b.id} compact>
              <p>
                {b.targetType}: {b.targetId}
              </p>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}