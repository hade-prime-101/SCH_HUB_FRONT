"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { getListing, deleteListing, toggleSaveListing, reportContent } from "@/lib/api/marketplace.api";
import type { Listing } from "@/types/marketplace";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton";
import { ArrowLeft, Heart, Share2, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

export default function ListingDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [listing, setListing] = useState<Listing | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getListing(id)
      .then(setListing)
      .catch(() => setError("Failed to load listing"))
      .finally(() => setLoading(false));
  }, [id]);

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this listing?")) return;
    await deleteListing(id);
    router.push("/marketplace/listings");
  };

  const handleSave = async () => {
    if (!listing) return;
    await toggleSaveListing(id);
    setListing({ ...listing, saved: !listing.saved });
  };

  const handleReport = async () => {
    const reason = prompt("Please provide a reason for reporting this listing:");
    if (!reason) return;
    await reportContent({ targetType: "listing", targetId: id, reason });
    alert("Thank you for reporting. We'll review it shortly.");
  };

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto space-y-4">
        <LoadingSkeleton height="h-8" width="w-32" />
        <LoadingSkeleton height="h-96" />
        <LoadingSkeleton height="h-20" />
      </div>
    );
  }

  if (error || !listing) {
    return (
      <div className="max-w-3xl mx-auto text-center py-20">
        <p className="text-destructive">{error || "Listing not found"}</p>
        <Button asChild className="mt-4">
          <Link href="/marketplace/listings">Back to listings</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Back & actions */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={() => router.back()} className="gap-1">
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
        <div className="flex gap-2">
          <Button variant="outline" size="icon-sm" onClick={handleSave} aria-label="Save">
            <Heart className={cn("h-4 w-4", listing.saved && "fill-primary text-primary")} />
          </Button>
          <Button variant="outline" size="icon-sm" aria-label="Share">
            <Share2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Main content */}
      <div className="space-y-4">
        {/* Images */}
        <div className="aspect-video w-full overflow-hidden rounded-2xl bg-muted">
          {listing.images?.[0] ? (
            <img src={listing.images[0]} alt={listing.title} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full items-center justify-center text-muted-foreground">
              No image
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">{listing.title}</h1>
            <p className="text-lg font-semibold text-primary">₦{listing.price.toLocaleString()}</p>
          </div>
          <Badge variant={listing.status === "ACTIVE" ? "success" : "default"}>
            {listing.status}
          </Badge>
        </div>

        <Card className="p-5">
          <p className="text-muted-foreground whitespace-pre-wrap">{listing.description}</p>
        </Card>

        <div className="flex flex-wrap gap-3">
          <Button asChild variant="default">
            <Link href={`/marketplace/listings/${id}/edit`}>Edit</Link>
          </Button>
          <Button variant="destructive" onClick={handleDelete}>Delete</Button>
          <Button variant="ghost" onClick={handleReport} className="text-destructive">
            <AlertTriangle className="mr-1 h-4 w-4" />
            Report
          </Button>
        </div>
      </div>
    </div>
  );
}