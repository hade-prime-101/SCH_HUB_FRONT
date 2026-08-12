// app/dashboard/admin/school/events/new/page.tsx
"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createEvent } from "@/lib/api/school.api";

export default function AdminNewEventPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    title: "", description: "", date: "", time: "", venue: "", departmentId: "", level: ""
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await createEvent(form);
    router.push("/dashboard/admin/school/events");
  };

  return (
    <div className="max-w-xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Create Event (Admin)</h1>
      <form onSubmit={handleSubmit} className="bg-white shadow rounded p-6 space-y-4">
        <input type="text" placeholder="Title" value={form.title} onChange={e => setForm({...form, title: e.target.value})} className="border p-2 w-full" required />
        <textarea placeholder="Description" value={form.description} onChange={e => setForm({...form, description: e.target.value})} className="border p-2 w-full" required />
        <input type="date" value={form.date} onChange={e => setForm({...form, date: e.target.value})} className="border p-2 w-full" required />
        <input type="time" value={form.time} onChange={e => setForm({...form, time: e.target.value})} className="border p-2 w-full" />
        <input type="text" placeholder="Venue" value={form.venue} onChange={e => setForm({...form, venue: e.target.value})} className="border p-2 w-full" />
        <input type="text" placeholder="Department ID (optional)" value={form.departmentId} onChange={e => setForm({...form, departmentId: e.target.value})} className="border p-2 w-full" />
        <input type="text" placeholder="Level (optional)" value={form.level} onChange={e => setForm({...form, level: e.target.value})} className="border p-2 w-full" />
        <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded">Create Event</button>
      </form>
    </div>
  );
}