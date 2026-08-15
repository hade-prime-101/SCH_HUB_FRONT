"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { MarketplacePageHeader } from "@/components/marketplace/MarketplacePageHeader";
import { ShopCard } from "@/components/marketplace/ShopCard";
import { MarketplaceEmptyState } from "@/components/marketplace/MarketplaceEmptyState";
import { Pagination } from "@/components/ui/Pagination";
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton";
import { listShops } from "@/lib/api/marketplace.api";
import type { Shop } from "@/types/marketplace";
import { Store } from "lucide-react";

export default function ShopsPage() {
  const router = useRouter();
  const [shops, setShops] = useState<Shop[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 10;

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    listShops(page, limit)
      .then((res) => {
        setShops(res.data);
        setTotal(res.total);
      })
      .finally(() => setLoading(false));
  }, [page]);

  return (
    <div>
      <MarketplacePageHeader
        title="Shops"
        description="Discover student-run shops on campus"
        createLabel="My Shop"
        onCreate={() => router.push("/marketplace/shops/my")}
      />
      {loading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {[...Array(4)].map((_, i) => <LoadingSkeleton key={i} height="h-24" />)}
        </div>
      ) : shops.length === 0 ? (
        <MarketplaceEmptyState
          icon={<Store className="h-8 w-8" />}
          title="No shops yet"
          description="Be the first to create a shop."
          actionLabel="Create Shop"
          onAction={() => router.push("/marketplace/shops/my")}
        />
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {shops.map((shop) => (
              <ShopCard key={shop.id} shop={shop} />
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