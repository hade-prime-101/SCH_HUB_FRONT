"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Bell,
  BellOff,
  CheckCheck,
  Trash2,
  Loader2,
  AlertTriangle,
  RefreshCw,
  ShoppingBag,
  Users,
  Calendar,
  BookOpen,
  GraduationCap,
  AlertCircle,
  MessageCircle,
  Info,
} from "lucide-react";
import { notificationsApi } from "@/lib/api/planner";

// ─── Types ────────────────────────────────────────────────────────────────────

type NotifType =
  | "MARKETPLACE" | "COMMUNITY" | "EVENT" | "STUDY"
  | "GRADE" | "EMERGENCY" | "REMINDER" | "SYSTEM";

interface Notification {
  id: string;
  type: NotifType;
  title: string;
  body: string;
  isRead: boolean;
  createdAt: string;
  link?: string;
}

type FilterTab = "ALL" | "UNREAD";

// ─── Constants ────────────────────────────────────────────────────────────────

const TYPE_CONFIG: Record<NotifType, { icon: React.ElementType; bg: string; color: string }> = {
  MARKETPLACE: { icon: ShoppingBag,    bg: "bg-accent",         color: "text-primary" },
  COMMUNITY:   { icon: MessageCircle,  bg: "bg-blue-100",       color: "text-blue-600" },
  EVENT:       { icon: Calendar,       bg: "bg-emerald-100",    color: "text-emerald-600" },
  STUDY:       { icon: BookOpen,       bg: "bg-violet-100",     color: "text-violet-600" },
  GRADE:       { icon: GraduationCap,  bg: "bg-amber-100",      color: "text-amber-600" },
  EMERGENCY:   { icon: AlertCircle,    bg: "bg-destructive/10", color: "text-destructive" },
  REMINDER:    { icon: Bell,           bg: "bg-muted",          color: "text-muted-foreground" },
  SYSTEM:      { icon: Info,           bg: "bg-muted",          color: "text-muted-foreground" },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1)   return "just now";
  if (mins < 60)  return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24)   return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7)   return `${days}d ago`;
  return new Date(iso).toLocaleDateString([], { month: "short", day: "numeric" });
}

// ─── Notification Row ─────────────────────────────────────────────────────────

function NotifRow({
  notif,
  onRead,
  onDelete,
  deleting,
}: {
  notif:    Notification;
  onRead:   (id: string) => void;
  onDelete: (id: string) => void;
  deleting: boolean;
}) {
  const cfg = TYPE_CONFIG[notif.type] ?? TYPE_CONFIG.SYSTEM;
  const Icon = cfg.icon;

  const content = (
    <div
      className={`flex items-start gap-3 bg-card rounded-2xl px-4 py-4 transition-colors ${
        !notif.isRead ? "border-l-4 border-primary" : ""
      }`}
      onClick={() => !notif.isRead && onRead(notif.id)}
    >
      {/* Icon */}
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${cfg.bg}`}>
        <Icon className={`w-5 h-5 ${cfg.color}`} />
      </div>

      {/* Text */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p className={`text-sm leading-snug ${notif.isRead ? "text-muted-foreground" : "font-semibold text-foreground"}`}>
            {notif.title}
          </p>
          {!notif.isRead && (
            <span className="w-2 h-2 rounded-full bg-primary shrink-0 mt-1" />
          )}
        </div>
        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2 leading-relaxed">
          {notif.body}
        </p>
        <p className="text-xs text-muted-foreground mt-1">{timeAgo(notif.createdAt)}</p>
      </div>

      {/* Delete */}
      <button
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); onDelete(notif.id); }}
        disabled={deleting}
        aria-label="Delete notification"
        className="shrink-0 p-1 text-muted-foreground hover:text-destructive transition-colors"
      >
        {deleting
          ? <Loader2 className="w-4 h-4 animate-spin" />
          : <Trash2 className="w-4 h-4" />
        }
      </button>
    </div>
  );

  // Wrap in Link only if there's a destination
  if (notif.link) {
    return (
      <Link href={notif.link} className="block">
        {content}
      </Link>
    );
  }
  return <div className="cursor-default">{content}</div>;
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function NotificationsPage() {
  const router = useRouter();

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState<string | null>(null);
  const [filter, setFilter]       = useState<FilterTab>("ALL");
  const [markingAll, setMarkingAll]   = useState(false);
  const [deletingId, setDeletingId]   = useState<string | null>(null);

  // ── fetch ──────────────────────────────────────────────────────────────────

  const fetchNotifications = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const params: Record<string, string> = { page: "1", limit: "50" };
      if (filter === "UNREAD") params.isRead = "false";
      const data = await notificationsApi.getNotifications(params);
      const list = Array.isArray(data) ? data : (data?.items ?? data?.notifications ?? []);
      setNotifications(list);
    } catch {
      setError("Couldn't load notifications.");
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => { fetchNotifications(); }, [fetchNotifications]);

  // ── actions ────────────────────────────────────────────────────────────────

  async function handleMarkRead(id: string) {
    setNotifications(p => p.map(n => n.id === id ? { ...n, isRead: true } : n));
    try { await notificationsApi.markRead(id); }
    catch { setNotifications(p => p.map(n => n.id === id ? { ...n, isRead: false } : n)); }
  }

  async function handleMarkAllRead() {
    setMarkingAll(true);
    setNotifications(p => p.map(n => ({ ...n, isRead: true })));
    try { await notificationsApi.markAllRead(); }
    catch { setNotifications(p => p.map(n => ({ ...n, isRead: false }))); }
    finally { setMarkingAll(false); }
  }

  async function handleDelete(id: string) {
    setDeletingId(id);
    setNotifications(p => p.filter(n => n.id !== id)); // optimistic
    try { await notificationsApi.deleteNotification(id); }
    catch { fetchNotifications(); } // revert on failure
    finally { setDeletingId(null); }
  }

  // ── derived ────────────────────────────────────────────────────────────────

  const visible     = filter === "UNREAD" ? notifications.filter(n => !n.isRead) : notifications;
  const unreadCount = notifications.filter(n => !n.isRead).length;
  const hasUnread   = unreadCount > 0;

  return (
    <div className="min-h-screen w-full bg-muted pb-10">

      {/* ── Header ── */}
      <div className="bg-card px-5 pt-8 pb-4 sticky top-0 z-20 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <button onClick={() => router.back()} aria-label="Go back">
              <ArrowLeft className="w-6 h-6 text-foreground" />
            </button>
            <div>
              <h1 className="font-serif text-2xl font-bold text-foreground">Notifications</h1>
              {unreadCount > 0 && (
                <p className="text-muted-foreground text-xs">{unreadCount} unread</p>
              )}
            </div>
          </div>

          {/* Right-side actions */}
          <div className="flex items-center gap-2">
            {hasUnread && (
              <button
                onClick={handleMarkAllRead}
                disabled={markingAll}
                className="flex items-center gap-1.5 text-primary text-sm font-semibold disabled:opacity-50"
                aria-label="Mark all as read"
              >
                {markingAll
                  ? <Loader2 className="w-4 h-4 animate-spin" />
                  : <CheckCheck className="w-4 h-4" />
                }
                All read
              </button>
            )}
          </div>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-2">
          {(["ALL", "UNREAD"] as FilterTab[]).map(tab => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`flex-1 py-2.5 rounded-2xl text-sm font-bold transition-colors ${
                filter === tab
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {tab === "UNREAD" && unreadCount > 0 ? `Unread (${unreadCount})` : tab}
            </button>
          ))}
        </div>
      </div>

      <div className="px-5 pt-4 flex flex-col gap-2">
        {/* Error banner */}
        {error && (
          <div className="flex items-center gap-3 bg-destructive/10 rounded-2xl px-4 py-3">
            <AlertTriangle className="w-4 h-4 text-destructive shrink-0" />
            <p className="text-sm text-destructive flex-1">{error}</p>
            <button onClick={fetchNotifications} aria-label="Retry">
              <RefreshCw className="w-4 h-4 text-destructive" />
            </button>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="flex justify-center py-10">
            <Loader2 className="w-7 h-7 text-primary animate-spin" />
          </div>
        )}

        {/* Empty state */}
        {!loading && visible.length === 0 && (
          <div className="flex flex-col items-center gap-3 py-20 text-center">
            {filter === "UNREAD"
              ? <CheckCheck className="w-12 h-12 text-muted-foreground/30" />
              : <BellOff className="w-12 h-12 text-muted-foreground/30" />
            }
            <p className="font-semibold text-muted-foreground">
              {filter === "UNREAD" ? "You're all caught up!" : "No notifications yet"}
            </p>
            {filter === "UNREAD" && (
              <button onClick={() => setFilter("ALL")} className="text-primary text-sm font-semibold underline underline-offset-2">
                View all
              </button>
            )}
          </div>
        )}

        {/* List */}
        {!loading && visible.map(notif => (
          <NotifRow
            key={notif.id}
            notif={notif}
            onRead={handleMarkRead}
            onDelete={handleDelete}
            deleting={deletingId === notif.id}
          />
        ))}
      </div>
    </div>
  );
}
