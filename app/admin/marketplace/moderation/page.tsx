"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Building2,
  CheckCircle2,
  XCircle,
  Loader2,
  AlertTriangle,
  RefreshCw,
  Search,
  X,
  ShieldCheck,
  Phone,
  MapPin,
  Clock,
  Flag,
  ShoppingBag,
  Wrench,
  Home,
} from "lucide-react";
import { marketplaceApi } from "@/lib/api/marketplace";

// ─── Types ────────────────────────────────────────────────────────────────────

type Tab = "agents" | "listings" | "reports";
type AgentStatus = "PENDING" | "APPROVED" | "REJECTED";

interface PendingAgent {
  userId:          string;
  fullName?:       string;
  businessName:    string;
  businessAddress: string;
  phoneNumber:     string;
  submittedAt?:    string;
}

interface PendingListing {
  id:       string;
  title:    string;
  price?:   number;
  category?: string;
  type?:    string;
  kind:     "listing" | "accommodation" | "service";
  seller?:  { fullName: string };
  createdAt: string;
}

interface MarketReport {
  id:         string;
  reason:     string;
  details?:   string;
  targetType: string;
  createdAt:  string;
  reporter?:  { fullName: string };
  target?:    { title?: string; name?: string };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function initials(name: string): string {
  return name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
}

// ─── Review note sheet ────────────────────────────────────────────────────────

function ReviewSheet({
  agent,
  onClose,
  onDone,
}: {
  agent:   PendingAgent;
  onClose: () => void;
  onDone:  (userId: string, decision: "APPROVED" | "REJECTED") => void;
}) {
  const [note, setNote]         = useState("");
  const [submitting, setSub]    = useState(false);
  const [decision, setDecision] = useState<"APPROVED" | "REJECTED" | null>(null);
  const [error, setError]       = useState<string | null>(null);

  async function handle(dec: "APPROVED" | "REJECTED") {
    setDecision(dec); setSub(true); setError(null);
    try {
      await marketplaceApi.reviewAgent(agent.userId, dec, note.trim() || undefined);
      onDone(agent.userId, dec);
      onClose();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Review failed.");
    } finally {
      setSub(false);
    }
  }

  return (
    <>
      <div className="fixed inset-0 bg-black/40 z-40" onClick={onClose} aria-hidden="true" />
      <div className="fixed bottom-0 left-0 right-0 bg-card rounded-t-3xl z-50 px-6 pt-5 pb-10 max-h-[80vh] overflow-y-auto">
        <div className="w-10 h-1 rounded-full bg-muted mx-auto mb-5" />
        <h2 className="font-bold text-foreground text-xl mb-4">Review Agent Application</h2>

        {/* Details */}
        <div className="bg-muted rounded-2xl p-4 mb-4 flex flex-col gap-3">
          {[
            { icon: Building2, label: agent.businessName },
            { icon: MapPin,    label: agent.businessAddress },
            { icon: Phone,     label: agent.phoneNumber },
          ].map(({ icon: Icon, label }) => (
            <div key={label} className="flex items-center gap-2">
              <Icon className="w-4 h-4 text-muted-foreground shrink-0" />
              <p className="text-sm text-foreground">{label}</p>
            </div>
          ))}
        </div>

        {error && (
          <div className="flex items-center gap-2 bg-destructive/10 rounded-xl px-3 py-2 mb-3 text-destructive text-sm">
            <AlertTriangle className="w-3.5 h-3.5 shrink-0" /> {error}
          </div>
        )}

        <p className="text-sm font-semibold text-foreground mb-2">Note (optional)</p>
        <textarea
          value={note}
          onChange={e => setNote(e.target.value)}
          placeholder="Reason for approval or rejection…"
          rows={3}
          className="w-full rounded-xl border border-border bg-muted px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none mb-5"
        />

        <div className="flex gap-3">
          <button
            onClick={() => handle("REJECTED")}
            disabled={submitting}
            className="flex-1 flex items-center justify-center gap-2 border border-destructive text-destructive font-semibold rounded-xl py-3 text-sm disabled:opacity-50"
          >
            {submitting && decision === "REJECTED" ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
            Reject
          </button>
          <button
            onClick={() => handle("APPROVED")}
            disabled={submitting}
            className="flex-1 flex items-center justify-center gap-2 bg-emerald-600 text-white font-semibold rounded-xl py-3 text-sm disabled:opacity-50"
          >
            {submitting && decision === "APPROVED" ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
            Approve
          </button>
        </div>
      </div>
    </>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AdminMarketplaceModerationPage() {
  const router = useRouter();

  const [tab, setTab]               = useState<Tab>("agents");
  const [agents, setAgents]         = useState<PendingAgent[]>([]);
  const [listings, setListings]     = useState<PendingListing[]>([]);
  const [reports, setReports]       = useState<MarketReport[]>([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState<string | null>(null);
  const [search, setSearch]         = useState("");
  const [actionId, setActionId]     = useState<string | null>(null);
  const [reviewAgent, setReviewAgent] = useState<PendingAgent | null>(null);

  // ── loaders ────────────────────────────────────────────────────────────────

  const loadAgents = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const data = await marketplaceApi.getPendingAgents();
      setAgents(Array.isArray(data) ? data : []);
    } catch { setError("Couldn't load agent applications."); }
    finally { setLoading(false); }
  }, []);

  const loadListings = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const [pListings, pServices, pAccom] = await Promise.allSettled([
        marketplaceApi.getPendingListings(),
        marketplaceApi.getPendingServices(),
        marketplaceApi.getPendingAgents(), // placeholder — no dedicated pending accom endpoint
      ]);
      const all: PendingListing[] = [];
      if (pListings.status === "fulfilled") {
        all.push(...(Array.isArray(pListings.value) ? pListings.value : []).map((l: any) => ({ ...l, kind: "listing" as const })));
      }
      if (pServices.status === "fulfilled") {
        all.push(...(Array.isArray(pServices.value) ? pServices.value : []).map((s: any) => ({ ...s, kind: "service" as const })));
      }
      setListings(all);
    } catch { setError("Couldn't load pending listings."); }
    finally { setLoading(false); }
  }, []);

  const loadReports = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const data = await marketplaceApi.getMarketplaceReports();
      const items = Array.isArray(data) ? data : (data as any)?.items ?? [];
      setReports(items);
    } catch { setError("Couldn't load reports."); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    if (tab === "agents")   loadAgents();
    if (tab === "listings") loadListings();
    if (tab === "reports")  loadReports();
  }, [tab, loadAgents, loadListings, loadReports]);

  // ── moderate listing ───────────────────────────────────────────────────────

  async function handleModerate(item: PendingListing, decision: "APPROVED" | "REJECTED") {
    setActionId(item.id);
    try {
      if (item.kind === "listing")     await marketplaceApi.moderateListing(item.id, decision);
      if (item.kind === "service")     await marketplaceApi.moderateService(item.id, decision);
      if (item.kind === "accommodation") await marketplaceApi.moderateAccommodation(item.id, decision);
      setListings(p => p.filter(l => l.id !== item.id));
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Moderation failed.");
    } finally {
      setActionId(null);
    }
  }

  // ── resolve report ─────────────────────────────────────────────────────────

  async function handleResolve(id: string) {
    setActionId(id);
    try {
      await marketplaceApi.resolveMarketplaceReport(id);
      setReports(p => p.filter(r => r.id !== id));
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to resolve.");
    } finally {
      setActionId(null);
    }
  }

  // ── kind icon ──────────────────────────────────────────────────────────────

  function KindIcon({ kind }: { kind: string }) {
    if (kind === "service")       return <Wrench  className="w-4 h-4 text-primary" />;
    if (kind === "accommodation") return <Home    className="w-4 h-4 text-primary" />;
    return                               <ShoppingBag className="w-4 h-4 text-primary" />;
  }

  // ── filter ─────────────────────────────────────────────────────────────────

  const filteredAgents = agents.filter(a =>
    !search || a.businessName.toLowerCase().includes(search.toLowerCase()) ||
    (a.fullName?.toLowerCase().includes(search.toLowerCase()) ?? false)
  );

  const filteredListings = listings.filter(l =>
    !search || l.title.toLowerCase().includes(search.toLowerCase())
  );

  const filteredReports = reports.filter(r =>
    !search || r.reason.toLowerCase().includes(search.toLowerCase()) ||
    (r.target?.title ?? r.target?.name ?? "").toLowerCase().includes(search.toLowerCase())
  );

  const tabs: { key: Tab; label: string; icon: React.ElementType; count: number }[] = [
    { key: "agents",   label: "Agents",   icon: Building2,  count: agents.length },
    { key: "listings", label: "Listings", icon: ShoppingBag, count: listings.length },
    { key: "reports",  label: "Reports",  icon: Flag,       count: reports.length },
  ];

  return (
    <div className="min-h-screen w-full bg-muted px-6 py-6 pb-10">

      {/* ── Header ── */}
      <div className="flex items-start gap-4 mb-6">
        <button onClick={() => router.back()} aria-label="Go back" className="w-11 h-11 rounded-2xl bg-card shadow-sm flex items-center justify-center shrink-0">
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Marketplace Moderation</h1>
          <p className="text-muted-foreground text-sm">Agents, pending listings &amp; reports</p>
        </div>
      </div>

      {/* ── Tabs ── */}
      <div className="flex gap-2 mb-5">
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => { setTab(t.key); setSearch(""); }}
            className={`flex-1 flex flex-col items-center py-2.5 rounded-2xl text-xs font-bold transition-colors gap-0.5 ${
              tab === t.key ? "bg-primary text-primary-foreground" : "bg-card text-muted-foreground"
            }`}
          >
            <t.icon className="w-4 h-4" />
            {t.label}
            {t.count > 0 && (
              <span className={`text-xs font-black ${tab === t.key ? "text-primary-foreground/80" : "text-primary"}`}>
                {t.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── Search ── */}
      <div className="flex items-center gap-3 bg-card border border-border rounded-2xl px-4 py-3 mb-4">
        <Search className="w-4 h-4 text-muted-foreground shrink-0" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search…" className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none" />
        {search && <button onClick={() => setSearch("")} aria-label="Clear"><X className="w-4 h-4 text-muted-foreground" /></button>}
      </div>

      {/* ── Error ── */}
      {error && (
        <div className="flex items-center gap-3 bg-destructive/10 rounded-2xl px-4 py-3 mb-4">
          <AlertTriangle className="w-4 h-4 text-destructive shrink-0" />
          <p className="text-sm text-destructive flex-1">{error}</p>
          <button onClick={tab === "agents" ? loadAgents : tab === "listings" ? loadListings : loadReports} aria-label="Retry">
            <RefreshCw className="w-4 h-4 text-destructive" />
          </button>
        </div>
      )}

      {loading && <div className="flex justify-center py-12"><Loader2 className="w-7 h-7 text-primary animate-spin" /></div>}

      {/* ── Agents tab ── */}
      {!loading && tab === "agents" && (
        filteredAgents.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-16 text-center">
            <ShieldCheck className="w-12 h-12 text-muted-foreground/30" />
            <p className="font-semibold text-muted-foreground">{search ? "No results" : "No pending applications"}</p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {filteredAgents.map(a => (
              <div key={a.userId} className="bg-card rounded-2xl p-5">
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-11 h-11 rounded-full bg-accent flex items-center justify-center text-sm font-bold text-primary shrink-0">
                    {initials(a.fullName ?? a.businessName)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-foreground">{a.fullName ?? "—"}</p>
                    <p className="text-sm text-muted-foreground">{a.businessName}</p>
                  </div>
                  {a.submittedAt && (
                    <div className="flex items-center gap-1 text-xs text-muted-foreground shrink-0">
                      <Clock className="w-3 h-3" />{timeAgo(a.submittedAt)}
                    </div>
                  )}
                </div>
                <div className="flex flex-col gap-1 mb-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 shrink-0" />{a.businessAddress}</span>
                  <span className="flex items-center gap-1.5"><Phone className="w-3.5 h-3.5 shrink-0" />{a.phoneNumber}</span>
                </div>
                <button
                  onClick={() => setReviewAgent(a)}
                  className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground font-semibold rounded-xl py-3 text-sm"
                >
                  Review Application
                </button>
              </div>
            ))}
          </div>
        )
      )}

      {/* ── Listings tab ── */}
      {!loading && tab === "listings" && (
        filteredListings.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-16 text-center">
            <ShoppingBag className="w-12 h-12 text-muted-foreground/30" />
            <p className="font-semibold text-muted-foreground">{search ? "No results" : "No pending listings"}</p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {filteredListings.map(l => (
              <div key={l.id} className="bg-card rounded-2xl p-5">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2 flex-1 min-w-0 pr-2">
                    <div className="w-8 h-8 rounded-xl bg-accent flex items-center justify-center shrink-0">
                      <KindIcon kind={l.kind} />
                    </div>
                    <p className="font-bold text-foreground text-sm truncate">{l.title}</p>
                  </div>
                  <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-amber-100 text-amber-700 shrink-0 capitalize">{l.kind}</span>
                </div>
                <p className="text-xs text-muted-foreground mb-4">
                  {l.seller?.fullName ?? "—"} · {timeAgo(l.createdAt)}
                  {l.price ? ` · ₦${l.price.toLocaleString()}` : ""}
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => handleModerate(l, "REJECTED")}
                    disabled={actionId === l.id}
                    className="flex-1 flex items-center justify-center gap-2 border border-destructive text-destructive font-semibold rounded-xl py-2.5 text-sm disabled:opacity-50"
                  >
                    {actionId === l.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
                    Reject
                  </button>
                  <button
                    onClick={() => handleModerate(l, "APPROVED")}
                    disabled={actionId === l.id}
                    className="flex-1 flex items-center justify-center gap-2 bg-emerald-600 text-white font-semibold rounded-xl py-2.5 text-sm disabled:opacity-50"
                  >
                    {actionId === l.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                    Approve
                  </button>
                </div>
              </div>
            ))}
          </div>
        )
      )}

      {/* ── Reports tab ── */}
      {!loading && tab === "reports" && (
        filteredReports.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-16 text-center">
            <Flag className="w-12 h-12 text-muted-foreground/30" />
            <p className="font-semibold text-muted-foreground">{search ? "No results" : "No unresolved reports"}</p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {filteredReports.map(r => (
              <div key={r.id} className="bg-card rounded-2xl p-5">
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-9 h-9 rounded-xl bg-destructive/10 flex items-center justify-center shrink-0">
                    <Flag className="w-4 h-4 text-destructive" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-destructive/10 text-destructive">{r.reason}</span>
                      <span className="text-xs font-bold px-2 py-1 rounded-lg bg-muted text-muted-foreground capitalize">{r.targetType}</span>
                    </div>
                    {r.reporter && <p className="text-xs text-muted-foreground mt-1">by {r.reporter.fullName} · {timeAgo(r.createdAt)}</p>}
                  </div>
                </div>
                {(r.target?.title ?? r.target?.name) && (
                  <p className="text-sm text-foreground bg-muted rounded-xl px-4 py-2.5 mb-4 line-clamp-2">
                    {r.target.title ?? r.target.name}
                  </p>
                )}
                {r.details && <p className="text-xs text-muted-foreground mb-4 italic">"{r.details}"</p>}
                <button
                  onClick={() => handleResolve(r.id)}
                  disabled={actionId === r.id}
                  className="w-full flex items-center justify-center gap-2 bg-emerald-600 text-white font-semibold rounded-xl py-3 text-sm disabled:opacity-50"
                >
                  {actionId === r.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                  Mark Resolved
                </button>
              </div>
            ))}
          </div>
        )
      )}

      {/* ── Agent review sheet ── */}
      {reviewAgent && (
        <ReviewSheet
          agent={reviewAgent}
          onClose={() => setReviewAgent(null)}
          onDone={(userId) => {
            setAgents(p => p.filter(a => a.userId !== userId));
            setReviewAgent(null);
          }}
        />
      )}
    </div>
  );
}
