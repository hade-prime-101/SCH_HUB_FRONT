// app/dashboard/reminders/page.tsx
"use client";
import { useEffect, useState } from "react";
import {
  listReminders,
  createReminder,
  updateReminder,
  deleteReminder,
  completeReminder,
} from "@/lib/api/reminders.api";
import type { Reminder, CreateReminderPayload } from "@/types/reminders";

export default function RemindersPage() {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 10;
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<CreateReminderPayload>({
    title: "",
    description: "",
    dueDate: "",
  });

  const fetchReminders = () => {
    listReminders({ page, limit }).then((res) => {
      setReminders(res.data);
      setTotal(res.total);
    });
  };

  useEffect(() => {
    fetchReminders();
  }, [page]);

  const handleSave = async () => {
    if (editingId) {
      await updateReminder(editingId, form);
    } else {
      await createReminder(form);
    }
    setShowForm(false);
    setEditingId(null);
    setForm({ title: "", description: "", dueDate: "" });
    fetchReminders();
  };

  const handleEdit = (r: Reminder) => {
    setForm({ title: r.title, description: r.description || "", dueDate: r.dueDate });
    setEditingId(r.id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    await deleteReminder(id);
    fetchReminders();
  };

  const handleComplete = async (id: string) => {
    await completeReminder(id);
    fetchReminders();
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Reminders</h1>
        <button
          onClick={() => {
            setShowForm(true);
            setEditingId(null);
            setForm({ title: "", description: "", dueDate: "" });
          }}
          className="bg-blue-600 text-white px-4 py-2 rounded"
        >
          New Reminder
        </button>
      </div>

      {/* Form modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white rounded p-6 w-96">
            <h2 className="text-lg font-semibold mb-4">
              {editingId ? "Edit" : "Create"} Reminder
            </h2>
            <input
              type="text"
              placeholder="Title"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="border p-2 w-full mb-2"
            />
            <textarea
              placeholder="Description (optional)"
              value={form.description || ""}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="border p-2 w-full mb-2"
            />
            <input
              type="datetime-local"
              value={form.dueDate}
              onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
              className="border p-2 w-full mb-4"
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowForm(false)}
                className="bg-gray-200 px-4 py-2 rounded"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="bg-green-600 text-white px-4 py-2 rounded"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reminder list */}
      {reminders.length === 0 ? (
        <p className="text-gray-500">No reminders.</p>
      ) : (
        <ul className="space-y-2">
          {reminders.map((r) => (
            <li
              key={r.id}
              className={`p-3 rounded border flex justify-between items-start ${
                r.isCompleted ? "bg-gray-50 opacity-70" : "bg-white"
              }`}
            >
              <div>
                <p className={`font-medium ${r.isCompleted ? "line-through" : ""}`}>
                  {r.title}
                </p>
                {r.description && (
                  <p className="text-sm text-gray-600">{r.description}</p>
                )}
                <p className="text-xs text-gray-400">
                  Due: {new Date(r.dueDate).toLocaleString()}
                </p>
              </div>
              <div className="flex gap-2 text-sm">
                {!r.isCompleted && (
                  <button
                    onClick={() => handleComplete(r.id)}
                    className="text-green-600 hover:underline"
                  >
                    Complete
                  </button>
                )}
                <button
                  onClick={() => handleEdit(r)}
                  className="text-blue-600 hover:underline"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(r.id)}
                  className="text-red-600 hover:underline"
                >
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {/* Pagination */}
      {total > limit && (
        <div className="flex justify-between mt-6">
          <button
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
            className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50"
          >
            Previous
          </button>
          <span className="text-sm">
            Page {page} of {Math.ceil(total / limit)}
          </span>
          <button
            disabled={page * limit >= total}
            onClick={() => setPage((p) => p + 1)}
            className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}