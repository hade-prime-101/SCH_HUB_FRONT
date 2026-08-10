"use client";

import { useState, useEffect, useCallback } from "react";
import BottomNav from "@/components/shared/BottomNav";
import { useRouter } from "next/navigation";
import {
  ArrowLeft, Search, Plus, X, Loader2, AlertTriangle, RefreshCw,
  Briefcase, MapPin, Calendar, MessageCircle, Phone,
} from "lucide-react";
import { marketplaceApi } from "@/lib/api/marketplace";

// ─── Types ────────────────────────────────────────────────────────────────────

type JobType = "INTERNSHIP" | "PART_TIME" | "CAMPUS_JOB" | "FREELANCE";

interface Job {
  id:           string;
  title:        string;
  description?: string;
  type:         JobType;
  pay?:         string;
  location:     string;
  whatsapp:     string;
  approvalStatus: string;
  createdAt:    string;
  postedBy?: { id: string; fullName: string };
}

interface JobForm {
  title:       string;
  description: string;
  type:        JobType | "";
  pay:         string;
  location:    string;
  whatsapp:    string;
}

const EMPTY_FORM: JobForm = {
  title: "", description: "", type: "", pay: "", location: "", whatsapp: "",
};

// ─── Constants ────────────────────────────────────────────────────────────────

const JOB_TYPES: { value: JobType; label: string }[] = [
  { value: "INTERNSHIP", label: "Internship" },
  { value: "PART_TIME",  label: "Part-time" },
  { value: "CAMPUS_JOB", label: "Campus Job" },
  { value: "FREELANCE",  label: "Freelance" },
];

const TYPE_BADGE: Record<JobType, string> = {
  INTERNSHIP: "bg-blue-100 text-blue-700",
  PART_TIME:  "bg-amber-100 text-amber-700",
  CAMPUS_JOB: "bg-emerald-100 text-emerald-700",
  FREELANCE:  "bg-violet-100 text-violet-700",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function timeAgo(iso: string) {
  const d = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
  if (d === 0) return "today";
  if (d === 1) return "yesterday";
  return `${d}d ago`;
}
function buildWhatsAppUrl(number: string) {
  return `https://wa.me/${number.replace(/\D/g, "")}`;
}

const INPUT  = "w-full rounded-xl border border-border bg-muted px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring text-sm";
const SELECT = "w-full rounded-xl border border-border bg-muted px-4 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-ring appearance-none text-sm";

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function JobsPage() {
  const router = useRouter();

  const [jobs, setJobs]               = useState<Job[]>([]);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState<string | null>(null);
  const [search, setSearch]           = useState("");
  const [showSearch, setShowSearch]   = useState(false);
  const [activeType, setActiveType]   = useState<JobType | "">("");
  const [showForm, setShowForm]       = useState(false);
  const [submitting, setSubmitting]   = useState(false);
  const [formError, setFormError]     = useState<string | null>(null);
  const [submitted, setSubmitted]     = useState(false);
  const [form, setForm]               = useState<JobForm>(EMPTY_FORM);

  const fetchJobs = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const params: Record<string, string> = {};
      if (activeType) params.type = activeType;
      const data = await marketplaceApi.getJobs(params);
      setJobs(Array.isArray(data) ? data : []);
    } catch {
      setError("Couldn't load jobs.");
    } finally {
      setLoading(false);
    }
  }, [activeType]);

  useEffect(() => {
    const t = setTimeout(fetchJobs, 300);
    return () => clearTimeout(t);
  }, [fetchJobs]);

  function setF<K extends keyof JobForm>(k: K, v: JobForm[K]) {
    setForm(p => ({ ...p, [k]: v }));
    setFormError(null);
  }

  function closeForm() {
    setShowForm(false);
    setSubmitted(false);
    setForm(EMPTY_FORM);
    setFormError(null);
  }

  async function handleSubmit() {
    if (!form.title.trim())    { setFormError("Title is required."); return; }
    if (!form.type)            { setFormError("Please select a job type."); return; }
    if (!form.location.trim()) { setFormError("Location is required."); return; }
    if (!form.whatsapp.trim()) { setFormError("WhatsApp number is required."); return; }

    setSubmitting(true); setFormError(null);
    try {
      await marketplaceApi.createJob({
        title:       form.title.trim(),
        description: form.description.trim(),
        type:        form.type,
        pay:         form.pay.trim() || undefined,
        location:    form.location.trim(),
        whatsapp:    form.whatsapp.trim(),
      });
      setSubmitted(true);
      // Refresh list after short delay so the success state is visible
      setTimeout(() => {
        closeForm();
        fetchJobs();
      }, 2000);
    } catch (e: unknown) {
      setFormError(e instanceof Error ? e.message : "Failed to submit.");
    } finally {
      setSubmitting(false);
    }
  }

  const visible = jobs.filter(j => {
    if (activeType && j.type !== activeType) return false;
    if (search) {
      const q = search.toLowerCase();
      return j.title.toLowerCase().includes(q) || j.location.toLowerCase().includes(q);
    }
    return true;
  });

  return (
    <div className="min-h-screen w-full bg-muted pb-28">

      {/* ── Header ── */}
      <div className="bg-card px-5 pt-8 pb-4 sticky top-0 z-20 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <button onClick={() => router.back()} aria-label="Go back">
              <ArrowLeft className="w-6 h-6 text-foreground" />
            </button>
            <h1 className="font-serif text-2xl font-bold text-foreground">Jobs & Internships</h1>
          </div>
          <button onClick={() => { setShowSearch(v => !v); setSearch(""); }} aria-label="Search">
            <Search className="w-5 h-5 text-foreground" />
          </button>
        </div>
        {showSearch && (
          <div className="flex items-center gap-2 bg-muted rounded-2xl px-4 py-2.5">
            <Search className="w-4 h-4 text-muted-foreground shrink-0" />
            <input
              autoFocus
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search jobs…"
              className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
            />
            {search && <button onClick={() => setSearch("")}><X className="w-4 h-4 text-muted-foreground" /></button>}
          </div>
        )}
      </div>

      {/* ── Type filter ── */}
      <div className="overflow-x-auto scrollbar-none">
        <div className="flex gap-2 px-5 py-3 w-max">
          <button
            onClick={() => setActiveType("")}
            className={`shrink-0 text-sm font-bold px-4 py-2 rounded-full transition-colors ${!activeType ? "bg-primary text-primary-foreground" : "bg-card border border-border text-muted-foreground"}`}
          >
            All
          </button>
          {JOB_TYPES.map(({ value, label }) => (
            <button
              key={value}
              onClick={() => setActiveType(p => p === value ? "" : value)}
              className={`shrink-0 text-sm font-bold px-4 py-2 rounded-full transition-colors ${activeType === value ? "bg-primary text-primary-foreground" : "bg-card border border-border text-muted-foreground"}`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="px-5 flex flex-col gap-3">

        {error && (
          <div className="flex items-center gap-3 bg-destructive/10 rounded-2xl px-4 py-3">
            <AlertTriangle className="w-4 h-4 text-destructive shrink-0" />
            <p className="text-sm text-destructive flex-1">{error}</p>
            <button onClick={fetchJobs} aria-label="Retry"><RefreshCw className="w-4 h-4 text-destructive" /></button>
          </div>
        )}

        {loading && <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 text-primary animate-spin" /></div>}

        {!loading && visible.length === 0 && !error && (
          <div className="flex flex-col items-center gap-3 py-16 text-center">
            <Briefcase className="w-12 h-12 text-muted-foreground/30" />
            <p className="font-semibold text-muted-foreground">No jobs found</p>
            <p className="text-sm text-muted-foreground">Try a different filter or post one</p>
          </div>
        )}

        {!loading && visible.map(job => (
          <div key={job.id} className="bg-card rounded-2xl p-4 flex flex-col gap-3">
            {/* Title & type */}
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <p className="font-bold text-foreground text-lg leading-snug">{job.title}</p>
                {job.postedBy && (
                  <p className="text-muted-foreground text-xs mt-0.5">Posted by {job.postedBy.fullName} · {timeAgo(job.createdAt)}</p>
                )}
              </div>
              <span className={`text-xs font-bold rounded-lg px-2.5 py-1 shrink-0 ${TYPE_BADGE[job.type]}`}>
                {job.type.replace("_", " ")}
              </span>
            </div>

            {/* Meta */}
            <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
              {job.location && (
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 shrink-0" />{job.location}
                </span>
              )}
              {job.pay && (
                <span className="font-bold text-primary">{job.pay}</span>
              )}
            </div>

            {job.description && (
              <p className="text-muted-foreground text-sm leading-relaxed line-clamp-3">{job.description}</p>
            )}

            {/* Contact */}
            <div className="flex gap-2 pt-1">
              <a
                href={buildWhatsAppUrl(job.whatsapp)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 flex items-center justify-center gap-2 bg-emerald-500 text-white font-bold rounded-xl py-2.5 text-sm"
              >
                <MessageCircle className="w-4 h-4" /> WhatsApp
              </a>
              <a
                href={`tel:${job.whatsapp}`}
                className="flex items-center justify-center gap-2 border border-border bg-card text-foreground font-bold rounded-xl px-4 py-2.5 text-sm"
              >
                <Phone className="w-4 h-4" /> Call
              </a>
            </div>
          </div>
        ))}
      </div>

      {/* ── FAB ── */}
      <button
        onClick={() => setShowForm(true)}
        className="fixed bottom-24 right-6 flex items-center gap-2 bg-primary text-primary-foreground font-semibold rounded-full px-5 py-3.5 shadow-lg shadow-primary/30 z-20"
      >
        <Plus className="w-5 h-5" /> Post a job
      </button>

      <BottomNav />

      {/* ── Create job sheet ── */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40">
          <div className="w-full max-w-lg bg-card rounded-t-3xl p-6 pb-10 flex flex-col gap-4 max-h-[90vh] overflow-y-auto">

            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-foreground">Post a Job</h2>
              <button onClick={closeForm} aria-label="Close">
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>

            {submitted ? (
              <div className="flex flex-col items-center gap-3 py-8 text-center">
                <Briefcase className="w-12 h-12 text-primary" />
                <p className="font-bold text-foreground text-lg">Submitted for review!</p>
                <p className="text-muted-foreground text-sm">An admin will approve your listing shortly.</p>
              </div>
            ) : (
              <>
                {formError && (
                  <div className="flex items-center gap-2 bg-destructive/10 rounded-xl px-3 py-2">
                    <AlertTriangle className="w-4 h-4 text-destructive shrink-0" />
                    <p className="text-sm text-destructive">{formError}</p>
                  </div>
                )}

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-muted-foreground">Job Title *</label>
                  <input value={form.title} onChange={e => setF("title", e.target.value)} placeholder="e.g. Software Engineering Intern" className={INPUT} />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-muted-foreground">Job Type *</label>
                  <select value={form.type} onChange={e => setF("type", e.target.value as JobType | "")} className={SELECT}>
                    <option value="">Select job type</option>
                    {JOB_TYPES.map(({ value, label }) => <option key={value} value={value}>{label}</option>)}
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-muted-foreground">Location *</label>
                  <input value={form.location} onChange={e => setF("location", e.target.value)} placeholder="e.g. Lagos (Hybrid), Remote, On Campus" className={INPUT} />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-muted-foreground">Pay / Salary</label>
                  <input value={form.pay} onChange={e => setF("pay", e.target.value)} placeholder="e.g. ₦50,000/month, Negotiable" className={INPUT} />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-muted-foreground">Description</label>
                  <textarea value={form.description} onChange={e => setF("description", e.target.value)} placeholder="Describe the role, requirements, and responsibilities…" rows={4} className={`${INPUT} resize-none`} />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-muted-foreground">WhatsApp Number *</label>
                  <input value={form.whatsapp} onChange={e => setF("whatsapp", e.target.value)} placeholder="+234 800 000 0000" inputMode="tel" className={INPUT} />
                </div>

                <div className="flex gap-3 pt-2">
                  <button onClick={closeForm} className="flex-1 rounded-2xl border border-border py-3.5 font-bold text-foreground">
                    Cancel
                  </button>
                  <button onClick={handleSubmit} disabled={submitting} className="flex-1 rounded-2xl bg-primary text-primary-foreground py-3.5 font-bold flex items-center justify-center gap-2 disabled:opacity-50">
                    {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                    {submitting ? "Submitting…" : "Submit"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
