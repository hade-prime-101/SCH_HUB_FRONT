"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Settings,
  MessageSquare,
  Users,
  Lock,
  Globe,
  Hash,
  Calendar,
  Crown,
  Shield,
  Loader2,
  AlertTriangle,
  RefreshCw,
  LogOut,
  ChevronRight,
  Swords,
  Sparkles,
} from "lucide-react";
import { communityApi } from "@/lib/api/community";

// ─── Types ────────────────────────────────────────────────────────────────────

type MemberRole = "ADMIN" | "MODERATOR" | "MEMBER";

interface GroupMember {
  id:        string;
  fullName:  string;
  role:      MemberRole;
  joinedAt?: string;
}

interface GroupDetail {
  id:           string;
  name:         string;
  description?: string;
  courseTag?:   string;
  isPrivate:    boolean;
  memberCount:  number;
  createdAt?:   string;
  members:      GroupMember[];
  myRole?:      MemberRole;
}

// ─── Mock data ────────────────────────────────────────────────────────────────

const MOCK: GroupDetail = {
  id:          "g1",
  name:        "Organic Chemistry Study Circle",
  description: "Weekly study sessions, notes sharing, and exam prep for the semester.",
  courseTag:   "CHEM201",
  isPrivate:   true,
  memberCount: 12,
  myRole:      "ADMIN",
  createdAt:   "2026-01-15T00:00:00.000Z",
  members: [
    { id: "u1", fullName: "Amina Musa",   role: "ADMIN",     joinedAt: "2026-01-15T00:00:00.000Z" },
    { id: "u2", fullName: "Jordan Kim",   role: "MODERATOR", joinedAt: "2026-02-01T00:00:00.000Z" },
    { id: "u3", fullName: "Grace Okafor", role: "MEMBER",    joinedAt: "2026-02-10T00:00:00.000Z" },
    { id: "u4", fullName: "Tunde Bello",  role: "MEMBER",    joinedAt: "2026-03-05T00:00:00.000Z" },
  ],
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function initials(name: string): string {
  return name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
}

function formatDate(iso?: string): string {
  if (!iso) return "";
  try {
    return new Intl.DateTimeFormat("en-NG", {
      day: "numeric", month: "short", year: "numeric",
    }).format(new Date(iso));
  } catch { return ""; }
}

// ─── Role badge ───────────────────────────────────────────────────────────────

const ROLE_ICON: Record<MemberRole, React.ElementType> = {
  ADMIN:     Crown,
  MODERATOR: Shield,
  MEMBER:    Users,
};

const ROLE_BADGE: Record<MemberRole, string> = {
  ADMIN:     "bg-amber-100 text-amber-700",
  MODERATOR: "bg-blue-100 text-blue-700",
  MEMBER:    "bg-accent text-primary",
};

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function GroupDetailPage() {
  const router  = useRouter();
  const params  = useParams();
  const groupId = params.groupId as string;

  const [group, setGroup]     = useState<GroupDetail>(MOCK);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);
  const [leaving, setLeaving] = useState(false);
  const [confirmLeave, setConfirmLeave] = useState(false);

  // ── fetch ──────────────────────────────────────────────────────────────────

  const fetchGroup = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await communityApi.getGroup(groupId) as GroupDetail;
      setGroup(data);
    } catch {
      setError("Couldn't load group. Showing cached data.");
    } finally {
      setLoading(false);
    }
  }, [groupId]);

  useEffect(() => {
    let cancelled = false;
    fetchGroup().catch(() => {});
    return () => { cancelled = true; };
  }, [fetchGroup]);

  // ── leave group ────────────────────────────────────────────────────────────

  async function handleLeave() {
    setLeaving(true);
    try {
      await communityApi.leaveGroup(groupId);
      router.push("/dashboard/community/groups");
    } catch {
      setError("Failed to leave group.");
      setLeaving(false);
      setConfirmLeave(false);
    }
  }

  const isAdmin = group.myRole === "ADMIN";
  const previewMembers = group.members.slice(0, 5);
  const extraCount = Math.max(0, (group.memberCount ?? group.members.length) - 5);

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
      <div className="bg-card border-b border-border px-6 py-5">
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => router.back()}
            aria-label="Go back"
            className="w-10 h-10 rounded-2xl bg-muted flex items-center justify-center"
          >
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>

          {isAdmin && (
            <Link
              href={`/dashboard/community/groups/${groupId}/settings`}
              aria-label="Group settings"
              className="w-10 h-10 rounded-2xl bg-muted flex items-center justify-center"
            >
              <Settings className="w-5 h-5 text-foreground" />
            </Link>
          )}
        </div>

        {/* Group identity */}
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 rounded-2xl bg-accent flex items-center justify-center shrink-0">
            <Users className="w-8 h-8 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold text-foreground leading-snug">
              {group.name}
            </h1>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              {group.isPrivate
                ? <span className="flex items-center gap-1 text-xs text-muted-foreground font-semibold"><Lock className="w-3.5 h-3.5" /> Private</span>
                : <span className="flex items-center gap-1 text-xs text-muted-foreground font-semibold"><Globe className="w-3.5 h-3.5" /> Public</span>
              }
              {group.courseTag && (
                <span className="flex items-center gap-1 text-xs font-bold bg-accent text-primary rounded-lg px-2 py-0.5">
                  <Hash className="w-3 h-3" />{group.courseTag}
                </span>
              )}
              {group.myRole && (
                <span className={`text-xs font-bold rounded-lg px-2 py-0.5 ${ROLE_BADGE[group.myRole]}`}>
                  {group.myRole}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Error banner ── */}
      {error && (
        <div className="mx-6 mt-4 flex items-center gap-3 bg-destructive/10 rounded-2xl px-4 py-3">
          <AlertTriangle className="w-4 h-4 text-destructive shrink-0" />
          <p className="text-sm text-destructive flex-1">{error}</p>
          <button onClick={fetchGroup} aria-label="Retry">
            <RefreshCw className="w-4 h-4 text-destructive" />
          </button>
        </div>
      )}

      {/* ── Stats row ── */}
      <div className="grid grid-cols-2 gap-3 mx-6 mt-6">
        <div className="bg-card rounded-2xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center shrink-0">
            <Users className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="text-2xl font-bold text-foreground">
              {group.memberCount ?? group.members.length}
            </p>
            <p className="text-muted-foreground text-xs">Members</p>
          </div>
        </div>
        <div className="bg-card rounded-2xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center shrink-0">
            <Calendar className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="text-foreground font-bold text-sm leading-snug">
              {group.createdAt ? formatDate(group.createdAt) : "—"}
            </p>
            <p className="text-muted-foreground text-xs">Created</p>
          </div>
        </div>
      </div>

      {/* ── Description ── */}
      {group.description && (
        <div className="mx-6 mt-4 bg-card rounded-2xl p-5">
          <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wide mb-2">
            About
          </h2>
          <p className="text-foreground leading-relaxed">{group.description}</p>
        </div>
      )}

      {/* ── Primary action — open chat ── */}
      <div className="mx-6 mt-4">
        <Link
          href={`/dashboard/community/groups/${groupId}/chat`}
          className="flex items-center justify-between bg-primary text-primary-foreground rounded-2xl p-5 active:scale-[0.99] transition"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary-foreground/20 flex items-center justify-center shrink-0">
              <MessageSquare className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <p className="font-bold text-primary-foreground">Open Chat</p>
              <p className="text-primary-foreground/70 text-sm">
                Message members, share materials
              </p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-primary-foreground/70 shrink-0" />
        </Link>
      </div>

      {/* ── Challenges shortcut ── */}
      <div className="mx-6 mt-4">
        <Link
          href={`/dashboard/community/groups/${groupId}/challenges`}
          className="flex items-center justify-between bg-card rounded-2xl p-5 active:scale-[0.99] transition"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
              <Swords className="w-5 h-5 text-amber-700" />
            </div>
            <div>
              <p className="font-bold text-foreground">Challenges</p>
              <p className="text-muted-foreground text-sm">Quiz battles with other groups</p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-muted-foreground shrink-0" />
        </Link>
      </div>

      {/* ── Generate Quiz shortcut ── */}
      <div className="mx-6 mt-4">
        <Link
          href={`/dashboard/study/quizzes/generate?studyGroupId=${groupId}`}
          className="flex items-center justify-between bg-card rounded-2xl p-5 active:scale-[0.99] transition"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center shrink-0">
              <Sparkles className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="font-bold text-foreground">Generate Quiz</p>
              <p className="text-muted-foreground text-sm">AI quiz from a study material</p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-muted-foreground shrink-0" />
        </Link>
      </div>

      {/* ── Members preview ── */}
      <div className="mx-6 mt-4 bg-card rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-foreground">Members</h2>
          {isAdmin && (
            <Link
              href={`/dashboard/community/groups/${groupId}/settings`}
              className="text-sm font-semibold text-primary"
            >
              Manage →
            </Link>
          )}
        </div>

        <div className="flex flex-col gap-3">
          {previewMembers.map(m => {
            const RoleIcon = ROLE_ICON[m.role];
            return (
              <div key={m.id} className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-sm font-bold text-foreground shrink-0">
                  {initials(m.fullName)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-foreground text-sm">{m.fullName}</p>
                  {m.joinedAt && (
                    <p className="text-muted-foreground text-xs">
                      Joined {formatDate(m.joinedAt)}
                    </p>
                  )}
                </div>
                <span className={`flex items-center gap-1 text-xs font-bold rounded-lg px-2 py-1 ${ROLE_BADGE[m.role]}`}>
                  <RoleIcon className="w-3 h-3" />
                  {m.role}
                </span>
              </div>
            );
          })}

          {extraCount > 0 && (
            <p className="text-sm text-muted-foreground text-center pt-1">
              +{extraCount} more member{extraCount !== 1 ? "s" : ""}
            </p>
          )}
        </div>
      </div>

      {/* ── Settings shortcut (admin only) ── */}
      {isAdmin && (
        <div className="mx-6 mt-4">
          <Link
            href={`/dashboard/community/groups/${groupId}/settings`}
            className="flex items-center justify-between bg-card rounded-2xl p-5 active:scale-[0.99] transition"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center shrink-0">
                <Settings className="w-5 h-5 text-foreground" />
              </div>
              <div>
                <p className="font-bold text-foreground">Group Settings</p>
                <p className="text-muted-foreground text-sm">
                  Edit info, manage invites &amp; members
                </p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-muted-foreground shrink-0" />
          </Link>
        </div>
      )}

      {/* ── Leave group ── */}
      <div className="mx-6 mt-4">
        {!confirmLeave ? (
          <button
            onClick={() => setConfirmLeave(true)}
            className="w-full flex items-center justify-center gap-2 rounded-2xl border-2 border-destructive/40 text-destructive bg-card py-4 font-bold"
          >
            <LogOut className="w-4 h-4" />
            Leave group
          </button>
        ) : (
          <div className="bg-card rounded-2xl border border-destructive/30 p-5">
            <div className="flex items-start gap-2 mb-4">
              <AlertTriangle className="w-4 h-4 text-destructive mt-0.5 shrink-0" />
              <div>
                <p className="font-bold text-foreground">Leave this group?</p>
                <p className="text-muted-foreground text-sm mt-0.5">
                  You will lose access to the chat and shared materials.
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleLeave}
                disabled={leaving}
                className="flex-1 flex items-center justify-center gap-2 bg-destructive text-destructive-foreground font-bold rounded-xl py-3 text-sm disabled:opacity-50"
              >
                {leaving && <Loader2 className="w-4 h-4 animate-spin" />}
                Yes, leave
              </button>
              <button
                onClick={() => setConfirmLeave(false)}
                className="flex-1 bg-muted text-foreground font-bold rounded-xl py-3 text-sm"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

    </div>
  );
}
