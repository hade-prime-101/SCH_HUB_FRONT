// app/dashboard/admin/study/page.tsx
"use client";

import Link from "next/link";

export default function AdminStudyOverview() {
  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Study Moderation</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <Link
          href="/dashboard/admin/study/materials"
          className="bg-card shadow rounded p-6 hover:shadow-md transition"
        >
          <h2 className="text-xl font-semibold">Pending Material Reviews</h2>
          <p className="text-muted-foreground">Approve or reject uploaded materials</p>
        </Link>
        <Link
          href="/dashboard/admin/study/quizzes"
          className="bg-card shadow rounded p-6 hover:shadow-md transition"
        >
          <h2 className="text-xl font-semibold">Manage Quizzes</h2>
          <p className="text-muted-foreground">View, delete, and approve questions</p>
        </Link>
        <Link
          href="/dashboard/admin/study/quizzes/analytics"
          className="bg-card shadow rounded p-6 hover:shadow-md transition"
        >
          <h2 className="text-xl font-semibold">Quiz Analytics</h2>
          <p className="text-muted-foreground">View overall quiz performance</p>
        </Link>
      </div>
    </div>
  );
}