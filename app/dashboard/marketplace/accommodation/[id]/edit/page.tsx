"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  ArrowLeft,
  Loader2,
  AlertTriangle,
  CheckCircle2,
  X,
} from "lucide-react";
import BackButton from "@/components/shared/BackButton";
import { marketplaceApi } from "@/lib/api/marketplace";

type AccomType = "SELF_CONTAIN" | "ROOM_AND_PARLOUR" | "SINGLE_ROOM" | "SHARED_ROOM" | "HOSTEL" | "FLAT" | "OTHER";
type Period    = "year" | "month" | "semester";

interface FormData {
  title: string; description: string; type: AccomType | "";
  price: string; period: Period; location: string; whatsapp: string; isAvailable: boolean;
}

const TYPES: { value: AccomType; label: string }[] = [
  { value: "SELF_CONTAIN",     label: "Self-Contain" },
  { value: "ROOM_AND_PARLOUR", label: "Room & Parlour" },
  { value: "SINGLE_ROOM",      label: "Single Room" },
  { value: "SHARED_ROOM",      label: "Shared Room" },
  { value: "HOSTEL",           label: "Hostel" },
  { value: "FLAT",             label: "Flat" },
  { value: "OTHER",            label: "Other" },
];

export default function EditAccommodationPage() {
  const router = useRouter();
  const params = useParams();
  const id     = params?.id as string;
  const mountedRef = useRef(true);
  useEffect(() => { mountedRef.current = true; return () => { mountedRef.current = false; }; }, []);

  const [form,    setForm]    = useState<FormData>({ title: "", description: "", type: "", price: "", period: "year", location: "", whatsapp: "", isAvailable: true });
  const [loading, setLoading] = useState(true);
  const [saving,  setSaving]  = useState(false);
  const [success, setSuccess] = useState(false);
  const [error,   setError]   = useState<string | null>(null);

  useEffect(() => {
    marketplaceApi.getAccommodationItem(id)
      .then((a: any) => setForm({
        title: a.title ?? "", description: a.description ?? "", type: a.type ?? "",
        price: a.price != null ? String(a.price) : "", period: a.period ?? "year",
        location: a.location ?? "", whatsapp: a.whatsapp ?? "", isAvailable: a.isAvailable !== false,
      }))
      .catch((e: any) => setError(e.message || "Failed to load accommodation."))
      .finally(() => setLoading(false));
  }, [id]);

  function set(field: keyof FormData, value: string | boolean) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true); setError(null);
    try {
      await marketplaceApi.updateAccommodation(id, {
        title: form.title, description: form.description, type: form.type,
        price: parseFloat(form.price), period: form.period, location: form.location,
        whatsapp: form.whatsapp, isAvailable: form.isAvailable,
      });
      setSuccess(true);
      setTimeout(() => { if (mountedRef.current) router.push(`/dashboard/marketplace/accommodation/${id}`); }, 1500);
    } catch (e: any) { setError(e.message || "Failed to save changes."); }
    finally { setSaving(false); }
  }

  if (loading) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-white px-4 pt-5 pb-4 flex items-center gap-3 border-b border-slate-100">
        <BackButton />
        <h1 className="text-xl font-bold text-slate-900">Edit Accommodation</h1>
      </div>

      <form onSubmit={handleSubmit} className="px-4 py-5 max-w-lg mx-auto flex flex-col gap-4">
        {error && (
          <div className="flex items-center justify-between bg-rose-50 text-rose-600 rounded-2xl px-4 py-3 text-sm font-medium">
            <span>{error}</span><button type="button" onClick={() => setError(null)}><X className="w-4 h-4" /></button>
          </div>
        )}
        {success && (
          <div className="flex items-center gap-2 bg-emerald-50 text-emerald-700 rounded-2xl px-4 py-3 text-sm font-medium">
            <CheckCircle2 className="w-4 h-4 shrink-0" /> Saved successfully!
          </div>
        )}

        {[
          { label: "Title *", field: "title" as const, placeholder: "e.g. Spacious Self-Contain Near Campus" },
          { label: "Location *", field: "location" as const, placeholder: "e.g. Sabo, Off Campus" },
          { label: "Price (NGN) *", field: "price" as const, placeholder: "e.g. 35000", type: "number" },
          { label: "WhatsApp Number", field: "whatsapp" as const, placeholder: "e.g. 08012345678" },
        ].map(({ label, field, placeholder, type }) => (
          <div key={field} className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-slate-700">{label}</label>
            <input
              type={type ?? "text"}
              value={form[field] as string}
              onChange={(e) => set(field, e.target.value)}
              placeholder={placeholder}
              className="px-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
            />
          </div>
        ))}

        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-slate-700">Type *</label>
            <select value={form.type} onChange={(e) => set("type", e.target.value)} className="px-3 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-white">
              <option value="">Select…</option>
              {TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-slate-700">Period</label>
            <select value={form.period} onChange={(e) => set("period", e.target.value)} className="px-3 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-white">
              <option value="year">Per year</option>
              <option value="month">Per month</option>
              <option value="semester">Per semester</option>
            </select>
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-semibold text-slate-700">Description</label>
          <textarea value={form.description} onChange={(e) => set("description", e.target.value)} placeholder="Describe the accommodation…" rows={4}
            className="px-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 resize-none" />
        </div>

        <div className="flex items-center justify-between bg-white rounded-2xl shadow-sm px-5 py-4">
          <div>
            <p className="font-semibold text-slate-900 text-sm">Available</p>
            <p className="text-xs text-slate-400 mt-0.5">Toggle off if no longer available</p>
          </div>
          <button type="button" onClick={() => set("isAvailable", !form.isAvailable)}
            className={`w-12 h-7 rounded-full transition-colors relative ${form.isAvailable ? "bg-emerald-500" : "bg-slate-200"}`}>
            <div className={`absolute top-1 w-5 h-5 rounded-full bg-white shadow transition-transform ${form.isAvailable ? "translate-x-6" : "translate-x-1"}`} />
          </button>
        </div>

        <button type="submit" disabled={saving || success}
          className="w-full rounded-2xl bg-indigo-500 py-4 font-bold text-white shadow-lg shadow-indigo-100 flex items-center justify-center gap-2 disabled:opacity-50 transition active:opacity-90">
          {saving ? <><Loader2 className="w-5 h-5 animate-spin" /> Saving…</> : "Save Changes"}
        </button>
      </form>
    </div>
  );
}
