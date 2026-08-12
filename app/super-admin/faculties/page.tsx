"use client";
import { useEffect, useState } from "react";
import { getSchoolFaculties } from "@/lib/api/super-admin.api";
import type { Faculty } from "@/types/super-admin";

export default function SchoolFacultiesPage() {
  const [faculties, setFaculties] = useState<Faculty[]>([]);
  useEffect(() => {
    getSchoolFaculties().then(setFaculties);
  }, []);
  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">My School Faculties</h1>
      <ul>
        {faculties.map((f) => (
          <li key={f.id} className="bg-white shadow rounded p-3 mb-2">
            {f.name}
          </li>
        ))}
      </ul>
    </div>
  );
}