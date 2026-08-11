"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { listListings, toggleSaveListing } from "@/lib/marketplace.api";
import type { Listing } from "@/types/marketplace";

export default function ListingsPage() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 10;

  useEffect(() => {
    listListings({ page, limit }).then((res) => {
      setListings(res.data);
      setTotal(res.total);
    });
  }, [page]);

  return (
    <div>
      <div className="flex justify-between mb-4">
        <h1 className="text-2xl font-bold">Marketplace</h1>
        <Link href="/dashboard/marketplace/listings/new" className="bg-blue-600 text-white px-4 py-2 rounded">
          New Listing
        </Link>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {listings.map((item) => (
          <div key={item.id} className="bg-white shadow rounded p-4">
            <Link href={`/dashboard/marketplace/listings/${item.id}`} className="font-medium text-blue-600 hover:underline">
              {item.title}
            </Link>
            <p className="text-gray-600">₦{item.price}</p>
            <p className="text-sm text-gray-400">{item.status}</p>
            <button
              onClick={() => toggleSaveListing(item.id)}
              className="mt-2 text-sm text-blue-500 hover:underline"
            >
              {item.saved ? "Unsave" : "Save"}
            </button>
          </div>
        ))}
      </div>
      {total > limit && (
        <div className="flex justify-between mt-4">
          <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="btn">
            Prev
          </button>
          <span>Page {page}</span>
          <button disabled={page * limit >= total} onClick={() => setPage((p) => p + 1)} className="btn">
            Next
          </button>
        </div>
      )}
    </div>
  );
}