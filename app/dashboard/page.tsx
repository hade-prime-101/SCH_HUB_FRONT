"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Bell,
  Calendar,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  Clock,
  GraduationCap,
  Loader2,
  MapPin,
  Sparkles,
  Store,
} from "lucide-react";

import BottomNav from "@/components/shared/BottomNav";
import PullToRefresh from "@/components/shared/PullToRefresh";
import { plannerApi, notificationsApi } from "@/lib/api/planner.api";
import { schoolApi } from "@/lib/api/school.api";
import { communityApi } from "@/lib/api/community.api";

type User = {
  fullName: string;
  profilePictureUrl?: string | null;
};

type AgendaItem = {
  id: string;
  title: string;
  startTime?: string;
  endTime?: string;
  venue?: string;
  sourceType?: string;
};

type DashboardEvent = {
  id: string;
  title: string;
  startDate: string;
  venue?: string;
};

type Notification = {
  id: string;
  title?: string;
  message?: string;
  createdAt: string;
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
    fullName?: string;
  };
};

const QUICK_ACTIONS = [
  {
    icon: CalendarDays,
    label: "Timetable",
    href: "/campus/timetable",
    accent: "bg-[color-category-timetable-bg] text-[color-category-timetable]",
  },
  {
    icon: CheckCircle2,
    label: "Planner",
    href: "/dashboard/planner",
    accent: "bg-[color-category-planner-bg] text-[color-category-planner]",
  },
  {
    icon: MapPin,
    label: "Campus Map",
    href: "/campus/map",
    accent: "bg-[color-category-campus-bg] text-[color-category-campus]",
  },
  {
    icon: GraduationCap,
    label: "Study",
    href: "/study",
    accent: "bg-primary/10 text-primary",
  },
  {
    icon: Sparkles,
    label: "AI Tools",
    href: "/study",
    accent: "bg-[color-category-ai-bg] text-[color-category-ai]",
  },
  {
    icon: Calendar,
    label: "Events",
    href: "/campus/events",
    accent: "bg-[color-category-events-bg] text-[color-category-events]",
  },
];

function formatTime(time?: string) {
  if (!time) return "";

  const [hours, minutes] = time.split(":").map(Number);
  if (Number.isNaN(hours) || Number.isNaN(minutes)) return time;

  const suffix = hours >= 12 ? "PM" : "AM";
  const hour = hours % 12 || 12;

  return `${hour}:${String(minutes).padStart(2, "0")} ${suffix}`;
}

function formatDate(iso?: string) {
  if (!iso) return "";

  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";

  return date.toLocaleDateString("en-NG", {
    month: "short",
    day: "numeric",
  });
}

function timeAgo(iso?: string) {
  if (!iso) return "";

  const diff = Date.now() - new Date(iso).getTime();
  const minutes = Math.max(0, Math.floor(diff / 60000));
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
}

function SectionHeader({
  title,
  action = "View all",
  href,
}: {
  title: string;
  action?: string;
  href?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3 mb-3">
      <h2 className="font-serif text-xl font-bold text-foreground">
        {title}
      </h2>

      {href && (
        <Link
          href={href}
          className="flex items-center gap-0.5 text-primary text-sm font-medium shrink-0"
        >
          {action}
          <ChevronRight className="w-4 h-4" />
        </Link>
      )}
    </div>
  );
}

function LoadingState() {
  return (
    <div className="flex justify-center py-6">
      <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
    </div>
  );
}

function EmptyState({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-sm text-muted-foreground py-2">{children}</p>
  );
}

export default function DashboardPage() {
  const router = useRouter();

  const [user, setUser] = useState<User | null>(null);
  const [agenda, setAgenda] = useState<AgendaItem[]>([]);
  const [events, setEvents] = useState<DashboardEvent[]>([]);
  const [feed, setFeed] = useState<CommunityPost[]>([]);
  const [notices, setNotices] = useState<Notice[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const greeting = useMemo(() => {
    const hour = new Date().getHours();

    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  }, []);

  const initials = useMemo(() => {
    if (!user?.fullName) return "";

    return user.fullName
      .split(" ")
      .filter(Boolean)
      .map((name) => name[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
  }, [user]);

  const load = useCallback(async () => {
    setLoading(true);

    try {
      const stored = localStorage.getItem("auth_user");
      if (stored) {
        setUser(JSON.parse(stored));
      }
    } catch {
      // Ignore malformed local user data.
    }

    const [
      agendaRes,
      eventsRes,
      feedRes,
      notificationsRes,
      noticesRes,
    ] = await Promise.allSettled([
      plannerApi.getTodayPlanner(),
      schoolApi.listEvents({ upcoming: true, limit: 3 } as any),
      communityApi.getFeed({ limit: "3" }),
      notificationsApi.listNotifications({ limit: 5 }),
      communityApi.getNotices({
        section: "NOTICE_BOARD",
        limit: "3",
      }),
    ]);

    const results = [
      agendaRes,
      eventsRes,
      feedRes,
      notificationsRes,
      noticesRes,
    ];

    const has401 = results.some(
      (result) =>
        result.status === "rejected" &&
        (result.reason?.status === 401 ||
          result.reason?.statusCode === 401),
    );

    if (has401) {
      router.replace("/login");
      return;
    }

    if (agendaRes.status === "fulfilled") {
      const data = agendaRes.value as any;
      setAgenda(
        Array.isArray(data)
          ? data
          : data?.items ?? data?.agenda ?? [],
      );
    }

    if (eventsRes.status === "fulfilled") {
      const data = eventsRes.value as any;
      setEvents(
        Array.isArray(data)
          ? data
          : data?.items ?? data?.events ?? [],
      );
    }

    if (feedRes.status === "fulfilled") {
      const data = feedRes.value as any;
      setFeed(
        Array.isArray(data)
          ? data.slice(0, 3)
          : (data?.items ?? []).slice(0, 3),
      );
    }

    if (notificationsRes.status === "fulfilled") {
      const data = notificationsRes.value as any;
      const items = Array.isArray(data)
        ? data
        : data?.data ?? [];

      setNotifications(items.slice(0, 3));
      setUnreadCount(
        Array.isArray(data) ? data.length : data?.total ?? 0,
      );
    }

    if (noticesRes.status === "fulfilled") {
      const data = noticesRes.value as any;
      setNotices(
        Array.isArray(data)
          ? data.slice(0, 3)
          : (data?.data ?? []).slice(0, 3),
      );
    }

    setLoading(false);
  }, [router]);

  useEffect(() => {
    load();
  }, [load]);

  const classes = useMemo(
    () => agenda.filter((item) => item.sourceType === "TIMETABLE"),
    [agenda],
  );

  const reminders = useMemo(
    () =>
      agenda.filter(
        (item) =>
          item.sourceType === "REMINDER" ||
          item.sourceType === "DEPT_REMINDER",
      ),
    [agenda],
  );

  const nextClass = useMemo(() => {
    const now = new Date();

    return (
      classes.find((item) => {
        if (!item.startTime) return false;

        const [hours, minutes] = item.startTime.split(":").map(Number);
        const start = new Date(now);
        start.setHours(hours, minutes, 0, 0);

        return start.getTime() >= now.getTime();
      }) ?? null
    );
  }, [classes]);

  const todaySummary = [
    {
      value: classes.length,
      label: "Classes",
      href: "/campus/timetable",
    },
    {
      value: reminders.length,
      label: "Tasks",
      href: "/dashboard/planner",
    },
    {
      value: notices.length,
      label: "Notices",
      href: "/community/posts",
    },
    {
      value: events.length,
      label: "Events",
      href: "/campus/events",
    },
  ];

  async function handleRefresh() {
    await load();
  }

  return (
    <>
      <PullToRefresh
        onRefresh={handleRefresh}
        className="min-h-screen"
      >
        <main className="w-full bg-muted pb-28">
          {/* Header */}
          <header className="px-6 pt-8 pb-5 flex items-center justify-between">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-12 h-12 rounded-full bg-accent flex items-center justify-center text-primary font-semibold overflow-hidden shrink-0">
                {user?.profilePictureUrl ? (
                  <img
                    src={user.profilePictureUrl}
                    alt={user.fullName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span>{initials}</span>
                )}
              </div>

              <div className="min-w-0">
                <p className="text-sm text-muted-foreground">
                  {greeting}
                </p>
                <p className="font-bold text-lg text-foreground truncate">
                  {user?.fullName ?? ""}
                </p>
              </div>
            </div>

            <Link
              href="/dashboard/notifications"
              aria-label="Notifications"
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

          <div className="px-6 flex flex-col gap-5">
            {/* Next Up */}
            <section>
              <p className="text-xs font-bold tracking-wider text-muted-foreground uppercase mb-2">
                Next up
              </p>

              <div className="bg-primary text-primary-foreground rounded-3xl p-5 shadow-sm">
                {loading ? (
                  <div className="flex justify-center py-5">
                    <Loader2 className="w-6 h-6 animate-spin opacity-80" />
                  </div>
                ) : nextClass ? (
                  <>
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <p className="text-2xl font-bold leading-tight">
                          {nextClass.title}
                        </p>

                        <div className="flex items-center gap-2 mt-3 text-sm opacity-90">
                          <Clock className="w-4 h-4 shrink-0" />
                          <span>
                            {formatTime(nextClass.startTime)}
                            {nextClass.endTime
                              ? ` – ${formatTime(nextClass.endTime)}`
                              : ""}
                          </span>
                        </div>

                        {nextClass.venue && (
                          <div className="flex items-center gap-2 mt-1.5 text-sm opacity-90">
                            <MapPin className="w-4 h-4 shrink-0" />
                            <span className="truncate">
                              {nextClass.venue}
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="w-11 h-11 rounded-2xl bg-primary-foreground/10 flex items-center justify-center shrink-0">
                        <GraduationCap className="w-5 h-5" />
                      </div>
                    </div>

                    {nextClass.venue && (
                      <Link
                        href={`/campus/map?q=${encodeURIComponent(nextClass.venue)}`}
                        className="mt-5 inline-flex items-center gap-1.5 rounded-full bg-primary-foreground text-primary px-4 py-2.5 text-sm font-bold"
                      >
                        Open map
                        <ChevronRight className="w-4 h-4" />
                      </Link>
                    )}
                  </>
                ) : (
                  <div>
                    <p className="text-xl font-bold">
                      You&apos;re all caught up
                    </p>
                    <p className="text-sm opacity-80 mt-1">
                      Nothing scheduled for the next few hours.
                    </p>
                  </div>
                )}
              </div>
            </section>

            {/* Today at a glance */}
            <section>
              <SectionHeader title="Today at a glance" />

              <div className="grid grid-cols-4 gap-2">
                {todaySummary.map((item) => (
                  <Link
                    key={item.label}
                    href={item.href}
                    className="bg-card rounded-2xl px-2 py-3 text-center active:scale-95 transition-transform"
                  >
                    <p className="text-xl font-bold text-foreground">
                      {loading ? "—" : item.value}
                    </p>
                    <p className="text-[11px] text-muted-foreground font-medium mt-0.5">
                      {item.label}
                    </p>
                  </Link>
                ))}
              </div>
            </section>

            {/* Quick actions */}
            <section>
              <SectionHeader title="Quick actions" />

              <div className="grid grid-cols-3 gap-3">
                {QUICK_ACTIONS.map(
                  ({ icon: Icon, label, href, accent }) => (
                    <Link
                      key={label}
                      href={href}
                      className="bg-card rounded-2xl p-3 flex flex-col items-center gap-2 active:scale-95 transition-transform"
                    >
                      <span
                        className={`w-11 h-11 rounded-xl flex items-center justify-center ${accent}`}
                      >
                        <Icon className="w-5 h-5" />
                      </span>

                      <span className="text-xs font-semibold text-foreground text-center leading-tight">
                        {label}
                      </span>
                    </Link>
                  ),
                )}
              </div>
            </section>

            {/* Notice board */}
            <section className="bg-card rounded-3xl p-5">
              <SectionHeader
                title="Notice Board"
                href="/community/posts"
              />

              {loading ? (
                <LoadingState />
              ) : notices.length === 0 ? (
                <EmptyState>No notices at the moment.</EmptyState>
              ) : (
                <div className="flex flex-col">
                  {notices.map((notice) => (
                    <Link
                      key={notice.id}
                      href={`/community/${notice.id}`}
                      className="flex items-start gap-3 py-2.5 first:pt-0 last:pb-0"
                    >
                      <span className="w-2 h-2 rounded-full bg-warning mt-1.5 shrink-0" />
                      <p className="text-sm font-medium text-foreground line-clamp-2">
                        {notice.content}
                      </p>
                    </Link>
                  ))}
                </div>
              )}
            </section>

            {/* Today's schedule */}
            <section className="bg-card rounded-3xl p-5">
              <SectionHeader
                title="Today&apos;s schedule"
                action="Full timetable"
                href="/campus/timetable"
              />

              {loading ? (
                <LoadingState />
              ) : classes.length === 0 ? (
                <EmptyState>No classes scheduled today.</EmptyState>
              ) : (
                <div className="relative">
                  <div className="absolute left-[25px] top-3 bottom-3 w-px bg-border" />

                  <div className="flex flex-col gap-4">
                    {classes.slice(0, 4).map((item) => (
                      <div
                        key={item.id}
                        className="relative flex items-start gap-3"
                      >
                        <div className="w-[51px] shrink-0 text-right">
                          <p className="text-xs font-bold text-foreground">
                            {formatTime(item.startTime)}
                          </p>
                        </div>

                        <span className="relative z-10 w-2.5 h-2.5 rounded-full bg-primary mt-1.5 shrink-0 ring-4 ring-card" />

                        <div className="flex-1 min-w-0 pb-1">
                          <p className="font-semibold text-foreground truncate">
                            {item.title}
                          </p>

                          {item.venue && (
                            <p className="text-xs text-muted-foreground mt-0.5 truncate">
                              {item.venue}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </section>

            {/* Tasks */}
            <section className="bg-card rounded-3xl p-5">
              <SectionHeader
                title="Your tasks"
                action="View planner"
                href="/dashboard/planner"
              />

              {loading ? (
                <LoadingState />
              ) : reminders.length === 0 ? (
                <EmptyState>
                  Nothing due today. You&apos;re clear.
                </EmptyState>
              ) : (
                <div className="flex flex-col gap-2">
                  {reminders.slice(0, 3).map((item) => (
                    <Link
                      key={item.id}
                      href="/dashboard/planner"
                      className="flex items-center gap-3 rounded-2xl bg-muted p-3.5"
                    >
                      <span className="w-8 h-8 rounded-full bg-card border border-border flex items-center justify-center shrink-0">
                        <ClipboardList className="w-4 h-4 text-primary" />
                      </span>

                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-foreground truncate">
                          {item.title}
                        </p>

                        {item.startTime && (
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {formatTime(item.startTime)}
                          </p>
                        )}
                      </div>

                      <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
                    </Link>
                  ))}
                </div>
              )}
            </section>

            {/* Upcoming events */}
            <section className="bg-card rounded-3xl p-5">
              <SectionHeader
                title="Upcoming events"
                href="/campus/events"
              />

              {loading ? (
                <LoadingState />
              ) : events.length === 0 ? (
                <EmptyState>No upcoming events.</EmptyState>
              ) : (
                <div className="flex flex-col gap-3">
                  {events.slice(0, 2).map((event) => (
                    <div
                      key={event.id}
                      className="flex items-center gap-3 rounded-2xl bg-[color-category-events-bg] p-3.5"
                    >
                      <div className="w-11 h-11 rounded-xl bg-[color-category-events] flex items-center justify-center shrink-0">
                        <Calendar className="w-5 h-5 text-primary-foreground" />
                      </div>

                      <div className="min-w-0">
                        <p className="font-semibold text-foreground truncate">
                          {event.title}
                        </p>

                        <p className="text-xs text-muted-foreground mt-0.5 truncate">
                          {formatDate(event.startDate)}
                          {event.venue ? ` · ${event.venue}` : ""}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Notifications */}
            <section className="bg-card rounded-3xl p-5">
              <SectionHeader
                title="Recent notifications"
                href="/dashboard/notifications"
              />

              {loading ? (
                <LoadingState />
              ) : notifications.length === 0 ? (
                <EmptyState>No new notifications.</EmptyState>
              ) : (
                <div className="flex flex-col gap-3">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className="flex gap-2"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2 shrink-0" />

                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground leading-tight line-clamp-2">
                          {notification.title ??
                            notification.message ??
                            "Notification"}
                        </p>

                        <p className="text-xs text-muted-foreground mt-0.5">
                          {timeAgo(notification.createdAt)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Community */}
            <section className="bg-card rounded-3xl p-5">
              <SectionHeader
                title="Community"
                action="View feed"
                href="/community"
              />

              {loading ? (
                <LoadingState />
              ) : feed.length === 0 ? (
                <EmptyState>No community posts yet.</EmptyState>
              ) : (
                <div className="flex flex-col gap-3">
                  {feed.map((post) => (
                    <Link
                      key={post.id}
                      href={`/community/${post.id}`}
                      className="rounded-2xl bg-muted p-4 active:opacity-80"
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-8 h-8 rounded-full bg-border shrink-0 flex items-center justify-center text-xs font-bold text-muted-foreground">
                          {post.isAnonymous
                            ? "A"
                            : (post.author?.fullName?.[0] ?? "U").toUpperCase()}
                        </div>

                        <p className="text-sm font-semibold text-foreground truncate">
                          {post.isAnonymous
                            ? "Anonymous"
                            : post.author?.fullName ?? "Unknown"}
                        </p>

                        {post.isPinned && (
                          <span className="text-[10px] font-medium text-primary border border-ring rounded-full px-2 py-0.5 shrink-0">
                            Pinned
                          </span>
                        )}
                      </div>

                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {post.content}
                      </p>
                    </Link>
                  ))}
                </div>
              )}
            </section>
          </div>
        </main>
      </PullToRefresh>

      <BottomNav />
    </>
  );
}