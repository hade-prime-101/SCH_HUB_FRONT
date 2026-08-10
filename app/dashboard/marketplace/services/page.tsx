"use client";

import { useState, useEffect, useCallback } from "react";
import BottomNav from "@/components/shared/BottomNav";
import { useRouter } from "next/navigation";
import {
  ArrowLeft, Search, Plus, X, Loader2, AlertTriangle, RefreshCw,
  Wrench, MessageCircle, Phone,
} from "lucide-react";
import { marketplaceApi } from "@/lib/api/marketplace";

// ─── Types ────────────────────────────────────────────────────────────────────

type ServiceCategory = "TUTORING" | "GRAPHICS" | "CODING" | "PHOTOGRAPHY" | "PRINTING" | "LAUNDRY" | "FOOD" | "DELIVERY" | "OTHER";

interface Service {
  id:           string;
  title:        string;
  category:     ServiceCategory;
  description?: string;
  price?:       number | null;
  priceNote?:   string;
  whatsapp:     string;
  createdAt:    string;
  provider?: { id: string; fullName: string; profilePictureUrl?: string | null };
}

interface ServiceForm {
  title:       string;
  category:    ServiceCategory | "";
  description: string;
  price:       string;
  priceNote:   string;
  whatsapp:    string;
}

const EMPTY_FORM: ServiceForm = {
  title: "", category: "", description: "", price: "", priceNote: "", whatsapp: "",
};

// ─── Constants ────────────────────────────────────────────────────────────────

const SERVICE_CATS: { value: ServiceCategory; label: string }[] = [
  { value: "TUTORING",    label: "Tutoring" },
  { value: "GRAPHICS",    label: "Graphics" },
  { value: "CODING",      label: "Coding" },
  { value: "PHOTOGRAPHY", label: "Photography" },
  { value: "PRINTING",    label: "Printing" },
  { value: "LAUNDRY",     label: "Laundry" },
  { value: "FOOD",        label: "Food" },
  { value: "DELIVERY",    label: "Delivery" },
  { value: "OTHER",       label: "Other" },
];

const CAT_BADGE: Record<ServiceCategory, string> = {
  TUTORING:    "bg-blue-100 text-blue-700",
  GRAPHICS:    "bg-pink-100 text-pink-700",
  CODING:      "bg-violet-100 text-violet-700",
  PHOTOGRAPHY: "bg-amber-100 text-amber-700",
  PRINTING:    "bg-accent text-primary",
  LAUNDRY:     "bg-emerald-100 text-emerald-700",
  FOOD:        "bg-orange-100 text-orange-700",
  DELIVERY:    "bg-cyan-100 text-cyan-700",
  OTHER:       "bg-muted text-muted-foreground",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatPrice(n: number) { return n.toLocaleString("en-NG"); }
function timeAgo(iso: string) {
  const d = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
  if (d === 0) return "today";
  if (d === 1) return "yesterday";
  return `${d}d ago`;
}
function initials(name: string) {
  return name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
}
function buildWhatsAppUrl(number: string) {
  return `https://wa.me/${number.replace(/\D/g, "")}`;
}

const INPUT  = "w-full rounded-xl border border-border bg-muted px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring text-sm";
const SELECT = "w-full rounded-xl border border-border bg-muted px-4 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-ring appearance-none text-sm";

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ServicesPage() {
  const router = useRouter();

  const [services, setServices]       = useState<Service[]>([]);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState<string | null>(null);
  const [search, setSearch]           = useState("");
  const [showSearch, setShowSearch]   = useState(false);
  const [activeCategory, setCategory] = useState<ServiceCategory | "">("");
  const [showForm, setShowForm]       = useState(false);
  const [submitting, setSubmitting]   = useState(false);
  const [formError, setFormError]     = useState<string | null>(null);
  const [form, setForm]               = useState<ServiceForm>(EMPTY_FORM);

  const fetchServices = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const params: Record<string, string> = {};
      if (activeCategory) params.category = activeCategory;
      const data = await marketplaceApi.getServices(params);
      setServices(Array.isArray(data) ? data : []);
    } catch {
      setError("Couldn't load services.");
    } finally {
      setLoading(false);
    }
  }, [activeCategory]);

  useEffect(() => {
    const t = setTimeout(fetchServices, 300);
    return () => clearTimeout(t);
  }, [fetchServices]);

  function setF<K extends keyof ServiceForm>(k: K, v: ServiceForm[K]) {
    setForm(p => ({ ...p, [k]: v }));
    setFormError(null);
  }

  function closeForm() {
    setShowForm(false);
    setForm(EMPTY_FORM);
    setFormError(null);
  }

  async function handleSubmit() {
    if (!form.title.trim())    { setFormError("Title is required."); return; }
    if (!form.category)        { setFormError("Please select a category."); return; }
    if (!form.whatsapp.trim()) { setFormError("WhatsApp number is required."); return; }

    setSubmitting(true); setFormError(null);
    try {
      const result = await marketplaceApi.createService({
        title:       form.title.trim(),
        category:    form.category,
        description: form.description.trim(),
        whatsapp:    form.whatsapp.trim(),
        ...(form.price.trim()     ? { price:     Number(form.price) } : {}),
        ...(form.priceNote.trim() ? { priceNote: form.priceNote.trim() } : {}),
      });
      setServices(p => [result as Service, ...p]);
      closeForm();
    } catch (e: unknown) {
      setFormError(e instanceof Error ? e.message : "Failed to post service.");
    } finally {
      setSubmitting(false);
    }
  }

  const visible = services.filter(s => {
    if (activeCategory && s.category !== activeCategory) return false;
    if (search) {
      const q = search.toLowerCase();
      return s.title.toLowerCase().includes(q) || (s.provider?.fullName ?? "").toLowerCase().includes(q);
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
            <h1 className="font-serif text-2xl font-bold text-foreground">Services</h1>
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
              placeholder="Search services…"
              className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
            />
            {search && <button onClick={() => setSearch("")}><X className="w-4 h-4 text-muted-foreground" /></button>}
          </div>
        )}
      </div>

      {/* ── Category filter ── */}
      <div className="overflow-x-auto scrollbar-none">
        <div className="flex gap-2 px-5 py-3 w-max">
          <button
            onClick={() => setCategory("")}
            className={`shrink-0 text-sm font-bold px-4 py-2 rounded-full transition-colors ${!activeCategory ? "bg-primary text-primary-foreground" : "bg-card border border-border text-muted-foreground"}`}
          >
            All
          </button>
          {SERVICE_CATS.map(({ value, label }) => (
            <button
              key={value}
              onClick={() => setCategory(p => p === value ? "" : value)}
              className={`shrink-0 text-sm font-bold px-4 py-2 rounded-full transition-colors ${activeCategory === value ? "bg-primary text-primary-foreground" : "bg-card border border-border text-muted-foreground"}`}
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
            <button onClick={fetchServices} aria-label="Retry"><RefreshCw className="w-4 h-4 text-destructive" /></button>
          </div>
        )}

        {loading && <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 text-primary animate-spin" /></div>}

        {!loading && visible.length === 0 && !error && (
          <div className="flex flex-col items-center gap-3 py-16 text-center">
            <Wrench className="w-12 h-12 text-muted-foreground/30" />
            <p className="font-semibold text-muted-foreground">No services found</p>
            <p className="text-sm text-muted-foreground">Be the first to offer one!</p>
          </div>
        )}

        {!loading && visible.map(svc => (
          <div key={svc.id} className="bg-card rounded-2xl p-4 flex flex-col gap-3">

            {/* Provider + category */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-accent flex items-center justify-center text-sm font-bold text-primary shrink-0 overflow-hidden">
                {svc.provider?.profilePictureUrl
                  ? <img src={svc.provider.profilePictureUrl} alt={svc.provider.fullName} className="w-full h-full object-cover" />
                  : initials(svc.provider?.fullName ?? "?")}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-foreground truncate">{svc.provider?.fullName ?? "Anonymous"}</p>
                <p className="text-xs text-muted-foreground">Posted {timeAgo(svc.createdAt)}</p>
              </div>
              <span className={`text-xs font-bold rounded-lg px-2.5 py-1 shrink-0 ${CAT_BADGE[svc.category]}`}>
                {svc.category}
              </span>
            </div>

            {/* Title & price */}
            <div>
              <p className="font-bold text-foreground text-lg leading-snug">{svc.title}</p>
              {svc.price != null ? (
                <p className="text-primary font-bold text-xl mt-0.5">
                  ₦{formatPrice(svc.price)}
                  {svc.priceNote && <span className="text-sm font-normal text-muted-foreground ml-1">{svc.priceNote}</span>}
                </p>
              ) : svc.priceNote ? (
                <p className="text-primary font-bold mt-0.5">{svc.priceNote}</p>
              ) : null}
            </div>

            {svc.description && (
              <p className="text-muted-foreground text-sm leading-relaxed line-clamp-2">{svc.description}</p>
            )}

            {/* Contact buttons */}
            <div className="flex gap-2 pt-1">
              <a
                href={buildWhatsAppUrl(svc.whatsapp)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 flex items-center justify-center gap-2 bg-emerald-500 text-white font-bold rounded-xl py-2.5 text-sm"
              >
                <MessageCircle className="w-4 h-4" /> WhatsApp
              </a>
              <a
                href={`tel:${svc.whatsapp}`}
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
        <Plus className="w-5 h-5" /> Offer a service
      </button>

      <BottomNav />

      {/* ── Create service sheet ── */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40">
          <div className="w-full max-w-lg bg-card rounded-t-3xl p-6 pb-10 flex flex-col gap-4 max-h-[90vh] overflow-y-auto">

            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-foreground">Offer a Service</h2>
              <button onClick={closeForm} aria-label="Close">
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>

            {formError && (
              <div className="flex items-center gap-2 bg-destructive/10 rounded-xl px-3 py-2">
                <AlertTriangle className="w-4 h-4 text-destructive shrink-0" />
                <p className="text-sm text-destructive">{formError}</p>
              </div>
            )}

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-muted-foreground">Service Title *</label>
              <input value={form.title} onChange={e => setF("title", e.target.value)} placeholder="e.g. Maths Tutoring, Logo Design" className={INPUT} />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-muted-foreground">Category *</label>
              <select value={form.category} onChange={e => setF("category", e.target.value as ServiceCategory | "")} className={SELECT}>
                <option value="">Select category</option>
                {SERVICE_CATS.map(({ value, label }) => <option key={value} value={value}>{label}</option>)}
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-muted-foreground">Description</label>
              <textarea value={form.description} onChange={e => setF("description", e.target.value)} placeholder="Describe your service, experience, availability…" rows={4} className={`${INPUT} resize-none`} />
            </div>

            {/* Price + note side by side */}
            <div className="flex gap-3">
              <div className="flex-1 flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-muted-foreground">Price (₦)</label>
                <div className="flex items-center rounded-xl border border-border bg-muted px-3 focus-within:ring-2 focus-within:ring-ring">
                  <span className="text-muted-foreground mr-1.5 text-sm shrink-0">₦</span>
                  <input
                    value={form.price}
                    onChange={e => setF("price", e.target.value)}
                    placeholder="e.g. 5000"
                    inputMode="numeric"
                    className="w-full py-3 bg-transparent text-foreground placeholder:text-muted-foreground focus:outline-none text-sm"
                  />
                </div>
              </div>
              <div className="flex-1 flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-muted-foreground">Price note</label>
                <input value={form.priceNote} onChange={e => setF("priceNote", e.target.value)} placeholder="e.g. /hour, negotiable" className={INPUT} />
              </div>
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
                {submitting ? "Posting…" : "Post"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
