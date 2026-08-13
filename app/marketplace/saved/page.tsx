"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { MarketplacePageHeader } from "@/components/marketplace/MarketplacePageHeader";
import { ListingCard } from "@/components/marketplace/ListingCard";
import { MarketplaceEmptyState } from "@/components/marketplace/MarketplaceEmptyState";
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton";
import { getSavedListings, toggleSaveListing } from "@/lib/api/marketplace.api";
import type { Listing } from "@/types/marketplace";
import { Heart } from "lucide-react";

export default function SavedListingsPage() {
  const router = useRouter();
  const [saved, setSaved] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getSavedListings()
      .then(setSaved)
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async (id: string) => {
    await toggleSaveListing(id);
    setSaved((prev) => prev.filter((item) => item.id !== id));
  };

  return (
    <div>
      <MarketplacePageHeader title="Saved Items" description="Your favorite listings" />
      {loading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(3)].map((_, i) => <LoadingSkeleton key={i} height="h-64" />)}
        </div>
      ) : saved.length === 0 ? (
        <MarketplaceEmptyState
          icon={<Heart className="h-8 w-8" />}
          title="No saved items yet"
          description="Start saving listings you're interested in. They'll appear here."
          actionLabel="Explore Listings"
          onAction={() => router.push("/marketplace/listings")}
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {saved.map((item) => (
            <ListingCard key={item.id} listing={{ ...item, saved: true }} onSave={handleSave} />
          ))}
        </div>
      )}
    </div>
  );
}