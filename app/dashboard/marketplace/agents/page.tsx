"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft, Building2, ShieldCheck, Clock, CheckCircle2, XCircle,
  Loader2, AlertTriangle, RefreshCw, Phone, MapPin, Upload, X, Image as ImageIcon,
} from "lucide-react";
import { marketplaceApi } from "@/lib/api/marketplace";

// ─── Types ────────────────────────────────────────────────────────────────────

type AgentStatus = "PENDING" | "APPROVED" | "REJECTED";

interface AgentProfile {
  id:              string;
  status:          AgentStatus;
  businessName:    string;
  businessAddress: string;
  phoneNumber:     string;
  studentIdUrl?:   string;
  submittedAt?:    string;
  reviewedAt?:     string;
  rejectionReason?: string;
  note?:           string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const INPUT = "w-full rounded-xl border border-border bg-muted px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring text-sm";

const STATUS_CONFIG: Record<AgentStatus, { label: string; icon: React.ElementType; colour: string; bg: string; border: string }> = {
  PENDING:  { label: "Under Review",  icon: Clock,        colour: "text-amber-600",      bg: "bg-amber-50",       border: "border-amber-200" },
  APPROVED: { label: "Approved",      icon: CheckCircle2, colour: "text-emerald-600",    bg: "bg-emerald-50",     border: "border-emerald-200" },
  REJECTED: { label: "Rejected",      icon: XCircle,      colour: "text-destructive",    bg: "bg-destructive/5",  border: "border-destructive/20" },
};

function Field({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-semibold text-foreground">{label}</label>
      {children}
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

// ─── Apply Form ───────────────────────────────────────────────────────────────

function ApplyForm({ onSuccess }: { onSuccess: (p: AgentProfile) => void }) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    businessName: "", businessAddress: "", phoneNumber: "",
  });
  const [idFile, setIdFile]         = useState<File | null>(null);
  const [idPreview, setIdPreview]   = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError]           = useState<string | null>(null);

  function setF(k: keyof typeof form, v: string) {
    setForm(p => ({ ...p, [k]: v }));
    setError(null);
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Please select an image file (JPG, PNG, etc.).");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("File must be under 5 MB.");
      return;
    }
    setIdFile(file);
    setIdPreview(URL.createObjectURL(file));
    setError(null);
  }

  function removeFile() {
    setIdFile(null);
    setIdPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function handleSubmit() {
    if (!form.businessName.trim())    { setError("Business name is required."); return; }
    if (!form.businessAddress.trim()) { setError("Business address is required."); return; }
    if (!form.phoneNumber.trim())     { setError("Phone number is required."); return; }
    if (!idFile)                      { setError("Please upload a photo of your student ID card."); return; }

    setSubmitting(true); setError(null);
    try {
      const data = await marketplaceApi.applyAsAgent({
        businessName:    form.businessName.trim(),
        businessAddress: form.businessAddress.trim(),
        phoneNumber:     form.phoneNumber.trim(),
        studentIdFile:   idFile,
      });
      onSuccess(data as AgentProfile);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Application failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex flex-col gap-5">

      {/* Benefits card */}
      <div className="bg-primary rounded-2xl p-5">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl bg-primary-foreground/20 flex items-center justify-center shrink-0">
            <Building2 className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <p className="font-bold text-primary-foreground">Become a House Agent</p>
            <p className="text-primary-foreground/70 text-sm">List verified properties for students</p>
          </div>
        </div>
        <div className="flex flex-col gap-2">
          {[
            "List unlimited accommodation",
            "Verified agent badge on listings",
            "Reach thousands of students",
          ].map(b => (
            <div key={b} className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-primary-foreground/80 shrink-0" />
              <p className="text-primary-foreground/80 text-sm">{b}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Form */}
      <div className="bg-card rounded-2xl p-5 flex flex-col gap-4">
        <h2 className="font-bold text-foreground text-lg">Application Details</h2>

        {error && (
          <div className="flex items-center gap-2 bg-destructive/10 rounded-xl px-3 py-2 text-destructive text-sm">
            <AlertTriangle className="w-3.5 h-3.5 shrink-0" /> {error}
          </div>
        )}

        <Field label="Business Name *">
          <input
            value={form.businessName}
            onChange={e => setF("businessName", e.target.value)}
            placeholder="e.g. Bright Properties"
            className={INPUT}
          />
        </Field>

        <Field label="Business Address *">
          <input
            value={form.businessAddress}
            onChange={e => setF("businessAddress", e.target.value)}
            placeholder="e.g. No. 5 Main Street, Sabo"
            className={INPUT}
          />
        </Field>

        <Field label="Phone Number *">
          <input
            value={form.phoneNumber}
            onChange={e => setF("phoneNumber", e.target.value)}
            placeholder="+234..."
            inputMode="tel"
            className={INPUT}
          />
        </Field>

        {/* Student ID photo upload */}
        <Field
          label="Student ID Card Photo *"
          hint="Upload a clear photo of your school-issued student ID card"
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
          />

          {idPreview ? (
            <div className="relative rounded-xl overflow-hidden border border-border">
              <img src={idPreview} alt="Student ID preview" className="w-full h-48 object-cover" />
              <button
                type="button"
                onClick={removeFile}
                aria-label="Remove image"
                className="absolute top-2 right-2 w-8 h-8 rounded-full bg-card shadow-md flex items-center justify-center"
              >
                <X className="w-4 h-4 text-foreground" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex flex-col items-center justify-center gap-2 w-full h-36 rounded-xl border-2 border-dashed border-border text-muted-foreground hover:border-primary hover:text-primary transition-colors"
            >
              <Upload className="w-7 h-7" />
              <span className="text-sm font-medium">Tap to upload photo</span>
              <span className="text-xs">JPG, PNG — max 5 MB</span>
            </button>
          )}
        </Field>

        <button
          onClick={handleSubmit}
          disabled={submitting}
          className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground font-bold rounded-2xl py-4 mt-2 shadow-lg shadow-primary/20 disabled:opacity-50"
        >
          {submitting
            ? <Loader2 className="w-5 h-5 animate-spin" />
            : <ShieldCheck className="w-5 h-5" />}
          {submitting ? "Submitting…" : "Submit Application"}
        </button>
      </div>
    </div>
  );
}

// ─── Status Card ──────────────────────────────────────────────────────────────

function StatusCard({ profile }: { profile: AgentProfile }) {
  const cfg  = STATUS_CONFIG[profile.status];
  const Icon = cfg.icon;
  const rejectionNote = profile.rejectionReason ?? profile.note;

  return (
    <div className="flex flex-col gap-4">

      {/* Status banner */}
      <div className={`rounded-2xl p-5 border ${cfg.bg} ${cfg.border}`}>
        <div className="flex items-center gap-3 mb-2">
          <Icon className={`w-6 h-6 ${cfg.colour}`} />
          <p className="font-bold text-foreground text-lg">Application {cfg.label}</p>
        </div>
        {profile.status === "PENDING" && (
          <p className="text-sm text-muted-foreground">
            Your application is being reviewed. We'll notify you within 24–48 hours.
          </p>
        )}
        {profile.status === "APPROVED" && (
          <p className="text-sm text-emerald-700">
            Congratulations! You are now a verified house agent. Your listings will show the verified badge.
          </p>
        )}
        {profile.status === "REJECTED" && (
          <p className="text-sm text-destructive">
            Your application was not approved.{rejectionNote ? ` Reason: ${rejectionNote}` : ""}
          </p>
        )}
      </div>

      {/* Profile details */}
      <div className="bg-card rounded-2xl p-5 flex flex-col gap-4">
        <h2 className="font-bold text-foreground">Your Application</h2>

        {[
          { icon: Building2, label: "Business Name",    value: profile.businessName },
          { icon: MapPin,    label: "Address",           value: profile.businessAddress },
          { icon: Phone,     label: "Phone",             value: profile.phoneNumber },
        ].map(({ icon: ItemIcon, label, value }) => (
          <div key={label} className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-accent flex items-center justify-center shrink-0">
              <ItemIcon className="w-4 h-4 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{label}</p>
              <p className="font-semibold text-foreground text-sm">{value}</p>
            </div>
          </div>
        ))}

        {/* Show submitted ID thumbnail if available */}
        {profile.studentIdUrl && (
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-accent flex items-center justify-center shrink-0">
              <ImageIcon className="w-4 h-4 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Student ID</p>
              <img
                src={profile.studentIdUrl}
                alt="Student ID"
                className="mt-1 w-32 h-20 object-cover rounded-lg border border-border"
              />
            </div>
          </div>
        )}

        {profile.status === "APPROVED" && (
          <div className="flex items-center gap-2 mt-1 px-4 py-3 rounded-xl bg-emerald-50 border border-emerald-200">
            <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
            <p className="text-sm font-bold text-emerald-700">Verified Agent</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AgentProfilePage() {
  const router = useRouter();

  const [profile, setProfile]     = useState<AgentProfile | null>(null);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState<string | null>(null);
  const [hasProfile, setHasProfile] = useState(false);

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const data = await marketplaceApi.getMyAgentProfile();
      if (data?.id) {
        setProfile(data as AgentProfile);
        setHasProfile(true);
      } else {
        // API returned something but no id — treat as no profile
        setHasProfile(false);
      }
    } catch (e: unknown) {
      const status = (e as any)?.status;
      const msg    = e instanceof Error ? e.message : "";
      // 404 means user has no profile yet — show the apply form, not an error
      if (status === 404 || msg.includes("404") || msg.toLowerCase().includes("not found")) {
        setHasProfile(false);
      } else {
        // Genuine network/server error
        setError("Couldn't load your agent profile. Check your connection and try again.");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="min-h-screen w-full bg-muted px-6 py-6 pb-10">

      {/* ── Header ── */}
      <div className="flex items-start gap-4 mb-6">
        <button
          onClick={() => router.back()}
          aria-label="Go back"
          className="w-11 h-11 rounded-2xl bg-card shadow-sm flex items-center justify-center shrink-0"
        >
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-foreground">House Agent</h1>
          <p className="text-muted-foreground text-sm">
            {hasProfile ? "Your agent application status" : "Apply to list properties"}
          </p>
        </div>
      </div>

      {/* ── Error (genuine errors only, not 404) ── */}
      {error && (
        <div className="flex items-center gap-3 bg-destructive/10 rounded-2xl px-4 py-3 mb-4">
          <AlertTriangle className="w-4 h-4 text-destructive shrink-0" />
          <p className="text-sm text-destructive flex-1">{error}</p>
          <button onClick={load} aria-label="Retry">
            <RefreshCw className="w-4 h-4 text-destructive" />
          </button>
        </div>
      )}

      {/* ── Loading ── */}
      {loading && (
        <div className="flex justify-center py-20">
          <Loader2 className="w-7 h-7 text-primary animate-spin" />
        </div>
      )}

      {/* ── No profile → Apply form ── */}
      {!loading && !error && !hasProfile && (
        <ApplyForm
          onSuccess={p => {
            setProfile(p);
            setHasProfile(true);
          }}
        />
      )}

      {/* ── Has profile → Status card ── */}
      {!loading && !error && hasProfile && profile && (
        <StatusCard profile={profile} />
      )}
    </div>
  );
}
