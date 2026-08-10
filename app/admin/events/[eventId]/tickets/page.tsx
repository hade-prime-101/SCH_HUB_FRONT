"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  ArrowLeft, Ticket, CheckCircle2, Clock, XCircle, Loader2, X,
  ExternalLink, Users,
} from "lucide-react";
import { schoolApi } from "@/lib/api/school";

// ─── Types ────────────────────────────────────────────────────────────────────

type TicketStatus = "PENDING" | "APPROVED" | "REJECTED";

interface EventTicket {
  id:              string;
  status:          TicketStatus;
  receiptUrl:      string;
  receiptKey?:     string;
  rejectionReason?: string | null;
  createdAt?:      string;
  user?:           { id: string; fullName: string; email?: string };
}

interface SchoolEvent {
  id:    string;
  title: string;
}

const STATUS_BADGE: Record<TicketStatus, string> = {
  PENDING:  "bg-amber-100 text-amber-700",
  APPROVED: "bg-emerald-100 text-emerald-700",
  REJECTED: "bg-rose-100 text-rose-600",
};

function formatDate(iso?: string) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" });
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AdminEventTicketsPage() {
  const router  = useRouter();
  const params  = useParams();
  const eventId = params?.eventId as string;

  const [event,     setEvent]     = useState<SchoolEvent | null>(null);
  const [tickets,   setTickets]   = useState<EventTicket[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState<string | null>(null);
  const [acting,    setActing]    = useState<string | null>(null);
  const [rejectId,  setRejectId]  = useState<string | null>(null);
  const [reason,    setReason]    = useState("");

  useEffect(() => {
    if (!eventId) return;
    Promise.all([
      schoolApi.getEvent(eventId).catch(() => null),
      schoolApi.listTickets(eventId),
    ]).then(([ev, tks]) => {
      setEvent(ev as SchoolEvent | null);
      setTickets(Array.isArray(tks) ? (tks as EventTicket[]) : []);
    }).catch((e: any) => setError(e.message || "Failed to load tickets."))
      .finally(() => setLoading(false));
  }, [eventId]);

  async function handleApprove(ticketId: string) {
    setActing(ticketId);
    try {
      await schoolApi.approveTicket(eventId, ticketId);
      setTickets((prev) => prev.map((t) => t.id === ticketId ? { ...t, status: "APPROVED" } : t));
    } catch (e: any) { setError(e.message || "Failed to approve."); }
    finally { setActing(null); }
  }

  async function handleReject(ticketId: string) {
    if (!reason.trim()) { setError("Please enter a rejection reason."); return; }
    setActing(ticketId);
    try {
      await schoolApi.rejectTicket(eventId, ticketId, reason.trim());
      setTickets((prev) => prev.map((t) => t.id === ticketId ? { ...t, status: "REJECTED", rejectionReason: reason } : t));
      setRejectId(null); setReason("");
    } catch (e: any) { setError(e.message || "Failed to reject."); }
    finally { setActing(null); }
  }

  // Stats
  const total    = tickets.length;
  const approved = tickets.filter((t) => t.status === "APPROVED").length;
  const pending  = tickets.filter((t) => t.status === "PENDING").length;
  const rejected = tickets.filter((t) => t.status === "REJECTED").length;

  if (loading) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-white px-4 pt-5 pb-4 flex items-center gap-3 border-b border-slate-100">
        <button onClick={() => router.back()} className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
          <ArrowLeft className="w-5 h-5 text-slate-700" />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-bold text-slate-900">Event Tickets</h1>
          {event && <p className="text-xs text-slate-400 mt-0.5 truncate">{event.title}</p>}
        </div>
      </div>

      <div className="px-4 py-4 max-w-2xl mx-auto flex flex-col gap-4">

        {error && (
          <div className="flex items-center justify-between bg-rose-50 text-rose-600 rounded-2xl px-4 py-3 text-sm font-medium">
            <span>{error}</span><button onClick={() => setError(null)}><X className="w-4 h-4" /></button>
          </div>
        )}

        {/* Stats row */}
        <div className="grid grid-cols-4 gap-2">
          {[
            { label: "Total",    value: total,    color: "text-slate-900" },
            { label: "Pending",  value: pending,  color: "text-amber-600" },
            { label: "Approved", value: approved, color: "text-emerald-600" },
            { label: "Rejected", value: rejected, color: "text-rose-500" },
          ].map(({ label, value, color }) => (
            <div key={label} className="bg-white rounded-2xl shadow-sm px-3 py-3 text-center">
              <p className={`text-xl font-bold ${color}`}>{value}</p>
              <p className="text-xs text-slate-400 font-medium">{label}</p>
            </div>
          ))}
        </div>

        {tickets.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm px-5 py-12 flex flex-col items-center gap-3 text-center">
            <Ticket className="w-10 h-10 text-slate-200" />
            <p className="text-slate-400 font-medium">No ticket submissions yet.</p>
          </div>
        ) : (
          tickets.map((ticket) => {
            const isActing = acting === ticket.id;
            return (
              <div key={ticket.id} className="bg-white rounded-2xl shadow-sm px-5 py-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="font-bold text-slate-900">{ticket.user?.fullName ?? "Unknown user"}</p>
                    {ticket.user?.email && <p className="text-xs text-slate-400">{ticket.user.email}</p>}
                    <p className="text-xs text-slate-300 mt-0.5">Submitted {formatDate(ticket.createdAt)}</p>
                  </div>
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-lg ${STATUS_BADGE[ticket.status]}`}>{ticket.status}</span>
                </div>

                <a href={ticket.receiptUrl} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-sm font-semibold text-indigo-500 mb-3 w-fit">
                  <ExternalLink className="w-4 h-4" /> View Receipt
                </a>

                {ticket.rejectionReason && (
                  <p className="text-xs text-rose-500 mb-3 bg-rose-50 rounded-lg px-3 py-2">
                    Rejection: {ticket.rejectionReason}
                  </p>
                )}

                {/* Reject reason input */}
                {rejectId === ticket.id && (
                  <div className="mb-3">
                    <input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Rejection reason (required)"
                      className="w-full px-3 py-2 rounded-xl border border-rose-200 text-sm focus:outline-none focus:ring-2 focus:ring-rose-300" />
                  </div>
                )}

                {ticket.status === "PENDING" && (
                  <div className="flex gap-2">
                    <button onClick={() => handleApprove(ticket.id)} disabled={isActing}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-emerald-500 text-white text-sm font-bold disabled:opacity-50 transition active:opacity-80">
                      {isActing ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />} Approve
                    </button>
                    {rejectId === ticket.id ? (
                      <button onClick={() => handleReject(ticket.id)} disabled={isActing}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-rose-500 text-white text-sm font-bold disabled:opacity-50 transition active:opacity-80">
                        {isActing ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />} Confirm
                      </button>
                    ) : (
                      <button onClick={() => setRejectId(ticket.id)}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl border-2 border-rose-200 text-rose-500 text-sm font-bold transition active:bg-rose-50">
                        <XCircle className="w-4 h-4" /> Reject
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
