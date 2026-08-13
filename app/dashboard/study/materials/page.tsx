// app/dashboard/study/materials/page.tsx
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { apiGet } from "@/lib/api";
import { Download, FileText, Eye, Globe, Lock } from "lucide-react";
import type { Material } from "@/types/study";

export default function MaterialsListPage() {
  const router = useRouter();
  const [materials, setMaterials] = useState<Material[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const limit = 12;

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await apiGet("/study/materials", { page: String(page), limit: String(limit) });
        setMaterials(data.data || data || []);
        setTotal(data.total || 0);
      } catch (err: any) {
        const message = err?.message || "Failed to load materials";
        if (message.includes("No token") || err?.status === 401) {
          setError("You must be logged in to view materials. Redirecting to login...");
          setTimeout(() => router.push("/login"), 2000);
        } else {
          setError(message);
        }
      } finally {
        setLoading(false);
      }
    })();
  }, [page, router]);

  const visibilityIcon = (visibility: string) => {
    if (visibility === "PUBLIC") return <Globe size={16} className="text-green-600" />;
    return <Lock size={16} className="text-muted-foreground" />;
  };

  if (error) {
    return (
      <div className="max-w-4xl mx-auto py-8">
        <div className="bg-destructive/5 border border-destructive/20 rounded-lg p-4">
          <p className="text-destructive font-medium">{error}</p>
        </div>
      </div>
    );
  }

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-1">Study Materials</h1>
          <p className="text-muted-foreground">Showing {materials.length > 0 ? (page - 1) * limit + 1 : 0} – {Math.min(page * limit, total)} of {total} materials</p>
        </div>
        <Link href="/dashboard/study/materials/upload" className="bg-primary hover:opacity-90 text-primary-foreground px-6 py-2 rounded-lg font-medium transition-opacity flex items-center gap-2">
          <FileText size={20} />
          Upload New
        </Link>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading materials...</p>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!loading && materials.length === 0 && (
        <div className="text-center py-12 bg-muted rounded-lg border-2 border-dashed border-gray-300">
          <FileText size={48} className="text-muted-foreground/70 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No materials yet</h3>
          <p className="text-muted-foreground mb-6">Get started by uploading your first study material</p>
          <Link href="/dashboard/study/materials/upload" className="bg-primary hover:opacity-90 text-primary-foreground px-6 py-2 rounded-lg font-medium transition-opacity inline-block">
            Upload First Material
          </Link>
        </div>
      )}

      {/* Materials Grid */}
      {!loading && materials.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {materials.map((m) => (
            <Link
              key={m.id}
              href={`/dashboard/study/materials/${m.id}`}
              className="group bg-card rounded-lg border border-gray-200 hover:border-primary hover:shadow-lg transition-all duration-200 p-5 block"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center group-hover:bg-primary/20 transition">
                  <FileText size={20} className="text-primary" />
                </div>
                <div className="flex items-center gap-1">
                  {visibilityIcon(m.visibility)}
                  <span className="text-xs text-muted-foreground font-medium">{m.visibility}</span>
                </div>
              </div>
              
              <h3 className="text-lg font-semibold text-gray-900 mb-1 line-clamp-2 group-hover:text-primary transition">
                {m.title}
              </h3>
              
              <p className="text-sm text-muted-foreground mb-4">
                {m.courseCode} • {m.courseTitle}
              </p>
              
              {m.description && (
                <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                  {m.description}
                </p>
              )}
              
              <div className="flex items-center gap-4 text-sm text-muted-foreground border-t border-gray-100 pt-3">
                <div className="flex items-center gap-1">
                  <Download size={16} />
                  <span>{m.downloads || 0}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Eye size={16} />
                  <span>View</span>
                </div>
                {m.averageRating && (
                  <div className="flex items-center gap-1">
                    <span className="text-yellow-500">⭐</span>
                    <span>{m.averageRating.toFixed(1)}</span>
                  </div>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Pagination */}
      {!loading && materials.length > 0 && totalPages > 1 && (
        <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-200">
          <button
            onClick={() => setPage(Math.max(1, page - 1))}
            disabled={page === 1}
            className="px-6 py-2 rounded-lg border border-gray-300 text-secondary-foreground hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
          >
            ← Previous
          </button>
          
          <div className="flex items-center gap-2">
            {Array.from({ length: Math.min(5, totalPages) }).map((_, i) => {
              const pageNum = i + 1;
              return (
                <button
                  key={pageNum}
                  onClick={() => setPage(pageNum)}
                  className={`w-10 h-10 rounded-lg font-medium transition-colors ${
                    page === pageNum
                      ? "bg-primary text-primary-foreground"
                      : "border border-gray-300 text-secondary-foreground hover:bg-muted"
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}
            {totalPages > 5 && <span className="text-muted-foreground">...</span>}
            <span className="text-sm text-muted-foreground px-2">Page {page} of {totalPages}</span>
          </div>
          
          <button
            onClick={() => setPage(page + 1)}
            disabled={page >= totalPages}
            className="px-6 py-2 rounded-lg border border-gray-300 text-secondary-foreground hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
}