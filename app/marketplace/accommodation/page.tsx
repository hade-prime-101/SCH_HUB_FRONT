"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { MarketplacePageHeader } from "@/components/marketplace/MarketplacePageHeader";
import { AccommodationCard } from "@/components/marketplace/AccommodationCard";
import { MarketplaceEmptyState } from "@/components/marketplace/MarketplaceEmptyState";
import { Pagination } from "@/components/ui/Pagination";
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton";
import { listAccommodation } from "@/lib/api/marketplace.api";
import type { Accommodation } from "@/types/marketplace";
import { Home } from "lucide-react";

export default function AccommodationPage() {
  const router = useRouter();
  const [items, setItems] = useState<Accommodation[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const limit = 10;

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    listAccommodation({ page, limit })
      .then((res) => {
        setItems(res.data);
        setTotal(res.total);
      })
      .finally(() => setLoading(false));
  }, [page]);

  const filtered = items.filter((a) =>
    a.title.toLowerCase().includes(search.toLowerCase()) ||
    a.location.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <MarketplacePageHeader
        title="Accommodation"
        description="Find hostels, apartments, and rooms"
        createLabel="List Property"
        onCreate={() => router.push("/marketplace/accommodation/new")}
        showSearch
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search by title or location..."
      />
      {loading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => <LoadingSkeleton key={i} height="h-64" />)}
        </div>
      ) : filtered.length === 0 ? (
        <MarketplaceEmptyState
          icon={<Home className="h-8 w-8" />}
          title="No accommodations listed"
          description="List your property or try a different search."
          actionLabel="List Property"
          onAction={() => router.push("/marketplace/accommodation/new")}
        />
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((item) => (
              <AccommodationCard key={item.id} accommodation={item} />
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