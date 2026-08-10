"use client";

import { useEffect, useState, useCallback } from "react";
import { studyApi } from "@/lib/api";
import { BookOpen, ShieldCheck, Trash2, AlertCircle, Search, ChevronLeft, ChevronRight } from "lucide-react";

interface Material {
  id: string;
  title: string;
  type: string;
  courseCode: string;
  level?: string;
  isVerified?: boolean;
  uploadedBy?: { fullName: string };
  createdAt: string;
  fileUrl?: string;
}

const TYPE_BADGE: Record<string, string> = {
  PAST_QUESTION: "bg-violet-100 text-violet-700",
  NOTE:          "bg-blue-100 text-blue-700",
  HANDOUT:       "bg-amber-100 text-amber-700",
  ASSIGNMENT:    "bg-orange-100 text-orange-700",
  SUMMARY:       "bg-emerald-100 text-emerald-700",
  SLIDES:        "bg-indigo-100 text-indigo-700",
  OTHER:         "bg-muted text-muted-foreground",
};

export default function AdminMaterialsPage() {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [total, setTotal]         = useState(0);
  const [page, setPage]           = useState(1);
  const [search, setSearch]       = useState("");
  const [query, setQuery]         = useState("");
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState<string | null>(null);
  const [actionId, setActionId]   = useState<string | null>(null);
  const limit = 20;

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const params: Record<string, string> = { page: String(page), limit: String(limit) };
      if (query) params.search = query;
      const data: any = await studyApi.getMaterials(params);
      const items = data?.items ?? data?.materials ?? (Array.isArray(data) ? data : []);
      setMaterials(items);
      setTotal(data?.total ?? items.length);
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  }, [page, query]);

  useEffect(() => { load(); }, [load]);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setPage(1);
    setQuery(search);
  }

  async function verify(id: string) {
    setActionId(id);
    try {
      await studyApi.verifyMaterial(id);
      setMaterials((prev) => prev.map((m) => m.id === id ? { ...m, isVerified: true } : m));
    } catch (e: any) { alert(e.message); }
    finally { setActionId(null); }
  }

  async function remove(id: string) {
    if (!confirm("Force-delete this material?")) return;
    setActionId(id);
    try {
      await studyApi.adminDeleteMaterial(id);
      setMaterials((prev) => prev.filter((m) => m.id !== id));
    } catch (e: any) { alert(e.message); }
    finally { setActionId(null); }
  }

  const pages = Math.ceil(total / limit);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Materials</h1>
        <p className="text-muted-foreground text-sm mt-1">{total} total materials</p>
      </div>

      <form onSubmit={handleSearch} className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by title or course code…"
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <button type="submit" className="px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity">
          Search
        </button>
      </form>

      {error && (
        <div className="bg-destructive/10 text-destructive rounded-xl p-4 flex items-center gap-2 text-sm">
          <AlertCircle className="w-4 h-4 shrink-0" /> {error}
        </div>
      )}

      <div className="bg-card rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-muted-foreground text-xs uppercase tracking-wide">
                <th className="text-left px-4 py-3 font-medium">Title</th>
                <th className="text-left px-4 py-3 font-medium">Type</th>
                <th className="text-left px-4 py-3 font-medium">Course</th>
                <th className="text-left px-4 py-3 font-medium">Uploaded by</th>
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
                : materials.map((m) => (
                    <tr key={m.id} className="border-b border-border last:border-0 hover:bg-muted/50 transition-colors">
                      <td className="px-4 py-3">
                        <p className="font-medium text-foreground line-clamp-1">{m.title}</p>
                        <p className="text-xs text-muted-foreground">{new Date(m.createdAt).toLocaleDateString()}</p>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-semibold px-2 py-1 rounded-full ${TYPE_BADGE[m.type] ?? TYPE_BADGE.OTHER}`}>
                          {m.type}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{m.courseCode}{m.level ? ` · L${m.level}` : ""}</td>
                      <td className="px-4 py-3 text-muted-foreground">{m.uploadedBy?.fullName ?? "—"}</td>
                      <td className="px-4 py-3">
                        {m.isVerified
                          ? <span className="text-xs font-semibold px-2 py-1 rounded-full bg-emerald-100 text-emerald-700">Verified</span>
                          : <span className="text-xs font-semibold px-2 py-1 rounded-full bg-amber-100 text-amber-700">Unverified</span>
                        }
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          {!m.isVerified && (
                            <button
                              disabled={actionId === m.id}
                              onClick={() => verify(m.id)}
                              title="Verify"
                              className="p-1.5 rounded-lg hover:bg-emerald-100 text-muted-foreground hover:text-emerald-600 transition-colors disabled:opacity-50"
                            >
                              <ShieldCheck className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            disabled={actionId === m.id}
                            onClick={() => remove(m.id)}
                            title="Delete"
                            className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors disabled:opacity-50"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
            </tbody>
          </table>
        </div>
        {!loading && materials.length === 0 && (
          <p className="text-center text-muted-foreground text-sm py-10">No materials found.</p>
        )}
      </div>

      {pages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">Page {page} of {pages}</p>
          <div className="flex gap-2">
            <button disabled={page === 1} onClick={() => setPage((p) => p - 1)} className="p-2 rounded-xl border border-border hover:bg-accent disabled:opacity-40 transition-colors">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button disabled={page === pages} onClick={() => setPage((p) => p + 1)} className="p-2 rounded-xl border border-border hover:bg-accent disabled:opacity-40 transition-colors">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
