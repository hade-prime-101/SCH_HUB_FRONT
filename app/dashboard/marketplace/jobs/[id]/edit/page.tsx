"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import { Loader2, CheckCircle2, X } from "lucide-react";
import { marketplaceApi } from "@/lib/api/marketplace";
import BackButton from "@/components/shared/BackButton";

type JobType = "INTERNSHIP" | "PART_TIME" | "CAMPUS_JOB" | "FREELANCE";

interface FormData {
  title: string; description: string; type: JobType | "";
  location: string; whatsapp: string; pay: string;
}

const JOB_TYPES: { value: JobType; label: string }[] = [
  { value: "INTERNSHIP",  label: "Internship" },
  { value: "PART_TIME",   label: "Part-time" },
  { value: "CAMPUS_JOB",  label: "Campus Job" },
  { value: "FREELANCE",   label: "Freelance" },
];

export default function EditJobPage() {
  const router = useRouter();
  const params = useParams();
  const id     = params?.id as string;
  const mountedRef = useRef(true);
  useEffect(() => { mountedRef.current = true; return () => { mountedRef.current = false; }; }, []);

  const [form,    setForm]    = useState<FormData>({ title: "", description: "", type: "", location: "", whatsapp: "", pay: "" });
  const [loading, setLoading] = useState(true);
  const [saving,  setSaving]  = useState(false);
  const [success, setSuccess] = useState(false);
  const [error,   setError]   = useState<string | null>(null);

  useEffect(() => {
    marketplaceApi.getJob(id)
      .then((j: any) => setForm({
        title: j.title ?? "", description: j.description ?? "", type: j.type ?? "",
        location: j.location ?? "", whatsapp: j.whatsapp ?? "", pay: j.pay ?? "",
      }))
      .catch((e: any) => setError(e.message || "Failed to load job."))
      .finally(() => setLoading(false));
  }, [id]);

  function set(field: keyof FormData, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true); setError(null);
    try {
      await marketplaceApi.updateJob(id, {
        title: form.title, description: form.description, type: form.type,
        location: form.location, whatsapp: form.whatsapp, pay: form.pay || undefined,
      });
      setSuccess(true);
      setTimeout(() => { if (mountedRef.current) router.push(`/dashboard/marketplace/jobs/${id}`); }, 1500);
    } catch (e: any) { setError(e.message || "Failed to save."); }
    finally { setSaving(false); }
  }

  if (loading) return <div className="min-h-screen bg-slate-50 flex items-center justify-center"><Loader2 className="w-8 h-8 text-indigo-400 animate-spin" /></div>;

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-white px-4 pt-5 pb-4 flex items-center gap-3 border-b border-slate-100">
        <BackButton />
        <h1 className="text-xl font-bold text-slate-900">Edit Job Listing</h1>
      </div>
      <form onSubmit={handleSubmit} className="px-4 py-5 max-w-lg mx-auto flex flex-col gap-4">
        {error && <div className="flex items-center justify-between bg-rose-50 text-rose-600 rounded-2xl px-4 py-3 text-sm font-medium"><span>{error}</span><button type="button" onClick={() => setError(null)}><X className="w-4 h-4" /></button></div>}
        {success && <div className="flex items-center gap-2 bg-emerald-50 text-emerald-700 rounded-2xl px-4 py-3 text-sm font-medium"><CheckCircle2 className="w-4 h-4 shrink-0" /> Saved!</div>}

        {[
          { label: "Title *", field: "title" as const },
          { label: "Location *", field: "location" as const, placeholder: "e.g. Lagos (Hybrid)" },
          { label: "WhatsApp *", field: "whatsapp" as const, placeholder: "08012345678" },
          { label: "Pay / Compensation", field: "pay" as const, placeholder: "e.g. ₦30,000/month" },
        ].map(({ label, field, placeholder }) => (
          <div key={field} className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-slate-700">{label}</label>
            <input type="text" value={form[field]} onChange={(e) => set(field, e.target.value)} placeholder={placeholder}
              className="px-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" />
          </div>
        ))}

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-semibold text-slate-700">Job Type *</label>
          <select value={form.type} onChange={(e) => set("type", e.target.value)} className="px-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-white">
            <option value="">Select…</option>
            {JOB_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-semibold text-slate-700">Description</label>
          <textarea value={form.description} onChange={(e) => set("description", e.target.value)} rows={4} placeholder="Describe the role…"
            className="px-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 resize-none" />
        </div>

        <button type="submit" disabled={saving || success} className="w-full rounded-2xl bg-indigo-500 py-4 font-bold text-white shadow-lg shadow-indigo-100 flex items-center justify-center gap-2 disabled:opacity-50 transition active:opacity-90">
          {saving ? <><Loader2 className="w-5 h-5 animate-spin" /> Saving…</> : "Save Changes"}
        </button>
      </form>
    </div>
  );
}
