"use client";

import { useEffect, useState } from "react";
import { adminApi } from "@/lib/api/admin";
import { Users, ShieldCheck, School, BookOpen, ShoppingBag, MessageSquare, ClipboardList, AlertCircle } from "lucide-react";

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

function StatCard({ icon: Icon, label, value, accent }: {
  icon: React.ElementType; label: string; value: number; accent: string;
}) {
  return (
    <div className="bg-card rounded-2xl p-5 flex items-center gap-4">
      <span className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${accent}`}>
        <Icon className="w-5 h-5" />
      </span>
      <div>
        <p className="text-2xl font-bold text-foreground">{value.toLocaleString()}</p>
        <p className="text-sm text-muted-foreground">{label}</p>
      </div>
    </div>
  );
}

export default function SuperAdminStatsPage() {
  const [stats, setStats]   = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState<string | null>(null);

  useEffect(() => {
    adminApi.getStats()
      .then((d) => setStats(d as Stats))
      .catch((e: any) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const CARDS = [
    { icon: Users,        label: "Total Users",    value: stats?.totalUsers    ?? 0, accent: "bg-blue-100 text-blue-600" },
    { icon: ShieldCheck,  label: "Admins",          value: stats?.totalAdmins   ?? 0, accent: "bg-violet-100 text-violet-600" },
    { icon: School,       label: "Schools",         value: stats?.totalSchools  ?? 0, accent: "bg-indigo-100 text-indigo-600" },
    { icon: BookOpen,     label: "Materials",       value: stats?.totalMaterials ?? 0, accent: "bg-emerald-100 text-emerald-600" },
    { icon: ClipboardList,label: "Quizzes",         value: stats?.totalQuizzes  ?? 0, accent: "bg-amber-100 text-amber-600" },
    { icon: ShoppingBag,  label: "Listings",        value: stats?.totalListings ?? 0, accent: "bg-orange-100 text-orange-600" },
    { icon: MessageSquare,label: "Community Posts", value: stats?.totalPosts    ?? 0, accent: "bg-pink-100 text-pink-600" },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Platform Stats</h1>
        <p className="text-muted-foreground text-sm mt-1">Platform-wide analytics</p>
      </div>

      {error && (
        <div className="bg-destructive/10 text-destructive rounded-xl p-4 flex items-center gap-2 text-sm">
          <AlertCircle className="w-4 h-4 shrink-0" /> {error}
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {loading
          ? Array.from({ length: 7 }).map((_, i) => (
              <div key={i} className="bg-card rounded-2xl p-5 h-24 animate-pulse" />
            ))
          : CARDS.map((c) => <StatCard key={c.label} {...c} />)
        }
      </div>

      {!loading && stats?.recentAuditLogs?.length ? (
        <div className="bg-card rounded-2xl p-5">
          <h2 className="font-semibold text-foreground mb-4">Recent Activity</h2>
          <div className="flex flex-col divide-y divide-border">
            {stats.recentAuditLogs.slice(0, 10).map((log) => (
              <div key={log.id} className="py-3 flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-foreground">{log.action.replace(/_/g, " ")}</p>
                  {log.performedBy && <p className="text-xs text-muted-foreground">by {log.performedBy.fullName}</p>}
                </div>
                <p className="text-xs text-muted-foreground shrink-0">{new Date(log.createdAt).toLocaleDateString()}</p>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
