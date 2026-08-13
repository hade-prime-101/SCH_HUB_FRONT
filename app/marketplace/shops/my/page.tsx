"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getMyShop, createShop, updateShop } from "@/lib/api/marketplace.api";
import type { Shop } from "@/types/marketplace";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton";
import { AlertCircle } from "lucide-react";

export default function MyShopPage() {
  const router = useRouter();
  const [shop, setShop] = useState<Shop | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getMyShop()
      .then((data) => {
        setShop(data);
        setName(data.name);
        setDescription(data.description);
      })
      .catch(() => {
        // No shop yet
        setShop(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    if (!name.trim() || !description.trim()) {
      setError("Name and description are required.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      if (shop) {
        const updated = await updateShop({ name: name.trim(), description: description.trim() });
        setShop(updated);
      } else {
        const created = await createShop({ name: name.trim(), description: description.trim() });
        setShop(created);
      }
      alert(shop ? "Shop updated." : "Shop created.");
      router.push("/marketplace/shops");
    } catch {
      setError("Failed to save shop.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <LoadingSkeleton height="h-64" />;

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">{shop ? "Edit Your Shop" : "Create Your Shop"}</h1>
      <div className="space-y-6">
        {error && (
          <div className="flex items-center gap-2 rounded-xl bg-destructive/10 p-3 text-destructive text-sm">
            <AlertCircle className="h-4 w-4" /> {error}
          </div>
        )}
        <Input label="Shop Name" value={name} onChange={(e) => setName(e.target.value)} required />
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
        <div className="flex gap-3">
          <Button onClick={handleSave} disabled={submitting} className="flex-1">
            {submitting ? "Saving..." : shop ? "Update Shop" : "Create Shop"}
          </Button>
          <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
        </div>
      </div>
    </div>
  );
}