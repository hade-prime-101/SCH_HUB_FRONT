"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createService } from "@/lib/api/marketplace.api";
import type { ServiceCategory } from "@/types/marketplace";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AlertCircle } from "lucide-react";

const categories: ServiceCategory[] = ["TUTORING", "TECH", "BEAUTY", "FASHION", "OTHER"];

export default function NewServicePage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<ServiceCategory>("OTHER");
  const [price, setPrice] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim() || !price) {
      setError("Please fill all required fields.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await createService({ title: title.trim(), description: description.trim(), category, price: Number(price) });
      router.push("/marketplace/services");
    } catch {
      setError("Failed to create service.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Offer a Service</h1>
      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="flex items-center gap-2 rounded-xl bg-destructive/10 p-3 text-destructive text-sm">
            <AlertCircle className="h-4 w-4" /> {error}
          </div>
        )}
        <Input label="Title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Web Development, Tutoring" required />
        <div>
          <label className="block text-sm font-medium mb-1.5">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full rounded-lg border border-border bg-background px-4 py-3 text-sm focus:border-primary focus:ring-2 focus:ring-primary/20"
            rows={4}
            placeholder="Describe your service"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1.5">Category</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as ServiceCategory)}
            className="w-full rounded-lg border border-border bg-background px-4 py-3 text-sm focus:border-primary focus:ring-2 focus:ring-primary/20"
          >
            {categories.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
        <Input label="Price (₦)" type="number" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="0" required />
        <div className="flex gap-3 pt-4">
          <Button type="submit" disabled={submitting} className="flex-1">{submitting ? "Creating..." : "Create Service"}</Button>
          <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
        </div>
      </form>
    </div>
  );
}