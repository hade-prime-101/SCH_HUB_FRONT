// app/study/cgpa/page.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { apiGet } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton";
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { Calculator, Plus, ArrowRight } from "lucide-react";
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
        const [cgpa, coursesData] = await Promise.all([
          apiGet("/cgpa/current"),
          apiGet("/cgpa/courses"),
        ]);
        setCgpaData(cgpa);
        setCourses(coursesData.data || coursesData || []);
        setError(null);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
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

  if (loading) return <LoadingSkeleton count={2} height="h-32" radius="rounded-2xl" />;
  if (error) {
    return (
      <div className="bg-destructive/5 border border-destructive/20 rounded-xl p-6 text-destructive">
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">CGPA Calculator</h1>
          <p className="text-muted-foreground">Track your academic progress</p>
        </div>
        <Link href="/study/cgpa/calculate">
          <Button>
            <Calculator className="w-4 h-4 mr-2" />
            Calculate CGPA
          </Button>
        </Link>
      </div>

      {/* CGPA Display */}
      {cgpaData && cgpaData.currentCGPA !== undefined ? (
        <Card>
          <CardContent className="p-6 flex flex-wrap justify-between items-center gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Current CGPA</p>
              <p className="text-4xl font-bold text-primary">{(cgpaData.currentCGPA as number).toFixed(2)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Credits</p>
              <p className="text-2xl font-bold">{cgpaData.totalCredits || 0}</p>
            </div>
            <Link href="/study/cgpa/courses">
              <Button variant="outline">Manage Courses</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-muted-foreground">No CGPA data yet. Add courses to calculate.</p>
            <Link href="/study/cgpa/courses" className="mt-2 inline-block">
              <Button variant="outline">Add Courses</Button>
            </Link>
          </CardContent>
        </Card>
      )}

      {/* Recent Courses */}
      <div>
        <h2 className="text-lg font-semibold mb-3">Recent Courses</h2>
        {courses.length === 0 ? (
          <div className="bg-card rounded-xl border border-dashed p-6 text-center text-muted-foreground">
            No courses added.
          </div>
        ) : (
          <div className="bg-card rounded-xl border border-border overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left p-3">Code</th>
                  <th className="text-left p-3">Name</th>
                  <th className="text-left p-3">Credits</th>
                  <th className="text-left p-3">Grade</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {courses.slice(0, 5).map((c) => (
                  <tr key={c.id} className="hover:bg-muted/30">
                    <td className="p-3">{c.code}</td>
                    <td className="p-3">{c.name}</td>
                    <td className="p-3">{c.creditHours}</td>
                    <td className="p-3 font-medium">{c.grade}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {courses.length > 5 && (
              <div className="p-3 text-center text-sm text-muted-foreground">
                Showing 5 of {courses.length} courses.
              </div>
            )}
          </div>
        )}
        <div className="mt-3">
          <Link href="/study/cgpa/courses" className="text-primary hover:underline flex items-center gap-1 text-sm">
            View all courses <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      </div>
    </div>
  );
}