"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { listServices, deleteService } from "@/lib/api/marketplace.api";
import type { Service } from "@/types/marketplace";

export default function ServicesPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 10;

  useEffect(() => {
    listServices({ page, limit }).then((res) => {
      setServices(res.data);
      setTotal(res.total);
    });
  }, [page]);

  const handleDelete = async (id: string) => {
    await deleteService(id);
    setServices((prev) => prev.filter((s) => s.id !== id));
  };

  return (
    <div>
      <div className="flex justify-between mb-4">
        <h1 className="text-2xl font-bold">Services</h1>
        <Link href="/dashboard/marketplace/services/new" className="bg-blue-600 text-white px-4 py-2 rounded">
          Offer Service
        </Link>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {services.map((svc) => (
          <div key={svc.id} className="bg-white shadow rounded p-4">
            <Link href={`/dashboard/marketplace/services/${svc.id}`} className="font-medium text-blue-600">
              {svc.title}
            </Link>
            <p className="text-sm text-gray-600">{svc.category} · ₦{svc.price}</p>
            <button onClick={() => handleDelete(svc.id)} className="text-red-600 text-sm mt-1">Delete</button>
          </div>
        ))}
      </div>
      <div className="flex justify-between mt-4">
        <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="btn">Prev</button>
        <span>Page {page}</span>
        <button disabled={page * limit >= total} onClick={() => setPage((p) => p + 1)} className="btn">Next</button>
      </div>
    </div>
  );
}