// app/dashboard/planner/layout.tsx
"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function PlannerLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  return (
    <div className="p-6">
      <div className="flex space-x-4 mb-6">
        <Link
          href="/dashboard/planner"
          className={`px-4 py-2 rounded ${pathname === '/dashboard/planner' ? 'bg-primary text-primary-foreground' : 'bg-secondary/50'}`}
        >
          Today
        </Link>
        <Link
          href="/dashboard/planner/weekly"
          className={`px-4 py-2 rounded ${pathname.startsWith('/dashboard/planner/weekly') ? 'bg-primary text-primary-foreground' : 'bg-secondary/50'}`}
        >
          Weekly
        </Link>
      </div>
      {children}
    </div>
  );
}