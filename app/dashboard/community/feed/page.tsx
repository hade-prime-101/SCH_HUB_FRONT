"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Search,
  SlidersHorizontal,
  Heart,
  MessageCircle,
  Pin,
  RefreshCw,
  Loader2,
  Plus,
  User,
  ChevronDown,
  X,
} from "lucide-react";
import RefreshButton from "@/components/shared/RefreshButton";
import { communityApi } from "@/lib/api/community";
import BottomNav from "@/components/shared/BottomNav";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Reaction {
  type: string;
  count: number;
}

interface Post {
  id: string;
  content: string;
  section: string;
  priority: string;
  isPinned: boolean;
  isAnonymous: boolean;
  createdAt: string;
  reactions: Reaction[];
  commentCount?: number;
  author?: { id: string; fullName: string; role?: string };
}

// ─── Constants ────────────────────────────────────────────────────────────────

const SECTIONS = [
  { label: "All",            value: ""               },
  { label: "Lounge",         value: "LOUNGE"         },
  { label: "Dept Updates",   value: "DEPT_UPDATES"   },
  { label: "Notice Board",   value: "NOTICE_BOARD"   },
  { label: "Cross Level",    value: "CROSS_LEVEL"    },
  { label: "Q&A",            value: "QNA"            },
  { label: "Study Groups",   value: "STUDY_GROUPS"   },
  { label: "Freshers",       value: "FRESHERS_CORNER"},
  { label: "Anonymous",      value: "ANONYMOUS"      },
  { label: "Campus Culture", value: "CAMPUS_CULTURE" },
];

const SORT_OPTIONS = [
  { label: "Newest",    value: "newest" },
  { label: "Popular",   value: "popular" },
  { label: "Pinned",    value: "pinned" },
];

const PAGE_SIZE = 10;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  const h = Math.floor(m / 60);
  const d = Math.floor(h / 24);
  if (m < 1)  return "Just now";
  if (m < 60) return `${m}m ago`;
  if (h < 24) return `${h}h ago`;
  if (d < 7)  return `${d}d ago`;
  return new Date(iso).toLocaleDateString([], { month: "short", day: "numeric" });
}

function getInitials(name?: string) {
  if (!name) return null;
  return name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
}

function sectionColor(section: string) {
  switch (section) {
    case "ACADEMIC":      return "bg-blue-50 text-blue-600";
    case "EVENTS":        return "bg-amber-50 text-amber-600";
    case "MARKETPLACE":   return "bg-emerald-50 text-emerald-600";
    case "WELFARE":       return "bg-rose-50 text-rose-600";
    case "ANNOUNCEMENT":  return "bg-violet-50 text-violet-600";
    default:              return "bg-muted text-muted-foreground";
  }
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function PostSkeleton() {
  return (
    <div className="bg-card rounded-2xl p-4 shadow-sm animate-pulse">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-8 h-8 rounded-full bg-muted" />
        <div className="flex-1">
          <div className="w-24 h-3 bg-muted rounded mb-1" />
          <div className="w-16 h-2.5 bg-muted rounded" />
        </div>
      </div>
      <div className="w-full h-3 bg-muted rounded mb-2" />
      <div className="w-4/5 h-3 bg-muted rounded mb-2" />
      <div className="w-2/3 h-3 bg-muted rounded" />
    </div>
  );
}

// ─── Post Card ────────────────────────────────────────────────────────────────

function PostCard({ post }: { post: Post }) {
  const name  = post.isAnonymous ? "Anonymous" : (post.author?.fullName ?? "Unknown");
  const inits = post.isAnonymous ? null : getInitials(post.author?.fullName);
  const totalRxn = post.reactions?.reduce((s, r) => s + r.count, 0) ?? 0;
  const label = post.section.replace(/_/g, " ");

  return (
    <Link
      href={`/dashboard/community/${post.id}`}
      className={`block bg-card rounded-2xl p-4 shadow-sm active:scale-[0.99] transition-transform ${
        post.isPinned ? "border-l-2 border-primary" : ""
      }`}
    >
      {/* Author row */}
      <div className="flex items-center gap-2 mb-2">
        <span className="w-8 h-8 rounded-full bg-accent flex items-center justify-center shrink-0 text-[10px] font-bold text-primary">
          {inits ?? <User className="w-4 h-4 text-muted-foreground" />}
        </span>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-foreground truncate">{name}</p>
          <p className="text-[10px] text-muted-foreground">{timeAgo(post.createdAt)}</p>
        </div>
        {post.isPinned && <Pin className="w-3.5 h-3.5 text-primary shrink-0" />}
      </div>

      {/* Content */}
      <p className="text-xs text-foreground leading-relaxed line-clamp-3 mb-3">
        {post.content}
      </p>

      {/* Footer */}
      <div className="flex items-center gap-3">
        <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
          <Heart className="w-3 h-3" /> {totalRxn > 0 ? totalRxn : "—"}
        </span>
        <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
          <MessageCircle className="w-3 h-3" /> {post.commentCount ?? 0}
        </span>
        <span className={`ml-auto text-[10px] font-semibold rounded-lg px-2 py-0.5 ${sectionColor(post.section)}`}>
          {label}
        </span>
      </div>
    </Link>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function FeedPage() {
  const router = useRouter();

  const [posts,       setPosts]       = useState<Post[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing,  setRefreshing]  = useState(false);
  const [hasMore,     setHasMore]     = useState(true);
  const [page,        setPage]        = useState(1);

  const [search,      setSearch]      = useState("");
  const [activeSection, setActiveSection] = useState("");
  const [sortBy,      setSortBy]      = useState("newest");
  const [showFilters, setShowFilters] = useState(false);

  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const loaderRef   = useRef<HTMLDivElement | null>(null);

  // ─── Fetch ──────────────────────────────────────────────────────────────

  const fetchPosts = useCallback(async (opts: {
    pageNum: number;
    section: string;
    sort: string;
    query: string;
    append?: boolean;
    isRefresh?: boolean;
  }) => {
    const { pageNum, section, sort, query, append, isRefresh } = opts;

    if (isRefresh) setRefreshing(true);
    else if (append) setLoadingMore(true);
    else setLoading(true);

    try {
      const params: Record<string, string> = {
        page:  String(pageNum),
        limit: String(PAGE_SIZE),
      };
      if (section) params.section = section;
      if (query)   params.search  = query;
      if (sort === "popular") params.sort = "popular";
      if (sort === "pinned")  params.pinned = "true";

      const res  = await communityApi.getFeed(params);
      const raw  = res as unknown;
      const obj  = raw as Record<string, unknown>;

      let items: Post[] = [];
      if (Array.isArray(raw)) items = raw as Post[];
      else {
        for (const key of ["data", "posts", "feed"]) {
          if (Array.isArray(obj?.[key])) { items = obj[key] as Post[]; break; }
        }
      }

      setHasMore(items.length === PAGE_SIZE);
      setPosts((prev) => append ? [...prev, ...items] : items);
    } catch {
      // keep existing posts on error
    } finally {
      setLoading(false);
      setLoadingMore(false);
      setRefreshing(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    fetchPosts({ pageNum: 1, section: activeSection, sort: sortBy, query: search });
    setPage(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeSection, sortBy]);

  // Debounced search
  useEffect(() => {
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => {
      setPage(1);
      fetchPosts({ pageNum: 1, section: activeSection, sort: sortBy, query: search });
    }, 400);
    return () => { if (searchTimer.current) clearTimeout(searchTimer.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  // Infinite scroll
  useEffect(() => {
    const el = loaderRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && hasMore && !loadingMore && !loading) {
          const nextPage = page + 1;
          setPage(nextPage);
          fetchPosts({ pageNum: nextPage, section: activeSection, sort: sortBy, query: search, append: true });
        }
      },
      { threshold: 0.1 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [hasMore, loadingMore, loading, page, activeSection, sortBy, search, fetchPosts]);

  // ─── Refresh ────────────────────────────────────────────────────────────

  function handleRefresh() {
    setPage(1);
    fetchPosts({ pageNum: 1, section: activeSection, sort: sortBy, query: search, isRefresh: true });
  }

  // ─── Render ─────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-muted pb-24">

      {/* ── Sticky header ─────────────────────────────────────────────────── */}
      <div className="sticky top-0 z-10 bg-muted px-4 pt-4 pb-2">

        {/* Title row */}
        <div className="flex items-center gap-3 mb-3">
          <button
            onClick={() => router.back()}
            className="w-9 h-9 rounded-xl flex items-center justify-center bg-card shadow-sm"
            aria-label="Go back"
          >
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
          <h1 className="flex-1 text-xl font-bold text-foreground">Feed</h1>
          <RefreshButton onClick={handleRefresh} loading={refreshing} />
        </div>

        {/* Search row */}
        <div className="flex items-center gap-2 mb-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search posts…"
              className="w-full rounded-xl border border-border bg-card pl-9 pr-8 py-2.5 text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2"
              >
                <X className="w-3.5 h-3.5 text-muted-foreground" />
              </button>
            )}
          </div>
          <button
            onClick={() => setShowFilters((v) => !v)}
            className={`w-10 h-10 shrink-0 rounded-xl border border-border flex items-center justify-center transition ${
              showFilters ? "bg-primary border-primary" : "bg-card"
            }`}
            aria-label="Toggle filters"
          >
            <SlidersHorizontal className={`w-4 h-4 ${showFilters ? "text-primary-foreground" : "text-foreground"}`} />
          </button>
        </div>

        {/* Filter panel */}
        {showFilters && (
          <div className="bg-card border border-border rounded-2xl p-3 mb-2 shadow-sm">
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide mb-2">Sort by</p>
            <div className="flex gap-2 flex-wrap mb-3">
              {SORT_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setSortBy(opt.value)}
                  className={`text-xs font-semibold rounded-full px-3 py-1 transition ${
                    sortBy === opt.value
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Section pills */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none -mx-4 px-4">
          {SECTIONS.map((s) => (
            <button
              key={s.value}
              onClick={() => setActiveSection(s.value)}
              className={`shrink-0 text-xs font-semibold rounded-full px-3 py-1.5 transition ${
                activeSection === s.value
                  ? "bg-primary text-primary-foreground"
                  : "bg-card text-muted-foreground border border-border"
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Post list ─────────────────────────────────────────────────────── */}
      <div className="px-4 pt-3 flex flex-col gap-3">

        {loading ? (
          <>
            {[...Array(4)].map((_, i) => <PostSkeleton key={i} />)}
          </>
        ) : posts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-14 h-14 rounded-full bg-card flex items-center justify-center mb-3">
              <MessageCircle className="w-6 h-6 text-muted-foreground" />
            </div>
            <p className="text-sm font-semibold text-foreground mb-1">No posts yet</p>
            <p className="text-xs text-muted-foreground">
              {search ? "Try a different search term." : "Be the first to post in the community."}
            </p>
          </div>
        ) : (
          <>
            {posts.map((post) => <PostCard key={post.id} post={post} />)}

            {/* Infinite scroll sentinel */}
            <div ref={loaderRef} className="py-2 flex justify-center">
              {loadingMore && <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />}
              {!hasMore && posts.length > 0 && (
                <p className="text-xs text-muted-foreground">You&apos;re all caught up</p>
              )}
            </div>
          </>
        )}
      </div>

      {/* FAB */}
      <Link
        href="/dashboard/community/create"
        className="fixed bottom-24 right-6 flex items-center gap-2 bg-primary text-primary-foreground font-semibold rounded-full px-5 py-3.5 shadow-lg active:scale-95 transition z-10"
        aria-label="Write a post"
      >
        <Plus className="w-5 h-5" /> Write post
      </Link>

      <BottomNav />
    </div>
  );
}
