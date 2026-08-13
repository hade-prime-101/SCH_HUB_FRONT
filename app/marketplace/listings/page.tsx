"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { MarketplacePageHeader } from "@/components/marketplace/MarketplacePageHeader";
import { ListingCard } from "@/components/marketplace/ListingCard";
import { MarketplaceEmptyState } from "@/components/marketplace/MarketplaceEmptyState";
import { Pagination } from "@/components/ui/Pagination";
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton";
import { listListings, toggleSaveListing } from "@/lib/api/marketplace.api";
import type { Listing } from "@/types/marketplace";
import { Package, Plus } from "lucide-react";

export default function ListingsPage() {
  const router = useRouter();
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const limit = 10;

  const fetchListings = async () => {
    setLoading(true);
    try {
      const res = await listListings({ page, limit });
      setListings(res.data);
      setTotal(res.total);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchListings();
  }, [page]);

  const handleSave = async (id: string) => {
    await toggleSaveListing(id);
    setListings((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, saved: !item.saved } : item
      )
    );
  };

  return (
    <div>
      <MarketplacePageHeader
        title="Listings"
        description="Buy and sell items within your campus"
        createLabel="New Listing"
        onCreate={() => router.push("/marketplace/listings/new")}
        showSearch
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search listings..."
      />

      {loading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <LoadingSkeleton key={i} height="h-64" />
          ))}
        </div>
      ) : listings.length === 0 ? (
        <MarketplaceEmptyState
          icon={<Package className="h-8 w-8" />}
          title="No listings found"
          description="Be the first to post an item for sale or try adjusting your search."
          actionLabel="Sell Something"
          onAction={() => router.push("/marketplace/listings/new")}
        />
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {listings.map((listing) => (
              <ListingCard key={listing.id} listing={listing} onSave={handleSave} />
            ))}
          </div>
          <Pagination
            currentPage={page}
            totalPages={Math.ceil(total / limit)}
            onPageChange={setPage}
            loading={loading}
          />
        </>
      )}
    </div>
  );
}