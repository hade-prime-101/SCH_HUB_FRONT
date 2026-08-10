"use client";

import { useState, useEffect, useCallback } from "react";
import BottomNav from "@/components/shared/BottomNav";
import { useRouter } from "next/navigation";
import {
  ArrowLeft, Search, Plus, X, Loader2, AlertTriangle, RefreshCw,
  MapPin, Clock, CheckCircle, Phone,
} from "lucide-react";
import { marketplaceApi } from "@/lib/api/marketplace";

// ─── Types ────────────────────────────────────────────────────────────────────

type ItemType   = "LOST" | "FOUND";
type FilterType = "ALL" | "LOST" | "FOUND";

interface LostFoundItem {
  id:          string;
  type:        ItemType;
  title:       string;
  description?: string;
  location?:   string;
  contactInfo: string;   // required by schema
  imageUrl?:   string;
  isResolved:  boolean;
  createdAt:   string;
  reportedBy?: { id: string; fullName: string };
}

interface LostFoundForm {
  type:        ItemType;
  title:       string;
  description: string;
  location:    string;
  contactInfo: string;  // matches schema — phone, WhatsApp, or any contact detail
}

const EMPTY_FORM: LostFoundForm = {
  type: "LOST", title: "", description: "", location: "", contactInfo: "",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

const INPUT = "w-full rounded-xl border border-border bg-muted px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring text-sm";

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function LostFoundPage() {
  const router = useRouter();

  const [items, setItems]           = useState<LostFoundItem[]>([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState<string | null>(null);
  const [filter, setFilter]         = useState<FilterType>("ALL");
  const [search, setSearch]         = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [showForm, setShowForm]     = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError]   = useState<string | null>(null);
  const [resolving, setResolving]   = useState<string | null>(null);
  const [form, setForm]             = useState<LostFoundForm>(EMPTY_FORM);

  const fetchItems = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const params: Record<string, string> = {};
      if (filter !== "ALL") params.type = filter;
      const data = await marketplaceApi.getLostFound(params);
      setItems(Array.isArray(data) ? data : []);
    } catch {
      setError("Couldn't load items.");
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    const t = setTimeout(fetchItems, 300);
    return () => clearTimeout(t);
  }, [fetchItems]);

  function setF<K extends keyof LostFoundForm>(k: K, v: LostFoundForm[K]) {
    setForm(p => ({ ...p, [k]: v }));
    setFormError(null);
  }

  function closeForm() {
    setShowForm(false);
    setForm(EMPTY_FORM);
    setFormError(null);
  }

  async function handleResolve(id: string) {
    setResolving(id);
    setItems(p => p.map(i => i.id === id ? { ...i, isResolved: true } : i)); // optimistic
    try {
      await marketplaceApi.resolveLostFound(id);
    } catch {
      setItems(p => p.map(i => i.id === id ? { ...i, isResolved: false } : i)); // revert
    } finally {
      setResolving(null);
    }
  }

  async function handleSubmit() {
    if (!form.title.trim())       { setFormError("Item name is required."); return; }
    if (!form.location.trim())    { setFormError("Location is required."); return; }
    if (!form.contactInfo.trim()) { setFormError("Contact info is required."); return; }

    setSubmitting(true); setFormError(null);
    try {
      const result = await marketplaceApi.reportLostFound({
        type:        form.type,
        title:       form.title.trim(),
        description: form.description.trim(),
        location:    form.location.trim(),
        contactInfo: form.contactInfo.trim(),
      });
      setItems(p => [result as LostFoundItem, ...p]);
      closeForm();
    } catch (e: unknown) {
      setFormError(e instanceof Error ? e.message : "Failed to report item.");
    } finally {
      setSubmitting(false);
    }
  }

  const visible = items.filter(i => {
    if (filter !== "ALL" && i.type !== filter) return false;
    if (search) {
      const q = search.toLowerCase();
      return i.title.toLowerCase().includes(q) || (i.location ?? "").toLowerCase().includes(q);
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
            <h1 className="font-serif text-2xl font-bold text-foreground">Lost & Found</h1>
          </div>
          <button onClick={() => { setShowSearch(v => !v); setSearch(""); }} aria-label="Search">
            <Search className="w-5 h-5 text-foreground" />
          </button>
        </div>
        {showSearch && (
          <div className="flex items-center gap-2 bg-muted rounded-2xl px-4 py-2.5 mb-3">
            <Search className="w-4 h-4 text-muted-foreground shrink-0" />
            <input
              autoFocus
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search items…"
              className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
            />
            {search && <button onClick={() => setSearch("")}><X className="w-4 h-4 text-muted-foreground" /></button>}
          </div>
        )}
        {/* Filter pills */}
        <div className="flex gap-2">
          {(["ALL", "LOST", "FOUND"] as FilterType[]).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`flex-1 py-2 rounded-2xl text-sm font-bold transition-colors border ${
                filter === f
                  ? f === "LOST"  ? "bg-destructive/10 text-destructive border-destructive/30"
                  : f === "FOUND" ? "bg-emerald-100 text-emerald-700 border-emerald-200"
                  :                 "bg-primary text-primary-foreground border-primary"
                  : "bg-card text-muted-foreground border-border"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="px-5 pt-3 flex flex-col gap-3">

        {error && (
          <div className="flex items-center gap-3 bg-destructive/10 rounded-2xl px-4 py-3">
            <AlertTriangle className="w-4 h-4 text-destructive shrink-0" />
            <p className="text-sm text-destructive flex-1">{error}</p>
            <button onClick={fetchItems} aria-label="Retry">
              <RefreshCw className="w-4 h-4 text-destructive" />
            </button>
          </div>
        )}

        {loading && <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 text-primary animate-spin" /></div>}

        {!loading && visible.length === 0 && !error && (
          <div className="flex flex-col items-center gap-3 py-16 text-center">
            <Search className="w-12 h-12 text-muted-foreground/30" />
            <p className="font-semibold text-muted-foreground">No items reported yet</p>
            <p className="text-sm text-muted-foreground">Be the first to report a lost or found item</p>
          </div>
        )}

        {!loading && visible.map(item => (
          <div
            key={item.id}
            className={`bg-card rounded-2xl p-4 border-l-4 ${item.type === "LOST" ? "border-destructive" : "border-emerald-500"}`}
          >
            {/* Badges */}
            <div className="flex items-center gap-2 flex-wrap mb-2">
              <span className={`text-xs font-bold rounded-lg px-2.5 py-1 ${item.type === "LOST" ? "bg-destructive/10 text-destructive" : "bg-emerald-100 text-emerald-700"}`}>
                {item.type}
              </span>
              {item.isResolved && (
                <span className="text-xs font-bold rounded-lg px-2.5 py-1 bg-emerald-100 text-emerald-700 flex items-center gap-1">
                  <CheckCircle className="w-3 h-3" /> Resolved
                </span>
              )}
            </div>

            <p className="font-bold text-foreground text-lg leading-snug mb-1">{item.title}</p>

            {item.description && (
              <p className="text-muted-foreground text-sm leading-relaxed mb-3 line-clamp-2">{item.description}</p>
            )}

            <div className="flex flex-wrap gap-3 text-sm text-muted-foreground mb-3">
              {item.location && (
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 shrink-0" />{item.location}
                </span>
              )}
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 shrink-0" />{timeAgo(item.createdAt)}
              </span>
            </div>

            {/* Contact info + reporter */}
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-1.5 text-sm">
                <Phone className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                <a
                  href={`tel:${item.contactInfo}`}
                  className="text-primary font-semibold"
                  onClick={e => e.stopPropagation()}
                >
                  {item.contactInfo}
                </a>
              </div>
              {!item.isResolved && (
                <button
                  onClick={() => handleResolve(item.id)}
                  disabled={resolving === item.id}
                  className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-100 rounded-xl px-3 py-1.5 disabled:opacity-50 shrink-0"
                >
                  {resolving === item.id
                    ? <Loader2 className="w-3 h-3 animate-spin" />
                    : <CheckCircle className="w-3 h-3" />}
                  Mark resolved
                </button>
              )}
            </div>

            {item.reportedBy && (
              <p className="text-xs text-muted-foreground mt-2">
                Reported by {item.reportedBy.fullName}
              </p>
            )}
          </div>
        ))}
      </div>

      {/* ── FAB ── */}
      <button
        onClick={() => setShowForm(true)}
        className="fixed bottom-24 right-6 flex items-center gap-2 bg-primary text-primary-foreground font-semibold rounded-full px-5 py-3.5 shadow-lg shadow-primary/30 z-20"
      >
        <Plus className="w-5 h-5" /> Report item
      </button>

      <BottomNav />

      {/* ── Report item sheet ── */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40">
          <div className="w-full max-w-lg bg-card rounded-t-3xl p-6 pb-10 flex flex-col gap-4 max-h-[90vh] overflow-y-auto">

            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-foreground">Report Item</h2>
              <button onClick={closeForm} aria-label="Close">
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>

            {/* LOST / FOUND toggle */}
            <div className="flex gap-3">
              {(["LOST", "FOUND"] as ItemType[]).map(t => (
                <button
                  key={t}
                  onClick={() => setF("type", t)}
                  className={`flex-1 py-3 rounded-2xl font-bold text-sm border-2 transition-colors ${
                    form.type === t
                      ? t === "LOST"
                        ? "bg-destructive/10 text-destructive border-destructive/40"
                        : "bg-emerald-100 text-emerald-700 border-emerald-300"
                      : "bg-card text-muted-foreground border-border"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>

            {formError && (
              <div className="flex items-center gap-2 bg-destructive/10 rounded-xl px-3 py-2">
                <AlertTriangle className="w-4 h-4 text-destructive shrink-0" />
                <p className="text-sm text-destructive">{formError}</p>
              </div>
            )}

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-muted-foreground">Item name *</label>
              <input
                value={form.title}
                onChange={e => setF("title", e.target.value)}
                placeholder="e.g. Black HP Laptop, Student ID Card"
                className={INPUT}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-muted-foreground">Description</label>
              <textarea
                value={form.description}
                onChange={e => setF("description", e.target.value)}
                placeholder="Colour, brand, contents, any identifying features…"
                rows={3}
                className={`${INPUT} resize-none`}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-muted-foreground">Location *</label>
              <input
                value={form.location}
                onChange={e => setF("location", e.target.value)}
                placeholder="Where was it lost / found?"
                className={INPUT}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-muted-foreground">Contact info *</label>
              <input
                value={form.contactInfo}
                onChange={e => setF("contactInfo", e.target.value)}
                placeholder="Phone number, WhatsApp, or how to reach you"
                inputMode="tel"
                className={INPUT}
              />
              <p className="text-xs text-muted-foreground">This is shown publicly so people can contact you</p>
            </div>

            <div className="flex gap-3 pt-2">
              <button onClick={closeForm} className="flex-1 rounded-2xl border border-border py-3.5 font-bold text-foreground">
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="flex-1 rounded-2xl bg-primary text-primary-foreground py-3.5 font-bold flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                {submitting ? "Reporting…" : "Report"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
