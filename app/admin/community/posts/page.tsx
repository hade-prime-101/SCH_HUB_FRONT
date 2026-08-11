"use client";

import { useState, useEffect } from "react";
import { Loader2, Trash2, CheckCircle, AlertCircle } from "lucide-react";
import { communityApi } from "@/lib/api/community";
import type { Post } from "@/types/community";

export default function AdminPostsPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "flagged" | "unpinned">("all");

  useEffect(() => {
    const loadPosts = async () => {
      try {
        const data = await communityApi.getFeed({ limit: "100" });
        setPosts(Array.isArray(data) ? data : data?.data ?? []);
      } catch (error) {
        console.error("Failed to load posts:", error);
      } finally {
        setLoading(false);
      }
    };
    loadPosts();
  }, []);

  const handleDelete = async (postId: string) => {
    if (!confirm("Are you sure you want to delete this post?")) return;
    try {
      await communityApi.deletePost(postId);
      setPosts(posts.filter((p) => p.id !== postId));
    } catch (error) {
      console.error("Failed to delete post:", error);
    }
  };

  const handlePin = async (postId: string, isPinned: boolean) => {
    try {
      await communityApi.pinPost(postId, !isPinned);
      setPosts(
        posts.map((p) =>
          p.id === postId ? { ...p, isPinned: !isPinned } : p
        )
      );
    } catch (error) {
      console.error("Failed to pin post:", error);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const filteredPosts = posts.filter((post) => {
    if (filter === "pinned") return post.isPinned;
    if (filter === "unpinned") return !post.isPinned;
    return true;
  });

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-foreground">Posts Management</h2>
        <span className="text-sm text-muted-foreground">{filteredPosts.length} posts</span>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-3 mb-6">
        {(["all", "pinned", "unpinned"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setFilter(tab)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors capitalize ${
              filter === tab
                ? "bg-primary text-primary-foreground"
                : "bg-card text-foreground hover:bg-accent"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {filteredPosts.length === 0 ? (
        <div className="bg-card rounded-2xl p-12 text-center">
          <p className="text-muted-foreground">No posts found</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredPosts.map((post) => (
            <div key={post.id} className="bg-card rounded-2xl p-6 border border-border">
              <div className="flex justify-between items-start gap-4 mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-bold text-foreground line-clamp-1">
                      {post.content}
                    </h3>
                    {post.isPinned && (
                      <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded">
                        Pinned
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {post.author?.fullName ?? "Anonymous"} • {new Date(post.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 justify-between">
                <div className="flex gap-4 text-sm text-muted-foreground">
                  <span>👍 {post.upvotes}</span>
                  <span>💬 {post.commentCount ?? 0}</span>
                  <span className="capitalize">{post.section?.toLowerCase().replace(/_/g, " ")}</span>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => handlePin(post.id, post.isPinned ?? false)}
                    title={post.isPinned ? "Unpin" : "Pin"}
                    className="p-2 hover:bg-accent rounded-lg transition-colors"
                  >
                    {post.isPinned ? (
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    ) : (
                      <AlertCircle className="w-5 h-5 text-muted-foreground" />
                    )}
                  </button>
                  <button
                    onClick={() => handleDelete(post.id)}
                    className="p-2 hover:bg-red-100 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-5 h-5 text-red-600" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
