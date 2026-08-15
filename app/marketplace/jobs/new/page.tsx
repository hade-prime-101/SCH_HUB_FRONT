"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createJob } from "@/lib/api/marketplace.api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AlertCircle } from "lucide-react";

export default function NewJobPage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [company, setCompany] = useState("");
  const [location, setLocation] = useState("");
  const [salary, setSalary] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) {
      setError("Title and description are required.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await createJob({ title: title.trim(), description: description.trim(), company, location, salary });
      router.push("/marketplace/jobs");
    } catch {
      setError("Failed to post job.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Post a Job</h1>
      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="flex items-center gap-2 rounded-xl bg-destructive/10 p-3 text-destructive text-sm">
            <AlertCircle className="h-4 w-4" /> {error}
          </div>
        )}
        <Input label="Job Title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Frontend Developer" required />
        <div>
          <label className="block text-sm font-medium mb-1.5">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full rounded-lg border border-border bg-background px-4 py-3 text-sm focus:border-primary focus:ring-2 focus:ring-primary/20"
            rows={4}
            placeholder="Job description, requirements, etc."
            required
          />
        </div>
        <Input label="Company (optional)" value={company} onChange={(e) => setCompany(e.target.value)} placeholder="Company name" />
        <Input label="Location (optional)" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="e.g. Remote, Lagos" />
        <Input label="Salary (optional)" value={salary} onChange={(e) => setSalary(e.target.value)} placeholder="e.g. ₦100,000/month" />
        <div className="flex gap-3 pt-4">
          <Button type="submit" disabled={submitting} className="flex-1">{submitting ? "Posting..." : "Post Job"}</Button>
          <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
        </div>
      </form>
    </div>
  );
}