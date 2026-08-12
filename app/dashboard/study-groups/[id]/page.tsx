// app/dashboard/study-groups/[id]/page.tsx
"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  getGroup,
  updateGroup,
  deleteGroup,
  joinGroup,
  leaveGroup,
  getMessages,
  sendMessage,
  listInvites,
  createInvite,
  revokeInvite,
  listChallenges,
  createChallenge,
  acceptChallenge,
  declineChallenge,
  shareSummary,
  askGroupQuestion,
  getQuizLeaderboard,
  listMembers,
  updateMemberRole,
  kickMember,
  getChallengeResult, 
} from "@/lib/api/study-groups.api";
import type { StudyGroup, GroupMessage, GroupInvite, Challenge, GroupMember, QuizLeaderboardEntry } from "@/types/study-groups";

// We'll use a simple tab interface.
export default function GroupDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [group, setGroup] = useState<StudyGroup | null>(null);
  const [messages, setMessages] = useState<GroupMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [invites, setInvites] = useState<GroupInvite[]>([]);
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [tab, setTab] = useState<"chat" | "members" | "invites" | "challenges" | "ai">("chat");
  const [leaderboard, setLeaderboard] = useState<QuizLeaderboardEntry[]>([]);
  const [leaderboardQuizId, setLeaderboardQuizId] = useState("");
  const [challengeResult, setChallengeResult] = useState<{ winnerId: string; score: number } | null>(null);
  const [selectedChallengeId, setSelectedChallengeId] = useState("");

  useEffect(() => {
    if (id) {
      getGroup(id).then(setGroup);
      getMessages(id).then(setMessages);
      listInvites(id).then(setInvites).catch(() => {});
      listChallenges(id).then(setChallenges).catch(() => {});
      listMembers(id).then(setMembers).catch(() => setMembers([]));
      // assume listMembers endpoint not provided; we can't fetch members directly.
      // We'll mock empty for now or use a placeholder.
    }
  }, [id]);

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;
    const msg = await sendMessage(id, { content: newMessage });
    setMessages(prev => [...prev, msg]);
    setNewMessage("");
  };

  const handleCreateInvite = async () => {
    const email = prompt("Email to invite?");
    if (!email) return;
    await createInvite(id, { email });
    listInvites(id).then(setInvites);
  };

  const handleRevokeInvite = async (inviteId: string) => {
    await revokeInvite(inviteId);
    listInvites(id).then(setInvites);
  };

  const handleCreateChallenge = async () => {
    const targetUserId = prompt("Target user ID?");
    const title = prompt("Challenge title?");
    if (!targetUserId || !title) return;
    await createChallenge(id, { targetUserId, title });
    listChallenges(id).then(setChallenges);
  };

  const handleAcceptChallenge = async (challengeId: string) => {
    await acceptChallenge(id, challengeId);
    listChallenges(id).then(setChallenges);
  };

  const handleDeclineChallenge = async (challengeId: string) => {
    await declineChallenge(id, challengeId);
    listChallenges(id).then(setChallenges);
  };

  const handleShareSummary = async () => {
    const summaryId = prompt("Summary ID to share?");
    if (!summaryId) return;
    await shareSummary(id, { summaryId });
    alert("Summary shared!");
  };

  const handleAskAI = async () => {
    const question = prompt("Ask a question to the group AI?");
    if (!question) return;
    await askGroupQuestion(id, { question });
    alert("Question sent to AI");
  };

  if (!group) return <p>Loading...</p>;

  return (
    <div>
      <div className="flex justify-between items-start mb-4">
        <div>
          <h1 className="text-2xl font-bold">{group.name}</h1>
          <p className="text-gray-600">{group.description}</p>
          <p className="text-xs text-gray-400">{group.memberCount} members</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => router.push(`/dashboard/study-groups/${id}/edit`)} className="bg-blue-600 text-white px-3 py-1 rounded">Edit</button>
          <button onClick={async () => { await deleteGroup(id); router.push('/dashboard/study-groups'); }} className="bg-red-600 text-white px-3 py-1 rounded">Delete</button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-4 border-b mb-4">
        {(["chat", "members", "invites", "challenges", "ai"] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-3 py-2 capitalize ${tab === t ? "border-b-2 border-blue-600 text-blue-600" : "text-gray-500"}`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Chat Tab */}
      {tab === "chat" && (
        <div>
          <div className="h-96 overflow-y-auto border p-3 mb-2">
            {messages.map((m, i) => (
              <div key={m.id} className="mb-2">
                <span className="font-medium">{m.senderName}:</span> {m.content}
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={newMessage}
              onChange={e => setNewMessage(e.target.value)}
              className="border p-2 flex-1"
              placeholder="Type a message..."
            />
            <button onClick={handleSendMessage} className="bg-blue-600 text-white px-4 py-2 rounded">Send</button>
          </div>
        </div>
      )}

      {tab === "members" && (
        <div>
          <h2 className="font-semibold mb-2">Members</h2>
          {members.length === 0 ? (
            <p className="text-gray-500">No members found (backend endpoint missing).</p>
          ) : (
            <ul className="space-y-2">
              {members.map((member) => (
                <li key={member.userId} className="flex justify-between items-center border p-2 rounded">
                  <div>
                    <p className="font-medium">{member.name}</p>
                    <p className="text-xs text-gray-500">{member.role}</p>
                  </div>
                  <div className="flex gap-2">
                    <select
                      value={member.role}
                      onChange={(e) => updateMemberRole(id, member.userId, e.target.value as any).then(() => listMembers(id).then(setMembers))}
                      className="border p-1 text-sm"
                    >
                      <option value="MEMBER">Member</option>
                      <option value="MODERATOR">Moderator</option>
                      <option value="ADMIN">Admin</option>
                    </select>
                    <button
                      onClick={() => kickMember(id, member.userId).then(() => listMembers(id).then(setMembers))}
                      className="text-red-600 text-sm"
                    >
                      Kick
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* Invites Tab */}
      {tab === "invites" && (
        <div>
          <div className="flex justify-between mb-2">
            <h2 className="font-semibold">Invites</h2>
            <button onClick={handleCreateInvite} className="bg-green-600 text-white px-3 py-1 rounded">New Invite</button>
          </div>
          {invites.map(inv => (
            <div key={inv.id} className="flex justify-between items-center border p-2 mb-1">
              <span>Token: {inv.token}</span>
              <button onClick={() => handleRevokeInvite(inv.id)} className="text-red-600 text-sm">Revoke</button>
            </div>
          ))}
        </div>
      )}

      {/* Challenges Tab */}
      {tab === "challenges" && (
        <div>
          <div className="flex justify-between mb-2">
            <h2 className="font-semibold">Challenges</h2>
            <button onClick={handleCreateChallenge} className="bg-green-600 text-white px-3 py-1 rounded">New Challenge</button>
          </div>
          {challenges.map(ch => (
            <div key={ch.id} className="border p-2 mb-1 flex justify-between items-center">
              <span>{ch.title} (Status: {ch.status})</span>
              {ch.status === 'PENDING' && (
                <div className="flex gap-2">
                  <button onClick={() => handleAcceptChallenge(ch.id)} className="text-green-600">Accept</button>
                  <button onClick={() => handleDeclineChallenge(ch.id)} className="text-red-600">Decline</button>
                </div>
              )}
              {ch.status === 'COMPLETED' && (
                <button
                    onClick={() => {
                    getChallengeResult(id, ch.id).then(setChallengeResult);
                    setSelectedChallengeId(ch.id);
                    }}
                    className="text-blue-600 text-sm ml-2"
                >
                    View Result
                </button>
              )}
              {challengeResult && selectedChallengeId === ch.id && (
                    <div className="mt-2 p-2 bg-gray-100 rounded">
                        <p>Winner: {challengeResult.winnerId} (Score: {challengeResult.score})</p>
                    </div>
                    )}
            </div>
          ))}
        </div>
      )}

      {/* AI Tab */}
     {tab === "ai" && (
  <div>
    <h2 className="font-semibold mb-2">AI Features</h2>
    <button onClick={handleShareSummary} className="bg-purple-600 text-white px-3 py-1 rounded mb-2">Share Summary</button>
    <button onClick={handleAskAI} className="bg-blue-600 text-white px-3 py-1 rounded mb-2">Ask Group AI</button>

    {/* Leaderboard */}
    <div className="mt-4">
      <h3 className="font-medium mb-1">Quiz Leaderboard</h3>
      <div className="flex gap-2 mb-2">
        <input
          type="text"
          placeholder="Quiz ID"
          value={leaderboardQuizId}
          onChange={(e) => setLeaderboardQuizId(e.target.value)}
          className="border p-1 flex-1"
        />
        <button
          onClick={() => getQuizLeaderboard(id, leaderboardQuizId).then(setLeaderboard)}
          className="bg-gray-200 px-3 py-1 rounded"
        >
          Load
        </button>
      </div>
      {leaderboard.length > 0 ? (
        <ul className="space-y-1">
          {leaderboard.map((entry, i) => (
            <li key={entry.userId} className="flex justify-between">
              <span>{i + 1}. {entry.name}</span>
              <span>{entry.score}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-gray-500">Enter a quiz ID to see results.</p>
      )}
    </div>
  </div>
)}
    </div>
  );
}