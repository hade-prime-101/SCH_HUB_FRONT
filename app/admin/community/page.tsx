"use client";

import { useEffect, useState, useCallback } from "react";
import { communityApi } from "@/lib/api/community";
import { Trash2, Pin, CheckCircle, AlertCircle, Flag, MessageSquare } from "lucide-react";

interface Post {
  id: string;
  content: string;
  section: string;
  author?: { fullName: string };
  upvotes?: number;
  isPinned?: boolean;
  createdAt: string;
}

interface Report {
  id: string;
  reason: string;
  details?: string;
  createdAt: string;
  reporter?: { fullName: string };
  post?: { id: string; content: string };
}

type Tab = "posts" | "reports";

function TabBtn({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
        active ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-accent"
      }`}
    >
      {children}
    </button>
  );
}

export default function AdminCommunityPage() {
  const [tab, setTab]           = useState<Tab>("posts");
  const [posts, setPosts]       = useState<Post[]>([]);
  const [reports, setReports]   = useState<Report[]>([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState<string | null>(null);
  const [actionId, setActionId] = useState<string | null>(null);

  const loadPosts = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const data: any = await communityApi.getFeed({ limit: "50" });
      const items = data?.items ?? data?.posts ?? (Array.isArray(data) ? data : []);
      setPosts(items);
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  }, []);

  const loadReports = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const data: any = await communityApi.getReports({ limit: "50" });
      const items = data?.items ?? data?.reports ?? (Array.isArray(data) ? data : []);
      setReports(items);
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    if (tab === "posts") loadPosts();
    else loadReports();
  }, [tab, loadPosts, loadReports]);

  async function deletePost(id: string) {
    if (!confirm("Delete this post?")) return;
    setActionId(id);
    try {
      await communityApi.deletePost(id);
      setPosts((p) => p.filter((x) => x.id !== id));
    } catch (e: any) { alert(e.message); }
    finally { setActionId(null); }
  }

  async function pinPost(id: string) {
    setActionId(id);
    try {
      await communityApi.pinPost(id, true);
      setPosts((p) => p.map((x) => x.id === id ? { ...x, isPinned: true } : x));
    } catch (e: any) { alert(e.message); }
    finally { setActionId(null); }
  }

  async function resolveReport(id: string) {
    setActionId(id);
    try {
      await communityApi.resolveReport(id);
      setReports((r) => r.filter((x) => x.id !== id));
    } catch (e: any) { alert(e.message); }
    finally { setActionId(null); }
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Community</h1>
        <p className="text-muted-foreground text-sm mt-1">Moderate posts and resolve reports</p>
      </div>

      <div className="flex gap-2">
        <TabBtn active={tab === "posts"}   onClick={() => setTab("posts")}>
          <span className="flex items-center gap-1.5"><MessageSquare className="w-3.5 h-3.5" /> Posts</span>
        </TabBtn>
        <TabBtn active={tab === "reports"} onClick={() => setTab("reports")}>
          <span className="flex items-center gap-1.5"><Flag className="w-3.5 h-3.5" /> Reports</span>
        </TabBtn>
      </div>

      {error && (
        <div className="bg-destructive/10 text-destructive rounded-xl p-4 flex items-center gap-2 text-sm">
          <AlertCircle className="w-4 h-4 shrink-0" /> {error}
        </div>
      )}

      {loading ? (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="bg-card rounded-2xl p-5 h-24 animate-pulse" />
          ))}
        </div>
      ) : tab === "posts" ? (
        posts.length === 0 ? (
          <div className="bg-card rounded-2xl p-10 text-center text-muted-foreground text-sm">No posts found.</div>
        ) : (
          <div className="flex flex-col gap-3">
            {posts.map((post) => (
              <div key={post.id} className="bg-card rounded-2xl p-4 flex items-start gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-accent text-accent-foreground">
                      {post.section}
                    </span>
                    {post.author && (
                      <span className="text-xs text-muted-foreground">{post.author.fullName}</span>
                    )}
                    <span className="text-xs text-muted-foreground ml-auto">
                      {new Date(post.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-sm text-foreground line-clamp-2">{post.content}</p>
                </div>
                <div className="flex gap-1 shrink-0">
                  <button
                    disabled={actionId === post.id}
                    onClick={() => pinPost(post.id)}
                    title="Pin post"
                    className="p-1.5 rounded-lg hover:bg-accent text-muted-foreground hover:text-primary transition-colors disabled:opacity-50"
                  >
                    <Pin className="w-4 h-4" />
                  </button>
                  <button
                    disabled={actionId === post.id}
                    onClick={() => deletePost(post.id)}
                    title="Delete post"
                    className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors disabled:opacity-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )
      ) : reports.length === 0 ? (
        <div className="bg-card rounded-2xl p-10 text-center text-muted-foreground text-sm">No unresolved reports.</div>
      ) : (
        <div className="flex flex-col gap-3">
          {reports.map((report) => (
            <div key={report.id} className="bg-card rounded-2xl p-4 flex items-start gap-4">
              <div className="w-9 h-9 rounded-xl bg-destructive/10 flex items-center justify-center shrink-0">
                <Flag className="w-4 h-4 text-destructive" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-destructive/10 text-destructive">
                    {report.reason}
                  </span>
                  {report.reporter && (
                    <span className="text-xs text-muted-foreground">by {report.reporter.fullName}</span>
                  )}
                  <span className="text-xs text-muted-foreground ml-auto">
                    {new Date(report.createdAt).toLocaleDateString()}
                  </span>
                </div>
                {report.details && <p className="text-xs text-muted-foreground mb-1">{report.details}</p>}
                {report.post && (
                  <p className="text-sm text-foreground line-clamp-2 bg-muted rounded-lg px-3 py-2">
                    {report.post.content}
                  </p>
                )}
              </div>
              <button
                disabled={actionId === report.id}
                onClick={() => resolveReport(report.id)}
                title="Mark resolved"
                className="p-1.5 rounded-lg hover:bg-emerald-100 text-muted-foreground hover:text-emerald-600 transition-colors disabled:opacity-50 shrink-0"
              >
                <CheckCircle className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
