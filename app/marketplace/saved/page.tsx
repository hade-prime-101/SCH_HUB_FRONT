"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { getSavedListings } from "@/lib/api/marketplace.api";
import type { Listing } from "@/types/marketplace";

export default function SavedListingsPage() {
  const [saved, setSaved] = useState<Listing[]>([]);

  useEffect(() => {
    getSavedListings().then(setSaved);
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Saved Listings</h1>
      {saved.length === 0 && <p className="text-muted-foreground">No saved items.</p>}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {saved.map((item) => (
          <div key={item.id} className="bg-card shadow rounded p-4">
            <Link href={`/marketplace/listings/${item.id}`} className="font-medium text-primary">
              {item.title}
            </Link>
            <p>₦{item.price}</p>
          </div>
        ))}
      </div>
    </div>
  );
}