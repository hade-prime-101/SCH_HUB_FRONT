"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getService, deleteService, reportContent } from "@/lib/api/marketplace.api";
import type { Service } from "@/types/marketplace";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton";
import { ArrowLeft, AlertTriangle } from "lucide-react";
import Link from "next/link";

export default function ServiceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [service, setService] = useState<Service | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getService(id)
      .then(setService)
      .catch(() => setError("Service not found"))
      .finally(() => setLoading(false));
  }, [id]);

  const handleDelete = async () => {
    if (!confirm("Delete this service?")) return;
    await deleteService(id);
    router.push("/marketplace/services");
  };

  const handleReport = async () => {
    const reason = prompt("Reason for report?");
    if (!reason) return;
    await reportContent({ targetType: "service", targetId: id, reason });
    alert("Reported. We'll review it.");
  };

  if (loading) return <LoadingSkeleton height="h-96" />;
  if (error || !service) {
    return (
      <div className="text-center py-20">
        <p className="text-destructive">{error || "Service not found"}</p>
        <Button asChild className="mt-4"><Link href="/marketplace/services">Back to services</Link></Button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <Button variant="ghost" size="sm" onClick={() => router.back()} className="gap-1">
        <ArrowLeft className="h-4 w-4" /> Back
      </Button>
      <div className="space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">{service.title}</h1>
            <p className="text-lg font-semibold text-primary">₦{service.price.toLocaleString()}</p>
          </div>
          <Badge variant="category-marketplace">{service.category}</Badge>
        </div>
        <Card className="p-5">
          <p className="text-muted-foreground whitespace-pre-wrap">{service.description}</p>
        </Card>
        <div className="flex flex-wrap gap-3">
          <Button asChild><Link href={`/marketplace/services/${id}/edit`}>Edit</Link></Button>
          <Button variant="destructive" onClick={handleDelete}>Delete</Button>
          <Button variant="ghost" onClick={handleReport} className="text-destructive">
            <AlertTriangle className="mr-1 h-4 w-4" /> Report
          </Button>
        </div>
      </div>
    </div>
  );
}