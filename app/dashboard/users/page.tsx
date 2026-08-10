"use client";

import { useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Search,
  Users,
  X,
  Loader2,
  AlertCircle,
  GraduationCap,
} from "lucide-react";
import { usersApi } from "@/lib/api/users";

// ─── Types ────────────────────────────────────────────────────────────────────

interface UserResult {
  id:                 string;
  fullName:           string;
  email:              string;
  role:               string;
  level?:             string;
  profilePictureUrl?: string | null;
  isActive?:          boolean;
}

const ROLE_BADGE: Record<string, string> = {
  STUDENT:             "bg-blue-100 text-blue-700",
  COURSE_REP:          "bg-violet-100 text-violet-700",
  AUTHORIZED_UPLOADER: "bg-amber-100 text-amber-700",
  EVENT_ORCHESTRATOR:  "bg-emerald-100 text-emerald-700",
  HOUSE_AGENT:         "bg-orange-100 text-orange-700",
  SCHOOL_ADMIN:        "bg-primary/10 text-primary",
  SUPER_ADMIN:         "bg-red-100 text-red-700",
};

function initials(name: string) {
  return name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
}

function roleName(role: string) {
  return role.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function UserSearchPage() {
  const router = useRouter();
  const [query, setQuery]       = useState("");
  const [results, setResults]   = useState<UserResult[]>([]);
  const [total, setTotal]       = useState(0);
  const [page, setPage]         = useState(1);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState<string | null>(null);
  const [searched, setSearched] = useState(false);
  const inputRef                = useRef<HTMLInputElement>(null);
  const limit = 20;

  const doSearch = useCallback(async (q: string, p: number) => {
    setLoading(true); setError(null);
    try {
      const data = await usersApi.searchUsers(q.trim(), p, limit);
      const items: UserResult[] = data?.items ?? data?.users ?? (Array.isArray(data) ? data : []);
      setResults(prev => p === 1 ? items : [...prev, ...items]);
      setTotal(data?.total ?? items.length);
      setPage(p);
      setSearched(true);
    } catch (e: any) {
      setError(e.message ?? "Search failed.");
    } finally {
      setLoading(false);
    }
  }, []);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setResults([]);
    doSearch(query, 1);
  }

  function handleClear() {
    setQuery(""); setResults([]); setSearched(false); setError(null);
    inputRef.current?.focus();
  }

  const hasMore = results.length < total;

  return (
    <div className="min-h-screen w-full bg-muted pb-10">

      {/* Header */}
      <div className="bg-card px-5 pt-8 pb-4 sticky top-0 z-20 shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <button onClick={() => router.back()} aria-label="Go back">
            <ArrowLeft className="w-6 h-6 text-foreground" />
          </button>
          <h1 className="font-serif text-2xl font-bold text-foreground flex-1">Find Users</h1>
        </div>
        <form onSubmit={handleSubmit} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              ref={inputRef}
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search by name or email…"
              className="w-full pl-9 pr-9 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
            {query && (
              <button type="button" onClick={handleClear} className="absolute right-3 top-1/2 -translate-y-1/2">
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            )}
          </div>
          <button
            type="submit"
            disabled={!query.trim() || loading}
            className="px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 disabled:opacity-50 transition-opacity"
          >
            Search
          </button>
        </form>
      </div>

      <div className="px-5 pt-4 flex flex-col gap-3">
        {error && (
          <div className="bg-destructive/10 text-destructive rounded-2xl px-4 py-3 flex items-center gap-2 text-sm">
            <AlertCircle className="w-4 h-4 shrink-0" /> {error}
          </div>
        )}

        {loading && page === 1 && (
          <div className="flex justify-center py-16">
            <Loader2 className="w-7 h-7 text-primary animate-spin" />
          </div>
        )}

        {!loading && !searched && (
          <div className="flex flex-col items-center gap-3 py-20 text-center">
            <Users className="w-12 h-12 text-muted-foreground/30" />
            <p className="font-semibold text-muted-foreground">Search for a user</p>
            <p className="text-xs text-muted-foreground">Enter a name or email address above</p>
          </div>
        )}

        {!loading && searched && results.length === 0 && (
          <div className="flex flex-col items-center gap-3 py-20 text-center">
            <Search className="w-12 h-12 text-muted-foreground/30" />
            <p className="font-semibold text-muted-foreground">No users found</p>
            <p className="text-xs text-muted-foreground">Try a different name or email</p>
          </div>
        )}

        {results.length > 0 && (
          <>
            <p className="text-xs text-muted-foreground px-1">{total} result{total !== 1 ? "s" : ""}</p>
            {results.map(user => (
              <div key={user.id} className="bg-card rounded-2xl px-4 py-4 flex items-center gap-3">
                {user.profilePictureUrl ? (
                  <img src={user.profilePictureUrl} alt={user.fullName} className="w-11 h-11 rounded-full object-cover shrink-0" />
                ) : (
                  <div className="w-11 h-11 rounded-full bg-accent flex items-center justify-center text-sm font-bold text-primary shrink-0">
                    {initials(user.fullName)}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-semibold text-foreground">{user.fullName}</p>
                    {user.isActive === false && (
                      <span className="text-xs text-destructive bg-destructive/10 px-2 py-0.5 rounded-lg font-semibold">Inactive</span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-lg ${ROLE_BADGE[user.role] ?? "bg-muted text-muted-foreground"}`}>
                      {roleName(user.role)}
                    </span>
                    {user.level && (
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <GraduationCap className="w-3 h-3" /> {user.level}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
            {hasMore && (
              <button
                onClick={() => doSearch(query, page + 1)}
                disabled={loading}
                className="w-full py-3 rounded-2xl border border-border text-sm font-semibold text-foreground hover:bg-accent transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                {loading ? "Loading…" : "Load more"}
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
