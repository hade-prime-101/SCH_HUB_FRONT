"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import BottomNav from "@/components/shared/BottomNav";
import BackButton from "@/components/shared/BackButton";
import PullToRefresh from "@/components/shared/PullToRefresh";
import { marketplaceApi } from "@/lib/api/marketplace";
import {
  ShoppingBag,
  Store,
  Home,
  Users,
  Briefcase,
  Wrench,
  Heart,
  MapPinOff,
  MapPin,
  Star,
  Plus,
  RefreshCw,
  ChevronRight,
  Image as ImageIcon,
  User,
} from "lucide-react";
import RefreshButton from "@/components/shared/RefreshButton";

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
  seller?: { id: string; fullName: string };
}

interface Accommodation {
  id: string;
  title: string;
  location?: string;
  price?: number;
  pricePerYear?: number;
  distanceFromCampus?: string;
  createdAt: string;
}

interface Roommate {
  id: string;
  budgetMin?: number;
  budgetMax?: number;
  user?: { fullName: string; department?: string; level?: string };
  createdAt: string;
}

interface Job {
  id: string;
  title: string;
  companyName?: string;
  salary?: string;
  jobType?: string;
  type?: string;
  createdAt: string;
}

interface Shop {
  id: string;
  name: string;
  category?: string;
  averageRating?: number;
}

interface Service {
  id: string;
  title: string;
  startingPrice?: number;
  price?: number;
  provider?: { fullName: string };
  createdAt: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const CATEGORY_CARDS = [
  { label: "Listings",      href: "/dashboard/marketplace/listings",        icon: ShoppingBag, bg: "bg-orange-100", fg: "text-orange-600" },
  { label: "Shops",         href: "/dashboard/marketplace/shops",           icon: Store,       bg: "bg-blue-100",   fg: "text-blue-600"   },
  { label: "Accommodation", href: "/dashboard/marketplace/accommodation",   icon: Home,        bg: "bg-emerald-100",fg: "text-emerald-600" },
  { label: "Roommates",     href: "/dashboard/marketplace/roommates",       icon: Users,       bg: "bg-violet-100", fg: "text-violet-600" },
  { label: "Jobs",          href: "/dashboard/marketplace/jobs",            icon: Briefcase,   bg: "bg-sky-100",    fg: "text-sky-600"    },
  { label: "Services",      href: "/dashboard/marketplace/services",        icon: Wrench,      bg: "bg-pink-100",   fg: "text-pink-600"   },
  { label: "Saved",         href: "/dashboard/marketplace/saved",           icon: Heart,       bg: "bg-amber-100",  fg: "text-amber-600"  },
  { label: "Lost & Found",  href: "/dashboard/marketplace/lost-found",      icon: MapPinOff,   bg: "bg-gray-100",   fg: "text-gray-600"   },
];

const CONDITION_BADGE: Record<ListingCondition, string> = {
  NEW:      "bg-emerald-100 text-emerald-700",
  LIKE_NEW: "bg-accent text-primary",
  GOOD:     "bg-muted text-muted-foreground",
  FAIR:     "bg-amber-100 text-amber-700",
};

const JOB_TYPE_BADGE: Record<string, string> = {
  "PART_TIME": "bg-amber-100 text-amber-700",
  "FULL_TIME": "bg-emerald-100 text-emerald-700",
  "REMOTE":    "bg-sky-100 text-sky-700",
  "CONTRACT":  "bg-violet-100 text-violet-700",
};

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

function getInitials(name?: string) {
  if (!name) return "?";
  return name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
}

function normalize<T>(val: unknown): T[] {
  if (Array.isArray(val)) return val as T[];
  const obj = val as Record<string, unknown>;
  for (const key of ["data", "listings", "accommodation", "roommates", "jobs", "shops", "services"]) {
    if (Array.isArray(obj?.[key])) return obj[key] as T[];
  }
  return [];
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function Skeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse rounded-xl bg-muted ${className}`} />;
}

// ─── Section Header ───────────────────────────────────────────────────────────

function SectionHeader({ title, href }: { title: string; href: string }) {
  return (
    <div className="flex items-center justify-between mb-3">
      <h2 className="text-base font-bold text-foreground">{title}</h2>
      <Link href={href} className="flex items-center gap-0.5 text-xs font-semibold text-primary">
        See all <ChevronRight className="w-3.5 h-3.5" />
      </Link>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function MarketplaceHubPage() {
  const [listings,      setListings]      = useState<Listing[]>([]);
  const [accommodation, setAccommodation] = useState<Accommodation[]>([]);
  const [roommates,     setRoommates]     = useState<Roommate[]>([]);
  const [jobs,          setJobs]          = useState<Job[]>([]);
  const [shops,         setShops]         = useState<Shop[]>([]);
  const [services,      setServices]      = useState<Service[]>([]);
  const [loading,       setLoading]       = useState(true);
  const [refreshing,    setRefreshing]    = useState(false);

  async function fetchAll(isRefresh = false) {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    const [listRes, accomRes, roommateRes, jobRes, shopRes, svcRes] =
      await Promise.allSettled([
        marketplaceApi.getListings({ limit: "4" }),
        marketplaceApi.getAccommodation({ limit: "3" }),
        marketplaceApi.getRoommates({ limit: "4" }),
        marketplaceApi.getJobs({ limit: "3" }),
        // shops — no list endpoint, use getShop fallback gracefully
        Promise.resolve([]),
        marketplaceApi.getServices({ limit: "4" }),
      ]);

    const get = <T,>(r: PromiseSettledResult<unknown>): T[] =>
      r.status === "fulfilled" ? normalize<T>(r.value) : [];

    setListings(     get<Listing>(listRes).slice(0, 4));
    setAccommodation(get<Accommodation>(accomRes).slice(0, 3));
    setRoommates(    get<Roommate>(roommateRes).slice(0, 4));
    setJobs(         get<Job>(jobRes).slice(0, 3));
    setShops(        get<Shop>(shopRes).slice(0, 4));
    setServices(     get<Service>(svcRes).slice(0, 4));

    setLoading(false);
    setRefreshing(false);
  }

  useEffect(() => { fetchAll(); }, []);

  // ── Loading skeleton ─────────────────────────────────────────────────────

  if (loading) {
    return (
      <>
      <div className="min-h-screen bg-muted px-4 pt-4 pb-24">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <Skeleton className="w-11 h-11 rounded-2xl" />
            <Skeleton className="w-40 h-8" />
          </div>
          <Skeleton className="w-10 h-10 rounded-full" />
        </div>
        <div className="grid grid-cols-4 gap-3 mb-7">
          {[...Array(8)].map((_, i) => <Skeleton key={i} className="h-20" />)}
        </div>
        <Skeleton className="w-32 h-5 mb-3" />
        <div className="flex gap-3 mb-7">
          {[...Array(3)].map((_, i) => <Skeleton key={i} className="min-w-[140px] h-44" />)}
        </div>
        <Skeleton className="w-32 h-5 mb-3" />
        <div className="flex flex-col gap-3 mb-7">
          {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-20" />)}
        </div>
      </div>
      <BottomNav />
      </>
    );
  }

  return (
    <>
    <PullToRefresh onRefresh={() => fetchAll(true)} className="min-h-screen">
    <div className="min-h-screen bg-muted px-4 pt-4 pb-24 relative">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <BackButton href="/dashboard" />
          <div>
            <p className="text-xs font-bold tracking-widest text-muted-foreground uppercase">SCH Hub</p>
            <h1 className="text-2xl font-bold text-foreground">Marketplace</h1>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/dashboard/marketplace/saved"
            aria-label="Saved listings"
            className="w-10 h-10 rounded-full bg-card flex items-center justify-center shadow-sm"
          >
            <Heart className="w-5 h-5 text-foreground" />
          </Link>
          <RefreshButton onClick={() => fetchAll(true)} loading={refreshing} />
        </div>
      </div>

      {/* ── Category grid ── */}
      <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-3">Browse</p>
      <div className="grid grid-cols-4 gap-3 mb-7">
        {CATEGORY_CARDS.map(({ label, href, icon: Icon, bg, fg }) => (
          <Link
            key={label}
            href={href}
            className="bg-card border border-border rounded-2xl p-2.5 flex flex-col items-center gap-1.5 active:scale-95 transition-transform"
          >
            <div className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center`}>
              <Icon className={`w-5 h-5 ${fg}`} />
            </div>
            <span className="text-[10px] font-semibold text-foreground text-center leading-tight">
              {label}
            </span>
          </Link>
        ))}
      </div>

      {/* ── Featured Listings ── */}
      <SectionHeader title="Featured Listings" href="/dashboard/marketplace/listings" />
      {listings.length === 0 ? (
        <p className="text-sm text-muted-foreground mb-7">No listings yet.</p>
      ) : (
        <div className="flex gap-3 overflow-x-auto -mx-4 px-4 pb-1 mb-7 scrollbar-none">
          {listings.map((item) => {
            const condStyle = CONDITION_BADGE[item.condition] ?? "bg-muted text-muted-foreground";
            return (
              <Link
                key={item.id}
                href={`/dashboard/marketplace/${item.id}`}
                className="min-w-[140px] max-w-[140px] bg-card rounded-2xl overflow-hidden flex-shrink-0 shadow-sm active:scale-95 transition-transform"
              >
                <div className="relative h-24 bg-muted flex items-center justify-center">
                  <ImageIcon className="w-6 h-6 text-muted-foreground/30" />
                </div>
                <div className="p-3">
                  <span className={`inline-block text-[10px] font-semibold rounded-full px-2 py-0.5 mb-1 ${condStyle}`}>
                    {item.condition.replace("_", " ")}
                  </span>
                  <p className="text-xs font-semibold text-foreground leading-snug line-clamp-2">
                    {item.title}
                  </p>
                  <p className="text-sm font-bold text-foreground mt-1">{formatPrice(item.price)}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{timeAgo(item.createdAt)}</p>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {/* ── Available Accommodation ── */}
      <SectionHeader title="Available Rooms" href="/dashboard/marketplace/accommodation" />
      {accommodation.length === 0 ? (
        <p className="text-sm text-muted-foreground mb-7">No listings yet.</p>
      ) : (
        <div className="flex gap-3 overflow-x-auto -mx-4 px-4 pb-1 mb-7 scrollbar-none">
          {accommodation.map((room) => {
            const price = room.pricePerYear ?? room.price;
            return (
              <Link
                key={room.id}
                href={`/dashboard/marketplace/accommodation/${room.id}`}
                className="min-w-[160px] max-w-[160px] bg-card rounded-2xl overflow-hidden flex-shrink-0 shadow-sm active:scale-95 transition-transform"
              >
                <div className="h-24 bg-emerald-50 flex items-center justify-center">
                  <Home className="w-6 h-6 text-emerald-300" />
                </div>
                <div className="p-3">
                  <p className="text-xs font-semibold text-foreground leading-snug line-clamp-2">
                    {room.title}
                  </p>
                  {room.location && (
                    <div className="flex items-center gap-1 mt-1">
                      <MapPin className="w-3 h-3 text-muted-foreground shrink-0" />
                      <p className="text-[10px] text-muted-foreground truncate">{room.location}</p>
                    </div>
                  )}
                  {price != null && (
                    <p className="text-sm font-bold text-foreground mt-1.5">
                      {formatPrice(price)}/yr
                    </p>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {/* ── Find a Roommate ── */}
      <SectionHeader title="Find a Roommate" href="/dashboard/marketplace/roommates" />
      {roommates.length === 0 ? (
        <p className="text-sm text-muted-foreground mb-7">No roommate posts yet.</p>
      ) : (
        <div className="flex gap-3 overflow-x-auto -mx-4 px-4 pb-1 mb-7 scrollbar-none">
          {roommates.map((r) => {
            const name = r.user?.fullName;
            const detail = [r.user?.level ? `${r.user.level}L` : null, r.user?.department]
              .filter(Boolean).join(" · ");
            const budget = (r.budgetMin != null && r.budgetMax != null)
              ? `${formatPrice(r.budgetMin)}–${formatPrice(r.budgetMax)}`
              : null;
            return (
              <Link
                key={r.id}
                href="/dashboard/marketplace/roommates"
                className="min-w-[120px] max-w-[120px] bg-card rounded-2xl p-3 flex flex-col items-center text-center flex-shrink-0 shadow-sm active:scale-95 transition-transform"
              >
                <div className="w-12 h-12 rounded-full bg-violet-100 flex items-center justify-center mb-2">
                  {name
                    ? <span className="text-sm font-bold text-violet-600">{getInitials(name)}</span>
                    : <User className="w-5 h-5 text-violet-500" />
                  }
                </div>
                <p className="text-xs font-semibold text-foreground leading-tight line-clamp-1">
                  {name ?? "Anonymous"}
                </p>
                {detail && (
                  <p className="text-[10px] text-muted-foreground mt-0.5 line-clamp-1">{detail}</p>
                )}
                {budget && (
                  <span className="text-[10px] font-medium text-foreground bg-muted rounded-full px-2 py-0.5 mt-1.5">
                    {budget}
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      )}

      {/* ── Latest Jobs ── */}
      <SectionHeader title="Latest Job Postings" href="/dashboard/marketplace/jobs" />
      {jobs.length === 0 ? (
        <p className="text-sm text-muted-foreground mb-7">No jobs posted yet.</p>
      ) : (
        <div className="flex flex-col gap-3 mb-7">
          {jobs.map((job) => {
            const type = job.jobType ?? job.type ?? "";
            const badgeStyle = JOB_TYPE_BADGE[type] ?? "bg-muted text-muted-foreground";
            return (
              <Link
                key={job.id}
                href={`/dashboard/marketplace/jobs/${job.id}`}
                className="bg-card rounded-2xl p-4 flex items-center gap-3 shadow-sm active:scale-[0.99] transition-transform"
              >
                <div className="w-11 h-11 rounded-xl bg-sky-100 flex items-center justify-center shrink-0">
                  <Briefcase className="w-5 h-5 text-sky-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground truncate">{job.title}</p>
                  {(job.companyName || job.salary) && (
                    <p className="text-xs text-muted-foreground mt-0.5 truncate">
                      {[job.companyName, job.salary].filter(Boolean).join(" · ")}
                    </p>
                  )}
                </div>
                <div className="flex flex-col items-end gap-1 shrink-0">
                  {type && (
                    <span className={`text-[10px] font-semibold rounded-full px-2 py-0.5 ${badgeStyle}`}>
                      {type.replace("_", "-")}
                    </span>
                  )}
                  <span className="text-[10px] text-muted-foreground">{timeAgo(job.createdAt)}</span>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {/* ── Nearby Shops ── */}
      <SectionHeader title="Nearby Shops" href="/dashboard/marketplace/shops" />
      {shops.length === 0 ? (
        <p className="text-sm text-muted-foreground mb-7">No shops registered yet.</p>
      ) : (
        <div className="flex gap-3 overflow-x-auto -mx-4 px-4 pb-1 mb-7 scrollbar-none">
          {shops.map((shop) => (
            <Link
              key={shop.id}
              href={`/dashboard/marketplace/shops/${shop.id}`}
              className="min-w-[120px] max-w-[120px] bg-card rounded-2xl p-3 flex flex-col items-center text-center flex-shrink-0 shadow-sm active:scale-95 transition-transform"
            >
              <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center mb-2">
                <Store className="w-5 h-5 text-blue-600" />
              </div>
              <p className="text-xs font-semibold text-foreground leading-tight line-clamp-2">
                {shop.name}
              </p>
              {shop.category && (
                <p className="text-[10px] text-muted-foreground mt-0.5">{shop.category}</p>
              )}
              {shop.averageRating != null && (
                <div className="flex items-center gap-0.5 mt-1.5">
                  <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                  <span className="text-[10px] font-medium text-foreground">
                    {shop.averageRating.toFixed(1)}
                  </span>
                </div>
              )}
            </Link>
          ))}
        </div>
      )}

      {/* ── Popular Services ── */}
      <SectionHeader title="Popular Services" href="/dashboard/marketplace/services" />
      {services.length === 0 ? (
        <p className="text-sm text-muted-foreground mb-7">No services listed yet.</p>
      ) : (
        <div className="flex gap-3 overflow-x-auto -mx-4 px-4 pb-1 mb-7 scrollbar-none">
          {services.map((svc) => {
            const price = svc.startingPrice ?? svc.price;
            return (
              <Link
                key={svc.id}
                href={`/dashboard/marketplace/services/${svc.id}`}
                className="min-w-[130px] max-w-[130px] bg-card rounded-2xl p-3 flex-shrink-0 shadow-sm active:scale-95 transition-transform"
              >
                <div className="w-9 h-9 rounded-xl bg-pink-100 flex items-center justify-center mb-2">
                  <Wrench className="w-4 h-4 text-pink-600" />
                </div>
                <p className="text-xs font-semibold text-foreground leading-tight line-clamp-2">
                  {svc.title}
                </p>
                {svc.provider?.fullName && (
                  <p className="text-[10px] text-muted-foreground mt-0.5 line-clamp-1">
                    {svc.provider.fullName}
                  </p>
                )}
                {price != null && (
                  <p className="text-xs font-bold text-foreground mt-1">
                    from {formatPrice(price)}
                  </p>
                )}
              </Link>
            );
          })}
        </div>
      )}

      {/* FAB */}
      <Link
        href="/dashboard/marketplace/listings/create"
        className="fixed bottom-24 right-6 flex items-center gap-2 bg-primary text-primary-foreground font-semibold rounded-full px-5 py-3.5 shadow-lg active:scale-95 transition z-10"
        aria-label="Sell something"
      >
        <Plus className="w-5 h-5" /> Sell something
      </Link>

    </div>
    </PullToRefresh>
    <BottomNav />
    </>
  );
}
