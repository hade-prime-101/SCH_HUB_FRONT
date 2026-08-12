"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { listEvents, deleteEvent } from "@/lib/api/school.api";
import type { SchoolEvent } from "@/types/school";

export default function EventsPage() {
  const [events, setEvents] = useState<SchoolEvent[]>([]);

  useEffect(() => { listEvents().then(setEvents); }, []);

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this event?")) return;
    await deleteEvent(id);
    setEvents(prev => prev.filter(e => e.id !== id));
  };

  return (
    <div>
      <div className="flex justify-between mb-4">
        <h1 className="text-2xl font-bold">Events</h1>
        <Link href="/dashboard/school/events/new" className="bg-blue-600 text-white px-4 py-2 rounded">Create Event</Link>
      </div>
      <div className="grid gap-4">
        {events.map(ev => (
          <div key={ev.id} className="bg-white shadow rounded p-4 flex justify-between items-center">
            <div>
              <Link href={`/dashboard/school/events/${ev.id}`} className="font-medium text-blue-600 hover:underline">{ev.title}</Link>
              <p className="text-sm text-gray-500">{new Date(ev.date).toLocaleDateString()} {ev.time} - {ev.venue}</p>
            </div>
            <button onClick={() => handleDelete(ev.id)} className="text-red-600 text-sm">Delete</button>
          </div>
        ))}
      </div>
    </div>
  );
}