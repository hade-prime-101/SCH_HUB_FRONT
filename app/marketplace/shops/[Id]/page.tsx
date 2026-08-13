"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { getShop, followShop, rateSeller } from "@/lib/api/marketplace.api";
import type { Shop } from "@/types/marketplace";

export default function ShopDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [shop, setShop] = useState<Shop | null>(null);
  const [rating, setRating] = useState(0);

  useEffect(() => {
    getShop(id).then(setShop);
  }, [id]);

  const handleFollow = async () => {
    await followShop(id);
    getShop(id).then(setShop); // refresh
  };

  const handleRate = async () => {
    await rateSeller(id, { rating });
    getShop(id).then(setShop);
  };

  if (!shop) return <p>Loading...</p>;

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold">{shop.name}</h1>
      <p>{shop.description}</p>
      <p className="text-sm text-muted-foreground mt-2">⭐ {shop.rating?.toFixed(1)} · {shop.followerCount} followers</p>
      <div className="flex gap-3 mt-4">
        <button onClick={handleFollow} className="bg-primary text-primary-foreground px-4 py-2 rounded">
          Follow
        </button>
        <div className="flex items-center gap-2">
          <select value={rating} onChange={(e) => setRating(Number(e.target.value))} className="border p-1">
            <option value={0}>Rate</option>
            {[1, 2, 3, 4, 5].map((n) => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>
          <button onClick={handleRate} className="bg-success text-primary-foreground px-3 py-1 rounded">
            Submit
          </button>
        </div>
      </div>
    </div>
  );
}