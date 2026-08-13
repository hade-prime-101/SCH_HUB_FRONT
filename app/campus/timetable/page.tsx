"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Pencil, Trash2, MapPin } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton";
import { ErrorMessage } from "@/components/ui/ErrorMessage";
import BackButton from "@/components/shared/BackButton";
import {
  getTimetable,
  createTimetableEntry,
  updateTimetableEntry,
  deleteTimetableEntry,
} from "@/lib/api/school.api";
import type { TimetableEntry, CreateTimetableEntryPayload } from "@/types/school";

export default function TimetablePage() {
  const router = useRouter();
  const [entries, setEntries] = useState<TimetableEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<CreateTimetableEntryPayload>({
    courseName: "",
    day: "MONDAY",
    startTime: "",
    endTime: "",
    venue: "",
    lecturer: "",
    type: "",
  });

  const refresh = async () => {
    try {
      setLoading(true);
      const data = await getTimetable();
      setEntries(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load timetable");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  const handleSave = async () => {
    try {
      if (editingId) {
        await updateTimetableEntry(editingId, formData);
      } else {
        await createTimetableEntry(formData);
      }
      resetForm();
      refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save entry");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this class?")) return;
    try {
      await deleteTimetableEntry(id);
      refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete");
    }
  };

  const handleEdit = (entry: TimetableEntry) => {
    setFormData({
      courseName: entry.courseName,
      day: entry.day,
      startTime: entry.startTime,
      endTime: entry.endTime,
      venue: entry.venue || "",
      lecturer: entry.lecturer || "",
      type: entry.type || "",
    });
    setEditingId(entry.id);
    setShowForm(true);
  };

  const resetForm = () => {
    setFormData({
      courseName: "",
      day: "MONDAY",
      startTime: "",
      endTime: "",
      venue: "",
      lecturer: "",
      type: "",
    });
    setEditingId(null);
    setShowForm(false);
  };

  const days = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY"];

  if (error) return <ErrorMessage message={error} />;

  return (
    <div className="min-h-screen bg-muted pb-24">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-card border-b border-border px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <BackButton variant="icon" />
          <h1 className="text-xl font-bold text-foreground">Timetable</h1>
        </div>
        <Button onClick={() => { resetForm(); setShowForm(true); }}>
          <Plus className="w-4 h-4 mr-2" />
          Add Class
        </Button>
      </div>

      {/* Content */}
      <div className="px-4 py-6 max-w-3xl mx-auto space-y-4">
        {loading ? (
          <LoadingSkeleton count={4} height="h-20" />
        ) : entries.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              <p>No classes added yet.</p>
              <Button variant="link" onClick={() => setShowForm(true)}>
                Add your first class
              </Button>
            </CardContent>
          </Card>
        ) : (
          entries.map((entry) => (
            <Card key={entry.id} compact>
              <div className="flex items-start gap-3">
                <div className="w-14 h-14 rounded-xl bg-category-timetable-bg text-category-timetable flex flex-col items-center justify-center font-bold text-xs shrink-0">
                  <span className="text-sm">{entry.startTime.slice(0, 2)}</span>
                  <span className="text-[10px]">{entry.startTime.slice(3)}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-foreground">{entry.courseName}</p>
                  <p className="text-sm text-muted-foreground">
                    {entry.startTime} – {entry.endTime} · {entry.venue || "TBA"}
                    {entry.lecturer && ` · ${entry.lecturer}`}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {entry.day} {entry.type && `· ${entry.type}`}
                  </p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  {entry.venue && (
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      onClick={() =>
                        router.push(`/campus/map?q=${encodeURIComponent(entry.venue)}`)
                      }
                    >
                      <MapPin className="w-4 h-4" />
                    </Button>
                  )}
                  <Button variant="ghost" size="icon-xs" onClick={() => handleEdit(entry)}>
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="destructive"
                    size="icon-xs"
                    onClick={() => handleDelete(entry.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Form Drawer (full‑page on mobile) */}
      {showForm && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-end justify-center md:items-center">
          <Card className="w-full max-w-md max-h-[90vh] overflow-y-auto rounded-t-2xl md:rounded-2xl">
            <div className="p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold">
                  {editingId ? "Edit Class" : "Add Class"}
                </h3>
                <Button variant="ghost" size="icon" onClick={resetForm}>
                  <X className="w-5 h-5" />
                </Button>
              </div>
              <div className="space-y-3">
                <Input
                  label="Course Name"
                  value={formData.courseName}
                  onChange={(e) =>
                    setFormData({ ...formData, courseName: e.target.value })
                  }
                  required
                />
                <div>
                  <label className="block text-sm font-medium mb-1">Day</label>
                  <select
                    className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-primary"
                    value={formData.day}
                    onChange={(e) =>
                      setFormData({ ...formData, day: e.target.value })
                    }
                  >
                    {days.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Input
                    label="Start Time"
                    type="time"
                    value={formData.startTime}
                    onChange={(e) =>
                      setFormData({ ...formData, startTime: e.target.value })
                    }
                    required
                  />
                  <Input
                    label="End Time"
                    type="time"
                    value={formData.endTime}
                    onChange={(e) =>
                      setFormData({ ...formData, endTime: e.target.value })
                    }
                    required
                  />
                </div>
                <Input
                  label="Venue (optional)"
                  value={formData.venue || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, venue: e.target.value })
                  }
                />
                <Input
                  label="Lecturer (optional)"
                  value={formData.lecturer || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, lecturer: e.target.value })
                  }
                />
                <Input
                  label="Type (optional)"
                  value={formData.type || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, type: e.target.value })
                  }
                />
              </div>
              <div className="flex gap-3 pt-2">
                <Button variant="outline" onClick={resetForm} className="flex-1">
                  Cancel
                </Button>
                <Button onClick={handleSave} className="flex-1">
                  Save
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}