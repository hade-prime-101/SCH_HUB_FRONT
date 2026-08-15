"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function UsersLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const links = [
    { href: "/dashboard/users", label: "All Users" },
    { href: "/dashboard/users/search", label: "Search Users" },
  ];

  return (
    <div className="flex min-h-screen bg-muted/20">
      <aside className="w-64 bg-card border-r border-border p-4 hidden md:block">
        <h2 className="text-lg font-bold mb-4 text-foreground">User Management</h2>
        <nav className="space-y-1">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={`block px-3 py-2 rounded-lg text-sm transition-colors ${
                pathname === l.href
                  ? "bg-accent text-primary font-medium"
                  : "text-muted-foreground hover:bg-muted"
              }`}
            >
              {l.label}
            </Link>
          ))}
        </nav>
      </aside>
      <main className="flex-1 p-4 md:p-6">{children}</main>
    </div>
  );
}