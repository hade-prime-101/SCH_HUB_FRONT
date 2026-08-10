"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  BookOpen,
  Store,
  Users,
  User,
} from "lucide-react";

// ─── Global nav items ─────────────────────────────────────────────────────────

const NAV_ITEMS = [
  {
    icon:  Home,
    label: "Home",
    href:  "/dashboard",
    // exact match only — everything else would match this prefix
    exact: true,
  },
  {
    icon:  BookOpen,
    label: "Study",
    href:  "/dashboard/study",
    exact: false,
  },
  {
    icon:  Store,
    label: "Market",
    href:  "/dashboard/marketplace",
    exact: false,
  },
  {
    icon:  Users,
    label: "Community",
    href:  "/dashboard/community",
    exact: false,
  },
  {
    icon:  User,
    label: "Profile",
    href:  "/dashboard/profile",
    exact: false,
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function isActive(pathname: string, href: string, exact: boolean): boolean {
  if (exact) return pathname === href;
  return pathname === href || pathname.startsWith(href + "/");
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border flex justify-around items-center py-3 z-30">
      {NAV_ITEMS.map(({ icon: Icon, label, href, exact }) => {
        const active = isActive(pathname, href, exact);

        return (
          <Link
            key={label}
            href={href}
            className="flex flex-col items-center gap-1 px-2"
            aria-current={active ? "page" : undefined}
          >
            <span
              className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors ${
                active ? "bg-accent" : ""
              }`}
            >
              <Icon
                className={`w-5 h-5 ${active ? "text-primary" : "text-muted-foreground"}`}
              />
            </span>
            <span
              className={`text-xs font-medium ${active ? "text-primary" : "text-muted-foreground"}`}
            >
              {label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
