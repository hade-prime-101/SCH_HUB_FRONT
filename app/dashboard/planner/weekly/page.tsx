"use client";

import { useState, useEffect, useCallback } from "react";
import BackButton from "@/components/shared/BackButton";
import BottomNav from "@/components/shared/BottomNav";
import Link from "next/link";
import {
  ChevronLeft,
  ChevronRight,
  Calendar,
  CalendarDays,
  Bell,
  Home,
  CheckCircle2,
  Users,
  User,
  Loader2,
  AlertTriangle,
} from "lucide-react";
import { plannerApi } from "@/lib/api/planner";

// ─── Types ────────────────────────────────────────────────────────────────────

type SourceType = "TIMETABLE" | "REMINDER" | "EVENT" | "DEPT_REMINDER";

interface PlannerItem {
  id: string;
  title: string;
  sourceType: SourceType;
  date: string;       // "YYYY-MM-DD"
  startTime?: string; // "HH:MM"
  endTime?: string;
  isAllDay: boolean;
  isDone: boolean;
}

// ─── Constants ────────────────────────────────────────────────────────────────

// Visual style per source type — using theme tokens where possible
const SOURCE_STYLE: Record<SourceType, string> = {
  TIMETABLE:     "bg-accent text-primary",
  REMINDER:      "bg-amber-100 text-amber-700",
  DEPT_REMINDER: "bg-amber-100 text-amber-700",
  EVENT:         "bg-emerald-100 text-emerald-700",
};

const WEEK_DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const PLANNER_NAV = [
  { icon: Calendar,     label: "Today",     href: "/dashboard/planner" },
  { icon: CalendarDays, label: "Weekly",    href: "/dashboard/planner/weekly", active: true },
  { icon: Bell,         label: "Reminders", href: "/dashboard/planner/reminders" },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getMondayOfWeek(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay(); // 0=Sun
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function addDays(date: Date, n: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
}

function toDateKey(date: Date): string {
  return date.toISOString().split("T")[0];
}

function fmt12(time: string): string {
  const [h, m] = time.split(":").map(Number);
  return `${h % 12 || 12}:${String(m).padStart(2, "0")}`;
}

function fmtWeekRange(monday: Date): string {
  const sunday = addDays(monday, 6);
  const opts: Intl.DateTimeFormatOptions = { month: "short", day: "numeric" };
  return `${monday.toLocaleDateString([], opts)} – ${sunday.toLocaleDateString([], { ...opts, year: "numeric" })}`;
}

// ─── Day Column ───────────────────────────────────────────────────────────────

function DayColumn({
  date,
  isToday,
  isActive,
  items,
  onClick,
}: {
  date: Date;
  isToday: boolean;
  isActive: boolean;
  items: PlannerItem[];
  onClick: () => void;
}) {
  const dayLabel = WEEK_DAYS[date.getDay()].toUpperCase();
  const dayNum   = date.getDate();

  return (
    <div className="flex flex-col min-w-0">
      {/* Day header */}
      <button
        onClick={onClick}
        className={`text-center rounded-t-2xl py-3 w-full transition ${
          isActive ? "bg-accent" : "bg-muted"
        }`}
      >
        <p className="text-xs font-semibold tracking-wider text-muted-foreground">
          {dayLabel}
        </p>
        <p
          className={`text-2xl font-bold ${
            isToday
              ? "text-primary"
              : isActive
              ? "text-primary"
              : "text-foreground"
          }`}
        >
          {dayNum}
        </p>
        {isToday && (
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-primary mt-0.5" />
        )}
      </button>

      {/* Events */}
      <div className="bg-card rounded-b-2xl flex-1 p-2 flex flex-col gap-2 min-h-64">
        {items.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center mt-4">—</p>
        ) : (
          items.map((item) => (
            <div
              key={item.id}
              className={`rounded-xl px-2.5 py-2 ${SOURCE_STYLE[item.sourceType]} ${
                item.isDone ? "opacity-50 line-through" : ""
              }`}
            >
              {item.startTime && (
                <p className="font-bold text-xs">{fmt12(item.startTime)}</p>
              )}
              <p className="text-xs leading-tight mt-0.5">{item.title}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function WeeklyPlannerPage() {
  const [weekOffset, setWeekOffset]   = useState(0);
  const [items, setItems]             = useState<PlannerItem[]>([]);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState<string | null>(null);
  const [activeDate, setActiveDate]   = useState(toDateKey(new Date()));

  const today      = new Date();
  const todayKey   = toDateKey(today);
  const weekStart  = getMondayOfWeek(addDays(today, weekOffset * 7));

  // 7-day window: Mon → Sun
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const raw = await plannerApi.getWeekly(weekOffset) as any;
      // Normalise — backend may return an array directly, or wrap it in an object
      let data: PlannerItem[] = Array.isArray(raw)
        ? raw
        : (raw?.items ?? raw?.agenda ?? raw?.data ?? []);
      if (!Array.isArray(data)) data = [];
      data.sort((a, b) => (a.startTime ?? "").localeCompare(b.startTime ?? ""));
      setItems(data);
    } catch (e: any) {
      setError(e.message || "Failed to load weekly planner.");
    } finally {
      setLoading(false);
    }
  }, [weekOffset]);

  useEffect(() => { load(); }, [load]);

  // Group items by date key
  const byDate: Record<string, PlannerItem[]> = {};
  for (const item of items) {
    if (!byDate[item.date]) byDate[item.date] = [];
    byDate[item.date].push(item);
  }

  const totalThisWeek = items.length;
  const doneThisWeek  = items.filter((i) => i.isDone).length;

  return (
    <div className="min-h-screen w-full bg-muted pb-24">
      {/* Header card */}
      <div className="bg-card px-6 pt-6 pb-5 rounded-b-3xl">
        <BackButton href="/dashboard/planner" />
        <div className="flex items-start justify-between mb-6 mt-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Weekly Planner</h1>
            <p className="text-muted-foreground mt-1 text-sm">{fmtWeekRange(weekStart)}</p>
          </div>
          <button
            onClick={() => { setWeekOffset(0); setActiveDate(todayKey); }}
            className="flex items-center gap-2 border border-ring text-primary font-semibold rounded-2xl px-4 py-2.5 shrink-0 text-sm transition hover:bg-accent"
          >
            <Calendar className="w-4 h-4" /> Today
          </button>
        </div>

        {/* Week navigation */}
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => setWeekOffset((w) => w - 1)}
            className="w-10 h-10 rounded-full bg-muted flex items-center justify-center"
            aria-label="Previous week"
          >
            <ChevronLeft className="w-5 h-5 text-foreground" />
          </button>
          <span className="text-foreground font-medium text-sm">
            {weekOffset === 0 ? "This Week" : weekOffset === 1 ? "Next Week" : weekOffset === -1 ? "Last Week" : `Week ${weekOffset > 0 ? "+" : ""}${weekOffset}`}
          </span>
          <button
            onClick={() => setWeekOffset((w) => w + 1)}
            className="w-10 h-10 rounded-full bg-muted flex items-center justify-center"
            aria-label="Next week"
          >
            <ChevronRight className="w-5 h-5 text-foreground" />
          </button>
        </div>

        {/* Planner sub-nav */}
        <div className="flex justify-center gap-3">
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
      </div>

      {/* Summary chips */}
      {!loading && !error && (
        <div className="flex gap-3 px-4 pt-5">
          <div className="flex-1 rounded-2xl bg-card border border-border p-3 text-center">
            <p className="text-xl font-bold text-foreground">{totalThisWeek}</p>
            <p className="text-xs text-muted-foreground mt-0.5">This week</p>
          </div>
          <div className="flex-1 rounded-2xl bg-card border border-border p-3 text-center">
            <p className="text-xl font-bold text-primary">{doneThisWeek}</p>
            <p className="text-xs text-muted-foreground mt-0.5">Done</p>
          </div>
          <div className="flex-1 rounded-2xl bg-card border border-border p-3 text-center">
            <p className="text-xl font-bold text-foreground">{totalThisWeek - doneThisWeek}</p>
            <p className="text-xs text-muted-foreground mt-0.5">Pending</p>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="px-4 pt-5">
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
        ) : (
          /* 3-col grid scrollable horizontally on small screens */
          <div className="grid grid-cols-3 gap-3 overflow-x-auto">
            {weekDays.slice(0, 6).map((date) => {
              const key = toDateKey(date);
              return (
                <DayColumn
                  key={key}
                  date={date}
                  isToday={key === todayKey}
                  isActive={key === activeDate}
                  items={byDate[key] ?? []}
                  onClick={() => setActiveDate(key)}
                />
              );
            })}
          </div>
        )}
      </div>

      {/* Selected day detail (when tapped) */}
      {!loading && !error && activeDate && byDate[activeDate]?.length > 0 && (
        <div className="px-4 pt-5">
          <h2 className="text-sm font-bold text-foreground mb-3 uppercase tracking-wider">
            {new Date(activeDate + "T00:00:00").toLocaleDateString([], {
              weekday: "long", month: "long", day: "numeric",
            })}
          </h2>
          <div className="flex flex-col gap-3">
            {byDate[activeDate].map((item) => (
              <div
                key={item.id}
                className={`rounded-2xl p-4 flex items-center gap-3 ${SOURCE_STYLE[item.sourceType]}`}
              >
                <div className="flex-1">
                  <p className={`font-semibold ${item.isDone ? "line-through opacity-60" : ""}`}>
                    {item.title}
                  </p>
                  {item.startTime && (
                    <p className="text-xs mt-0.5 opacity-70">
                      {fmt12(item.startTime)}
                      {item.endTime ? ` – ${fmt12(item.endTime)}` : ""}
                    </p>
                  )}
                </div>
                {item.isDone && (
                  <span className="text-xs font-bold opacity-60">Done</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main bottom nav */}
      <BottomNav />
    </div>
  );
}
