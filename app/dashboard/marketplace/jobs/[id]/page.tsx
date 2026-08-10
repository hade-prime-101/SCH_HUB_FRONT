"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  Briefcase, MapPin, DollarSign, MessageCircle,
  User, Clock, Pencil, Loader2, AlertTriangle,
} from "lucide-react";
import { marketplaceApi } from "@/lib/api/marketplace";
import BackButton from "@/components/shared/BackButton";
import BottomNav from "@/components/shared/BottomNav";

type JobType = "INTERNSHIP" | "PART_TIME" | "CAMPUS_JOB" | "FREELANCE";

interface Job {
  id:           string;
  title:        string;
  description?: string;
  type:         JobType;
  location?:    string;
  pay?:         string;
  whatsapp?:    string;
  status?:      string;
  poster?:      { id: string; fullName: string };
  createdAt:    string;
}

const TYPE_BADGE: Record<JobType, string> = {
  INTERNSHIP: "bg-blue-100 text-blue-700",
  PART_TIME:  "bg-amber-100 text-amber-700",
  CAMPUS_JOB: "bg-emerald-100 text-emerald-700",
  FREELANCE:  "bg-violet-100 text-violet-700",
};

function timeAgo(iso: string) {
  const d = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
  if (d === 0) return "today";
  if (d === 1) return "yesterday";
  return `${d}d ago`;
}

export default function JobDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id     = params?.id as string;

  const [job,     setJob]     = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("auth_user");
      if (stored) setCurrentUserId(JSON.parse(stored)?.id ?? null);
    } catch {}
  }, []);

  useEffect(() => {
    if (!id) return;
    marketplaceApi.getJob(id)
      .then((j) => setJob(j as Job))
      .catch((e: any) => setError(e.message || "Failed to load job."))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return (
    <div className="min-h-screen bg-muted flex items-center justify-center">
      <Loader2 className="w-8 h-8 text-primary animate-spin" />
    </div>
  );

  if (error || !job) return (
    <div className="min-h-screen bg-muted flex flex-col items-center justify-center gap-4 px-6">
      <AlertTriangle className="w-12 h-12 text-destructive" />
      <p className="text-muted-foreground font-medium text-center">{error ?? "Job not found."}</p>
      <BackButton variant="text" label="Go back" />
    </div>
  );

  return (
    <div className="min-h-screen bg-muted pb-24">
      {/* Header */}
      <div className="bg-card px-4 pt-5 pb-4 flex items-center gap-3 border-b border-border">
        <BackButton />
        <h1 className="text-xl font-bold text-foreground flex-1 truncate">Job Details</h1>
        {currentUserId && job?.poster?.id === currentUserId && (
        <button
          onClick={() => router.push(`/dashboard/marketplace/jobs/${id}/edit`)}
          className="w-11 h-11 rounded-2xl bg-muted flex items-center justify-center shrink-0"
          aria-label="Edit job"
        >
          <Pencil className="w-4 h-4 text-foreground" />
        </button>
        )}
      </div>

      <div className="px-4 py-5 max-w-lg mx-auto flex flex-col gap-4">
        <div className="bg-card rounded-2xl shadow-sm px-5 py-5">
          {job.status && job.status !== "APPROVED" && (
            <span className={`inline-block text-xs font-bold px-2.5 py-1 rounded-lg mb-3 ${
              job.status === "PENDING" ? "bg-amber-100 text-amber-700" : "bg-destructive/10 text-destructive"
            }`}>
              {job.status}
            </span>
          )}

          <div className="flex items-start gap-3 mb-4">
            <div className="w-12 h-12 rounded-2xl bg-accent flex items-center justify-center shrink-0">
              <Briefcase className="w-6 h-6 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-xl font-bold text-foreground mb-1">{job.title}</h2>
              <span className={`inline-block text-xs font-bold px-2 py-0.5 rounded-lg ${TYPE_BADGE[job.type] ?? "bg-muted text-muted-foreground"}`}>
                {job.type.replace(/_/g, " ")}
              </span>
            </div>
          </div>

          <div className="flex flex-col gap-2 mb-4">
            {job.location && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin className="w-4 h-4 shrink-0" />
                <span>{job.location}</span>
              </div>
            )}
            {job.pay && (
              <div className="flex items-center gap-2 text-sm text-foreground">
                <DollarSign className="w-4 h-4 text-muted-foreground shrink-0" />
                <span className="font-semibold">{job.pay}</span>
              </div>
            )}
            {job.poster && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <User className="w-4 h-4 shrink-0" />
                <span>Posted by <span className="font-semibold text-foreground">{job.poster.fullName}</span></span>
              </div>
            )}
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="w-4 h-4 shrink-0" />
              <span>{timeAgo(job.createdAt)}</span>
            </div>
          </div>
        </div>

        {job.description && (
          <div className="bg-card rounded-2xl shadow-sm px-5 py-4">
            <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-2">Description</h3>
            <p className="text-foreground text-sm leading-relaxed">{job.description}</p>
          </div>
        )}

        {job.whatsapp && (
          <a
            href={`https://wa.me/${job.whatsapp.replace(/\D/g, "")}`}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full rounded-2xl bg-emerald-500 py-4 font-bold text-white flex items-center justify-center gap-2 active:opacity-90 transition"
          >
            <MessageCircle className="w-5 h-5" /> Apply via WhatsApp
          </a>
        )}

        <button
          onClick={() => router.push(`/dashboard/marketplace/jobs/${id}/edit`)}
          className="w-full rounded-2xl border border-border py-3.5 font-semibold text-foreground flex items-center justify-center gap-2 active:bg-muted transition"
        >
          <Pencil className="w-4 h-4" /> Edit Listing
        </button>
      </div>

      <BottomNav />
    </div>
  );
}
