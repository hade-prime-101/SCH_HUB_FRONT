"use client";

import { useState } from "react";
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
import { cn } from "@/lib/utils";

// ─── Tab Component (inline, no external dependency) ──────────────────────────

interface TabItem {
  value: string;
  label: string;
  content: React.ReactNode;
}

function Tabs({ tabs, defaultTab }: { tabs: TabItem[]; defaultTab?: string }) {
  const [activeTab, setActiveTab] = useState(defaultTab || tabs[0]?.value || "");

  return (
    <div>
      <div className="flex space-x-1 border-b border-border mb-4">
        {tabs.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setActiveTab(tab.value)}
            className={cn(
              "px-4 py-2 text-sm font-medium transition-colors rounded-t-lg",
              activeTab === tab.value
                ? "text-primary border-b-2 border-primary"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div>{tabs.find((t) => t.value === activeTab)?.content}</div>
    </div>
  );
}

// ─── Extracted Components (inline to avoid missing imports) ──────────────────

function MemberList({
  groupId,
  members,
  onUpdate,
}: {
  groupId: string;
  members: GroupMember[];
  onUpdate: () => void;
}) {
  const [updating, setUpdating] = useState<string | null>(null);

  const handleRoleChange = async (userId: string, role: "ADMIN" | "MODERATOR" | "MEMBER") => {
    setUpdating(userId);
    try {
      await updateMemberRole(groupId, userId, { role });
      onUpdate();
    } catch {
      alert("Failed to update role");
    } finally {
      setUpdating(null);
    }
  };

  const handleKick = async (userId: string) => {
    if (!confirm("Kick this member?")) return;
    try {
      await kickMember(groupId, userId);
      onUpdate();
    } catch {
      alert("Failed to kick member");
    }
  };

  if (members.length === 0) {
    return <p className="text-muted-foreground">No members found.</p>;
  }

  return (
    <div className="space-y-2">
      {members.map((member) => (
        <Card key={member.userId} compact className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <p className="font-medium text-foreground">{member.name}</p>
            <Badge variant="outline" size="sm">{member.role}</Badge>
          </div>
          <div className="flex gap-2">
            <select
              value={member.role}
              onChange={(e) => handleRoleChange(member.userId, e.target.value as any)}
              disabled={updating === member.userId}
              className="border border-border rounded-lg px-2 py-1 text-sm bg-background"
            >
              <option value="MEMBER">Member</option>
              <option value="MODERATOR">Moderator</option>
              <option value="ADMIN">Admin</option>
            </select>
            <Button variant="destructive" size="xs" onClick={() => handleKick(member.userId)}>
              Kick
            </Button>
          </div>
        </Card>
      ))}
    </div>
  );
}

function InviteList({
  groupId,
  invites,
  onUpdate,
}: {
  groupId: string;
  invites: GroupInvite[];
  onUpdate: () => void;
}) {
  const handleCreateInvite = async () => {
    const email = prompt("Enter email to invite:");
    if (!email) return;
    try {
      await createInvite(groupId, { email });
      onUpdate();
    } catch {
      alert("Failed to create invite");
    }
  };

  const handleRevoke = async (inviteId: string) => {
    if (!confirm("Revoke this invite?")) return;
    try {
      await revokeInvite(inviteId);
      onUpdate();
    } catch {
      alert("Failed to revoke invite");
    }
  };

  if (invites.length === 0) {
    return (
      <div className="text-center py-4">
        <p className="text-muted-foreground">No invites.</p>
        <Button variant="outline" size="sm" className="mt-2" onClick={handleCreateInvite}>
          Create Invite
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {invites.map((invite) => (
        <Card key={invite.id} compact className="flex justify-between items-center">
          <span className="font-mono text-sm">Token: {invite.token}</span>
          <Button variant="destructive" size="xs" onClick={() => handleRevoke(invite.id)}>
            Revoke
          </Button>
        </Card>
      ))}
      <Button variant="outline" size="sm" className="mt-2" onClick={handleCreateInvite}>
        New Invite
      </Button>
    </div>
  );
}

function ChallengeList({
  groupId,
  challenges,
  onUpdate,
}: {
  groupId: string;
  challenges: Challenge[];
  onUpdate: () => void;
}) {
  const [viewingResult, setViewingResult] = useState<string | null>(null);
  const [result, setResult] = useState<{ winnerId: string; score: number } | null>(null);

  const handleCreate = async () => {
    const targetUserId = prompt("Target user ID:");
    const title = prompt("Challenge title:");
    if (!targetUserId || !title) return;
    try {
      await createChallenge(groupId, { targetUserId, title });
      onUpdate();
    } catch {
      alert("Failed to create challenge");
    }
  };

  const handleAccept = async (challengeId: string) => {
    try {
      await acceptChallenge(groupId, challengeId);
      onUpdate();
    } catch {
      alert("Failed to accept");
    }
  };

  const handleDecline = async (challengeId: string) => {
    try {
      await declineChallenge(groupId, challengeId);
      onUpdate();
    } catch {
      alert("Failed to decline");
    }
  };

  const handleViewResult = async (challengeId: string) => {
    try {
      const res = await getChallengeResult(groupId, challengeId);
      setResult(res);
      setViewingResult(challengeId);
    } catch {
      alert("Failed to load result");
    }
  };

  if (challenges.length === 0) {
    return (
      <div className="text-center py-4">
        <p className="text-muted-foreground">No challenges.</p>
        <Button variant="outline" size="sm" className="mt-2" onClick={handleCreate}>
          New Challenge
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {challenges.map((ch) => (
        <Card key={ch.id} compact className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <p className="font-medium">{ch.title}</p>
            <p className="text-sm text-muted-foreground">Status: {ch.status}</p>
          </div>
          <div className="flex gap-2">
            {ch.status === "PENDING" && (
              <>
                <Button size="xs" variant="default" onClick={() => handleAccept(ch.id)}>Accept</Button>
                <Button size="xs" variant="outline" onClick={() => handleDecline(ch.id)}>Decline</Button>
              </>
            )}
            {ch.status === "COMPLETED" && (
              <Button size="xs" variant="outline" onClick={() => handleViewResult(ch.id)}>
                View Result
              </Button>
            )}
          </div>
          {viewingResult === ch.id && result && (
            <div className="w-full text-sm bg-muted p-2 rounded">
              Winner: {result.winnerId} (Score: {result.score})
            </div>
          )}
        </Card>
      ))}
      <Button variant="outline" size="sm" className="mt-2" onClick={handleCreate}>
        New Challenge
      </Button>
    </div>
  );
}

function AITab({ groupId }: { groupId: string }) {
  const [quizId, setQuizId] = useState("");
  const [leaderboard, setLeaderboard] = useState<QuizLeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(false);

  const handleShareSummary = async () => {
    const summaryId = prompt("Summary ID:");
    if (!summaryId) return;
    try {
      await shareSummary(groupId, { summaryId });
      alert("Summary shared!");
    } catch {
      alert("Failed to share summary");
    }
  };

  const handleAskAI = async () => {
    const question = prompt("Ask a question:");
    if (!question) return;
    try {
      await askGroupQuestion(groupId, { question });
      alert("Question sent to AI");
    } catch {
      alert("Failed to ask AI");
    }
  };

  const handleLoadLeaderboard = async () => {
    if (!quizId) return;
    setLoading(true);
    try {
      const data = await getQuizLeaderboard(groupId, quizId);
      setLeaderboard(data);
    } catch {
      alert("Failed to load leaderboard");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Button variant="outline" onClick={handleShareSummary}>Share Summary</Button>
        <Button variant="default" onClick={handleAskAI}>Ask AI</Button>
      </div>

      <Card className="p-4">
        <h3 className="font-semibold mb-2">Quiz Leaderboard</h3>
        <div className="flex gap-2 mb-2">
          <Input
            placeholder="Quiz ID"
            value={quizId}
            onChange={(e) => setQuizId(e.target.value)}
          />
          <Button onClick={handleLoadLeaderboard} disabled={loading}>
            {loading ? "Loading..." : "Load"}
          </Button>
        </div>
        {leaderboard.length > 0 ? (
          <ul className="space-y-1">
            {leaderboard.map((entry, i) => (
              <li key={entry.userId} className="flex justify-between text-sm">
                <span>{i + 1}. {entry.name}</span>
                <span>{entry.score}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">Enter a quiz ID to see results.</p>
        )}
      </Card>
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

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
    [id]
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
    [id]
  );

  // ── Invites ────────────────────────────────────────────────
  const { data: invites, refetch: refetchInvites } = useQuery<GroupInvite[]>(
    () => listInvites(id),
    [id]
  );

  // ── Challenges ─────────────────────────────────────────────
  const { data: challenges, refetch: refetchChallenges } = useQuery<Challenge[]>(
    () => listChallenges(id),
    [id]
  );

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

  // ── Tab definitions ────────────────────────────────────────
  const tabs: { value: string; label: string; content: React.ReactNode }[] = [
    {
      value: "chat",
      label: "Chat",
      content: (
        <div className="space-y-3">
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
        </div>
      ),
    },
    {
      value: "members",
      label: "Members",
      content: <MemberList groupId={id} members={members || []} onUpdate={refetchMembers} />,
    },
    {
      value: "invites",
      label: "Invites",
      content: <InviteList groupId={id} invites={invites || []} onUpdate={refetchInvites} />,
    },
    {
      value: "challenges",
      label: "Challenges",
      content: <ChallengeList groupId={id} challenges={challenges || []} onUpdate={refetchChallenges} />,
    },
    {
      value: "ai",
      label: "AI",
      content: <AITab groupId={id} />,
    },
  ];

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

      <div className="mt-6">
        <Tabs tabs={tabs} defaultTab="chat" />
      </div>
    </div>
  );
}