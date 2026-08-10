"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, Heart, Undo2, Loader2, AlertTriangle, RefreshCw } from "lucide-react";
import Link from "next/link";
import { marketplaceApi } from "@/lib/api/marketplace";

// ─── Types ────────────────────────────────────────────────────────────────────

type ListingCondition = "NEW" | "LIKE_NEW" | "GOOD" | "FAIR" | "POOR";

interface SavedListing {
  id: string;
  title?: string;
  price: number;
  condition: ListingCondition;
  images?: string[];
  savedAt?: string;
  createdAt?: string;
  seller?: { id: string; fullName: string };
  // API may nest the listing inside a `listing` key
  listing?: {
    id: string;
    title?: string;
    price: number;
    condition: ListingCondition;
    images?: string[];
    seller?: { id: string; fullName: string };
  };
}

// ─── Constants ────────────────────────────────────────────────────────────────

const CONDITION_BADGE: Record<ListingCondition, string> = {
  NEW:      "bg-emerald-100 text-emerald-700",
  LIKE_NEW: "bg-accent text-primary",
  GOOD:     "bg-muted text-muted-foreground",
  FAIR:     "bg-amber-100 text-amber-700",
  POOR:     "bg-destructive/10 text-destructive",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatPrice(n: number) {
  return n.toLocaleString("en-NG");
}

function formatSavedDate(iso?: string) {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString([], { month: "short", day: "numeric" });
}

/** Normalise — the API may return either a flat SavedListing or { listing: {...} } */
function normalise(raw: any): SavedListing {
  const inner = raw.listing ?? raw;
  return {
    id:        inner.id ?? raw.id,
    title:     inner.title,
    price:     inner.price ?? 0,
    condition: inner.condition ?? "GOOD",
    images:    inner.images ?? [],
    savedAt:   raw.savedAt ?? raw.createdAt,
    seller:    inner.seller,
  };
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function SavedListingsPage() {
  const router = useRouter();

  const [items, setItems]     = useState<SavedListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);

  // Undo toast — holds the item removed + the saved-listing record id
  const [toast, setToast]         = useState<SavedListing | null>(null);
  const toastTimerRef             = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Track whether the API unsave has already been called so undo can reinstate
  const pendingUnsaveRef          = useRef<string | null>(null);

  // ── fetch ──────────────────────────────────────────────────────────────────

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await marketplaceApi.getSavedListings();
      setItems(Array.isArray(data) ? data.map(normalise) : []);
    } catch {
      setError("Couldn't load saved listings.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // Cleanup timer on unmount
  useEffect(() => () => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
  }, []);

  // ── remove with undo ───────────────────────────────────────────────────────

  function removeItem(id: string) {
    const removed = items.find(i => i.id === id);
    if (!removed) return;

    // Optimistically remove from list
    setItems(prev => prev.filter(i => i.id !== id));

    // Cancel any pending previous toast timer
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    pendingUnsaveRef.current = id;

    setToast(removed);

    // After 4s with no undo, call the API to unsave
    toastTimerRef.current = setTimeout(() => {
      if (pendingUnsaveRef.current === id) {
        marketplaceApi.saveListing(id).catch(() => {/* best-effort toggle */});
        pendingUnsaveRef.current = null;
      }
      setToast(null);
    }, 4000);
  }

  function undoRemove() {
    if (!toast) return;
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    // Cancel the pending unsave
    pendingUnsaveRef.current = null;
    // Restore item to list
    setItems(prev => [toast, ...prev]);
    setToast(null);
  }

  // ── render ─────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen w-full bg-muted px-6 py-6 pb-24">

      {/* ── Header ── */}
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => router.back()}
          aria-label="Go back"
          className="w-9 h-9 rounded-full border border-border flex items-center justify-center bg-card shrink-0"
        >
          <ChevronLeft className="w-5 h-5 text-foreground" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Saved Listings</h1>
          <p className="text-muted-foreground text-sm">Your bookmarked marketplace items</p>
        </div>
      </div>

      {/* ── Error banner ── */}
      {error && (
        <div className="flex items-center gap-3 bg-destructive/10 rounded-2xl px-4 py-3 mb-4">
          <AlertTriangle className="w-4 h-4 text-destructive shrink-0" />
          <p className="text-xs text-destructive flex-1">{error}</p>
          <button onClick={load} aria-label="Retry">
            <RefreshCw className="w-4 h-4 text-destructive" />
          </button>
        </div>
      )}

      {/* ── Loading ── */}
      {loading && (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
        </div>
      )}

      {/* ── Empty state ── */}
      {!loading && items.length === 0 && !error && (
        <div className="flex flex-col items-center gap-3 py-20 text-center">
          <Heart className="w-12 h-12 text-muted-foreground/30" />
          <p className="text-foreground font-semibold">No saved listings</p>
          <p className="text-sm text-muted-foreground">
            Tap the heart on any listing to save it here
          </p>
          <Link
            href="/dashboard/marketplace"
            className="mt-2 text-primary text-sm font-semibold underline underline-offset-2"
          >
            Browse marketplace
          </Link>
        </div>
      )}

      {/* ── Grid ── */}
      {!loading && items.length > 0 && (
        <div className="grid grid-cols-2 gap-4">
          {items.map(item => {
            const condStyle = CONDITION_BADGE[item.condition] ?? "bg-muted text-muted-foreground";
            const thumbnail = item.images?.[0];
            return (
              <Link
                key={item.id}
                href={`/dashboard/marketplace/${item.id}`}
                className="bg-card rounded-2xl overflow-hidden block"
              >
                {/* Thumbnail */}
                <div className="relative aspect-square bg-muted">
                  {thumbnail && (
                    <img
                      src={thumbnail}
                      alt={item.title ?? "Listing"}
                      className="w-full h-full object-cover"
                    />
                  )}
                  <button
                    onClick={e => { e.preventDefault(); removeItem(item.id); }}
                    aria-label="Remove from saved"
                    className="absolute top-3 right-3 w-8 h-8 rounded-full bg-card flex items-center justify-center shadow-sm"
                  >
                    <Heart className="w-4 h-4 fill-rose-500 text-rose-500" />
                  </button>
                </div>

                {/* Details */}
                <div className="p-3">
                  {item.title ? (
                    <p className="font-bold text-foreground text-sm leading-snug mb-1.5 line-clamp-2">
                      {item.title}
                    </p>
                  ) : (
                    <>
                      <div className="h-3 w-3/4 rounded bg-muted mb-1.5" />
                      <div className="h-3 w-1/2 rounded bg-muted mb-2" />
                    </>
                  )}

                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-foreground text-sm">
                      ₦{formatPrice(item.price)}
                    </span>
                    <span className={`text-xs font-bold rounded-lg px-2 py-0.5 ${condStyle}`}>
                      {item.condition.replace("_", " ")}
                    </span>
                  </div>

                  {item.seller && (
                    <p className="text-muted-foreground text-xs mt-1">by {item.seller.fullName}</p>
                  )}
                  {item.savedAt && (
                    <p className="text-muted-foreground text-xs">
                      Saved {formatSavedDate(item.savedAt)}
                    </p>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {/* ── Undo toast ── */}
      {toast && (
        <div className="fixed bottom-6 left-4 right-4 bg-card rounded-2xl shadow-xl border border-border px-4 py-3 flex items-center gap-3 z-40">
          <button
            onClick={undoRemove}
            aria-label="Undo remove"
            className="w-9 h-9 rounded-full bg-muted flex items-center justify-center shrink-0"
          >
            <Undo2 className="w-4 h-4 text-foreground" />
          </button>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-foreground text-sm">Removed from saved</p>
            <p className="text-muted-foreground text-xs">Undo available for 4 seconds</p>
          </div>
          <button
            onClick={undoRemove}
            className="bg-primary text-primary-foreground font-bold text-sm rounded-xl px-4 py-2 shrink-0"
          >
            Undo
          </button>
        </div>
      )}
    </div>
  );
}
