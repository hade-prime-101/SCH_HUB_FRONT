"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ShieldCheck,
  Search,
  X,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ChevronDown,
} from "lucide-react";
import { usersApi } from "@/lib/api/users.api";
import type { UserRole } from "@/types/auth";

// ─── Types ────────────────────────────────────────────────────────────────────

interface UserResult {
  id:                 string;
  fullName:           string;
  email:              string;
  role:               string;
  level?:             string;
  profilePictureUrl?: string | null;
}

const ASSIGNABLE_ROLES: { value: UserRole; label: string; description: string; badge: string }[] = [
  {
    value:       "STUDENT",
    label:       "Student",
    description: "Standard student access",
    badge:       "bg-blue-100 text-blue-700",
  },
  {
    value:       "COURSE_REP",
    label:       "Course Rep",
    description: "Can manage course-related content for their department",
    badge:       "bg-violet-100 text-violet-700",
  },
  {
    value:       "AUTHORIZED_UPLOADER",
    label:       "Authorized Uploader",
    description: "Can upload and manage study materials",
    badge:       "bg-amber-100 text-amber-700",
  },
  {
    value:       "EVENT_ORCHESTRATOR",
    label:       "Event Orchestrator",
    description: "Can create and manage campus events",
    badge:       "bg-emerald-100 text-emerald-700",
  },
  {
    value:       "HOUSE_AGENT",
    label:       "House Agent",
    description: "Verified accommodation agent on the marketplace",
    badge:       "bg-orange-100 text-orange-700",
  },
];

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

export default function RoleAssignmentPage() {
  const router = useRouter();

  const [query, setQuery]           = useState("");
  const [results, setResults]       = useState<UserResult[]>([]);
  const [searching, setSearching]   = useState(false);
  const [searchErr, setSearchErr]   = useState<string | null>(null);
  const [selected, setSelected]     = useState<UserResult | null>(null);
  const [newRole, setNewRole]       = useState<UserRole | "">("");
  const [showPicker, setShowPicker] = useState(false);
  const [submitting, setSubmit]     = useState(false);
  const [success, setSuccess]       = useState(false);
  const [error, setError]           = useState<string | null>(null);

  // Debounced search
  useEffect(() => {
    if (!query.trim()) { setResults([]); return; }
    const t = setTimeout(async () => {
      setSearching(true); setSearchErr(null);
      try {
        const data = await usersApi.searchUsers({ q: query.trim(), page: 1, limit: 10 });
        const items: UserResult[] = (Array.isArray(data) ? data : (data?.data ?? [])).map((u: any) => ({
          ...u,
          fullName: u.fullName || u.name || u.firstName + ' ' + u.lastName || u.email,
        }));
        setResults(items);
      } catch (e: any) {
        setSearchErr(e.message ?? "Search failed.");
      } finally {
        setSearching(false);
      }
    }, 400);
    return () => clearTimeout(t);
  }, [query]);

  async function handleAssign() {
    if (!selected || !newRole) return;
    setSubmit(true); setError(null);
    try {
      await usersApi.assignRole({ userId: selected.id, role: newRole });
      setSuccess(true);
    } catch (e: any) {
      setError(e.message ?? "Role assignment failed. Please try again.");
    } finally {
      setSubmit(false);
    }
  }

  const selectedRoleConfig = ASSIGNABLE_ROLES.find(r => r.value === newRole);

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-6 text-center">
        <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center">
          <CheckCircle2 className="w-10 h-10 text-emerald-600" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-foreground">Role Assigned!</h2>
          <p className="text-muted-foreground text-sm mt-1">
            <span className="font-semibold text-foreground">{selected?.fullName}</span> is now a{" "}
            <span className="font-semibold text-foreground">{roleName(newRole)}</span>.
          </p>
        </div>
        <button
          onClick={() => { setSuccess(false); setSelected(null); setNewRole(""); setQuery(""); setResults([]); }}
          className="px-6 py-3 rounded-2xl bg-primary text-primary-foreground text-sm font-semibold"
        >
          Assign another role
        </button>
        <button onClick={() => router.back()} className="text-sm text-muted-foreground underline underline-offset-2">Go back</button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <button onClick={() => router.back()} aria-label="Go back" className="p-2 rounded-xl hover:bg-accent">
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Assign Role</h1>
          <p className="text-muted-foreground text-sm mt-0.5">Search for a user and assign them a new role</p>
        </div>
      </div>

      {/* Step 1 — Search */}
      <div className="bg-card rounded-2xl p-5 flex flex-col gap-3">
        <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide">Step 1 — Select User</p>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            value={query}
            onChange={e => { setQuery(e.target.value); setSelected(null); setNewRole(""); }}
            placeholder="Search by name or email…"
            className="w-full pl-9 pr-9 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
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

        {searching && <div className="flex justify-center py-4"><Loader2 className="w-5 h-5 text-primary animate-spin" /></div>}

        {!searching && query.trim() && results.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-3">No users found.</p>
        )}

        {!searching && results.length > 0 && (
          <div className="rounded-xl border border-border overflow-hidden divide-y divide-border">
            {results.map(user => (
              <button
                key={user.id}
                onClick={() => { setSelected(user); setQuery(user.fullName); setResults([]); }}
                className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-accent transition-colors"
              >
                {user.profilePictureUrl ? (
                  <img src={user.profilePictureUrl} alt={user.fullName} className="w-9 h-9 rounded-full object-cover shrink-0" />
                ) : (
                  <div className="w-9 h-9 rounded-full bg-accent flex items-center justify-center text-xs font-bold text-primary shrink-0">
                    {initials(user.fullName)}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground">{user.fullName}</p>
                  <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                </div>
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-lg shrink-0 ${ROLE_BADGE[user.role] ?? "bg-muted text-muted-foreground"}`}>
                  {roleName(user.role)}
                </span>
              </button>
            ))}
          </div>
        )}

        {/* Selected user */}
        {selected && (
          <div className="flex items-center gap-3 bg-primary/5 rounded-xl px-4 py-3 border border-primary/20">
            {selected.profilePictureUrl ? (
              <img src={selected.profilePictureUrl} alt={selected.fullName} className="w-10 h-10 rounded-full object-cover shrink-0" />
            ) : (
              <div className="w-10 h-10 rounded-full bg-accent flex items-center justify-center text-sm font-bold text-primary shrink-0">
                {initials(selected.fullName)}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground">{selected.fullName}</p>
              <p className="text-xs text-muted-foreground">Current: <span className="font-medium">{roleName(selected.role)}</span></p>
            </div>
            <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
          </div>
        )}
      </div>

      {/* Step 2 — Pick role */}
      {selected && (
        <div className="bg-card rounded-2xl p-5 flex flex-col gap-3">
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide">Step 2 — Choose New Role</p>

          <div className="relative">
            <button
              onClick={() => setShowPicker(p => !p)}
              className="w-full flex items-center justify-between px-4 py-3 rounded-xl border border-border bg-background text-sm"
            >
              {newRole ? (
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-lg ${selectedRoleConfig?.badge}`}>
                    {selectedRoleConfig?.label}
                  </span>
                  <span className="text-xs text-muted-foreground">{selectedRoleConfig?.description}</span>
                </div>
              ) : (
                <span className="text-muted-foreground">Select a role…</span>
              )}
              <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${showPicker ? "rotate-180" : ""}`} />
            </button>

            {showPicker && (
              <div className="absolute top-full left-0 right-0 mt-1 z-20 bg-card rounded-xl border border-border shadow-lg overflow-hidden">
                {ASSIGNABLE_ROLES.map(r => (
                  <button
                    key={r.value}
                    onClick={() => { setNewRole(r.value); setShowPicker(false); }}
                    className={`w-full flex items-start gap-3 px-4 py-3 text-left hover:bg-accent transition-colors ${newRole === r.value ? "bg-primary/5" : ""}`}
                  >
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-lg shrink-0 mt-0.5 ${r.badge}`}>{r.label}</span>
                    <span className="text-xs text-muted-foreground">{r.description}</span>
                    {newRole === r.value && <CheckCircle2 className="w-4 h-4 text-primary shrink-0 ml-auto" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {newRole && selected.role === newRole && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-xs text-amber-700">
              This user already has the <span className="font-semibold">{roleName(newRole)}</span> role.
            </div>
          )}
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="bg-destructive/10 text-destructive rounded-xl p-4 flex items-center gap-2 text-sm">
          <AlertCircle className="w-4 h-4 shrink-0" /> {error}
        </div>
      )}

      {/* Submit */}
      {selected && (
        <button
          onClick={handleAssign}
          disabled={!newRole || submitting || selected.role === newRole}
          className="w-full py-3.5 rounded-2xl bg-primary text-primary-foreground font-semibold text-sm flex items-center justify-center gap-2 hover:opacity-90 disabled:opacity-50 transition-opacity"
        >
          {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
          {submitting ? "Assigning…" : "Assign Role"}
        </button>
      )}
    </div>
  );
}
