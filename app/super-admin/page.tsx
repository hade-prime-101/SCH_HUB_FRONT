"use client";

import Link from "next/link";
import { BarChart2, School, BookMarked, ShieldCheck, Users, ClipboardList, ChevronRight } from "lucide-react";

const SECTIONS = [
  {
    icon: BarChart2,
    label: "Platform Stats",
    desc: "View platform-wide analytics and totals",
    href: "/super-admin/stats",
    accent: "bg-blue-100 text-blue-600",
  },
  {
    icon: School,
    label: "Schools",
    desc: "Create and manage schools on the platform",
    href: "/super-admin/schools",
    accent: "bg-violet-100 text-violet-600",
  },
  {
    icon: BookMarked,
    label: "Faculties & Departments",
    desc: "Manage faculties and departments per school",
    href: "/super-admin/faculties",
    accent: "bg-indigo-100 text-indigo-600",
  },
  {
    icon: ShieldCheck,
    label: "Admins",
    desc: "Create, deactivate and manage school admins",
    href: "/super-admin/admins",
    accent: "bg-emerald-100 text-emerald-600",
  },
  {
    icon: Users,
    label: "User Controls",
    desc: "Block or unblock student accounts",
    href: "/super-admin/users",
    accent: "bg-amber-100 text-amber-600",
  },
  {
    icon: ClipboardList,
    label: "Audit Logs",
    desc: "Review all platform-level actions",
    href: "/super-admin/audit-logs",
    accent: "bg-orange-100 text-orange-600",
  },
];

export default function SuperAdminDashboardPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Super Admin</h1>
        <p className="text-muted-foreground text-sm mt-1">Platform-level management</p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {SECTIONS.map(({ icon: Icon, label, desc, href, accent }) => (
          <Link
            key={href}
            href={href}
            className="bg-card rounded-2xl p-5 flex items-start gap-4 hover:shadow-md transition-shadow group"
          >
            <span className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${accent}`}>
              <Icon className="w-5 h-5" />
            </span>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-foreground">{label}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0 mt-1 group-hover:text-primary transition-colors" />
          </Link>
        ))}
      </div>
    </div>
  );
}
