"use client";

import { useState, useEffect, useCallback } from "react";
import { usePathname } from "next/navigation";
import BackButton from "@/components/shared/BackButton";
import BottomNav from "@/components/shared/BottomNav";
import Link from "next/link";
import {
  ChevronLeft,
  ChevronRight,
  Home,
  CalendarDays,
  CheckCircle2,
  Users,
  User,
  Clock,
  Calendar,
  Bell,
  BookOpen,
  Loader2,
  AlertTriangle,
} from "lucide-react";
import { plannerApi, remindersApi } from "@/lib/api/planner";

// ─── Types ────────────────────────────────────────────────────────────────────

type SourceType = "TIMETABLE" | "REMINDER" | "EVENT" | "DEPT_REMINDER";

interface PlannerItem {
  id: string;
  title: string;
  sourceType: SourceType;
  sourceId: string;
  date: string;
  startTime?: string;
  endTime?: string;
  isAllDay: boolean;
  isDone: boolean;
  subtitle?: string; // venue / location enrichment
}

// ─── Constants ────────────────────────────────────────────────────────────────

const SOURCE_CONFIG: Record<
  SourceType,
  { icon: React.ElementType; badge: string; dot: string; emoji: string }
> = {
  TIMETABLE:     { icon: BookOpen,  badge: "bg-accent text-primary",          dot: "bg-primary",     emoji: "📅" },
  REMINDER:      { icon: Bell,      badge: "bg-amber-100 text-amber-600",      dot: "bg-amber-400",   emoji: "⏰" },
  DEPT_REMINDER: { icon: Bell,      badge: "bg-amber-100 text-amber-600",      dot: "bg-amber-400",   emoji: "⏰" },
  EVENT:         { icon: Calendar,  badge: "bg-emerald-100 text-emerald-600",  dot: "bg-emerald-400", emoji: "🎉" },
};

const SOURCE_LABEL: Record<SourceType, string> = {
  TIMETABLE:     "Class",
  REMINDER:      "Reminder",
  DEPT_REMINDER: "Dept",
  EVENT:         "Event",
};

const PLANNER_NAV = [
  { icon: Calendar,      label: "Today",     href: "/dashboard/planner" },
  { icon: CalendarDays,  label: "Weekly",    href: "/dashboard/planner/weekly" },
  { icon: Bell,          label: "Reminders", href: "/dashboard/planner/reminders" },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt12(time: string) {
  const [h, m] = time.split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  return `${h % 12 || 12}:${String(m).padStart(2, "0")} ${ampm}`;
}

function fmtHeaderDate(date: Date) {
  return date.toLocaleDateString([], { weekday: "short", month: "short", day: "numeric" });
}

function toDateKey(date: Date) {
  return date.toISOString().split("T")[0];
}

function isNowBetween(prev?: PlannerItem, next?: PlannerItem, now: Date = new Date()) {
  const nowStr = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
  const prevEnd = prev?.endTime ?? prev?.startTime;
  const nextStart = next?.startTime;
  if (!prevEnd || !nextStart) return false;
  return nowStr >= prevEnd && nowStr <= nextStart;
}

// ─── Timeline Item ────────────────────────────────────────────────────────────

function TimelineItem({
  item,
  isToday,
  onToggle,
  toggling,
}: {
  item: PlannerItem;
  isToday: boolean;
  onToggle: (id: string, sourceType: SourceType) => void;
  toggling: boolean;
}) {
  const cfg = SOURCE_CONFIG[item.sourceType];
  const isReminder = item.sourceType === "REMINDER" || item.sourceType === "DEPT_REMINDER";
  const highlight = isReminder && !item.isDone && isToday;

  return (
    <div className="relative">
      {/* Time label */}
      {item.startTime && (
        <span className="absolute -left-[3.9rem] top-4 text-sm text-muted-foreground w-12 text-right">
          {fmt12(item.startTime)}
        </span>
      )}
      {/* Timeline dot */}
      <span
        className={`absolute -left-[1.55rem] top-5 w-2.5 h-2.5 rounded-full ${cfg.dot}`}
      />

      {/* Card */}
      <div
        className={`rounded-2xl p-4 transition ${
          highlight
            ? "bg-accent border-l-4 border-primary"
            : "bg-card"
        } ${toggling ? "opacity-50" : ""}`}
      >
        <div className="flex items-start justify-between gap-2">
          <p
            className={`font-semibold text-lg flex items-center gap-2 flex-1 leading-tight ${
              item.isDone ? "line-through text-muted-foreground" : "text-foreground"
            }`}
          >
            <span>{cfg.emoji}</span>
            {item.title}
          </p>

          {isReminder ? (
            /* Checkbox for reminders */
            <button
              onClick={() => onToggle(item.id, item.sourceType)}
              disabled={toggling}
              aria-label={item.isDone ? "Mark incomplete" : "Mark complete"}
              className={`w-7 h-7 rounded-lg border-2 flex items-center justify-center shrink-0 transition ${
                item.isDone
                  ? "bg-emerald-500 border-emerald-500"
                  : "border-border hover:border-primary"
              }`}
            >
              {item.isDone && <span className="text-white text-sm font-bold">✓</span>}
            </button>
          ) : (
            /* Badge for classes/events */
            <span className={`text-sm font-medium rounded-lg px-3 py-1 shrink-0 ${cfg.badge}`}>
              {SOURCE_LABEL[item.sourceType]}
            </span>
          )}
        </div>

        {/* Subtitle */}
        {item.subtitle && (
          <p className={`text-sm mt-1 ${item.isDone ? "line-through text-muted-foreground/50" : "text-muted-foreground"}`}>
            {item.subtitle}
          </p>
        )}

        {/* End time + badge row for reminders */}
        <div className="flex items-center gap-2 mt-2 flex-wrap">
          {item.endTime && item.startTime && (
            <span className="text-xs text-muted-foreground">
              {fmt12(item.startTime)} – {fmt12(item.endTime)}
            </span>
          )}
          {isReminder && (
            <span className={`text-sm font-medium rounded-lg px-3 py-1 ${cfg.badge}`}>
              {SOURCE_LABEL[item.sourceType]}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Now Indicator ────────────────────────────────────────────────────────────

function NowIndicator() {
  const now = new Date();
  const time = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  return (
    <div className="relative flex items-center">
      <span className="absolute -left-[4.1rem] text-destructive text-xs font-bold w-12 text-right">
        {time}
      </span>
      <span className="absolute -left-[1.65rem] w-3 h-3 rounded-full bg-destructive border-2 border-background" />
      <div className="w-full h-px bg-destructive" />
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function PlannerTodayPage() {
  const pathname                  = usePathname();
  const [date, setDate]           = useState(new Date());
  const [items, setItems]         = useState<PlannerItem[]>([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const isToday = toDateKey(date) === toDateKey(new Date());

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      let data: PlannerItem[];
      if (isToday) {
        const raw = await plannerApi.getToday() as any;
        data = Array.isArray(raw) ? raw : (raw?.items ?? raw?.agenda ?? []);
        data = Array.isArray(data) ? data : [];
      } else {
        // For non-today dates use weekly view and filter by date
        const offset = Math.round(
          (date.getTime() - new Date().getTime()) / (7 * 24 * 60 * 60 * 1000),
        );
        const raw = await plannerApi.getWeekly(offset) as any;
        const weekly: PlannerItem[] = Array.isArray(raw) ? raw : (raw?.items ?? raw?.agenda ?? []);
        const key = toDateKey(date);
        data = weekly.filter((i) => i.date === key);
      }
      // Sort by startTime, all-day items first
      if (!Array.isArray(data)) data = [];
      data.sort((a, b) => {
        if (a.isAllDay && !b.isAllDay) return -1;
        if (!a.isAllDay && b.isAllDay) return 1;
        return (a.startTime ?? "").localeCompare(b.startTime ?? "");
      });
      setItems(data ?? []);
    } catch (e: any) {
      setError(e.message || "Failed to load agenda.");
    } finally {
      setLoading(false);
    }
  }, [date, isToday]);

  useEffect(() => { load(); }, [load]);

  function prevDay() {
    setDate((d) => { const n = new Date(d); n.setDate(n.getDate() - 1); return n; });
  }
  function nextDay() {
    setDate((d) => { const n = new Date(d); n.setDate(n.getDate() + 1); return n; });
  }

  async function handleToggle(id: string, sourceType: SourceType) {
    if (sourceType !== "REMINDER") return;
    const item = items.find((i) => i.id === id);
    if (!item) return;
    setTogglingId(id);
    try {
      if (!item.isDone) {
        await remindersApi.completeReminder(item.sourceId || id);
      } else {
        await remindersApi.updateReminder(item.sourceId || id, { isCompleted: false });
      }
      setItems((prev) =>
        prev.map((i) => (i.id === id ? { ...i, isDone: !i.isDone } : i)),
      );
    } catch (e: any) {
      alert(e.message || "Failed to update.");
    } finally {
      setTogglingId(null);
    }
  }

  // Inject "now" indicator between past and future items (today only)
  const now = new Date();
  const nowStr = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;

  const timelineRows: (PlannerItem | "NOW")[] = [];
  let nowInserted = false;
  for (const item of items) {
    if (
      isToday &&
      !nowInserted &&
      item.startTime &&
      item.startTime > nowStr
    ) {
      timelineRows.push("NOW");
      nowInserted = true;
    }
    timelineRows.push(item);
  }
  if (isToday && !nowInserted) timelineRows.push("NOW");

  return (
    <div className="min-h-screen w-full bg-muted px-6 py-6 pb-24">
      {/* Back */}
      <div className="mb-4">
        <BackButton href="/dashboard" />
      </div>
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <button
          onClick={prevDay}
          className="w-11 h-11 rounded-2xl bg-card shadow-sm flex items-center justify-center"
          aria-label="Previous day"
        >
          <ChevronLeft className="w-5 h-5 text-foreground" />
        </button>
        <div className="text-center">
          <p className="text-xs font-semibold tracking-widest text-muted-foreground uppercase">
            {isToday ? "Today" : fmtHeaderDate(date).split(",")[0]}
          </p>
          <h1 className="font-serif text-2xl font-bold text-foreground">
            {fmtHeaderDate(date).split(",").slice(1).join(",").trim()}
          </h1>
        </div>
        <button
          onClick={nextDay}
          className="w-11 h-11 rounded-2xl bg-card shadow-sm flex items-center justify-center"
          aria-label="Next day"
        >
          <ChevronRight className="w-5 h-5 text-foreground" />
        </button>
      </div>

      {/* Planner sub-nav */}
      <div className="flex justify-center gap-3 mb-8">
        {PLANNER_NAV.map(({ icon: Icon, label, href }) => {
          const active = pathname === href;
          return (
          <Link
            key={label}
            href={href}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold transition ${
              active
                ? "bg-primary text-primary-foreground"
                : "text-primary underline-offset-2 hover:underline"
            }`}
          >
            <Icon className="w-4 h-4" />
            {label}
          </Link>
          );
        })}
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
          <button onClick={load} className="text-primary text-sm font-semibold underline">
            Retry
          </button>
        </div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-2">
          <Clock className="w-10 h-10 text-muted-foreground" />
          <p className="text-muted-foreground font-medium">Nothing scheduled</p>
          <Link
            href="/dashboard/planner/reminders"
            className="text-primary text-sm font-semibold underline mt-1"
          >
            Add a reminder
          </Link>
        </div>
      ) : (
        /* Timeline */
        <div className="relative pl-16">
          {/* Vertical line */}
          <div className="absolute left-[1.65rem] top-2 bottom-2 w-px bg-border" />

          <div className="flex flex-col gap-6">
            {timelineRows.map((row, i) =>
              row === "NOW" ? (
                <NowIndicator key="now" />
              ) : (
                <TimelineItem
                  key={row.id}
                  item={row}
                  isToday={isToday}
                  onToggle={handleToggle}
                  toggling={togglingId === row.id}
                />
              ),
            )}
          </div>
        </div>
      )}

      {/* Main bottom nav */}
      <BottomNav />
    </div>
  );
}
