// app/dashboard/study/summaries/request/page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { apiPost } from "@/lib/api";
import type { SummarizeRequest } from "@/types/study";

export default function RequestSummaryPage() {
  const router = useRouter();
  const [materialId, setMaterialId] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!materialId) return setError("Material ID is required");
    try {
      const res = await apiPost("/ai/summarize", { materialId });
      if (res.status === "PENDING" || res.status === "PROCESSING") {
        alert("Summary request submitted. It may take a moment to generate.");
      }
      router.push("/dashboard/study/summaries");
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="max-w-md mx-auto">
      <h1 className="text-2xl font-bold mb-4">Request AI Summary</h1>
      <form onSubmit={handleSubmit} className="bg-white shadow rounded p-6 space-y-4">
        {error && <div className="bg-red-100 text-red-700 p-3 rounded">{error}</div>}
        <div>
          <label className="block mb-1">Material ID</label>
          <input
            type="text"
            value={materialId}
            onChange={(e) => setMaterialId(e.target.value)}
            className="border p-2 w-full"
            required
            placeholder="Paste material ID"
          />
        </div>
        <button type="submit" className="bg-green-600 text-white px-6 py-2 rounded">
          Request Summary
        </button>
      </form>
    </div>
  );
}