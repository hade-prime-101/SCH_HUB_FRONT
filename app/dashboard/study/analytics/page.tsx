// app/dashboard/study/analytics/page.tsx
"use client";

import { useEffect, useState } from "react";
import { apiGet } from "@/lib/api";

export default function AnalyticsPage() {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    apiGet("/study/analytics/my").then(setData);
  }, []);

  if (!data) return <p>Loading analytics...</p>;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">My Analytics</h1>
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white shadow rounded p-6">
          <p className="text-gray-500">Materials Uploaded</p>
          <p className="text-3xl font-bold">{data.materialsUploaded}</p>
        </div>
        <div className="bg-white shadow rounded p-6">
          <p className="text-gray-500">Quizzes Created</p>
          <p className="text-3xl font-bold">{data.quizzesCreated}</p>
        </div>
        <div className="bg-white shadow rounded p-6">
          <p className="text-gray-500">Avg Quiz Score</p>
          <p className="text-3xl font-bold">{data.averageQuizScore?.toFixed(1)}%</p>
        </div>
        <div className="bg-white shadow rounded p-6">
          <p className="text-gray-500">Total Downloads</p>
          <p className="text-3xl font-bold">{data.totalDownloads}</p>
        </div>
      </div>
    </div>
  );
}