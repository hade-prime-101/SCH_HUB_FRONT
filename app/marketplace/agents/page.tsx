"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Building2,
  ShieldCheck,
  Clock,
  CheckCircle2,
  XCircle,
  Loader2,
  AlertTriangle,
  RefreshCw,
  Phone,
  MapPin,
  Image as ImageIcon,
} from "lucide-react";
import { marketplaceApi } from "@/lib/api/marketplace.api";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton";
import { ErrorMessage } from "@/components/ui/ErrorMessage";
import { Badge } from "@/components/ui/badge";

// ─── Types ────────────────────────────────────────────────────────────────────

type AgentStatus = "PENDING" | "APPROVED" | "REJECTED";

interface AgentProfile {
  id: string;
  status: AgentStatus;
  businessName: string;
  businessAddress: string;
  phoneNumber: string;
  studentIdUrl?: string;
  submittedAt?: string;
  reviewedAt?: string;
  rejectionReason?: string;
  note?: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<
  AgentStatus,
  { label: string; icon: React.ElementType; colour: string; bg: string; border: string }
> = {
  PENDING: {
    label: "Under Review",
    icon: Clock,
    colour: "text-warning",
    bg: "bg-warning/5",
    border: "border-warning/20",
  },
  APPROVED: {
    label: "Approved",
    icon: CheckCircle2,
    colour: "text-success",
    bg: "bg-success/5",
    border: "border-success/20",
  },
  REJECTED: {
    label: "Rejected",
    icon: XCircle,
    colour: "text-destructive",
    bg: "bg-destructive/5",
    border: "border-destructive/20",
  },
};

// ─── Status Card ──────────────────────────────────────────────────────────────

function StatusCard({ profile }: { profile: AgentProfile }) {
  const cfg = STATUS_CONFIG[profile.status];
  const Icon = cfg.icon;
  const rejectionNote = profile.rejectionReason ?? profile.note;

  return (
    <div className="flex flex-col gap-4">
      <Card className="p-5 border-l-4" style={{ borderLeftColor: `var(--${cfg.colour.replace("text-", "")})` }}>
        <div className="flex items-center gap-3 mb-2">
          <Icon className={`h-6 w-6 ${cfg.colour}`} />
          <p className="font-bold text-foreground text-lg">Application {cfg.label}</p>
        </div>
        {profile.status === "PENDING" && (
          <p className="text-sm text-muted-foreground">
            Your application is being reviewed. We'll notify you within 24–48 hours.
          </p>
        )}
        {profile.status === "APPROVED" && (
          <p className="text-sm text-success">
            Congratulations! You are now a verified house agent. Your listings will show the verified badge.
          </p>
        )}
        {profile.status === "REJECTED" && (
          <p className="text-sm text-destructive">
            Your application was not approved.
            {rejectionNote ? ` Reason: ${rejectionNote}` : ""}
          </p>
        )}
      </Card>

      <Card className="p-5 space-y-4">
        <h2 className="font-bold text-foreground">Your Application</h2>

        {[
          { icon: Building2, label: "Business Name", value: profile.businessName },
          { icon: MapPin, label: "Address", value: profile.businessAddress },
          { icon: Phone, label: "Phone", value: profile.phoneNumber },
        ].map(({ icon: ItemIcon, label, value }) => (
          <div key={label} className="flex items-start gap-3">
            <div className="h-9 w-9 rounded-xl bg-accent flex items-center justify-center shrink-0">
              <ItemIcon className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{label}</p>
              <p className="font-semibold text-foreground text-sm">{value}</p>
            </div>
          </div>
        ))}

        {profile.studentIdUrl && (
          <div className="flex items-start gap-3">
            <div className="h-9 w-9 rounded-xl bg-accent flex items-center justify-center shrink-0">
              <ImageIcon className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Student ID</p>
              <img
                src={profile.studentIdUrl}
                alt="Student ID"
                className="mt-1 h-20 w-32 rounded-lg border border-border object-cover"
              />
            </div>
          </div>
        )}

        {profile.status === "APPROVED" && (
          <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-success/10 border border-success/20">
            <ShieldCheck className="h-5 w-5 text-success shrink-0" />
            <p className="text-sm font-bold text-success">Verified Agent</p>
          </div>
        )}
      </Card>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AgentProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<AgentProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasProfile, setHasProfile] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await marketplaceApi.getMyAgentProfile();
      if ((data as any)?.id) {
        setProfile(data as unknown as AgentProfile);
        setHasProfile(true);
      } else {
        setHasProfile(false);
      }
    } catch (e: unknown) {
      const status = (e as any)?.status;
      const msg = e instanceof Error ? e.message : "";
      if (status === 404 || msg.includes("404") || msg.toLowerCase().includes("not found")) {
        setHasProfile(false);
      } else {
        setError("Couldn't load your agent profile. Check your connection and try again.");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return (
      <div className="space-y-4">
        <LoadingSkeleton height="h-32" />
        <LoadingSkeleton height="h-64" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center gap-4 py-12">
        <ErrorMessage message={error} />
        <Button onClick={load} variant="outline" className="gap-2">
          <RefreshCw className="h-4 w-4" /> Retry
        </Button>
      </div>
    );
  }

  if (!hasProfile) {
    // No profile – redirect to apply page
    router.push("/marketplace/agents/apply");
    return null;
  }

  if (!profile) {
    return <ErrorMessage message="Profile data is missing." />;
  }

  return (
    <div className="space-y-6">
      {/* Header with back button */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => router.back()}
          aria-label="Go back"
          className="h-11 w-11 rounded-2xl bg-card shadow-sm flex items-center justify-center shrink-0"
        >
          <ArrowLeft className="h-5 w-5 text-foreground" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-foreground">House Agent</h1>
          <p className="text-sm text-muted-foreground">Your agent application status</p>
        </div>
      </div>

      <StatusCard profile={profile} />
    </div>
  );
}