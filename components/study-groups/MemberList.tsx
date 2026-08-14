import { useState } from "react";
import { updateMemberRole, kickMember } from "@/lib/api/study-groups.api";
import type { GroupMember } from "@/types/study-groups";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface MemberListProps {
  groupId: string;
  members: GroupMember[];
  onUpdate: () => void;
}

export function MemberList({ groupId, members, onUpdate }: MemberListProps) {
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
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
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