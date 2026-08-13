"use client";

import Link from "next/link";
import { MessageSquare, HelpCircle, Users, BookOpen } from "lucide-react";

const sections = [
  {
    title: "Posts",
    description: "Share updates, announcements, and engage with your community",
    icon: MessageSquare,
    href: "/community/posts",
    color: "bg-primary/10 text-primary",
  },
  {
    title: "Questions & Answers",
    description: "Ask questions and help others learn",
    icon: HelpCircle,
    href: "/community/questions",
    color: "bg-primary/10 text-primary",
  },
  {
    title: "Mentors",
    description: "Find mentors or become one for your courses",
    icon: Users,
    href: "/community/mentors",
    color: "bg-success/10 text-success",
  },
  {
    title: "FAQ",
    description: "Frequently asked questions from your community",
    icon: BookOpen,
    href: "/community/faq",
    color: "bg-warning/10 text-warning",
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
