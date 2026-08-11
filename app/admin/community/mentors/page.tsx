// app/dashboard/admin/community/mentors/page.tsx
"use client";

import { useEffect, useState } from "react";
import { listMentors } from "@/lib/api/community.api";
import type { Mentor } from "@/types/community";

export default function AdminMentorsPage() {
  const [mentors, setMentors] = useState<Mentor[]>([]);

  useEffect(() => {
    listMentors().then(setMentors);
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Registered Mentors</h1>
      {mentors.length === 0 && <p className="text-gray-500">No mentors registered.</p>}
      {mentors.map((m) => (
        <div key={m.id} className="bg-white shadow rounded p-4 mb-3">
          <p className="font-medium">{m.name}</p>
          <p className="text-sm text-gray-500">{m.expertise.join(", ")}</p>
          <p className="text-sm">{m.bio}</p>
          <p className={`text-xs ${m.available ? "text-green-600" : "text-red-600"}`}>
            {m.available ? "Available" : "Unavailable"}
          </p>
        </div>
      ))}
    </div>
  );
}