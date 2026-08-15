"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createAccommodation } from "@/lib/api/marketplace.api";
import type { AccommodationType } from "@/types/marketplace";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AlertCircle } from "lucide-react";

const types: AccommodationType[] = ["HOSTEL", "APARTMENT", "SINGLE_ROOM", "SELF_CONTAINED"];

export default function NewAccommodationPage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<AccommodationType>("HOSTEL");
  const [price, setPrice] = useState("");
  const [location, setLocation] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim() || !price || !location.trim()) {
      setError("All fields are required.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await createAccommodation({ title: title.trim(), description: description.trim(), type, price: Number(price), location: location.trim() });
      router.push("/marketplace/accommodation");
    } catch {
      setError("Failed to create listing.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">List Accommodation</h1>
      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="flex items-center gap-2 rounded-xl bg-destructive/10 p-3 text-destructive text-sm">
            <AlertCircle className="h-4 w-4" /> {error}
          </div>
        )}
        <Input label="Title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Cozy Hostel Room" required />
        <div>
          <label className="block text-sm font-medium mb-1.5">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full rounded-lg border border-border bg-background px-4 py-3 text-sm focus:border-primary focus:ring-2 focus:ring-primary/20"
            rows={4}
            placeholder="Describe the property"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1.5">Type</label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value as AccommodationType)}
            className="w-full rounded-lg border border-border bg-background px-4 py-3 text-sm focus:border-primary focus:ring-2 focus:ring-primary/20"
          >
            {types.map((t) => (
              <option key={t} value={t}>{t.replace("_", " ")}</option>
            ))}
          </select>
        </div>
        <Input label="Price (₦)" type="number" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="0" required />
        <Input label="Location" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="e.g. Sabo, Yaba" required />
        <div className="flex gap-3 pt-4">
          <Button type="submit" disabled={submitting} className="flex-1">{submitting ? "Creating..." : "List Property"}</Button>
          <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
        </div>
      </form>
    </div>
  );
}