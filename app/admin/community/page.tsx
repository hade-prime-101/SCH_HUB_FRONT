"use client";

import Link from "next/link";
import { MessageSquare, HelpCircle, AlertTriangle, BookOpen, Users, Megaphone } from "lucide-react";

const sections = [
  {
    title: "Posts",
    description: "Moderate and manage community posts",
    icon: MessageSquare,
    href: "/admin/community/posts",
    color: "bg-blue-100 text-blue-600",
  },
  {
    title: "Questions",
    description: "Review and manage Q&A content",
    icon: HelpCircle,
    href: "/admin/community/questions",
    color: "bg-purple-100 text-purple-600",
  },
  {
    title: "Reports",
    description: "Handle reported content and violations",
    icon: AlertTriangle,
    href: "/admin/community/reports",
    color: "bg-red-100 text-red-600",
  },
  {
    title: "FAQ",
    description: "Manage frequently asked questions",
    icon: BookOpen,
    href: "/admin/community/faq",
    color: "bg-amber-100 text-amber-600",
  },
  {
    title: "Mentors",
    description: "Oversee mentor registrations",
    icon: Users,
    href: "/admin/community/mentors",
    color: "bg-green-100 text-green-600",
  },
  {
    title: "Notices",
    description: "Create and publish official notices",
    icon: Megaphone,
    href: "/admin/community/notices",
    color: "bg-teal-100 text-teal-600",
  },
];

export default function AdminCommunityPage() {
  return (
    <div>
      <h2 className="text-2xl font-bold text-foreground mb-6">Community Management Overview</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {sections.map(({ title, description, icon: Icon, href, color }) => (
          <Link
            key={href}
            href={href}
            className="block bg-card rounded-2xl p-6 hover:shadow-lg transition-shadow"
          >
            <div className={`w-12 h-12 rounded-lg ${color} flex items-center justify-center mb-4`}>
              <Icon className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-lg text-foreground mb-2">{title}</h3>
            <p className="text-sm text-muted-foreground">{description}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
