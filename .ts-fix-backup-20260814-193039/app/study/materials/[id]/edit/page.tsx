import * as React from "react";
// app/study/materials/[id]/edit/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { apiGet, apiPatch } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton";
import type { Material, MaterialVisibility } from "@/types/study";

export default function EditMaterialPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [courseCode, setCourseCode] = useState("");
  const [courseTitle, setCourseTitle] = useState("");
  const [description, setDescription] = useState("");
  const [visibility, setVisibility] = useState<MaterialVisibility>("PUBLIC");

  useEffect(() => {
    (async () => {
      try {
        const data = await apiGet(`/study/materials/${id}`);
        setTitle(data.title);
        setCourseCode(data.courseCode || "");
        setCourseTitle(data.courseTitle || "");
        setDescription(data.description || "");
        setVisibility(data.visibility);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiPatch(`/study/materials/${id}`, { title, courseCode, courseTitle, description, visibility });
      router.push(`/study/materials/${id}`);
    } catch (err: any) {
      setError(err.message);
    }
  };

  if (loading) return <LoadingSkeleton count={1} height="h-96" radius="rounded-2xl" />;
  if (error) {
    return (
      <div className="bg-destructive/5 border border-destructive/20 rounded-xl p-6 text-destructive">
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Edit Material</h1>
      <form onSubmit={handleSubmit} className="bg-card rounded-2xl border border-border p-6 space-y-4">
        <div>
          <Label htmlFor="title">Title *</Label>
          <Input id="title" value={title} onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setTitle(e.target.value)} required />
        </div>
        <div>
          <Label htmlFor="courseCode">Course Code</Label>
          <Input id="courseCode" value={courseCode} onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setCourseCode(e.target.value)} />
        </div>
        <div>
          <Label htmlFor="courseTitle">Course Title</Label>
          <Input id="courseTitle" value={courseTitle} onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setCourseTitle(e.target.value)} />
        </div>
        <div>
          <Label htmlFor="description">Description</Label>
          <Textarea id="description" value={description} onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setDescription(e.target.value)} rows={4} />
        </div>
        <div>
          <Label htmlFor="visibility">Visibility</Label>
          <Select value={visibility} onValueChange={(val) => setVisibility(val as MaterialVisibility)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="PUBLIC">Public</SelectItem>
              <SelectItem value="PRIVATE">Private</SelectItem>
              <SelectItem value="LINK_ONLY">Link Only</SelectItem>
              <SelectItem value="DEPARTMENT">Department</SelectItem>
              <SelectItem value="LEVEL">Level</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex gap-3 pt-2">
          <Button type="submit">Save Changes</Button>
          <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
        </div>
      </form>
    </div>
  );
}