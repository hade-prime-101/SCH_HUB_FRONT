"use client";

import { useState } from "react";
import { useQuery } from "@/lib/hooks/useQuery";
import { getWeeklyPlanner } from "@/lib/api/planner.api";
import type { WeeklyPlanner } from "@/types/planner";
import { PageHeader } from "@/components/shared/PageHeader";
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { LoadingState, EmptyState } from "@/components/shared/DashboardPrimitives";
import { ErrorState } from "@/components/shared/ErrorState";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function WeeklyPlannerPage() {
  const [weekOffset, setWeekOffset] = useState(0);
  const { data, loading, error, refetch } = useQuery<WeeklyPlanner>(
    () => getWeeklyPlanner(weekOffset),
    [weekOffset]
  );

  if (loading) return <LoadingState label="Loading weekly schedule" />;
  if (error) return <ErrorState title="Failed to load weekly schedule" description={error.message} onRetry={refetch} />;

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-6">
      <PageHeader
        title={`Week of ${data ? new Date(data.weekStart).toLocaleDateString() : ""} – ${data ? new Date(data.weekEnd).toLocaleDateString() : ""}`}
        actions={
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setWeekOffset((o) => o - 1)}>
              Previous
            </Button>
            <Button variant="outline" size="sm" onClick={() => setWeekOffset((o) => o + 1)}>
              Next
            </Button>
          </div>
        }
      />

      {data && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
          {data.days.map((day) => (
            <Card key={day.date} compact>
              <h3 className="font-semibold text-foreground mb-2">
                {new Date(day.date).toLocaleDateString(undefined, {
                  weekday: "short",
                  month: "short",
                  day: "numeric",
                })}
              </h3>
              {day.events.length === 0 ? (
                <p className="text-sm text-muted-foreground/70">No events</p>
              ) : (
                <ul className="space-y-1">
                  {day.events.map((event) => (
                    <li key={event.id} className="text-sm">
                      <p className="font-medium">{event.title}</p>
                      <p className="text-xs text-muted-foreground">{event.startTime}</p>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}