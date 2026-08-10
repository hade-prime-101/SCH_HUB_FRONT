"use client";

import { useState, useEffect, useCallback } from "react";
import BottomNav from "@/components/shared/BottomNav";
import { useRouter } from "next/navigation";
import {
  ChevronDown, HelpCircle, Loader2, AlertTriangle,
  ArrowLeft, Search, X, RefreshCw,
} from "lucide-react";
import { communityApi } from "@/lib/api/community";

interface Faq {
  id: string;
  question: string;
  answer: string;
  category: string;
  createdAt: string;
}

export default function FaqsPage() {
  const router = useRouter();

  const [faqs, setFaqs]                     = useState<Faq[]>([]);
  const [loading, setLoading]               = useState(true);
  const [error, setError]                   = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState("All");
  const [search, setSearch]                 = useState("");
  const [openId, setOpenId]                 = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const data = await communityApi.getFaqs();
      setFaqs(Array.isArray(data) ? data : []);
    } catch (e: any) {
      setError(e.message || "Failed to load FAQs.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const categories = ["All", ...Array.from(new Set(faqs.map(f => f.category).filter(Boolean)))];

  const filtered = faqs.filter(f => {
    const matchCat    = activeCategory === "All" || f.category === activeCategory;
    const matchSearch = !search.trim() ||
      f.question.toLowerCase().includes(search.toLowerCase()) ||
      f.answer.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  return (
    <div className="min-h-screen w-full bg-background px-6 py-6 pb-24">

      {/* Header */}
      <div className="flex items-center gap-3 mb-5">
        <button onClick={() => router.back()} aria-label="Go back">
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-foreground">FAQs</h1>
          <p className="text-muted-foreground text-sm">Frequently asked questions</p>
        </div>
      </div>

      {/* Search */}
      <div className="flex items-center gap-2 bg-muted rounded-2xl px-4 py-3 mb-4">
        <Search className="w-4 h-4 text-muted-foreground shrink-0" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search FAQs…"
          className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
        />
        {search && (
          <button onClick={() => setSearch("")} aria-label="Clear">
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        )}
      </div>

      {/* Category filter */}
      {!loading && faqs.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-2 mb-5 scrollbar-none">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`shrink-0 text-xs font-bold px-3 py-2 rounded-xl transition ${
                activeCategory === cat
                  ? "bg-primary text-primary-foreground"
                  : "bg-card text-muted-foreground border border-border"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <AlertTriangle className="w-10 h-10 text-destructive" />
          <p className="text-destructive font-medium text-center">{error}</p>
          <button onClick={load} className="flex items-center gap-1.5 text-primary text-sm font-semibold">
            <RefreshCw className="w-4 h-4" /> Retry
          </button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-2">
          <HelpCircle className="w-10 h-10 text-muted-foreground" />
          <p className="text-muted-foreground font-medium">
            {search ? "No FAQs match your search" : "No FAQs yet"}
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {filtered.map(faq => {
            const isOpen = openId === faq.id;
            return (
              <div key={faq.id} className="bg-card rounded-2xl border border-border overflow-hidden">
                <button
                  onClick={() => setOpenId(isOpen ? null : faq.id)}
                  className="w-full flex items-center justify-between px-5 py-4 text-left"
                  aria-expanded={isOpen}
                >
                  <span className="font-semibold text-foreground flex-1 pr-3">{faq.question}</span>
                  <ChevronDown className={`w-5 h-5 text-muted-foreground shrink-0 transition-transform ${isOpen ? "rotate-180" : ""}`} />
                </button>
                {isOpen && (
                  <div className="px-5 pb-5 border-t border-border">
                    <p className="text-muted-foreground mt-3 leading-relaxed">{faq.answer}</p>
                    {faq.category && (
                      <span className="inline-block mt-3 bg-muted text-muted-foreground text-xs rounded-lg px-2 py-1 font-bold">
                        {faq.category}
                      </span>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <BottomNav />
    </div>
  );
}
