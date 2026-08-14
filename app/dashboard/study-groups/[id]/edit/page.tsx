"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@/lib/hooks/useQuery";
import { getGroup, updateGroup } from "@/lib/api/study-groups.api";
import type { StudyGroup } from "@/types/study-groups";
import { PageHeader } from "@/components/shared/PageHeader";
import { LoadingState, ErrorState } from "@/components/shared/DashboardPrimitives";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function EditGroupPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const { data: group, loading: loadingGroup, error, refetch } = useQuery<StudyGroup>(
    () => getGroup(id),
    [id]
  );

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isPrivate, setIsPrivate] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (group) {
      setName(group.name);
      setDescription(group.description || "");
      setIsPrivate(group.isPrivate);
    }
  }, [group]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await updateGroup(id, { name, description, isPrivate });
      router.push(`/dashboard/study-groups/${id}`);
    } catch (err) {
      alert("Failed to update group");
    } finally {
      setSaving(false);
    }
  };

  if (loadingGroup) return <LoadingState label="Loading group" />;
  if (error) return <ErrorState title="Failed to load group" description={error.message} onRetry={refetch} />;
  if (!group) return null;

  return (
    <div className="max-w-xl mx-auto">
      <PageHeader title="Edit Group" backHref={`/dashboard/study-groups/${id}`} />

      <Card className="mt-4">
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Group Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            disabled={saving}
          />
          <Input
            label="Description (optional)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            disabled={saving}
          />
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={isPrivate}
              onChange={(e) => setIsPrivate(e.target.checked)}
              className="h-4 w-4 text-primary rounded border-border focus:ring-primary"
              disabled={saving}
            />
            <span className="text-sm text-foreground">Private</span>
          </label>
          <div className="flex gap-2 pt-2">
            <Button variant="outline" onClick={() => router.back()} disabled={saving}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? "Saving..." : "Save"}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}