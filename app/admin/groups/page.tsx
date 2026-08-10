"use client";

import { useEffect, useState } from "react";
import { communityApi } from "@/lib/api/community";
import { Users2, Trash2, AlertCircle, Lock, Globe } from "lucide-react";

interface Group {
  id: string;
  name: string;
  description?: string;
  type: string;
  isPrivate: boolean;
  courseTag?: string;
  memberCount?: number;
  createdAt: string;
  creator?: { fullName: string };
}

const TYPE_BADGE: Record<string, string> = {
  EXAM_PREP:  "bg-violet-100 text-violet-700",
  ASSIGNMENT: "bg-amber-100 text-amber-700",
  TUTORIAL:   "bg-blue-100 text-blue-700",
  PROJECT:    "bg-emerald-100 text-emerald-700",
  GENERAL:    "bg-muted text-muted-foreground",
};

export default function AdminGroupsPage() {
  const [groups, setGroups]     = useState<Group[]>([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    communityApi
      .getAllGroups()
      .then((data: any) => {
        const items = data?.items ?? data?.groups ?? (Array.isArray(data) ? data : []);
        setGroups(items);
      })
      .catch((e: any) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  async function handleDelete(id: string) {
    if (!confirm("Delete this study group?")) return;
    setDeletingId(id);
    try {
      await communityApi.deleteGroup(id);
      setGroups((prev) => prev.filter((g) => g.id !== id));
    } catch (e: any) { alert(e.message); }
    finally { setDeletingId(null); }
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Study Groups</h1>
        <p className="text-muted-foreground text-sm mt-1">{groups.length} groups in your school</p>
      </div>

      {error && (
        <div className="bg-destructive/10 text-destructive rounded-xl p-4 flex items-center gap-2 text-sm">
          <AlertCircle className="w-4 h-4 shrink-0" /> {error}
        </div>
      )}

      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-card rounded-2xl p-5 h-36 animate-pulse" />
          ))}
        </div>
      ) : groups.length === 0 ? (
        <div className="bg-card rounded-2xl p-10 text-center text-muted-foreground text-sm">
          No study groups found.
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {groups.map((group) => (
            <div key={group.id} className="bg-card rounded-2xl p-5 flex flex-col gap-3">
              <div className="flex items-start justify-between gap-2">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <Users2 className="w-5 h-5 text-primary" />
                </div>
                <button
                  disabled={deletingId === group.id}
                  onClick={() => handleDelete(group.id)}
                  className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors disabled:opacity-50"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <div>
                <div className="flex items-center gap-1.5 mb-1">
                  <p className="font-semibold text-foreground leading-tight">{group.name}</p>
                  {group.isPrivate
                    ? <Lock className="w-3 h-3 text-muted-foreground shrink-0" />
                    : <Globe className="w-3 h-3 text-muted-foreground shrink-0" />
                  }
                </div>
                {group.description && (
                  <p className="text-xs text-muted-foreground line-clamp-2">{group.description}</p>
                )}
              </div>

              <div className="flex items-center gap-2 flex-wrap mt-auto">
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${TYPE_BADGE[group.type] ?? TYPE_BADGE.GENERAL}`}>
                  {group.type}
                </span>
                {group.courseTag && (
                  <span className="text-xs text-muted-foreground">{group.courseTag}</span>
                )}
                {group.memberCount !== undefined && (
                  <span className="text-xs text-muted-foreground ml-auto">{group.memberCount} members</span>
                )}
              </div>

              {group.creator && (
                <p className="text-xs text-muted-foreground">Created by {group.creator.fullName}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
