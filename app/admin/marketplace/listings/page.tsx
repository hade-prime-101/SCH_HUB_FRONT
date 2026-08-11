"use client";
import { useEffect, useState } from "react";
import { listPendingListings, moderateListing } from "@/lib/api/marketplace.api";
import type { Listing } from "@/types/marketplace";

export default function PendingListingsPage() {
  const [listings, setListings] = useState<Listing[]>([]);

  useEffect(() => { listPendingListings().then(setListings); }, []);

  const handleModerate = async (id: string, decision: 'APPROVE' | 'REJECT') => {
    await moderateListing(id, { decision });
    setListings(prev => prev.filter(l => l.id !== id));
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Pending Listings</h1>
      {listings.map(item => (
        <div key={item.id} className="bg-white shadow rounded p-4 mb-3 flex justify-between items-center">
          <div>
            <p className="font-medium">{item.title}</p>
            <p className="text-sm text-gray-500">₦{item.price}</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => handleModerate(item.id, 'APPROVE')} className="bg-green-600 text-white px-3 py-1 rounded text-sm">Approve</button>
            <button onClick={() => handleModerate(item.id, 'REJECT')} className="bg-red-600 text-white px-3 py-1 rounded text-sm">Reject</button>
          </div>
        </div>
      ))}
    </div>
  );
}