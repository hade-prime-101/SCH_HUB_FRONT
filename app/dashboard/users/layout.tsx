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
    <div className="flex min-h-screen">
      <aside className="w-64 bg-muted border-r p-4">
        <h2 className="text-lg font-bold mb-4">User Management</h2>
        <nav className="space-y-1">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={`block px-3 py-2 rounded text-sm ${
                pathname === l.href ? "bg-accent text-primary font-medium" : "text-secondary-foreground hover:bg-muted/80"
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