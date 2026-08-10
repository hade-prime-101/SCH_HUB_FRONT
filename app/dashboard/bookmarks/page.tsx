"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Bookmark,
  BookOpen,
  ShoppingBag,
  Calendar,
  MessageCircle,
  FileText,
  ExternalLink,
  RefreshCw,
  AlertCircle,
} from "lucide-react";
import RefreshButton from "@/components/shared/RefreshButton";
import { usersApi } from "@/lib/api/users";

// ─── Types ────────────────────────────────────────────────────────────────────

type BookmarkType = "MATERIAL" | "LISTING" | "EVENT" | "POST" | string;

interface BookmarkItem {
  id:         string;
  type:       BookmarkType;
  title:      string;
  subtitle?:  string;
  link?:      string;
  createdAt?: string;
}

const TYPE_CONFIG: Record<string, { icon: React.ElementType; bg: string; color: string; label: string }> = {
  MATERIAL: { icon: BookOpen,      bg: "bg-violet-100",  color: "text-violet-600",        label: "Material" },
  LISTING:  { icon: ShoppingBag,   bg: "bg-amber-100",   color: "text-amber-600",          label: "Listing"  },
  EVENT:    { icon: Calendar,      bg: "bg-emerald-100", color: "text-emerald-600",         label: "Event"    },
  POST:     { icon: MessageCircle, bg: "bg-blue-100",    color: "text-blue-600",            label: "Post"     },
  DEFAULT:  { icon: FileText,      bg: "bg-muted",       color: "text-muted-foreground",    label: "Item"     },
};

type FilterTab = "ALL" | "MATERIAL" | "LISTING" | "EVENT" | "POST";

const FILTER_TABS: { key: FilterTab; label: string }[] = [
  { key: "ALL",      label: "All"       },
  { key: "MATERIAL", label: "Materials" },
  { key: "LISTING",  label: "Listings"  },
  { key: "EVENT",    label: "Events"    },
  { key: "POST",     label: "Posts"     },
];

function timeAgo(iso?: string) {
  if (!iso) return "";
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7)  return `${days}d ago`;
  return new Date(iso).toLocaleDateString([], { month: "short", day: "numeric" });
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function BookmarksPage() {
  const router = useRouter();
  const [bookmarks, setBookmarks] = useState<BookmarkItem[]>([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState<string | null>(null);
  const [filter, setFilter]       = useState<FilterTab>("ALL");

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const data = await usersApi.getBookmarks();
      setBookmarks(Array.isArray(data) ? data : []);
    } catch (e: any) {
      setError(e.message ?? "Could not load bookmarks.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const visible = filter === "ALL" ? bookmarks : bookmarks.filter(b => b.type === filter);

  return (
    <div className="min-h-screen w-full bg-muted pb-10">

      {/* Header */}
      <div className="bg-card px-5 pt-8 pb-4 sticky top-0 z-20 shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <button onClick={() => router.back()} aria-label="Go back">
            <ArrowLeft className="w-6 h-6 text-foreground" />
          </button>
          <div className="flex-1">
            <h1 className="font-serif text-2xl font-bold text-foreground">Bookmarks</h1>
            <p className="text-muted-foreground text-xs">{bookmarks.length} saved item{bookmarks.length !== 1 ? "s" : ""}</p>
          </div>
          <RefreshButton onClick={() => load()} loading={loading} />
        </div>

        {/* Filter tabs */}
        <div className="flex gap-2 overflow-x-auto pb-1">
          {FILTER_TABS.map(({ key, label }) => {
            const count = key === "ALL" ? bookmarks.length : bookmarks.filter(b => b.type === key).length;
            if (key !== "ALL" && count === 0) return null;
            return (
              <button
                key={key}
                onClick={() => setFilter(key)}
                className={`shrink-0 px-4 py-2 rounded-2xl text-sm font-semibold transition-colors ${
                  filter === key ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                }`}
              >
                {label}{key !== "ALL" && count > 0 ? ` (${count})` : ""}
              </button>
            );
          })}
        </div>
      </div>

      <div className="px-5 pt-4 flex flex-col gap-3">
        {error && (
          <div className="bg-destructive/10 text-destructive rounded-2xl px-4 py-3 flex items-center gap-2 text-sm">
            <AlertCircle className="w-4 h-4 shrink-0" /> {error}
          </div>
        )}

        {loading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="bg-card rounded-2xl p-4 h-20 animate-pulse" />
          ))
        ) : visible.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-20 text-center">
            <Bookmark className="w-12 h-12 text-muted-foreground/30" />
            <p className="font-semibold text-muted-foreground">
              {filter === "ALL" ? "No bookmarks yet" : `No ${filter.toLowerCase()} bookmarks`}
            </p>
            <p className="text-xs text-muted-foreground">Save materials, listings, events and posts to find them here.</p>
          </div>
        ) : (
          visible.map(item => {
            const cfg  = TYPE_CONFIG[item.type] ?? TYPE_CONFIG.DEFAULT;
            const Icon = cfg.icon;
            const card = (
              <div className="bg-card rounded-2xl px-4 py-4 flex items-center gap-3">
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${cfg.bg}`}>
                  <Icon className={`w-5 h-5 ${cfg.color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground truncate">{item.title}</p>
                  {item.subtitle && <p className="text-xs text-muted-foreground mt-0.5 truncate">{item.subtitle}</p>}
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-lg ${cfg.bg} ${cfg.color}`}>{cfg.label}</span>
                    {item.createdAt && <span className="text-xs text-muted-foreground">{timeAgo(item.createdAt)}</span>}
                  </div>
                </div>
                {item.link && <ExternalLink className="w-4 h-4 text-muted-foreground shrink-0" />}
              </div>
            );
            return item.link
              ? <Link key={item.id} href={item.link}>{card}</Link>
              : <div key={item.id}>{card}</div>;
          })
        )}
      </div>
    </div>
  );
}
