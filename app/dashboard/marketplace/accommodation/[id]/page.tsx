"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  MapPin,
  MessageCircle,
  Pencil,
  Home,
  Loader2,
  AlertTriangle,
  ShieldCheck,
} from "lucide-react";
import { marketplaceApi } from "@/lib/api/marketplace";
import BackButton from "@/components/shared/BackButton";
import BottomNav from "@/components/shared/BottomNav";

type AccomType = "SELF_CONTAIN" | "ROOM_AND_PARLOUR" | "SINGLE_ROOM" | "SHARED_ROOM" | "HOSTEL" | "FLAT" | "OTHER";

interface Accommodation {
  id:           string;
  title:        string;
  type:         AccomType;
  price:        number;
  period?:      string;
  location:     string;
  description?: string;
  images?:      string[];
  whatsapp?:    string;
  isAvailable?: boolean;
  status?:      string;
  poster?:      { id: string; fullName: string };
  createdAt:    string;
}

const TYPE_BADGE: Record<AccomType, string> = {
  SELF_CONTAIN:     "bg-emerald-100 text-emerald-700",
  ROOM_AND_PARLOUR: "bg-blue-100 text-blue-700",
  SINGLE_ROOM:      "bg-violet-100 text-violet-700",
  SHARED_ROOM:      "bg-amber-100 text-amber-700",
  HOSTEL:           "bg-accent text-primary",
  FLAT:             "bg-pink-100 text-pink-700",
  OTHER:            "bg-muted text-muted-foreground",
};

function formatPrice(price: number, period?: string): string {
  return `₦${price.toLocaleString("en-NG")} / ${period ?? "year"}`;
}

export default function AccommodationDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id     = params?.id as string;

  const [item,    setItem]    = useState<Accommodation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("auth_user");
      if (stored) setCurrentUserId(JSON.parse(stored)?.id ?? null);
    } catch {}
  }, []);

  useEffect(() => {
    if (!id) return;
    marketplaceApi.getAccommodationItem(id)
      .then((a) => setItem(a as Accommodation))
      .catch((e: any) => setError(e.message || "Failed to load accommodation."))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return (
    <div className="min-h-screen bg-muted flex items-center justify-center">
      <Loader2 className="w-8 h-8 text-primary animate-spin" />
    </div>
  );

  if (error || !item) return (
    <div className="min-h-screen bg-muted flex flex-col items-center justify-center gap-4 px-6">
      <AlertTriangle className="w-12 h-12 text-destructive" />
      <p className="text-muted-foreground font-medium text-center">{error ?? "Accommodation not found."}</p>
      <BackButton variant="text" label="Go back" />
    </div>
  );

  return (
    <div className="min-h-screen bg-muted flex flex-col pb-24">
      {/* Hero image */}
      <div className="relative h-56 shrink-0">
        {item.images?.[0] ? (
          <img src={item.images[0]} alt={item.title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-emerald-50 flex items-center justify-center">
            <Home className="w-16 h-16 text-emerald-200" />
          </div>
        )}
        <div className="absolute top-5 left-4">
          <BackButton />
        </div>
        {currentUserId && item?.poster?.id === currentUserId && (
        <button
          onClick={() => router.push(`/dashboard/marketplace/accommodation/${id}/edit`)}
          className="absolute top-5 right-4 w-11 h-11 rounded-2xl bg-card shadow-sm flex items-center justify-center"
          aria-label="Edit listing"
        >
          <Pencil className="w-4 h-4 text-foreground" />
        </button>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 bg-card rounded-t-3xl -mt-4 px-5 pt-6 pb-8">
        {item.status && item.status !== "APPROVED" && (
          <span className={`inline-block text-xs font-bold px-2.5 py-1 rounded-lg mb-3 ${
            item.status === "PENDING" ? "bg-amber-100 text-amber-700" : "bg-destructive/10 text-destructive"
          }`}>
            {item.status}
          </span>
        )}

        <div className="flex items-start justify-between mb-2">
          <h1 className="text-2xl font-bold text-foreground flex-1 pr-3">{item.title}</h1>
          <span className={`text-sm font-bold px-2.5 py-1.5 rounded-xl shrink-0 ${TYPE_BADGE[item.type] ?? "bg-muted text-muted-foreground"}`}>
            {item.type.replace(/_/g, " ")}
          </span>
        </div>

        <p className="text-2xl font-bold text-primary mb-4">{formatPrice(item.price, item.period)}</p>

        <div className="flex items-center gap-2 mb-4 text-muted-foreground">
          <MapPin className="w-4 h-4 shrink-0" />
          <span className="text-sm font-medium">{item.location}</span>
        </div>

        {item.description && (
          <p className="text-foreground text-sm leading-relaxed mb-5">{item.description}</p>
        )}

        {item.isAvailable === false && (
          <div className="flex items-center gap-2 bg-destructive/10 rounded-xl px-4 py-3 mb-5 text-sm text-destructive font-medium">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            This accommodation is no longer available.
          </div>
        )}

        {item.poster && (
          <div className="flex items-center gap-2 mb-5 text-sm text-muted-foreground">
            <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
            <span>Listed by <span className="font-semibold text-foreground">{item.poster.fullName}</span></span>
          </div>
        )}

        {item.whatsapp && (
          <a
            href={`https://wa.me/${item.whatsapp.replace(/\D/g, "")}`}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full rounded-2xl bg-emerald-500 py-4 font-bold text-white flex items-center justify-center gap-2 active:opacity-90 transition mb-3"
          >
            <MessageCircle className="w-5 h-5" /> Contact via WhatsApp
          </a>
        )}

        <button
          onClick={() => router.push(`/dashboard/marketplace/accommodation/${id}/edit`)}
          className="w-full rounded-2xl border border-border py-3.5 font-semibold text-foreground flex items-center justify-center gap-2 active:bg-muted transition"
        >
          <Pencil className="w-4 h-4" /> Edit Listing
        </button>
      </div>

      <BottomNav />
    </div>
  );
}
