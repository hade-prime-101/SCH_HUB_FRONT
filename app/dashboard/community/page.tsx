"use client";

import Link from "next/link";
import { MessageSquare, HelpCircle, Users, BookOpen } from "lucide-react";

const sections = [
  {
    title: "Posts",
    description: "Share updates, announcements, and engage with your community",
    icon: MessageSquare,
    href: "/dashboard/community/posts",
    color: "bg-blue-100 text-blue-600",
  },
  {
    title: "Questions & Answers",
    description: "Ask questions and help others learn",
    icon: HelpCircle,
    href: "/dashboard/community/questions",
    color: "bg-purple-100 text-purple-600",
  },
  {
    title: "Mentors",
    description: "Find mentors or become one for your courses",
    icon: Users,
    href: "/dashboard/community/mentors",
    color: "bg-green-100 text-green-600",
  },
  {
    title: "FAQ",
    description: "Frequently asked questions from your community",
    icon: BookOpen,
    href: "/dashboard/community/faq",
    color: "bg-amber-100 text-amber-600",
  },
];

export default function CommunityPage() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
  );
}
