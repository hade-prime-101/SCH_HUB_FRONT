"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getEvent, updateEvent } from "@/lib/api/school.api";

export default function EditEventPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [form, setForm] = useState({
    title: "", description: "", date: "", time: "", venue: "", departmentId: "", level: ""
  });

  useEffect(() => {
    getEvent(id).then(ev => {
      setForm({
        title: ev.title,
        description: ev.description,
        date: ev.date.slice(0,10),
        time: ev.time || "",
        venue: ev.venue || "",
        departmentId: ev.departmentId || "",
        level: ev.level || "",
      });
    });
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateEvent(id, form);
    router.push(`/campus/events/${id}`);
  };

  return (
    <div className="max-w-xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Edit Event</h1>
      <form onSubmit={handleSubmit} className="bg-card shadow rounded p-6 space-y-4">
        <input type="text" value={form.title} onChange={e => setForm({...form, title: e.target.value})} className="border p-2 w-full" required />
        <textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} className="border p-2 w-full" required />
        <input type="date" value={form.date} onChange={e => setForm({...form, date: e.target.value})} className="border p-2 w-full" required />
        <input type="time" value={form.time} onChange={e => setForm({...form, time: e.target.value})} className="border p-2 w-full" />
        <input type="text" value={form.venue} onChange={e => setForm({...form, venue: e.target.value})} className="border p-2 w-full" />
        <button type="submit" className="bg-primary text-primary-foreground px-4 py-2 rounded">Save</button>
      </form>
    </div>
  );
}