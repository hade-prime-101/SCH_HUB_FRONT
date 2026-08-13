"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { listAccommodation } from "@/lib/api/marketplace.api";
import type { Accommodation } from "@/types/marketplace";

export default function AccommodationPage() {
  const [items, setItems] = useState<Accommodation[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 10;

  useEffect(() => {
    listAccommodation({ page, limit }).then((res) => {
      setItems(res.data);
      setTotal(res.total);
    });
  }, [page]);

  return (
    <div>
      <div className="flex justify-between mb-4">
        <h1 className="text-2xl font-bold">Accommodation</h1>
        <Link href="/dashboard/marketplace/accommodation/new" className="bg-primary text-primary-foreground px-4 py-2 rounded">
          List Property (Agent)
        </Link>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {items.map((item) => (
          <div key={item.id} className="bg-white shadow rounded p-4">
            <Link href={`/dashboard/marketplace/accommodation/${item.id}`} className="font-medium text-primary">
              {item.title}
            </Link>
            <p className="text-sm text-muted-foreground">{item.type} · {item.location}</p>
            <p className="text-sm">₦{item.price}</p>
          </div>
        ))}
      </div>
      {total > limit && (
        <div className="flex justify-between mt-4">
          <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="btn">Prev</button>
          <span>Page {page}</span>
          <button disabled={page * limit >= total} onClick={() => setPage((p) => p + 1)} className="btn">Next</button>
        </div>
      )}
    </div>
  );
}