"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { listMentors } from "@/lib/api/community.api";
import type { Mentor } from "@/types/community";

export default function MentorsList() {
  const [mentors, setMentors] = useState<Mentor[]>([]);

  useEffect(() => {
    listMentors().then(setMentors);
  }, []);

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Mentors</h1>
        <Link href="/dashboard/community/mentors/register" className="bg-blue-600 text-white px-4 py-2 rounded">
          Become a Mentor
        </Link>
      </div>
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