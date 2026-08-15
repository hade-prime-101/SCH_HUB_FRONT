"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { MarketplacePageHeader } from "@/components/marketplace/MarketplacePageHeader";
import { ServiceCard } from "@/components/marketplace/ServiceCard";
import { MarketplaceEmptyState } from "@/components/marketplace/MarketplaceEmptyState";
import { Pagination } from "@/components/ui/Pagination";
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton";
import { listServices } from "@/lib/api/marketplace.api";
import type { Service } from "@/types/marketplace";
import { Wrench } from "lucide-react";

export default function ServicesPage() {
  const router = useRouter();
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const limit = 10;

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    listServices({ page, limit })
      .then((res) => {
        setServices(res.data);
        setTotal(res.total);
      })
      .finally(() => setLoading(false));
  }, [page]);

  const filtered = services.filter((s) =>
    s.title.toLowerCase().includes(search.toLowerCase()) ||
    s.category.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <MarketplacePageHeader
        title="Services"
        description="Offer or hire services within your campus"
        createLabel="Offer Service"
        onCreate={() => router.push("/marketplace/services/new")}
        showSearch
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search services..."
      />
      {loading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => <LoadingSkeleton key={i} height="h-40" />)}
        </div>
      ) : filtered.length === 0 ? (
        <MarketplaceEmptyState
          icon={<Wrench className="h-8 w-8" />}
          title="No services found"
          description="Be the first to offer a service or try adjusting your search."
          actionLabel="Offer a Service"
          onAction={() => router.push("/marketplace/services/new")}
        />
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((service) => (
              <ServiceCard key={service.id} service={service} />
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