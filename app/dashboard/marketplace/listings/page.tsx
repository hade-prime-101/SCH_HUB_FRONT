"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import BackButton from "@/components/shared/BackButton";
import { marketplaceApi } from "@/lib/api/marketplace";
import {
  Plus,
  Search,
  X,
  Loader2,
  AlertTriangle,
  RefreshCw,
  Image as ImageIcon,
  ShoppingBag,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

type ListingCondition = "NEW" | "LIKE_NEW" | "GOOD" | "FAIR";

interface Listing {
  id: string;
  title: string;
  price: number;
  category: string;
  condition: ListingCondition;
  isSaved?: boolean;
  createdAt: string;
  imageUrl?: string;
  seller?: { id: string; fullName: string };
}

// ─── Constants ────────────────────────────────────────────────────────────────

const CONDITION_BADGE: Record<ListingCondition, string> = {
  NEW:      "bg-emerald-100 text-emerald-700",
  LIKE_NEW: "bg-accent text-primary",
  GOOD:     "bg-muted text-muted-foreground",
  FAIR:     "bg-amber-100 text-amber-700",
};

const CATEGORIES = ["BOOKS", "ELECTRONICS", "CLOTHING", "FURNITURE", "FOOD", "SERVICES", "OTHER"];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60_000);
  const h = Math.floor(m / 60);
  const d = Math.floor(h / 24);
  if (m < 1)  return "Just now";
  if (m < 60) return `${m}m ago`;
  if (h < 24) return `${h}h ago`;
  if (d < 7)  return `${d}d ago`;
  return new Date(iso).toLocaleDateString([], { month: "short", day: "numeric" });
}

function formatPrice(n: number) {
  return `₦${n.toLocaleString("en-NG")}`;
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ListingsPage() {
  const router = useRouter();

  const [listings,    setListings]    = useState<Listing[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState<string | null>(null);
  const [search,      setSearch]      = useState("");
  const [category,    setCategory]    = useState("");

  const fetchListings = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const params: Record<string, string> = {};
      if (search)   params.search   = search;
      if (category) params.category = category;
      const data = await marketplaceApi.getListings(params);
      const list = Array.isArray(data) ? data : (data as any)?.listings ?? (data as any)?.data ?? [];
      setListings(list);
    } catch {
      setError("Couldn't load listings.");
    } finally {
      setLoading(false);
    }
  }, [search, category]);

  useEffect(() => {
    const t = setTimeout(fetchListings, 400);
    return () => clearTimeout(t);
  }, [fetchListings]);

  return (
    <div className="min-h-screen w-full bg-muted pb-24">

      {/* ── Header ── */}
      <div className="flex items-center justify-between px-4 pt-5 pb-3">
        <div className="flex items-center gap-3">
          <BackButton href="/dashboard/marketplace" />
          <h1 className="text-2xl font-bold text-foreground">Listings</h1>
        </div>
        <Link
          href="/dashboard/marketplace/listings/create"
          aria-label="Create listing"
          className="w-10 h-10 rounded-full bg-primary flex items-center justify-center shadow-lg shadow-primary/20"
        >
          <Plus className="w-5 h-5 text-primary-foreground" />
        </Link>
      </div>

      {/* ── Search ── */}
      <div className="px-4 mb-3">
        <div className="flex items-center gap-3 rounded-2xl bg-card border border-border px-4 py-3">
          <Search className="w-4 h-4 text-muted-foreground shrink-0" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search listings…"
            className="flex-1 bg-transparent text-foreground placeholder:text-muted-foreground focus:outline-none text-sm"
          />
          {search && (
            <button onClick={() => setSearch("")}>
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          )}
        </div>
      </div>

      {/* ── Category chips ── */}
      <div className="flex gap-2 overflow-x-auto px-4 pb-1 mb-4 scrollbar-none">
        <button
          onClick={() => setCategory("")}
          className={`shrink-0 text-xs font-bold px-3 py-2 rounded-xl transition-colors ${
            !category ? "bg-accent text-primary" : "bg-card border border-border text-muted-foreground"
          }`}
        >
          All
        </button>
        {CATEGORIES.map(c => (
          <button
            key={c}
            onClick={() => setCategory(p => p === c ? "" : c)}
            className={`shrink-0 text-xs font-bold px-3 py-2 rounded-xl transition-colors ${
              category === c ? "bg-accent text-primary" : "bg-card border border-border text-muted-foreground"
            }`}
          >
            {c.charAt(0) + c.slice(1).toLowerCase()}
          </button>
        ))}
      </div>

      {/* ── Error ── */}
      {error && (
        <div className="mx-4 flex items-center gap-3 bg-destructive/10 rounded-2xl px-4 py-3 mb-4">
          <AlertTriangle className="w-4 h-4 text-destructive shrink-0" />
          <p className="text-sm text-destructive flex-1">{error}</p>
          <button onClick={fetchListings} aria-label="Retry">
            <RefreshCw className="w-4 h-4 text-destructive" />
          </button>
        </div>
      )}

      {/* ── Loading ── */}
      {loading && (
        <div className="flex justify-center py-16">
          <Loader2 className="w-7 h-7 text-primary animate-spin" />
        </div>
      )}

      {/* ── Empty ── */}
      {!loading && listings.length === 0 && (
        <div className="flex flex-col items-center gap-3 py-20 text-center px-8">
          <ShoppingBag className="w-12 h-12 text-muted-foreground/30" />
          <p className="font-semibold text-muted-foreground">No listings found</p>
          <p className="text-sm text-muted-foreground">Be the first to post something for sale</p>
          <Link
            href="/dashboard/marketplace/listings/create"
            className="mt-2 flex items-center gap-2 bg-primary text-primary-foreground font-semibold rounded-xl px-5 py-2.5 text-sm"
          >
            <Plus className="w-4 h-4" /> Create listing
          </Link>
        </div>
      )}

      {/* ── Grid ── */}
      {!loading && listings.length > 0 && (
        <div className="grid grid-cols-2 gap-3 px-4">
          {listings.map(item => {
            const condStyle = CONDITION_BADGE[item.condition] ?? "bg-muted text-muted-foreground";
            return (
              <Link
                key={item.id}
                href={`/dashboard/marketplace/${item.id}`}
                className="bg-card rounded-2xl overflow-hidden shadow-sm active:scale-95 transition-transform"
              >
                <div className="h-32 bg-muted flex items-center justify-center">
                  {item.imageUrl
                    ? <img src={item.imageUrl} alt={item.title} className="w-full h-full object-cover" />
                    : <ImageIcon className="w-7 h-7 text-muted-foreground/30" />
                  }
                </div>
                <div className="p-3">
                  <span className={`inline-block text-[10px] font-semibold rounded-full px-2 py-0.5 mb-1.5 ${condStyle}`}>
                    {item.condition.replace("_", " ")}
                  </span>
                  <p className="text-xs font-semibold text-foreground leading-snug line-clamp-2 mb-1">
                    {item.title}
                  </p>
                  <p className="text-sm font-bold text-foreground">{formatPrice(item.price)}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{timeAgo(item.createdAt)}</p>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
