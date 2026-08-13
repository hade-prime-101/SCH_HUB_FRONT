"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Calendar, MapPin, Trash2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton";
import { ErrorMessage } from "@/components/ui/ErrorMessage";
import BackButton from "@/components/shared/BackButton";
import { listEvents, deleteEvent } from "@/lib/api/school.api";
import type { SchoolEvent } from "@/types/school";

export default function EventsPage() {
  const [events, setEvents] = useState<SchoolEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = async () => {
    try {
      setLoading(true);
      const data = await listEvents();
      setEvents(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load events");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this event?")) return;
    try {
      await deleteEvent(id);
      refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete event");
    }
  };

  if (error) return <ErrorMessage message={error} />;

  return (
    <div className="min-h-screen bg-muted pb-24">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-card border-b border-border px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <BackButton variant="icon" />
          <h1 className="text-xl font-bold text-foreground">Events</h1>
        </div>
        <Link href="/campus/events/new">
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Create Event
          </Button>
        </Link>
      </div>

      <div className="px-4 py-6 max-w-3xl mx-auto space-y-4">
        {loading ? (
          <LoadingSkeleton count={3} height="h-24" />
        ) : events.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              <p>No events scheduled.</p>
              <Link href="/campus/events/new">
                <Button variant="link">Create your first event</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          events.map((ev) => (
            <Card key={ev.id} compact>
              <div className="flex items-start gap-3">
                <div className="w-14 h-14 rounded-xl bg-category-events-bg text-category-events flex flex-col items-center justify-center font-bold text-xs shrink-0">
                  <span className="text-lg">
                    {new Date(ev.date).getDate()}
                  </span>
                  <span className="uppercase text-[10px]">
                    {new Date(ev.date).toLocaleString("default", { month: "short" })}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <Link href={`/campus/events/${ev.id}`}>
                    <h3 className="font-semibold text-foreground hover:text-primary transition-colors">
                      {ev.title}
                    </h3>
                  </Link>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      {new Date(ev.date).toLocaleDateString()}
                      {ev.time && ` at ${ev.time}`}
                    </span>
                    {ev.venue && (
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5" />
                        {ev.venue}
                      </span>
                    )}
                  </div>
                  {ev.description && (
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                      {ev.description}
                    </p>
                  )}
                </div>
                <Button
                  variant="destructive"
                  size="icon-sm"
                  onClick={() => handleDelete(ev.id)}
                  className="shrink-0"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}