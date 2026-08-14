"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@/lib/hooks/useQuery";
import {
  getGroup,
  deleteGroup,
  getMessages,
  sendMessage,
  listMembers,
  updateMemberRole,
  kickMember,
  listInvites,
  createInvite,
  revokeInvite,
  listChallenges,
  createChallenge,
  acceptChallenge,
  declineChallenge,
  getChallengeResult,
  shareSummary,
  askGroupQuestion,
  getQuizLeaderboard,
} from "@/lib/api/study-groups.api";
import type { StudyGroup, GroupMessage, GroupMember, GroupInvite, Challenge, QuizLeaderboardEntry } from "@/types/study-groups";
import { PageHeader } from "@/components/shared/PageHeader";
import { LoadingState, EmptyState } from "@/components/shared/DashboardPrimitives";
import { ErrorState } from "@/components/shared/ErrorState";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MemberList } from "@/components/study-groups/MemberList";
import { InviteList } from "@/components/study-groups/InviteList";
import { ChallengeList } from "@/components/study-groups/ChallengeList";
import { AITab } from "@/components/study-groups/AITab";

export default function GroupDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  // ── Group data ─────────────────────────────────────────────
  const { data: group, loading: groupLoading, error: groupError, refetch: refetchGroup } = useQuery<StudyGroup>(
    () => getGroup(id),
    [id]
  );

  // ── Messages ───────────────────────────────────────────────
  const { data: messages, refetch: refetchMessages } = useQuery<GroupMessage[]>(
    () => getMessages(id),
    [id],
    { enabled: true }
  );
  const [newMessage, setNewMessage] = useState("");

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;
    await sendMessage(id, { content: newMessage });
    setNewMessage("");
    refetchMessages();
  };

  // ── Members ────────────────────────────────────────────────
  const { data: members, refetch: refetchMembers } = useQuery<GroupMember[]>(
    () => listMembers(id),
    [id],
    { enabled: true }
  );

  // ── Invites ────────────────────────────────────────────────
  const { data: invites, refetch: refetchInvites } = useQuery<GroupInvite[]>(
    () => listInvites(id),
    [id],
    { enabled: true }
  );

  // ── Challenges ─────────────────────────────────────────────
  const { data: challenges, refetch: refetchChallenges } = useQuery<Challenge[]>(
    () => listChallenges(id),
    [id],
    { enabled: true }
  );

  // ── Tab state ──────────────────────────────────────────────
  const [tab, setTab] = useState<"chat" | "members" | "invites" | "challenges" | "ai">("chat");

  // ── Mutations ──────────────────────────────────────────────
  const handleDeleteGroup = async () => {
    if (!confirm("Delete this group?")) return;
    await deleteGroup(id);
    router.push("/dashboard/study-groups");
  };

  // ── Loading / Error ────────────────────────────────────────
  if (groupLoading) return <LoadingState label="Loading group" />;
  if (groupError) return <ErrorState title="Failed to load group" description={groupError.message} onRetry={refetchGroup} />;
  if (!group) return null;

  return (
    <div>
      <PageHeader
        title={group.name}
        description={group.description}
        backHref="/dashboard/study-groups"
        actions={
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => router.push(`/dashboard/study-groups/${id}/edit`)}>
              Edit
            </Button>
            <Button variant="destructive" size="sm" onClick={handleDeleteGroup}>
              Delete
            </Button>
          </div>
        }
      />

      <div className="mt-4">
        <Badge variant="default">Members: {group.memberCount}</Badge>
        {group.isPrivate && <Badge variant="outline" className="ml-2">Private</Badge>}
      </div>

      <Tabs value={tab} onValueChange={(v) => setTab(v as any)} className="mt-4">
        <TabsList>
          <TabsTrigger value="chat">Chat</TabsTrigger>
          <TabsTrigger value="members">Members</TabsTrigger>
          <TabsTrigger value="invites">Invites</TabsTrigger>
          <TabsTrigger value="challenges">Challenges</TabsTrigger>
          <TabsTrigger value="ai">AI</TabsTrigger>
        </TabsList>

        <TabsContent value="chat" className="space-y-3">
          <div className="h-96 overflow-y-auto border border-border rounded-lg p-3 bg-card">
            {messages && messages.length > 0 ? (
              messages.map((msg) => (
                <div key={msg.id} className="mb-2">
                  <span className="font-semibold text-foreground">{msg.senderName}:</span>
                  <span className="ml-2 text-foreground">{msg.content}</span>
                </div>
              ))
            ) : (
              <EmptyState>No messages yet.</EmptyState>
            )}
          </div>
          <div className="flex gap-2">
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type a message..."
              onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
            />
            <Button onClick={handleSendMessage}>Send</Button>
          </div>
        </TabsContent>

        <TabsContent value="members">
          <MemberList groupId={id} members={members || []} onUpdate={refetchMembers} />
        </TabsContent>

        <TabsContent value="invites">
          <InviteList groupId={id} invites={invites || []} onUpdate={refetchInvites} />
        </TabsContent>

        <TabsContent value="challenges">
          <ChallengeList groupId={id} challenges={challenges || []} onUpdate={refetchChallenges} />
        </TabsContent>

        <TabsContent value="ai">
          <AITab groupId={id} />
        </TabsContent>
      </Tabs>
    </div>
  );
}