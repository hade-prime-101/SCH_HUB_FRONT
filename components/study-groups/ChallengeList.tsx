import { useState } from "react";
import { createChallenge, acceptChallenge, declineChallenge, getChallengeResult } from "@/lib/api/study-groups.api";
import type { Challenge } from "@/types/study-groups";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface ChallengeListProps {
  groupId: string;
  challenges: Challenge[];
  onUpdate: () => void;
}

export function ChallengeList({ groupId, challenges, onUpdate }: ChallengeListProps) {
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