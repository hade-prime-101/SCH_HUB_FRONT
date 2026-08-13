// app/dashboard/study/materials/[id]/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { studyApi } from "@/lib/api";
import type { Material } from "@/types/study";

export default function MaterialDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [material, setMaterial] = useState<Material | null>(null);
  const [rating, setRating] = useState(0);

  useEffect(() => {
    studyApi.getMaterial(id).then(setMaterial);
  }, [id]);

  const handleDownload = async () => {
    const { url } = await studyApi.getDownloadUrl(id);
    window.open(url, "_blank");
  };

  const handleRate = async () => {
    await studyApi.rateMaterial(id, rating);
    // refresh data
  };

  const handleBookmark = async () => {
    await studyApi.toggleBookmark(id);
  };

  if (!material) return <p>Loading...</p>;

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-2">{material.title}</h1>
      <p className="text-muted-foreground">{material.courseCode} – {material.courseTitle}</p>
      <p className="my-4">{material.description}</p>
      <div className="flex gap-4">
        <button onClick={handleDownload} className="bg-success text-primary-foreground px-4 py-2 rounded">
          Download
        </button>
        <button onClick={handleBookmark} className="bg-yellow-500 text-primary-foreground px-4 py-2 rounded">
          Bookmark
        </button>
      </div>
      <div className="mt-6">
        <label>Rate: </label>
        <select value={rating} onChange={e => setRating(Number(e.target.value))} className="border p-1">
          {[1,2,3,4,5].map(n => <option key={n} value={n}>{n}</option>)}
        </select>
        <button onClick={handleRate} className="ml-2 bg-primary text-primary-foreground px-3 py-1 rounded">Submit</button>
      </div>
    </div>
  );
}