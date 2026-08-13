// app/study/materials/[id]/review/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { apiGet, apiPost } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton";
import type { Material } from "@/types/study";

export default function ReviewMaterialPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [material, setMaterial] = useState<Material | null>(null);
  const [note, setNote] = useState("");
  const [decision, setDecision] = useState<"APPROVE" | "REJECT" | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const data = await apiGet(`/study/materials/${id}`);
        setMaterial(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const handleReview = async () => {
    if (!decision) return;
    try {
      await apiPost(`/study/materials/${id}/review`, { decision, note });
      router.push("/admin/materials/review");
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return <LoadingSkeleton count={1} height="h-64" radius="rounded-2xl" />;
  if (!material) return <div className="text-center py-12">Material not found.</div>;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Review Material</h1>
      <div className="bg-card rounded-2xl border border-border p-6">
        <h2 className="text-xl font-semibold">{material.title}</h2>
        <p className="text-muted-foreground">{material.courseCode} – {material.courseTitle}</p>
        <p className="mt-2">{material.description}</p>
      </div>

      <div className="bg-card rounded-2xl border border-border p-6 space-y-4">
        <Textarea
          placeholder="Add review note..."
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={4}
        />
        <div className="flex gap-3">
          <Button
            variant="default"
            onClick={() => { setDecision("APPROVE"); handleReview(); }}
            className="bg-success hover:bg-success/80"
          >
            Approve
          </Button>
          <Button
            variant="destructive"
            onClick={() => { setDecision("REJECT"); handleReview(); }}
          >
            Reject
          </Button>
          <Button variant="outline" onClick={() => router.back()}>Cancel</Button>
        </div>
      </div>
    </div>
  );
}