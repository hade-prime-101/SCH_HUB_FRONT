// app/dashboard/planner/weekly/page.tsx
"use client";
import { useEffect, useState } from "react";
import { getWeeklyPlanner } from "@/lib/api/planner.api";
import type { WeeklyPlanner } from "@/types/planner";

export default function WeeklyPlannerPage() {
  const [data, setData] = useState<WeeklyPlanner | null>(null);
  const [weekOffset, setWeekOffset] = useState(0);

  useEffect(() => {
    getWeeklyPlanner(weekOffset).then(setData);
  }, [weekOffset]);

  if (!data) return <p>Loading weekly schedule...</p>;

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">
          Week of {new Date(data.weekStart).toLocaleDateString()} - {new Date(data.weekEnd).toLocaleDateString()}
        </h1>
        <div className="flex gap-2">
          <button
            onClick={() => setWeekOffset((o) => o - 1)}
            className="px-3 py-1 bg-gray-200 rounded"
          >
            Previous
          </button>
          <button
            onClick={() => setWeekOffset((o) => o + 1)}
            className="px-3 py-1 bg-gray-200 rounded"
          >
            Next
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {data.days.map((day) => (
          <div key={day.date} className="bg-white shadow rounded p-3">
            <p className="font-semibold mb-2">
              {new Date(day.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
            </p>
            {day.events.length === 0 ? (
              <p className="text-sm text-gray-400">No events</p>
            ) : (
              <ul className="space-y-2">
                {day.events.map((event) => (
                  <li key={event.id} className="text-sm">
                    <p className="font-medium">{event.title}</p>
                    <p className="text-xs text-muted-foreground">{event.startTime}</p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}