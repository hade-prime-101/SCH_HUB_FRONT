"use client";

import { useState, useEffect, useCallback } from "react";
import BackButton from "@/components/shared/BackButton";
import BottomNav from "@/components/shared/BottomNav";
import Link from "next/link";
import {
  Plus,
  Users,
  Lock,
  X,
  Loader2,
  AlertTriangle,
  Globe,
  Hash,
} from "lucide-react";
import { communityApi } from "@/lib/api/community";

// --- Types 

type GroupType = "EXAM_PREP" | "ASSIGNMENT" | "TUTORIAL" | "PROJECT" | "GENERAL";

const GROUP_TYPES: { value: GroupType; label: string }[] = [
  { value: "EXAM_PREP",  label: "Exam Prep" },
  { value: "ASSIGNMENT", label: "Assignment" },
  { value: "TUTORIAL",   label: "Tutorial" },
  { value: "PROJECT",    label: "Project" },
  { value: "GENERAL",    label: "General" },
];

interface Group {
  id: string;
  name: string;
  description?: string;
  courseCode?: string;
  isPrivate: boolean;
  memberCount: number;
  createdAt: string;
}

// --- Constants 

// --- Toggle 

function Toggle({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      onClick={onChange}
      className={`w-12 h-7 rounded-full flex items-center px-1 transition-colors shrink-0 ${
        checked ? "bg-foreground justify-end" : "bg-border justify-start"
      }`}
    >
      <span className="w-5 h-5 rounded-full bg-background shadow-sm" />
    </button>
  );
}

// --- Create Group Modal 

function CreateGroupModal({
  onClose,
  onCreate,
}: {
  onClose: () => void;
  onCreate: (group: Group) => void;
}) {
  const [name, setName]             = useState("");
  const [description, setDescription] = useState("");
  const [courseCode, setCourseCode] = useState("");
  const [type, setType]             = useState<GroupType>("GENERAL");
  const [isPrivate, setIsPrivate]   = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError]           = useState<string | null>(null);

  async function handleCreate() {
    if (!name.trim()) { setError("Group name is required."); return; }
    setError(null);
    setSubmitting(true);
    try {
      const created = await communityApi.createGroup({
        name:        name.trim(),
        description: description.trim() || undefined,
        type,
        courseTag:   courseCode.trim().toUpperCase() || undefined,
        isPrivate,
      });
      onCreate(created);
      onClose();
    } catch (e: any) {
      setError(e.message || "Failed to create group.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40">
      <div className="w-full max-w-lg bg-card rounded-t-3xl p-6 pb-10 flex flex-col gap-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-foreground">New Study Group</h2>
          <button onClick={onClose} aria-label="Close" className="text-muted-foreground">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Name */}
        <div>
          <label className="text-sm font-semibold text-foreground block mb-2">
            Group name <span className="text-destructive">*</span>
          </label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. MTH301 Study Group"
            className="w-full rounded-xl bg-muted border border-border px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        {/* Type */}
        <div>
          <label className="text-sm font-semibold text-foreground block mb-2">
            Type <span className="text-destructive">*</span>
          </label>
          <div className="grid grid-cols-3 gap-2">
            {GROUP_TYPES.map(({ value, label }) => (
              <button
                key={value}
                onClick={() => setType(value)}
                className={`text-xs font-bold rounded-xl py-2.5 transition-colors ${
                  type === value
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground border border-border"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="text-sm font-semibold text-foreground block mb-2">
            Description <span className="text-muted-foreground font-normal">(optional)</span>
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What is this group about?"
            rows={3}
            className="w-full rounded-xl bg-muted border border-border px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
          />
        </div>

        {/* Course code */}
        <div>
          <label className="text-sm font-semibold text-foreground block mb-2">
            Course code <span className="text-muted-foreground font-normal">(optional)</span>
          </label>
          <div className="flex items-center rounded-xl border border-border bg-muted px-4 focus-within:ring-2 focus-within:ring-ring">
            <Hash className="w-4 h-4 text-muted-foreground shrink-0 mr-2" />
            <input
              value={courseCode}
              onChange={(e) => setCourseCode(e.target.value.toUpperCase())}
              placeholder="e.g. MTH301"
              className="w-full py-3 bg-transparent text-foreground placeholder:text-muted-foreground focus:outline-none uppercase text-sm"
            />
          </div>
        </div>

        {/* Private toggle */}
        <div className="flex items-center justify-between">
          <div>
            <p className="font-semibold text-foreground">Private group</p>
            <p className="text-sm text-muted-foreground">Members join by invite token only</p>
          </div>
          <Toggle checked={isPrivate} onChange={() => setIsPrivate((v) => !v)} />
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 rounded-2xl border border-border py-3 text-foreground font-semibold transition"
          >
            Cancel
          </button>
          <button
            onClick={handleCreate}
            disabled={submitting || !name.trim()}
            className="flex-1 rounded-2xl bg-primary text-primary-foreground font-semibold py-3 flex items-center justify-center gap-2 disabled:opacity-60 transition"
          >
            {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
            {submitting ? "Creating" : "Create"}
          </button>
        </div>
      </div>
    </div>
  );
}


// --- Group Card 

function GroupCard({
  group,
  isMember,
  onLeave,
  onJoin,
  actionLoading,
}: {
  group: Group;
  isMember: boolean;
  onLeave?: (id: string) => void;
  onJoin?: (id: string) => void;
  actionLoading: boolean;
}) {
  return (
    <div className="bg-card border border-border rounded-2xl p-4">
      <div className="flex items-start justify-between mb-2 gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <p className="font-bold text-foreground">{group.name}</p>
            {group.isPrivate && <Lock className="w-3.5 h-3.5 text-muted-foreground shrink-0" />}
            {!group.isPrivate && <Globe className="w-3.5 h-3.5 text-muted-foreground shrink-0" />}
          </div>
          {group.description && (
            <p className="text-sm text-muted-foreground line-clamp-2">{group.description}</p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        {group.courseCode && (
          <span className="bg-muted text-muted-foreground rounded-lg px-2 py-1 text-xs font-bold">
            #{group.courseCode}
          </span>
        )}
        <span className="flex items-center gap-1 text-xs text-muted-foreground">
          <Users className="w-3.5 h-3.5" /> {group.memberCount ?? 0} members
        </span>

        {isMember && onLeave && (
          <button
            onClick={() => onLeave(group.id)}
            disabled={actionLoading}
            className="ml-auto text-sm font-semibold text-destructive hover:opacity-70 transition disabled:opacity-50 flex items-center gap-1"
          >
            {actionLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            Leave
          </button>
        )}

        {!isMember && onJoin && (
          <button
            onClick={() => onJoin(group.id)}
            disabled={actionLoading}
            className="ml-auto text-sm font-semibold text-primary hover:underline transition disabled:opacity-50 flex items-center gap-1"
          >
            {actionLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            Join
          </button>
        )}

        {!isMember && !onJoin && (
          <span className="ml-auto text-xs font-bold bg-accent text-primary rounded-lg px-2.5 py-1">
            Joined
          </span>
        )}
      </div>
    </div>
  );
}

// --- Main Page 

export default function GroupsPage() {
  const [activeTab, setActiveTab]     = useState<"mine" | "discover">("mine");
  const [myGroups, setMyGroups]       = useState<Group[]>([]);
  const [allGroups, setAllGroups]     = useState<Group[]>([]);
  const [loadingMine, setLoadingMine] = useState(true);
  const [loadingAll, setLoadingAll]   = useState(false);
  const [discoverLoaded, setDiscoverLoaded] = useState(false);
  const [errorMine, setErrorMine]     = useState<string | null>(null);
  const [errorAll, setErrorAll]       = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [showCreate, setShowCreate]   = useState(false);
  const [tokenInput, setTokenInput]   = useState("");
  const [joiningToken, setJoiningToken] = useState(false);

  // Load my groups on mount
  const loadMine = useCallback(async () => {
    setLoadingMine(true);
    setErrorMine(null);
    try {
      const res = await communityApi.getGroups();
      setMyGroups(Array.isArray(res) ? res : (res?.data ?? []));
    } catch (e: any) {
      setErrorMine(e.message || "Failed to load your groups.");
    } finally {
      setLoadingMine(false);
    }
  }, []);

  const loadAll = useCallback(async () => {
    setLoadingAll(true);
    setErrorAll(null);
    try {
      // Use getGroups (not getAllGroups which requires admin perms) with a param
      // to discover public groups the user hasn't joined yet
      const res = await communityApi.getGroups({ discover: "true" });
      setAllGroups(Array.isArray(res) ? res : (res?.data ?? []));
      setDiscoverLoaded(true);
    } catch (e: any) {
      // Fallback: if discover param not supported, load regular groups list
      try {
        const res = await communityApi.getGroups();
        setAllGroups(Array.isArray(res) ? res : (res?.data ?? []));
        setDiscoverLoaded(true);
      } catch (e2: any) {
        setErrorAll(e2.message || "Failed to load groups.");
      }
    } finally {
      setLoadingAll(false);
    }
  }, []);

  useEffect(() => { loadMine(); }, [loadMine]);

  // Lazy load discover tab
  useEffect(() => {
    if (activeTab === "discover" && !discoverLoaded) {
      loadAll();
    }
  }, [activeTab, discoverLoaded, loadAll]);

  async function handleLeave(id: string) {
    setActionLoading(id);
    try {
      await communityApi.leaveGroup(id);
      setMyGroups((prev) => prev.filter((g) => g.id !== id));
    } catch (e: any) {
      setErrorMine(e.message || "Failed to leave group.");
    } finally {
      setActionLoading(null);
    }
  }

  async function handleJoin(id: string) {
    setActionLoading(id);
    try {
      await communityApi.joinGroup(id);
      const joined = allGroups.find((g) => g.id === id);
      if (joined) setMyGroups((prev) => [...prev, joined]);
    } catch (e: any) {
      setErrorAll(e.message || "Failed to join group.");
    } finally {
      setActionLoading(null);
    }
  }

  async function handleJoinByToken() {
    if (!tokenInput.trim()) return;
    setJoiningToken(true);
    try {
      const joined = await communityApi.joinGroupByToken(tokenInput.trim());
      if (joined) setMyGroups((prev) => [...prev, joined]);
      setTokenInput("");
      setActiveTab("mine");
    } catch (e: any) {
      alert(e.message || "Invalid or expired token.");
    } finally {
      setJoiningToken(false);
    }
  }

  const myGroupIds = new Set(myGroups.map((g) => g.id));

  return (
    <div className="min-h-screen w-full bg-background px-6 py-6 pb-24">
      {/* Header */}
      <BackButton href="/dashboard/community" />
      <p className="text-xs font-bold tracking-widest text-muted-foreground uppercase mb-1 mt-5">
        SCH Hub
      </p>
      <h1 className="text-3xl font-bold text-foreground mb-5">Study Groups</h1>

      {/* Tabs */}
      <div className="flex gap-6 border-b border-border mb-6">
        {(["mine", "discover"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`text-sm font-bold tracking-wide pb-3 relative shrink-0 transition ${
              activeTab === tab ? "text-foreground" : "text-muted-foreground"
            }`}
          >
            {tab === "mine" ? "My Groups" : "Discover"}
            {activeTab === tab && (
              <span className="absolute -bottom-px left-0 right-0 h-0.5 bg-foreground rounded-full" />
            )}
          </button>
        ))}
      </div>

      {/* MY GROUPS */}
      {activeTab === "mine" && (
        <>
          {loadingMine ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
            </div>
          ) : errorMine ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <AlertTriangle className="w-10 h-10 text-destructive" />
              <p className="text-destructive font-medium text-center">{errorMine}</p>
              <button onClick={loadMine} className="text-primary text-sm font-semibold underline">
                Retry
              </button>
            </div>
          ) : myGroups.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 gap-2">
              <Users className="w-10 h-10 text-muted-foreground" />
              <p className="text-muted-foreground font-medium">No groups yet</p>
              <button
                onClick={() => setShowCreate(true)}
                className="text-primary text-sm font-semibold underline mt-1"
              >
                Create one
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {myGroups.map((g) => (
                <GroupCard
                  key={g.id}
                  group={g}
                  isMember
                  onLeave={handleLeave}
                  actionLoading={actionLoading === g.id}
                />
              ))}
            </div>
          )}

          {/* FAB */}
          <button
            onClick={() => setShowCreate(true)}
            className="fixed bottom-24 right-6 flex items-center gap-2 bg-primary text-primary-foreground font-semibold rounded-full px-5 py-3.5 shadow-lg active:scale-95 transition"
          >
            <Plus className="w-5 h-5" /> New Group
          </button>
        </>
      )}

      {/* DISCOVER */}
      {activeTab === "discover" && (
        <>
          {/* Join by token */}
          <div className="flex gap-3 mb-5">
            <div className="flex-1 flex items-center rounded-xl bg-muted border border-border px-4 focus-within:ring-2 focus-within:ring-ring">
              <input
                value={tokenInput}
                onChange={(e) => setTokenInput(e.target.value)}
                placeholder="Invite token"
                className="w-full py-3 bg-transparent text-foreground placeholder:text-muted-foreground focus:outline-none text-sm"
              />
            </div>
            <button
              onClick={handleJoinByToken}
              disabled={joiningToken || !tokenInput.trim()}
              className="flex items-center gap-2 bg-primary text-primary-foreground rounded-xl px-4 font-semibold text-sm disabled:opacity-60 transition"
            >
              {joiningToken ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              Join
            </button>
          </div>

          {loadingAll ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
            </div>
          ) : errorAll ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <AlertTriangle className="w-10 h-10 text-destructive" />
              <p className="text-destructive font-medium text-center">{errorAll}</p>
              <button onClick={loadAll} className="text-primary text-sm font-semibold underline">
                Retry
              </button>
            </div>
          ) : allGroups.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 gap-2">
              <Globe className="w-10 h-10 text-muted-foreground" />
              <p className="text-muted-foreground font-medium">No public groups found</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {allGroups.map((g) => {
                const isMember = myGroupIds.has(g.id);
                return (
                  <GroupCard
                    key={g.id}
                    group={g}
                    isMember={isMember}
                    onJoin={!isMember ? handleJoin : undefined}
                    actionLoading={actionLoading === g.id}
                  />
                );
              })}
            </div>
          )}
        </>
      )}

      {/* Bottom nav */}
      <BottomNav />

      {/* Create group modal */}
      {showCreate && (
        <CreateGroupModal
          onClose={() => setShowCreate(false)}
          onCreate={(g) => setMyGroups((prev) => [g, ...prev])}
        />
      )}
    </div>
  );
}
