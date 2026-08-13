"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getShop, followShop, rateSeller } from "@/lib/api/marketplace.api";
import type { Shop } from "@/types/marketplace";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton";
import { ArrowLeft, Star, Users } from "lucide-react";

export default function ShopDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [shop, setShop] = useState<Shop | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rating, setRating] = useState(0);
  const [ratingSubmitting, setRatingSubmitting] = useState(false);

  useEffect(() => {
    getShop(id)
      .then(setShop)
      .catch(() => setError("Shop not found"))
      .finally(() => setLoading(false));
  }, [id]);

  const handleFollow = async () => {
    if (!shop) return;
    await followShop(id);
    setShop({ ...shop, followerCount: shop.followerCount + 1 });
  };

  const handleRate = async () => {
    if (!shop || rating === 0) return;
    setRatingSubmitting(true);
    try {
      const { averageRating } = await rateSeller(id, { rating });
      setShop({ ...shop, rating: averageRating });
    } finally {
      setRatingSubmitting(false);
    }
  };

  if (loading) return <LoadingSkeleton height="h-64" />;
  if (error || !shop) {
    return (
      <div className="text-center py-20">
        <p className="text-destructive">{error || "Shop not found"}</p>
        <Button asChild className="mt-4"><Link href="/marketplace/shops">Back to shops</Link></Button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <Button variant="ghost" size="sm" onClick={() => router.back()} className="gap-1">
        <ArrowLeft className="h-4 w-4" /> Back
      </Button>
      <Card className="p-6 space-y-4">
        <div className="flex items-start gap-4">
          <div className="h-20 w-20 rounded-2xl bg-muted overflow-hidden shrink-0">
            {shop.logo ? (
              <img src={shop.logo} alt={shop.name} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full items-center justify-center text-muted-foreground">Logo</div>
            )}
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-bold">{shop.name}</h1>
            <p className="text-muted-foreground">{shop.description}</p>
            <div className="flex items-center gap-4 mt-2 text-sm">
              <span className="flex items-center gap-1">
                <Star className="h-4 w-4 fill-warning text-warning" />
                {shop.rating?.toFixed(1) || "New"}
              </span>
              <span className="flex items-center gap-1">
                <Users className="h-4 w-4" />
                {shop.followerCount}
              </span>
            </div>
          </div>
          <Button onClick={handleFollow} variant="outline" size="sm">Follow</Button>
        </div>
        <div className="flex items-center gap-3 pt-2 border-t border-border">
          <select
            value={rating}
            onChange={(e) => setRating(Number(e.target.value))}
            className="rounded-lg border border-border bg-background px-3 py-1.5 text-sm"
          >
            <option value={0}>Rate</option>
            {[1,2,3,4,5].map((n) => (
              <option key={n} value={n}>{n} ★</option>
            ))}
          </select>
          <Button onClick={handleRate} disabled={rating === 0 || ratingSubmitting} size="sm">
            {ratingSubmitting ? "Submitting..." : "Submit Rating"}
          </Button>
        </div>
      </Card>
    </div>
  );
}