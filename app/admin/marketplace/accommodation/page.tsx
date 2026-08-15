"use client";
import { useEffect, useState } from "react";
import { listPendingAccommodation, moderateAccommodation } from "@/lib/api/marketplace.api";
import type { Accommodation } from "@/types/marketplace";

export default function AdminAccommodationPage() {
  const [items, setItems] = useState<Accommodation[]>([]);

  useEffect(() => {
    listPendingAccommodation().then((res) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const data = (res as any).data ?? res;
      setItems(Array.isArray(data) ? data : []);
    });
  }, []);

  const handleModerate = async (id: string, decision: 'APPROVE' | 'REJECT') => {
    const reason = decision === 'REJECT' ? (prompt('Reason for rejection?') || undefined) : undefined;
    await moderateAccommodation(id, { decision, reason });
    setItems(prev => prev.filter(a => a.id !== id));
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Pending Accommodation</h1>
      {items.map(acc => (
        <div key={acc.id} className="bg-card shadow rounded p-4 mb-3 flex justify-between">
          <div>
            <p className="font-medium">{acc.title}</p>
            <p className="text-sm text-muted-foreground">{acc.type} · {acc.location} · ₦{acc.price}</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => handleModerate(acc.id, 'APPROVE')} className="bg-success text-primary-foreground px-3 py-1 rounded">Approve</button>
            <button onClick={() => handleModerate(acc.id, 'REJECT')} className="bg-destructive text-primary-foreground px-3 py-1 rounded">Reject</button>
          </div>
        </div>
      ))}
    </div>
  );
}