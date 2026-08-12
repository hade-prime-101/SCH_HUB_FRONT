// app/dashboard/admin/school/timetable/page.tsx
"use client";
import { useEffect, useState } from "react";
import {
  getTimetable,
  createTimetableEntry,
  updateTimetableEntry,
  deleteTimetableEntry,
} from "@/lib/api/school.api";
import type { TimetableEntry, CreateTimetableEntryPayload } from "@/types/school";

export default function AdminTimetablePage() {
  const [entries, setEntries] = useState<TimetableEntry[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<CreateTimetableEntryPayload>({
    courseName: "", day: "", startTime: "", endTime: "", venue: "", lecturer: "", type: ""
  });

  const refresh = () => getTimetable().then(setEntries);
  useEffect(() => { refresh(); }, []);

  const handleSave = async () => {
    if (editingId) {
      await updateTimetableEntry(editingId, form);
    } else {
      await createTimetableEntry(form);
    }
    setShowForm(false);
    setEditingId(null);
    setForm({ courseName: "", day: "", startTime: "", endTime: "", venue: "", lecturer: "", type: "" });
    refresh();
  };

  const handleEdit = (e: TimetableEntry) => {
    setForm({
      courseName: e.courseName, day: e.day, startTime: e.startTime,
      endTime: e.endTime, venue: e.venue || "", lecturer: e.lecturer || "", type: e.type || ""
    });
    setEditingId(e.id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    await deleteTimetableEntry(id);
    refresh();
  };

  return (
    <div>
      <div className="flex justify-between mb-4">
        <h1 className="text-2xl font-bold">Manage Timetable</h1>
        <button onClick={() => {
          setShowForm(true); setEditingId(null);
          setForm({ courseName: "", day: "", startTime: "", endTime: "", venue: "", lecturer: "", type: "" });
        }} className="bg-blue-600 text-white px-4 py-2 rounded">
          Add Entry
        </button>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white rounded p-6 w-96">
            <h2 className="text-lg font-semibold mb-4">{editingId ? "Edit" : "New"} Entry</h2>
            <div className="space-y-2">
              <input type="text" placeholder="Course Name" value={form.courseName} onChange={e => setForm({...form, courseName: e.target.value})} className="border p-2 w-full" />
              <select value={form.day} onChange={e => setForm({...form, day: e.target.value})} className="border p-2 w-full">
                <option value="">Select Day</option>
                {['MONDAY','TUESDAY','WEDNESDAY','THURSDAY','FRIDAY'].map(d => <option key={d} value={d}>{d}</option>)}
              </select>
              <input type="time" value={form.startTime} onChange={e => setForm({...form, startTime: e.target.value})} className="border p-2 w-full" />
              <input type="time" value={form.endTime} onChange={e => setForm({...form, endTime: e.target.value})} className="border p-2 w-full" />
              <input type="text" placeholder="Venue" value={form.venue || ""} onChange={e => setForm({...form, venue: e.target.value})} className="border p-2 w-full" />
              <input type="text" placeholder="Lecturer" value={form.lecturer || ""} onChange={e => setForm({...form, lecturer: e.target.value})} className="border p-2 w-full" />
              <input type="text" placeholder="Type" value={form.type || ""} onChange={e => setForm({...form, type: e.target.value})} className="border p-2 w-full" />
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <button onClick={() => setShowForm(false)} className="bg-gray-200 px-4 py-2 rounded">Cancel</button>
              <button onClick={handleSave} className="bg-green-600 text-white px-4 py-2 rounded">Save</button>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white shadow rounded overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="p-2 text-left">Course</th>
              <th className="p-2 text-left">Day</th>
              <th className="p-2 text-left">Time</th>
              <th className="p-2 text-left">Venue</th>
              <th className="p-2 text-left">Lecturer</th>
              <th className="p-2 text-left">Type</th>
              <th className="p-2 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {entries.map(e => (
              <tr key={e.id} className="border-t">
                <td className="p-2">{e.courseName}</td>
                <td className="p-2">{e.day}</td>
                <td className="p-2">{e.startTime} - {e.endTime}</td>
                <td className="p-2">{e.venue}</td>
                <td className="p-2">{e.lecturer}</td>
                <td className="p-2">{e.type}</td>
                <td className="p-2 text-right">
                  <button onClick={() => handleEdit(e)} className="text-blue-600 mr-2">Edit</button>
                  <button onClick={() => handleDelete(e.id)} className="text-red-600">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}