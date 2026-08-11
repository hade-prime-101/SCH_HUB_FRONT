"use client";
import { useEffect, useState } from "react";
import { listPendingAgents, reviewAgent } from "@/lib/api/marketplace.api";
import type { AgentProfile } from "@/types/marketplace";

export default function AdminAgentsPage() {
  const [agents, setAgents] = useState<AgentProfile[]>([]);

  useEffect(() => { listPendingAgents().then(setAgents); }, []);

  const handleReview = async (userId: string, decision: 'APPROVE' | 'REJECT') => {
    await reviewAgent(userId, { decision });
    setAgents(prev => prev.filter(a => a.userId !== userId));
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Agent Verification Requests</h1>
      {agents.map(agent => (
        <div key={agent.userId} className="bg-white shadow rounded p-4 mb-3 flex justify-between items-center">
          <div>
            <p className="font-medium">{agent.fullName}</p>
            <p className="text-sm text-gray-500">{agent.department} – Student ID: {agent.studentId}</p>
            <a href={agent.studentIdUrl} target="_blank" className="text-blue-500 text-sm">View ID</a>
          </div>
          <div className="flex gap-2">
            <button onClick={() => handleReview(agent.userId, 'APPROVE')} className="bg-green-600 text-white px-3 py-1 rounded">Approve</button>
            <button onClick={() => handleReview(agent.userId, 'REJECT')} className="bg-red-600 text-white px-3 py-1 rounded">Reject</button>
          </div>
        </div>
      ))}
    </div>
  );
}