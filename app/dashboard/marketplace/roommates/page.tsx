"use client";

import { useState, useEffect, useCallback } from "react";
import BottomNav from "@/components/shared/BottomNav";
import { useRouter } from "next/navigation";
import {
  ArrowLeft, Search, Plus, X, Loader2, AlertTriangle, RefreshCw,
  MapPin, Users, Phone, MessageCircle,
} from "lucide-react";
import { marketplaceApi } from "@/lib/api/marketplace";

// ─── Types ────────────────────────────────────────────────────────────────────

type Gender = "MALE" | "FEMALE" | "ANY";

interface RoommateRequest {
  id:            string;
  description:   string;
  budget?:       number | null;
  preferredArea: string;
  gender:        string;
  level:         string;
  whatsapp:      string;
  isActive:      boolean;
  createdAt:     string;
  user?: { id: string; fullName: string; profilePictureUrl?: string | null };
}

interface RoommateForm {
  description:   string;
  budget:        string;
  preferredArea: string;
  gender:        Gender;
  level:         string;
  whatsapp:      string;
}

const EMPTY_FORM: RoommateForm = {
  description: "", budget: "", preferredArea: "", gender: "ANY", level: "", whatsapp: "",
};

// ─── Constants ────────────────────────────────────────────────────────────────

const GENDER_BADGE: Record<string, string> = {
  MALE:   "bg-blue-100 text-blue-700",
  FEMALE: "bg-pink-100 text-pink-700",
  ANY:    "bg-muted text-muted-foreground",
};

const LEVELS = ["100", "200", "300", "400", "500", "600", "Postgraduate"];

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
  const cleaned = number.replace(/\D/g, "");
  return `https://wa.me/${cleaned}`;
}

const INPUT  = "w-full rounded-xl border border-border bg-muted px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring text-sm";
const SELECT = "w-full rounded-xl border border-border bg-muted px-4 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-ring appearance-none text-sm";

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function RoommatesPage() {
  const router = useRouter();

  const [items, setItems]             = useState<RoommateRequest[]>([]);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState<string | null>(null);
  const [search, setSearch]           = useState("");
  const [showSearch, setShowSearch]   = useState(false);
  const [showForm, setShowForm]       = useState(false);
  const [submitting, setSubmitting]   = useState(false);
  const [formError, setFormError]     = useState<string | null>(null);
  const [form, setForm]               = useState<RoommateForm>(EMPTY_FORM);

  const fetchItems = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const data = await marketplaceApi.getRoommates();
      setItems(Array.isArray(data) ? data : []);
    } catch {
      setError("Couldn't load roommate requests.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  function setF<K extends keyof RoommateForm>(k: K, v: RoommateForm[K]) {
    setForm(p => ({ ...p, [k]: v }));
    setFormError(null);
  }

  async function handleSubmit() {
    if (!form.description.trim())   { setFormError("Description is required."); return; }
    if (!form.preferredArea.trim()) { setFormError("Preferred area is required."); return; }
    if (!form.gender)               { setFormError("Please select a gender preference."); return; }
    if (!form.level.trim())         { setFormError("Your level is required."); return; }
    if (!form.whatsapp.trim())      { setFormError("WhatsApp number is required."); return; }

    setSubmitting(true); setFormError(null);
    try {
      const payload: Record<string, unknown> = {
        description:   form.description.trim(),
        preferredArea: form.preferredArea.trim(),
        gender:        form.gender,
        level:         form.level.trim(),
        whatsapp:      form.whatsapp.trim(),
        ...(form.budget.trim() ? { budget: Number(form.budget) } : {}),
      };
      const result = await marketplaceApi.createRoommate(payload);
      setItems(p => [result as RoommateRequest, ...p]);
      setShowForm(false);
      setForm(EMPTY_FORM);
    } catch (e: unknown) {
      setFormError(e instanceof Error ? e.message : "Failed to post request.");
    } finally {
      setSubmitting(false);
    }
  }

  const visible = items.filter(i => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      i.preferredArea.toLowerCase().includes(q) ||
      (i.user?.fullName ?? "").toLowerCase().includes(q) ||
      i.description.toLowerCase().includes(q)
    );
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
            <h1 className="font-serif text-2xl font-bold text-foreground">Roommates</h1>
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
              placeholder="Search by area or name…"
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

      <div className="px-5 pt-3 flex flex-col gap-3">

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
            <Users className="w-12 h-12 text-muted-foreground/30" />
            <p className="font-semibold text-muted-foreground">No roommate requests yet</p>
            <p className="text-sm text-muted-foreground">Be the first to post one!</p>
          </div>
        )}

        {/* ── Requests ── */}
        {!loading && visible.map(item => (
          <div key={item.id} className="bg-card rounded-2xl p-4 flex flex-col gap-3">

            {/* Poster info + badges */}
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-accent flex items-center justify-center text-sm font-bold text-primary shrink-0 overflow-hidden">
                {item.user?.profilePictureUrl
                  ? <img src={item.user.profilePictureUrl} alt={item.user.fullName} className="w-full h-full object-cover" />
                  : initials(item.user?.fullName ?? "?")}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-bold text-foreground">{item.user?.fullName ?? "Anonymous"}</p>
                  <span className={`text-xs font-bold rounded-lg px-2 py-0.5 ${GENDER_BADGE[item.gender] ?? GENDER_BADGE.ANY}`}>
                    {item.gender === "ANY" ? "Any gender" : item.gender.charAt(0) + item.gender.slice(1).toLowerCase()}
                  </span>
                  {item.level && (
                    <span className="text-xs font-bold rounded-lg px-2 py-0.5 bg-accent text-primary">
                      {item.level}L
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">Posted {timeAgo(item.createdAt)}</p>
              </div>
            </div>

            {/* Details */}
            <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 shrink-0" />{item.preferredArea}
              </span>
              {item.budget != null && (
                <span className="font-bold text-primary">
                  Budget: ₦{formatPrice(item.budget)}<span className="font-normal text-muted-foreground">/mo</span>
                </span>
              )}
            </div>

            {item.description && (
              <p className="text-muted-foreground text-sm leading-relaxed line-clamp-3">{item.description}</p>
            )}

            {/* Contact buttons */}
            <div className="flex gap-2 pt-1">
              <a
                href={buildWhatsAppUrl(item.whatsapp)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 flex items-center justify-center gap-2 bg-emerald-500 text-white font-bold rounded-xl py-2.5 text-sm"
              >
                <MessageCircle className="w-4 h-4" /> WhatsApp
              </a>
              <a
                href={`tel:${item.whatsapp}`}
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
        <Plus className="w-5 h-5" /> Post request
      </button>

      <BottomNav />

      {/* ── Post request sheet ── */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40">
          <div className="w-full max-w-lg bg-card rounded-t-3xl p-6 pb-10 flex flex-col gap-4 max-h-[90vh] overflow-y-auto">

            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-foreground">Post Roommate Request</h2>
              <button onClick={() => { setShowForm(false); setForm(EMPTY_FORM); setFormError(null); }} aria-label="Close">
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>

            {formError && (
              <div className="flex items-center gap-2 bg-destructive/10 rounded-xl px-3 py-2">
                <AlertTriangle className="w-4 h-4 text-destructive shrink-0" />
                <p className="text-sm text-destructive">{formError}</p>
              </div>
            )}

            {/* Preferred area */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-muted-foreground">Preferred Area *</label>
              <input
                value={form.preferredArea}
                onChange={e => setF("preferredArea", e.target.value)}
                placeholder="e.g. Sabo, Near Main Gate"
                className={INPUT}
              />
            </div>

            {/* Budget */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-muted-foreground">Budget per month (₦)</label>
              <div className="flex items-center rounded-xl border border-border bg-muted px-4 focus-within:ring-2 focus-within:ring-ring">
                <span className="text-muted-foreground mr-2 shrink-0 text-sm">₦</span>
                <input
                  value={form.budget}
                  onChange={e => setF("budget", e.target.value)}
                  placeholder="e.g. 20000"
                  inputMode="numeric"
                  className="w-full py-3 bg-transparent text-foreground placeholder:text-muted-foreground focus:outline-none text-sm"
                />
              </div>
            </div>

            {/* Gender preference */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-muted-foreground">Gender Preference *</label>
              <select
                value={form.gender}
                onChange={e => setF("gender", e.target.value as Gender)}
                className={SELECT}
              >
                <option value="ANY">Any gender</option>
                <option value="MALE">Male only</option>
                <option value="FEMALE">Female only</option>
              </select>
            </div>

            {/* Level */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-muted-foreground">Your Level *</label>
              <select
                value={form.level}
                onChange={e => setF("level", e.target.value)}
                className={SELECT}
              >
                <option value="">Select level</option>
                {LEVELS.map(l => (
                  <option key={l} value={l}>{l === "Postgraduate" ? "Postgraduate" : `${l} Level`}</option>
                ))}
              </select>
            </div>

            {/* WhatsApp */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-muted-foreground">WhatsApp Number *</label>
              <input
                value={form.whatsapp}
                onChange={e => setF("whatsapp", e.target.value)}
                placeholder="+234 800 000 0000"
                inputMode="tel"
                className={INPUT}
              />
            </div>

            {/* Description */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-muted-foreground">About you / What you're looking for *</label>
              <textarea
                value={form.description}
                onChange={e => setF("description", e.target.value)}
                placeholder="e.g. 300L student, clean and quiet, looking for a female roommate…"
                rows={4}
                className={`${INPUT} resize-none`}
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => { setShowForm(false); setForm(EMPTY_FORM); setFormError(null); }}
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
