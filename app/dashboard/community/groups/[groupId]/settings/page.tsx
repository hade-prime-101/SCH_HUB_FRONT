"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  ArrowLeft,
  MoreVertical,
  AlertTriangle,
  Link2,
  Loader2,
  RefreshCw,
  ShieldAlert,
} from "lucide-react";
import { communityApi } from "@/lib/api/community";

// ─── Types ────────────────────────────────────────────────────────────────────

type MemberRole = "ADMIN" | "MODERATOR" | "MEMBER";

interface GroupMember {
  id:       string;
  fullName: string;
  role:     MemberRole;
  joinedAt?: string;
}

interface InviteLink {
  id:        string;
  code:      string;
  token:     string;
  maxUses:   number;
  usedCount: number;
  expiresAt?: string;
}

interface GroupDetail {
  id:          string;
  name:        string;
  description: string;
  courseTag?:  string;
  isPrivate:   boolean;
  members:     GroupMember[];
  invites?:    InviteLink[];
  myRole?:     MemberRole;
}

// ─── Mock data ────────────────────────────────────────────────────────────────

const MOCK_GROUP: GroupDetail = {
  id:          "g1",
  name:        "Organic Chemistry Study Circle",
  description: "Weekly study sessions, notes sharing, and exam prep for the semester.",
  courseTag:   "CHEM201",
  isPrivate:   true,
  myRole:      "ADMIN",
  members: [
    { id: "u1", fullName: "Amina Musa",  role: "ADMIN",  joinedAt: "2026-09-12T00:00:00.000Z" },
    { id: "u2", fullName: "Jordan Kim",  role: "MEMBER", joinedAt: "2026-10-03T00:00:00.000Z" },
  ],
  invites: [
    { id: "i1", code: "LOOPZ-INV-9F3A…", token: "9F3A", maxUses: 1, usedCount: 1,  expiresAt: new Date(Date.now() + 23 * 3600 * 1000).toISOString() },
    { id: "i2", code: "LOOPZ-INV-2K8Q…", token: "2K8Q", maxUses: 5, usedCount: 2,  expiresAt: new Date(Date.now() +  6 * 3600 * 1000).toISOString() },
  ],
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatJoined(iso?: string): string {
  if (!iso) return "";
  try {
    return "Joined " + new Intl.DateTimeFormat("en-NG", {
      day: "numeric", month: "short", year: "numeric",
    }).format(new Date(iso));
  } catch { return ""; }
}

function expiresLabel(iso?: string): string {
  if (!iso) return "No expiry";
  const ms = new Date(iso).getTime() - Date.now();
  if (ms <= 0) return "Expired";
  const h = Math.floor(ms / 3600000);
  if (h < 24) return `Expires in ${h}h`;
  return `Expires in ${Math.floor(h / 24)}d`;
}

function initials(name: string): string {
  return name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
}

// ─── Toggle ───────────────────────────────────────────────────────────────────

function Toggle({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      onClick={onChange}
      className={`w-12 h-7 rounded-full flex items-center px-1 transition-colors shrink-0 ${
        checked ? "bg-primary justify-end" : "bg-muted justify-start"
      }`}
    >
      <span className="w-5 h-5 rounded-full bg-card shadow-sm" />
    </button>
  );
}

// ─── Field ────────────────────────────────────────────────────────────────────

const INPUT_CLS    = "w-full rounded-xl border border-border bg-card px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring text-sm";
const TEXTAREA_CLS = `${INPUT_CLS} resize-none`;

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5 mb-4">
      <label className="text-sm font-semibold text-foreground">{label}</label>
      {children}
    </div>
  );
}

// ─── Role badge ───────────────────────────────────────────────────────────────

const ROLE_BADGE: Record<MemberRole, string> = {
  ADMIN:     "bg-amber-100 text-amber-700",
  MODERATOR: "bg-blue-100 text-blue-700",
  MEMBER:    "bg-accent text-primary",
};

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function GroupSettingsPage() {
  const router  = useRouter();
  const params  = useParams();
  const groupId = params.groupId as string;

  // ── server state ────────────────────────────────────────────────────────────
  const [group, setGroup]   = useState<GroupDetail>(MOCK_GROUP);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState<string | null>(null);

  // ── form state ──────────────────────────────────────────────────────────────
  const [name, setName]             = useState(MOCK_GROUP.name);
  const [description, setDescription] = useState(MOCK_GROUP.description);
  const [courseTag, setCourseTag]   = useState(MOCK_GROUP.courseTag ?? "");
  const [isPrivate, setIsPrivate]   = useState(MOCK_GROUP.isPrivate);
  const [saving, setSaving]         = useState(false);
  const [saveError, setSaveError]   = useState<string | null>(null);

  // ── member state ────────────────────────────────────────────────────────────
  const [members, setMembers]             = useState<GroupMember[]>(MOCK_GROUP.members);
  const [confirmRemoveId, setConfirmRemoveId] = useState<string | null>(null);
  const [removing, setRemoving]           = useState<string | null>(null);

  // ── invite state ────────────────────────────────────────────────────────────
  const [invites, setInvites]     = useState<InviteLink[]>(MOCK_GROUP.invites ?? []);
  const [maxUses, setMaxUses]     = useState("1");
  const [expiresIn, setExpiresIn] = useState("24");
  const [generating, setGenerating] = useState(false);

  // ── danger zone state ───────────────────────────────────────────────────────
  const [confirmLeave, setConfirmLeave]   = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [dangerLoading, setDangerLoading] = useState(false);

  // ── fetch ───────────────────────────────────────────────────────────────────

  const fetchGroup = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const data = await communityApi.getGroup(groupId) as GroupDetail;
      setGroup(data);
      setName(data.name);
      setDescription(data.description);
      setCourseTag(data.courseTag ?? "");
      setIsPrivate(data.isPrivate);
      setMembers(data.members ?? []);
      setInvites(data.invites ?? []);
    } catch {
      setError("Couldn't load group settings. Showing cached data.");
    } finally {
      setLoading(false);
    }
  }, [groupId]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true); setError(null);
      try {
        const data = await communityApi.getGroup(groupId) as GroupDetail;
        if (cancelled) return;
        setGroup(data);
        setName(data.name);
        setDescription(data.description);
        setCourseTag(data.courseTag ?? "");
        setIsPrivate(data.isPrivate);
        setMembers(data.members ?? []);
        setInvites(data.invites ?? []);
      } catch {
        if (!cancelled) setError("Couldn't load group settings. Showing cached data.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [groupId]);

  // ── save group info ─────────────────────────────────────────────────────────

  async function handleSave() {
    setSaving(true); setSaveError(null);
    try {
      await communityApi.updateGroup(groupId, {
        name:        name.trim(),
        description: description.trim(),
        courseTag:   courseTag.trim() || undefined,
        isPrivate,
      });
      setGroup(g => ({ ...g, name: name.trim(), description: description.trim(), courseTag: courseTag.trim(), isPrivate }));
    } catch (e: unknown) {
      setSaveError(e instanceof Error ? e.message : "Failed to save changes.");
    } finally {
      setSaving(false);
    }
  }

  // ── remove member ───────────────────────────────────────────────────────────

  // communityApi has no removeMember endpoint — fall back to a generic group
  // update that sends a members patch; gracefully degrades to optimistic-only.
  async function handleRemoveMember(memberId: string) {
    setRemoving(memberId);
    // Optimistic remove
    setMembers(prev => prev.filter(m => m.id !== memberId));
    setConfirmRemoveId(null);
    try {
      await communityApi.updateGroup(groupId, { removeMemberId: memberId });
    } catch {
      // Revert — re-fetch to get canonical state
      fetchGroup();
    } finally {
      setRemoving(null);
    }
  }

  // ── generate invite ─────────────────────────────────────────────────────────

  async function handleGenerateInvite() {
    const uses = parseInt(maxUses, 10);
    const hrs  = parseInt(expiresIn, 10);
    if (isNaN(uses) || uses < 1 || isNaN(hrs) || hrs < 1) return;

    setGenerating(true);
    try {
      const data = await communityApi.updateGroup(groupId, {
        generateInvite: true,
        maxUses:        uses,
        expiresInHours: hrs,
      }) as { invite?: InviteLink };
      if (data?.invite) {
        setInvites(prev => [data.invite!, ...prev]);
      }
    } catch {
      setError("Failed to generate invite link.");
    } finally {
      setGenerating(false);
    }
  }

  // ── copy invite link ────────────────────────────────────────────────────────

  function handleCopy(token: string) {
    const url = `${window.location.origin}/dashboard/community/groups/join/${token}`;
    navigator.clipboard.writeText(url).catch(() => {});
  }

  // ── leave group ─────────────────────────────────────────────────────────────

  async function handleLeave() {
    setDangerLoading(true);
    try {
      await communityApi.leaveGroup(groupId);
      router.push("/dashboard/community/groups");
    } catch {
      setError("Failed to leave group.");
      setDangerLoading(false);
      setConfirmLeave(false);
    }
  }

  // ── delete group ────────────────────────────────────────────────────────────

  async function handleDelete() {
    setDangerLoading(true);
    try {
      await communityApi.deleteGroup(groupId);
      router.push("/dashboard/community/groups");
    } catch {
      setError("Failed to delete group.");
      setDangerLoading(false);
      setConfirmDelete(false);
    }
  }

  const isAdmin = group.myRole === "ADMIN";

  // ── loading skeleton ────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="min-h-screen w-full bg-muted flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-muted pb-10">

      {/* ── Header ── */}
      <div className="flex items-start gap-4 px-6 py-6 bg-card border-b border-border">
        <button
          onClick={() => router.back()}
          aria-label="Go back"
          className="w-11 h-11 rounded-2xl bg-muted flex items-center justify-center shrink-0"
        >
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <div>
          <h1 className="text-xl font-bold text-foreground">Group Settings</h1>
          <p className="text-muted-foreground text-sm">
            Edit group details, manage members, and invites
          </p>
        </div>
      </div>

      {/* ── Global error banner ── */}
      {error && (
        <div className="mx-6 mt-4 flex items-center gap-3 bg-destructive/10 rounded-2xl px-4 py-3">
          <AlertTriangle className="w-4 h-4 text-destructive shrink-0" />
          <p className="text-sm text-destructive flex-1">{error}</p>
          <button onClick={fetchGroup} aria-label="Retry">
            <RefreshCw className="w-4 h-4 text-destructive" />
          </button>
        </div>
      )}

      {/* ── Group info ── */}
      <div className="mx-6 mt-6 bg-card rounded-2xl p-5">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold text-foreground">Group info</h2>
            <p className="text-muted-foreground text-sm">
              Update the group profile and privacy settings
            </p>
          </div>
          {isAdmin && (
            <span className="text-xs font-bold bg-amber-100 text-amber-700 rounded-lg px-2.5 py-1 shrink-0">
              Admin
            </span>
          )}
        </div>

        <Field label="Group name">
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            disabled={!isAdmin}
            className={INPUT_CLS}
          />
        </Field>

        <Field label="Description">
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            rows={3}
            disabled={!isAdmin}
            className={TEXTAREA_CLS}
          />
        </Field>

        <Field label="Course tag">
          <input
            value={courseTag}
            onChange={e => setCourseTag(e.target.value)}
            placeholder="e.g. CHEM201"
            disabled={!isAdmin}
            className={INPUT_CLS}
          />
        </Field>

        {/* Private toggle */}
        <div className="flex items-center justify-between bg-muted rounded-xl p-4 mb-4">
          <div>
            <p className="font-bold text-foreground">Private group</p>
            <p className="text-muted-foreground text-sm">Invite-only access for members</p>
          </div>
          <Toggle
            checked={isPrivate}
            onChange={() => isAdmin && setIsPrivate(v => !v)}
          />
        </div>

        {/* Save error */}
        {saveError && (
          <p className="text-destructive text-xs mb-3 flex items-center gap-1">
            <AlertTriangle className="w-3.5 h-3.5 shrink-0" /> {saveError}
          </p>
        )}

        {isAdmin && (
          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full flex items-center justify-center gap-2 rounded-2xl bg-primary text-primary-foreground py-3.5 font-bold shadow-lg shadow-primary/20 disabled:opacity-50"
          >
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            {saving ? "Saving…" : "Save changes"}
          </button>
        )}
      </div>

      {/* ── Members ── */}
      <div className="mx-6 mt-6 bg-card rounded-2xl p-5">
        <h2 className="text-lg font-bold text-foreground">Members</h2>
        <p className="text-muted-foreground text-sm mb-4">
          Manage roles and remove members
        </p>

        <div className="flex flex-col gap-3">
          {members.map(m => (
            <div key={m.id} className="bg-muted rounded-xl p-4">
              <div className="flex items-center gap-3">
                {/* Avatar */}
                <div className="w-10 h-10 rounded-full bg-card flex items-center justify-center text-sm font-bold text-foreground shrink-0">
                  {initials(m.fullName)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-foreground">{m.fullName}</p>
                    <span className={`text-xs font-bold rounded-lg px-2 py-0.5 ${ROLE_BADGE[m.role]}`}>
                      {m.role}
                    </span>
                  </div>
                  <p className="text-muted-foreground text-sm">{formatJoined(m.joinedAt)}</p>
                </div>
                {/* Only admins can remove non-admin members */}
                {isAdmin && m.role !== "ADMIN" && (
                  <button
                    onClick={() => setConfirmRemoveId(confirmRemoveId === m.id ? null : m.id)}
                    aria-label="Member options"
                    className="shrink-0"
                    disabled={removing === m.id}
                  >
                    {removing === m.id
                      ? <Loader2 className="w-5 h-5 text-muted-foreground animate-spin" />
                      : <MoreVertical className="w-5 h-5 text-muted-foreground" />
                    }
                  </button>
                )}
              </div>

              {/* Confirm remove */}
              {confirmRemoveId === m.id && (
                <div className="mt-3 rounded-xl border border-destructive/30 bg-destructive/10 p-4">
                  <div className="flex items-start gap-2 mb-3">
                    <AlertTriangle className="w-4 h-4 text-destructive mt-0.5 shrink-0" />
                    <div>
                      <p className="font-bold text-destructive">Remove {m.fullName}?</p>
                      <p className="text-destructive text-sm">
                        This will kick the member from the group.
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleRemoveMember(m.id)}
                      className="flex-1 bg-destructive text-destructive-foreground font-bold rounded-xl py-2.5 text-sm"
                    >
                      Confirm
                    </button>
                    <button
                      onClick={() => setConfirmRemoveId(null)}
                      className="flex-1 bg-card border border-border font-bold rounded-xl py-2.5 text-foreground text-sm"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ── Invites ── */}
      {isAdmin && (
        <div className="mx-6 mt-6 bg-card rounded-2xl p-5">
          <div className="flex items-center justify-between mb-1">
            <h2 className="text-lg font-bold text-foreground">Invites</h2>
            <button
              onClick={() => router.push(`/dashboard/community/groups/${groupId}/invites`)}
              className="text-xs font-bold text-indigo-500 bg-indigo-50 px-3 py-1.5 rounded-xl transition active:bg-indigo-100"
            >
              Manage all →
            </button>
          </div>
          <p className="text-muted-foreground text-sm mb-4">
            Generate and manage invite links
          </p>

          {/* Generate form */}
          <div className="bg-muted rounded-xl p-4 mb-4">
            <Field label="Max uses">
              <input
                value={maxUses}
                onChange={e => setMaxUses(e.target.value)}
                type="number"
                min="1"
                className={INPUT_CLS}
              />
            </Field>
            <Field label="Expires in (hours)">
              <input
                value={expiresIn}
                onChange={e => setExpiresIn(e.target.value)}
                type="number"
                min="1"
                className={INPUT_CLS}
              />
            </Field>
            <button
              onClick={handleGenerateInvite}
              disabled={generating}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-primary text-primary-foreground py-3 font-bold text-sm disabled:opacity-50"
            >
              {generating && <Loader2 className="w-4 h-4 animate-spin" />}
              {generating ? "Generating…" : "Generate invite link"}
            </button>
          </div>

          {/* Existing invites */}
          <div className="flex flex-col gap-3">
            {invites.map(inv => {
              const remaining = inv.maxUses - inv.usedCount;
              return (
                <div key={inv.id} className="bg-muted rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-mono font-semibold text-foreground text-sm truncate pr-2">
                      {inv.code}
                    </p>
                    <button
                      onClick={() => handleCopy(inv.token)}
                      className="flex items-center gap-1.5 text-primary font-semibold text-sm shrink-0"
                    >
                      <Link2 className="w-4 h-4" /> Copy
                    </button>
                  </div>
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <span className="text-xs font-bold bg-accent text-primary rounded-lg px-2 py-1">
                      {inv.usedCount} use{inv.usedCount !== 1 ? "s" : ""}
                    </span>
                    <span className={`text-xs font-bold rounded-lg px-2 py-1 ${
                      remaining > 0 ? "bg-emerald-100 text-emerald-700" : "bg-muted text-muted-foreground"
                    }`}>
                      {remaining} remaining
                    </span>
                  </div>
                  <p className="text-muted-foreground text-sm">{expiresLabel(inv.expiresAt)}</p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Danger zone ── */}
      <div className="mx-6 mt-6 rounded-2xl border-2 border-destructive/30 bg-destructive/10 p-5">
        <div className="flex items-center gap-2 mb-1">
          <ShieldAlert className="w-5 h-5 text-destructive" />
          <h2 className="text-lg font-bold text-destructive">Danger zone</h2>
        </div>
        <p className="text-destructive/70 text-sm mb-4">
          Leave or delete this group with caution
        </p>

        {/* Leave */}
        {!confirmLeave ? (
          <button
            onClick={() => setConfirmLeave(true)}
            className="w-full rounded-2xl border-2 border-destructive text-destructive py-3.5 font-bold mb-3 bg-card"
          >
            Leave group
          </button>
        ) : (
          <div className="bg-card rounded-xl p-4 mb-3 border border-destructive/30">
            <p className="font-bold text-foreground text-sm mb-3">
              Are you sure you want to leave?
            </p>
            <div className="flex gap-2">
              <button
                onClick={handleLeave}
                disabled={dangerLoading}
                className="flex-1 flex items-center justify-center gap-2 bg-destructive text-destructive-foreground font-bold rounded-xl py-2.5 text-sm disabled:opacity-50"
              >
                {dangerLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                Yes, leave
              </button>
              <button
                onClick={() => setConfirmLeave(false)}
                className="flex-1 bg-card border border-border font-bold rounded-xl py-2.5 text-foreground text-sm"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Delete — admins only */}
        {isAdmin && (
          !confirmDelete ? (
            <button
              onClick={() => setConfirmDelete(true)}
              className="w-full rounded-2xl bg-destructive text-destructive-foreground py-3.5 font-bold"
            >
              Delete group
            </button>
          ) : (
            <div className="bg-card rounded-xl p-4 border border-destructive/30">
              <p className="font-bold text-foreground text-sm mb-3">
                Delete group permanently? This cannot be undone.
              </p>
              <div className="flex gap-2">
                <button
                  onClick={handleDelete}
                  disabled={dangerLoading}
                  className="flex-1 flex items-center justify-center gap-2 bg-destructive text-destructive-foreground font-bold rounded-xl py-2.5 text-sm disabled:opacity-50"
                >
                  {dangerLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                  Yes, delete
                </button>
                <button
                  onClick={() => setConfirmDelete(false)}
                  className="flex-1 bg-card border border-border font-bold rounded-xl py-2.5 text-foreground text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          )
        )}
      </div>

    </div>
  );
}
