"use client";
import { useEffect, useState } from "react";
import { listAllAgents, revokeAgent } from "@/lib/api/super-admin.api";
import type { Agent } from "@/types/super-admin";

export default function AgentsPage() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [status, setStatus] = useState("");

  useEffect(() => {
    listAllAgents(status).then(setAgents);
  }, [status]);

  const handleRevoke = async (userId: string) => {
    const note = prompt("Reason for revocation?");
    await revokeAgent(userId, note || undefined);
    listAllAgents(status).then(setAgents);
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Agents</h1>
      <div className="mb-4">
        <select value={status} onChange={e => setStatus(e.target.value)} className="border p-2">
          <option value="">All</option>
          <option value="PENDING">Pending</option>
          <option value="ACTIVE">Active</option>
          <option value="REVOKED">Revoked</option>
        </select>
      </div>
      <table className="w-full bg-card shadow rounded">
        <thead className="bg-muted">
          <tr>
            <th className="p-2 text-left">Name</th>
            <th className="p-2 text-left">Department</th>
            <th className="p-2 text-left">Status</th>
            <th className="p-2 text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {agents.map(agent => (
            <tr key={agent.userId} className="border-t">
              <td className="p-2">{agent.fullName}</td>
              <td className="p-2">{agent.department}</td>
              <td className="p-2">{agent.status}</td>
              <td className="p-2 text-right">
                {agent.status !== 'REVOKED' && (
                  <button onClick={() => handleRevoke(agent.userId)} className="text-red-600">Revoke</button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}