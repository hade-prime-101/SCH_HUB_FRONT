// app/study/layout.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function StudyLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const links = [
    { href: "/study", label: "Overview" },
    { href: "/study/materials", label: "Materials" },
    { href: "/study/materials/upload", label: "Upload" },
    { href: "/study/quizzes", label: "Quizzes" },
    { href: "/study/quizzes/create", label: "Create Quiz" },
    { href: "/study/personal", label: "Personal Study" },
    { href: "/study/summaries", label: "Summaries" },
    { href: "/study/cgpa", label: "CGPA Calculator" },
    { href: "/admin/materials/review", label: "Admin Reviews" },
    { href: "/admin/study/analytics", label: "Quiz Analytics" },
  ];

  return (
    <div className="flex min-h-screen">
      <aside className="w-64 bg-muted border-r p-4">
        <h2 className="text-lg font-bold mb-4">Study Dashboard</h2>
        <nav className="space-y-1">
          {links.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`block px-3 py-2 rounded text-sm ${
                  isActive ? "bg-accent text-primary font-medium" : "text-secondary-foreground hover:bg-muted/80"
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