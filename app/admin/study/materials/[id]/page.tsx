// app/dashboard/admin/study/materials/[id]/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getMaterial, reviewMaterial } from "@/lib/api/study.api";
import type { Material } from "@/types/study";

export default function AdminMaterialReviewPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [material, setMaterial] = useState<Material | null>(null);
  const [note, setNote] = useState("");

  useEffect(() => {
    getMaterial(id).then(setMaterial);
  }, [id]);

  const handleDecision = async (decision: "APPROVE" | "REJECT") => {
    await reviewMaterial(id, { decision, note });
    router.push("/dashboard/admin/study/materials");
  };

  if (!material) return <p>Loading material...</p>;

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Review Material</h1>
      <div className="bg-white shadow rounded p-6 mb-6">
        <h2 className="text-xl font-semibold mb-2">{material.title}</h2>
        <p className="text-gray-600">
          {material.courseCode} - {material.courseTitle}
        </p>
        <p className="mt-2">{material.description}</p>
        <p className="text-sm text-gray-400 mt-2">Visibility: {material.visibility}</p>
        <p className="text-sm text-gray-400">
          Uploaded by {material.userId} on {new Date(material.createdAt).toLocaleDateString()}
        </p>
      </div>

      <div className="bg-white shadow rounded p-6 space-y-4">
        <textarea
          placeholder="Review note (optional)"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          className="border p-2 w-full"
          rows={3}
        />
        <div className="flex gap-3">
          <button
            onClick={() => handleDecision("APPROVE")}
            className="bg-green-600 text-white px-6 py-2 rounded"
          >
            Approve
          </button>
          <button
            onClick={() => handleDecision("REJECT")}
            className="bg-red-600 text-white px-6 py-2 rounded"
          >
            Reject
          </button>
        </div>
      </div>
    </div>
  );
}