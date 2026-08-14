"use client";

import { useState } from "react";
import { usePaginatedQuery } from "@/lib/hooks/usePaginatedQuery";
import {
  listReminders,
  createReminder,
  updateReminder,
  deleteReminder,
  completeReminder,
} from "@/lib/api/reminders.api";
import type { Reminder, CreateReminderPayload } from "@/types/reminders";
import { PageHeader } from "@/components/shared/PageHeader";
import { LoadingState, EmptyState } from "@/components/shared/DashboardPrimitives";
import { ErrorState } from "@/components/shared/ErrorState";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Pagination } from "@/components/ui/Pagination";

export default function RemindersPage() {
  const [page, setPage] = useState(1);
  const limit = 10;
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<CreateReminderPayload>({
    title: "",
    description: "",
    dueDate: "",
  });

  const { data, total, loading, error, refetch } = usePaginatedQuery<Reminder>(
    ({ page, limit }) => listReminders({ page, limit }),
    { page, limit }
  );

  const handleSave = async () => {
    if (editingId) {
      await updateReminder(editingId, form);
    } else {
      await createReminder(form);
    }
    setShowForm(false);
    setEditingId(null);
    setForm({ title: "", description: "", dueDate: "" });
    refetch();
  };

  const handleEdit = (r: Reminder) => {
    setForm({ title: r.title, description: r.description || "", dueDate: r.dueDate });
    setEditingId(r.id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    await deleteReminder(id);
    refetch();
  };

  const handleComplete = async (id: string) => {
    await completeReminder(id);
    refetch();
  };

  if (loading) return <LoadingState label="Loading reminders" />;
  if (error) return <ErrorState title="Failed to load reminders" description={error.message} onRetry={refetch} />;

  return (
    <div className="max-w-3xl mx-auto p-4 md:p-6">
      <PageHeader
        title="Reminders"
        description="Keep track of your tasks"
        actions={
          <Button
            onClick={() => {
              setShowForm(true);
              setEditingId(null);
              setForm({ title: "", description: "", dueDate: "" });
            }}
          >
            New Reminder
          </Button>
        }
      />

      {!data || data.length === 0 ? (
        <EmptyState>No reminders.</EmptyState>
      ) : (
        <>
          <div className="space-y-2 mt-4">
            {data.map((r) => (
              <Card
                key={r.id}
                compact
                className={r.isCompleted ? "opacity-70" : ""}
              >
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                  <div>
                    <p className={`font-medium ${r.isCompleted ? "line-through" : ""}`}>
                      {r.title}
                    </p>
                    {r.description && (
                      <p className="text-sm text-muted-foreground">{r.description}</p>
                    )}
                    <p className="text-xs text-muted-foreground/70">
                      Due: {new Date(r.dueDate).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex gap-2 shrink-0 flex-wrap">
                    {!r.isCompleted && (
                      <Button variant="outline" size="xs" onClick={() => handleComplete(r.id)}>
                        Complete
                      </Button>
                    )}
                    <Button variant="ghost" size="xs" onClick={() => handleEdit(r)}>
                      Edit
                    </Button>
                    <Button variant="destructive" size="xs" onClick={() => handleDelete(r.id)}>
                      Delete
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {total > limit && (
            <Pagination
              currentPage={page}
              totalPages={Math.ceil(total / limit)}
              onPageChange={setPage}
              showPageNumber
            />
          )}
        </>
      )}

      {/* Form modal – unchanged for simplicity */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md p-6">
            <h2 className="text-lg font-semibold mb-4">
              {editingId ? "Edit" : "Create"} Reminder
            </h2>
            <div className="space-y-3">
              <Input
                placeholder="Title"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                required
              />
              <Input
                placeholder="Description (optional)"
                value={form.description || ""}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
              <Input
                type="datetime-local"
                value={form.dueDate}
                onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
                required
              />
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" onClick={() => setShowForm(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSave}>Save</Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}