"use client";
import { useEffect, useState } from "react";
import { listPendingServices, moderateService } from "@/lib/marketplace.api";
import type { Service } from "@/types/marketplace";

export default function AdminServicesPage() {
  const [services, setServices] = useState<Service[]>([]);

  useEffect(() => { listPendingServices().then(setServices); }, []);

  const handleModerate = async (id: string, decision: 'APPROVE' | 'REJECT') => {
    const reason = decision === 'REJECT' ? prompt('Reason?') : undefined;
    await moderateService(id, { decision, reason });
    setServices(prev => prev.filter(s => s.id !== id));
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Pending Services</h1>
      {services.map(svc => (
        <div key={svc.id} className="bg-white shadow rounded p-4 mb-3 flex justify-between">
          <div>
            <p className="font-medium">{svc.title}</p>
            <p className="text-sm text-gray-600">{svc.category} · ₦{svc.price}</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => handleModerate(svc.id, 'APPROVE')} className="bg-green-600 text-white px-3 py-1 rounded">Approve</button>
            <button onClick={() => handleModerate(svc.id, 'REJECT')} className="bg-red-600 text-white px-3 py-1 rounded">Reject</button>
          </div>
        </div>
      ))}
    </div>
  );
}