// app/dashboard/study/materials/[id]/review/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { apiGet, apiPost } from "@/lib/api";
import type { Material, MaterialReviewPayload } from "@/types/study";

export default function ReviewMaterialPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [material, setMaterial] = useState<Material | null>(null);
  const [note, setNote] = useState("");
  const [decision, setDecision] = useState<"APPROVE" | "REJECT" | null>(null);

  useEffect(() => {
    apiGet(`/study/materials/${id}`).then(setMaterial);
  }, [id]);

  const handleReview = async () => {
    if (!decision) return;
    await apiPost(`/study/materials/${id}/review`, { decision, note });
    router.push("/dashboard/study/admin/materials");
  };

  if (!material) return <p>Loading...</p>;

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-2">Review Material</h1>
      <div className="bg-card shadow rounded p-6 mb-4">
        <h2 className="text-xl font-semibold">{material.title}</h2>
        <p className="text-muted-foreground">{material.courseCode} – {material.courseTitle}</p>
        <p className="mt-2">{material.description}</p>
      </div>

      <div className="bg-card shadow rounded p-6 space-y-4">
        <textarea
          placeholder="Review note"
          value={note}
          onChange={e => setNote(e.target.value)}
          className="border p-2 w-full"
        />
        <div className="flex space-x-4">
          <button
            onClick={() => { setDecision("APPROVE"); handleReview(); }}
            className="bg-success text-primary-foreground px-6 py-2 rounded"
          >
            Approve
          </button>
          <button
            onClick={() => { setDecision("REJECT"); handleReview(); }}
            className="bg-destructive text-primary-foreground px-6 py-2 rounded"
          >
            Reject
          </button>
        </div>
      </div>
    </div>
  );
}