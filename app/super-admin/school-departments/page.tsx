"use client";
import { useEffect, useState } from "react";
import { getSchoolDepartments } from "@/lib/api/super-admin.api";
import type { Department } from "@/types/super-admin";

export default function SchoolDepartmentsPage() {
  const [facultyId, setFacultyId] = useState<string>("");
  const [departments, setDepartments] = useState<Department[]>([]);
  useEffect(() => {
    getSchoolDepartments(facultyId || undefined).then(setDepartments);
  }, [facultyId]);
  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">My School Departments</h1>
      <input
        type="text"
        placeholder="Filter by faculty ID (optional)"
        value={facultyId}
        onChange={(e) => setFacultyId(e.target.value)}
        className="border p-2 mb-4 w-64"
      />
      <ul>
        {departments.map((d) => (
          <li key={d.id} className="bg-card shadow rounded p-3 mb-2">
            {d.name} ({d.shortCode})
          </li>
        ))}
      </ul>
    </div>
  );
}