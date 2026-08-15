// app/study/materials/page.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { apiGet } from "@/lib/api";
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { Search, Filter, Download, Eye, BookOpen, Globe, Lock, Plus, ChevronLeft, ChevronRight } from "lucide-react";
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { Badge } from "@/components/ui/badge";
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { cn } from "@/lib/utils";
import type { Material } from "@/types/study";

export default function MaterialsListPage() {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const router = useRouter();
  const [materials, setMaterials] = useState<Material[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [courseFilter, setCourseFilter] = useState("");
  const limit = 12;

  const fetchMaterials = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("limit", String(limit));
      if (search) params.set("search", search);
      if (courseFilter) params.set("course", courseFilter);
      const data = await apiGet(`/study/materials?${params.toString()}`);
      setMaterials(data.data || data || []);
      setTotal(data.total || 0);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [page, search, courseFilter]);

  useEffect(() => {
    fetchMaterials();
  }, [fetchMaterials]);

  const totalPages = Math.ceil(total / limit);

  const visibilityIcon = (visibility: string) => {
    if (visibility === "PUBLIC") return <Globe className="w-4 h-4 text-success" />;
    return <Lock className="w-4 h-4 text-muted-foreground" />;
  };

  if (loading && page === 1) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Study Materials</h1>
          <Link href="/study/materials/upload">
            <Button>Upload New</Button>
          </Link>
        </div>
        <LoadingSkeleton count={6} height="h-40" radius="rounded-2xl" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-destructive/5 border border-destructive/20 rounded-xl p-6 text-destructive">
        <p>Failed to load materials: {error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Study Materials</h1>
          <p className="text-muted-foreground text-sm">
            {total > 0 ? `Showing ${(page - 1) * limit + 1}–${Math.min(page * limit, total)} of ${total} materials` : "No materials yet"}
          </p>
        </div>
        <Link href="/study/materials/upload">
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Upload New
          </Button>
        </Link>
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search materials..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Input
          type="text"
          placeholder="Filter by course code"
          value={courseFilter}
          onChange={(e) => setCourseFilter(e.target.value)}
          className="sm:w-48"
        />
      </div>

      {/* Materials Grid */}
      {materials.length === 0 ? (
        <div className="bg-card rounded-2xl border border-dashed p-12 text-center">
          <BookOpen className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-foreground">No materials found</h3>
          <p className="text-muted-foreground">Try adjusting your search or upload a new material.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {materials.map((mat) => (
            <Link
              key={mat.id}
              href={`/study/materials/${mat.id}`}
              className="block bg-card rounded-2xl border border-border hover:shadow-md transition-all hover:border-primary/50 group"
            >
              <div className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="p-2 rounded-lg bg-primary/10 text-primary group-hover:bg-primary/20 transition">
                    <BookOpen className="w-5 h-5" />
                  </div>
                  <div className="flex items-center gap-1 text-xs">
                    {visibilityIcon(mat.visibility)}
                    <span className="text-muted-foreground">{mat.visibility}</span>
                  </div>
                </div>
                <h3 className="font-semibold text-foreground line-clamp-2 group-hover:text-primary transition">
                  {mat.title}
                </h3>
                {mat.courseCode && (
                  <p className="text-sm text-muted-foreground mt-1">{mat.courseCode}</p>
                )}
                {mat.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2 mt-2">{mat.description}</p>
                )}
                <div className="flex items-center gap-3 mt-4 pt-3 border-t border-border text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Download className="w-3.5 h-3.5" />
                    {mat.downloads || 0}
                  </span>
                  <span className="flex items-center gap-1">
                    <Eye className="w-3.5 h-3.5" />
                    View
                  </span>
                  {mat.averageRating && (
                    <span className="flex items-center gap-1">
                      <span>⭐</span>
                      {mat.averageRating.toFixed(1)}
                    </span>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-between items-center pt-4 border-t border-border">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            Previous
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {page} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
          >
            Next
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
      )}
    </div>
  );
}