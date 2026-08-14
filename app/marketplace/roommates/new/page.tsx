"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createRoommateRequest } from "@/lib/api/marketplace.api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AlertCircle } from "lucide-react";

export default function NewRoommatePage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [budget, setBudget] = useState("");
  const [gender, setGender] = useState<"MALE" | "FEMALE" | "ANY">("ANY");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim() || !budget) {
      setError("All fields are required.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await createRoommateRequest({ title: title.trim(), description: description.trim(), budget: Number(budget), gender });
      router.push("/marketplace/roommates");
    } catch {
      setError("Failed to create request.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">New Roommate Request</h1>
      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="flex items-center gap-2 rounded-xl bg-destructive/10 p-3 text-destructive text-sm">
            <AlertCircle className="h-4 w-4" /> {error}
          </div>
        )}
        <Input label="Title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Looking for a roommate in Sabo" required />
        <div>
          <label className="block text-sm font-medium mb-1.5">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full rounded-lg border border-border bg-background px-4 py-3 text-sm focus:border-primary focus:ring-2 focus:ring-primary/20"
            rows={4}
            placeholder="Describe what you're looking for"
            required
          />
        </div>
        <Input label="Budget (₦)" type="number" value={budget} onChange={(e) => setBudget(e.target.value)} placeholder="0" required />
        <div>
          <label className="block text-sm font-medium mb-1.5">Preferred Gender</label>
          <select
            value={gender}
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            onChange={(e) => setGender(e.target.value as any)}
            className="w-full rounded-lg border border-border bg-background px-4 py-3 text-sm focus:border-primary focus:ring-2 focus:ring-primary/20"
          >
            <option value="ANY">Any</option>
            <option value="MALE">Male</option>
            <option value="FEMALE">Female</option>
          </select>
        </div>
        <div className="flex gap-3 pt-4">
          <Button type="submit" disabled={submitting} className="flex-1">{submitting ? "Creating..." : "Create Request"}</Button>
          <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
        </div>
      </form>
    </div>
  );
}