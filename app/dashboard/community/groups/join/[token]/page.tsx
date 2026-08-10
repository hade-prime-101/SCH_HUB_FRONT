"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import {
  Users,
  CheckCircle2,
  XCircle,
  Loader2,
} from "lucide-react";
import { communityApi } from "@/lib/api/community";
import BackButton from "@/components/shared/BackButton";

// ─── Types ────────────────────────────────────────────────────────────────────

type JoinState = "loading" | "success" | "already_member" | "error";

interface JoinResult {
  group?: { id: string; name: string };
  message?: string;
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function JoinGroupPage() {
  const router = useRouter();
  const params = useParams();
  const token  = params?.token as string;

  const [state,   setState]   = useState<JoinState>("loading");
  const [result,  setResult]  = useState<JoinResult | null>(null);
  const [errMsg,  setErrMsg]  = useState<string>("Something went wrong. The invite may have expired.");
  const [joining, setJoining] = useState(false);

  async function attemptJoin() {
    setState("loading");
    setJoining(true);
    try {
      const res = await communityApi.joinGroupByToken(token) as any;
      setResult({ group: res?.group ?? res?.data?.group });
      setState("success");
    } catch (e: any) {
      const msg: string = e.message ?? "";
      if (e.status === 409 || msg.toLowerCase().includes("already")) {
        setState("already_member");
      } else {
        setErrMsg(msg || "The invite link may be invalid or expired.");
        setState("error");
      }
    } finally {
      setJoining(false);
    }
  }

  useEffect(() => {
    if (!token) {
      setErrMsg("Invalid invite link.");
      setState("error");
      return;
    }
    attemptJoin();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  return (
    <div className="min-h-screen bg-muted flex flex-col">
      {/* Back button */}
      <div className="px-4 pt-5">
        <BackButton href="/dashboard/community" />
      </div>

      {/* Card */}
      <div className="flex-1 flex items-center justify-center px-6 py-10">
        <div className="w-full max-w-sm bg-card rounded-3xl shadow-sm border border-border px-6 py-10 flex flex-col items-center text-center gap-5">

          {/* ── Loading ── */}
          {state === "loading" && (
            <>
              <div className="w-20 h-20 rounded-full bg-accent flex items-center justify-center">
                <Loader2 className="w-9 h-9 text-primary animate-spin" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">Joining group…</h1>
                <p className="text-muted-foreground text-sm mt-1">Please wait a moment.</p>
              </div>
            </>
          )}

          {/* ── Success ── */}
          {state === "success" && (
            <>
              <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center">
                <CheckCircle2 className="w-10 h-10 text-emerald-500" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">You&apos;ve joined the group!</h1>
                {result?.group?.name && (
                  <p className="text-muted-foreground text-sm mt-1">{result.group.name}</p>
                )}
              </div>
              <div className="flex flex-col gap-2 w-full">
                {result?.group?.id && (
                  <Link
                    href={`/dashboard/community/groups/${result.group.id}`}
                    className="w-full rounded-2xl bg-primary py-4 font-bold text-primary-foreground flex items-center justify-center gap-2 active:opacity-90 transition"
                  >
                    <Users className="w-5 h-5" /> Go to Group
                  </Link>
                )}
                <Link
                  href="/dashboard/community"
                  className="w-full rounded-2xl border border-border py-3.5 font-semibold text-foreground flex items-center justify-center active:bg-muted transition"
                >
                  Go to Community
                </Link>
              </div>
            </>
          )}

          {/* ── Already a member ── */}
          {state === "already_member" && (
            <>
              <div className="w-20 h-20 rounded-full bg-accent flex items-center justify-center">
                <Users className="w-10 h-10 text-primary" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">You&apos;re already in this group</h1>
                <p className="text-muted-foreground text-sm mt-1">No need to join again.</p>
              </div>
              <Link
                href="/dashboard/community/groups"
                className="w-full rounded-2xl bg-primary py-4 font-bold text-primary-foreground flex items-center justify-center gap-2 active:opacity-90 transition"
              >
                View My Groups
              </Link>
            </>
          )}

          {/* ── Error ── */}
          {state === "error" && (
            <>
              <div className="w-20 h-20 rounded-full bg-destructive/10 flex items-center justify-center">
                <XCircle className="w-10 h-10 text-destructive" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">Could not join group</h1>
                <p className="text-muted-foreground text-sm mt-1">{errMsg}</p>
              </div>
              <div className="flex flex-col gap-2 w-full">
                <button
                  onClick={attemptJoin}
                  disabled={joining}
                  className="w-full rounded-2xl bg-primary py-4 font-bold text-primary-foreground flex items-center justify-center gap-2 disabled:opacity-50 active:opacity-90 transition"
                >
                  {joining && <Loader2 className="w-5 h-5 animate-spin" />}
                  Try Again
                </button>
                <Link
                  href="/dashboard/community"
                  className="w-full rounded-2xl border border-border py-3.5 font-semibold text-foreground flex items-center justify-center active:bg-muted transition"
                >
                  Go to Community
                </Link>
              </div>
            </>
          )}

        </div>
      </div>
    </div>
  );
}
