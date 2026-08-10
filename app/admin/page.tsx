"use client";

import { useEffect, useState } from "react";
import { adminApi } from "@/lib/api/admin";
import {
  Users,
  BookOpen,
  ShoppingBag,
  MessageSquare,
  ClipboardList,
  GraduationCap,
  TrendingUp,
  AlertCircle,
} from "lucide-react";

interface Stats {
  totalUsers: number;
  totalAdmins: number;
  totalSchools: number;
  totalMaterials: number;
  totalListings: number;
  totalPosts: number;
  totalQuizzes: number;
  recentAuditLogs: { id: string; action: string; createdAt: string; performedBy?: { fullName: string } }[];
}

function StatCard({
  icon: Icon,
  label,
  value,
  accent,
}: {
  icon: React.ElementType;
  label: string;
  value: number | string;
  accent: string;
}) {
  return (
    <div className="bg-card rounded-2xl p-5 flex items-center gap-4">
      <span className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${accent}`}>
        <Icon className="w-5 h-5" />
      </span>
      <div>
        <p className="text-2xl font-bold text-foreground">{value}</p>
        <p className="text-sm text-muted-foreground">{label}</p>
      </div>
    </div>
  );
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      adminApi.getSchoolAdminStats(),
      adminApi.getSchoolAdminAuditLogs(),
    ])
      .then(([statsData, auditLogsData]) => {
        setStats({
          ...(statsData as Stats),
          recentAuditLogs: auditLogsData?.recentAuditLogs ?? auditLogsData ?? [],
        } as Stats);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="bg-card rounded-2xl p-5 h-24 animate-pulse" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-destructive/10 text-destructive rounded-2xl p-5 flex items-center gap-3">
        <AlertCircle className="w-5 h-5 shrink-0" />
        <p className="text-sm font-medium">{error}</p>
      </div>
    );
  }

  const STAT_CARDS = [
    { icon: Users,         label: "Total Users",      value: stats?.totalUsers ?? 0,     accent: "bg-blue-100 text-blue-600" },
    { icon: GraduationCap, label: "Admins",            value: stats?.totalAdmins ?? 0,    accent: "bg-violet-100 text-violet-600" },
    { icon: BookOpen,      label: "Materials",         value: stats?.totalMaterials ?? 0, accent: "bg-indigo-100 text-indigo-600" },
    { icon: ClipboardList, label: "Quizzes",           value: stats?.totalQuizzes ?? 0,   accent: "bg-amber-100 text-amber-600" },
    { icon: ShoppingBag,   label: "Listings",          value: stats?.totalListings ?? 0,  accent: "bg-orange-100 text-orange-600" },
    { icon: MessageSquare, label: "Community Posts",   value: stats?.totalPosts ?? 0,     accent: "bg-emerald-100 text-emerald-600" },
  ];

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground text-sm mt-1">School admin overview</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {STAT_CARDS.map((s) => (
          <StatCard key={s.label} {...s} />
        ))}
      </div>

      {/* Recent audit logs */}
      <div className="bg-card rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-4 h-4 text-primary" />
          <h2 className="font-semibold text-foreground">Recent Activity</h2>
        </div>

        {!stats?.recentAuditLogs?.length ? (
          <p className="text-sm text-muted-foreground">No recent activity.</p>
        ) : (
          <div className="flex flex-col divide-y divide-border">
            {stats.recentAuditLogs.slice(0, 8).map((log) => (
              <div key={log.id} className="py-3 flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {log.action.replace(/_/g, " ")}
                  </p>
                  {log.performedBy && (
                    <p className="text-xs text-muted-foreground">by {log.performedBy.fullName}</p>
                  )}
                </div>
                <p className="text-xs text-muted-foreground shrink-0">
                  {new Date(log.createdAt).toLocaleDateString()}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
