"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@/lib/hooks/useQuery";
import { usersApi } from "@/lib/api/users.api";
import { useAuth } from "@/lib/hooks/useAuth";
import { PageHeader } from "@/components/shared/PageHeader";
import { LoadingState, EmptyState } from "@/components/shared/DashboardPrimitives";
import { ErrorState } from "@/components/shared/ErrorState";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { Smartphone, Trash2, LogOut, Calendar, X, ShieldAlert, Loader2 } from "lucide-react";

interface Session {
  id: string;
  createdAt: string;
  expiresAt: string;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString([], {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function shortId(id: string) {
  return `…${id.slice(-8)}`;
}

export default function SessionsPage() {
  const router = useRouter();
  const { logout } = useAuth();
  const [revoking, setRevoking] = useState<string | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const {
    data: sessions,
    loading,
    error,
    refetch,
  } = useQuery<Session[]>(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    () => usersApi.getSessions().then((s: any) => (Array.isArray(s) ? (s as Session[]) : [])),
    []
  );

  const handleRevoke = async (sessionId: string) => {
    setRevoking(sessionId);
    try {
      await usersApi.revokeSession(sessionId);
      await refetch();
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (err) {
      alert("Failed to revoke session");
    } finally {
      setRevoking(null);
    }
  };

  const handleLogoutAll = async () => {
    setLoggingOut(true);
    try {
      await usersApi.revokeAllSessions();
      await logout();
      router.push("/login");
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (err) {
      alert("Failed to log out everywhere");
      setLoggingOut(false);
      setShowConfirm(false);
    }
  };

  if (loading) return <LoadingState label="Loading sessions" />;
  if (error) return <ErrorState title="Failed to load sessions" description={error.message} onRetry={refetch} />;

  return (
    <div className="max-w-lg mx-auto p-4 md:p-6">
      <PageHeader title="Active Sessions" backHref="/dashboard/profile" />

      {!sessions || sessions.length === 0 ? (
        <EmptyState>No active sessions found.</EmptyState>
      ) : (
        <>
          <p className="text-sm text-muted-foreground mt-4">
            {sessions.length} active session{sessions.length !== 1 ? "s" : ""}
          </p>
          <div className="space-y-2 mt-2">
            {sessions.map((session) => (
              <Card key={session.id} compact className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center shrink-0">
                  <Smartphone className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-mono text-sm font-semibold">{shortId(session.id)}</p>
                  <div className="flex items-center gap-1 mt-0.5">
                    <Calendar className="w-3 h-3 text-muted-foreground" />
                    <p className="text-xs text-muted-foreground">
                      Created {formatDate(session.createdAt)}
                    </p>
                  </div>
                  <p className="text-xs text-muted-foreground/70">
                    Expires {formatDate(session.expiresAt)}
                  </p>
                </div>
                <Button
                  variant="destructive"
                  size="icon-sm"
                  onClick={() => handleRevoke(session.id)}
                  disabled={revoking === session.id}
                  aria-label="Revoke session"
                >
                  {revoking === session.id ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Trash2 className="w-4 h-4" />
                  )}
                </Button>
              </Card>
            ))}
          </div>

          <div className="mt-6">
            <Button
              variant="destructive"
              className="w-full"
              onClick={() => setShowConfirm(true)}
            >
              <LogOut className="w-4 h-4 mr-2" />
              Log Out Everywhere
            </Button>
            <p className="text-xs text-muted-foreground text-center mt-2">
              This will revoke all active sessions, including this one.
            </p>
          </div>
        </>
      )}

      {/* Confirm modal */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <Card className="max-w-sm w-full p-6 text-center">
            <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-4">
              <ShieldAlert className="w-8 h-8 text-destructive" />
            </div>
            <h2 className="text-xl font-bold text-foreground">Log out everywhere?</h2>
            <p className="text-sm text-muted-foreground mt-2">
              All active sessions will be revoked. You&apos;ll need to log in again on all devices.
            </p>
            <div className="flex gap-3 mt-6">
              <Button variant="outline" className="flex-1" onClick={() => setShowConfirm(false)} disabled={loggingOut}>
                Cancel
              </Button>
              <Button variant="destructive" className="flex-1" onClick={handleLogoutAll} disabled={loggingOut}>
                {loggingOut ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Logging out…
                  </>
                ) : (
                  "Log Out All"
                )}
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}