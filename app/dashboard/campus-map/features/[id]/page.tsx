// app/dashboard/campus-map/features/[id]/page.tsx
"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { getFeature, getFeatureEntrances } from "@/lib/api/campus-map.api";
import type { MapFeature } from "@/types/campus-map";

export default function FeatureDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [feature, setFeature] = useState<MapFeature | null>(null);
  const [entrances, setEntrances] = useState<MapFeature[]>([]);

  useEffect(() => {
    getFeature(id).then(setFeature);
    getFeatureEntrances(id).then(setEntrances);
  }, [id]);

  if (!feature) return <p>Loading feature...</p>;

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold">{feature.properties.name}</h1>
      <p className="text-gray-600">{feature.properties.category}</p>
      <div className="mt-4 space-y-2">
        <p><strong>Description:</strong> {feature.properties.description || "N/A"}</p>
        <p><strong>Building:</strong> {feature.properties.building || "N/A"}</p>
        <p><strong>Floor:</strong> {feature.properties.floor || "N/A"}</p>
      </div>

      <h2 className="text-xl font-semibold mt-6 mb-2">Entrances</h2>
      {entrances.length === 0 ? (
        <p className="text-gray-500">No entrance information available.</p>
      ) : (
        <ul className="list-disc pl-5 space-y-1">
          {entrances.map((e) => (
            <li key={e.id}>
              {e.properties.name || "Unnamed entrance"} ({e.properties.entranceId})
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}