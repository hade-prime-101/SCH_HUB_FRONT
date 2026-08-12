// app/dashboard/study-groups/discover/page.tsx
"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { listAllGroups, joinGroup, leaveGroup } from "@/lib/api/study-groups.api";
import type { StudyGroup } from "@/types/study-groups";

export default function DiscoverGroupsPage() {
  const [groups, setGroups] = useState<StudyGroup[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 20;

  const fetchGroups = () => {
    listAllGroups(page, limit).then((res) => {
      setGroups(res.data);
      setTotal(res.total);
    });
  };

  useEffect(() => { fetchGroups(); }, [page]);

  const handleJoin = async (id: string) => {
    await joinGroup(id);
    fetchGroups();
  };

  const handleLeave = async (id: string) => {
    await leaveGroup(id);
    fetchGroups();
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Discover Study Groups</h1>
      {groups.map((g) => (
        <div key={g.id} className="bg-white shadow rounded p-4 mb-3 flex justify-between items-center">
          <div>
            <Link href={`/dashboard/study-groups/${g.id}`} className="font-medium text-blue-600">
              {g.name}
            </Link>
            <p className="text-sm text-gray-600">{g.description}</p>
            <p className="text-xs text-gray-400">{g.memberCount} members</p>
          </div>
          <div>
            {/* Assume we know if user is a member; in real app track membership */}
            <button onClick={() => handleJoin(g.id)} className="bg-green-600 text-white px-3 py-1 rounded text-sm">Join</button>
            <button onClick={() => handleLeave(g.id)} className="ml-2 bg-gray-200 px-3 py-1 rounded text-sm">Leave</button>
          </div>
        </div>
      ))}
      <div className="flex justify-between mt-4">
        <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="btn">Prev</button>
        <span>Page {page}</span>
        <button disabled={page * limit >= total} onClick={() => setPage(p => p + 1)} className="btn">Next</button>
      </div>
    </div>
  );
}