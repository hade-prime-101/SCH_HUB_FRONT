"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { adminApi } from "@/lib/api/admin";
import { usersApi } from "@/lib/api/users";
import { AlertCircle, Ban, CheckCircle2, ChevronLeft, ChevronRight, Search, ShieldAlert } from "lucide-react";

interface PlatformUser {
  id: string; fullName: string; email: string; role: string; matricNumber?: string;
  isBlocked?: boolean; school?: { name: string; shortCode: string };
}

const ROLE_STYLES: Record<string, string> = {
  STUDENT: "bg-blue-100 text-blue-700", COURSE_REP: "bg-violet-100 text-violet-700",
  AUTHORIZED_UPLOADER: "bg-amber-100 text-amber-700", EVENT_ORCHESTRATOR: "bg-emerald-100 text-emerald-700",
  SCHOOL_ADMIN: "bg-primary/10 text-primary", SUPER_ADMIN: "bg-red-100 text-red-700",
};

export default function SuperAdminUsersPage() {
  const [users, setUsers] = useState<PlatformUser[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionId, setActionId] = useState<string | null>(null);
  const limit = 20;

  const loadUsers = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const data: any = query.trim() ? await usersApi.searchUsers(query.trim(), page, limit) : await usersApi.listUsers({ page: String(page), limit: String(limit) });
      const items = data?.items ?? data?.users ?? (Array.isArray(data) ? data : []);
      setUsers(items); setTotal(data?.total ?? items.length);
    } catch (err: any) { setError(err.message || "Unable to load users."); }
    finally { setLoading(false); }
  }, [page, query]);

  useEffect(() => { loadUsers(); }, [loadUsers]);

  function handleSearch(event: FormEvent) { event.preventDefault(); setPage(1); setQuery(search); }

  async function toggleBlocked(user: PlatformUser) {
    setActionId(user.id); setError(null);
    try {
      if (user.isBlocked) await adminApi.unblockUser(user.id); else await adminApi.blockUser(user.id);
      setUsers((current) => current.map((item) => item.id === user.id ? { ...item, isBlocked: !item.isBlocked } : item));
    } catch (err: any) { setError(err.message || "Unable to update this user."); }
    finally { setActionId(null); }
  }

  const pages = Math.max(1, Math.ceil(total / limit));
  return <div className="flex flex-col gap-6">
    <div><h1 className="text-2xl font-bold text-foreground">User Controls</h1><p className="mt-1 text-sm text-muted-foreground">Search and manage platform user access.</p></div>
    <form onSubmit={handleSearch} className="flex gap-2"><div className="relative flex-1"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search by name, email, or matric number" className="w-full rounded-xl border border-border bg-card py-2.5 pl-9 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-ring" /></div><button type="submit" className="rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90">Search</button></form>
    {error && <div className="flex items-center gap-2 rounded-xl bg-destructive/10 p-4 text-sm text-destructive"><AlertCircle className="h-4 w-4 shrink-0" /> {error}</div>}
    <div className="overflow-hidden rounded-2xl bg-card"><div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground"><th className="px-4 py-3 font-medium">User</th><th className="px-4 py-3 font-medium">School</th><th className="px-4 py-3 font-medium">Role</th><th className="px-4 py-3 font-medium">Status</th><th className="px-4 py-3 font-medium">Action</th></tr></thead><tbody>
      {loading ? Array.from({ length: 8 }).map((_, row) => <tr key={row} className="border-b border-border">{Array.from({ length: 5 }).map((_, cell) => <td key={cell} className="px-4 py-4"><div className="h-4 w-24 animate-pulse rounded bg-muted" /></td>)}</tr>) : users.map((user) => <tr key={user.id} className="border-b border-border transition-colors last:border-0 hover:bg-muted/50"><td className="px-4 py-3"><p className="font-medium text-foreground">{user.fullName}</p><p className="text-xs text-muted-foreground">{user.email}</p>{user.matricNumber && <p className="text-xs text-muted-foreground">{user.matricNumber}</p>}</td><td className="px-4 py-3 text-muted-foreground">{user.school?.shortCode ?? "—"}</td><td className="px-4 py-3"><span className={`rounded-full px-2 py-1 text-xs font-semibold ${ROLE_STYLES[user.role] ?? "bg-muted text-muted-foreground"}`}>{user.role.replace(/_/g, " ")}</span></td><td className="px-4 py-3"><span className={`rounded-full px-2 py-1 text-xs font-semibold ${user.isBlocked ? "bg-destructive/10 text-destructive" : "bg-emerald-100 text-emerald-700"}`}>{user.isBlocked ? "Blocked" : "Active"}</span></td><td className="px-4 py-3"><button disabled={actionId === user.id} onClick={() => toggleBlocked(user)} className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium disabled:opacity-50 ${user.isBlocked ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200" : "bg-destructive/10 text-destructive hover:bg-destructive/20"}`}>{user.isBlocked ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Ban className="h-3.5 w-3.5" />}{actionId === user.id ? "Saving…" : user.isBlocked ? "Unblock" : "Block"}</button></td></tr>)}
    </tbody></table></div>{!loading && users.length === 0 && <div className="flex flex-col items-center gap-2 py-12 text-center text-sm text-muted-foreground"><ShieldAlert className="h-5 w-5" /> No users found.</div>}</div>
    {!loading && total > 0 && <div className="flex items-center justify-between"><p className="text-sm text-muted-foreground">{total} user{total === 1 ? "" : "s"} · Page {page} of {pages}</p><div className="flex gap-2"><button disabled={page === 1} onClick={() => setPage((current) => current - 1)} className="rounded-xl border border-border p-2 hover:bg-accent disabled:opacity-40" aria-label="Previous page"><ChevronLeft className="h-4 w-4" /></button><button disabled={page >= pages} onClick={() => setPage((current) => current + 1)} className="rounded-xl border border-border p-2 hover:bg-accent disabled:opacity-40" aria-label="Next page"><ChevronRight className="h-4 w-4" /></button></div></div>}
  </div>;
}
