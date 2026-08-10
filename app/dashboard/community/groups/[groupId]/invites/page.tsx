"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  Link as LinkIcon,
  Plus,
  Trash2,
  Copy,
  CheckCircle2,
  Loader2,
  AlertTriangle,
  X,
  Users,
  Calendar } from "lucide-react";
import BackButton from "@/components/shared/BackButton";
import { communityApi } from "@/lib/api/community";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Invite {
  id:          string;
  token:       string;
  url?:        string;
  maxUses:     number;
  usedCount?:  number;
  expiresAt?:  string;
  createdAt?:  string;
}

const HOURS_OPTIONS = [
  { value: 1,   label: "1 hour" },
  { value: 6,   label: "6 hours" },
  { value: 24,  label: "24 hours" },
  { value: 48,  label: "48 hours" },
  { value: 72,  label: "72 hours" },
  { value: 168, label: "7 days" },
];

function formatExpiry(iso?: string): string {
  if (!iso) return "—";
  const d = new Date(iso);
  const now = Date.now();
  const diff = d.getTime() - now;
  if (diff <= 0) return "Expired";
  const hrs = Math.floor(diff / 3_600_000);
  if (hrs < 24) return `${hrs}h remaining`;
  return `${Math.floor(hrs / 24)}d remaining`;
}

function shortToken(t: string) {
  return t.length > 12 ? `${t.slice(0, 6)}…${t.slice(-4)}` : t;
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function GroupInvitesPage() {
  const router  = useRouter();
  const params  = useParams();
  const groupId = params?.groupId as string;

  const [invites,     setInvites]     = useState<Invite[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState<string | null>(null);
  const [showModal,   setShowModal]   = useState(false);
  const [maxUses,     setMaxUses]     = useState(1);
  const [expiresHrs,  setExpiresHrs]  = useState(24);
  const [generating,  setGenerating]  = useState(false);
  const [newInvite,   setNewInvite]   = useState<Invite | null>(null);
  const [copied,      setCopied]      = useState(false);
  const [revoking,    setRevoking]    = useState<string | null>(null);

  useEffect(() => {
    if (!groupId) return;
    communityApi.getInvites(groupId)
      .then((inv) => setInvites(Array.isArray(inv) ? (inv as Invite[]) : []))
      .catch((e: any) => setError(e.message || "Failed to load invites."))
      .finally(() => setLoading(false));
  }, [groupId]);

  async function handleGenerate() {
    setGenerating(true);
    setError(null);
    try {
      const inv = await communityApi.createInvite(groupId, maxUses, expiresHrs) as Invite;
      setNewInvite(inv);
      setInvites((prev) => [inv, ...prev]);
    } catch (e: any) {
      setError(e.message || "Failed to create invite.");
    } finally {
      setGenerating(false);
    }
  }

  async function handleRevoke(inviteId: string) {
    setRevoking(inviteId);
    try {
      await communityApi.revokeInvite(groupId, inviteId);
      setInvites((prev) => prev.filter((i) => i.id !== inviteId));
      if (newInvite?.id === inviteId) setNewInvite(null);
    } catch (e: any) {
      setError(e.message || "Failed to revoke invite.");
    } finally {
      setRevoking(null);
    }
  }

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  const inviteUrl = newInvite?.url ?? (newInvite ? `${typeof window !== "undefined" ? window.location.origin : ""}/dashboard/community/groups/join/${newInvite.token}` : "");

  return (
    <div className="min-h-screen bg-slate-50">

      {/* ── Header ── */}
      <div className="bg-white px-4 pt-5 pb-4 flex items-center gap-3 border-b border-slate-100">
        <BackButton />
        <h1 className="text-xl font-bold text-slate-900 flex-1">Manage Invites</h1>
        <button
          onClick={() => { setShowModal(true); setNewInvite(null); }}
          className="flex items-center gap-1.5 text-sm font-bold text-indigo-500 bg-indigo-50 px-3 py-2 rounded-xl transition active:bg-indigo-100"
        >
          <Plus className="w-4 h-4" /> Create
        </button>
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
        ) : invites.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm px-5 py-12 flex flex-col items-center gap-3 text-center">
            <LinkIcon className="w-10 h-10 text-slate-200" />
            <p className="text-slate-500 font-semibold">No active invites.</p>
            <p className="text-slate-400 text-sm">Create one to let others join the group.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {invites.map((inv) => (
              <div key={inv.id} className="bg-white rounded-2xl shadow-sm px-5 py-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="font-mono text-sm font-semibold text-slate-700">{shortToken(inv.token)}</p>
                    {inv.expiresAt && (
                      <p className="text-xs text-slate-400 mt-0.5">{formatExpiry(inv.expiresAt)}</p>
                    )}
                  </div>
                  <button
                    onClick={() => handleRevoke(inv.id)}
                    disabled={revoking === inv.id}
                    className="w-8 h-8 rounded-xl bg-rose-50 flex items-center justify-center transition active:bg-rose-100 disabled:opacity-50 shrink-0"
                    aria-label="Revoke invite"
                  >
                    {revoking === inv.id
                      ? <Loader2 className="w-4 h-4 text-rose-400 animate-spin" />
                      : <Trash2 className="w-4 h-4 text-rose-400" />
                    }
                  </button>
                </div>
                <div className="flex items-center gap-4 text-xs text-slate-400">
                  <span className="flex items-center gap-1">
                    <Users className="w-3.5 h-3.5" />
                    {inv.usedCount ?? 0}/{inv.maxUses} uses
                  </span>
                  {inv.createdAt && (
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      {new Date(inv.createdAt).toLocaleDateString([], { month: "short", day: "numeric" })}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

      </div>

      {/* ── Create invite modal ── */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-end justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowModal(false)} />
          <div className="relative bg-white rounded-t-3xl w-full max-w-lg px-6 pt-6 pb-10 shadow-2xl">
            <div className="w-10 h-1.5 rounded-full bg-slate-200 mx-auto mb-5" />

            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl font-bold text-slate-900">Create Invite</h2>
              <button onClick={() => setShowModal(false)} className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center">
                <X className="w-4 h-4 text-slate-500" />
              </button>
            </div>

            {/* Max uses */}
            <div className="mb-4">
              <label className="text-sm font-semibold text-slate-700 block mb-2">Max uses</label>
              <input
                type="number"
                min={1}
                max={100}
                value={maxUses}
                onChange={(e) => setMaxUses(Math.max(1, Math.min(100, parseInt(e.target.value) || 1)))}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
              />
            </div>

            {/* Expires in */}
            <div className="mb-6">
              <label className="text-sm font-semibold text-slate-700 block mb-2">Expires in</label>
              <select
                value={expiresHrs}
                onChange={(e) => setExpiresHrs(parseInt(e.target.value))}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-white"
              >
                {HOURS_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>

            {/* Generated URL */}
            {newInvite && (
              <div className="mb-5">
                <label className="text-sm font-semibold text-slate-700 block mb-2">Invite link</label>
                <div className="flex items-center gap-2">
                  <input
                    readOnly
                    value={inviteUrl}
                    className="flex-1 px-3 py-2.5 rounded-xl border border-slate-200 text-sm bg-slate-50 text-slate-600 font-mono truncate"
                  />
                  <button
                    onClick={() => copyToClipboard(inviteUrl)}
                    className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center shrink-0 transition active:bg-indigo-100"
                  >
                    {copied ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4 text-indigo-500" />}
                  </button>
                </div>
              </div>
            )}

            <button
              onClick={handleGenerate}
              disabled={generating}
              className="w-full rounded-2xl bg-indigo-500 py-4 font-bold text-white shadow-lg shadow-indigo-100 flex items-center justify-center gap-2 disabled:opacity-50 transition active:opacity-90"
            >
              {generating
                ? <><Loader2 className="w-5 h-5 animate-spin" /> Generating…</>
                : newInvite
                  ? "Generate Another"
                  : "Generate Invite"
              }
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
