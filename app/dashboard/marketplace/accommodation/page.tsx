"use client";

import { useState, useEffect, useCallback } from "react";
import BottomNav from "@/components/shared/BottomNav";
import { useRouter } from "next/navigation";
import {
  ArrowLeft, Search, Plus, X, Loader2, AlertTriangle, RefreshCw,
  MapPin, Users, Home as HomeIcon, Building2,
} from "lucide-react";
import { marketplaceApi } from "@/lib/api/marketplace";
import { useAuth } from "@/lib/hooks/useAuth";

// ─── Types ────────────────────────────────────────────────────────────────────

type AccomType = "SELF_CONTAIN" | "ROOM_AND_PARLOUR" | "SINGLE_ROOM" | "SHARED_ROOM" | "HOSTEL" | "FLAT" | "OTHER";

interface Accommodation {
  id: string;
  title: string;
  type: AccomType;
  price: number;
  location: string;
  availableSpaces?: number;
  contactName?: string;
  description?: string;
  createdAt: string;
}

interface AccomForm {
  title: string; type: AccomType | ""; price: string;
  location: string; availableSpaces: string;
  contactName: string; whatsapp: string; description: string;
  period: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const ACCOM_TYPES: { value: AccomType; label: string }[] = [
  { value: "SELF_CONTAIN",     label: "Self-Contain" },
  { value: "ROOM_AND_PARLOUR", label: "Room & Parlour" },
  { value: "SINGLE_ROOM",      label: "Single Room" },
  { value: "SHARED_ROOM",      label: "Shared Room" },
  { value: "HOSTEL",           label: "Hostel" },
  { value: "FLAT",             label: "Flat" },
  { value: "OTHER",            label: "Other" },
];

const TYPE_BADGE: Record<AccomType, string> = {
  SELF_CONTAIN:     "bg-emerald-100 text-emerald-700",
  ROOM_AND_PARLOUR: "bg-blue-100 text-blue-700",
  SINGLE_ROOM:      "bg-violet-100 text-violet-700",
  SHARED_ROOM:      "bg-amber-100 text-amber-700",
  HOSTEL:           "bg-accent text-primary",
  FLAT:             "bg-pink-100 text-pink-700",
  OTHER:            "bg-muted text-muted-foreground",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatPrice(n: number) { return n.toLocaleString("en-NG"); }
function timeAgo(iso: string) {
  const d = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
  if (d === 0) return "today";
  if (d === 1) return "yesterday";
  return `${d}d ago`;
}

const INPUT  = "w-full rounded-xl border border-border bg-muted px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring";
const SELECT = "w-full rounded-xl border border-border bg-muted px-4 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-ring appearance-none";

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AccommodationPage() {
  const router = useRouter();
  const { user } = useAuth();

  const isAgent = user?.role === "HOUSE_AGENT";

  const [items, setItems]             = useState<Accommodation[]>([]);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState<string | null>(null);
  const [search, setSearch]           = useState("");
  const [showSearch, setShowSearch]   = useState(false);
  const [activeType, setActiveType]   = useState<AccomType | "">("");
  const [showForm, setShowForm]       = useState(false);
  const [submitting, setSubmitting]   = useState(false);
  const [formError, setFormError]     = useState<string | null>(null);
  const [form, setForm]               = useState<AccomForm>({
    title: "", type: "", price: "", location: "", availableSpaces: "",
    contactName: "", whatsapp: "", description: "", period: "year",
  });

  const fetchItems = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const params: Record<string, string> = {};
      if (activeType) params.type = activeType;
      const data = await marketplaceApi.getAccommodation(params);
      setItems(Array.isArray(data) ? data : []);
    } catch {
      setError("Couldn't load listings.");
    } finally {
      setLoading(false);
    }
  }, [activeType]);

  useEffect(() => {
    const t = setTimeout(fetchItems, 300);
    return () => clearTimeout(t);
  }, [fetchItems]);

  function setF<K extends keyof AccomForm>(k: K, v: AccomForm[K]) {
    setForm(p => ({ ...p, [k]: v }));
    setFormError(null);
  }

  async function handleSubmit() {
    if (!form.title.trim())    { setFormError("Title is required."); return; }
    if (!form.type)            { setFormError("Please select a type."); return; }
    if (!form.price.trim())    { setFormError("Price is required."); return; }
    if (!form.location.trim()) { setFormError("Location is required."); return; }
    if (!form.whatsapp.trim()) { setFormError("WhatsApp number is required."); return; }
    setSubmitting(true); setFormError(null);
    try {
      const result = await marketplaceApi.createAccommodation({
        title:           form.title.trim(),
        type:            form.type,
        price:           Number(form.price),
        period:          form.period,
        location:        form.location.trim(),
        whatsapp:        form.whatsapp.trim(),
        description:     form.description.trim(),
      });
      setItems(p => [result as Accommodation, ...p]);
      setShowForm(false);
      setForm({ title: "", type: "", price: "", location: "", availableSpaces: "", contactName: "", whatsapp: "", description: "", period: "year" });
    } catch (e: unknown) {
      setFormError(e instanceof Error ? e.message : "Failed to post listing.");
    } finally {
      setSubmitting(false);
    }
  }

  const visible = items.filter(i => {
    if (activeType && i.type !== activeType) return false;
    if (search && !i.title.toLowerCase().includes(search.toLowerCase()) && !i.location.toLowerCase().includes(search.toLowerCase())) return false;
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
            <h1 className="font-serif text-2xl font-bold text-foreground">Accommodation</h1>
          </div>
          <div className="flex items-center gap-3">
            {/* Agent portal button — only visible to approved agents */}
            {isAgent && (
              <button
                onClick={() => router.push("/dashboard/marketplace/agents")}
                className="flex items-center gap-1.5 bg-primary/10 text-primary text-sm font-bold rounded-xl px-3 py-2"
              >
                <Building2 className="w-4 h-4" /> Agent portal
              </button>
            )}
            <button onClick={() => { setShowSearch(v => !v); setSearch(""); }} aria-label="Search">
              <Search className="w-5 h-5 text-foreground" />
            </button>
          </div>
        </div>
        {showSearch && (
          <div className="flex items-center gap-2 bg-muted rounded-2xl px-4 py-2.5">
            <Search className="w-4 h-4 text-muted-foreground shrink-0" />
            <input
              autoFocus
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search accommodation…"
              className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
            />
            {search && (
              <button onClick={() => setSearch("")}>
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            )}
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
          {ACCOM_TYPES.map(({ value, label }) => (
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

        {/* ── Error ── */}
        {error && (
          <div className="flex items-center gap-3 bg-destructive/10 rounded-2xl px-4 py-3">
            <AlertTriangle className="w-4 h-4 text-destructive shrink-0" />
            <p className="text-sm text-destructive flex-1">{error}</p>
            <button onClick={fetchItems} aria-label="Retry">
              <RefreshCw className="w-4 h-4 text-destructive" />
            </button>
          </div>
        )}

        {/* ── Loading ── */}
        {loading && (
          <div className="flex justify-center py-10">
            <Loader2 className="w-6 h-6 text-primary animate-spin" />
          </div>
        )}

        {/* ── Empty ── */}
        {!loading && visible.length === 0 && !error && (
          <div className="flex flex-col items-center gap-3 py-16 text-center">
            <HomeIcon className="w-12 h-12 text-muted-foreground/30" />
            <p className="font-semibold text-muted-foreground">No listings found</p>
            {search && (
              <p className="text-sm text-muted-foreground">Try a different search or filter</p>
            )}
          </div>
        )}

        {/* ── Listings ── */}
        {!loading && visible.map(item => (
          <div
            key={item.id}
            className="bg-card rounded-2xl p-4 cursor-pointer active:opacity-80 transition-opacity"
            onClick={() => router.push(`/dashboard/marketplace/accommodation/${item.id}`)}
          >
            <div className="flex items-start justify-between gap-2 mb-2">
              <p className="font-bold text-foreground text-lg leading-snug flex-1">{item.title}</p>
              <span className={`text-xs font-bold rounded-lg px-2.5 py-1 shrink-0 ${TYPE_BADGE[item.type]}`}>
                {item.type.replace(/_/g, " ")}
              </span>
            </div>
            <p className="text-primary font-bold text-xl mb-2">
              ₦{formatPrice(item.price)}
              <span className="text-sm font-normal text-muted-foreground">/month</span>
            </p>
            {item.description && (
              <p className="text-muted-foreground text-sm leading-relaxed mb-3 line-clamp-2">{item.description}</p>
            )}
            <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5" />{item.location}
              </span>
              {item.availableSpaces !== undefined && (
                <span className="flex items-center gap-1">
                  <Users className="w-3.5 h-3.5" />{item.availableSpaces} space{item.availableSpaces !== 1 ? "s" : ""} available
                </span>
              )}
            </div>
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
              <p className="text-xs text-muted-foreground">
                {item.contactName ? `Contact: ${item.contactName}` : ""}
              </p>
              <p className="text-xs text-muted-foreground">Posted {timeAgo(item.createdAt)}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Post listing FAB — agents only ── */}
      {isAgent && (
        <button
          onClick={() => setShowForm(true)}
          className="fixed bottom-24 right-6 flex items-center gap-2 bg-primary text-primary-foreground font-semibold rounded-full px-5 py-3.5 shadow-lg shadow-primary/30 z-20"
        >
          <Plus className="w-5 h-5" /> Post listing
        </button>
      )}

      <BottomNav />

      {/* ── Post listing sheet (agents only) ── */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40">
          <div className="w-full max-w-lg bg-card rounded-t-3xl p-6 pb-10 flex flex-col gap-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-foreground">Post Accommodation</h2>
              <button onClick={() => setShowForm(false)} aria-label="Close">
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>

            {formError && (
              <div className="flex items-center gap-2 bg-destructive/10 rounded-xl px-3 py-2">
                <AlertTriangle className="w-4 h-4 text-destructive shrink-0" />
                <p className="text-sm text-destructive">{formError}</p>
              </div>
            )}

            <input
              value={form.title}
              onChange={e => setF("title", e.target.value)}
              placeholder="Listing title *"
              className={INPUT}
            />
            <select
              value={form.type}
              onChange={e => setF("type", e.target.value as AccomType | "")}
              className={SELECT}
            >
              <option value="">Select type *</option>
              {ACCOM_TYPES.map(({ value, label }) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
            <div className="flex items-center rounded-xl border border-border bg-muted px-4 focus-within:ring-2 focus-within:ring-ring">
              <span className="text-muted-foreground mr-2 shrink-0 text-sm">₦</span>
              <input
                value={form.price}
                onChange={e => setF("price", e.target.value)}
                placeholder="Price per month *"
                inputMode="numeric"
                className="w-full py-3 bg-transparent text-foreground placeholder:text-muted-foreground focus:outline-none text-sm"
              />
            </div>
            <select value={form.period} onChange={e => setF("period", e.target.value)} className={SELECT}>
              <option value="year">Per year</option>
              <option value="semester">Per semester</option>
              <option value="month">Per month</option>
            </select>
            <input
              value={form.location}
              onChange={e => setF("location", e.target.value)}
              placeholder="Location *"
              className={INPUT}
            />
            <input
              value={form.whatsapp}
              onChange={e => setF("whatsapp", e.target.value)}
              placeholder="WhatsApp number * (e.g. +234...)"
              inputMode="tel"
              className={INPUT}
            />
            <textarea
              value={form.description}
              onChange={e => setF("description", e.target.value)}
              placeholder="Description"
              rows={3}
              className={`${INPUT} resize-none`}
            />

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setShowForm(false)}
                className="flex-1 rounded-2xl border border-border py-3.5 font-bold text-foreground"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="flex-1 rounded-2xl bg-primary text-primary-foreground py-3.5 font-bold flex items-center justify-center gap-2 disabled:opacity-50"
              >
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
