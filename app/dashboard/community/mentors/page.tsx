"use client";

import { useState, useEffect, useCallback } from "react";
import BackButton from "@/components/shared/BackButton";
import BottomNav from "@/components/shared/BottomNav";
import {
  Search,
  X,
  Users,
  Loader2,
  AlertTriangle,
  UserPlus,
  CheckCircle2,
  RefreshCw,
} from "lucide-react";
import { communityApi } from "@/lib/api/community";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Mentor {
  id: string;
  courseCode: string;
  user?: { id: string; fullName: string; department?: string; level?: string };
  createdAt: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

// ─── Helpers ──────────────────────────────────────────────────────────────────

function initials(name: string): string {
  return name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function MentorsPage() {
  const [mentors, setMentors]               = useState<Mentor[]>([]);
  const [myRegistrations, setMyRegistrations] = useState<Mentor[]>([]);
  const [loading, setLoading]               = useState(true);
  const [error, setError]                   = useState<string | null>(null);
  const [search, setSearch]                 = useState("");
  const [courseCode, setCourseCode]         = useState("");
  const [showRegisterSheet, setShowRegisterSheet] = useState(false);
  const [registering, setRegistering]       = useState(false);
  const [registerSuccess, setRegisterSuccess] = useState(false);
  const [registerError, setRegisterError]   = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [all, mine] = await Promise.all([
        communityApi.getMentors(),
        communityApi.getMyMentorRegistrations(),
      ]);
      setMentors(Array.isArray(all) ? all : []);
      setMyRegistrations(Array.isArray(mine) ? mine : []);
    } catch (e: any) {
      setError(e.message || "Failed to load mentors.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function handleRegister() {
    if (!courseCode.trim()) return;
    setRegistering(true);
    setRegisterError(null);
    setRegisterSuccess(false);
    try {
      await communityApi.registerAsMentor(courseCode.trim().toUpperCase());
      setRegisterSuccess(true);
      setCourseCode("");
      const mine = await communityApi.getMyMentorRegistrations();
      setMyRegistrations(Array.isArray(mine) ? mine : []);
    } catch (e: any) {
      setRegisterError(e.message || "Failed to register.");
    } finally {
      setRegistering(false);
    }
  }

  const filtered = mentors.filter((m) =>
    search.trim()
      ? m.courseCode.toUpperCase().includes(search.trim().toUpperCase())
      : true,
  );

  return (
    <div className="min-h-screen w-full bg-background px-6 py-6 pb-24">
      {/* Header */}
      <BackButton href="/dashboard/community" />
      <p className="text-xs font-bold tracking-widest text-muted-foreground uppercase mb-1 mt-5">
        SCH Hub
      </p>
      <h1 className="text-3xl font-bold text-foreground">Mentors</h1>
      <p className="text-muted-foreground text-sm mt-1 mb-5">Find a course mentor</p>

      {/* My registered courses chips */}
      {myRegistrations.length > 0 && (
        <div className="flex gap-2 flex-wrap mb-5">
          {myRegistrations.map((r) => (
            <span key={r.id} className="bg-primary/10 text-primary rounded-lg px-2.5 py-1 text-xs font-bold">
              Mentoring: {r.courseCode}
            </span>
          ))}
        </div>
      )}

      {/* Search */}
      <div className="flex items-center gap-3 rounded-xl bg-muted px-4 py-3 mb-6">
        <Search className="w-4 h-4 text-muted-foreground shrink-0" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value.toUpperCase())}
          placeholder="Filter by course code"
          className="flex-1 bg-transparent text-foreground placeholder:text-muted-foreground focus:outline-none text-sm uppercase"
        />
        {search && (
          <button onClick={() => setSearch("")} aria-label="Clear search">
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        )}
      </div>

      {/* Mentor list */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <AlertTriangle className="w-10 h-10 text-destructive" />
          <p className="text-destructive font-medium text-center">{error}</p>
          <button onClick={load} className="text-primary text-sm font-semibold underline">Retry</button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 gap-2">
          <Users className="w-10 h-10 text-muted-foreground" />
          <p className="text-muted-foreground font-medium">No mentors found</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {filtered.map((m) => {
            const name = m.user?.fullName ?? "Mentor";
            return (
              <div key={m.id} className="bg-card border border-border rounded-2xl p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-xs font-bold text-foreground shrink-0">
                  {initials(name)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-foreground">{name}</p>
                  {(m.user?.department || m.user?.level) && (
                    <p className="text-xs text-muted-foreground">
                      {[m.user.department, m.user.level ? `Level ${m.user.level}` : ""].filter(Boolean).join(" · ")}
                    </p>
                  )}
                </div>
                <span className="bg-accent text-primary rounded-lg px-2 py-1 text-xs font-bold shrink-0">
                  {m.courseCode}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {/* Floating action buttons — right side */}
      <div className="fixed bottom-24 right-5 flex flex-col items-end gap-3 z-20">
        {/* Refresh */}
        <button
          onClick={load}
          disabled={loading}
          aria-label="Refresh mentors"
          className="w-12 h-12 flex items-center justify-center bg-card border border-border rounded-full shadow-md text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
        >
          {loading
            ? <Loader2 className="w-5 h-5 animate-spin" />
            : <RefreshCw className="w-5 h-5" />
          }
        </button>

        {/* Become a mentor */}
        <button
          onClick={() => { setShowRegisterSheet(true); setRegisterSuccess(false); setRegisterError(null); }}
          aria-label="Become a mentor"
          className="w-14 h-14 flex items-center justify-center bg-primary text-primary-foreground rounded-full shadow-lg shadow-primary/20 hover:opacity-90 transition-opacity"
        >
          <UserPlus className="w-6 h-6" />
        </button>
      </div>

      <BottomNav />

      {/* Register sheet */}
      {showRegisterSheet && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40">
          <div className="w-full max-w-lg bg-card rounded-t-3xl p-6 pb-10 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-foreground">Register as a Mentor</h2>
              <button onClick={() => setShowRegisterSheet(false)} aria-label="Close">
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>
            <p className="text-sm text-muted-foreground">Enter the course code you want to mentor peers on.</p>

            {registerSuccess ? (
              <div className="flex flex-col items-center gap-3 py-6 text-center">
                <CheckCircle2 className="w-12 h-12 text-emerald-500" />
                <p className="font-bold text-foreground">Registered successfully!</p>
                <p className="text-sm text-muted-foreground">You are now a mentor for {courseCode || "the course"}.</p>
                <button
                  onClick={() => { setShowRegisterSheet(false); setRegisterSuccess(false); setCourseCode(""); }}
                  className="mt-2 bg-primary text-primary-foreground font-semibold rounded-xl px-6 py-2.5"
                >
                  Done
                </button>
              </div>
            ) : (
              <>
                <div className="flex items-center rounded-xl border border-border bg-muted px-4 focus-within:ring-2 focus-within:ring-ring">
                  <span className="text-muted-foreground text-sm shrink-0 mr-2">#</span>
                  <input
                    value={courseCode}
                    onChange={(e) => setCourseCode(e.target.value.toUpperCase())}
                    placeholder="e.g. MTH201"
                    className="w-full py-3 bg-transparent text-foreground placeholder:text-muted-foreground focus:outline-none uppercase text-sm"
                    autoFocus
                  />
                </div>

                {registerError && (
                  <p className="text-sm text-destructive">{registerError}</p>
                )}

                <div className="flex gap-3">
                  <button
                    onClick={() => setShowRegisterSheet(false)}
                    className="flex-1 rounded-2xl border border-border py-3.5 font-bold text-foreground"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleRegister}
                    disabled={registering || !courseCode.trim()}
                    className="flex-1 flex items-center justify-center gap-2 bg-primary text-primary-foreground rounded-2xl py-3.5 font-bold disabled:opacity-60"
                  >
                    {registering ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
                    {registering ? "Registering…" : "Register"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
