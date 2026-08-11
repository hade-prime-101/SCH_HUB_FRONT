// app/dashboard/admin/community/layout.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function AdminCommunityLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const links = [
    { href: "/dashboard/admin/community", label: "Overview" },
    { href: "/dashboard/admin/community/posts", label: "Posts" },
    { href: "/dashboard/admin/community/questions", label: "Q&A" },
    { href: "/dashboard/admin/community/reports", label: "Reports" },
    { href: "/dashboard/admin/community/faq", label: "FAQs" },
    { href: "/dashboard/admin/community/mentors", label: "Mentors" },
    { href: "/dashboard/admin/community/notices/new", label: "New Notice" },
  ];

  return (
    <div className="flex min-h-screen">
      <aside className="w-64 bg-gray-50 border-r p-4">
        <h2 className="text-lg font-bold mb-4">Community Admin</h2>
        <nav className="space-y-1">
          {links.map((l) => {
            const active = pathname === l.href;
            return (
              <Link
                key={l.href}
                href={l.href}
                className={`block px-3 py-2 rounded text-sm ${
                  active ? "bg-blue-100 text-blue-700 font-medium" : "text-gray-700 hover:bg-gray-100"
                }`}
              >
                {l.label}
              </Link>
            );
          })}
        </nav>
      </aside>
      <main className="flex-1 p-6">{children}</main>
    </div>
  );
}