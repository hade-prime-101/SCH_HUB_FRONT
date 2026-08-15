"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getAccommodation, updateAccommodation } from "@/lib/api/marketplace.api";
import type { AccommodationType } from "@/types/marketplace";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton";
import { AlertCircle } from "lucide-react";

const types: AccommodationType[] = ["HOSTEL", "APARTMENT", "SINGLE_ROOM", "SELF_CONTAINED"];

export default function EditAccommodationPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<AccommodationType>("HOSTEL");
  const [price, setPrice] = useState("");
  const [location, setLocation] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getAccommodation(id)
      .then((a) => {
        setTitle(a.title);
        setDescription(a.description);
        setType(a.type);
        setPrice(String(a.price));
        setLocation(a.location);
      })
      .catch(() => setError("Failed to load"))
      .finally(() => setLoading(false));
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim() || !price || !location.trim()) {
      setError("All fields are required.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await updateAccommodation(id, { title: title.trim(), description: description.trim(), type, price: Number(price), location: location.trim() });
      router.push(`/marketplace/accommodation/${id}`);
    } catch {
      setError("Failed to update.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <LoadingSkeleton height="h-96" />;

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Edit Accommodation</h1>
      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="flex items-center gap-2 rounded-xl bg-destructive/10 p-3 text-destructive text-sm">
            <AlertCircle className="h-4 w-4" /> {error}
          </div>
        )}
        <Input label="Title" value={title} onChange={(e) => setTitle(e.target.value)} required />
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
        <Input label="Price (₦)" type="number" value={price} onChange={(e) => setPrice(e.target.value)} required />
        <Input label="Location" value={location} onChange={(e) => setLocation(e.target.value)} required />
        <div className="flex gap-3 pt-4">
          <Button type="submit" disabled={submitting} className="flex-1">{submitting ? "Saving..." : "Save Changes"}</Button>
          <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
        </div>
      </form>
    </div>
  );
}