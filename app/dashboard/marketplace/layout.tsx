"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function MarketplaceLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const links = [
    { href: "/dashboard/marketplace", label: "Overview" },
    { href: "/dashboard/marketplace/listings", label: "Listings" },
    { href: "/dashboard/marketplace/listings/new", label: "Sell Item" },
    { href: "/dashboard/marketplace/saved", label: "Saved" },
    { href: "/dashboard/marketplace/shops", label: "Shops" },
    { href: "/dashboard/marketplace/shops/my", label: "My Shop" },
    { href: "/dashboard/marketplace/lost-found", label: "Lost & Found" },
    { href: "/dashboard/marketplace/accommodation", label: "Accommodation" },
    { href: "/dashboard/marketplace/roommates", label: "Roommates" },
    { href: "/dashboard/marketplace/services", label: "Services" },
    { href: "/dashboard/marketplace/jobs", label: "Jobs" },
    { href: "/dashboard/marketplace/agents/apply", label: "Become Agent" },
  ];

  return (
    <div className="flex min-h-screen">
      <aside className="w-64 bg-muted border-r p-4">
        <h2 className="text-lg font-bold mb-4">Marketplace</h2>
        <nav className="space-y-1">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={`block px-3 py-2 rounded text-sm ${
                pathname === l.href ? "bg-primary/10 text-primary font-medium" : "text-secondary-foreground hover:bg-muted/80"
              }`}
            >
              {l.label}
            </Link>
          ))}
        </nav>
      </aside>
      <main className="flex-1 p-6">{children}</main>
    </div>
  );
}