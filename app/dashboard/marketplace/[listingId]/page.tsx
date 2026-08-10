"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  ArrowLeft,
  MoreVertical,
  Flag,
  Heart,
  MapPin,
  ChevronRight,
  Star,
  Loader2,
  AlertTriangle,
  Pencil,
  Trash2,
} from "lucide-react";
import { marketplaceApi } from "@/lib/api/marketplace";

// ─── Types ────────────────────────────────────────────────────────────────────

type ListingCondition = "NEW" | "LIKE_NEW" | "GOOD" | "FAIR" | "POOR";
type ListingStatus    = "ACTIVE" | "SOLD" | "REMOVED";

interface Listing {
  id: string;
  title: string;
  description?: string;
  price: number;
  category: string;
  condition: ListingCondition;
  status: ListingStatus;
  pickupLocation?: string;
  imageUrl?: string;
  isSaved?: boolean;
  savedCount?: number;
  createdAt: string;
  seller?: {
    id: string;
    fullName: string;
    rating?: number;
    totalRatings?: number;
  };
}

// ─── Constants ────────────────────────────────────────────────────────────────

const CONDITION_BADGE: Record<ListingCondition, string> = {
  NEW:      "bg-emerald-100 text-emerald-700",
  LIKE_NEW: "bg-accent text-primary",
  GOOD:     "bg-card border border-border text-muted-foreground",
  FAIR:     "bg-amber-100 text-amber-700",
  POOR:     "bg-destructive/10 text-destructive",
};

// ─── Mock — shown while API resolves ─────────────────────────────────────────

const MOCK: Listing = {
  id:              "1",
  title:           "Calculus Textbook Bundle",
  description:     "A complete set of calculus and linear algebra textbooks in great condition. Perfect for first and second year engineering students. Includes highlighted notes and a few practice sheets inside.",
  price:           12500,
  category:        "BOOKS",
  condition:       "GOOD",
  status:          "SOLD",
  pickupLocation:  "Main Library, North Campus",
  isSaved:         false,
  savedCount:      18,
  createdAt:       new Date(Date.now() - 172_800_000).toISOString(),
  seller:          { id: "u1", fullName: "Amina Yusuf", rating: 4.9, totalRatings: 32 },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatPrice(n: number) {
  return n.toLocaleString("en-NG");
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 60)  return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24)   return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7)   return `${days} day${days > 1 ? "s" : ""} ago`;
  return new Date(iso).toLocaleDateString([], { month: "short", day: "numeric" });
}

function initials(name: string) {
  return name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
}

// ─── Star Rating ──────────────────────────────────────────────────────────────

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={`w-3.5 h-3.5 ${
            i < Math.round(rating)
              ? "fill-amber-400 text-amber-400"
              : "text-border"
          }`}
        />
      ))}
    </div>
  );
}

// ─── Report Sheet ─────────────────────────────────────────────────────────────

type ReportReason = "SPAM" | "FAKE_LISTING" | "INAPPROPRIATE_CONTENT" | "SCAM" | "WRONG_CATEGORY" | "OTHER";
type TargetType   = "listing" | "accommodation" | "service";

const REPORT_REASONS: { value: ReportReason; label: string }[] = [
  { value: "SPAM",                  label: "Spam" },
  { value: "FAKE_LISTING",          label: "Fake listing" },
  { value: "INAPPROPRIATE_CONTENT", label: "Inappropriate content" },
  { value: "SCAM",                  label: "Scam" },
  { value: "WRONG_CATEGORY",        label: "Wrong category" },
  { value: "OTHER",                 label: "Other" },
];

function ReportSheet({
  listingId,
  targetType,
  onClose,
}: {
  listingId:  string;
  targetType: TargetType;
  onClose:    () => void;
}) {
  const [reason, setReason]     = useState<ReportReason>("SPAM");
  const [details, setDetails]   = useState("");
  const [submitting, setSub]    = useState(false);
  const [done, setDone]         = useState(false);
  const [error, setError]       = useState<string | null>(null);

  async function handleSubmit() {
    setSub(true); setError(null);
    try {
      await marketplaceApi.reportListing({ targetType, targetId: listingId, reason, details: details.trim() || undefined });
      setDone(true);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Report failed.");
    } finally {
      setSub(false);
    }
  }

  return (
    <>
      <div className="fixed inset-0 bg-black/40 z-40" onClick={onClose} aria-hidden="true" />
      <div className="fixed bottom-0 left-0 right-0 bg-card rounded-t-3xl z-50 px-6 pt-5 pb-10">
        <div className="w-10 h-1 rounded-full bg-muted mx-auto mb-5" />
        {done ? (
          <div className="flex flex-col items-center gap-3 py-8 text-center">
            <Flag className="w-10 h-10 text-destructive" />
            <p className="font-bold text-foreground text-lg">Report submitted</p>
            <p className="text-sm text-muted-foreground">We'll review this listing. Thank you.</p>
            <button onClick={onClose} className="mt-2 bg-primary text-primary-foreground font-bold rounded-2xl px-8 py-3">Done</button>
          </div>
        ) : (
          <>
            <h2 className="font-bold text-foreground text-xl mb-4">Report Listing</h2>
            {error && (
              <div className="flex items-center gap-2 bg-destructive/10 rounded-xl px-3 py-2 mb-3 text-destructive text-sm">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0" /> {error}
              </div>
            )}
            <div className="flex flex-wrap gap-2 mb-4">
              {REPORT_REASONS.map(r => (
                <button
                  key={r.value}
                  onClick={() => setReason(r.value)}
                  className={`px-3 py-2 rounded-xl text-xs font-bold border transition-colors ${reason === r.value ? "bg-destructive text-white border-destructive" : "border-border text-muted-foreground"}`}
                >
                  {r.label}
                </button>
              ))}
            </div>
            <textarea
              value={details}
              onChange={e => setDetails(e.target.value)}
              placeholder="Additional details (optional)"
              rows={3}
              className="w-full rounded-xl bg-muted border border-border px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none mb-4"
            />
            <div className="flex gap-3">
              <button onClick={onClose} className="flex-1 rounded-2xl border border-border py-3 font-semibold text-foreground">Cancel</button>
              <button onClick={handleSubmit} disabled={submitting} className="flex-1 rounded-2xl bg-destructive text-white font-semibold py-3 flex items-center justify-center gap-2 disabled:opacity-50">
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Flag className="w-4 h-4" />}
                {submitting ? "Submitting…" : "Report"}
              </button>
            </div>
          </>
        )}
      </div>
    </>
  );
}

// ─── Context menu ─────────────────────────────────────────────────────────────

function ContextMenu({
  onReport,
  onDelete,
  deleting,
  onClose,
}: {
  onReport: () => void;
  onDelete: () => void;
  deleting: boolean;
  onClose:  () => void;
}) {
  return (
    <>
      {/* backdrop */}
      <div className="fixed inset-0 z-20" onClick={onClose} />
      <div className="absolute right-4 top-14 bg-card rounded-2xl shadow-lg border border-border py-2 w-44 z-30">
        <button
          onClick={() => { onReport(); onClose(); }}
          className="w-full flex items-center gap-3 px-4 py-2.5 text-foreground hover:bg-muted transition text-sm"
        >
          <Flag className="w-4 h-4" /> Report listing
        </button>
        <button
          onClick={onDelete}
          disabled={deleting}
          className="w-full flex items-center gap-3 px-4 py-2.5 text-destructive hover:bg-destructive/10 transition text-sm"
        >
          {deleting
            ? <Loader2 className="w-4 h-4 animate-spin" />
            : <Trash2 className="w-4 h-4" />}
          Delete
        </button>
      </div>
    </>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ListingDetailPage() {
  const router    = useRouter();
  const params    = useParams();
  const listingId = params.listingId as string;

  const [listing, setListing] = useState<Listing | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);
  const [saved, setSaved]     = useState(false);
  const [saving, setSaving]   = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [markingAsSold, setMarkingAsSold] = useState(false);
  const [showReport, setShowReport] = useState(false);

  // ── load ────────────────────────────────────────────────────────────────────

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await marketplaceApi.getListing(listingId);
        if (!cancelled) {
          setListing(data);
          setSaved(data.isSaved ?? false);
        }
      } catch {
        if (!cancelled) {
          // Fall back to mock so the screen is never blank
          setListing(MOCK);
          setSaved(MOCK.isSaved ?? false);
          setError("Showing cached data — couldn't reach the server.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [listingId]);

  // ── actions ─────────────────────────────────────────────────────────────────

  async function handleToggleSave() {
    if (!listing) return;
    setSaving(true);
    const prev = saved;
    setSaved(!prev); // optimistic
    try {
      const res = await marketplaceApi.saveListing(listing.id);
      setSaved(res.saved);
    } catch {
      setSaved(prev); // revert
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!listing || !confirm("Delete this listing?")) return;
    setDeleting(true);
    try {
      await marketplaceApi.deleteListing(listing.id);
      router.back();
    } catch {
      alert("Failed to delete listing.");
      setDeleting(false);
    }
  }

  async function handleMarkAsSold() {
    if (!listing) return;
    setMarkingAsSold(true);
    try {
      await marketplaceApi.updateListing(listing.id, { status: "SOLD" });
      setListing((l) => l ? { ...l, status: "SOLD" } : l);
    } catch {
      alert("Failed to update listing.");
    } finally {
      setMarkingAsSold(false);
    }
  }

  function handleEdit() {
    router.push(`/dashboard/marketplace/listings/create?edit=${listingId}`);
  }

  // ── render ──────────────────────────────────────────────────────────────────

  const isSold    = listing?.status === "SOLD";
  const condStyle = listing
    ? (CONDITION_BADGE[listing.condition] ?? "bg-muted text-muted-foreground")
    : "";

  return (
    <div className="min-h-screen w-full bg-card pb-28">

      {/* ── Header ── */}
      <div className="relative flex items-center justify-between px-6 pt-6 pb-4">
        <button onClick={() => router.back()} aria-label="Go back">
          <ArrowLeft className="w-6 h-6 text-foreground" />
        </button>
        <div className="flex items-center gap-5">
          <button
            onClick={() => setMenuOpen((v) => !v)}
            aria-label="More options"
          >
            <MoreVertical className="w-5 h-5 text-foreground" />
          </button>
        </div>

        {menuOpen && (
          <ContextMenu
            onReport={() => setShowReport(true)}
            onDelete={handleDelete}
            deleting={deleting}
            onClose={() => setMenuOpen(false)}
          />
        )}
      </div>

      {/* ── Loading ── */}
      {loading && (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
        </div>
      )}

      {/* ── Error banner (non-blocking) ── */}
      {error && !loading && (
        <div className="mx-6 mb-2 flex items-center gap-3 bg-destructive/10 rounded-2xl px-4 py-3">
          <AlertTriangle className="w-4 h-4 text-destructive shrink-0" />
          <p className="text-xs text-destructive">{error}</p>
        </div>
      )}

      {listing && !loading && (
        <>
          {/* ── Image ── */}
          <div className="mx-6 aspect-[4/3] rounded-2xl bg-muted mb-4 overflow-hidden">
            {listing.imageUrl
              ? <img src={listing.imageUrl} alt={listing.title} className="w-full h-full object-cover" />
              : null}
          </div>

          <div className="px-6">
            {/* Availability notice */}
            {isSold && (
              <p className="text-muted-foreground mb-4 text-sm">
                This item is no longer available
              </p>
            )}

            {/* Title + save */}
            <div className="flex items-start justify-between mb-2">
              <h1 className="text-2xl font-bold text-foreground leading-snug pr-4 flex-1">
                {listing.title}
              </h1>
              <button
                onClick={handleToggleSave}
                disabled={saving}
                aria-label={saved ? "Remove from saved" : "Save listing"}
                className="w-11 h-11 rounded-full border border-border flex items-center justify-center shrink-0"
              >
                {saving
                  ? <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                  : <Heart className={`w-5 h-5 ${saved ? "fill-rose-500 text-rose-500" : "text-muted-foreground"}`} />
                }
              </button>
            </div>

            {/* Condition + category badges */}
            <div className="flex items-center gap-2 mb-4 flex-wrap">
              <span className={`text-xs font-bold rounded-lg px-2.5 py-1 ${condStyle}`}>
                {listing.condition}
              </span>
              <span className="text-xs font-bold border border-border rounded-lg px-2.5 py-1 text-muted-foreground">
                {listing.category}
              </span>
            </div>

            {/* Price */}
            <p className={`text-3xl font-bold mb-4 ${isSold ? "text-muted-foreground line-through" : "text-foreground"}`}>
              ₦{formatPrice(listing.price)}
            </p>

            {/* Description */}
            {listing.description && (
              <p className="text-muted-foreground leading-relaxed mb-6">
                {listing.description}
              </p>
            )}

            {/* Pickup location */}
            {listing.pickupLocation && (
              <>
                <div className="flex items-center gap-2 text-muted-foreground mb-1">
                  <MapPin className="w-4 h-4 shrink-0" />
                  <span className="text-sm">Pickup location</span>
                </div>
                <p className="text-foreground font-medium mb-6">
                  {listing.pickupLocation}
                </p>
              </>
            )}

            {/* Seller row */}
            {listing.seller && (
              <div className="flex items-center gap-3 pb-6 border-b border-border">
                {/* Avatar */}
                <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center text-sm font-bold text-foreground shrink-0">
                  {initials(listing.seller.fullName)}
                </div>

                {/* Name + rating */}
                <div className="flex-1 min-w-0">
                  <button className="flex items-center gap-1 font-bold text-foreground text-left">
                    {listing.seller.fullName}
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                  </button>
                  {listing.seller.rating !== undefined && (
                    <div className="flex items-center gap-1 mt-0.5">
                      <StarRating rating={listing.seller.rating} />
                      <span className="text-muted-foreground text-sm ml-1">
                        {listing.seller.rating.toFixed(1)}
                        {listing.seller.totalRatings !== undefined && (
                          <span className="text-xs"> ({listing.seller.totalRatings})</span>
                        )}
                      </span>
                    </div>
                  )}
                </div>

                {/* Meta */}
                <div className="text-right shrink-0">
                  <p className="text-muted-foreground text-sm">
                    Posted {timeAgo(listing.createdAt)}
                  </p>
                  {listing.savedCount !== undefined && listing.savedCount > 0 && (
                    <p className="flex items-center justify-end gap-1 text-muted-foreground text-sm mt-0.5">
                      <Heart className="w-3.5 h-3.5" />
                      Saved by {listing.savedCount} students
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {/* ── Bottom action bar ── */}
      {listing && !loading && (
        <div className="fixed bottom-0 left-0 right-0 bg-card border-t border-border px-6 py-4 flex gap-3">
          <button
            onClick={handleEdit}
            className="flex-1 rounded-2xl border border-border py-3.5 font-bold text-foreground flex items-center justify-center gap-2"
          >
            <Pencil className="w-4 h-4" />
            Edit listing
          </button>
          <button
            onClick={handleMarkAsSold}
            disabled={isSold || markingAsSold}
            className={`flex-1 rounded-2xl py-3.5 font-bold flex items-center justify-center gap-2 transition ${
              isSold
                ? "bg-muted text-muted-foreground cursor-not-allowed"
                : "bg-primary text-primary-foreground"
            }`}
          >
            {markingAsSold && <Loader2 className="w-4 h-4 animate-spin" />}
            {isSold ? "Sold" : "Mark as sold"}
          </button>
        </div>
      )}

      {/* ── Report sheet ── */}
      {showReport && listing && (
        <ReportSheet
          listingId={listing.id}
          targetType="listing"
          onClose={() => setShowReport(false)}
        />
      )}
    </div>
  );
}
