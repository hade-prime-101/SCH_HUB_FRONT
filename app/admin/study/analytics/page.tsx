"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft, BarChart2, BookOpen, Download, Star, Loader2, RefreshCw, X,
} from "lucide-react";
import { studyApi } from "@/lib/api";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Analytics {
  totalMaterials?:  number;
  totalDownloads?:  number;
  activeQuizzes?:   number;
  avgQuizScore?:    number;
  topCourses?:      { courseCode: string; materialCount: number; downloadCount: number; avgRating?: number }[];
  typeBreakdown?:   { type: string; count: number }[];
  topDepartments?:  { name: string; count: number }[];
}

const TYPE_COLORS: Record<string, string> = {
  PAST_QUESTION: "bg-blue-400",
  NOTE:          "bg-emerald-400",
  HANDOUT:       "bg-amber-400",
  SLIDES:        "bg-indigo-400",
  ASSIGNMENT:    "bg-violet-400",
  SUMMARY:       "bg-pink-400",
  OTHER:         "bg-slate-300",
};

const MOCK: Analytics = {
  totalMaterials:  148,
  totalDownloads:  2340,
  activeQuizzes:   32,
  avgQuizScore:    68,
  topCourses: [
    { courseCode: "CSC301", materialCount: 18, downloadCount: 420, avgRating: 4.3 },
    { courseCode: "MTH201", materialCount: 14, downloadCount: 310, avgRating: 4.1 },
    { courseCode: "PHY101", materialCount: 12, downloadCount: 280, avgRating: 3.9 },
    { courseCode: "CHM201", materialCount: 10, downloadCount: 195, avgRating: 4.0 },
  ],
  typeBreakdown: [
    { type: "PAST_QUESTION", count: 55 },
    { type: "NOTE",          count: 40 },
    { type: "HANDOUT",       count: 28 },
    { type: "SLIDES",        count: 15 },
    { type: "ASSIGNMENT",    count: 10 },
  ],
  topDepartments: [
    { name: "Computer Science", count: 48 },
    { name: "Mathematics",       count: 35 },
    { name: "Physics",           count: 29 },
  ],
};

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AdminStudyAnalyticsPage() {
  const router = useRouter();

  const [data,        setData]        = useState<Analytics>(MOCK);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState<string | null>(null);
  const [courseCode,  setCourseCode]  = useState("");
  const [from,        setFrom]        = useState("");
  const [to,          setTo]          = useState("");

  const load = useCallback(async (params?: Record<string, string>) => {
    setLoading(true); setError(null);
    try {
      const res = await studyApi.getAdminAnalytics(params);
      if (res) setData(res as Analytics);
    } catch {
      setData(MOCK); // fallback to mock data
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  function handleFilter() {
    const params: Record<string, string> = {};
    if (courseCode) params.courseCode = courseCode.toUpperCase();
    if (from)       params.from = from;
    if (to)         params.to   = to;
    load(params);
  }

  const maxType = Math.max(1, ...(data.typeBreakdown?.map((t) => t.count) ?? [1]));

  const STATS = [
    { label: "Total Materials",  value: data.totalMaterials ?? 0,    icon: BookOpen,   color: "text-indigo-500",  bg: "bg-indigo-50" },
    { label: "Total Downloads",  value: data.totalDownloads ?? 0,    icon: Download,   color: "text-emerald-500", bg: "bg-emerald-50" },
    { label: "Active Quizzes",   value: data.activeQuizzes ?? 0,     icon: BarChart2,  color: "text-amber-500",   bg: "bg-amber-50" },
    { label: "Avg Quiz Score",   value: `${data.avgQuizScore ?? 0}%`, icon: Star,       color: "text-violet-500",  bg: "bg-violet-50" },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Study Analytics</h1>
        <button onClick={() => handleFilter()} disabled={loading} className="p-2 rounded-xl border border-border hover:bg-accent disabled:opacity-50">
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

        {/* ── Filters ── */}
        <div className="bg-card rounded-2xl px-4 py-4 flex flex-col gap-3">
          <p className="text-sm font-bold text-foreground">Filters</p>
          <div className="grid grid-cols-2 gap-2">
            <input value={courseCode} onChange={(e) => setCourseCode(e.target.value)} placeholder="Course code"
              className="col-span-2 px-3 py-2 rounded-xl border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring uppercase" />
            <input type="date" value={from} onChange={(e) => setFrom(e.target.value)}
              className="px-3 py-2 rounded-xl border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
            <input type="date" value={to} onChange={(e) => setTo(e.target.value)}
              className="px-3 py-2 rounded-xl border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
          </div>
          <button onClick={handleFilter} disabled={loading}
            className="w-full rounded-xl bg-primary text-primary-foreground py-2.5 text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-50">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null} Apply Filters
          </button>
        </div>

        {/* ── Stats grid ── */}
        <div className="grid grid-cols-2 gap-3">
          {STATS.map(({ label, value, icon: Icon, color, bg }) => (
            <div key={label} className="bg-card rounded-2xl px-4 py-4 flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center shrink-0`}>
                <Icon className={`w-5 h-5 ${color}`} />
              </div>
              <div>
                <p className="text-xl font-bold text-foreground">{value}</p>
                <p className="text-xs text-muted-foreground font-medium">{label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* ── Top courses ── */}
        {data.topCourses && data.topCourses.length > 0 && (
          <div className="bg-card rounded-2xl px-5 py-4">
            <h2 className="font-bold text-foreground text-sm mb-3">Top Courses</h2>
            <div className="flex flex-col gap-2">
              {data.topCourses.map((c) => (
                <div key={c.courseCode} className="flex items-center gap-3 py-2 border-b border-border last:border-0">
                  <span className="font-mono text-sm font-bold text-primary w-20 shrink-0">{c.courseCode}</span>
                  <div className="flex-1 flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><BookOpen className="w-3 h-3" /> {c.materialCount}</span>
                    <span className="flex items-center gap-1"><Download className="w-3 h-3" /> {c.downloadCount}</span>
                    {c.avgRating && <span className="flex items-center gap-1"><Star className="w-3 h-3 text-amber-400" /> {c.avgRating.toFixed(1)}</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Material type breakdown ── */}
        {data.typeBreakdown && data.typeBreakdown.length > 0 && (
          <div className="bg-card rounded-2xl px-5 py-4">
            <h2 className="font-bold text-foreground text-sm mb-3">By Material Type</h2>
            <div className="flex flex-col gap-3">
              {data.typeBreakdown.map((t) => (
                <div key={t.type}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-semibold text-muted-foreground">{t.type.replace(/_/g, " ")}</span>
                    <span className="text-xs font-bold text-foreground">{t.count}</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${TYPE_COLORS[t.type] ?? "bg-muted-foreground"}`}
                      style={{ width: `${Math.round((t.count / maxType) * 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Top departments ── */}
        {data.topDepartments && data.topDepartments.length > 0 && (
          <div className="bg-card rounded-2xl px-5 py-4">
            <h2 className="font-bold text-foreground text-sm mb-3">Most Active Departments</h2>
            <div className="flex flex-col gap-2">
              {data.topDepartments.map((d, i) => (
                <div key={d.name} className="flex items-center gap-3">
                  <span className="text-sm font-bold text-muted-foreground w-5 shrink-0">{i + 1}</span>
                  <span className="flex-1 text-sm font-medium text-foreground">{d.name}</span>
                  <span className="text-sm font-bold text-foreground">{d.count}</span>
                </div>
              ))}
            </div>
          </div>
        )}
    </div>
  );
}
