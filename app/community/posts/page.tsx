"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CommunityHeader } from "@/components/community/CommunityHeader";
import { PostCard } from "@/components/community/PostCard";
import { CommunityEmptyState } from "@/components/community/CommunityEmptyState";
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton";
import { ErrorMessage } from "@/components/ui/ErrorMessage";
import { Pagination } from "@/components/ui/Pagination";
import { listPosts, deletePost, pinPost } from "@/lib/api/community.api";
import type { Post } from "@/types/community";

export default function PostsList() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const limit = 10;

  useEffect(() => {
    const fetchPosts = async () => {
      setLoading(true);
      try {
        const res = await listPosts({ page, limit });
        setPosts(res.data);
        setTotal(res.total);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (err: any) {
        setError(err.message || "Failed to load posts");
      } finally {
        setLoading(false);
      }
    };
    fetchPosts();
  }, [page]);

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this post?")) return;
    try {
      await deletePost(id);
      setPosts((prev) => prev.filter((p) => p.id !== id));
      setTotal((t) => t - 1);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      alert(err.message || "Failed to delete post");
    }
  };

  const handlePin = async (id: string, isPinned: boolean) => {
    try {
      await pinPost(id, !isPinned);
      setPosts((prev) =>
        prev.map((p) => (p.id === id ? { ...p, isPinned: !isPinned } : p))
      );
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      alert(err.message || "Failed to update pin status");
    }
  };

  if (error) {
    return <ErrorMessage message={error} />;
  }

  return (
    <div className="pb-24">
      <CommunityHeader
        title="Discussion Posts"
        description="Share updates, announcements, and engage with the community"
        action={
          <Button asChild>
            <Link href="/community/posts/new">
              <Plus className="w-4 h-4 mr-1.5" />
              New Post
            </Link>
          </Button>
        }
      />

      {loading ? (
        <LoadingSkeleton count={3} height="h-28" />
      ) : (
        <>
          {posts.length === 0 ? (
            <CommunityEmptyState
              icon={<Plus className="w-8 h-8" />}
              title="No posts yet"
              description="Start a new discussion and be the first to post!"
              action={
                <Button asChild>
                  <Link href="/community/posts/new">Create Post</Link>
                </Button>
              }
            />
          ) : (
            <div className="space-y-4">
              {posts.map((post) => (
                <PostCard
                  key={post.id}
                  post={post}
                  onPin={handlePin}
                  onDelete={handleDelete}
                  showActions
                />
              ))}
            </div>
          )}

          {total > limit && (
            <Pagination
              currentPage={page}
              totalPages={Math.ceil(total / limit)}
              onPageChange={setPage}
              showPageNumber
            />
          )}
        </>
      )}
    </div>
  );
}