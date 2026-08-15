// app/study/layout.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { Menu, X, BookOpen, FileText, Brain, Sparkles, BarChart3, Calculator, LayoutDashboard } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/study", label: "Overview", icon: LayoutDashboard },
  { href: "/study/materials", label: "Materials", icon: BookOpen },
  { href: "/study/quizzes", label: "Quizzes", icon: Brain },
  { href: "/study/personal", label: "AI Study", icon: Sparkles },
  { href: "/study/summaries", label: "Summaries", icon: BarChart3 },
  { href: "/study/cgpa", label: "CGPA", icon: Calculator },
];

export default function StudyLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + "/");

  return (
    <div className="flex min-h-screen bg-muted/30">
      {/* Mobile menu toggle */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-30 bg-card border-b border-border px-4 h-14 flex items-center justify-between">
        <span className="font-semibold text-foreground">Study Centre</span>
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 rounded-lg hover:bg-muted transition"
          aria-label="Toggle navigation"
        >
          {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile drawer overlay */}
      {mobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 z-20 bg-black/40"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Mobile drawer */}
      <div
        className={cn(
          "lg:hidden fixed top-0 left-0 h-full w-64 bg-card border-r border-border z-30 transform transition-transform duration-200 ease-in-out",
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="p-4 border-b border-border h-14 flex items-center">
          <span className="font-bold text-foreground">Study Centre</span>
        </div>
        <nav className="p-3 space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileMenuOpen(false)}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors",
                isActive(item.href)
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <item.icon className="w-4 h-4" />
              {item.label}
            </Link>
          ))}
        </nav>
      </div>

      {/* Desktop sidebar */}
      <aside className="hidden lg:flex w-64 flex-col border-r border-border bg-card sticky top-0 h-screen">
        <div className="p-4 border-b border-border">
          <span className="font-bold text-foreground text-lg">Study Centre</span>
        </div>
        <nav className="p-3 space-y-1 flex-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors",
                isActive(item.href)
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <item.icon className="w-4 h-4" />
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>

      {/* Main content */}
      <main className="flex-1 lg:ml-0 mt-14 lg:mt-0">
        <div className="max-w-6xl mx-auto p-4 sm:p-6">{children}</div>
      </main>
    </div>
  );
}