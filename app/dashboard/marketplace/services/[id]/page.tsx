"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  MessageCircle,
  Pencil,
  Loader2,
  AlertTriangle,
  Tag,
  User,
  DollarSign,
} from "lucide-react";
import { marketplaceApi } from "@/lib/api/marketplace";
import BackButton from "@/components/shared/BackButton";
import BottomNav from "@/components/shared/BottomNav";

type ServiceCategory = "TUTORING" | "GRAPHICS" | "CODING" | "PHOTOGRAPHY" | "PRINTING" | "LAUNDRY" | "FOOD" | "DELIVERY" | "OTHER";

interface ServiceItem {
  id:           string;
  title:        string;
  description?: string;
  category:     ServiceCategory;
  images?:      string[];
  whatsapp?:    string;
  price?:       number | string;
  priceNote?:   string;
  isActive?:    boolean;
  status?:      string;
  poster?:      { id: string; fullName: string };
  createdAt:    string;
}

const CAT_BADGE: Record<ServiceCategory, string> = {
  TUTORING:    "bg-blue-100 text-blue-700",
  GRAPHICS:    "bg-violet-100 text-violet-700",
  CODING:      "bg-accent text-primary",
  PHOTOGRAPHY: "bg-pink-100 text-pink-700",
  PRINTING:    "bg-amber-100 text-amber-700",
  LAUNDRY:     "bg-emerald-100 text-emerald-700",
  FOOD:        "bg-orange-100 text-orange-700",
  DELIVERY:    "bg-teal-100 text-teal-700",
  OTHER:       "bg-muted text-muted-foreground",
};

export default function ServiceDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id     = params?.id as string;

  const [item,    setItem]    = useState<ServiceItem | null>(null);
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
    marketplaceApi.getService(id)
      .then((s) => setItem(s as ServiceItem))
      .catch((e: any) => setError(e.message || "Failed to load service."))
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
      <p className="text-muted-foreground font-medium text-center">{error ?? "Service not found."}</p>
      <BackButton variant="text" label="Go back" />
    </div>
  );

  return (
    <div className="min-h-screen bg-muted pb-24">
      {/* Header */}
      <div className="bg-card px-4 pt-5 pb-4 flex items-center gap-3 border-b border-border">
        <BackButton />
        <h1 className="text-xl font-bold text-foreground flex-1 truncate">Service Details</h1>
        {currentUserId && item?.poster?.id === currentUserId && (
        <button
          onClick={() => router.push(`/dashboard/marketplace/services/${id}/edit`)}
          className="w-11 h-11 rounded-2xl bg-muted flex items-center justify-center shrink-0"
          aria-label="Edit service"
        >
          <Pencil className="w-4 h-4 text-foreground" />
        </button>
        )}
      </div>

      <div className="px-4 py-5 max-w-lg mx-auto flex flex-col gap-4">
        {/* Images */}
        {item.images && item.images.length > 0 && (
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
            {item.images.slice(0, 5).map((url, i) => (
              <img key={i} src={url} alt="" className="h-32 w-32 rounded-2xl object-cover shrink-0" />
            ))}
          </div>
        )}

        {/* Title + badge */}
        <div className="bg-card rounded-2xl shadow-sm px-5 py-4">
          {item.status && item.status !== "APPROVED" && (
            <span className={`inline-block text-xs font-bold px-2.5 py-1 rounded-lg mb-2 ${
              item.status === "PENDING" ? "bg-amber-100 text-amber-700" : "bg-destructive/10 text-destructive"
            }`}>
              {item.status}
            </span>
          )}
          <div className="flex items-start justify-between gap-3 mb-3">
            <h2 className="text-xl font-bold text-foreground flex-1">{item.title}</h2>
            <span className={`text-xs font-bold px-2.5 py-1.5 rounded-xl shrink-0 ${CAT_BADGE[item.category] ?? "bg-muted text-muted-foreground"}`}>
              {item.category}
            </span>
          </div>

          {(item.price != null || item.priceNote) && (
            <div className="flex items-center gap-2 mb-3">
              <DollarSign className="w-4 h-4 text-muted-foreground shrink-0" />
              <p className="font-bold text-primary text-lg">
                {item.price != null ? `₦${Number(item.price).toLocaleString()}` : ""}
                {item.priceNote && (
                  <span className="text-sm font-medium text-muted-foreground ml-1">{item.priceNote}</span>
                )}
              </p>
            </div>
          )}

          {item.poster && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <User className="w-4 h-4 shrink-0" />
              <span>By <span className="font-semibold text-foreground">{item.poster.fullName}</span></span>
            </div>
          )}
        </div>

        {/* Description */}
        {item.description && (
          <div className="bg-card rounded-2xl shadow-sm px-5 py-4">
            <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-2">About</h3>
            <p className="text-foreground text-sm leading-relaxed">{item.description}</p>
          </div>
        )}

        {/* CTA */}
        {item.whatsapp && (
          <a
            href={`https://wa.me/${item.whatsapp.replace(/\D/g, "")}`}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full rounded-2xl bg-emerald-500 py-4 font-bold text-white flex items-center justify-center gap-2 active:opacity-90 transition"
          >
            <MessageCircle className="w-5 h-5" /> Contact via WhatsApp
          </a>
        )}

        <button
          onClick={() => router.push(`/dashboard/marketplace/services/${id}/edit`)}
          className="w-full rounded-2xl border border-border py-3.5 font-semibold text-foreground flex items-center justify-center gap-2 active:bg-muted transition"
        >
          <Pencil className="w-4 h-4" /> Edit Listing
        </button>
      </div>

      <BottomNav />
    </div>
  );
}
