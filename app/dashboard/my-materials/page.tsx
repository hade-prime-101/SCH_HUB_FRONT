"use client";

import { useQuery } from "@/lib/hooks/useQuery";
import { getMyMaterials } from "@/lib/api/users.api";
import type { UserMaterial } from "@/types/users";
import { PageHeader } from "@/components/shared/PageHeader";
import { LoadingState, EmptyState } from "@/components/shared/DashboardPrimitives";
import { ErrorState } from "@/components/shared/ErrorState";
import { Card } from "@/components/ui/card";

export default function MyMaterialsPage() {
  const { data, loading, error, refetch } = useQuery<UserMaterial[]>(
    () => getMyMaterials(),
    []
  );

  if (loading) return <LoadingState label="Loading materials" />;
  if (error) return <ErrorState title="Failed to load materials" description={error.message} onRetry={refetch} />;

  return (
    <div className="max-w-3xl mx-auto p-4 md:p-6">
      <PageHeader title="My Materials" description="Resources you've uploaded" />

      {!data || data.length === 0 ? (
        <EmptyState>No materials yet.</EmptyState>
      ) : (
        <div className="space-y-2 mt-4">
          {data.map((m) => (
            <Card key={m.id} compact>
              <p>
                {m.title} {m.courseCode && `(${m.courseCode})`}
              </p>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}