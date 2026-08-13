// app/dashboard/planner/page.tsx
"use client";
import { useEffect, useState } from "react";
import { getTodayPlanner } from "@/lib/api/planner.api";
import type { TodayPlanner } from "@/types/planner";

export default function TodayPlannerPage() {
  const [data, setData] = useState<TodayPlanner | null>(null);

  useEffect(() => {
    getTodayPlanner().then(setData);
  }, []);

  if (!data) return <p>Loading today's schedule...</p>;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Today's Schedule</h1>
      {data.events.length === 0 ? (
        <p className="text-gray-500">No events scheduled for today.</p>
      ) : (
        <div className="space-y-3">
          {data.events.map((event) => (
            <div key={event.id} className="bg-white shadow rounded p-4">
              <p className="font-medium">{event.title}</p>
              <p className="text-sm text-muted-foreground">
                {event.startTime} - {event.endTime} {event.location && `· ${event.location}`}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}