"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getAccommodation, deleteAccommodation, reportContent } from "@/lib/api/marketplace.api";
import type { Accommodation } from "@/types/marketplace";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton";
import { ArrowLeft, AlertTriangle } from "lucide-react";
import Link from "next/link";

export default function AccommodationDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [acc, setAcc] = useState<Accommodation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getAccommodation(id)
      .then(setAcc)
      .catch(() => setError("Accommodation not found"))
      .finally(() => setLoading(false));
  }, [id]);

  const handleDelete = async () => {
    if (!confirm("Delete this listing?")) return;
    await deleteAccommodation(id);
    router.push("/marketplace/accommodation");
  };

  const handleReport = async () => {
    const reason = prompt("Reason for report?");
    if (!reason) return;
    await reportContent({ targetType: "accommodation", targetId: id, reason });
    alert("Reported.");
  };

  if (loading) return <LoadingSkeleton height="h-96" />;
  if (error || !acc) {
    return (
      <div className="text-center py-20">
        <p className="text-destructive">{error || "Not found"}</p>
        <Button asChild className="mt-4"><Link href="/marketplace/accommodation">Back</Link></Button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <Button variant="ghost" size="sm" onClick={() => router.back()} className="gap-1">
        <ArrowLeft className="h-4 w-4" /> Back
      </Button>
      <div className="space-y-4">
        <div className="aspect-video w-full overflow-hidden rounded-2xl bg-muted">
          {acc.images?.[0] ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={acc.images[0]} alt={acc.title} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full items-center justify-center text-muted-foreground">No image</div>
          )}
        </div>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">{acc.title}</h1>
            <p className="text-sm text-muted-foreground">{acc.location}</p>
            <p className="text-lg font-semibold text-primary">₦{acc.price.toLocaleString()}</p>
          </div>
          <Badge variant="category-campus">{acc.type.replace("_", " ")}</Badge>
        </div>
        <Card className="p-5">
          <p className="text-muted-foreground whitespace-pre-wrap">{acc.description}</p>
        </Card>
        <div className="flex flex-wrap gap-3">
          <Button asChild><Link href={`/marketplace/accommodation/${id}/edit`}>Edit</Link></Button>
          <Button variant="destructive" onClick={handleDelete}>Delete</Button>
          <Button variant="ghost" onClick={handleReport} className="text-destructive">
            <AlertTriangle className="mr-1 h-4 w-4" /> Report
          </Button>
        </div>
      </div>
    </div>
  );
}