"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { MarketplacePageHeader } from "@/components/marketplace/MarketplacePageHeader";
import { MarketplaceEmptyState } from "@/components/marketplace/MarketplaceEmptyState";
import { Pagination } from "@/components/ui/Pagination";
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton";
import { listRoommates, deleteRoommateRequest } from "@/lib/api/marketplace.api";
import type { RoommateRequest } from "@/types/marketplace";
import { Users, Trash2 } from "lucide-react";
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function RoommatesPage() {
  const router = useRouter();
  const [requests, setRequests] = useState<RoommateRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 10;

  useEffect(() => {
    setLoading(true);
    listRoommates(page, limit)
      .then((res) => {
        setRequests(res.data);
        setTotal(res.total);
      })
      .finally(() => setLoading(false));
  }, [page]);

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this request?")) return;
    await deleteRoommateRequest(id);
    setRequests((prev) => prev.filter((r) => r.id !== id));
  };

  return (
    <div>
      <MarketplacePageHeader
        title="Roommates"
        description="Find a roommate or offer a shared room"
        createLabel="New Request"
        onCreate={() => router.push("/marketplace/roommates/new")}
      />
      {loading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => <LoadingSkeleton key={i} height="h-24" />)}
        </div>
      ) : requests.length === 0 ? (
        <MarketplaceEmptyState
          icon={<Users className="h-8 w-8" />}
          title="No roommate requests yet"
          description="Be the first to post a roommate request."
          actionLabel="New Request"
          onAction={() => router.push("/marketplace/roommates/new")}
        />
      ) : (
        <>
          <div className="space-y-3">
            {requests.map((req) => (
              <Card key={req.id} className="p-4 flex items-start justify-between gap-4">
                <div>
                  <h3 className="font-semibold text-foreground">{req.title}</h3>
                  <p className="text-sm text-muted-foreground">{req.description}</p>
                  <div className="flex flex-wrap gap-3 mt-1 text-sm">
                    <span className="font-medium text-primary">₦{req.budget.toLocaleString()}</span>
                    <Badge variant="outline">{req.gender || "Any"}</Badge>
                  </div>
                </div>
                <button
                  onClick={() => handleDelete(req.id)}
                  className="text-destructive hover:text-destructive/80 p-1"
                  aria-label="Delete"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </Card>
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