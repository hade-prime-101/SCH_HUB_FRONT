"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { Loader2, AlertTriangle, RefreshCw } from "lucide-react";
import { marketplaceApi } from "@/lib/api/marketplace";
import { ListingForm, type ListingFormData } from "@/app/dashboard/marketplace/listings/create/ListingForm";

export default function EditListingPage() {
  const router    = useRouter();
  const params    = useParams();
  const listingId = params.listingId as string;

  const [initialData, setInitialData] = useState<ListingFormData | null>(null);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await marketplaceApi.getListing(listingId);
      const existingImageUrl = data.images?.[0] ?? data.imageUrl ?? data.photoUrl ?? null;
      setInitialData({
        title:           data.title           ?? "",
        description:     data.description     ?? "",
        price:           data.price != null   ? String(data.price) : "",
        category:        data.category        ?? "",
        condition:       data.condition       ?? "",
        pickupLocation:  data.pickupLocation  ?? "",
        whatsappContact: data.whatsappContact ?? "",
        shopId:          data.shopId          ?? "",
        isAvailable:     data.status !== "SOLD",
        photoPreview:    existingImageUrl,
        photoUrl:        existingImageUrl,
      });
    } catch {
      setError("Couldn't load this listing. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }, [listingId]);

  useEffect(() => { load(); }, [load]);

  if (loading) {
    return (
      <div className="min-h-screen w-full bg-muted flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  if (error || !initialData) {
    return (
      <div className="min-h-screen w-full bg-muted flex flex-col items-center justify-center gap-5 px-8 text-center">
        <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
          <AlertTriangle className="w-8 h-8 text-destructive" />
        </div>
        <div>
          <p className="font-bold text-foreground text-lg mb-1">
            Couldn't load listing
          </p>
          <p className="text-muted-foreground text-sm">
            {error ?? "Listing not found."}
          </p>
        </div>
        <div className="flex gap-3 w-full max-w-xs">
          <button
            onClick={() => router.back()}
            className="flex-1 rounded-2xl border border-border bg-card py-3.5 font-bold text-foreground"
          >
            Go back
          </button>
          <button
            onClick={load}
            className="flex-1 flex items-center justify-center gap-2 rounded-2xl bg-primary text-primary-foreground py-3.5 font-bold"
          >
            <RefreshCw className="w-4 h-4" />
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <ListingForm
      initialData={initialData}
      editMode
      listingId={listingId}
      onSuccess={(id: string) =>
        router.push(`/dashboard/marketplace/${id}`)
      }
    />
  );
}
