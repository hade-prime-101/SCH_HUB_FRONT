"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getJob, updateJob } from "@/lib/api/marketplace.api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton";
import { AlertCircle } from "lucide-react";

export default function EditJobPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [company, setCompany] = useState("");
  const [location, setLocation] = useState("");
  const [salary, setSalary] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getJob(id)
      .then((j) => {
        setTitle(j.title);
        setDescription(j.description);
        setCompany(j.company || "");
        setLocation(j.location || "");
        setSalary(j.salary || "");
      })
      .catch(() => setError("Failed to load job"))
      .finally(() => setLoading(false));
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) {
      setError("Title and description are required.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await updateJob(id, { title: title.trim(), description: description.trim(), company, location, salary });
      router.push(`/marketplace/jobs/${id}`);
    } catch {
      setError("Failed to update job.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <LoadingSkeleton height="h-96" />;

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Edit Job</h1>
      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="flex items-center gap-2 rounded-xl bg-destructive/10 p-3 text-destructive text-sm">
            <AlertCircle className="h-4 w-4" /> {error}
          </div>
        )}
        <Input label="Job Title" value={title} onChange={(e) => setTitle(e.target.value)} required />
        <div>
          <label className="block text-sm font-medium mb-1.5">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full rounded-lg border border-border bg-background px-4 py-3 text-sm focus:border-primary focus:ring-2 focus:ring-primary/20"
            rows={4}
            required
          />
        </div>
        <Input label="Company" value={company} onChange={(e) => setCompany(e.target.value)} />
        <Input label="Location" value={location} onChange={(e) => setLocation(e.target.value)} />
        <Input label="Salary" value={salary} onChange={(e) => setSalary(e.target.value)} />
        <div className="flex gap-3 pt-4">
          <Button type="submit" disabled={submitting} className="flex-1">{submitting ? "Saving..." : "Save Changes"}</Button>
          <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
        </div>
      </form>
    </div>
  );
}