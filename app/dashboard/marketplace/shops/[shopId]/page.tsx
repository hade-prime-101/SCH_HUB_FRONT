"use client";

import { useState, useEffect } from "react";
import BottomNav from "@/components/shared/BottomNav";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Search,
  MoreVertical,
  Users,
  Calendar,
  Star,
  Home,
  Heart,
  Store,
  User,
  Loader2,
  AlertTriangle,
  UserPlus,
  UserMinus,
  X,
  Flag,
} from "lucide-react";
import { marketplaceApi } from "@/lib/api/marketplace";

// ─── Types ────────────────────────────────────────────────────────────────────

type ListingCondition = "NEW" | "LIKE_NEW" | "GOOD" | "FAIR" | "POOR";

interface ShopListing {
  id:        string;
  title:     string;
  price:     number;
  condition: ListingCondition;
  imageUrl?: string;
}

interface Shop {
  id:           string;
  name:         string;
  about?:       string;
  logoUrl?:     string;
  followerCount?: number;
  activeSince?: string;
  rating?:      number;
  ratingCount?: number;
  isFollowing?: boolean;
  sellerId?:    string;
  listings?:    ShopListing[];
}

// ─── Constants ────────────────────────────────────────────────────────────────

const CONDITION_COLOR: Record<ListingCondition, string> = {
  NEW:      "text-emerald-600",
  LIKE_NEW: "text-primary",
  GOOD:     "text-muted-foreground",
  FAIR:     "text-amber-600",
  POOR:     "text-destructive",
};

// ─── Mock ─────────────────────────────────────────────────────────────────────

const MOCK: Shop = {
  id:           "s1",
  name:         "CampusCore Store",
  about:        "Official student marketplace shop for books, gadgets, and campus essentials.",
  followerCount: 1200,
  activeSince:  "2024-08-01T00:00:00Z",
  rating:       4.8,
  ratingCount:  248,
  isFollowing:  false,
  sellerId:     "u1",
  listings: [
    { id: "l1", title: "MacBook Air M1",           condition: "GOOD",     price: 650000 },
    { id: "l2", title: "Study Desk Lamp",           condition: "LIKE_NEW", price: 18000 },
    { id: "l3", title: "Data Structures Textbook",  condition: "FAIR",     price: 7500 },
    { id: "l4", title: "Campus Hoodie",             condition: "NEW",      price: 22000 },
  ],
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatFollowers(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1).replace(/\.0$/, "")}k`;
  return String(n);
}

function formatPrice(n: number): string {
  return n.toLocaleString("en-NG");
}

function formatActiveSince(iso: string): string {
  return new Date(iso).toLocaleDateString([], { month: "short", year: "numeric" });
}

function initials(name: string): string {
  return name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
}

// ─── Star display ─────────────────────────────────────────────────────────────

function StarRow({ rating }: { rating: number }) {
  return (
    <span className="flex">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={`w-4 h-4 ${
            i < Math.floor(rating)
              ? "fill-amber-400 text-amber-400"
              : i < rating
              ? "fill-amber-400 text-amber-400 opacity-60"
              : "text-border"
          }`}
        />
      ))}
    </span>
  );
}

// ─── Rate Seller Modal ────────────────────────────────────────────────────────

function RateSellerModal({
  sellerId,
  sellerName,
  onClose,
}: {
  sellerId:   string;
  sellerName: string;
  onClose:    () => void;
}) {
  const [rating,  setRating]  = useState(0);
  const [hovered, setHovered] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done,  setDone]  = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    if (rating === 0) { setError("Please select a star rating."); return; }
    setSubmitting(true);
    setError(null);
    try {
      await marketplaceApi.rateSeller(sellerId, rating, comment.trim() || undefined);
      setDone(true);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to submit rating.");
    } finally {
      setSubmitting(false);
    }
  }

  const display = hovered || rating;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40">
      <div className="w-full max-w-lg bg-card rounded-t-3xl p-6 pb-10 flex flex-col gap-4">
        {/* Title row */}
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-foreground">Rate {sellerName}</h2>
          <button onClick={onClose} aria-label="Close">
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        {done ? (
          <div className="flex flex-col items-center gap-3 py-6 text-center">
            <Star className="w-12 h-12 fill-amber-400 text-amber-400" />
            <p className="font-bold text-foreground text-lg">Thanks for rating!</p>
            <p className="text-muted-foreground text-sm">Your feedback helps other students.</p>
            <button
              onClick={onClose}
              className="mt-2 bg-primary text-primary-foreground font-bold rounded-2xl px-8 py-3"
            >
              Done
            </button>
          </div>
        ) : (
          <>
            {/* Interactive stars */}
            <div className="flex justify-center gap-2">
              {Array.from({ length: 5 }).map((_, i) => {
                const val = i + 1;
                return (
                  <button
                    key={i}
                    aria-label={`Rate ${val} star${val > 1 ? "s" : ""}`}
                    onMouseEnter={() => setHovered(val)}
                    onMouseLeave={() => setHovered(0)}
                    onClick={() => setRating(val)}
                    className="p-1"
                  >
                    <Star
                      className={`w-8 h-8 transition-colors ${
                        val <= display
                          ? "fill-amber-400 text-amber-400"
                          : "text-border"
                      }`}
                    />
                  </button>
                );
              })}
            </div>

            {/* Comment */}
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Leave a comment (optional)…"
              rows={3}
              maxLength={300}
              className="w-full rounded-xl bg-muted border border-border px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
            />

            {/* Error */}
            {error && (
              <p className="text-sm text-destructive flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" /> {error}
              </p>
            )}

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 rounded-2xl border border-border py-3 font-bold text-foreground"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={submitting || rating === 0}
                className="flex-1 rounded-2xl bg-primary text-primary-foreground font-bold py-3 flex items-center justify-center gap-2 disabled:opacity-50 transition-opacity"
              >
                {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                {submitting ? "Submitting…" : "Submit rating"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ShopProfilePage() {
  const router = useRouter();
  const params = useParams();
  const shopId = params.shopId as string;

  const [shop,        setShop]        = useState<Shop | null>(null);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState<string | null>(null);
  const [following,   setFollowing]   = useState(false);
  const [toggling,    setToggling]    = useState(false);
  const [menuOpen,    setMenuOpen]    = useState(false);
  const [showSearch,  setShowSearch]  = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showRate,    setShowRate]    = useState(false);
  const [showReport,  setShowReport]  = useState(false);
  const [reporting,   setReporting]   = useState(false);

  // ── fetch ────────────────────────────────────────────────────────────────────

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await marketplaceApi.getShop(shopId);
        if (!cancelled) {
          setShop(data);
          setFollowing(data.isFollowing ?? false);
        }
      } catch {
        if (!cancelled) {
          setShop(MOCK);
          setFollowing(MOCK.isFollowing ?? false);
          setError("Showing cached data — couldn't reach the server.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [shopId]);

  // ── follow toggle ─────────────────────────────────────────────────────────────

  async function handleFollowToggle() {
    if (!shop) return;
    setToggling(true);
    const prev = following;
    setFollowing(!prev); // optimistic
    setShop((s) => s
      ? { ...s, followerCount: (s.followerCount ?? 0) + (prev ? -1 : 1) }
      : s
    );
    try {
      const res = await marketplaceApi.followShop(shop.id);
      setFollowing(res.following);
    } catch {
      setFollowing(prev); // revert
      setShop((s) => s
        ? { ...s, followerCount: (s.followerCount ?? 0) + (prev ? 1 : -1) }
        : s
      );
    } finally {
      setToggling(false);
    }
  }

  // ── filtered listings ─────────────────────────────────────────────────────────

  const listings = shop?.listings ?? [];
  const visible  = searchQuery
    ? listings.filter((l) => l.title.toLowerCase().includes(searchQuery.toLowerCase()))
    : listings;

  async function handleReport(reason: string) {
    if (!shopId) return;
    setReporting(true);
    try {
      // TODO: Implement shop reporting when backend endpoint is available
      // await marketplaceApi.reportShop(shopId, reason);
      console.warn("Shop reporting not yet implemented");
    } catch {}
    setReporting(false);
    setShowReport(false);
  }

  // ── render ────────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen w-full bg-card pb-24">

      {/* ── Header ── */}
      <div className="relative flex items-center justify-between px-6 pt-6 pb-4">
        <button onClick={() => router.back()} aria-label="Go back">
          <ArrowLeft className="w-6 h-6 text-foreground" />
        </button>
        <div className="flex items-center gap-5">
          <button
            onClick={() => { setShowSearch((v) => !v); setSearchQuery(""); }}
            aria-label="Search listings"
          >
            <Search className="w-5 h-5 text-foreground" />
          </button>
          <button
            onClick={() => setMenuOpen((v) => !v)}
            aria-label="More options"
          >
            <MoreVertical className="w-5 h-5 text-foreground" />
          </button>
        </div>

        {/* Context menu */}
        {menuOpen && (
          <>
            <div className="fixed inset-0 z-20" onClick={() => setMenuOpen(false)} />
            <div className="absolute right-6 top-14 bg-card rounded-2xl shadow-lg border border-border py-2 w-44 z-30">
              <button
                onClick={() => { setMenuOpen(false); setShowReport(true); }}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-foreground hover:bg-muted transition text-sm"
              >
                <Flag className="w-4 h-4" /> Report shop
              </button>
            </div>
          </>
        )}
      </div>

      {/* ── Inline search ── */}
      {showSearch && (
        <div className="px-6 pb-3">
          <div className="flex items-center gap-3 bg-muted rounded-2xl px-4 py-2.5">
            <Search className="w-4 h-4 text-muted-foreground shrink-0" />
            <input
              autoFocus
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search this shop…"
              className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery("")}>
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* ── Loading ── */}
      {loading && (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
        </div>
      )}

      {/* ── Error banner ── */}
      {error && !loading && (
        <div className="mx-6 mb-2 flex items-center gap-3 bg-destructive/10 rounded-2xl px-4 py-3">
          <AlertTriangle className="w-4 h-4 text-destructive shrink-0" />
          <p className="text-xs text-destructive">{error}</p>
        </div>
      )}

      {shop && !loading && (
        <div className="px-6">

          {/* ── Shop identity ── */}
          <div className="flex gap-4 mb-5">
            {/* Logo */}
            <div className="w-20 h-20 rounded-full bg-muted shrink-0 overflow-hidden flex items-center justify-center text-lg font-bold text-foreground">
              {shop.logoUrl
                ? <img src={shop.logoUrl} alt={shop.name} className="w-full h-full object-cover" />
                : initials(shop.name)
              }
            </div>
            <div className="min-w-0">
              <h1 className="font-serif text-2xl font-bold text-foreground leading-tight">
                {shop.name}
              </h1>
              {shop.about && (
                <p className="text-muted-foreground mt-1 leading-snug text-sm">
                  {shop.about}
                </p>
              )}
            </div>
          </div>

          {/* ── Meta row ── */}
          <div className="flex flex-col gap-2 mb-5">
            {shop.followerCount !== undefined && (
              <div className="flex items-center gap-2 text-muted-foreground text-sm">
                <Users className="w-4 h-4 shrink-0" />
                {formatFollowers(shop.followerCount)} followers
              </div>
            )}
            {shop.activeSince && (
              <div className="flex items-center gap-2 text-muted-foreground text-sm">
                <Calendar className="w-4 h-4 shrink-0" />
                Active since {formatActiveSince(shop.activeSince)}
              </div>
            )}
            {shop.rating !== undefined && (
              <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                <StarRow rating={shop.rating} />
                {shop.rating.toFixed(1)}
                {shop.ratingCount !== undefined && (
                  <span className="text-muted-foreground font-normal">
                    ({shop.ratingCount} ratings)
                  </span>
                )}
              </div>
            )}
          </div>

          {/* ── Action buttons ── */}
          <div className="flex gap-3 mb-8">
            {/* Follow / Unfollow */}
            <button
              onClick={handleFollowToggle}
              disabled={toggling}
              className={`flex-1 flex items-center justify-center gap-2 rounded-2xl py-3.5 font-bold border-2 transition-colors ${
                following
                  ? "border-border text-muted-foreground"
                  : "border-foreground text-foreground"
              } disabled:opacity-50`}
            >
              {toggling
                ? <Loader2 className="w-4 h-4 animate-spin" />
                : following
                ? <UserMinus className="w-4 h-4" />
                : <UserPlus className="w-4 h-4" />
              }
              {following ? "Unfollow" : "Follow"}
            </button>

            {/* Rate seller */}
            <button
              onClick={() => setShowRate(true)}
              className="flex-1 flex items-center justify-center gap-2 border-2 border-foreground rounded-2xl py-3.5 font-bold text-foreground"
            >
              <Star className="w-4 h-4" /> Rate seller
            </button>
          </div>

          {/* ── Listings header ── */}
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-serif text-2xl font-bold text-foreground">Listings</h2>
            <span className="text-muted-foreground text-sm">
              {listings.length} active
            </span>
          </div>

          {/* ── Listings grid ── */}
          {visible.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-12 text-center">
              <Store className="w-10 h-10 text-muted-foreground/30" />
              <p className="text-muted-foreground font-medium">
                {searchQuery ? "No listings match your search" : "No listings yet"}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              {visible.map((item) => (
                <Link
                  key={item.id}
                  href={`/dashboard/marketplace/${item.id}`}
                  className="block"
                >
                  {/* Image placeholder */}
                  <div className="aspect-square rounded-2xl bg-muted mb-2 overflow-hidden">
                    {item.imageUrl && (
                      <img
                        src={item.imageUrl}
                        alt={item.title}
                        className="w-full h-full object-cover"
                      />
                    )}
                  </div>
                  {/* Title + condition */}
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-foreground truncate flex-1">{item.title}</p>
                    <span className={`text-xs font-bold shrink-0 ${CONDITION_COLOR[item.condition] ?? "text-muted-foreground"}`}>
                      {item.condition}
                    </span>
                  </div>
                  <p className="font-bold text-foreground">₦{formatPrice(item.price)}</p>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Bottom nav ── */}
      <BottomNav />

      {/* ── Rate seller modal ── */}
      {showRate && shop?.sellerId && (
        <RateSellerModal
          sellerId={shop.sellerId}
          sellerName={shop.name}
          onClose={() => setShowRate(false)}
        />
      )}

      {/* ── Report shop modal ── */}
      {showReport && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40">
          <div className="w-full max-w-lg bg-card rounded-t-3xl p-6 pb-10 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-foreground">Report shop</h2>
              <button onClick={() => setShowReport(false)} aria-label="Close">
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>
            <p className="text-sm text-muted-foreground">Why are you reporting this shop?</p>
            <div className="flex flex-col gap-2">
              {["Fake or scam", "Inappropriate content", "Counterfeit items", "Harassment", "Other"].map((reason) => (
                <button
                  key={reason}
                  disabled={reporting}
                  onClick={() => handleReport(reason)}
                  className="w-full text-left rounded-2xl bg-muted px-4 py-3 text-sm font-medium text-foreground hover:bg-muted/70 transition disabled:opacity-50 flex items-center justify-between"
                >
                  {reason}
                  {reporting && <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />}
                </button>
              ))}
            </div>
            <button
              onClick={() => setShowReport(false)}
              className="text-muted-foreground text-sm font-semibold"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
