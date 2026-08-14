// app/study/cgpa/courses/page.tsx
"use client";

import { useEffect, useState } from "react";
import { apiGet, apiPost, apiPatch, apiDelete } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton";
import { Plus, Pencil, Trash2, X } from "lucide-react";
import type { CGPACourse, CGPACourseInput } from "@/types/study";

const emptyCourse: CGPACourseInput = { name: "", code: "", creditHours: 3, grade: "A", semester: "" };
const gradeOptions = ["A+", "A", "A-", "B+", "B", "B-", "C+", "C", "C-", "D+", "D", "F"];

export default function CoursesPage() {
  const [courses, setCourses] = useState<CGPACourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Add/edit state
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyCourse);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const fetchCourses = async () => {
    setLoading(true);
    try {
      const data = await apiGet("/cgpa/courses");
      setCourses(data.data || data || []);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchCourses(); }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const payload = { ...form, creditHours: Number(form.creditHours) };
    try {
      if (editingId) {
        await apiPatch(`/cgpa/courses/${editingId}`, payload);
      } else {
        await apiPost("/cgpa/courses", payload);
      }
      setShowForm(false);
      setEditingId(null);
      setForm(emptyCourse);
      fetchCourses();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
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
    try {
      await apiDelete(`/cgpa/courses/${id}`);
      fetchCourses();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      setError(err.message);
    }
  };

  if (loading) return <LoadingSkeleton count={3} height="h-16" radius="rounded-xl" />;
  if (error) {
    return (
      <div className="bg-destructive/5 border border-destructive/20 rounded-xl p-6 text-destructive">
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Courses</h1>
        <Button onClick={() => { setShowForm(true); setEditingId(null); setForm(emptyCourse); }}>
          <Plus className="w-4 h-4 mr-2" />
          Add Course
        </Button>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-2xl border border-border w-full max-w-md p-6 shadow-xl">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">{editingId ? "Edit Course" : "New Course"}</h2>
              <Button variant="ghost" size="icon" onClick={() => setShowForm(false)}>
                <X className="w-4 h-4" />
              </Button>
            </div>
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <Label htmlFor="code">Course Code *</Label>
                <Input
                  id="code"
                  value={form.code}
                  onChange={(e) => setForm({ ...form, code: e.target.value })}
                  placeholder="e.g., MATH101"
                  required
                />
              </div>
              <div>
                <Label htmlFor="name">Course Name *</Label>
                <Input
                  id="name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g., Calculus I"
                  required
                />
              </div>
              <div>
                <Label htmlFor="creditHours">Credit Hours *</Label>
                <Input
                  id="creditHours"
                  type="number"
                  min={1}
                  max={6}
                  value={form.creditHours}
                  onChange={(e) => setForm({ ...form, creditHours: Number(e.target.value) })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="grade">Grade *</Label>
                <Select
                  value={form.grade}
                  onValueChange={(val) => setForm({ ...form, grade: val })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {gradeOptions.map((g) => (
                      <SelectItem key={g} value={g}>{g}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="semester">Semester (optional)</Label>
                <Input
                  id="semester"
                  value={form.semester}
                  onChange={(e) => setForm({ ...form, semester: e.target.value })}
                  placeholder="e.g., Fall 2024"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <Button type="submit" disabled={saving}>
                  {saving ? "Saving..." : editingId ? "Update" : "Create"}
                </Button>
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {courses.length === 0 ? (
        <div className="bg-card rounded-xl border border-dashed p-12 text-center">
          <p className="text-muted-foreground">No courses added. Add your first course to start tracking CGPA.</p>
        </div>
      ) : (
        <div className="bg-card rounded-xl border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left p-3">Code</th>
                <th className="text-left p-3">Name</th>
                <th className="text-left p-3">Credits</th>
                <th className="text-left p-3">Grade</th>
                <th className="text-left p-3">Semester</th>
                <th className="text-right p-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {courses.map((c) => (
                <tr key={c.id} className="hover:bg-muted/30">
                  <td className="p-3">{c.code}</td>
                  <td className="p-3">{c.name}</td>
                  <td className="p-3">{c.creditHours}</td>
                  <td className="p-3 font-medium">{c.grade}</td>
                  <td className="p-3 text-muted-foreground">{c.semester || "—"}</td>
                  <td className="p-3 text-right">
                    <Button variant="ghost" size="icon" onClick={() => startEdit(c)}>
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(c.id)} className="text-destructive hover:text-destructive/80">
                      <Trash2 className="w-4 h-4" />
                    </Button>
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