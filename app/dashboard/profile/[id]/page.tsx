"use client";

import { useParams } from "next/navigation";
import { useQuery } from "@/lib/hooks/useQuery";
import { getProfile, getUserMaterials } from "@/lib/api/users.api";
import type { UserProfile, UserMaterial } from "@/types/users";
import { PageHeader } from "@/components/shared/PageHeader";
import { LoadingState, EmptyState } from "@/components/shared/DashboardPrimitives";
import { ErrorState } from "@/components/shared/ErrorState";
import { Card } from "@/components/ui/card";

export default function UserProfilePage() {
  const { id } = useParams<{ id: string }>();

  const {
    data: profile,
    loading: profileLoading,
    error: profileError,
    refetch: refetchProfile,
  } = useQuery<UserProfile>(() => getProfile(id), [id]);

  const {
    data: materials,
    loading: materialsLoading,
    error: materialsError,
    refetch: refetchMaterials,
  } = useQuery<UserMaterial[]>(() => getUserMaterials(id), [id]);

  if (profileLoading || materialsLoading) return <LoadingState label="Loading profile" />;
  if (profileError)
    return <ErrorState title="Failed to load profile" description={profileError.message} onRetry={refetchProfile} />;
  if (!profile) return null;

  return (
    <div className="max-w-2xl mx-auto p-4 md:p-6">
      <PageHeader title="User Profile" backHref="/dashboard/profile" />

      <div className="flex items-center gap-4 mt-4">
        {profile.avatarUrl ? (
          <img
            src={profile.avatarUrl}
            alt={profile.name}
            className="w-20 h-20 rounded-full object-cover"
          />
        ) : (
          <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center text-2xl font-bold text-foreground">
            {profile.name.charAt(0).toUpperCase()}
          </div>
        )}
        <div>
          <h2 className="text-2xl font-bold">{profile.name}</h2>
          <p className="text-muted-foreground">{profile.email}</p>
          <p className="text-sm text-muted-foreground">Role: {profile.role}</p>
        </div>
      </div>

      <Card className="mt-4">
        <div className="space-y-2">
          <p>
            <strong>Bio:</strong> {profile.bio || "No bio"}
          </p>
          <p>
            <strong>Department:</strong> {profile.department || "N/A"}
          </p>
          <p>
            <strong>Level:</strong> {profile.level || "N/A"}
          </p>
        </div>
      </Card>

      <h2 className="text-lg font-semibold mt-6">Materials ({materials?.length || 0})</h2>
      {materialsError ? (
        <p className="text-sm text-destructive">Failed to load materials</p>
      ) : !materials || materials.length === 0 ? (
        <EmptyState>No materials.</EmptyState>
      ) : (
        <div className="space-y-2 mt-2">
          {materials.map((m) => (
            <Card key={m.id} compact>
              {m.title} {m.courseCode && `(${m.courseCode})`}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}