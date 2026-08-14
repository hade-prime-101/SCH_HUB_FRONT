"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@/lib/hooks/useQuery";
import { getMyProfile, updateProfile, uploadAvatar } from "@/lib/api/users.api";
import type { UserProfile } from "@/types/users";
import { PageHeader } from "@/components/shared/PageHeader";
import { LoadingState, EmptyState } from "@/components/shared/DashboardPrimitives";
import { ErrorState } from "@/components/shared/ErrorState";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function EditProfilePage() {
  const router = useRouter();
  const { data: profile, loading, error, refetch } = useQuery<UserProfile>(
    () => getMyProfile(),
    []
  );

  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [department, setDepartment] = useState("");
  const [level, setLevel] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (profile) {
      setName(profile.name);
      setBio(profile.bio || "");
      setDepartment(profile.department || "");
      setLevel(profile.level || "");
    }
  }, [profile]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateProfile({ name, bio, department, level });
      router.push("/dashboard/profile");
    } catch (err) {
      alert("Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      await uploadAvatar(file);
      await refetch();
      alert("Avatar updated");
    } catch {
      alert("Failed to upload avatar");
    }
  };

  if (loading) return <LoadingState label="Loading profile" />;
  if (error) return <ErrorState title="Failed to load profile" description={error.message} onRetry={refetch} />;
  if (!profile) return null;

  return (
    <div className="max-w-xl mx-auto p-4 md:p-6">
      <PageHeader title="Edit Profile" backHref="/dashboard/profile" />

      <Card className="mt-4 space-y-4">
        <div>
          <label className="block text-sm font-medium text-foreground">Avatar</label>
          <input type="file" onChange={handleAvatarUpload} accept="image/*" />
        </div>

        <Input
          label="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
        <Input
          label="Bio"
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          placeholder="Tell us about yourself"
        />
        <Input
          label="Department"
          value={department}
          onChange={(e) => setDepartment(e.target.value)}
          placeholder="e.g. Computer Science"
        />
        <Input
          label="Level"
          value={level}
          onChange={(e) => setLevel(e.target.value)}
          placeholder="e.g. 300 Level"
        />

        <div className="flex gap-2 pt-2">
          <Button variant="outline" onClick={() => router.back()} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Saving..." : "Save"}
          </Button>
        </div>
      </Card>
    </div>
  );
}