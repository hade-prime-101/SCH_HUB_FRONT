"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Smartphone,
  Trash2,
  LogOut,
  Loader2,
  AlertTriangle,
  Calendar,
  X,
  ShieldAlert } from "lucide-react";
import BackButton from "@/components/shared/BackButton";
import { usersApi } from "@/lib/api/users.api";
import { useAuth } from "@/lib/hooks/useAuth";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Session {
  id: string;
  createdAt: string;
  expiresAt: string;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString([], {
    year: "numeric", month: "short", day: "numeric",
    hour: "numeric", minute: "2-digit" });
}

function shortId(id: string) {
  return `…${id.slice(-8)}`;
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function SessionsPage() {
  const router = useRouter();
  const { logout } = useAuth();

  const [sessions,    setSessions]    = useState<Session[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState<string | null>(null);
  const [revoking,    setRevoking]    = useState<string | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loggingOut,  setLoggingOut]  = useState(false);

  useEffect(() => {
    usersApi.getSessions()
      .then((s: any) => setSessions(Array.isArray(s) ? (s as Session[]) : []))
      .catch((e: any) => setError(e.message || "Failed to load sessions."))
      .finally(() => setLoading(false));
  }, []);

  async function handleRevoke(sessionId: string) {
    setRevoking(sessionId);
    try {
      await usersApi.revokeSession(sessionId);
      setSessions((prev) => prev.filter((s) => s.id !== sessionId));
    } catch (e: any) {
      setError(e.message || "Failed to revoke session.");
    } finally {
      setRevoking(null);
    }
  }

  async function handleLogoutAll() {
    setLoggingOut(true);
    try {
      await usersApi.revokeAllSessions();
      // Use the logout hook — clears localStorage tokens AND the HTTP-only cookie
      await logout();
      router.push("/login");
    } catch (e: any) {
      setError(e.message || "Failed to log out everywhere.");
      setLoggingOut(false);
      setShowConfirm(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">

      {/* ── Header ── */}
      <div className="bg-card px-4 pt-5 pb-4 flex items-center gap-3 border-b border-slate-100">
        <BackButton />
        <h1 className="text-xl font-bold text-slate-900">Active Sessions</h1>
      </div>

      <div className="px-4 py-5 max-w-lg mx-auto flex flex-col gap-4">

        {/* ── Error ── */}
        {error && (
          <div className="flex items-center justify-between bg-rose-50 text-rose-600 rounded-2xl px-4 py-3 text-sm font-medium">
            <span>{error}</span>
            <button onClick={() => setError(null)}><X className="w-4 h-4" /></button>
          </div>
        )}

        {/* ── Loading ── */}
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
          </div>
        ) : sessions.length === 0 ? (
          <div className="bg-card rounded-2xl shadow-sm px-5 py-12 flex flex-col items-center gap-3 text-center">
            <Smartphone className="w-10 h-10 text-slate-200" />
            <p className="text-slate-400 font-medium">No active sessions found.</p>
          </div>
        ) : (
          <>
            <p className="text-sm text-slate-400 font-medium">{sessions.length} active session{sessions.length !== 1 ? "s" : ""}</p>

            <div className="flex flex-col gap-2">
              {sessions.map((session) => (
                <div key={session.id} className="bg-card rounded-2xl shadow-sm px-5 py-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center shrink-0">
                    <Smartphone className="w-5 h-5 text-indigo-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-slate-900 text-sm font-mono">{shortId(session.id)}</p>
                    <div className="flex items-center gap-1 mt-0.5">
                      <Calendar className="w-3 h-3 text-slate-400" />
                      <p className="text-xs text-slate-400">Created {formatDate(session.createdAt)}</p>
                    </div>
                    <p className="text-xs text-slate-300 mt-0.5">Expires {formatDate(session.expiresAt)}</p>
                  </div>
                  <button
                    onClick={() => handleRevoke(session.id)}
                    disabled={revoking === session.id}
                    className="w-9 h-9 rounded-xl bg-rose-50 flex items-center justify-center transition active:bg-rose-100 disabled:opacity-50 shrink-0"
                    aria-label="Revoke session"
                  >
                    {revoking === session.id
                      ? <Loader2 className="w-4 h-4 text-rose-400 animate-spin" />
                      : <Trash2 className="w-4 h-4 text-rose-400" />
                    }
                  </button>
                </div>
              ))}
            </div>
          </>
        )}

        {/* ── Logout everywhere ── */}
        <div className="mt-2">
          <button
            onClick={() => setShowConfirm(true)}
            className="w-full rounded-2xl bg-rose-500 py-4 font-bold text-primary-foreground shadow-lg shadow-rose-100 flex items-center justify-center gap-2 transition active:opacity-90"
          >
            <LogOut className="w-5 h-5" /> Log Out Everywhere
          </button>
          <p className="text-xs text-slate-400 text-center mt-2">This will revoke all active sessions, including this one.</p>
        </div>

      </div>

      {/* ── Confirm modal ── */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowConfirm(false)} />
          <div className="relative bg-card rounded-3xl w-full max-w-sm p-6 shadow-2xl">
            <div className="flex flex-col items-center text-center gap-4">
              <div className="w-16 h-16 rounded-full bg-rose-100 flex items-center justify-center">
                <ShieldAlert className="w-8 h-8 text-rose-500" />
              </div>
              <h2 className="text-xl font-bold text-slate-900">Log out everywhere?</h2>
              <p className="text-slate-500 text-sm leading-relaxed">
                All active sessions will be revoked. You&apos;ll need to log in again on all devices.
              </p>
              <div className="flex gap-3 w-full">
                <button
                  onClick={() => setShowConfirm(false)}
                  disabled={loggingOut}
                  className="flex-1 rounded-2xl border-2 border-slate-200 py-3.5 font-bold text-slate-700 transition active:bg-slate-50 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleLogoutAll}
                  disabled={loggingOut}
                  className="flex-1 rounded-2xl bg-rose-500 py-3.5 font-bold text-primary-foreground transition active:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loggingOut
                    ? <><Loader2 className="w-4 h-4 animate-spin" /> Logging out…</>
                    : "Log Out All"
                  }
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
