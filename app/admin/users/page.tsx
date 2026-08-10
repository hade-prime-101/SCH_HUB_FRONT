"use client";

import { useEffect, useState, useCallback } from "react";
import { usersApi } from "@/lib/api/users";
import { adminApi } from "@/lib/api/admin";
import { Search, ShieldCheck, Ban, CheckCircle, AlertCircle, ChevronLeft, ChevronRight } from "lucide-react";

interface User {
  id: string;
  fullName: string;
  email: string;
  role: string;
  level?: string;
  isBlocked?: boolean;
  matricNumber?: string;
}

const ROLES = ["AUTHORIZED_UPLOADER", "EVENT_ORCHESTRATOR", "SCHOOL_ADMIN"];

const ROLE_BADGE: Record<string, string> = {
  STUDENT:              "bg-blue-100 text-blue-700",
  COURSE_REP:           "bg-violet-100 text-violet-700",
  AUTHORIZED_UPLOADER:  "bg-amber-100 text-amber-700",
  EVENT_ORCHESTRATOR:   "bg-emerald-100 text-emerald-700",
  SCHOOL_ADMIN:         "bg-primary/10 text-primary",
  SUPER_ADMIN:          "bg-red-100 text-red-700",
};

export default function AdminUsersPage() {
  const [users, setUsers]       = useState<User[]>([]);
  const [total, setTotal]       = useState(0);
  const [page, setPage]         = useState(1);
  const [search, setSearch]     = useState("");
  const [query, setQuery]       = useState("");
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState<string | null>(null);
  const [actionId, setActionId] = useState<string | null>(null);

  const limit = 20;

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params: Record<string, string> = { page: String(page), limit: String(limit) };
      let data: any;
      if (query.trim()) {
        data = await usersApi.searchUsers(query, page, limit);
      } else {
        data = await usersApi.listUsers(params);
      }
      const items = data?.items ?? data?.users ?? (Array.isArray(data) ? data : []);
      setUsers(items);
      setTotal(data?.total ?? items.length);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [page, query]);

  useEffect(() => { load(); }, [load]);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setPage(1);
    setQuery(search);
  }

  async function toggleBlock(user: User) {
    setActionId(user.id);
    try {
      if (user.isBlocked) {
        await adminApi.unblockUser(user.id);
      } else {
        await adminApi.blockUser(user.id);
      }
      setUsers((prev) =>
        prev.map((u) => (u.id === user.id ? { ...u, isBlocked: !u.isBlocked } : u))
      );
    } catch (e: any) {
      alert(e.message);
    } finally {
      setActionId(null);
    }
  }

  async function assignRole(userId: string, role: string) {
    setActionId(userId);
    try {
      await usersApi.assignRole(userId, role);
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, role } : u))
      );
    } catch (e: any) {
      alert(e.message);
    } finally {
      setActionId(null);
    }
  }

  const pages = Math.ceil(total / limit);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Users</h1>
        <p className="text-muted-foreground text-sm mt-1">{total} total users</p>
      </div>

      {/* Search */}
      <form onSubmit={handleSearch} className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, email or matric…"
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <button
          type="submit"
          className="px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity"
        >
          Search
        </button>
      </form>

      {error && (
        <div className="bg-destructive/10 text-destructive rounded-xl p-4 flex items-center gap-2 text-sm">
          <AlertCircle className="w-4 h-4 shrink-0" /> {error}
        </div>
      )}

      {/* Table */}
      <div className="bg-card rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-muted-foreground text-xs uppercase tracking-wide">
                <th className="text-left px-4 py-3 font-medium">User</th>
                <th className="text-left px-4 py-3 font-medium">Matric</th>
                <th className="text-left px-4 py-3 font-medium">Level</th>
                <th className="text-left px-4 py-3 font-medium">Role</th>
                <th className="text-left px-4 py-3 font-medium">Status</th>
                <th className="text-left px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading
                ? Array.from({ length: 8 }).map((_, i) => (
                    <tr key={i} className="border-b border-border">
                      {Array.from({ length: 6 }).map((_, j) => (
                        <td key={j} className="px-4 py-3">
                          <div className="h-4 bg-muted rounded animate-pulse w-24" />
                        </td>
                      ))}
                    </tr>
                  ))
                : users.map((user) => (
                    <tr key={user.id} className="border-b border-border last:border-0 hover:bg-muted/50 transition-colors">
                      <td className="px-4 py-3">
                        <p className="font-medium text-foreground">{user.fullName}</p>
                        <p className="text-xs text-muted-foreground">{user.email}</p>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{user.matricNumber ?? "—"}</td>
                      <td className="px-4 py-3 text-muted-foreground">{user.level ?? "—"}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-semibold px-2 py-1 rounded-full ${ROLE_BADGE[user.role] ?? "bg-muted text-muted-foreground"}`}>
                          {user.role}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {user.isBlocked ? (
                          <span className="text-xs font-semibold px-2 py-1 rounded-full bg-destructive/10 text-destructive">Blocked</span>
                        ) : (
                          <span className="text-xs font-semibold px-2 py-1 rounded-full bg-emerald-100 text-emerald-700">Active</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {/* Block / Unblock */}
                          <button
                            disabled={actionId === user.id}
                            onClick={() => toggleBlock(user)}
                            title={user.isBlocked ? "Unblock" : "Block"}
                            className={`p-1.5 rounded-lg transition-colors disabled:opacity-50 ${
                              user.isBlocked
                                ? "hover:bg-emerald-100 text-emerald-600"
                                : "hover:bg-destructive/10 text-destructive"
                            }`}
                          >
                            {user.isBlocked ? <CheckCircle className="w-4 h-4" /> : <Ban className="w-4 h-4" />}
                          </button>

                          {/* Assign role */}
                          <select
                            disabled={actionId === user.id}
                            value=""
                            onChange={(e) => e.target.value && assignRole(user.id, e.target.value)}
                            className="text-xs border border-border rounded-lg px-2 py-1 bg-background focus:outline-none focus:ring-1 focus:ring-ring disabled:opacity-50"
                          >
                            <option value="">Assign role…</option>
                            {ROLES.map((r) => (
                              <option key={r} value={r}>{r.replace(/_/g, " ")}</option>
                            ))}
                          </select>
                        </div>
                      </td>
                    </tr>
                  ))}
            </tbody>
          </table>
        </div>

        {!loading && users.length === 0 && (
          <p className="text-center text-muted-foreground text-sm py-10">No users found.</p>
        )}
      </div>

      {/* Pagination */}
      {pages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Page {page} of {pages}
          </p>
          <div className="flex gap-2">
            <button
              disabled={page === 1}
              onClick={() => setPage((p) => p - 1)}
              className="p-2 rounded-xl border border-border hover:bg-accent disabled:opacity-40 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              disabled={page === pages}
              onClick={() => setPage((p) => p + 1)}
              className="p-2 rounded-xl border border-border hover:bg-accent disabled:opacity-40 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
