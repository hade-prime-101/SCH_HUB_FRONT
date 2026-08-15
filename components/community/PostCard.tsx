import Link from "next/link";
import { MessageCircle, ThumbsUp, Pin } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { CommunityCard } from "./CommunityCard";
import type { Post } from "@/types/community";

interface PostCardProps {
  post: Post;
  onPin?: (id: string, isPinned: boolean) => void;
  onDelete?: (id: string) => void;
  showActions?: boolean;
}

export function PostCard({ post, onPin, onDelete, showActions = false }: PostCardProps) {
  return (
    <CommunityCard className="relative">
      <div className="flex items-start gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            {post.isPinned && (
              <Badge variant="default" size="sm" className="gap-1">
                <Pin className="w-3 h-3" />
                Pinned
              </Badge>
            )}
            <Badge variant="subtle" size="sm" className="capitalize">
              {post.section.toLowerCase()}
            </Badge>
          </div>
          <Link
            href={`/community/posts/${post.id}`}
            className="block mt-1 text-lg font-semibold text-foreground hover:text-primary transition-colors"
          >
            {post.title}
          </Link>
          <p className="text-sm text-muted-foreground line-clamp-2 mt-0.5">{post.content}</p>
          <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
            <span>by {post.author.name}</span>
            <span className="flex items-center gap-1">
              <ThumbsUp className="w-3.5 h-3.5" />
              {post.upvotes}
            </span>
            <span className="flex items-center gap-1">
              <MessageCircle className="w-3.5 h-3.5" />
              {post.comments.length}
            </span>
            <span>{new Date(post.createdAt).toLocaleDateString()}</span>
          </div>
        </div>
        {showActions && (
          <div className="flex flex-col gap-1.5 shrink-0">
            {onPin && (
              <button
                onClick={() => onPin(post.id, post.isPinned)}
                className="text-xs px-2 py-1 rounded-lg bg-muted hover:bg-accent transition-colors"
              >
                {post.isPinned ? "Unpin" : "Pin"}
              </button>
            )}
            {onDelete && (
              <button
                onClick={() => onDelete(post.id)}
                className="text-xs px-2 py-1 rounded-lg bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors"
              >
                Delete
              </button>
            )}
          </div>
        )}
      </div>
    </CommunityCard>
  );
}