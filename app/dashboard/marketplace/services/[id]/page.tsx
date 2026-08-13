"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getService, deleteService, reportContent } from "@/lib/api/marketplace.api";
import type { Service } from "@/types/marketplace";
import Link from "next/link";

export default function ServiceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [service, setService] = useState<Service | null>(null);

  useEffect(() => { getService(id).then(setService); }, [id]);

  const handleDelete = async () => {
    if (!confirm("Delete?")) return;
    await deleteService(id);
    router.push("/dashboard/marketplace/services");
  };

  const handleReport = async () => {
    const reason = prompt("Reason for report?");
    if (!reason) return;
    await reportContent({ targetType: "service", targetId: id, reason });
    alert("Reported.");
  };

  if (!service) return <p>Loading...</p>;

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold">{service.title}</h1>
      <p>{service.description}</p>
      <p className="text-sm text-gray-500 mt-2">{service.category} · ₦{service.price}</p>
      <div className="flex gap-3 mt-4">
        <Link href={`/dashboard/marketplace/services/${id}/edit`} className="bg-primary text-primary-foreground px-3 py-1 rounded">Edit</Link>
        <button onClick={handleDelete} className="bg-destructive text-white px-3 py-1 rounded">Delete</button>
        <button onClick={handleReport} className="text-red-500 underline">Report</button>
      </div>
    </div>
  );
}