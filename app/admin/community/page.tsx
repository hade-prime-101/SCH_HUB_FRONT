// app/dashboard/admin/community/page.tsx
"use client";

import Link from "next/link";

export default function AdminCommunityOverview() {
  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Community Moderation</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <Link
          href="/dashboard/admin/community/posts"
          className="bg-white shadow rounded p-6 hover:shadow-md transition"
        >
          <h2 className="text-xl font-semibold">Manage Posts</h2>
          <p className="text-gray-500">Pin, delete, or moderate all posts</p>
        </Link>
        <Link
          href="/dashboard/admin/community/questions"
          className="bg-white shadow rounded p-6 hover:shadow-md transition"
        >
          <h2 className="text-xl font-semibold">Manage Q&A</h2>
          <p className="text-gray-500">Delete questions, manage answers</p>
        </Link>
        <Link
          href="/dashboard/admin/community/reports"
          className="bg-white shadow rounded p-6 hover:shadow-md transition"
        >
          <h2 className="text-xl font-semibold">Reports</h2>
          <p className="text-gray-500">View and resolve flagged content</p>
        </Link>
        <Link
          href="/dashboard/admin/community/faq"
          className="bg-white shadow rounded p-6 hover:shadow-md transition"
        >
          <h2 className="text-xl font-semibold">FAQs</h2>
          <p className="text-gray-500">Add/remove fresher questions</p>
        </Link>
        <Link
          href="/dashboard/admin/community/mentors"
          className="bg-white shadow rounded p-6 hover:shadow-md transition"
        >
          <h2 className="text-xl font-semibold">Mentors</h2>
          <p className="text-gray-500">View all registered mentors</p>
        </Link>
        <Link
          href="/dashboard/admin/community/notices/new"
          className="bg-white shadow rounded p-6 hover:shadow-md transition"
        >
          <h2 className="text-xl font-semibold">Post Notice</h2>
          <p className="text-gray-500">Create notice board announcements</p>
        </Link>
      </div>
    </div>
  );
}