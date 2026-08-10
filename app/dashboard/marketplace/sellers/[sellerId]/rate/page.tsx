"use client";

import { useState } from "react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import { Star, Loader2, CheckCircle2, X } from "lucide-react";
import BackButton from "@/components/shared/BackButton";
import { marketplaceApi } from "@/lib/api/marketplace";

export default function RateSellerPage() {
  const router       = useRouter();
  const params       = useParams();
  const searchParams = useSearchParams();
  const sellerId     = params?.sellerId as string;
  const sellerName   = searchParams.get("sellerName") ?? "This Seller";

  const [rating,  setRating]  = useState(0);
  const [hovered, setHovered] = useState(0);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error,   setError]   = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (rating === 0) { setError("Please select a star rating."); return; }
    setLoading(true); setError(null);
    try {
      await marketplaceApi.rateSeller(sellerId, rating, comment.trim() || undefined);
      setSuccess(true);
      setTimeout(() => router.back(), 2000);
    } catch (e: any) { setError(e.message || "Failed to submit rating."); }
    finally { setLoading(false); }
  }

  const display = hovered || rating;

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-white px-4 pt-5 pb-4 flex items-center gap-3 border-b border-slate-100">
        <BackButton />
        <h1 className="text-xl font-bold text-slate-900">Rate Seller</h1>
      </div>

      <form onSubmit={handleSubmit} className="px-4 py-5 max-w-lg mx-auto flex flex-col gap-5">

        {/* Seller name */}
        <div className="bg-white rounded-2xl shadow-sm px-5 py-5 text-center">
          <div className="w-16 h-16 rounded-full bg-indigo-100 flex items-center justify-center mx-auto mb-3">
            <span className="text-2xl font-bold text-indigo-600">{sellerName.charAt(0).toUpperCase()}</span>
          </div>
          <h2 className="text-lg font-bold text-slate-900">{sellerName}</h2>
          <p className="text-sm text-slate-400 mt-0.5">How was your experience?</p>
        </div>

        {/* Error */}
        {error && (
          <div className="flex items-center justify-between bg-rose-50 text-rose-600 rounded-2xl px-4 py-3 text-sm font-medium">
            <span>{error}</span>
            <button type="button" onClick={() => setError(null)}><X className="w-4 h-4" /></button>
          </div>
        )}

        {/* Success */}
        {success && (
          <div className="flex items-center gap-3 bg-emerald-50 text-emerald-700 rounded-2xl px-4 py-3 text-sm font-medium">
            <CheckCircle2 className="w-5 h-5 shrink-0" />
            <span>Rating submitted! Redirecting…</span>
          </div>
        )}

        {/* Star picker */}
        <div className="bg-white rounded-2xl shadow-sm px-5 py-6 flex flex-col items-center gap-3">
          <p className="text-sm font-semibold text-slate-700">
            {display === 0 ? "Tap to rate" : ["", "Poor", "Fair", "Good", "Very Good", "Excellent"][display]}
          </p>
          <div className="flex items-center gap-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onMouseEnter={() => setHovered(star)}
                onMouseLeave={() => setHovered(0)}
                onClick={() => { setRating(star); setError(null); }}
                aria-label={`${star} star${star !== 1 ? "s" : ""}`}
                className="p-1 transition active:scale-110"
              >
                <Star
                  className={`w-9 h-9 transition-colors ${star <= display ? "text-amber-400 fill-amber-400" : "text-slate-200"}`}
                />
              </button>
            ))}
          </div>
        </div>

        {/* Comment */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-semibold text-slate-700">Comment (optional)</label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value.slice(0, 500))}
            placeholder="Share more about your experience…"
            rows={4}
            className="px-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 resize-none"
          />
          <p className="text-xs text-slate-400 text-right">{comment.length}/500</p>
        </div>

        <button
          type="submit"
          disabled={loading || success || rating === 0}
          className="w-full rounded-2xl bg-indigo-500 py-4 font-bold text-white shadow-lg shadow-indigo-100 flex items-center justify-center gap-2 disabled:opacity-50 transition active:opacity-90"
        >
          {loading ? <><Loader2 className="w-5 h-5 animate-spin" /> Submitting…</> : "Submit Rating"}
        </button>
      </form>
    </div>
  );
}
