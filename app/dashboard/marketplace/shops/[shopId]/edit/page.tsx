"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import { ArrowLeft, Loader2, CheckCircle2, X, Store } from "lucide-react";
import BackButton from "@/components/shared/BackButton";
import { marketplaceApi } from "@/lib/api/marketplace";

interface FormData {
  name: string; description: string; logoUrl: string; isActive: boolean;
}

export default function EditShopPage() {
  const router = useRouter();
  const params = useParams();
  const shopId = params?.shopId as string;
  const mountedRef = useRef(true);
  useEffect(() => { mountedRef.current = true; return () => { mountedRef.current = false; }; }, []);

  const [form,    setForm]    = useState<FormData>({ name: "", description: "", logoUrl: "", isActive: true });
  const [loading, setLoading] = useState(true);
  const [saving,  setSaving]  = useState(false);
  const [success, setSuccess] = useState(false);
  const [error,   setError]   = useState<string | null>(null);

  useEffect(() => {
    marketplaceApi.getShop(shopId)
      .then((s: any) => setForm({
        name: s.name ?? "", description: s.description ?? "",
        logoUrl: s.logoUrl ?? "", isActive: s.isActive !== false,
      }))
      .catch((e: any) => setError(e.message || "Failed to load shop."))
      .finally(() => setLoading(false));
  }, [shopId]);

  function set(field: keyof FormData, value: string | boolean) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true); setError(null);
    try {
      await marketplaceApi.updateMyShop({
        name: form.name, description: form.description || undefined,
        logoUrl: form.logoUrl || undefined, isActive: form.isActive,
      });
      setSuccess(true);
      setTimeout(() => { if (mountedRef.current) router.push(`/dashboard/marketplace/shops/${shopId}`); }, 1500);
    } catch (e: any) { setError(e.message || "Failed to save."); }
    finally { setSaving(false); }
  }

  if (loading) return <div className="min-h-screen bg-slate-50 flex items-center justify-center"><Loader2 className="w-8 h-8 text-indigo-400 animate-spin" /></div>;

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-white px-4 pt-5 pb-4 flex items-center gap-3 border-b border-slate-100">
        <BackButton />
        <h1 className="text-xl font-bold text-slate-900">Edit Shop</h1>
      </div>

      <form onSubmit={handleSubmit} className="px-4 py-5 max-w-lg mx-auto flex flex-col gap-4">
        {error && <div className="flex items-center justify-between bg-rose-50 text-rose-600 rounded-2xl px-4 py-3 text-sm font-medium"><span>{error}</span><button type="button" onClick={() => setError(null)}><X className="w-4 h-4" /></button></div>}
        {success && <div className="flex items-center gap-2 bg-emerald-50 text-emerald-700 rounded-2xl px-4 py-3 text-sm font-medium"><CheckCircle2 className="w-4 h-4 shrink-0" /> Changes saved!</div>}

        {/* Logo preview */}
        <div className="flex items-center gap-4 bg-white rounded-2xl shadow-sm px-5 py-4">
          {form.logoUrl
            ? <img src={form.logoUrl} alt="logo" className="w-16 h-16 rounded-2xl object-cover shrink-0" />
            : <div className="w-16 h-16 rounded-2xl bg-indigo-50 flex items-center justify-center shrink-0"><Store className="w-7 h-7 text-indigo-400" /></div>
          }
          <div className="flex-1">
            <label className="text-sm font-semibold text-slate-700 block mb-1.5">Logo URL</label>
            <input type="url" value={form.logoUrl} onChange={(e) => set("logoUrl", e.target.value)} placeholder="https://..." className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" />
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-semibold text-slate-700">Shop Name *</label>
          <input type="text" value={form.name} onChange={(e) => set("name", e.target.value)} required placeholder="Your shop name" className="px-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-semibold text-slate-700">Description</label>
          <textarea value={form.description} onChange={(e) => set("description", e.target.value)} rows={4} placeholder="Tell buyers about your shop…" className="px-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 resize-none" />
        </div>

        <div className="flex items-center justify-between bg-white rounded-2xl shadow-sm px-5 py-4">
          <div>
            <p className="font-semibold text-slate-900 text-sm">Shop Active</p>
            <p className="text-xs text-slate-400 mt-0.5">Toggle off to temporarily hide your shop</p>
          </div>
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
