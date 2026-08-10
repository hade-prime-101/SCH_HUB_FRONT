"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import { ArrowLeft, Loader2, CheckCircle2, X } from "lucide-react";
import BackButton from "@/components/shared/BackButton";
import { marketplaceApi } from "@/lib/api/marketplace";

type ServiceCategory = "TUTORING" | "GRAPHICS" | "CODING" | "PHOTOGRAPHY" | "PRINTING" | "LAUNDRY" | "FOOD" | "DELIVERY" | "OTHER";

interface FormData {
  title: string; description: string; category: ServiceCategory | "";
  whatsapp: string; price: string; priceNote: string; isActive: boolean;
}

const CATEGORIES: { value: ServiceCategory; label: string }[] = [
  { value: "TUTORING",    label: "Tutoring" },
  { value: "GRAPHICS",    label: "Graphics Design" },
  { value: "CODING",      label: "Coding / Tech" },
  { value: "PHOTOGRAPHY", label: "Photography" },
  { value: "PRINTING",    label: "Printing" },
  { value: "LAUNDRY",     label: "Laundry" },
  { value: "FOOD",        label: "Food" },
  { value: "DELIVERY",    label: "Delivery" },
  { value: "OTHER",       label: "Other" },
];

export default function EditServicePage() {
  const router = useRouter();
  const params = useParams();
  const id     = params?.id as string;
  const mountedRef = useRef(true);
  useEffect(() => { mountedRef.current = true; return () => { mountedRef.current = false; }; }, []);

  const [form,    setForm]    = useState<FormData>({ title: "", description: "", category: "", whatsapp: "", price: "", priceNote: "", isActive: true });
  const [loading, setLoading] = useState(true);
  const [saving,  setSaving]  = useState(false);
  const [success, setSuccess] = useState(false);
  const [error,   setError]   = useState<string | null>(null);

  useEffect(() => {
    marketplaceApi.getService(id)
      .then((s: any) => setForm({
        title: s.title ?? "", description: s.description ?? "", category: s.category ?? "",
        whatsapp: s.whatsapp ?? "", price: s.price != null ? String(s.price) : "",
        priceNote: s.priceNote ?? "", isActive: s.isActive !== false,
      }))
      .catch((e: any) => setError(e.message || "Failed to load service."))
      .finally(() => setLoading(false));
  }, [id]);

  function set(field: keyof FormData, value: string | boolean) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true); setError(null);
    try {
      await marketplaceApi.updateService(id, {
        title: form.title, description: form.description, category: form.category,
        whatsapp: form.whatsapp, price: form.price ? parseFloat(form.price) : undefined,
        priceNote: form.priceNote || undefined, isActive: form.isActive,
      });
      setSuccess(true);
      setTimeout(() => { if (mountedRef.current) router.push(`/dashboard/marketplace/services/${id}`); }, 1500);
    } catch (e: any) { setError(e.message || "Failed to save."); }
    finally { setSaving(false); }
  }

  if (loading) return <div className="min-h-screen bg-slate-50 flex items-center justify-center"><Loader2 className="w-8 h-8 text-indigo-400 animate-spin" /></div>;

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-white px-4 pt-5 pb-4 flex items-center gap-3 border-b border-slate-100">
        <BackButton />
        <h1 className="text-xl font-bold text-slate-900">Edit Service</h1>
      </div>
      <form onSubmit={handleSubmit} className="px-4 py-5 max-w-lg mx-auto flex flex-col gap-4">
        {error && (
          <div className="flex items-center justify-between bg-rose-50 text-rose-600 rounded-2xl px-4 py-3 text-sm font-medium">
            <span>{error}</span><button type="button" onClick={() => setError(null)}><X className="w-4 h-4" /></button>
          </div>
        )}
        {success && <div className="flex items-center gap-2 bg-emerald-50 text-emerald-700 rounded-2xl px-4 py-3 text-sm font-medium"><CheckCircle2 className="w-4 h-4 shrink-0" /> Saved!</div>}

        {[
          { label: "Title *", field: "title" as const },
          { label: "WhatsApp *", field: "whatsapp" as const, placeholder: "08012345678" },
          { label: "Price (optional)", field: "price" as const, type: "number" },
          { label: "Price note", field: "priceNote" as const, placeholder: "e.g. per session" },
        ].map(({ label, field, placeholder, type }) => (
          <div key={field} className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-slate-700">{label}</label>
            <input type={type ?? "text"} value={form[field] as string} onChange={(e) => set(field, e.target.value)} placeholder={placeholder}
              className="px-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" />
          </div>
        ))}

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-semibold text-slate-700">Category *</label>
          <select value={form.category} onChange={(e) => set("category", e.target.value)} className="px-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-white">
            <option value="">Select…</option>
            {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
          </select>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-semibold text-slate-700">Description</label>
          <textarea value={form.description} onChange={(e) => set("description", e.target.value)} rows={4} placeholder="Describe your service…"
            className="px-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 resize-none" />
        </div>

        <div className="flex items-center justify-between bg-white rounded-2xl shadow-sm px-5 py-4">
          <p className="font-semibold text-slate-900 text-sm">Active</p>
          <button type="button" onClick={() => set("isActive", !form.isActive)} className={`w-12 h-7 rounded-full transition-colors relative ${form.isActive ? "bg-emerald-500" : "bg-slate-200"}`}>
            <div className={`absolute top-1 w-5 h-5 rounded-full bg-white shadow transition-transform ${form.isActive ? "translate-x-6" : "translate-x-1"}`} />
          </button>
        </div>

        <button type="submit" disabled={saving || success} className="w-full rounded-2xl bg-indigo-500 py-4 font-bold text-white shadow-lg shadow-indigo-100 flex items-center justify-center gap-2 disabled:opacity-50 transition active:opacity-90">
          {saving ? <><Loader2 className="w-5 h-5 animate-spin" /> Saving…</> : "Save Changes"}
        </button>
      </form>
    </div>
  );
}
