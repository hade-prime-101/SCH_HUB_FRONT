// app/study/materials/[id]/page.tsx
// app/study/materials/[id]/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { apiGet, apiPost } from "@/lib/api";
import { useAuth } from "@/lib/providers/AuthProvider";
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { Download, Bookmark, Star, ArrowLeft, Calendar, User, Globe, Lock, Edit } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton";
import type { Material } from "@/types/study";

export default function MaterialDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const [material, setMaterial] = useState<Material | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rating, setRating] = useState(0);
  const [submittingRating, setSubmittingRating] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const data = await apiGet(`/study/materials/${id}`);
        setMaterial(data);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const handleDownload = async () => {
    try {
      const { url } = await apiPost(`/study/materials/${id}/download`, {});
      window.open(url, "_blank");
    } catch (err) {
      console.error("Download failed", err);
    }
  };

  const handleBookmark = async () => {
    try {
      await apiPost(`/study/materials/${id}/bookmark`, {});
      setMaterial(prev => prev ? { ...prev, isBookmarked: !prev.isBookmarked } : null);
    } catch (err) {
      console.error("Bookmark failed", err);
    }
  };

  const handleRate = async () => {
    if (!rating) return;
    try {
      setSubmittingRating(true);
      await apiPost(`/study/materials/${id}/rate`, { rating });
      // Refresh material
      const updated = await apiGet(`/study/materials/${id}`);
      setMaterial(updated);
      setRating(0);
    } catch (err) {
      console.error("Rating failed", err);
    } finally {
      setSubmittingRating(false);
    }
  };

  if (loading) return <LoadingSkeleton count={2} height="h-64" radius="rounded-2xl" />;
  if (error) {
    return (
      <div className="bg-destructive/5 border border-destructive/20 rounded-xl p-6 text-destructive">
        <p>Failed to load material: {error}</p>
      </div>
    );
  }
  if (!material) return <div className="text-center py-12">Material not found.</div>;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Back button */}
      <Button variant="ghost" size="sm" onClick={() => router.back()} className="gap-2">
        <ArrowLeft className="w-4 h-4" />
        Back
      </Button>

      {/* Card */}
      <div className="bg-card rounded-2xl border border-border p-6 shadow-sm space-y-5">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">{material.title}</h1>
            <div className="flex flex-wrap items-center gap-2 mt-1">
              {material.courseCode && (
                <Badge variant="outline" className="text-sm">{material.courseCode}</Badge>
              )}
              {material.courseTitle && (
                <span className="text-sm text-muted-foreground">{material.courseTitle}</span>
              )}
              <Badge variant="subtle" className="flex items-center gap-1">
                {material.visibility === "PUBLIC" ? <Globe className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
                {material.visibility}
              </Badge>
            </div>
          </div>
          <div className="flex gap-2">
            {user?.id === material.uploader?.id && (
              <Button
                variant="outline"
                size="icon"
                onClick={() => router.push(`/study/materials/${id}/edit`)}
                title="Edit material"
              >
                <Edit className="w-4 h-4" />
              </Button>
            )}
            <Button
              variant="outline"
              size="icon"
              onClick={handleBookmark}
              className={material.isBookmarked ? "text-primary border-primary" : ""}
            >
              <Bookmark className="w-4 h-4" fill={material.isBookmarked ? "currentColor" : "none"} />
            </Button>
            <Button onClick={handleDownload}>
              <Download className="w-4 h-4 mr-2" />
              Download
            </Button>
          </div>
        </div>

        {material.description && (
          <div>
            <h3 className="text-sm font-medium text-muted-foreground">Description</h3>
            <p className="text-foreground mt-1">{material.description}</p>
          </div>
        )}

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-border text-sm">
          <div>
            <p className="text-muted-foreground">Uploaded</p>
            <p className="font-medium">{new Date(material.createdAt).toLocaleDateString()}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Downloads</p>
            <p className="font-medium">{material.downloads ?? 0}</p>
          </div>
          {material.averageRating !== undefined && (
            <div>
              <p className="text-muted-foreground">Rating</p>
              <p className="font-medium flex items-center gap-1">
                <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                {material.averageRating.toFixed(1)}
              </p>
            </div>
          )}
          {material.uploader && (
            <div>
              <p className="text-muted-foreground">Uploader</p>
              <p className="font-medium">{material.uploader.fullName}</p>
            </div>
          )}
        </div>

        {/* Rate section */}
        <div className="pt-4 border-t border-border">
          <h3 className="text-sm font-medium text-muted-foreground mb-2">Rate this material</h3>
          <div className="flex items-center gap-3">
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => setRating(star)}
                  className="text-2xl leading-none focus:outline-none"
                >
                  <span className={star <= rating ? "text-yellow-400" : "text-muted"}>★</span>
                </button>
              ))}
            </div>
            <Button size="sm" onClick={handleRate} disabled={!rating || submittingRating}>
              {submittingRating ? "Submitting..." : "Submit"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}