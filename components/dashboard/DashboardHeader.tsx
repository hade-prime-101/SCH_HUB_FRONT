"use client";

import Link from "next/link";
import { Bell } from "lucide-react";

interface DashboardHeaderProps {
  user: { fullName: string; profilePictureUrl?: string | null } | null;
  unreadCount: number;
  greeting: string;
  initials: string;
}

export function DashboardHeader({ user, unreadCount, greeting, initials }: DashboardHeaderProps) {
  return (
    <header className="px-6 pt-8 pb-5 flex items-center justify-between border-b border-border">
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-12 h-12 rounded-full bg-accent flex items-center justify-center text-primary font-semibold overflow-hidden shrink-0">
          {user?.profilePictureUrl ? (
            <img
              src={user.profilePictureUrl}
              alt={`${user.fullName}'s profile`}
              className="w-full h-full object-cover"
            />
          ) : (
            <span aria-hidden="true">{initials}</span>
          )}
        </div>

        <div className="min-w-0">
          <p className="text-sm text-muted-foreground">{greeting}</p>
          <p className="font-bold text-lg text-foreground truncate">
            {user?.fullName ?? "Student"}
          </p>
        </div>
      </div>

      <Link
        href="/dashboard/notifications"
        aria-label={unreadCount > 0 ? `${unreadCount} unread notifications` : "Notifications"}
        className="relative w-11 h-11 rounded-full bg-card shadow-sm flex items-center justify-center shrink-0"
      >
        <Bell className="w-5 h-5 text-foreground" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1 rounded-full bg-destructive text-primary-foreground text-[11px] font-bold flex items-center justify-center">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </Link>
    </header>
  );
}