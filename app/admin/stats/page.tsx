"use client";

import { useState, useEffect, useCallback } from "react";
import { adminApi } from "@/lib/api/admin";
import {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  BarChart2, Users, BookOpen, ShoppingBag, MessageSquare, ClipboardList,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  GraduationCap, TrendingUp, AlertCircle, RefreshCw, Loader2,
} from "lucide-react";

interface Stats {
  totalUsers?:     number;
  activeUsers?:    number;
  totalMaterials?: number;
  totalListings?:  number;
  totalPosts?:     number;
  totalQuizzes?:   number;
  totalEvents?:    number;
  newUsersThisWeek?: number;
  recentAuditLogs?: { id: string; action: string; createdAt: string; performedBy?: { fullName: string } }[];
}

function StatCard({ icon: Icon, label, value, accent }: {
  icon: React.ElementType; label: string; value: number | string; accent: string;
}) {
  return (
    <div className="bg-card rounded-2xl p-5 flex items-center gap-4">
      <span className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${accent}`}>
        <Icon className="w-5 h-5" />
      </span>
      <div>
        <p className="text-2xl font-bold text-foreground">{value ?? "—"}</p>
        <p className="text-sm text-muted-foreground">{label}</p>
      </div>
    </div>
  );
}

export default function AdminStatsPage() {
  const [stats, setStats]   = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const data = await adminApi.getSchoolAdminStats();
      setStats(data as Stats);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  }, []);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { load(); }, [load]);

  const CARDS = [
    { icon: Users,        label: "Total Users",       value: stats?.totalUsers,        accent: "bg-accent text-primary" },
    { icon: TrendingUp,   label: "New This Week",      value: stats?.newUsersThisWeek,  accent: "bg-emerald-100 text-emerald-600" },
    { icon: BookOpen,     label: "Materials",          value: stats?.totalMaterials,    accent: "bg-violet-100 text-violet-600" },
    { icon: ShoppingBag,  label: "Marketplace",        value: stats?.totalListings,     accent: "bg-amber-100 text-amber-600" },
    { icon: MessageSquare,label: "Community Posts",    value: stats?.totalPosts,        accent: "bg-pink-100 text-pink-600" },
    { icon: GraduationCap,label: "Quizzes",            value: stats?.totalQuizzes,      accent: "bg-indigo-100 text-indigo-600" },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">School Stats</h1>
          <p className="text-muted-foreground text-sm mt-1">Overview of your school&apos;s activity</p>
        </div>
        <button onClick={load} disabled={loading} className="p-2 rounded-xl border border-border hover:bg-accent disabled:opacity-50 transition-colors">
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {error && (
        <div className="bg-destructive/10 text-destructive rounded-xl p-4 flex items-center gap-2 text-sm">
          <AlertCircle className="w-4 h-4 shrink-0" /> {error}
        </div>
      )}

      {loading && !stats ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-card rounded-2xl p-5 h-20 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {CARDS.map(({ icon, label, value, accent }) => (
            <StatCard key={label} icon={icon} label={label} value={value ?? "—"} accent={accent} />
          ))}
        </div>
      )}

      {stats?.recentAuditLogs && stats.recentAuditLogs.length > 0 && (
        <div className="bg-card rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-border">
            <h2 className="font-semibold text-foreground">Recent Activity</h2>
          </div>
          <div className="divide-y divide-border">
            {stats.recentAuditLogs.slice(0, 8).map((log) => (
              <div key={log.id} className="flex items-start justify-between px-5 py-3 gap-4">
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-foreground truncate">{log.action}</p>
                  {log.performedBy && (
                    <p className="text-xs text-muted-foreground mt-0.5">by {log.performedBy.fullName}</p>
                  )}
                </div>
                <p className="text-xs text-muted-foreground shrink-0">
                  {new Date(log.createdAt).toLocaleDateString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
