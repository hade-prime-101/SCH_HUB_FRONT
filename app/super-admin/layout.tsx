"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function SuperAdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const links = [
    { href: "/dashboard/super-admin", label: "Dashboard" },
    { href: "/dashboard/super-admin/admins", label: "Admins" },
    { href: "/dashboard/super-admin/schools", label: "Schools" },
    { href: "/dashboard/super-admin/faculties", label: "Faculties" },
    { href: "/dashboard/super-admin/departments", label: "Departments" },
    { href: "/dashboard/super-admin/users", label: "Users" },
    { href: "/dashboard/super-admin/agents", label: "Agents" },
    { href: "/dashboard/super-admin/faqs", label: "FAQs" },
    { href: "/dashboard/super-admin/audit-logs", label: "Audit Logs" },
    { href: "/dashboard/super-admin/stats", label: "Analytics" },
    { href: "/dashboard/super-admin/map", label: "Map Admin" },
    { href: "/dashboard/super-admin/departments", label: "Departments" },
    { href: "/dashboard/super-admin/school-faculties", label: "My School Faculties" },
    { href: "/dashboard/super-admin/school-departments", label: "My School Departments" },
    { href: "/dashboard/super-admin/school-audit-logs", label: "School Audit Logs" },
    { href: "/dashboard/super-admin/map/entrances", label: "Map Entrances" },
  ];

  return (
    <div className="flex min-h-screen">
      <aside className="w-64 bg-sidebar text-sidebar-foreground p-4">
        <h2 className="text-lg font-bold mb-4">Super Admin</h2>
        <nav className="space-y-1">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={`block px-3 py-2 rounded text-sm ${
                pathname === l.href ? "bg-sidebar-primary text-sidebar-primary-foreground" : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              }`}
            >
              {l.label}
            </Link>
          ))}
        </nav>
      </aside>
      <main className="flex-1 p-6 bg-background">{children}</main>
    </div>
  );
}