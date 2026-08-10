"use client";

import { useState, useEffect } from "react";
import BackButton from "@/components/shared/BackButton";
import BottomNav from "@/components/shared/BottomNav";
import Link from "next/link";
import {
  Bell,
  Plus,
  FileEdit,
  GraduationCap,
  Briefcase,
  Microscope,
  MoreHorizontal,
  Home,
  CalendarDays,
  CheckCircle2,
  Users,
  User,
  X,
  Loader2,
  AlertTriangle,
  HelpCircle,
  Trash2,
  Pencil,
  Calendar,
} from "lucide-react";
import { remindersApi } from "@/lib/api/planner";

const PLANNER_NAV = [
  { icon: Calendar,     label: "Today",     href: "/dashboard/planner" },
  { icon: CalendarDays, label: "Weekly",    href: "/dashboard/planner/weekly" },
  { icon: Bell,         label: "Reminders", href: "/dashboard/planner/reminders", active: true },
];

// ─── Types ────────────────────────────────────────────────────────────────────

type Priority = "HIGH" | "MEDIUM" | "LOW";
type Category = "ASSIGNMENT" | "EXAM" | "TEST" | "PROJECT" | "PRACTICAL" | "OTHER";
type StatusFilter = "All" | "Active" | "Completed";
type PriorityFilter = "All priorities" | "HIGH" | "MEDIUM" | "LOW";

interface Reminder {
  id: string;
  title: string;
  description?: string;
  dueDate: string;
  notifyAt?: string;
  priority: Priority;
  category: Category;
  isCompleted: boolean;
  isRecurring: boolean;
  recurringDays?: number[];
}

interface ReminderFormData {
  title: string;
  description: string;
  dueDate: string;
  notifyAt: string;
  priority: Priority;
  category: Category;
  isRecurring: boolean;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const CATEGORY_ICONS: Record<Category, React.ElementType> = {
  ASSIGNMENT: FileEdit,
  EXAM:       GraduationCap,
  TEST:       GraduationCap,
  PROJECT:    Briefcase,
  PRACTICAL:  Microscope,
  OTHER:      HelpCircle,
};

const PRIORITY_STYLES: Record<Priority, { badge: string; dot: string }> = {
  HIGH:   { badge: "border-destructive text-destructive",   dot: "bg-destructive" },
  MEDIUM: { badge: "border-amber-400 text-amber-600",       dot: "bg-amber-400" },
  LOW:    { badge: "border-emerald-400 text-emerald-600",   dot: "bg-emerald-400" },
};

const CATEGORIES: Category[] = ["ASSIGNMENT", "EXAM", "TEST", "PROJECT", "PRACTICAL", "OTHER"];
const PRIORITIES: Priority[]  = ["HIGH", "MEDIUM", "LOW"];
const STATUS_FILTERS: StatusFilter[]   = ["All", "Active", "Completed"];
const PRIORITY_FILTERS: PriorityFilter[] = ["All priorities", "HIGH", "MEDIUM", "LOW"];

const DEFAULT_FORM: ReminderFormData = {
  title:       "",
  description: "",
  dueDate:     "",
  notifyAt:    "",
  priority:    "MEDIUM",
  category:    "ASSIGNMENT",
  isRecurring: false,
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtDate(iso: string) {
  if (!iso) return "";
  return new Date(iso).toLocaleString([], {
    weekday: "short", month: "short", day: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

function toLocalDatetimeInput(iso: string) {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

// ─── Reminder Card ────────────────────────────────────────────────────────────

function ReminderCard({
  item,
  onToggle,
  onEdit,
  onDelete,
  toggling,
  deleting,
}: {
  item: Reminder;
  onToggle: (id: string) => void;
  onEdit: (item: Reminder) => void;
  onDelete: (id: string) => void;
  toggling: boolean;
  deleting: boolean;
}) {
  const Icon = CATEGORY_ICONS[item.category];
  const ps   = PRIORITY_STYLES[item.priority];
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div
      className={`rounded-2xl border border-border bg-card p-5 transition ${
        deleting ? "opacity-40 pointer-events-none" : ""
      }`}
    >
      <div className="flex items-start gap-3">
        {/* Category icon */}
        <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center shrink-0">
          <Icon className="w-5 h-5 text-foreground" />
        </div>

        {/* Checkbox */}
        <button
          onClick={() => onToggle(item.id)}
          disabled={toggling}
          aria-label={item.isCompleted ? "Mark incomplete" : "Mark complete"}
          className={`w-6 h-6 rounded-md flex items-center justify-center shrink-0 mt-1 border-2 transition ${
            item.isCompleted
              ? "bg-primary border-primary"
              : "border-border hover:border-primary"
          } ${toggling ? "opacity-50" : ""}`}
        >
          {item.isCompleted && <span className="text-primary-foreground text-xs font-bold">✓</span>}
        </button>

        {/* Title */}
        <h3
          className={`flex-1 font-bold text-lg leading-tight ${
            item.isCompleted ? "line-through text-muted-foreground" : "text-foreground"
          }`}
        >
          {item.title}
        </h3>

        {/* More menu */}
        <div className="relative shrink-0">
          <button
            onClick={() => setMenuOpen((v) => !v)}
            className="text-muted-foreground hover:text-foreground transition"
            aria-label="More options"
          >
            <MoreHorizontal className="w-5 h-5" />
          </button>
          {menuOpen && (
            <div className="absolute right-0 top-7 z-10 bg-card border border-border rounded-xl shadow-lg py-1 min-w-[130px]">
              <button
                onClick={() => { onEdit(item); setMenuOpen(false); }}
                className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-foreground hover:bg-muted transition"
              >
                <Pencil className="w-4 h-4" /> Edit
              </button>
              <button
                onClick={() => { onDelete(item.id); setMenuOpen(false); }}
                className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-destructive hover:bg-destructive/10 transition"
              >
                <Trash2 className="w-4 h-4" /> Delete
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Description */}
      {item.description && (
        <p className="text-sm text-muted-foreground mt-2 ml-[3.25rem]">
          {item.description}
        </p>
      )}

      {/* Meta row */}
      <div className="flex items-center gap-2 mt-3 ml-[3.25rem] flex-wrap">
        <span className={`text-sm ${item.isCompleted ? "text-muted-foreground" : "text-foreground"}`}>
          {fmtDate(item.dueDate)}
        </span>
        <span className={`text-xs font-bold border rounded-lg px-2.5 py-1 ${ps.badge}`}>
          {item.priority}
        </span>
        <span className="text-xs font-bold border border-border rounded-lg px-2.5 py-1 text-muted-foreground">
          {item.category}
        </span>
        {item.isRecurring && (
          <span className="text-xs font-bold border border-ring rounded-lg px-2.5 py-1 text-primary">
            Recurring
          </span>
        )}
      </div>
    </div>
  );
}

// ─── Add / Edit Modal ─────────────────────────────────────────────────────────

function ReminderModal({
  initial,
  onSave,
  onClose,
  saving,
  saveError,
}: {
  initial: ReminderFormData | null;
  onSave: (data: ReminderFormData) => void;
  onClose: () => void;
  saving: boolean;
  saveError: string | null;
}) {
  const [form, setForm] = useState<ReminderFormData>(initial ?? DEFAULT_FORM);

  function set<K extends keyof ReminderFormData>(key: K, val: ReminderFormData[K]) {
    setForm((prev) => ({ ...prev, [key]: val }));
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40">
      <div className="w-full max-w-lg bg-card rounded-t-3xl p-6 pb-10 flex flex-col gap-4 max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-foreground">
            {initial ? "Edit Reminder" : "Add Reminder"}
          </h2>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-muted flex items-center justify-center text-muted-foreground"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Save error */}
        {saveError && (
          <div className="flex items-center gap-3 bg-destructive/10 rounded-2xl px-4 py-3">
            <AlertTriangle className="w-4 h-4 text-destructive shrink-0" />
            <p className="text-sm text-destructive">{saveError}</p>
          </div>
        )}

        {/* Title */}
        <div>
          <label className="text-sm font-medium text-foreground mb-1 block">
            Title <span className="text-destructive">*</span>
          </label>
          <input
            value={form.title}
            onChange={(e) => set("title", e.target.value)}
            placeholder="e.g. Submit CSC301 Assignment"
            className="w-full rounded-xl bg-muted border border-border px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        {/* Description */}
        <div>
          <label className="text-sm font-medium text-foreground mb-1 block">
            Description
          </label>
          <textarea
            value={form.description}
            onChange={(e) => set("description", e.target.value)}
            placeholder="Optional notes…"
            rows={2}
            className="w-full rounded-xl bg-muted border border-border px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
          />
        </div>

        {/* Due date */}
        <div>
          <label className="text-sm font-medium text-foreground mb-1 block">
            Due Date <span className="text-destructive">*</span>
          </label>
          <input
            type="datetime-local"
            value={form.dueDate}
            onChange={(e) => set("dueDate", e.target.value)}
            className="w-full rounded-xl bg-muted border border-border px-4 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        {/* Notify at */}
        <div>
          <label className="text-sm font-medium text-foreground mb-1 block">
            Notify me at
          </label>
          <input
            type="datetime-local"
            value={form.notifyAt}
            onChange={(e) => set("notifyAt", e.target.value)}
            className="w-full rounded-xl bg-muted border border-border px-4 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        {/* Category */}
        <div>
          <label className="text-sm font-medium text-foreground mb-2 block">Category</label>
          <div className="flex gap-2 flex-wrap">
            {CATEGORIES.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => set("category", c)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                  form.category === c
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        {/* Priority */}
        <div>
          <label className="text-sm font-medium text-foreground mb-2 block">Priority</label>
          <div className="flex gap-2">
            {PRIORITIES.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => set("priority", p)}
                className={`flex-1 py-2 rounded-xl text-xs font-bold border-2 transition ${
                  form.priority === p
                    ? `${PRIORITY_STYLES[p].badge} bg-muted`
                    : "border-border text-muted-foreground"
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        {/* Recurring */}
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={form.isRecurring}
            onChange={(e) => set("isRecurring", e.target.checked)}
            className="w-5 h-5 rounded accent-primary"
          />
          <span className="text-sm font-medium text-foreground">Recurring weekly</span>
        </label>

        {/* Save */}
        <button
          onClick={() => onSave(form)}
          disabled={saving || !form.title.trim() || !form.dueDate}
          title={
            !form.title.trim()
              ? "Please enter a title"
              : !form.dueDate
              ? "Please select a due date"
              : undefined
          }
          className="w-full rounded-2xl bg-primary text-primary-foreground font-semibold py-4 mt-2 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition"
        >
          {saving && <Loader2 className="w-4 h-4 animate-spin" />}
          {saving ? "Saving…" : initial ? "Save Changes" : "Add Reminder"}
        </button>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function PlannerPage() {
  const [reminders, setReminders]         = useState<Reminder[]>([]);
  const [loading, setLoading]             = useState(true);
  const [error, setError]                 = useState<string | null>(null);
  const [statusFilter, setStatusFilter]   = useState<StatusFilter>("All");
  const [priorityFilter, setPriorityFilter] = useState<PriorityFilter>("All priorities");
  const [showModal, setShowModal]         = useState(false);
  const [editTarget, setEditTarget]       = useState<Reminder | null>(null);
  const [saving, setSaving]               = useState(false);
  const [saveError, setSaveError]         = useState<string | null>(null);
  const [togglingId, setTogglingId]       = useState<string | null>(null);
  const [deletingId, setDeletingId]       = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await remindersApi.getReminders({ limit: "50" });
      // API may return { data: [...] } or plain array
      setReminders(Array.isArray(res) ? res : (res?.data ?? []));
    } catch (e: any) {
      setError(e.message || "Failed to load reminders.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  // ── Filtering ──
  const filtered = reminders
    .filter((r) => {
      if (statusFilter === "Active")    return !r.isCompleted;
      if (statusFilter === "Completed") return  r.isCompleted;
      return true;
    })
    .filter((r) => {
      if (priorityFilter === "All priorities") return true;
      return r.priority === priorityFilter;
    });

  const pending   = reminders.filter((r) => !r.isCompleted).length;
  const completed = reminders.filter((r) =>  r.isCompleted).length;

  // ── Toggle complete ──
  async function handleToggle(id: string) {
    const item = reminders.find((r) => r.id === id);
    if (!item) return;
    setTogglingId(id);
    try {
      if (!item.isCompleted) {
        await remindersApi.completeReminder(id);
        setReminders((prev) =>
          prev.map((r) => (r.id === id ? { ...r, isCompleted: true } : r)),
        );
      } else {
        // un-complete via PATCH
        await remindersApi.updateReminder(id, { isCompleted: false });
        setReminders((prev) =>
          prev.map((r) => (r.id === id ? { ...r, isCompleted: false } : r)),
        );
      }
    } catch (e: any) {
      setError(e.message || "Failed to update reminder.");
    } finally {
      setTogglingId(null);
    }
  }

  // ── Save (create / update) ──
  async function handleSave(form: ReminderFormData) {
    // Client-side validation
    if (!form.title.trim()) {
      setSaveError("Title is required.");
      return;
    }
    if (!form.dueDate) {
      setSaveError("Due date is required.");
      return;
    }

    setSaving(true);
    setSaveError(null);
    try {
      const payload = {
        ...form,
        title: form.title.trim(),
        description: form.description.trim(),
        dueDate:  new Date(form.dueDate).toISOString(),
        // notifyAt is required by the backend — default to dueDate if not set
        notifyAt: form.notifyAt
          ? new Date(form.notifyAt).toISOString()
          : new Date(form.dueDate).toISOString(),
      };
      if (editTarget) {
        const updated = await remindersApi.updateReminder(editTarget.id, payload);
        setReminders((prev) =>
          prev.map((r) => (r.id === editTarget.id ? { ...r, ...updated } : r)),
        );
      } else {
        const created = await remindersApi.createReminder(payload);
        setReminders((prev) => [created, ...prev]);
      }
      setShowModal(false);
      setEditTarget(null);
      setSaveError(null);
    } catch (e: any) {
      setSaveError(e.message || "Failed to save reminder.");
    } finally {
      setSaving(false);
    }
  }

  // ── Delete ──
  async function handleDelete(id: string) {
    if (!confirm("Delete this reminder?")) return;
    setDeletingId(id);
    try {
      await remindersApi.deleteReminder(id);
      setReminders((prev) => prev.filter((r) => r.id !== id));
    } catch (e: any) {
      setError(e.message || "Failed to delete reminder.");
    } finally {
      setDeletingId(null);
    }
  }

  function openAdd() {
    setEditTarget(null);
    setSaveError(null);
    setShowModal(true);
  }

  function openEdit(item: Reminder) {
    setEditTarget(item);
    setSaveError(null);
    setShowModal(true);
  }

  return (
    <div className="min-h-screen w-full bg-background px-6 py-8 pb-24">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <BackButton href="/dashboard" />
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-foreground flex items-center justify-center shrink-0">
            <Bell className="w-5 h-5 text-background" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Reminders</h1>
            <p className="text-muted-foreground text-sm">
              Personal academic reminders
            </p>
          </div>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-1.5 bg-foreground text-background rounded-xl px-4 py-2.5 font-semibold shrink-0 transition active:scale-95"
        >
          <Plus className="w-4 h-4" /> Add
        </button>
      </div>

      {/* Planner sub-nav */}
      <div className="flex justify-center gap-3 mb-6">
        {PLANNER_NAV.map(({ icon: Icon, label, href, active }) => (
          <Link
            key={label}
            href={href}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold transition ${
              active
                ? "bg-primary text-primary-foreground"
                : "text-primary hover:bg-accent"
            }`}
          >
            <Icon className="w-4 h-4" />
            {label}
          </Link>
        ))}
      </div>

      {/* Summary chips */}
      {!loading && !error && (
        <div className="flex gap-3 mb-6">
          <div className="flex-1 rounded-2xl bg-card border border-border p-4 text-center">
            <p className="text-2xl font-bold text-primary">{pending}</p>
            <p className="text-xs text-muted-foreground mt-0.5">Pending</p>
          </div>
          <div className="flex-1 rounded-2xl bg-card border border-border p-4 text-center">
            <p className="text-2xl font-bold text-foreground">{completed}</p>
            <p className="text-xs text-muted-foreground mt-0.5">Completed</p>
          </div>
          <div className="flex-1 rounded-2xl bg-card border border-border p-4 text-center">
            <p className="text-2xl font-bold text-foreground">{reminders.length}</p>
            <p className="text-xs text-muted-foreground mt-0.5">Total</p>
          </div>
        </div>
      )}

      {/* Status filter */}
      <div className="flex gap-2 mb-4">
        {STATUS_FILTERS.map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`rounded-xl px-4 py-2.5 font-semibold border transition ${
              statusFilter === s
                ? "bg-muted border-border text-foreground"
                : "border-border text-muted-foreground"
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      {/* Priority filter */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {PRIORITY_FILTERS.map((p) => (
          <button
            key={p}
            onClick={() => setPriorityFilter(p)}
            className={`rounded-xl px-4 py-2 text-sm font-semibold border transition ${
              priorityFilter === p
                ? "bg-muted border-border text-foreground"
                : "border-border text-muted-foreground"
            }`}
          >
            {p}
          </button>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <AlertTriangle className="w-10 h-10 text-destructive" />
          <p className="text-destructive font-medium text-center">{error}</p>
          <button
            onClick={load}
            className="text-primary text-sm font-semibold underline"
          >
            Retry
          </button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-2">
          <Bell className="w-10 h-10 text-muted-foreground" />
          <p className="text-muted-foreground font-medium">No reminders found</p>
          <button
            onClick={openAdd}
            className="text-primary text-sm font-semibold underline mt-1"
          >
            Add one
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {filtered.map((item) => (
            <ReminderCard
              key={item.id}
              item={item}
              onToggle={handleToggle}
              onEdit={openEdit}
              onDelete={handleDelete}
              toggling={togglingId === item.id}
              deleting={deletingId === item.id}
            />
          ))}
        </div>
      )}

      {/* FAB */}
      <button
        onClick={openAdd}
        className="fixed bottom-24 right-6 w-14 h-14 rounded-full bg-foreground shadow-lg flex items-center justify-center transition active:scale-95 z-40"
        aria-label="Add reminder"
      >
        <Plus className="w-7 h-7 text-background" />
      </button>

      {/* Modal */}
      {showModal && (
        <ReminderModal
          initial={
            editTarget
              ? {
                  title:       editTarget.title,
                  description: editTarget.description ?? "",
                  dueDate:     toLocalDatetimeInput(editTarget.dueDate),
                  notifyAt:    toLocalDatetimeInput(editTarget.notifyAt ?? ""),
                  priority:    editTarget.priority,
                  category:    editTarget.category,
                  isRecurring: editTarget.isRecurring,
                }
              : null
          }
          onSave={handleSave}
          onClose={() => { setShowModal(false); setEditTarget(null); setSaveError(null); }}
          saving={saving}
          saveError={saveError}
        />
      )}

      {/* Bottom nav */}
      <BottomNav />
    </div>
  );
}
