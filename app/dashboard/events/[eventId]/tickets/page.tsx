"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Ticket, CheckCircle2, Clock, XCircle, Loader2, AlertTriangle, X,
  ExternalLink, Calendar } from "lucide-react";
import BackButton from "@/components/shared/BackButton";
import { schoolApi } from "@/lib/api/school";

// ─── Types ────────────────────────────────────────────────────────────────────

type TicketStatus = "PENDING" | "APPROVED" | "REJECTED";

interface MyTicket {
  id:             string;
  status:         TicketStatus;
  receiptUrl:     string;
  receiptKey:     string;
  rejectionReason?: string | null;
  createdAt?:     string;
}

interface SchoolEvent {
  id:       string;
  title:    string;
  startDate: string;
}

const STATUS_CONFIG: Record<TicketStatus, { icon: React.ElementType; label: string; bg: string; text: string; border: string }> = {
  PENDING:  { icon: Clock,         label: "Pending Review",  bg: "bg-amber-50",   text: "text-amber-700",  border: "border-amber-200" },
  APPROVED: { icon: CheckCircle2,  label: "Approved",        bg: "bg-emerald-50", text: "text-emerald-700",border: "border-emerald-200" },
  REJECTED: { icon: XCircle,       label: "Rejected",        bg: "bg-rose-50",    text: "text-rose-600",   border: "border-rose-200" } };

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString([], { weekday: "short", month: "short", day: "numeric" });
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function EventTicketPage() {
  const router  = useRouter();
  const params  = useParams();
  const eventId = params?.eventId as string;

  const [event,     setEvent]     = useState<SchoolEvent | null>(null);
  const [ticket,    setTicket]    = useState<MyTicket | null>(null);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState<string | null>(null);

  // Form state
  const [receiptUrl,  setReceiptUrl]  = useState("");
  const [receiptKey,  setReceiptKey]  = useState("");
  const [submitting,  setSubmitting]  = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    if (!eventId) return;
    Promise.all([
      schoolApi.getEvent(eventId).catch(() => null),
      schoolApi.getMyTicket(eventId).catch(() => null),
    ]).then(([ev, tk]) => {
      setEvent(ev as SchoolEvent | null);
      setTicket(tk as MyTicket | null);
    }).catch((e: any) => setError(e.message || "Failed to load event."))
      .finally(() => setLoading(false));
  }, [eventId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!receiptUrl.trim()) { setSubmitError("Please enter your receipt URL."); return; }
    if (!receiptKey.trim()) { setSubmitError("Please enter the receipt key."); return; }
    setSubmitting(true); setSubmitError(null);
    try {
      const tk = await schoolApi.submitReceipt(eventId, receiptUrl.trim(), receiptKey.trim());
      setTicket(tk as MyTicket);
    } catch (e: any) { setSubmitError(e.message || "Failed to submit receipt."); }
    finally { setSubmitting(false); }
  }

  if (loading) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-white px-4 pt-5 pb-4 flex items-center gap-3 border-b border-slate-100">
        <BackButton />
        <h1 className="text-xl font-bold text-slate-900">Event Ticket</h1>
      </div>

      <div className="px-4 py-5 max-w-lg mx-auto flex flex-col gap-4">

        {error && (
          <div className="flex items-center gap-2 bg-rose-50 text-rose-600 rounded-2xl px-4 py-3 text-sm font-medium">
            <AlertTriangle className="w-4 h-4 shrink-0" /> {error}
          </div>
        )}

        {/* Event info */}
        {event && (
          <div className="bg-white rounded-2xl shadow-sm px-5 py-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center shrink-0">
                <Ticket className="w-5 h-5 text-indigo-500" />
              </div>
              <div>
                <p className="font-bold text-slate-900">{event.title}</p>
                {event.startDate && (
                  <p className="flex items-center gap-1 text-xs text-slate-400 mt-0.5">
                    <Calendar className="w-3 h-3" /> {formatDate(event.startDate)}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── Existing ticket status ── */}
        {ticket ? (
          <div className={`rounded-2xl border-2 px-5 py-5 ${STATUS_CONFIG[ticket.status].bg} ${STATUS_CONFIG[ticket.status].border}`}>
            <div className="flex items-center gap-3 mb-3">
              {(() => { const Icon = STATUS_CONFIG[ticket.status].icon; return <Icon className={`w-6 h-6 ${STATUS_CONFIG[ticket.status].text}`} />; })()}
              <p className={`font-bold text-lg ${STATUS_CONFIG[ticket.status].text}`}>{STATUS_CONFIG[ticket.status].label}</p>
            </div>

            {ticket.createdAt && (
              <p className="text-xs text-slate-400 mb-3">Submitted {formatDate(ticket.createdAt)}</p>
            )}

            <a href={ticket.receiptUrl} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-sm font-semibold text-indigo-500 mb-2">
              <ExternalLink className="w-4 h-4" /> View Receipt
            </a>

            {ticket.rejectionReason && (
              <div className="bg-rose-50 rounded-xl px-4 py-3 mt-2">
                <p className="text-sm font-bold text-rose-600 mb-1">Rejection reason:</p>
                <p className="text-sm text-rose-500">{ticket.rejectionReason}</p>
              </div>
            )}
          </div>
        ) : (
          /* ── Submit form ── */
          <div className="bg-white rounded-2xl shadow-sm px-5 py-5">
            <h2 className="font-bold text-slate-900 mb-1">Submit Payment Receipt</h2>
            <p className="text-sm text-slate-400 mb-4 leading-relaxed">
              Upload your receipt to a service like Cloudinary or Google Drive and paste the public link below.
            </p>

            {submitError && (
              <div className="flex items-center justify-between bg-rose-50 text-rose-600 rounded-xl px-4 py-3 text-sm font-medium mb-3">
                <span>{submitError}</span>
                <button onClick={() => setSubmitError(null)}><X className="w-4 h-4" /></button>
              </div>
            )}

            <form onSubmit={handleSubmit} className="flex flex-col gap-3">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-slate-700">Receipt URL *</label>
                <input type="url" value={receiptUrl} onChange={(e) => setReceiptUrl(e.target.value)}
                  required placeholder="https://drive.google.com/..."
                  className="px-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-slate-700">Receipt / Transaction Key *</label>
                <input type="text" value={receiptKey} onChange={(e) => setReceiptKey(e.target.value)}
                  required placeholder="e.g. TXN-20260801-XXXX"
                  className="px-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" />
                <p className="text-xs text-slate-400">Your payment reference number or transaction ID.</p>
              </div>
              <button type="submit" disabled={submitting}
                className="w-full rounded-2xl bg-indigo-500 py-4 font-bold text-white shadow-lg shadow-indigo-100 flex items-center justify-center gap-2 disabled:opacity-50 transition active:opacity-90">
                {submitting ? <><Loader2 className="w-5 h-5 animate-spin" /> Submitting…</> : <><Ticket className="w-5 h-5" /> Submit Receipt</>}
              </button>
            </form>
          </div>
        )}

      </div>
    </div>
  );
}
