// app/dashboard/study/cgpa/courses/page.tsx
"use client";

import { useEffect, useState } from "react";
import { apiGet, apiPost, apiPatch, apiDelete } from "@/lib/api";
import type { CGPACourse, CGPACourseInput } from "@/types/study";

const emptyCourse: CGPACourseInput = { name: "", code: "", creditHours: 3, grade: "A", semester: "" };

export default function CoursesPage() {
  const [courses, setCourses] = useState<CGPACourse[]>([]);
  const [loading, setLoading] = useState(true);

  // Add/edit state
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyCourse);
  const [editingId, setEditingId] = useState<string | null>(null);

  const fetchCourses = async () => {
    setLoading(true);
    const data = await apiGet("/cgpa/courses");
    setCourses(data.data || data);
    setLoading(false);
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = { ...form, creditHours: Number(form.creditHours) };
    if (editingId) {
      await apiPatch(`/cgpa/courses/${editingId}`, payload);
    } else {
      await apiPost("/cgpa/courses", payload);
    }
    setShowForm(false);
    setEditingId(null);
    setForm(emptyCourse);
    fetchCourses();
  };

  const startEdit = (course: CGPACourse) => {
    setForm({
      name: course.name,
      code: course.code,
      creditHours: course.creditHours,
      grade: course.grade,
      semester: course.semester || "",
    });
    setEditingId(course.id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this course?")) return;
    await apiDelete(`/cgpa/courses/${id}`);
    fetchCourses();
  };

  if (loading) return <p>Loading courses...</p>;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Courses</h1>
        <button
          onClick={() => { setShowForm(true); setEditingId(null); setForm(emptyCourse); }}
          className="bg-primary text-primary-foreground px-4 py-2 rounded"
        >
          Add Course
        </button>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-card rounded p-6 w-full max-w-md">
            <h2 className="text-lg font-semibold mb-4">
              {editingId ? "Edit Course" : "New Course"}
            </h2>
            <form onSubmit={handleSave} className="space-y-4">
              <input
                type="text" placeholder="Course Code" value={form.code}
                onChange={e => setForm({ ...form, code: e.target.value })}
                className="border p-2 w-full" required
              />
              <input
                type="text" placeholder="Course Name" value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
                className="border p-2 w-full" required
              />
              <input
                type="number" min={1} max={6} value={form.creditHours}
                onChange={e => setForm({ ...form, creditHours: Number(e.target.value) })}
                className="border p-2 w-full" required
              />
              <select
                value={form.grade}
                onChange={e => setForm({ ...form, grade: e.target.value })}
                className="border p-2 w-full"
              >
                {["A+", "A", "A-", "B+", "B", "B-", "C+", "C", "C-", "D+", "D", "F"].map(g => (
                  <option key={g} value={g}>{g}</option>
                ))}
              </select>
              <input
                type="text" placeholder="Semester (optional)" value={form.semester}
                onChange={e => setForm({ ...form, semester: e.target.value })}
                className="border p-2 w-full"
              />
              <div className="flex justify-end space-x-2">
                <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 bg-secondary/50 rounded">
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 bg-primary text-primary-foreground rounded">
                  {editingId ? "Update" : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {courses.length === 0 ? (
        <p className="text-muted-foreground">No courses. Add one to start.</p>
      ) : (
        <div className="bg-card shadow rounded overflow-hidden">
          <table className="w-full">
            <thead className="bg-muted">
              <tr>
                <th className="text-left p-3">Code</th>
                <th className="text-left p-3">Name</th>
                <th className="text-left p-3">Credits</th>
                <th className="text-left p-3">Grade</th>
                <th className="text-right p-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {courses.map((c) => (
                <tr key={c.id} className="hover:bg-muted">
                  <td className="p-3">{c.code}</td>
                  <td className="p-3">{c.name}</td>
                  <td className="p-3">{c.creditHours}</td>
                  <td className="p-3 font-medium">{c.grade}</td>
                  <td className="p-3 text-right">
                    <button
                      onClick={() => startEdit(c)}
                      className="text-primary hover:underline mr-3"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(c.id)}
                      className="text-red-600 hover:underline"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}