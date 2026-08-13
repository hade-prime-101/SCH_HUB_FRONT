"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { listShops } from "@/lib/api/marketplace.api";
import type { Shop } from "@/types/marketplace";

export default function ShopsPage() {
  const [shops, setShops] = useState<Shop[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 10;

  useEffect(() => {
    listShops(page, limit).then((res) => {
      setShops(res.data);
      setTotal(res.total);
    });
  }, [page]);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Shops</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {shops.map((shop) => (
          <div key={shop.id} className="bg-card shadow rounded p-4">
            <Link href={`/marketplace/shops/${shop.id}`} className="font-medium text-primary">
              {shop.name}
            </Link>
            <p className="text-sm text-muted-foreground">{shop.description}</p>
            <div className="text-xs mt-1">⭐ {shop.rating?.toFixed(1)} · {shop.followerCount} followers</div>
          </div>
        ))}
      </div>
      <div className="flex justify-between mt-4">
        <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="btn">
          Prev
        </button>
        <span>Page {page}</span>
        <button disabled={page * limit >= total} onClick={() => setPage((p) => p + 1)} className="btn">
          Next
        </button>
      </div>
    </div>
  );
}