"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

import BottomNav from "@/components/shared/BottomNav";
import PullToRefresh from "@/components/shared/PullToRefresh";

import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { DashboardStats } from "@/components/dashboard/DashboardStats";
import { QuickActions } from "@/components/dashboard/QuickActions";
import { NextUp } from "@/components/dashboard/NextUp";
import { NoticeBoard } from "@/components/dashboard/NoticeBoard";
import { SchedulePreview } from "@/components/dashboard/SchedulePreview";
import { RemindersPreview } from "@/components/dashboard/RemindersPreview";
import { EventsPreview } from "@/components/dashboard/EventsPreview";
import { NotificationsPreview } from "@/components/dashboard/NotificationsPreview";
import { CommunityFeed } from "@/components/dashboard/CommunityFeed";

import {
  getGreeting,
  getInitials,
  getStoredUser,
  getTimeValue,
  isUnauthorized,
  asArray,
} from "@/lib/dashboard-utils";

import { plannerApi, notificationsApi } from "@/lib/api/planner.api";
import { schoolApi } from "@/lib/api/school.api";
import { communityApi } from "@/lib/api/community.api";

// ── Local view-model types ──────────────────────────────────────────────────

type DashboardUser = {
  fullName: string;
  profilePictureUrl?: string | null;
};

type AgendaItem = {
  id: string;
  title: string;
  startTime?: string | null;
  endTime?: string | null;
  venue?: string | null;
  sourceType?: string | null;
};

type DashboardEvent = {
  id: string;
  title: string;
  startDate: string;
  venue?: string | null;
  time?: string | null;
};

type Notification = {
  id: string;
  title?: string | null;
  message?: string | null;
  createdAt: string;
  isRead?: boolean;
};

type Notice = {
  id: string;
  content: string;
};

type CommunityPost = {
  id: string;
  content: string;
  isAnonymous?: boolean;
  isPinned?: boolean;
  author?: {
    fullName?: string | null;
  } | null;
};

// ── Main Component ──────────────────────────────────────────────────────────

export default function DashboardPage() {
  const router = useRouter();

  const [user, setUser] = useState<DashboardUser | null>(null);
  const [agenda, setAgenda] = useState<AgendaItem[]>([]);
  const [events, setEvents] = useState<DashboardEvent[]>([]);
  const [feed, setFeed] = useState<CommunityPost[]>([]);
  const [notices, setNotices] = useState<Notice[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const storedUser = getStoredUser();
    if (storedUser) setUser(storedUser);

    try {
      const [agendaResult, eventsResult, feedResult, notificationsResult, noticesResult] =
        await Promise.allSettled([
          plannerApi.getTodayPlanner(),
          schoolApi.listEvents({ upcoming: true }),
          communityApi.getFeed({ limit: "3" }),
          notificationsApi.listNotifications({ limit: 5 }),
          communityApi.getNotices({ section: "NOTICE_BOARD", limit: "3" }),
        ]);

      if (
        [agendaResult, eventsResult, feedResult, notificationsResult, noticesResult].some(
          (r) => r.status === "rejected" && isUnauthorized(r.reason)
        )
      ) {
        router.replace("/login");
        return;
      }

      if (agendaResult.status === "fulfilled") {
        setAgenda(asArray<AgendaItem>(agendaResult.value, ["items", "agenda"]));
      }
      if (eventsResult.status === "fulfilled") {
        setEvents(asArray<DashboardEvent>(eventsResult.value, ["items", "events"]));
      }
      if (feedResult.status === "fulfilled") {
        setFeed(asArray<CommunityPost>(feedResult.value, ["items"]).slice(0, 3));
      }
      if (notificationsResult.status === "fulfilled") {
        const response = notificationsResult.value;
        const items = asArray<Notification>(response, ["data", "items"]);
        setNotifications(items.slice(0, 3));
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const explicitUnread = (response as any)?.unreadCount ?? (response as any)?.unread;
        setUnreadCount(
          typeof explicitUnread === "number" ? explicitUnread : items.filter((i) => !i.isRead).length
        );
      }
      if (noticesResult.status === "fulfilled") {
        setNotices(asArray<Notice>(noticesResult.value, ["data", "items"]).slice(0, 3));
      }
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [load]);

  // ── Derived state ──────────────────────────────────────────────────────────

  const classes = useMemo(
    () =>
      agenda
        .filter((i) => i.sourceType === "TIMETABLE")
        .sort(
          (a, b) =>
            (getTimeValue(a.startTime) ?? Number.MAX_SAFE_INTEGER) -
            (getTimeValue(b.startTime) ?? Number.MAX_SAFE_INTEGER)
        ),
    [agenda]
  );

  const reminders = useMemo(
    () =>
      agenda
        .filter((i) => i.sourceType === "REMINDER" || i.sourceType === "DEPT_REMINDER")
        .sort(
          (a, b) =>
            (getTimeValue(a.startTime) ?? Number.MAX_SAFE_INTEGER) -
            (getTimeValue(b.startTime) ?? Number.MAX_SAFE_INTEGER)
        ),
    [agenda]
  );

  const nextClass = useMemo(() => {
    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    return (
      classes.find((i) => {
        const start = getTimeValue(i.startTime);
        return start !== null && start >= currentMinutes;
      }) ?? null
    );
  }, [classes]);

  const stats = useMemo(
    () => [
      { value: classes.length, label: "Classes", href: "/campus/timetable" },
      { value: reminders.length, label: "Tasks", href: "/dashboard/planner" },
      { value: notices.length, label: "Notices", href: "/community/posts" },
      { value: events.length, label: "Events", href: "/campus/events" },
    ],
    [classes.length, reminders.length, notices.length, events.length]
  );

  const greeting = getGreeting();
  const initials = getInitials(user?.fullName);

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <>
      <PullToRefresh onRefresh={load} className="min-h-screen">
        <main className="w-full bg-muted pb-28">
          <DashboardHeader
            user={user}
            unreadCount={unreadCount}
            greeting={greeting}
            initials={initials}
          />

          <div className="px-6 flex flex-col gap-5">
            <NextUp nextClass={nextClass} loading={loading} />
            <DashboardStats stats={stats} loading={loading} />
            <QuickActions />
            <NoticeBoard notices={notices} loading={loading} />
            <SchedulePreview items={classes} loading={loading} />
            <RemindersPreview items={reminders} loading={loading} />
            <EventsPreview items={events} loading={loading} />
            <NotificationsPreview notifications={notifications} loading={loading} />
            <CommunityFeed posts={feed} loading={loading} />
          </div>
        </main>
      </PullToRefresh>

      <BottomNav />
    </>
  );
}