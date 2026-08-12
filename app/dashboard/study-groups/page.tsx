// app/dashboard/study-groups/page.tsx
"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { listGroups } from "@/lib/api/study-groups.api";
import type { StudyGroup } from "@/types/study-groups";

export default function MyGroupsPage() {
  const [groups, setGroups] = useState<StudyGroup[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 10;

  useEffect(() => {
    listGroups({ page, limit }).then((res) => {
      setGroups(res.data);
      setTotal(res.total);
    });
  }, [page]);

  return (
    <div>
      <div className="flex justify-between mb-4">
        <h1 className="text-2xl font-bold">My Study Groups</h1>
        <Link href="/dashboard/study-groups/create" className="bg-blue-600 text-white px-4 py-2 rounded">
          New Group
        </Link>
      </div>
      {groups.length === 0 ? (
        <p className="text-gray-500">You haven't joined any groups yet.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {groups.map((g) => (
            <div key={g.id} className="bg-white shadow rounded p-4">
              <Link href={`/dashboard/study-groups/${g.id}`} className="font-medium text-blue-600 hover:underline">
                {g.name}
              </Link>
              <p className="text-sm text-gray-600">{g.description}</p>
              <p className="text-xs text-gray-400">{g.memberCount} members</p>
            </div>
          ))}
        </div>
      )}
      {total > limit && (
        <div className="flex justify-between mt-4">
          <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="btn">Prev</button>
          <span>Page {page}</span>
          <button disabled={page * limit >= total} onClick={() => setPage(p => p + 1)} className="btn">Next</button>
        </div>
      )}
    </div>
  );
}