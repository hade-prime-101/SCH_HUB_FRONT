"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  BarChart2,
  School,
  BookMarked,
  ShieldCheck,
  Users,
  ClipboardList,
  LogOut,
  Crown,
  Menu,
  X,
  Map,
} from "lucide-react";
import { useState } from "react";

const NAV = [
  { icon: LayoutDashboard, label: "Dashboard",   href: "/super-admin" },
  { icon: BarChart2,       label: "Stats",        href: "/super-admin/stats" },
  { icon: School,          label: "Schools",      href: "/super-admin/schools" },
  { icon: BookMarked,      label: "Faculties",    href: "/super-admin/faculties" },
  { icon: Map,             label: "Campus Map",   href: "/super-admin/map" },
  { icon: ShieldCheck,     label: "Admins",       href: "/super-admin/admins" },
  { icon: Users,           label: "Users",        href: "/super-admin/users" },
  { icon: ClipboardList,   label: "Audit Logs",   href: "/super-admin/audit-logs" },
];

function NavItem({ icon: Icon, label, href, active, onClick }: {
  icon: React.ElementType; label: string; href: string; active: boolean; onClick?: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
        active
          ? "bg-primary text-primary-foreground"
          : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
      }`}
    >
      <Icon className="w-4 h-4 shrink-0" />
      {label}
    </Link>
  );
}

export default function SuperAdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  function handleLogout() {
    localStorage.removeItem("auth_token");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("auth_user");
    router.push("/login");
  }

  const isActive = (href: string) =>
    href === "/super-admin" ? pathname === "/super-admin" : pathname.startsWith(href);

  const sidebarContent = (
    <div className="flex flex-col h-full">
      <div className="px-4 py-5 border-b border-border">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <Crown className="w-4 h-4 text-primary-foreground" />
          </div>
          <div>
            <p className="font-bold text-sm text-foreground">SchHub</p>
            <p className="text-xs text-muted-foreground">Super Admin</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 flex flex-col gap-1 overflow-y-auto">
        {NAV.map((item) => (
          <NavItem
            key={item.href}
            {...item}
            active={isActive(item.href)}
            onClick={() => setOpen(false)}
          />
        ))}
      </nav>

      <div className="px-3 py-4 border-t border-border">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-muted-foreground hover:bg-destructive/10 hover:text-destructive w-full transition-colors"
        >
          <LogOut className="w-4 h-4 shrink-0" />
          Logout
        </button>
      </div>
    </div>
  );

  return (
    <>
      <aside className="hidden lg:flex flex-col w-56 shrink-0 border-r border-border bg-sidebar h-screen sticky top-0">
        {sidebarContent}
      </aside>

      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-sidebar border-b border-border flex items-center justify-between px-4 h-14">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
            <Crown className="w-3.5 h-3.5 text-primary-foreground" />
          </div>
          <p className="font-bold text-sm">Super Admin</p>
        </div>
        <button onClick={() => setOpen(true)} className="p-2 rounded-lg hover:bg-accent">
          <Menu className="w-5 h-5" />
        </button>
      </div>

      {open && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
          <aside className="relative w-56 bg-sidebar h-full shadow-xl">
            <button onClick={() => setOpen(false)} className="absolute top-3 right-3 p-1.5 rounded-lg hover:bg-accent">
              <X className="w-4 h-4" />
            </button>
            {sidebarContent}
          </aside>
        </div>
      )}
    </>
  );
}
