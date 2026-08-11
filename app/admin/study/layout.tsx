// app/dashboard/admin/study/layout.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function AdminStudyLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const links = [
    { href: "/dashboard/admin/study", label: "Overview" },
    { href: "/dashboard/admin/study/materials", label: "Pending Reviews" },
    { href: "/dashboard/admin/study/quizzes", label: "All Quizzes" },
    { href: "/dashboard/admin/study/quizzes/analytics", label: "Quiz Analytics" },
  ];

  return (
    <div className="flex min-h-screen">
      <aside className="w-64 bg-gray-50 border-r p-4">
        <h2 className="text-lg font-bold mb-4">Study Admin</h2>
        <nav className="space-y-1">
          {links.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`block px-3 py-2 rounded text-sm ${
                  isActive
                    ? "bg-blue-100 text-blue-700 font-medium"
                    : "text-gray-700 hover:bg-gray-100"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>
      </aside>
      <main className="flex-1 p-6">{children}</main>
    </div>
  );
}