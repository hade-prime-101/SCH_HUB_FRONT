"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Upload,
  FileText,
  Download,
  Star,
  BookOpen,
  Plus,
  Loader2,
  AlertTriangle,
  RefreshCw,
  Trash2,
  X } from "lucide-react";
import BackButton from "@/components/shared/BackButton";
import { usersApi } from "@/lib/api/users";
import { studyApi } from "@/lib/api";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Material {
  id:            string;
  title:         string;
  courseCode:    string;
  type:          string;
  downloadCount?: number;
  averageRating?: number;
  visibility?:   string;
  createdAt:     string;
}

const TYPE_COLORS: Record<string, string> = {
  PAST_QUESTION: "bg-blue-100 text-blue-700",
  NOTE:          "bg-emerald-100 text-emerald-700",
  HANDOUT:       "bg-amber-100 text-amber-700",
  ASSIGNMENT:    "bg-violet-100 text-violet-700",
  SUMMARY:       "bg-pink-100 text-pink-700",
  SLIDES:        "bg-indigo-100 text-indigo-700",
  OTHER:         "bg-slate-100 text-slate-600" };

const VIS_BADGE: Record<string, string> = {
  PUBLIC:     "bg-emerald-50 text-emerald-600",
  DEPARTMENT: "bg-blue-50 text-blue-600",
  LEVEL:      "bg-amber-50 text-amber-600",
  PRIVATE:    "bg-slate-100 text-slate-500" };

function timeAgo(iso: string) {
  const d = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
  if (d === 0) return "today";
  if (d === 1) return "yesterday";
  if (d < 30)  return `${d}d ago`;
  return new Date(iso).toLocaleDateString([], { month: "short", year: "numeric" });
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function MyMaterialsPage() {
  const router = useRouter();

  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState<string | null>(null);
  const [deleting,  setDeleting]  = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);

  async function load() {
    setLoading(true); setError(null);
    try {
      const data = await usersApi.getMyMaterials();
      setMaterials(Array.isArray(data) ? (data as Material[]) : []);
    } catch (e: any) {
      setError(e.message || "Failed to load your materials.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function handleDelete(id: string) {
    setDeleting(id);
    try {
      await studyApi.deleteMaterial(id);
      setMaterials((prev) => prev.filter((m) => m.id !== id));
      setConfirmId(null);
    } catch (e: any) {
      setError(e.message || "Failed to delete material.");
    } finally {
      setDeleting(null);
    }
  }

  const total     = materials.length;
  const totalDl   = materials.reduce((acc, m) => acc + (m.downloadCount ?? 0), 0);

  return (
    <div className="min-h-screen bg-slate-50">

      {/* ── Header ── */}
      <div className="bg-white px-4 pt-5 pb-4 flex items-center gap-3 border-b border-slate-100">
        <BackButton />
        <h1 className="text-xl font-bold text-slate-900 flex-1">My Uploads</h1>
        <button
          onClick={load}
          className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center shrink-0"
          aria-label="Refresh"
        >
          <RefreshCw className="w-4 h-4 text-slate-500" />
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
        ) : (
          <>
            {/* ── Stats row ── */}
            {total > 0 && (
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white rounded-2xl shadow-sm px-4 py-4 text-center">
                  <p className="text-2xl font-bold text-slate-900">{total}</p>
                  <p className="text-xs text-slate-400 font-medium mt-0.5">Materials uploaded</p>
                </div>
                <div className="bg-white rounded-2xl shadow-sm px-4 py-4 text-center">
                  <div className="flex items-center justify-center gap-1 mb-0.5">
                    <Download className="w-4 h-4 text-indigo-400" />
                    <p className="text-2xl font-bold text-slate-900">{totalDl.toLocaleString()}</p>
                  </div>
                  <p className="text-xs text-slate-400 font-medium">Total downloads</p>
                </div>
              </div>
            )}

            {/* ── Upload CTA ── */}
            <div className="flex gap-2">
              <Link
                href="/dashboard/study/materials/upload"
                className="flex-1 rounded-2xl bg-indigo-500 py-3.5 font-bold text-white shadow-lg shadow-indigo-100 flex items-center justify-center gap-2 transition active:opacity-90 text-sm"
              >
                <Upload className="w-4 h-4" /> Upload Material
              </Link>
              <Link
                href="/dashboard/study/materials/bulk-upload"
                className="flex-1 rounded-2xl border-2 border-slate-200 bg-white py-3.5 font-bold text-slate-700 flex items-center justify-center gap-2 transition active:bg-slate-50 text-sm"
              >
                <Plus className="w-4 h-4" /> Bulk Upload
              </Link>
            </div>

            {/* ── Empty state ── */}
            {materials.length === 0 ? (
              <div className="bg-white rounded-2xl shadow-sm px-5 py-12 flex flex-col items-center gap-3 text-center">
                <BookOpen className="w-12 h-12 text-slate-200" />
                <p className="text-slate-500 font-semibold">No materials yet</p>
                <p className="text-slate-400 text-sm max-w-xs">
                  Upload your first study material and share it with your department.
                </p>
              </div>
            ) : (
              /* ── Materials list ── */
              <div className="flex flex-col gap-2">
                {materials.map((mat) => (
                  <div key={mat.id} className="bg-white rounded-2xl shadow-sm px-4 py-4">
                    <div className="flex items-start gap-3">
                      {/* Icon */}
                      <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center shrink-0">
                        <FileText className="w-5 h-5 text-indigo-500" />
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <Link
                          href={`/dashboard/study/materials/${mat.id}`}
                          className="font-bold text-slate-900 text-sm leading-snug hover:text-indigo-600 transition-colors line-clamp-2"
                        >
                          {mat.title}
                        </Link>
                        <p className="text-xs text-slate-400 mt-0.5 font-mono">{mat.courseCode}</p>

                        {/* Badges row */}
                        <div className="flex items-center gap-2 mt-2 flex-wrap">
                          <span className={`text-xs font-bold px-2 py-0.5 rounded-lg ${TYPE_COLORS[mat.type] ?? "bg-slate-100 text-slate-600"}`}>
                            {mat.type.replace(/_/g, " ")}
                          </span>
                          {mat.visibility && (
                            <span className={`text-xs font-semibold px-2 py-0.5 rounded-lg ${VIS_BADGE[mat.visibility] ?? "bg-slate-100 text-slate-500"}`}>
                              {mat.visibility}
                            </span>
                          )}
                        </div>

                        {/* Stats */}
                        <div className="flex items-center gap-3 mt-2 text-xs text-slate-400">
                          {mat.downloadCount != null && (
                            <span className="flex items-center gap-1">
                              <Download className="w-3 h-3" /> {mat.downloadCount}
                            </span>
                          )}
                          {mat.averageRating != null && (
                            <span className="flex items-center gap-1">
                              <Star className="w-3 h-3 text-amber-400" /> {mat.averageRating.toFixed(1)}
                            </span>
                          )}
                          <span>{timeAgo(mat.createdAt)}</span>
                        </div>
                      </div>

                      {/* Delete button */}
                      <button
                        onClick={() => setConfirmId(mat.id)}
                        disabled={deleting === mat.id}
                        className="w-8 h-8 rounded-xl bg-rose-50 flex items-center justify-center shrink-0 transition active:bg-rose-100 disabled:opacity-50 mt-0.5"
                        aria-label="Delete material"
                      >
                        {deleting === mat.id
                          ? <Loader2 className="w-3.5 h-3.5 text-rose-400 animate-spin" />
                          : <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                        }
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* ── Delete confirm modal ── */}
      {confirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setConfirmId(null)} />
          <div className="relative bg-white rounded-3xl w-full max-w-sm p-6 shadow-2xl">
            <div className="flex flex-col items-center text-center gap-4">
              <div className="w-14 h-14 rounded-full bg-rose-100 flex items-center justify-center">
                <Trash2 className="w-7 h-7 text-rose-500" />
              </div>
              <h2 className="text-xl font-bold text-slate-900">Delete material?</h2>
              <p className="text-slate-400 text-sm leading-relaxed">
                This will permanently remove the material. This action cannot be undone.
              </p>
              <div className="flex gap-3 w-full">
                <button
                  onClick={() => setConfirmId(null)}
                  disabled={!!deleting}
                  className="flex-1 rounded-2xl border-2 border-slate-200 py-3.5 font-bold text-slate-700 transition active:bg-slate-50 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDelete(confirmId)}
                  disabled={!!deleting}
                  className="flex-1 rounded-2xl bg-rose-500 py-3.5 font-bold text-white flex items-center justify-center gap-2 transition active:opacity-90 disabled:opacity-50"
                >
                  {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
