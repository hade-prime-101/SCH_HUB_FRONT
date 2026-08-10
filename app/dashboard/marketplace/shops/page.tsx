"use client";

import { useState, useEffect } from "react";
import BottomNav from "@/components/shared/BottomNav";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, Search, Plus, X, Loader2, Store,
  Users, Star, UserPlus, UserMinus, AlertTriangle, RefreshCw,
} from "lucide-react";
import { marketplaceApi } from "@/lib/api/marketplace";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Shop {
  id: string;
  name: string;
  description?: string;
  about?: string;
  logoUrl?: string;
  followerCount?: number;
  _count?: { followers?: number; listings?: number };
  avgRating?: number;
  rating?: number;
  listingCount?: number;
  isFollowing?: boolean;
  isOwner?: boolean;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatFollowers(n: number) {
  if (n >= 1000) return `${(n / 1000).toFixed(1).replace(/\.0$/, "")}k`;
  return `${n}`;
}
function initials(name: string) {
  return name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
}
function normaliseShop(raw: any, isOwner = false): Shop {
  return {
    id:            raw.id,
    name:          raw.name ?? "Unnamed Shop",
    description:   raw.description ?? raw.about ?? undefined,
    about:         raw.description ?? raw.about ?? undefined,
    logoUrl:       raw.logoUrl ?? undefined,
    followerCount: raw.followerCount ?? raw._count?.followers ?? 0,
    rating:        raw.avgRating ?? raw.rating ?? undefined,
    listingCount:  raw.listingCount ?? raw._count?.listings ?? undefined,
    isFollowing:   raw.isFollowing ?? false,
    isOwner,
  };
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ShopsPage() {
  const router = useRouter();

  const [shops, setShops]             = useState<Shop[]>([]);
  const [myShop, setMyShop]           = useState<Shop | null>(null);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState<string | null>(null);
  const [search, setSearch]           = useState("");
  const [showSearch, setShowSearch]   = useState(false);
  const [toggling, setToggling]       = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      // Fetch all shops and own shop in parallel
      const [shopsResult, myShopResult] = await Promise.allSettled([
        marketplaceApi.getShops(),
        marketplaceApi.getMyShop(),
      ]);

      let ownShop: Shop | null = null;
      if (myShopResult.status === "fulfilled" && myShopResult.value?.id) {
        ownShop = normaliseShop(myShopResult.value, true);
        setMyShop(ownShop);
      } else {
        setMyShop(null);
      }

      if (shopsResult.status === "fulfilled" && Array.isArray(shopsResult.value)) {
        // Exclude own shop from the general list to avoid duplication
        const others = shopsResult.value
          .filter((s: any) => s.id !== ownShop?.id)
          .map((s: any) => normaliseShop(s));
        setShops(others);
      } else {
        setShops([]);
      }
    } catch {
      setError("Couldn't load shops. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function handleFollowToggle(shopId: string) {
    const prev = shops.find(s => s.id === shopId)?.isFollowing ?? false;
    setToggling(shopId);
    // Optimistic update
    setShops(p => p.map(s =>
      s.id === shopId
        ? { ...s, isFollowing: !prev, followerCount: (s.followerCount ?? 0) + (prev ? -1 : 1) }
        : s
    ));
    try {
      const res = await marketplaceApi.followShop(shopId);
      setShops(p => p.map(s =>
        s.id === shopId ? { ...s, isFollowing: res.following } : s
      ));
    } catch {
      // Revert on failure
      setShops(p => p.map(s =>
        s.id === shopId
          ? { ...s, isFollowing: prev, followerCount: (s.followerCount ?? 0) + (prev ? 1 : -1) }
          : s
      ));
    } finally {
      setToggling(null);
    }
  }

  const allShops = myShop ? [myShop, ...shops] : shops;
  const visible  = search
    ? allShops.filter(s => s.name.toLowerCase().includes(search.toLowerCase()))
    : allShops;

  return (
    <div className="min-h-screen w-full bg-muted pb-28">

      {/* ── Header ── */}
      <div className="bg-card px-5 pt-8 pb-4 sticky top-0 z-20 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <button onClick={() => router.back()} aria-label="Go back">
              <ArrowLeft className="w-6 h-6 text-foreground" />
            </button>
            <h1 className="font-serif text-2xl font-bold text-foreground">Shops</h1>
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
              placeholder="Search shops…"
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

      <div className="px-5 pt-4 flex flex-col gap-4">

        {/* ── Open shop banner (only if user has no shop yet) ── */}
        {!myShop && !loading && (
          <Link
            href="/dashboard/marketplace/shops/create"
            className="flex items-center gap-4 bg-primary text-primary-foreground rounded-2xl p-4"
          >
            <div className="w-12 h-12 rounded-xl bg-primary-foreground/20 flex items-center justify-center shrink-0">
              <Store className="w-6 h-6 text-primary-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-lg leading-snug">Open your campus shop</p>
              <p className="text-primary-foreground/80 text-sm">Sell to students directly</p>
            </div>
            <Plus className="w-5 h-5 text-primary-foreground shrink-0" />
          </Link>
        )}

        {/* ── Error ── */}
        {error && (
          <div className="flex items-center gap-3 bg-destructive/10 rounded-2xl px-4 py-3">
            <AlertTriangle className="w-4 h-4 text-destructive shrink-0" />
            <p className="text-sm text-destructive flex-1">{error}</p>
            <button onClick={load} aria-label="Retry">
              <RefreshCw className="w-4 h-4 text-destructive" />
            </button>
          </div>
        )}

        {/* ── Loading ── */}
        {loading && (
          <div className="flex justify-center py-8">
            <Loader2 className="w-7 h-7 text-primary animate-spin" />
          </div>
        )}

        {/* ── Empty state ── */}
        {!loading && visible.length === 0 && !error && (
          <div className="flex flex-col items-center gap-3 py-16 text-center">
            <Store className="w-12 h-12 text-muted-foreground/30" />
            <p className="font-semibold text-muted-foreground">
              {search ? "No shops match your search" : "No shops yet"}
            </p>
            {!search && (
              <p className="text-sm text-muted-foreground">Be the first to open one!</p>
            )}
          </div>
        )}

        {/* ── Shop list ── */}
        {!loading && visible.map(shop => (
          <div key={shop.id} className="bg-card rounded-2xl p-4 flex items-center gap-4">

            {/* Tappable area → shop profile */}
            <Link
              href={`/dashboard/marketplace/shops/${shop.id}`}
              className="flex items-center gap-3 flex-1 min-w-0"
            >
              <div className="w-12 h-12 rounded-full bg-accent flex items-center justify-center text-sm font-bold text-primary shrink-0 overflow-hidden">
                {shop.logoUrl
                  ? <img src={shop.logoUrl} alt={shop.name} className="w-full h-full object-cover" />
                  : initials(shop.name)
                }
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-bold text-foreground truncate">{shop.name}</p>
                  {shop.isOwner && (
                    <span className="shrink-0 text-[10px] font-bold bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                      Your shop
                    </span>
                  )}
                </div>
                {shop.description && (
                  <p className="text-muted-foreground text-sm truncate">{shop.description}</p>
                )}
                <div className="flex items-center gap-3 mt-1 flex-wrap">
                  {(shop.followerCount !== undefined && shop.followerCount > 0) && (
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Users className="w-3 h-3" />{formatFollowers(shop.followerCount)}
                    </span>
                  )}
                  {shop.rating !== undefined && (
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Star className="w-3 h-3 fill-amber-400 text-amber-400" />{shop.rating.toFixed(1)}
                    </span>
                  )}
                  {shop.listingCount !== undefined && (
                    <span className="text-xs text-muted-foreground">{shop.listingCount} listing{shop.listingCount !== 1 ? "s" : ""}</span>
                  )}
                </div>
              </div>
            </Link>

            {/* Follow button — hidden for own shop */}
            {!shop.isOwner && (
              <button
                onClick={() => handleFollowToggle(shop.id)}
                disabled={toggling === shop.id}
                aria-label={shop.isFollowing ? "Unfollow" : "Follow"}
                className={`flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-bold border-2 transition-colors shrink-0 disabled:opacity-50 ${
                  shop.isFollowing
                    ? "border-border text-muted-foreground"
                    : "border-foreground text-foreground"
                }`}
              >
                {toggling === shop.id
                  ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  : shop.isFollowing
                  ? <UserMinus className="w-3.5 h-3.5" />
                  : <UserPlus className="w-3.5 h-3.5" />
                }
                {shop.isFollowing ? "Following" : "Follow"}
              </button>
            )}
          </div>
        ))}
      </div>

      {/* ── FAB — only if no shop yet ── */}
      {!myShop && !loading && (
        <Link
          href="/dashboard/marketplace/shops/create"
          className="fixed bottom-24 right-6 flex items-center gap-2 bg-primary text-primary-foreground font-semibold rounded-full px-5 py-3.5 shadow-lg shadow-primary/30 z-20"
        >
          <Plus className="w-5 h-5" /> Open shop
        </Link>
      )}

      <BottomNav />
    </div>
  );
}
