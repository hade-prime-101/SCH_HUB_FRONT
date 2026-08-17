"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createGroup } from "@/lib/api/study-groups.api";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { GroupType } from "@/types/study-groups";

const GROUP_TYPES: { value: GroupType; label: string }[] = [
  { value: 'EXAM_PREP', label: 'Exam Prep' },
  { value: 'ASSIGNMENT', label: 'Assignment' },
  { value: 'TUTORIAL', label: 'Tutorial' },
  { value: 'PROJECT', label: 'Project' },
  { value: 'GENERAL', label: 'General' },
];

export default function CreateGroupPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [type, setType] = useState<GroupType>('GENERAL');
  const [courseTag, setCourseTag] = useState("");
  const [isPrivate, setIsPrivate] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !type) {
      setError("Please fill in all required fields");
      return;
    }
    
    setLoading(true);
    setError(null);
    try {
      await createGroup({ name, type, isPrivate, courseTag: courseTag || undefined });
      router.push("/dashboard/study-groups");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      setError(err.message || "Failed to create group");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto">
      <PageHeader title="Create Study Group" backHref="/dashboard/study-groups" />

      {error && (
        <div className="mt-4 bg-destructive/5 border border-destructive/20 rounded-xl p-4 text-destructive text-sm">
          {error}
        </div>
      )}

      <Card className="mt-4">
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Group Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            disabled={loading}
          />
          
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Type <span className="text-destructive">*</span>
            </label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as GroupType)}
              className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground disabled:opacity-50"
              disabled={loading}
              required
            >
              {GROUP_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>

          <Input
            label="Course Tag (optional)"
            value={courseTag}
            onChange={(e) => setCourseTag(e.target.value)}
            placeholder="e.g., CSC101"
            disabled={loading}
          />

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={isPrivate}
              onChange={(e) => setIsPrivate(e.target.checked)}
              className="h-4 w-4 text-primary rounded border-border focus:ring-primary"
              disabled={loading}
            />
            <span className="text-sm text-foreground">Private group</span>
          </label>
          <div className="flex gap-2 pt-2">
            <Button variant="outline" onClick={() => router.back()} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Creating..." : "Create"}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}