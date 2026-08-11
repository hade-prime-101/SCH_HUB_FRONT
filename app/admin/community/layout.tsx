"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { MessageSquare, HelpCircle, AlertTriangle, BookOpen, Users, Megaphone } from "lucide-react";

const navItems = [
  { href: "/admin/community", label: "Overview", icon: MessageSquare },
  { href: "/admin/community/posts", label: "Posts", icon: MessageSquare },
  { href: "/admin/community/questions", label: "Questions", icon: HelpCircle },
  { href: "/admin/community/reports", label: "Reports", icon: AlertTriangle },
  { href: "/admin/community/faq", label: "FAQ", icon: BookOpen },
  { href: "/admin/community/mentors", label: "Mentors", icon: Users },
  { href: "/admin/community/notices", label: "Notices", icon: Megaphone },
];

export default function AdminCommunityLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-muted">
      <div className="border-b bg-card">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <h1 className="text-3xl font-bold text-foreground">Community Management</h1>
          <p className="text-muted-foreground mt-1">Moderate and manage community content</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Navigation */}
        <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
          {navItems.map(({ href, label, icon: Icon }) => {
            const isActive = pathname === href || pathname.startsWith(href + "/");
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all whitespace-nowrap ${
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "bg-card text-foreground hover:bg-accent"
                }`}
              >
                <Icon className="w-4 h-4" />
                {label}
              </Link>
            );
          })}
        </div>

        {/* Content */}
        {children}
      </div>
    </div>
  );
}
