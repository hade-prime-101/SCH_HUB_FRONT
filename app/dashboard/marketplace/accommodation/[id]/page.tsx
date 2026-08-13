"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getAccommodation, deleteAccommodation, reportContent } from "@/lib/api/marketplace.api";
import type { Accommodation } from "@/types/marketplace";
import Link from "next/link";

export default function AccommodationDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [acc, setAcc] = useState<Accommodation | null>(null);

  useEffect(() => {
    getAccommodation(id).then(setAcc);
  }, [id]);

  const handleDelete = async () => {
    if (!confirm("Delete?")) return;
    await deleteAccommodation(id);
    router.push("/dashboard/marketplace/accommodation");
  };

  const handleReport = async () => {
    const reason = prompt("Reason for report?");
    if (!reason) return;
    await reportContent({ targetType: "accommodation", targetId: id, reason });
    alert("Reported.");
  };

  if (!acc) return <p>Loading...</p>;

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold">{acc.title}</h1>
      <p>{acc.description}</p>
      <p className="text-sm text-muted-foreground">{acc.type} · {acc.location} · ₦{acc.price}</p>
      <div className="flex gap-2 mt-4">
        <Link href={`/dashboard/marketplace/accommodation/${id}/edit`} className="bg-primary text-primary-foreground px-3 py-1 rounded">Edit</Link>
        <button onClick={handleDelete} className="bg-destructive text-primary-foreground px-3 py-1 rounded">Delete</button>
        <button onClick={handleReport} className="text-destructive underline">Report</button>
      </div>
    </div>
  );
}