"use client";
import { useEffect, useState } from "react";
import { getSessions, revokeSession, revokeAllSessions } from "@/lib/api/users.api";
import type { UserSession } from "@/types/users";

export default function SessionsPage() {
  const [sessions, setSessions] = useState<UserSession[]>([]);

  const refresh = () => getSessions().then(setSessions);
  useEffect(() => { refresh(); }, []);

  const handleRevoke = async (sessionId: string) => {
    await revokeSession(sessionId);
    refresh();
  };

  const handleRevokeAll = async () => {
    await revokeAllSessions();
    refresh();
  };

  return (
    <div>
      <div className="flex justify-between mb-4">
        <h1 className="text-2xl font-bold">Active Sessions</h1>
        <button onClick={handleRevokeAll} className="bg-destructive text-primary-foreground px-4 py-2 rounded">
          Revoke All
        </button>
      </div>
      {sessions.length === 0 ? <p>No active sessions.</p> : (
        <ul className="space-y-2">
          {sessions.map(s => (
            <li key={s.id} className="bg-card shadow rounded p-3 flex justify-between items-center">
              <div>
                <p className="font-medium">{s.deviceInfo || 'Unknown device'}</p>
                <p className="text-xs text-muted-foreground">Last active: {s.lastActiveAt ? new Date(s.lastActiveAt).toLocaleString() : 'N/A'}</p>
              </div>
              <button onClick={() => handleRevoke(s.id)} className="text-red-600">Revoke</button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}