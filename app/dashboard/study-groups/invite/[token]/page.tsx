"use client";

import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@/lib/hooks/useQuery";
import { acceptInvite } from "@/lib/api/study-groups.api";
import { LoadingState, EmptyState } from "@/components/shared/DashboardPrimitives";
import { ErrorState } from "@/components/shared/ErrorState";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function InvitePage() {
  const { token } = useParams<{ token: string }>();
  const router = useRouter();

  const { data, loading, error, refetch } = useQuery<{ success: boolean }>(
    () => acceptInvite(token),
    [token],
    { skip: true } // we'll manually call it on button click
  );

  const handleAccept = async () => {
    try {
      const res = await acceptInvite(token);
      if (res.success) {
        // Redirect to the group page – we don't know the group ID, so go to groups list
        router.push("/dashboard/study-groups");
      } else {
        alert("Failed to accept invite");
      }
    } catch (err) {
      alert("Failed to accept invite");
    }
  };

  return (
    <div className="max-w-md mx-auto p-4 md:p-6 text-center">
      <Card className="p-6">
        <h1 className="text-2xl font-bold text-foreground">Group Invite</h1>
        <p className="text-muted-foreground mt-2">You've been invited to join a study group.</p>
        <div className="mt-6 flex gap-3 justify-center">
          <Button variant="outline" onClick={() => router.push("/dashboard/study-groups")}>
            Cancel
          </Button>
          <Button onClick={handleAccept}>Accept Invite</Button>
        </div>
      </Card>
    </div>
  );
}