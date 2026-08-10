"use client";

import { useState, useEffect, useCallback } from "react";
import BackButton from "@/components/shared/BackButton";
import BottomNav from "@/components/shared/BottomNav";
import Link from "next/link";
import {
  Pin,
  Bell,
  FileText,
  Loader2,
  AlertTriangle,
} from "lucide-react";
import { communityApi } from "@/lib/api/community";

// ─── Types ────────────────────────────────────────────────────────────────────

type Section = "NOTICE_BOARD" | "LOUNGE" | "DEPT_UPDATES";

interface Notice {
  id: string;
  content: string;
  section: Section;
  priority: string;
  isPinned: boolean;
  createdAt: string;
  courseTag?: string;
  author?: { id: string; fullName: string; role?: string; };
}

// ─── Constants ────────────────────────────────────────────────────────────────

const TABS: { label: string; value: Section }[] = [
  { label: "Notice Board", value: "NOTICE_BOARD" },
  { label: "Lounge",       value: "LOUNGE" },
  { label: "Dept Updates", value: "DEPT_UPDATES" },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function timeAgo(iso: string): string {
  const diff  = Date.now() - new Date(iso).getTime();
  const mins  = Math.floor(diff / 60000);
  const hours = Math.floor(mins / 60);
  const days  = Math.floor(hours / 24);
  if (mins  < 1)  return "Just now";
  if (mins  < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days  < 7)  return `${days}d ago`;
  return new Date(iso).toLocaleDateString([], { month: "short", day: "numeric" });
}

function noticeIcon(notice: Notice): React.ElementType {
  if (notice.isPinned)           return Pin;
  if (notice.priority === "URGENT") return Bell;
  return FileText;
}

function noticeTags(notice: Notice): string[] {
  const tags: string[] = [notice.section];
  if (notice.priority && notice.priority !== "GENERAL") tags.push(notice.priority);
  if (notice.author?.role) tags.push(notice.author.role.replace("_", " "));
  return tags;
}

// ─── Notice Card ──────────────────────────────────────────────────────────────

function NoticeCard({ notice }: { notice: Notice }) {
  const Icon = noticeIcon(notice);
  const tags = noticeTags(notice);
  const authorName = notice.author?.fullName ?? "SCH Hub";

  return (
    <Link
      href={`/dashboard/community/${notice.id}`}
      className="block rounded-2xl border border-border bg-card p-5 active:scale-[0.99] transition"
    >
      {/* Tags row */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2 flex-wrap">
          {tags.map((t, i) => (
            <span
              key={t}
              className={`text-xs font-bold px-2 py-1 rounded-lg ${
                i === 0
                  ? "text-foreground font-extrabold"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {t}
            </span>
          ))}
        </div>
        {notice.isPinned && (
          <Pin className="w-4 h-4 text-muted-foreground shrink-0" />
        )}
      </div>

      {/* Body */}
      <div className="flex items-start gap-3">
        <Icon className="w-5 h-5 text-foreground mt-1 shrink-0" />
        <div>
          <h3 className="font-serif text-lg font-bold text-foreground leading-snug">
            {/* notices don't have a title field — use first line of content */}
            {notice.content.split("\n")[0].slice(0, 80)}
            {notice.content.length > 80 ? "…" : ""}
          </h3>
          <p className="text-muted-foreground text-sm mt-1 mb-2">
            {authorName} &bull; {timeAgo(notice.createdAt)}
          </p>
          <p className="text-foreground/80 line-clamp-3">{notice.content}</p>
        </div>
      </div>
    </Link>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function NoticesPage() {
  const [activeTab, setActiveTab]   = useState<Section>("NOTICE_BOARD");
  const [notices, setNotices]       = useState<Notice[]>([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await communityApi.getNotices({
        section: activeTab,
        limit: "30",
      });
      const data: Notice[] = Array.isArray(res) ? res : (res?.data ?? []);
      setNotices(data);
    } catch (e: any) {
      setError(e.message || "Failed to load notices.");
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  useEffect(() => { load(); }, [load]);

  const pinned = notices.filter((n) => n.isPinned);
  const recent = notices.filter((n) => !n.isPinned);

  return (
    <div className="min-h-screen w-full bg-background px-6 py-6 pb-24">
      {/* Header */}
      <BackButton href="/dashboard/community" />
      <div className="flex items-center gap-1.5 text-muted-foreground text-xs font-bold tracking-widest mb-2 mt-4">
        <Pin className="w-3.5 h-3.5" /> PINNED NOTICES
      </div>
      <h1 className="font-serif text-3xl font-bold text-foreground mb-5">
        Notices Board
      </h1>

      {/* Tabs */}
      <div className="flex gap-6 border-b border-border mb-6 overflow-x-auto scrollbar-none">
        {TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setActiveTab(tab.value)}
            className={`text-sm font-bold tracking-wide pb-3 relative shrink-0 transition ${
              activeTab === tab.value ? "text-foreground" : "text-muted-foreground"
            }`}
          >
            {tab.label}
            {activeTab === tab.value && (
              <span className="absolute -bottom-px left-0 right-0 h-0.5 bg-foreground rounded-full" />
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <AlertTriangle className="w-10 h-10 text-destructive" />
          <p className="text-destructive font-medium text-center">{error}</p>
          <button onClick={load} className="text-primary text-sm font-semibold underline">
            Retry
          </button>
        </div>
      ) : notices.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-2">
          <Bell className="w-10 h-10 text-muted-foreground" />
          <p className="text-muted-foreground font-medium">No notices yet</p>
        </div>
      ) : (
        <>
          {/* Pinned */}
          {pinned.length > 0 && (
            <div className="flex flex-col gap-4 mb-8">
              {pinned.map((n) => (
                <NoticeCard key={n.id} notice={n} />
              ))}
            </div>
          )}

          {/* Recent */}
          {recent.length > 0 && (
            <>
              <div className="flex items-center gap-1.5 text-muted-foreground text-xs font-bold tracking-widest mb-4">
                <span>☰</span> RECENT NOTICES
              </div>
              <div className="flex flex-col gap-4">
                {recent.map((n) => (
                  <NoticeCard key={n.id} notice={n} />
                ))}
              </div>
            </>
          )}
        </>
      )}

      {/* Community bottom nav */}
      <BottomNav />
    </div>
  );
}
