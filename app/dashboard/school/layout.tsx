"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function SchoolLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const links = [
    { href: "/dashboard/school", label: "Overview" },
    { href: "/dashboard/school/timetable", label: "Timetable" },
    { href: "/dashboard/school/events", label: "Events" },
    { href: "/dashboard/school/emergency", label: "Emergency Contacts" },
  ];

  return (
    <div className="flex min-h-screen">
      <aside className="w-64 bg-gray-50 border-r p-4">
        <h2 className="text-lg font-bold mb-4">School Hub</h2>
        <nav className="space-y-1">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={`block px-3 py-2 rounded text-sm ${
                pathname === l.href ? "bg-blue-100 text-blue-700 font-medium" : "text-gray-700 hover:bg-gray-100"
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