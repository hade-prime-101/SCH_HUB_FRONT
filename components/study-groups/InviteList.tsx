import { createInvite, revokeInvite } from "@/lib/api/study-groups.api";
import type { GroupInvite } from "@/types/study-groups";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface InviteListProps {
  groupId: string;
  invites: GroupInvite[];
  onUpdate: () => void;
}

export function InviteList({ groupId, invites, onUpdate }: InviteListProps) {
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