"use client";
import { useEffect, useState } from "react";
import { listRoommates, deleteRoommateRequest } from "@/lib/api/marketplace.api";
import type { RoommateRequest } from "@/types/marketplace";
import Link from "next/link";

export default function RoommatesPage() {
  const [requests, setRequests] = useState<RoommateRequest[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 10;

  useEffect(() => {
    listRoommates(page, limit).then((res) => {
      setRequests(res.data);
      setTotal(res.total);
    });
  }, [page]);

  const handleDelete = async (id: string) => {
    await deleteRoommateRequest(id);
    setRequests((prev) => prev.filter((r) => r.id !== id));
  };

  return (
    <div>
      <div className="flex justify-between mb-4">
        <h1 className="text-2xl font-bold">Roommate Requests</h1>
        <Link href="/dashboard/marketplace/roommates/new" className="bg-blue-600 text-white px-4 py-2 rounded">
          New Request
        </Link>
      </div>
      {requests.map((req) => (
        <div key={req.id} className="bg-white shadow rounded p-4 mb-3 flex justify-between items-center">
          <div>
            <p className="font-medium">{req.title}</p>
            <p className="text-sm text-gray-600">Budget: ₦{req.budget} · {req.gender || "Any"}</p>
            <p className="text-sm text-gray-500">{req.description}</p>
          </div>
          <button onClick={() => handleDelete(req.id)} className="text-red-600 text-sm">Delete</button>
        </div>
      ))}
      <div className="flex justify-between mt-4">
        <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="btn">Prev</button>
        <span>Page {page}</span>
        <button disabled={page * limit >= total} onClick={() => setPage((p) => p + 1)} className="btn">Next</button>
      </div>
    </div>
  );
}