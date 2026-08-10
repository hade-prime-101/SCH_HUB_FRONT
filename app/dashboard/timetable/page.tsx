"use client";

import { useState, useEffect, useMemo } from "react";
import BackButton from "@/components/shared/BackButton";
import BottomNav from "@/components/shared/BottomNav";
import {
  Filter,
  CalendarDays,
  Plus,
  Pencil,
  Trash2,
  X,
  AlertTriangle,
  Loader2,
  MapPin,
  Clock,
  RefreshCw,
  BookOpen,
  FlaskConical,
  Users,
  FileText,
  ClipboardList,
  Repeat,
  ChevronRight,
  Zap,
} from "lucide-react";
import { schoolApi } from "@/lib/api/school";

// ─── Types ────────────────────────────────────────────────────────────────────

type TimetableType = "PERSONAL" | "DEPARTMENTAL" | "GENERAL";
type EntryType = "LECTURE" | "PRACTICAL" | "SEMINAR" | "EXAM" | "TEST";

interface TimetableEntry {
  id: string;
  courseCode: string;
  courseTitle: string;
  venue: string;
  dayOfWeek: number; // 0=Sun … 6=Sat
  startTime: string; // "HH:MM"
  endTime: string;
  type: EntryType;
  timetableType: TimetableType;
  isRecurring: boolean;
}

interface EntryFormData {
  courseCode: string;
  courseTitle: string;
  venue: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  type: EntryType;
  isRecurring: boolean;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const DAY_INDEX: Record<string, number> = {
  Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6,
};

const TABS: { label: string; value: TimetableType; icon: React.ElementType }[] = [
  { label: "Personal", value: "PERSONAL",     icon: BookOpen },
  { label: "Dept",     value: "DEPARTMENTAL", icon: Users },
  { label: "General",  value: "GENERAL",      icon: CalendarDays },
];

// Each type: accent bar color, badge colors, icon
const TYPE_CONFIG: Record<EntryType, {
  bar: string;
  badge: string;
  bg: string;
  text: string;
  icon: React.ElementType;
}> = {
  LECTURE:   { bar: "bg-primary",             badge: "bg-accent text-primary",             bg: "bg-accent/30",        text: "text-primary",      icon: BookOpen },
  PRACTICAL: { bar: "bg-emerald-500",          badge: "bg-emerald-100 text-emerald-700",    bg: "bg-emerald-50",       text: "text-emerald-700",  icon: FlaskConical },
  SEMINAR:   { bar: "bg-amber-500",            badge: "bg-amber-100 text-amber-700",        bg: "bg-amber-50",         text: "text-amber-700",    icon: Users },
  EXAM:      { bar: "bg-destructive",          badge: "bg-destructive/15 text-destructive", bg: "bg-destructive/5",    text: "text-destructive",  icon: FileText },
  TEST:      { bar: "bg-orange-500",           badge: "bg-orange-100 text-orange-700",      bg: "bg-orange-50",        text: "text-orange-700",   icon: ClipboardList },
};

const ENTRY_TYPES: EntryType[] = ["LECTURE", "PRACTICAL", "SEMINAR", "EXAM", "TEST"];

const DEFAULT_FORM: EntryFormData = {
  courseCode: "", courseTitle: "", venue: "",
  dayOfWeek: 1, startTime: "08:00", endTime: "10:00",
  type: "LECTURE", isRecurring: true,
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt12(time: string) {
  const [h, m] = time.split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  const hour = h % 12 || 12;
  return `${hour}:${String(m).padStart(2, "0")} ${ampm}`;
}

function durationMins(start: string, end: string) {
  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);
  return (eh * 60 + em) - (sh * 60 + sm);
}

function fmtDuration(mins: number) {
  if (mins < 60) return `${mins}m`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m ? `${h}h ${m}m` : `${h}h`;
}

function hasConflict(entry: TimetableEntry, all: TimetableEntry[]) {
  return all.some(
    (o) => o.id !== entry.id &&
      o.dayOfWeek === entry.dayOfWeek &&
      entry.startTime < o.endTime &&
      entry.endTime > o.startTime,
  );
}

// Returns minutes since midnight for "now" — used for today timeline highlight
function nowMins() {
  const d = new Date();
  return d.getHours() * 60 + d.getMinutes();
}

function isToday(dayLabel: string) {
  const idx = new Date().getDay(); // 0=Sun
  return DAY_INDEX[dayLabel] === idx;
}

// ─── Next-class banner ────────────────────────────────────────────────────────

function NextClassBanner({ entries }: { entries: TimetableEntry[] }) {
  const todayIdx = new Date().getDay();
  const todayEntries = entries
    .filter(e => e.dayOfWeek === todayIdx)
    .sort((a, b) => a.startTime.localeCompare(b.startTime));

  const now = nowMins();
  // Find a class happening now or next upcoming
  const current = todayEntries.find(e => {
    const [sh, sm] = e.startTime.split(":").map(Number);
    const [eh, em] = e.endTime.split(":").map(Number);
    return now >= sh * 60 + sm && now < eh * 60 + em;
  });
  const next = !current ? todayEntries.find(e => {
    const [sh, sm] = e.startTime.split(":").map(Number);
    return sh * 60 + sm > now;
  }) : null;

  const featured = current ?? next;
  if (!featured) return null;

  const cfg = TYPE_CONFIG[featured.type];
  const TypeIcon = cfg.icon;
  const isOngoing = !!current;

  const [sh, sm] = featured.startTime.split(":").map(Number);
  const startMins = sh * 60 + sm;
  const minsUntil = startMins - now;

  return (
    <div className={`mx-6 mb-5 rounded-3xl overflow-hidden shadow-sm`}>
      <div className={`${cfg.bg} border border-border/40 rounded-3xl p-5 relative`}>
        {/* Label */}
        <div className="flex items-center gap-2 mb-3">
          {isOngoing ? (
            <span className="flex items-center gap-1.5 bg-emerald-500 text-white text-xs font-bold px-2.5 py-1 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
              Ongoing
            </span>
          ) : (
            <span className="flex items-center gap-1.5 bg-primary/10 text-primary text-xs font-bold px-2.5 py-1 rounded-full">
              <Zap className="w-3 h-3" />
              {minsUntil <= 60 ? `In ${minsUntil}m` : `Next up · ${fmt12(featured.startTime)}`}
            </span>
          )}
        </div>

        <div className="flex items-start gap-3">
          <div className={`w-12 h-12 rounded-2xl ${cfg.badge} flex items-center justify-center shrink-0`}>
            <TypeIcon className="w-6 h-6" />
          </div>
          <div className="flex-1 min-w-0">
            <p className={`text-xl font-extrabold ${cfg.text} leading-tight`}>
              {featured.courseCode}
            </p>
            {featured.courseTitle && (
              <p className="text-sm text-muted-foreground truncate">{featured.courseTitle}</p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-4 mt-4 flex-wrap">
          <span className="flex items-center gap-1.5 text-sm text-foreground font-medium">
            <Clock className="w-4 h-4 text-muted-foreground" />
            {fmt12(featured.startTime)} – {fmt12(featured.endTime)}
          </span>
          <span className="flex items-center gap-1.5 text-sm text-foreground font-medium">
            <MapPin className="w-4 h-4 text-muted-foreground" />
            {featured.venue}
          </span>
        </div>
      </div>
    </div>
  );
}

// ─── Class card (timeline style) ──────────────────────────────────────────────

function ClassCard({
  item,
  allEntries,
  isPersonal,
  isLast,
  onEdit,
  onDelete,
  deletingId,
}: {
  item: TimetableEntry;
  allEntries: TimetableEntry[];
  isPersonal: boolean;
  isLast: boolean;
  onEdit: (item: TimetableEntry) => void;
  onDelete: (id: string) => void;
  deletingId: string | null;
}) {
  const conflict = hasConflict(item, allEntries);
  const cfg = TYPE_CONFIG[item.type];
  const TypeIcon = cfg.icon;
  const dur = durationMins(item.startTime, item.endTime);
  const deleting = deletingId === item.id;

  // Check if class is currently happening (only meaningful for today)
  const now = nowMins();
  const [sh, sm] = item.startTime.split(":").map(Number);
  const [eh, em] = item.endTime.split(":").map(Number);
  const ongoing = now >= sh * 60 + sm && now < eh * 60 + em;
  const past    = now >= eh * 60 + em;

  return (
    <div className={`flex gap-3 transition-opacity ${deleting ? "opacity-40 pointer-events-none" : ""}`}>
      {/* Timeline rail */}
      <div className="flex flex-col items-center pt-1 shrink-0" style={{ width: 40 }}>
        <div className={`w-3 h-3 rounded-full border-2 shrink-0 ${
          ongoing ? "border-primary bg-primary" :
          past    ? "border-muted-foreground bg-muted-foreground" :
                    "border-border bg-card"
        }`} />
        {!isLast && <div className="w-0.5 flex-1 mt-1 bg-border" />}
      </div>

      {/* Card body */}
      <div className={`flex-1 mb-4 rounded-2xl overflow-hidden shadow-sm border ${
        conflict ? "border-destructive" : "border-border/50"
      } ${past ? "opacity-60" : ""}`}>
        {/* Colored top accent bar */}
        <div className={`h-1 w-full ${conflict ? "bg-destructive" : cfg.bar}`} />

        <div className={`p-4 ${conflict ? "bg-destructive/5" : "bg-card"}`}>
          {/* Conflict warning */}
          {conflict && (
            <div className="flex items-center gap-1.5 mb-2 text-destructive text-xs font-bold">
              <AlertTriangle className="w-3.5 h-3.5" />
              Time conflict with another class
            </div>
          )}

          {/* Top row */}
          <div className="flex items-start justify-between gap-2 mb-3">
            <div className="flex items-center gap-2.5">
              <div className={`w-9 h-9 rounded-xl ${cfg.badge} flex items-center justify-center shrink-0`}>
                <TypeIcon className="w-4 h-4" />
              </div>
              <div>
                <p className={`font-extrabold text-lg leading-tight ${conflict ? "text-destructive" : cfg.text}`}>
                  {item.courseCode}
                </p>
                {item.courseTitle && (
                  <p className="text-muted-foreground text-xs leading-tight truncate max-w-[160px]">
                    {item.courseTitle}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <span className={`text-xs font-bold px-2.5 py-1 rounded-lg ${cfg.badge}`}>
                {item.type}
              </span>
              {isPersonal && (
                <>
                  <button
                    onClick={() => onEdit(item)}
                    aria-label="Edit entry"
                    className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center text-muted-foreground active:scale-90 transition"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => onDelete(item.id)}
                    aria-label="Delete entry"
                    className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center text-muted-foreground active:scale-90 transition"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Details row */}
          <div className="flex items-center gap-3 flex-wrap">
            <span className="flex items-center gap-1 text-sm font-semibold text-foreground">
              <Clock className="w-3.5 h-3.5 text-muted-foreground" />
              {fmt12(item.startTime)} – {fmt12(item.endTime)}
            </span>
            <span className="bg-muted text-muted-foreground text-xs font-semibold px-2 py-0.5 rounded-lg">
              {fmtDuration(dur)}
            </span>
            <span className="flex items-center gap-1 text-sm text-muted-foreground">
              <MapPin className="w-3.5 h-3.5" />
              {item.venue}
            </span>
            {item.isRecurring && (
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <Repeat className="w-3 h-3" /> Weekly
              </span>
            )}
          </div>

          {/* Ongoing progress bar */}
          {ongoing && (
            <div className="mt-3">
              <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full transition-all"
                  style={{
                    width: `${Math.min(100, ((now - (sh * 60 + sm)) / dur) * 100)}%`,
                  }}
                />
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {dur - (now - (sh * 60 + sm))}m remaining
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Entry modal ──────────────────────────────────────────────────────────────

function EntryModal({
  initial,
  activeDay,
  onSave,
  onClose,
  saving,
}: {
  initial: EntryFormData | null;
  activeDay: string;
  onSave: (data: EntryFormData) => void;
  onClose: () => void;
  saving: boolean;
}) {
  const [form, setForm] = useState<EntryFormData>(
    initial ?? { ...DEFAULT_FORM, dayOfWeek: DAY_INDEX[activeDay] ?? 1 },
  );

  function set<K extends keyof EntryFormData>(key: K, val: EntryFormData[K]) {
    setForm(prev => ({ ...prev, [key]: val }));
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/50"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="w-full max-w-lg bg-card rounded-t-3xl pb-10 flex flex-col max-h-[92vh] overflow-y-auto animate-in slide-in-from-bottom-4 duration-300">
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-1 shrink-0">
          <div className="w-10 h-1 rounded-full bg-border" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 shrink-0 border-b border-border">
          <div>
            <h2 className="text-xl font-bold text-foreground">
              {initial ? "Edit Class" : "Add Class"}
            </h2>
            <p className="text-muted-foreground text-xs mt-0.5">
              {initial ? "Update the details below" : "Fill in your class details"}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-muted flex items-center justify-center"
            aria-label="Close"
          >
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        <div className="px-6 py-5 flex flex-col gap-5">
          {/* Course code + title */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-1.5 block">
                Course Code <span className="text-destructive">*</span>
              </label>
              <input
                value={form.courseCode}
                onChange={e => set("courseCode", e.target.value.toUpperCase())}
                placeholder="CSC301"
                className="w-full rounded-xl bg-muted border border-border px-4 py-3 text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-1.5 block">
                Type
              </label>
              <div className="relative">
                <select
                  value={form.type}
                  onChange={e => set("type", e.target.value as EntryType)}
                  className="w-full rounded-xl bg-muted border border-border px-4 py-3 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 appearance-none"
                >
                  {ENTRY_TYPES.map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Course title */}
          <div>
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-1.5 block">
              Course Title
            </label>
            <input
              value={form.courseTitle}
              onChange={e => set("courseTitle", e.target.value)}
              placeholder="e.g. Data Structures & Algorithms"
              className="w-full rounded-xl bg-muted border border-border px-4 py-3 text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>

          {/* Venue */}
          <div>
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-1.5 block">
              Venue <span className="text-destructive">*</span>
            </label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                value={form.venue}
                onChange={e => set("venue", e.target.value)}
                placeholder="e.g. LT 3, Engineering Block"
                className="w-full rounded-xl bg-muted border border-border pl-9 pr-4 py-3 text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
          </div>

          {/* Day picker */}
          <div>
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-2 block">
              Day <span className="text-destructive">*</span>
            </label>
            <div className="flex gap-2">
              {DAYS.map(d => (
                <button
                  key={d}
                  type="button"
                  onClick={() => set("dayOfWeek", DAY_INDEX[d])}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition ${
                    form.dayOfWeek === DAY_INDEX[d]
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>

          {/* Times */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-1.5 block">
                Start Time <span className="text-destructive">*</span>
              </label>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="time"
                  value={form.startTime}
                  onChange={e => set("startTime", e.target.value)}
                  className="w-full rounded-xl bg-muted border border-border pl-9 pr-4 py-3 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
            </div>
            <div>
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-1.5 block">
                End Time <span className="text-destructive">*</span>
              </label>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="time"
                  value={form.endTime}
                  onChange={e => set("endTime", e.target.value)}
                  className="w-full rounded-xl bg-muted border border-border pl-9 pr-4 py-3 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
            </div>
          </div>

          {/* Recurring toggle */}
          <button
            type="button"
            onClick={() => set("isRecurring", !form.isRecurring)}
            className={`flex items-center justify-between rounded-2xl px-4 py-3.5 border-2 transition ${
              form.isRecurring
                ? "border-primary bg-accent"
                : "border-border bg-muted"
            }`}
          >
            <div className="flex items-center gap-3">
              <Repeat className={`w-5 h-5 ${form.isRecurring ? "text-primary" : "text-muted-foreground"}`} />
              <div className="text-left">
                <p className={`text-sm font-semibold ${form.isRecurring ? "text-primary" : "text-foreground"}`}>
                  Recurring weekly
                </p>
                <p className="text-xs text-muted-foreground">Repeats every week on this day</p>
              </div>
            </div>
            <div className={`w-11 h-6 rounded-full transition-colors ${form.isRecurring ? "bg-primary" : "bg-muted-foreground/30"}`}>
              <div className={`w-5 h-5 rounded-full bg-white shadow mt-0.5 transition-transform ${form.isRecurring ? "translate-x-5 ml-0.5" : "translate-x-0.5"}`} />
            </div>
          </button>

          {/* Save */}
          <button
            onClick={() => onSave(form)}
            disabled={saving || !form.courseCode || !form.venue}
            className="w-full rounded-2xl bg-primary text-primary-foreground font-bold py-4 disabled:opacity-50 flex items-center justify-center gap-2 transition active:opacity-90 mt-1"
          >
            {saving
              ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving…</>
              : initial ? "Save Changes" : "Add to Timetable"
            }
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function TimetablePage() {
  const [activeDay, setActiveDay]     = useState("Mon");
  const [activeTab, setActiveTab]     = useState<TimetableType>("PERSONAL");
  const [entries, setEntries]         = useState<TimetableEntry[]>([]);
  const [loading, setLoading]         = useState(true);
  const [refreshing, setRefreshing]   = useState(false);
  const [error, setError]             = useState<string | null>(null);
  const [showModal, setShowModal]     = useState(false);
  const [editTarget, setEditTarget]   = useState<TimetableEntry | null>(null);
  const [saving, setSaving]           = useState(false);
  const [deletingId, setDeletingId]   = useState<string | null>(null);
  const [showFilter, setShowFilter]   = useState(false);
  const [filterType, setFilterType]   = useState<EntryType | "ALL">("ALL");
  const [lastSynced, setLastSynced]   = useState<Date | null>(null);

  const POLL_INTERVAL = 60_000;

  async function fetchEntries(tab: TimetableType, silent = false) {
    if (!silent) setLoading(true);
    else setRefreshing(true);
    setError(null);
    try {
      const data = await schoolApi.getTimetable(tab);
      setEntries(data ?? []);
      setLastSynced(new Date());
    } catch (e: any) {
      setError(e.message || "Failed to load timetable.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  // Set today on client to avoid SSR hydration mismatch
  useEffect(() => {
    const idx = new Date().getDay();
    const label = DAYS.find(d => DAY_INDEX[d] === idx) ?? "Mon";
    setActiveDay(label);
  }, []);

  useEffect(() => {
    fetchEntries(activeTab);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  useEffect(() => {
    if (activeTab === "PERSONAL") return;
    const id = setInterval(() => fetchEntries(activeTab, true), POLL_INTERVAL);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  // Count classes per day for the weekly dots
  const classesByDay = useMemo(() => {
    const map: Record<string, number> = {};
    DAYS.forEach(d => {
      map[d] = entries.filter(e => e.dayOfWeek === DAY_INDEX[d]).length;
    });
    return map;
  }, [entries]);

  const dayEntries = entries
    .filter(e => e.dayOfWeek === DAY_INDEX[activeDay])
    .filter(e => filterType === "ALL" || e.type === filterType)
    .sort((a, b) => a.startTime.localeCompare(b.startTime));

  const totalWeek = entries.length;

  async function handleSave(form: EntryFormData) {
    setSaving(true);
    try {
      if (editTarget) {
        const updated = await schoolApi.updateTimetableEntry(editTarget.id, {
          ...form, timetableType: "PERSONAL",
        });
        setEntries(prev => prev.map(e => e.id === editTarget.id ? { ...e, ...updated } : e));
      } else {
        const created = await schoolApi.createTimetableEntry({
          ...form, timetableType: "PERSONAL",
        });
        setEntries(prev => [...prev, created]);
      }
      setShowModal(false);
      setEditTarget(null);
    } catch (e: any) {
      alert(e.message || "Failed to save entry.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this class?")) return;
    setDeletingId(id);
    try {
      await schoolApi.deleteTimetableEntry(id);
      setEntries(prev => prev.filter(e => e.id !== id));
    } catch (e: any) {
      alert(e.message || "Failed to delete entry.");
    } finally {
      setDeletingId(null);
    }
  }

  function openAdd()                  { setEditTarget(null); setShowModal(true); }
  function openEdit(item: TimetableEntry) { setEditTarget(item); setShowModal(true); }

  const isPersonal = activeTab === "PERSONAL";

  // Current date number for each day pill
  const today = new Date();
  const weekStart = new Date(today);
  weekStart.setDate(today.getDate() - ((today.getDay() + 6) % 7)); // Monday

  function dayDate(label: string): number {
    const offset = DAYS.indexOf(label);
    const d = new Date(weekStart);
    d.setDate(weekStart.getDate() + offset);
    return d.getDate();
  }

  return (
    <div className="min-h-screen w-full bg-muted pb-28">

      {/* ── Header ── */}
      <div className="bg-card px-6 pt-6 pb-5 border-b border-border">
        <div className="flex items-start justify-between mb-1">
          <BackButton href="/dashboard" />
          <div className="flex items-center gap-2">
            {activeTab !== "PERSONAL" && (
              <button
                onClick={() => fetchEntries(activeTab, true)}
                disabled={refreshing}
                aria-label="Refresh timetable"
                className="w-9 h-9 rounded-full bg-muted flex items-center justify-center"
              >
                <RefreshCw className={`w-4 h-4 text-muted-foreground ${refreshing ? "animate-spin" : ""}`} />
              </button>
            )}
            <button
              onClick={() => setShowFilter(v => !v)}
              className={`w-9 h-9 rounded-full flex items-center justify-center transition ${
                showFilter || filterType !== "ALL"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground"
              }`}
              aria-label="Filter"
            >
              <Filter className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="mt-4">
          <h1 className="text-3xl font-extrabold text-foreground">Timetable</h1>
          <div className="flex items-center gap-3 mt-1 flex-wrap">
            <p className="text-muted-foreground text-sm">
              {totalWeek} class{totalWeek !== 1 ? "es" : ""} this week
            </p>
            {lastSynced && activeTab !== "PERSONAL" && (
              <p className="text-muted-foreground text-xs">
                · Synced {lastSynced.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </p>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mt-4">
          {TABS.map(tab => {
            const TabIcon = tab.icon;
            const active = activeTab === tab.value;
            return (
              <button
                key={tab.value}
                onClick={() => setActiveTab(tab.value)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold transition ${
                  active
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                <TabIcon className="w-3.5 h-3.5" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Filter panel ── */}
      {showFilter && (
        <div className="bg-card border-b border-border px-6 py-3 flex gap-2 flex-wrap">
          {(["ALL", ...ENTRY_TYPES] as const).map(t => (
            <button
              key={t}
              onClick={() => setFilterType(t)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                filterType === t
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {t === "ALL" ? "All Types" : t}
            </button>
          ))}
        </div>
      )}

      {/* ── Day selector ── */}
      <div className="bg-card px-4 py-3 flex gap-2 border-b border-border overflow-x-auto scrollbar-none">
        {DAYS.map(day => {
          const active  = day === activeDay;
          const todayDot = isToday(day);
          const count   = classesByDay[day] ?? 0;
          return (
            <button
              key={day}
              onClick={() => setActiveDay(day)}
              className={`flex flex-col items-center gap-1 flex-shrink-0 w-12 py-2 rounded-2xl transition ${
                active
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground"
              }`}
            >
              <span className="text-xs font-semibold">{day}</span>
              <span className={`text-base font-extrabold leading-tight ${
                active ? "text-primary-foreground" : todayDot ? "text-primary" : "text-foreground"
              }`}>
                {dayDate(day)}
              </span>
              {/* Dot: class count */}
              <div className="flex gap-0.5">
                {Array.from({ length: Math.min(count, 3) }).map((_, i) => (
                  <span
                    key={i}
                    className={`w-1 h-1 rounded-full ${
                      active ? "bg-primary-foreground/70" : "bg-primary"
                    }`}
                  />
                ))}
                {count === 0 && <span className="w-1 h-1 rounded-full bg-transparent" />}
              </div>
            </button>
          );
        })}
      </div>

      {/* ── Content ── */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 gap-3">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
          <p className="text-muted-foreground text-sm">Loading timetable…</p>
        </div>
      ) : error ? (
        <div className="mx-6 mt-6 flex flex-col items-center gap-3 bg-destructive/10 rounded-3xl p-6">
          <AlertTriangle className="w-8 h-8 text-destructive" />
          <p className="text-destructive font-medium text-center text-sm">{error}</p>
          <button
            onClick={() => fetchEntries(activeTab)}
            className="flex items-center gap-2 text-primary text-sm font-semibold"
          >
            <RefreshCw className="w-4 h-4" /> Try again
          </button>
        </div>
      ) : (
        <div className="mt-5">
          {/* Next-class banner (only on today's day) */}
          {isToday(activeDay) && <NextClassBanner entries={entries} />}

          {dayEntries.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 gap-3 px-6">
              <div className="w-20 h-20 rounded-full bg-accent flex items-center justify-center">
                <CalendarDays className="w-9 h-9 text-primary" />
              </div>
              <p className="font-bold text-foreground text-lg">
                No classes on {activeDay}
              </p>
              <p className="text-muted-foreground text-sm text-center max-w-xs">
                {isPersonal
                  ? "You haven't added any classes for this day yet."
                  : "No classes scheduled by your department for this day."
                }
              </p>
              {isPersonal && (
                <button
                  onClick={openAdd}
                  className="flex items-center gap-2 bg-primary text-primary-foreground font-semibold rounded-2xl px-5 py-3 mt-1 text-sm"
                >
                  <Plus className="w-4 h-4" /> Add a class
                </button>
              )}
            </div>
          ) : (
            <div className="px-6">
              {/* Day summary pill */}
              <div className="flex items-center gap-2 mb-4">
                <span className="text-foreground font-bold text-base">
                  {isToday(activeDay) ? "Today" : activeDay}
                </span>
                <span className="bg-primary/10 text-primary text-xs font-bold px-2.5 py-1 rounded-full">
                  {dayEntries.length} class{dayEntries.length !== 1 ? "es" : ""}
                </span>
              </div>

              {/* Timeline list */}
              {dayEntries.map((item, idx) => (
                <ClassCard
                  key={item.id}
                  item={item}
                  allEntries={entries.filter(e => e.dayOfWeek === DAY_INDEX[activeDay])}
                  isPersonal={isPersonal}
                  isLast={idx === dayEntries.length - 1}
                  onEdit={openEdit}
                  onDelete={handleDelete}
                  deletingId={deletingId}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── FAB ── */}
      {isPersonal && !loading && (
        <button
          onClick={openAdd}
          className="fixed bottom-24 right-6 w-14 h-14 rounded-full bg-primary shadow-lg shadow-primary/30 flex items-center justify-center transition active:scale-95"
          aria-label="Add class"
        >
          <Plus className="w-7 h-7 text-primary-foreground" />
        </button>
      )}

      {/* ── Modal ── */}
      {showModal && (
        <EntryModal
          initial={
            editTarget
              ? {
                  courseCode:  editTarget.courseCode,
                  courseTitle: editTarget.courseTitle,
                  venue:       editTarget.venue,
                  dayOfWeek:   editTarget.dayOfWeek,
                  startTime:   editTarget.startTime,
                  endTime:     editTarget.endTime,
                  type:        editTarget.type,
                  isRecurring: editTarget.isRecurring,
                }
              : null
          }
          activeDay={activeDay}
          onSave={handleSave}
          onClose={() => { setShowModal(false); setEditTarget(null); }}
          saving={saving}
        />
      )}

      <BottomNav />
    </div>
  );
}
