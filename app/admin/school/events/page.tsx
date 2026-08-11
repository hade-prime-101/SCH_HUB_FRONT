"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { listEvents, deleteEvent } from "@/lib/school.api";
import type { SchoolEvent } from "@/types/school";

export default function AdminEventsPage() {
  const [events, setEvents] = useState<SchoolEvent[]>([]);

  useEffect(() => { listEvents().then(setEvents); }, []);

  const handleDelete = async (id: string) => {
    await deleteEvent(id);
    setEvents(prev => prev.filter(e => e.id !== id));
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Manage Events</h1>
      <div className="space-y-3">
        {events.map(ev => (
          <div key={ev.id} className="bg-white shadow rounded p-4 flex justify-between items-center">
            <div>
              <Link href={`/dashboard/school/events/${ev.id}`} className="font-medium text-blue-600">{ev.title}</Link>
              <p className="text-sm">{ev.date} {ev.time}</p>
            </div>
            <div className="flex gap-2">
              <Link href={`/dashboard/school/events/${ev.id}`} className="bg-purple-600 text-white px-3 py-1 rounded text-sm">Manage Tickets</Link>
              <button onClick={() => handleDelete(ev.id)} className="text-red-600 text-sm">Delete</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}