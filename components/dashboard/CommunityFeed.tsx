import Link from "next/link";
import { SectionHeader, LoadingState, EmptyState } from "@/components/shared/DashboardPrimitives";
import { User as UserIcon, Pin, ChevronRight } from "lucide-react";

interface Post {
  id: string;
  content: string;
  isAnonymous?: boolean;
  isPinned?: boolean;
  author?: {
    fullName?: string | null;
  } | null;
}

interface CommunityFeedProps {
  posts: Post[];
  loading: boolean;
}

export function CommunityFeed({ posts, loading }: CommunityFeedProps) {
  return (
    <section>
      <SectionHeader title="Community" action="View feed" href="/community" />

      {loading ? (
        <LoadingState label="Loading community posts" />
      ) : posts.length === 0 ? (
        <EmptyState>No community posts yet.</EmptyState>
      ) : (
        <div className="flex flex-col divide-y divide-border/50">
          {posts.map((post) => {
            const displayName = post.isAnonymous
              ? "Anonymous"
              : post.author?.fullName ?? "Unknown";
            const avatarInitial = post.isAnonymous
              ? "A"
              : (post.author?.fullName?.[0] ?? "U").toUpperCase();

            return (
              <Link
                key={post.id}
                href={`/community/${post.id}`}
                className="block py-4 first:pt-0 last:pb-0 hover:bg-muted/20 rounded-2xl px-2 -mx-2 transition-colors"
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold shrink-0 ${
                      post.isAnonymous
                        ? "bg-muted text-muted-foreground"
                        : "bg-primary/10 text-primary"
                    }`}
                    aria-hidden="true"
                  >
                    {post.isAnonymous ? (
                      <UserIcon className="w-5 h-5" />
                    ) : (
                      avatarInitial
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-semibold text-foreground">
                        {displayName}
                      </span>
                      {post.isPinned && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                          <Pin className="w-3 h-3" />
                          Pinned
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                      {post.content}
                    </p>
                  </div>

                  <ChevronRight className="w-4 h-4 text-muted-foreground/30 shrink-0 self-center" />
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </section>
  );
}