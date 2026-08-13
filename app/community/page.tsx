"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { MessageSquare, HelpCircle, Users, BookOpen, Plus, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CommunityCard } from "@/components/community/CommunityCard";
import { CommunityEmptyState } from "@/components/community/CommunityEmptyState";
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton";
import { ErrorMessage } from "@/components/ui/ErrorMessage";
import { listPosts, listQuestions } from "@/lib/api/community.api";
import type { Post, Question } from "@/types/community";

const QUICK_ACTIONS = [
  {
    title: "Posts",
    description: "Share updates, announcements, and engage with your community",
    icon: MessageSquare,
    href: "/community/posts",
    color: "bg-primary/10 text-primary",
  },
  {
    title: "Questions & Answers",
    description: "Ask questions and help others learn",
    icon: HelpCircle,
    href: "/community/questions",
    color: "bg-primary/10 text-primary",
  },
  {
    title: "Mentors",
    description: "Find mentors or become one for your courses",
    icon: Users,
    href: "/community/mentors",
    color: "bg-success/10 text-success",
  },
  {
    title: "FAQ",
    description: "Frequently asked questions from your community",
    icon: BookOpen,
    href: "/community/faq",
    color: "bg-warning/10 text-warning",
  },
];

export default function CommunityHome() {
  const [recentPosts, setRecentPosts] = useState<Post[]>([]);
  const [recentQuestions, setRecentQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [postsRes, questionsRes] = await Promise.all([
          listPosts({ page: 1, limit: 3 }),
          listQuestions({ page: 1, limit: 3 }),
        ]);
        setRecentPosts(postsRes.data);
        setRecentQuestions(questionsRes.data);
      } catch (err: any) {
        setError(err.message || "Failed to load community activity");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (error) {
    return <ErrorMessage message={error} />;
  }

  return (
    <div className="pb-24 space-y-8">
      {/* Hero Section */}
      <div className="bg-card rounded-2xl p-6 border border-border shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Community Hub</h1>
            <p className="text-sm text-muted-foreground">
              Connect, learn, and grow with your fellow students
            </p>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-3">
          <Button asChild>
            <Link href="/community/posts/new">
              <Plus className="w-4 h-4 mr-1.5" />
              Create Post
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/community/questions/new">
              <HelpCircle className="w-4 h-4 mr-1.5" />
              Ask Question
            </Link>
          </Button>
        </div>
      </div>

      {/* Quick Actions Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {QUICK_ACTIONS.map(({ title, description, icon: Icon, href, color }) => (
          <Link
            key={href}
            href={href}
            className="block bg-card rounded-2xl p-5 border border-border shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5 active:scale-95"
          >
            <div className={`w-11 h-11 rounded-xl ${color} flex items-center justify-center mb-3`}>
              <Icon className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-foreground text-sm">{title}</h3>
            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{description}</p>
          </Link>
        ))}
      </div>

      {/* Recent Activity */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground">Recent Activity</h2>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/community/posts">View all</Link>
          </Button>
        </div>

        {loading ? (
          <LoadingSkeleton count={2} height="h-24" />
        ) : (
          <>
            {recentPosts.length === 0 && recentQuestions.length === 0 && (
              <CommunityEmptyState
                icon={<MessageSquare className="w-8 h-8" />}
                title="No activity yet"
                description="Be the first to start a discussion or ask a question!"
                action={
                  <Button asChild>
                    <Link href="/community/posts/new">Create Post</Link>
                  </Button>
                }
              />
            )}

            {recentPosts.map((post) => (
              <CommunityCard key={post.id}>
                <div>
                  <Link
                    href={`/community/posts/${post.id}`}
                    className="font-medium text-foreground hover:text-primary transition-colors"
                  >
                    {post.title}
                  </Link>
                  <p className="text-sm text-muted-foreground line-clamp-1 mt-0.5">
                    {post.content}
                  </p>
                  <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                    <span>{post.author.name}</span>
                    <span>{post.upvotes} upvotes</span>
                    <span>{post.comments.length} comments</span>
                  </div>
                </div>
              </CommunityCard>
            ))}

            {recentQuestions.map((q) => (
              <CommunityCard key={q.id}>
                <div>
                  <Link
                    href={`/community/questions/${q.id}`}
                    className="font-medium text-foreground hover:text-primary transition-colors"
                  >
                    {q.title}
                  </Link>
                  <p className="text-sm text-muted-foreground line-clamp-1 mt-0.5">
                    {q.content}
                  </p>
                  <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                    <span>{q.author.name}</span>
                    <span>{q.upvotes} upvotes</span>
                    <span>{q.answers.length} answers</span>
                  </div>
                </div>
              </CommunityCard>
            ))}
          </>
        )}
      </div>
    </div>
  );
}