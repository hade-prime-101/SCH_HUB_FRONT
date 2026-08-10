"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Calendar,
  MessageSquare,
  BookOpen,
  Users2,
  Briefcase,
  ShoppingBag,
  PhoneCall,
  LogOut,
  GraduationCap,
  Menu,
  X,
  BarChart2,
  ClipboardList,
  HelpCircle,
  ShieldCheck,
  BookMarked,
  UserCog,
  LineChart,
} from "lucide-react";
import { useState } from "react";

const NAV = [
  { icon: LayoutDashboard, label: "Dashboard",         href: "/admin" },
  { icon: BarChart2,       label: "Stats",             href: "/admin/stats" },
  { icon: Users,           label: "Users",             href: "/admin/users" },
  { icon: Calendar,        label: "Events",            href: "/admin/events" },
  { icon: MessageSquare,   label: "Community",         href: "/admin/community" },
  { icon: BookOpen,        label: "Materials",         href: "/admin/materials" },
  { icon: Users2,          label: "Groups",            href: "/admin/groups" },
  { icon: Briefcase,       label: "Jobs",              href: "/admin/jobs" },
  { icon: ShoppingBag,     label: "Marketplace",       href: "/admin/marketplace" },
  { icon: PhoneCall,       label: "Emergency",         href: "/admin/emergency" },
  { icon: ShieldCheck,     label: "Agents",            href: "/admin/agents" },
  { icon: HelpCircle,      label: "FAQs",              href: "/admin/faqs" },
  { icon: BookMarked,      label: "Faculties",         href: "/admin/structure" },
  { icon: GraduationCap,   label: "Course Rep",        href: "/admin/course-rep" },
  { icon: UserCog,         label: "Assign Role",       href: "/admin/roles" },
  { icon: ClipboardList,   label: "Audit Logs",        href: "/admin/audit-logs" },
  { icon: LineChart,       label: "Study Analytics",   href: "/admin/study/analytics" },
];

function NavItem({
  icon: Icon, label, href, active, onClick,
}: {
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

export default function AdminSidebar() {
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
    href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);

  const sidebarContent = (
    <div className="flex flex-col h-full">
      <div className="px-4 py-5 border-b border-border">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <GraduationCap className="w-4 h-4 text-primary-foreground" />
          </div>
          <div>
            <p className="font-bold text-sm text-foreground">LOOPZ</p>
            <p className="text-xs text-muted-foreground">School Admin</p>
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
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col w-56 shrink-0 border-r border-border bg-sidebar h-screen sticky top-0">
        {sidebarContent}
      </aside>

      {/* Mobile top bar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-sidebar border-b border-border flex items-center justify-between px-4 h-14">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
            <GraduationCap className="w-3.5 h-3.5 text-primary-foreground" />
          </div>
          <p className="font-bold text-sm">LOOPZ Admin</p>
        </div>
        <button
          onClick={() => setOpen(true)}
          className="p-2 rounded-lg hover:bg-accent"
          aria-label="Open menu"
        >
          <Menu className="w-5 h-5" />
        </button>
      </div>

      {/* Mobile drawer overlay */}
      {open && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
          <aside className="relative w-56 bg-sidebar h-full shadow-xl flex flex-col">
            <button
              onClick={() => setOpen(false)}
              className="absolute top-3 right-3 p-1.5 rounded-lg hover:bg-accent"
              aria-label="Close menu"
            >
              <X className="w-4 h-4" />
            </button>
            {sidebarContent}
          </aside>
        </div>
      )}
    </>
  );
}
