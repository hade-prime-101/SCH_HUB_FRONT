import { useState } from "react";
import { shareSummary, askGroupQuestion, getQuizLeaderboard } from "@/lib/api/study-groups.api";
import type { QuizLeaderboardEntry } from "@/types/study-groups";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";

interface AITabProps {
  groupId: string;
}

export function AITab({ groupId }: AITabProps) {
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