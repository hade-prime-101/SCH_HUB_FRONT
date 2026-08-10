"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import BottomNav from "@/components/shared/BottomNav";
import BackButton from "@/components/shared/BackButton";
import PullToRefresh from "@/components/shared/PullToRefresh";
import { communityApi } from "@/lib/api/community";
import {
  MessageSquare,
  Megaphone,
  HelpCircle,
  Users,
  GraduationCap,
  BookOpen,
  Heart,
  MessageCircle,
  ArrowBigUp,
  Plus,
  Pin,
  ChevronRight,
  RefreshCw,
  Loader2,
  User,
  Globe,
  Lock,
} from "lucide-react";
import RefreshButton from "@/components/shared/RefreshButton";

// ─── Types ────────────────────────────────────────────────────────────────────

type ReactionType = "LIKE" | "HELPFUL" | "INSIGHTFUL" | "FUNNY" | "SUPPORT";

interface Reaction { type: string; count: number; }

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

interface Notice {
  id: string;
  content: string;
  isPinned: boolean;
  priority: string;
  createdAt: string;
  author?: { fullName: string };
}

interface Question {
  id: string;
  content: string;
  upvoteCount: number;
  answerCount?: number;
  createdAt: string;
  author?: { fullName: string };
}

interface Group {
  id: string;
  name: string;
  description?: string;
  courseCode?: string;
  isPrivate: boolean;
  memberCount?: number;
  _count?: { members: number };
}

interface Mentor {
  id: string;
  courseCode: string;
  user?: { id: string; fullName: string; department?: string; level?: string };
}

interface Faq {
  id: string;
  question: string;
  answer: string;
  category: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const REACTION_EMOJIS: Record<ReactionType, string> = {
  LIKE: "👍", HELPFUL: "💡", INSIGHTFUL: "✨", FUNNY: "😂", SUPPORT: "❤️",
};

const CATEGORY_CARDS = [
  { label: "Feed",    href: "/dashboard/community/feed",    icon: MessageSquare, bg: "bg-blue-100",   fg: "text-blue-600"   },
  { label: "Notices", href: "/dashboard/community/notices", icon: Megaphone,     bg: "bg-amber-100",  fg: "text-amber-600"  },
  { label: "Q&A",     href: "/dashboard/community/qa",      icon: HelpCircle,    bg: "bg-violet-100", fg: "text-violet-600" },
  { label: "Groups",  href: "/dashboard/community/groups",  icon: Users,         bg: "bg-emerald-100",fg: "text-emerald-600"},
  { label: "Mentors", href: "/dashboard/community/mentors", icon: GraduationCap, bg: "bg-sky-100",    fg: "text-sky-600"    },
  { label: "FAQs",    href: "/dashboard/community/faqs",    icon: BookOpen,      bg: "bg-pink-100",   fg: "text-pink-600"   },
];

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

function initials(name?: string) {
  if (!name) return null;
  return name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
}

// ─── Section Header ───────────────────────────────────────────────────────────

function SectionHeader({ title, href }: { title: string; href: string }) {
  return (
    <div className="flex items-center justify-between mb-3">
      <h2 className="text-base font-bold text-foreground">{title}</h2>
      <Link
        href={href}
        className="flex items-center gap-0.5 text-xs font-semibold text-primary"
      >
        See all <ChevronRight className="w-3.5 h-3.5" />
      </Link>
    </div>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function Skeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse rounded-xl bg-muted ${className}`} />;
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function CommunityHubPage() {
  const [posts,    setPosts]    = useState<Post[]>([]);
  const [notices,  setNotices]  = useState<Notice[]>([]);
  const [questions,setQuestions]= useState<Question[]>([]);
  const [groups,   setGroups]   = useState<Group[]>([]);
  const [mentors,  setMentors]  = useState<Mentor[]>([]);
  const [faqs,     setFaqs]     = useState<Faq[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  async function fetchAll(isRefresh = false) {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const [postsRes, noticesRes, questionsRes, groupsRes, mentorsRes, faqsRes] =
        await Promise.allSettled([
          communityApi.getFeed({ page: "1", limit: "3" }),
          communityApi.getNotices({ page: "1", limit: "3" }),
          communityApi.getQuestions({ page: "1", limit: "3" }),
          communityApi.getGroups({ page: "1", limit: "3" }),
          communityApi.getMentors({ page: "1", limit: "3" }),
          communityApi.getFaqs(),
        ]);

      const extract = <T,>(r: PromiseSettledResult<T>, fallback: T): T =>
        r.status === "fulfilled" ? (r.value ?? fallback) : fallback;

      const normalize = <T,>(val: unknown): T[] => {
        if (Array.isArray(val)) return val as T[];
        const obj = val as Record<string, unknown>;
        for (const key of ["data", "posts", "notices", "questions", "groups", "mentors", "faqs"]) {
          if (Array.isArray(obj?.[key])) return obj[key] as T[];
        }
        return [];
      };

      setPosts(   normalize<Post>(   extract(postsRes,     [])).slice(0, 3));
      setNotices( normalize<Notice>( extract(noticesRes,   [])).slice(0, 3));
      setQuestions(normalize<Question>(extract(questionsRes, [])).slice(0, 3));
      setGroups(  normalize<Group>(  extract(groupsRes,    [])).slice(0, 3));
      setMentors( normalize<Mentor>( extract(mentorsRes,   [])).slice(0, 3));
      setFaqs(    normalize<Faq>(    extract(faqsRes,      [])).slice(0, 4));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => { fetchAll(); }, []);

  // ─── Loading skeleton ──────────────────────────────────────────────────────

  if (loading) {
    return (
      <>
      <div className="min-h-screen bg-muted px-4 py-4 pb-24">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <Skeleton className="w-11 h-11 rounded-2xl" />
            <div>
              <Skeleton className="w-16 h-3 mb-1" />
              <Skeleton className="w-32 h-7" />
            </div>
          </div>
          <Skeleton className="w-10 h-10 rounded-full" />
        </div>
        <div className="grid grid-cols-3 gap-3 mb-7">
          {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-20" />)}
        </div>
        <Skeleton className="w-28 h-5 mb-3" />
        <div className="flex flex-col gap-3 mb-7">
          {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-24" />)}
        </div>
        <Skeleton className="w-28 h-5 mb-3" />
        <div className="flex gap-3 overflow-x-hidden mb-7">
          {[...Array(3)].map((_, i) => <Skeleton key={i} className="min-w-[150px] h-24" />)}
        </div>
      </div>
      <BottomNav />
      </>
    );
  }

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <>
    <PullToRefresh onRefresh={() => fetchAll(true)} className="min-h-screen">
    <div className="min-h-screen bg-muted px-4 py-4 pb-24 relative">

      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <BackButton href="/dashboard" />
          <div>
            <p className="text-xs font-bold tracking-widest text-muted-foreground uppercase">SCH Hub</p>
            <h1 className="text-2xl font-bold text-foreground">Community</h1>
          </div>
        </div>
        <RefreshButton onClick={() => fetchAll(true)} loading={refreshing} />
      </div>

      {/* Category grid */}
      <div className="grid grid-cols-3 gap-3 mb-7">
        {CATEGORY_CARDS.map(({ label, href, icon: Icon, bg, fg }) => (
          <Link
            key={label}
            href={href}
            className="bg-card border border-border rounded-2xl p-3 flex flex-col items-center gap-2 active:scale-95 transition-transform"
          >
            <div className={`w-11 h-11 rounded-xl ${bg} flex items-center justify-center`}>
              <Icon className={`w-5 h-5 ${fg}`} />
            </div>
            <span className="text-xs font-semibold text-foreground text-center leading-tight">
              {label}
            </span>
          </Link>
        ))}
      </div>

      {/* ── Recent Posts ──────────────────────────────────────────────────── */}
      <SectionHeader title="Recent Posts" href="/dashboard/community/feed" />
      {posts.length === 0 ? (
        <p className="text-sm text-muted-foreground mb-7">No posts yet.</p>
      ) : (
        <div className="flex flex-col gap-3 mb-7">
          {posts.map((post) => {
            const name  = post.isAnonymous ? "Anonymous" : (post.author?.fullName ?? "Unknown");
            const inits = post.isAnonymous ? null : initials(post.author?.fullName);
            const totalRxn = post.reactions.reduce((s, r) => s + r.count, 0);

            return (
              <Link
                key={post.id}
                href={`/dashboard/community/${post.id}`}
                className={`block bg-card rounded-2xl p-4 shadow-sm active:scale-[0.99] transition ${
                  post.isPinned ? "border-l-2 border-primary" : ""
                }`}
              >
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
                <p className="text-xs text-foreground leading-relaxed line-clamp-2 mb-2">
                  {post.content}
                </p>
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                    <Heart className="w-3 h-3" /> {totalRxn > 0 ? totalRxn : "—"}
                  </span>
                  <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                    <MessageCircle className="w-3 h-3" /> {post.commentCount ?? 0}
                  </span>
                  <span className="ml-auto text-[10px] font-bold text-primary bg-accent rounded-lg px-2 py-0.5">
                    {post.section.replace("_", " ")}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {/* ── Latest Notices ────────────────────────────────────────────────── */}
      <SectionHeader title="Latest Notices" href="/dashboard/community/notices" />
      {notices.length === 0 ? (
        <p className="text-sm text-muted-foreground mb-7">No notices yet.</p>
      ) : (
        <div className="flex gap-3 overflow-x-auto -mx-4 px-4 pb-1 mb-7 scrollbar-none">
          {notices.map((notice) => (
            <Link
              key={notice.id}
              href="/dashboard/community/notices"
              className="min-w-[155px] max-w-[155px] bg-card rounded-2xl p-3 flex-shrink-0 shadow-sm active:scale-95 transition-transform"
            >
              <div className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center mb-2">
                <Megaphone className="w-4 h-4 text-amber-600" />
              </div>
              <p className="text-xs font-semibold text-foreground leading-snug line-clamp-2 mb-1">
                {notice.content}
              </p>
              <p className="text-[10px] text-muted-foreground">{timeAgo(notice.createdAt)}</p>
              {notice.isPinned && (
                <span className="inline-block text-[10px] font-medium text-primary bg-accent rounded-full px-2 py-0.5 mt-1">
                  Pinned
                </span>
              )}
            </Link>
          ))}
        </div>
      )}

      {/* ── Trending Q&A ──────────────────────────────────────────────────── */}
      <SectionHeader title="Trending Q&A" href="/dashboard/community/qa" />
      {questions.length === 0 ? (
        <p className="text-sm text-muted-foreground mb-7">No questions yet.</p>
      ) : (
        <div className="flex gap-3 overflow-x-auto -mx-4 px-4 pb-1 mb-7 scrollbar-none">
          {questions.map((q) => (
            <Link
              key={q.id}
              href={`/dashboard/community/qa/${q.id}`}
              className="min-w-[170px] max-w-[170px] bg-card rounded-2xl p-3 flex-shrink-0 shadow-sm active:scale-95 transition-transform"
            >
              <div className="flex items-center gap-1 mb-2">
                <ArrowBigUp className="w-4 h-4 text-violet-500 fill-violet-100" />
                <span className="text-xs font-bold text-foreground">{q.upvoteCount}</span>
              </div>
              <p className="text-xs font-semibold text-foreground leading-snug line-clamp-3 mb-1">
                {q.content}
              </p>
              <p className="text-[10px] text-muted-foreground">
                {q.answerCount ?? 0} answers
              </p>
            </Link>
          ))}
        </div>
      )}

      {/* ── Active Study Groups ───────────────────────────────────────────── */}
      <SectionHeader title="Active Study Groups" href="/dashboard/community/groups" />
      {groups.length === 0 ? (
        <p className="text-sm text-muted-foreground mb-7">No groups yet.</p>
      ) : (
        <div className="flex gap-3 overflow-x-auto -mx-4 px-4 pb-1 mb-7 scrollbar-none">
          {groups.map((group) => {
            const memberCount = group.memberCount ?? group._count?.members ?? 0;
            return (
              <Link
                key={group.id}
                href={`/dashboard/community/groups/${group.id}`}
                className="min-w-[155px] max-w-[155px] bg-card rounded-2xl p-3 flex-shrink-0 shadow-sm active:scale-95 transition-transform"
              >
                <div className="w-9 h-9 rounded-xl bg-emerald-100 flex items-center justify-center mb-2">
                  <Users className="w-4 h-4 text-emerald-600" />
                </div>
                <p className="text-xs font-semibold text-foreground leading-snug line-clamp-2 mb-1">
                  {group.name}
                </p>
                <p className="text-[10px] text-muted-foreground">{memberCount} members</p>
                <div className="flex items-center gap-1 mt-1.5">
                  {group.courseCode && (
                    <span className="text-[10px] font-medium text-emerald-700 bg-emerald-50 rounded-full px-2 py-0.5">
                      {group.courseCode}
                    </span>
                  )}
                  {group.isPrivate
                    ? <Lock className="w-3 h-3 text-muted-foreground ml-auto" />
                    : <Globe className="w-3 h-3 text-muted-foreground ml-auto" />
                  }
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {/* ── Suggested Mentors ─────────────────────────────────────────────── */}
      <SectionHeader title="Suggested Mentors" href="/dashboard/community/mentors" />
      {mentors.length === 0 ? (
        <p className="text-sm text-muted-foreground mb-7">No mentors registered yet.</p>
      ) : (
        <div className="flex gap-3 overflow-x-auto -mx-4 px-4 pb-1 mb-7 scrollbar-none">
          {mentors.map((mentor) => {
            const inits = initials(mentor.user?.fullName);
            return (
              <Link
                key={mentor.id}
                href="/dashboard/community/mentors"
                className="min-w-[125px] max-w-[125px] bg-card rounded-2xl p-3 flex flex-col items-center text-center flex-shrink-0 shadow-sm active:scale-95 transition-transform"
              >
                <div className="w-12 h-12 rounded-full bg-sky-100 flex items-center justify-center mb-2">
                  {inits
                    ? <span className="text-sm font-bold text-sky-600">{inits}</span>
                    : <User className="w-5 h-5 text-sky-500" />
                  }
                </div>
                <p className="text-xs font-semibold text-foreground leading-tight line-clamp-1">
                  {mentor.user?.fullName ?? "Mentor"}
                </p>
                {mentor.user?.department && (
                  <p className="text-[10px] text-muted-foreground mt-0.5 line-clamp-1">
                    {mentor.user.department}
                  </p>
                )}
                <span className="text-[10px] font-medium text-primary bg-accent rounded-full px-2 py-0.5 mt-1.5">
                  {mentor.courseCode}
                </span>
              </Link>
            );
          })}
        </div>
      )}

      {/* ── FAQs ──────────────────────────────────────────────────────────── */}
      <SectionHeader title="FAQs" href="/dashboard/community/faqs" />
      {faqs.length === 0 ? (
        <p className="text-sm text-muted-foreground mb-7">No FAQs yet.</p>
      ) : (
        <div className="flex flex-col gap-2 mb-7">
          {faqs.map((faq) => (
            <Link
              key={faq.id}
              href="/dashboard/community/faqs"
              className="bg-card rounded-2xl px-4 py-3 flex items-start gap-3 shadow-sm active:scale-[0.99] transition-transform"
            >
              <div className="w-8 h-8 rounded-xl bg-pink-100 flex items-center justify-center shrink-0 mt-0.5">
                <HelpCircle className="w-4 h-4 text-pink-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-foreground line-clamp-1">{faq.question}</p>
                <p className="text-[10px] text-muted-foreground line-clamp-1 mt-0.5">{faq.answer}</p>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
            </Link>
          ))}
        </div>
      )}

      {/* FAB — write a post */}
      <Link
        href="/dashboard/community/create"
        className="fixed bottom-24 right-6 flex items-center gap-2 bg-primary text-primary-foreground font-semibold rounded-full px-5 py-3.5 shadow-lg active:scale-95 transition"
      >
        <Plus className="w-5 h-5" /> Write post
      </Link>

    </div>
    </PullToRefresh>
    <BottomNav />
    </>
  );
}
