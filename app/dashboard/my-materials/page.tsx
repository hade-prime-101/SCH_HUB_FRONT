"use client";
import { useEffect, useState } from "react";
import { getMyMaterials } from "@/lib/api/users.api";
import type { UserMaterial } from "@/types/users";

export default function MyMaterialsPage() {
  const [materials, setMaterials] = useState<UserMaterial[]>([]);
  useEffect(() => { getMyMaterials().then(setMaterials); }, []);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">My Materials</h1>
      <div className="space-y-2">
        {materials.map(m => (
          <div key={m.id} className="bg-white shadow rounded p-3">
            {m.title} {m.courseCode && `(${m.courseCode})`}
          </div>
        ))}
      </div>
    </div>
  );
}