"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Loader2, Trash2, Eye } from "lucide-react";
import { listPendingReviewMaterials, adminDeleteMaterial } from "@/lib/api/study.api";
import type { Material } from "@/types/study";

export default function AdminMaterialsPage() {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadMaterials = async () => {
      try {
        const data = await listPendingReviewMaterials(1, 100);
        setMaterials(data.data || []);
      } catch (error) {
        console.error("Failed to load materials:", error);
      } finally {
        setLoading(false);
      }
    };
    loadMaterials();
  }, []);

  const handleDelete = async (materialId: string) => {
    if (!confirm("Are you sure you want to delete this material?")) return;
    try {
      await adminDeleteMaterial(materialId);
      setMaterials(materials.filter((m) => m.id !== materialId));
    } catch (error) {
      console.error("Failed to delete material:", error);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-foreground">Materials Review Queue</h2>
        <span className="text-sm text-muted-foreground">{materials.length} materials</span>
      </div>

      {materials.length === 0 ? (
        <div className="bg-card rounded-2xl p-12 text-center">
          <p className="text-muted-foreground">No pending materials</p>
        </div>
      ) : (
        <div className="space-y-4">
          {materials.map((material) => (
            <div
              key={material.id}
              className="bg-card rounded-2xl p-6 border-l-4 border-l-amber-500"
            >
              <div className="flex justify-between items-start gap-4 mb-4">
                <div className="flex-1">
                  <h3 className="font-bold text-lg text-foreground mb-2">
                    {material.title}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Uploaded by {material.userId} • {new Date(material.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>

              {material.description && (
                <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                  {material.description}
                </p>
              )}

              <div className="flex gap-2">
                <Link
                  href={`/admin/study/materials/${material.id}`}
                  className="flex-1 px-4 py-2 bg-accent text-primary rounded-lg hover:bg-blue-200 transition-colors font-medium flex items-center justify-center gap-2"
                >
                  <Eye className="w-4 h-4" />
                  Review
                </Link>
                <button
                  onClick={() => handleDelete(material.id)}
                  className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
