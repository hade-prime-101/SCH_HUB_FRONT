"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  BookOpen,
  User,
  GraduationCap,
  Loader2,
  AlertTriangle,
  Download,
  FileText } from "lucide-react";
import BackButton from "@/components/shared/BackButton";
import { usersApi } from "@/lib/api/users";

// ─── Types ────────────────────────────────────────────────────────────────────

interface PublicUser {
  id: string;
  fullName: string;
  role: string;
  level?: string;
  bio?: string | null;
  profilePictureUrl?: string | null;
  school?: { id: string; name: string };
  faculty?: { id: string; name: string };
  department?: { id: string; name: string };
  _count?: { materials?: number };
}

interface Material {
  id: string;
  title: string;
  courseCode: string;
  type: string;
  downloadCount?: number;
  createdAt: string;
}

const MATERIAL_TYPE_COLORS: Record<string, string> = {
  PAST_QUESTION:  "bg-blue-100 text-blue-700",
  NOTE:           "bg-emerald-100 text-emerald-700",
  HANDOUT:        "bg-amber-100 text-amber-700",
  ASSIGNMENT:     "bg-violet-100 text-violet-700",
  SUMMARY:        "bg-pink-100 text-pink-700",
  SLIDES:         "bg-indigo-100 text-indigo-700",
  OTHER:          "bg-slate-100 text-slate-600" };

function initials(name: string) {
  return name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase();
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function PublicUserProfilePage() {
  const router = useRouter();
  const params = useParams();
  const userId = params?.userId as string;

  const [user,      setUser]      = useState<PublicUser | null>(null);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState<string | null>(null);

  useEffect(() => {
    if (!userId) return;
    Promise.all([
      usersApi.getUser(userId),
      usersApi.getUserMaterials(userId).catch(() => []),
    ])
      .then(([u, mats]) => {
        setUser(u as PublicUser);
        setMaterials(Array.isArray(mats) ? (mats as Material[]) : []);
      })
      .catch((e: any) => setError(e.message || "Failed to load profile."))
      .finally(() => setLoading(false));
  }, [userId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col">
        <div className="bg-white px-4 pt-5 pb-4 flex items-center gap-3 border-b border-slate-100">
          <BackButton />
          <div className="h-5 w-32 bg-slate-200 rounded animate-pulse" />
        </div>
        <div className="px-4 py-5 flex flex-col gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-2xl p-4 shadow-sm">
              <div className="h-4 bg-slate-200 rounded animate-pulse w-3/4 mb-2" />
              <div className="h-3 bg-slate-100 rounded animate-pulse w-1/2" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center gap-4 px-6">
        <AlertTriangle className="w-12 h-12 text-rose-400" />
        <p className="text-slate-500 font-medium text-center">{error ?? "User not found."}</p>
        <BackButton variant="text" label="Go back" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">

      {/* ── Header ── */}
      <div className="bg-white px-4 pt-5 pb-4 flex items-center gap-3 border-b border-slate-100">
        <BackButton />
        <h1 className="text-xl font-bold text-slate-900 truncate">Profile</h1>
      </div>

      <div className="px-4 py-5 flex flex-col gap-4 max-w-lg mx-auto">

        {/* ── Avatar + name ── */}
        <div className="bg-white rounded-2xl shadow-sm px-5 py-6 flex flex-col items-center text-center">
          {user.profilePictureUrl ? (
            <img
              src={user.profilePictureUrl}
              alt={user.fullName}
              className="w-20 h-20 rounded-full object-cover mb-4"
            />
          ) : (
            <div className="w-20 h-20 rounded-full bg-indigo-100 flex items-center justify-center mb-4">
              <span className="text-2xl font-bold text-indigo-600">{initials(user.fullName)}</span>
            </div>
          )}

          <h2 className="text-xl font-bold text-slate-900 mb-1">{user.fullName}</h2>

          <span className="inline-block text-xs font-bold text-indigo-600 bg-indigo-50 rounded-full px-3 py-1 mb-3">
            {user.role.replace(/_/g, " ")}
          </span>

          {user.bio && (
            <p className="text-sm text-slate-500 leading-relaxed max-w-xs">{user.bio}</p>
          )}
        </div>

        {/* ── Stats row ── */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white rounded-2xl shadow-sm px-4 py-4 text-center">
            <p className="text-2xl font-bold text-slate-900">{user._count?.materials ?? materials.length}</p>
            <p className="text-xs text-slate-400 mt-0.5 font-medium">Materials</p>
          </div>
          <div className="bg-white rounded-2xl shadow-sm px-4 py-4 text-center">
            <div className="flex items-center justify-center gap-1 mb-0.5">
              <GraduationCap className="w-4 h-4 text-indigo-400" />
              <p className="text-2xl font-bold text-slate-900">{user.level ?? "—"}</p>
            </div>
            <p className="text-xs text-slate-400 font-medium">Level</p>
          </div>
        </div>

        {/* ── School info ── */}
        <div className="bg-white rounded-2xl shadow-sm px-5 py-4 flex flex-col gap-2">
          {user.school && (
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <User className="w-4 h-4 text-slate-400 shrink-0" />
              <span className="font-medium">{user.school.name}</span>
            </div>
          )}
          {user.faculty && (
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <BookOpen className="w-4 h-4 text-slate-400 shrink-0" />
              <span>{user.faculty.name}</span>
            </div>
          )}
          {user.department && (
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <FileText className="w-4 h-4 text-slate-400 shrink-0" />
              <span>{user.department.name}</span>
            </div>
          )}
        </div>

        {/* ── Materials ── */}
        <div>
          <h3 className="text-base font-bold text-slate-900 mb-3 flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-indigo-400" /> Uploaded Materials
          </h3>

          {materials.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-sm px-5 py-10 flex flex-col items-center gap-3 text-center">
              <BookOpen className="w-10 h-10 text-slate-200" />
              <p className="text-slate-400 font-medium">No materials uploaded yet.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {materials.map((mat) => (
                <div key={mat.id} className="bg-white rounded-2xl shadow-sm px-4 py-3.5 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-indigo-50 flex items-center justify-center shrink-0">
                    <FileText className="w-4 h-4 text-indigo-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-slate-900 text-sm truncate">{mat.title}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{mat.courseCode}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-lg ${MATERIAL_TYPE_COLORS[mat.type] ?? "bg-slate-100 text-slate-600"}`}>
                      {mat.type.replace(/_/g, " ")}
                    </span>
                    {mat.downloadCount != null && (
                      <span className="flex items-center gap-0.5 text-xs text-slate-400">
                        <Download className="w-3 h-3" /> {mat.downloadCount}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
