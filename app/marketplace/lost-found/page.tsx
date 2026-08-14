"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { MarketplacePageHeader } from "@/components/marketplace/MarketplacePageHeader";
import { MarketplaceEmptyState } from "@/components/marketplace/MarketplaceEmptyState";
import { Pagination } from "@/components/ui/Pagination";
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton";
import { listLostFound, createLostFound, resolveLostFound } from "@/lib/api/marketplace.api";
import type { LostFoundItem, CreateLostFoundPayload } from "@/types/marketplace";
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { Megaphone, CheckCircle2, X } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function LostFoundPage() {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const router = useRouter();
  const [items, setItems] = useState<LostFoundItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<CreateLostFoundPayload>({ title: "", description: "", type: "LOST", location: "" });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const limit = 10;

  const fetchItems = () => {
    setLoading(true);
    listLostFound({ page, limit })
      .then((res) => {
        setItems(res.data);
        setTotal(res.total);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchItems();
  }, [page]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.description.trim()) {
      setError("Title and description are required.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await createLostFound(form);
      setShowForm(false);
      setForm({ title: "", description: "", type: "LOST", location: "" });
      fetchItems();
    } catch {
      setError("Failed to report item.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleResolve = async (id: string) => {
    await resolveLostFound(id);
    fetchItems();
  };

  return (
    <div>
      <MarketplacePageHeader
        title="Lost & Found"
        description="Report lost or found items on campus"
        createLabel={showForm ? "Cancel" : "Report Item"}
        onCreate={() => setShowForm(!showForm)}
      />
      {showForm && (
        <Card className="p-5 mb-6">
          <form onSubmit={handleCreate} className="space-y-4">
            {error && (
              <div className="flex items-center gap-2 rounded-xl bg-destructive/10 p-3 text-destructive text-sm">
                <Megaphone className="h-4 w-4" /> {error}
              </div>
            )}
            <Input label="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. Lost wallet" required />
            <div>
              <label className="block text-sm font-medium mb-1.5">Description</label>
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="w-full rounded-lg border border-border bg-background px-4 py-3 text-sm focus:border-primary focus:ring-2 focus:ring-primary/20"
                rows={3}
                placeholder="Describe the item"
                required
              />
            </div>
            <div className="flex gap-3">
              <select
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value as 'LOST' | 'FOUND' })}
                className="rounded-lg border border-border bg-background px-4 py-2 text-sm focus:border-primary focus:ring-2 focus:ring-primary/20"
              >
                <option value="LOST">Lost</option>
                <option value="FOUND">Found</option>
              </select>
              <Input label="" placeholder="Location" value={form.location || ""} onChange={(e) => setForm({ ...form, location: e.target.value })} />
              <Button type="submit" disabled={submitting} className="shrink-0">
                {submitting ? "Submitting..." : "Submit"}
              </Button>
            </div>
          </form>
        </Card>
      )}

      {loading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => <LoadingSkeleton key={i} height="h-20" />)}
        </div>
      ) : items.length === 0 ? (
        <MarketplaceEmptyState
          icon={<Megaphone className="h-8 w-8" />}
          title="No items reported yet"
          description="Report a lost or found item to help your campus community."
          actionLabel="Report Item"
          onAction={() => setShowForm(true)}
        />
      ) : (
        <>
          <div className="space-y-3">
            {items.map((item) => (
              <Card key={item.id} className="p-4 flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold">{item.title}</h3>
                    <Badge variant={item.type === "LOST" ? "destructive" : "success"}>{item.type}</Badge>
                    {item.resolved && (
                      <Badge variant="outline" className="text-success border-success">Resolved</Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">{item.description}</p>
                  {item.location && <p className="text-xs text-muted-foreground/70">📍 {item.location}</p>}
                </div>
                {!item.resolved && (
                  <Button variant="outline" size="sm" onClick={() => handleResolve(item.id)}>
                    <CheckCircle2 className="h-4 w-4 mr-1" /> Resolve
                  </Button>
                )}
              </Card>
            ))}
          </div>
          <Pagination
            currentPage={page}
            totalPages={Math.ceil(total / limit)}
            onPageChange={setPage}
            loading={loading}
          />
        </>
      )}
    </div>
  );
}