"use client";

import Link from "next/link";
import { useQuery } from "@/lib/hooks/useQuery";
import { getMyProfile } from "@/lib/api/users.api";
import type { UserProfile } from "@/types/users";
import { PageHeader } from "@/components/shared/PageHeader";
import { LoadingState } from "@/components/shared/DashboardPrimitives";
import { ErrorState } from "@/components/shared/ErrorState";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function MyProfilePage() {
  const { data: profile, loading, error, refetch } = useQuery<UserProfile>(
    () => getMyProfile(),
    []
  );

  if (loading) return <LoadingState label="Loading profile" />;
  if (error) return <ErrorState title="Failed to load profile" description={error.message} onRetry={refetch} />;
  if (!profile) return null;

  return (
    <div className="max-w-2xl mx-auto p-4 md:p-6">
      <PageHeader
        title="My Profile"
        actions={
          <Link href="/dashboard/profile/edit">
            <Button>Edit Profile</Button>
          </Link>
        }
      />

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
            <strong>Bio:</strong> {profile.bio || "No bio yet"}
          </p>
          <p>
            <strong>Department:</strong> {profile.department || "N/A"}
          </p>
          <p>
            <strong>Level:</strong> {profile.level || "N/A"}
          </p>
        </div>
      </Card>
    </div>
  );
}