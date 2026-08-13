"use client";

import { useEffect, useState, useCallback } from "react";
import { marketplaceApi } from "@/lib/api/marketplace.api";
import { ShoppingBag, Store, Trash2, AlertCircle, Search, ChevronLeft, ChevronRight, ShieldCheck, ExternalLink } from "lucide-react";

interface Listing {
  id: string;
  title: string;
  price: number;
  category: string;
  condition?: string;
  isAvailable?: boolean;
  seller?: { fullName: string };
  createdAt: string;
}

interface Shop {
  id: string;
  name: string;
  description?: string;
  isActive?: boolean;
  owner?: { fullName: string };
  followerCount?: number;
  listingCount?: number;
}

type Tab = "listings" | "shops";

const CAT_BADGE: Record<string, string> = {
  BOOKS:       "bg-accent text-primary",
  ELECTRONICS: "bg-violet-100 text-violet-700",
  CLOTHING:    "bg-pink-100 text-pink-700",
  FOOD:        "bg-amber-100 text-amber-700",
  FURNITURE:   "bg-orange-100 text-orange-700",
  HANDOUTS:    "bg-indigo-100 text-indigo-700",
  SERVICES:    "bg-emerald-100 text-emerald-700",
  OTHER:       "bg-muted text-muted-foreground",
};

export default function AdminMarketplacePage() {
  const [tab, setTab]           = useState<Tab>("listings");
  const [listings, setListings] = useState<Listing[]>([]);
  const [shops, setShops]       = useState<Shop[]>([]);
  const [total, setTotal]       = useState(0);
  const [page, setPage]         = useState(1);
  const [search, setSearch]     = useState("");
  const [query, setQuery]       = useState("");
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState<string | null>(null);
  const [actionId, setActionId] = useState<string | null>(null);
  const limit = 20;

  const loadListings = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const params: Record<string, string> = { page: String(page), limit: String(limit) };
      if (query) params.search = query;
      const data: any = await marketplaceApi.getListings(params);
      const items = data?.items ?? data?.listings ?? (Array.isArray(data) ? data : []);
      setListings(items);
      setTotal(data?.total ?? items.length);
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  }, [page, query]);

  const loadShops = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      // No paginated shop list endpoint exists — load pending listings for moderation instead
      const data: any = await marketplaceApi.getPendingListings();
      const items = Array.isArray(data) ? data : [];
      setShops(items);
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    if (tab === "listings") loadListings();
    else loadShops();
  }, [tab, loadListings, loadShops]);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setPage(1);
    setQuery(search);
  }

  async function deleteListing(id: string) {
    if (!confirm("Delete this listing?")) return;
    setActionId(id);
    try {
      await marketplaceApi.deleteListing(id);
      setListings((prev) => prev.filter((l) => l.id !== id));
    } catch (e: any) { alert(e.message); }
    finally { setActionId(null); }
  }

  async function deactivateShop(id: string) {
    if (!confirm("Deactivate this shop?")) return;
    setActionId(id);
    try {
      await marketplaceApi.adminDeleteShop(id);
      setShops((prev) => prev.map((s) => s.id === id ? { ...s, isActive: false } : s));
    } catch (e: any) { alert(e.message); }
    finally { setActionId(null); }
  }

  const pages = Math.ceil(total / limit);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Marketplace</h1>
        <p className="text-muted-foreground text-sm mt-1">Manage listings and shops</p>
      </div>

      {/* Moderation shortcut */}
      <div className="flex flex-wrap gap-2">
        <a
          href="/admin/marketplace/moderation"
          className="flex items-center gap-2 bg-amber-100 text-amber-700 font-semibold rounded-xl px-4 py-2.5 text-sm"
        >
          <ShieldCheck className="w-4 h-4" /> Moderation
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
        <a
          href="/admin/marketplace/agents"
          className="flex items-center gap-2 bg-indigo-100 text-indigo-700 font-semibold rounded-xl px-4 py-2.5 text-sm"
        >
          <ShieldCheck className="w-4 h-4" /> Agent Applications
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
        <a
          href="/admin/marketplace/reports"
          className="flex items-center gap-2 bg-rose-100 text-rose-700 font-semibold rounded-xl px-4 py-2.5 text-sm"
        >
          <ExternalLink className="w-3.5 h-3.5" /> Reports
        </a>
      </div>

      <div className="flex gap-2">
        {(["listings", "shops"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => { setTab(t); setPage(1); setQuery(""); setSearch(""); }}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors capitalize ${
              tab === t ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-accent"
            }`}
          >
            <span className="flex items-center gap-1.5">
              {t === "listings" ? <ShoppingBag className="w-3.5 h-3.5" /> : <Store className="w-3.5 h-3.5" />}
              {t === "listings" ? "Listings" : "Shops"}
            </span>
          </button>
        ))}
      </div>

      {tab === "listings" && (
        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search listings…"
              className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <button type="submit" className="px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity">
            Search
          </button>
        </form>
      )}

      {error && (
        <div className="bg-destructive/10 text-destructive rounded-xl p-4 flex items-center gap-2 text-sm">
          <AlertCircle className="w-4 h-4 shrink-0" /> {error}
        </div>
      )}

      {loading ? (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-card rounded-2xl p-5 h-20 animate-pulse" />
          ))}
        </div>
      ) : tab === "listings" ? (
        <>
          <div className="bg-card rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-muted-foreground text-xs uppercase tracking-wide">
                    <th className="text-left px-4 py-3 font-medium">Title</th>
                    <th className="text-left px-4 py-3 font-medium">Category</th>
                    <th className="text-left px-4 py-3 font-medium">Price</th>
                    <th className="text-left px-4 py-3 font-medium">Seller</th>
                    <th className="text-left px-4 py-3 font-medium">Status</th>
                    <th className="text-left px-4 py-3 font-medium">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {listings.length === 0 ? (
                    <tr><td colSpan={6} className="text-center text-muted-foreground text-sm py-10">No listings found.</td></tr>
                  ) : listings.map((l) => (
                    <tr key={l.id} className="border-b border-border last:border-0 hover:bg-muted/50 transition-colors">
                      <td className="px-4 py-3">
                        <p className="font-medium text-foreground line-clamp-1">{l.title}</p>
                        <p className="text-xs text-muted-foreground">{new Date(l.createdAt).toLocaleDateString()}</p>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-semibold px-2 py-1 rounded-full ${CAT_BADGE[l.category] ?? CAT_BADGE.OTHER}`}>
                          {l.category}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-foreground font-medium">₦{l.price.toLocaleString()}</td>
                      <td className="px-4 py-3 text-muted-foreground">{l.seller?.fullName ?? "—"}</td>
                      <td className="px-4 py-3">
                        {l.isAvailable !== false
                          ? <span className="text-xs font-semibold px-2 py-1 rounded-full bg-emerald-100 text-emerald-700">Available</span>
                          : <span className="text-xs font-semibold px-2 py-1 rounded-full bg-muted text-muted-foreground">Sold</span>
                        }
                      </td>
                      <td className="px-4 py-3">
                        <button
                          disabled={actionId === l.id}
                          onClick={() => deleteListing(l.id)}
                          className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors disabled:opacity-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {pages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">Page {page} of {pages}</p>
              <div className="flex gap-2">
                <button disabled={page === 1} onClick={() => setPage((p) => p - 1)} className="p-2 rounded-xl border border-border hover:bg-accent disabled:opacity-40 transition-colors">
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button disabled={page === pages} onClick={() => setPage((p) => p + 1)} className="p-2 rounded-xl border border-border hover:bg-accent disabled:opacity-40 transition-colors">
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </>
      ) : shops.length === 0 ? (
        <div className="bg-card rounded-2xl p-10 text-center text-muted-foreground text-sm">No shops found.</div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {shops.map((shop) => (
            <div key={shop.id} className="bg-card rounded-2xl p-5 flex flex-col gap-3">
              <div className="flex items-start justify-between gap-2">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <Store className="w-5 h-5 text-primary" />
                </div>
                <div className="flex items-center gap-1">
                  {shop.isActive !== false
                    ? <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">Active</span>
                    : <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-muted text-muted-foreground">Inactive</span>
                  }
                  {shop.isActive !== false && (
                    <button
                      disabled={actionId === shop.id}
                      onClick={() => deactivateShop(shop.id)}
                      title="Deactivate shop"
                      className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors disabled:opacity-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
              <div>
                <p className="font-semibold text-foreground">{shop.name}</p>
                {shop.description && <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{shop.description}</p>}
              </div>
              <div className="flex items-center gap-3 text-xs text-muted-foreground mt-auto">
                {shop.owner       && <span>by {shop.owner.fullName}</span>}
                {shop.listingCount !== undefined && <span>{shop.listingCount} listings</span>}
                {shop.followerCount !== undefined && <span>{shop.followerCount} followers</span>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
