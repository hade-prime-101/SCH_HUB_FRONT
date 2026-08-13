// app/dashboard/study/cgpa/page.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { apiGet } from "@/lib/api";
import type { CGPACourse } from "@/types/study";

export default function CGPAPage() {
  const router = useRouter();
  const [cgpaData, setCgpaData] = useState<{ currentCGPA: number; totalCredits: number } | null>(null);
  const [courses, setCourses] = useState<CGPACourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const [cgpa, coursesData] = await Promise.all([
          apiGet("/cgpa/current"),
          apiGet("/cgpa/courses"),
        ]);
        setCgpaData(cgpa);
        setCourses(coursesData.data || coursesData || []);
      } catch (err: any) {
        const message = err?.message || "Failed to load CGPA data";
        if (message.includes("No token") || err?.status === 401) {
          setError("You must be logged in to view CGPA. Redirecting to login...");
          setTimeout(() => router.push("/login"), 2000);
        } else {
          setError(message);
        }
      } finally {
        setLoading(false);
      }
    })();
  }, [router]);

  if (loading) return <p className="text-center py-8">Loading CGPA data...</p>;

  if (error) {
    return (
      <div className="max-w-4xl mx-auto py-8">
        <div className="bg-destructive/5 border border-destructive/20 rounded p-4">
          <p className="text-destructive">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">CGPA Calculator</h1>
        <Link
          href="/dashboard/study/cgpa/calculate"
          className="bg-primary text-primary-foreground px-4 py-2 rounded"
        >
          Calculate CGPA
        </Link>
      </div>

      {cgpaData ? (
        <div className="bg-white shadow rounded p-6 mb-6">
          <h2 className="text-xl font-semibold mb-2">Your Current CGPA</h2>
          <div className="flex gap-8">
            <div>
              <p className="text-gray-500">CGPA</p>
              <p className="text-4xl font-bold text-primary">{cgpaData.currentCGPA.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-gray-500">Total Credits</p>
              <p className="text-4xl font-bold">{cgpaData.totalCredits}</p>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-warning/5 p-4 rounded mb-6">
          No CGPA data yet. <Link href="/dashboard/study/cgpa/courses" className="text-primary underline">Add courses</Link> and calculate.
        </div>
      )}

      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Your Courses</h2>
        <Link
          href="/dashboard/study/cgpa/courses"
          className="text-primary hover:underline"
        >
          Manage Courses
        </Link>
      </div>

      {courses.length === 0 ? (
        <p className="text-gray-500">No courses added yet.</p>
      ) : (
        <div className="bg-white shadow rounded overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left p-3">Code</th>
                <th className="text-left p-3">Name</th>
                <th className="text-left p-3">Credits</th>
                <th className="text-left p-3">Grade</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {courses.slice(0, 5).map((c) => (
                <tr key={c.id}>
                  <td className="p-3">{c.code}</td>
                  <td className="p-3">{c.name}</td>
                  <td className="p-3">{c.creditHours}</td>
                  <td className="p-3 font-medium">{c.grade}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {courses.length > 5 && (
            <div className="p-3 text-center text-sm text-gray-500">
              Showing 5 of {courses.length} courses.
            </div>
          )}
        </div>
      )}
    </div>
  );
}