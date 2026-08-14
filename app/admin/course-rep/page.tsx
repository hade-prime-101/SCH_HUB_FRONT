"use client";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  ArrowLeft,
  GraduationCap,
  Search,
  X,
  CheckCircle2,
  AlertCircle,
  Loader2,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  RefreshCw,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  Users,
} from "lucide-react";
import { usersApi } from "@/lib/api/users.api";

// ─── Types ────────────────────────────────────────────────────────────────────

interface UserResult {
  id:                 string;
  fullName:           string;
  email:              string;
  role:               string;
  level?:             string;
  profilePictureUrl?: string | null;
}

function initials(name: string) {
  return name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function CourseRepNominationPage() {
  const router = useRouter();

  const [query, setQuery]         = useState("");
  const [results, setResults]     = useState<UserResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [selected, setSelected]   = useState<UserResult | null>(null);
  const [submitting, setSubmit]   = useState(false);
  const [success, setSuccess]     = useState(false);
  const [error, setError]         = useState<string | null>(null);
  const [searchErr, setSearchErr] = useState<string | null>(null);

  // Debounced search
  useEffect(() => {
    if (!query.trim()) { setResults([]); return; }
    const t = setTimeout(async () => {
      setSearching(true); setSearchErr(null);
      try {
        const data = await usersApi.searchUsers({ q: query.trim(), page: 1, limit: 10 });
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const items: UserResult[] = (Array.isArray(data) ? data : (data?.data ?? [])).map((u: any) => ({
          ...u,
          fullName: u.fullName || u.name || u.firstName + ' ' + u.lastName || u.email,
        }));
        // Only show students
        setResults(items.filter(u => u.role === "STUDENT" || u.role === "COURSE_REP"));
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (e: any) {
        setSearchErr(e.message ?? "Search failed.");
      } finally {
        setSearching(false);
      }
    }, 400);
    return () => clearTimeout(t);
  }, [query]);

  async function handleNominate() {
    if (!selected) return;
    setSubmit(true); setError(null);
    try {
      await usersApi.nominateCourseRep({ userId: selected.id });
      setSuccess(true);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (e: any) {
      setError(e.message ?? "Nomination failed. Please try again.");
    } finally {
      setSubmit(false);
    }
  }

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-6 text-center">
        <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center">
          <CheckCircle2 className="w-10 h-10 text-emerald-600" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-foreground">Nomination Sent!</h2>
          <p className="text-muted-foreground text-sm mt-1">
            <span className="font-semibold text-foreground">{selected?.fullName}</span> has been nominated as course rep.
          </p>
        </div>
        <button
          onClick={() => { setSuccess(false); setSelected(null); setQuery(""); setResults([]); }}
          className="px-6 py-3 rounded-2xl bg-primary text-primary-foreground text-sm font-semibold"
        >
          Nominate another
        </button>
        <button onClick={() => router.back()} className="text-sm text-muted-foreground underline underline-offset-2">Go back</button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 pb-10">

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Nominate Course Rep</h1>
        <p className="text-muted-foreground text-sm mt-1">Search and select a student to nominate</p>
      </div>

      <div className="flex flex-col gap-4">

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            value={query}
            onChange={e => { setQuery(e.target.value); setSelected(null); }}
            placeholder="Search student by name or email…"
            className="w-full pl-9 pr-9 py-2.5 rounded-xl border border-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
          {query && (
            <button type="button" onClick={() => { setQuery(""); setResults([]); setSelected(null); }} className="absolute right-3 top-1/2 -translate-y-1/2">
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          )}
        </div>

        {searchErr && (
          <div className="bg-destructive/10 text-destructive rounded-xl p-3 flex items-center gap-2 text-sm">
            <AlertCircle className="w-4 h-4 shrink-0" /> {searchErr}
          </div>
        )}

        {/* Search results */}
        {searching && (
          <div className="flex justify-center py-6"><Loader2 className="w-6 h-6 text-primary animate-spin" /></div>
        )}

        {!searching && query.trim() && results.length === 0 && (
          <div className="bg-card rounded-2xl p-6 text-center text-muted-foreground text-sm">No matching students found.</div>
        )}

        {!searching && results.length > 0 && (
          <div className="bg-card rounded-2xl overflow-hidden divide-y divide-border">
            {results.map(user => (
              <button
                key={user.id}
                onClick={() => { setSelected(user); setQuery(user.fullName); setResults([]); }}
                className={`w-full flex items-center gap-3 px-4 py-3.5 text-left transition-colors hover:bg-accent ${
                  selected?.id === user.id ? "bg-primary/5" : ""
                }`}
              >
                {user.profilePictureUrl ? (
                  <img src={user.profilePictureUrl} alt={user.fullName} className="w-10 h-10 rounded-full object-cover shrink-0" />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-accent flex items-center justify-center text-sm font-bold text-primary shrink-0">
                    {initials(user.fullName)}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground">{user.fullName}</p>
                  <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                  {user.level && <p className="text-xs text-muted-foreground">{user.level}</p>}
                </div>
                {selected?.id === user.id && <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />}
              </button>
            ))}
          </div>
        )}

        {/* Selected preview */}
        {selected && (
          <div className="bg-card rounded-2xl px-4 py-4 flex items-center gap-3 border-2 border-primary/30">
            {selected.profilePictureUrl ? (
              <img src={selected.profilePictureUrl} alt={selected.fullName} className="w-12 h-12 rounded-full object-cover shrink-0" />
            ) : (
              <div className="w-12 h-12 rounded-full bg-accent flex items-center justify-center text-base font-bold text-primary shrink-0">
                {initials(selected.fullName)}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-foreground">{selected.fullName}</p>
              <p className="text-xs text-muted-foreground truncate">{selected.email}</p>
              {selected.level && (
                <span className="inline-flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                  <GraduationCap className="w-3 h-3" /> {selected.level}
                </span>
              )}
            </div>
            <button onClick={() => { setSelected(null); setQuery(""); }} className="p-1.5 rounded-lg hover:bg-muted">
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="bg-destructive/10 text-destructive rounded-xl p-3 flex items-center gap-2 text-sm">
            <AlertCircle className="w-4 h-4 shrink-0" /> {error}
          </div>
        )}

        {/* Info box */}
        <div className="bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3 text-xs text-amber-700 leading-relaxed">
          <span className="font-semibold">Note:</span> Nominating a student as Course Rep changes their role and grants them elevated permissions. This action can be reversed by reassigning their role.
        </div>

        {/* Submit */}
        <button
          onClick={handleNominate}
          disabled={!selected || submitting}
          className="w-full py-3.5 rounded-2xl bg-primary text-primary-foreground font-semibold text-sm flex items-center justify-center gap-2 hover:opacity-90 disabled:opacity-50 transition-opacity"
        >
          {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <GraduationCap className="w-4 h-4" />}
          {submitting ? "Nominating…" : "Nominate as Course Rep"}
        </button>
      </div>
    </div>
  );
}
