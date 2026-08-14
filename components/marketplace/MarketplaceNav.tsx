"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutGrid,
  Package,
  Wrench,
  Briefcase,
  Home,
  Users,
  Store,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  Search,
  Heart,
  Megaphone,
} from "lucide-react";

const navItems = [
  { href: "/marketplace", label: "Overview", icon: LayoutGrid },
  { href: "/marketplace/listings", label: "Listings", icon: Package },
  { href: "/marketplace/services", label: "Services", icon: Wrench },
  { href: "/marketplace/jobs", label: "Jobs", icon: Briefcase },
  { href: "/marketplace/accommodation", label: "Accommodation", icon: Home },
  { href: "/marketplace/roommates", label: "Roommates", icon: Users },
  { href: "/marketplace/shops", label: "Shops", icon: Store },
  { href: "/marketplace/lost-found", label: "Lost & Found", icon: Megaphone },
  { href: "/marketplace/saved", label: "Saved", icon: Heart },
];

export function MarketplaceNav() {
  const pathname = usePathname();

  return (
    <nav className="flex items-center gap-1 overflow-x-auto px-4 py-3 scrollbar-hide border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
      {navItems.map(({ href, label, icon: Icon }) => {
        const isActive = pathname === href || pathname.startsWith(href + "/");
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex shrink-0 items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors",
              isActive
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
            aria-current={isActive ? "page" : undefined}
          >
            <Icon className="h-4 w-4" />
            <span className="whitespace-nowrap">{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}