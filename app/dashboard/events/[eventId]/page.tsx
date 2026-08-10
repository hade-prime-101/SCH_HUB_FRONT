"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Share2,
  Bell,
  Pencil,
  Trash2,
  Check,
  Calendar,
  Ticket,
  Phone,
  Loader2,
  X,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ClipboardPaste,
  User,
} from "lucide-react";
import BackButton from "@/components/shared/BackButton";
import { schoolApi } from "@/lib/api/school";
import { usersApi } from "@/lib/api/users";
import BottomNav from "@/components/shared/BottomNav";
import type { UserRole } from "@/types/auth";

// ─── Types ────────────────────────────────────────────────────────────────────

interface SchoolEvent {
  id: string;
  title: string;
  description?: string | null;
  startDate: string;
  endDate?: string | null;
  venue?: string | null;
  imageUrl?: string | null;
  level?: string | null;
  createdAt: string;
  department?: { id: string; name: string } | null;
  createdBy?: { id: string; fullName: string } | null;
  myReminder?: { notifyAt: string } | null;
}

type TicketStatus = "PENDING" | "APPROVED" | "REJECTED";

interface MyTicket {
  id: string;
  status: TicketStatus;
  receiptUrl: string;
  receiptKey: string;
  rejectionReason?: string | null;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const CAN_MANAGE: UserRole[] = [
  "COURSE_REP", "EVENT_ORCHESTRATOR", "SCHOOL_ADMIN", "SUPER_ADMIN",
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatEventDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("en-NG", {
    weekday: "short", month: "short", day: "numeric",
  }) + " · " + d.toLocaleTimeString("en-NG", { hour: "numeric", minute: "2-digit" });
}

function formatReminderDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("en-NG", { weekday: "short", month: "short", day: "numeric" })
    + " · " + d.toLocaleTimeString("en-NG", { hour: "numeric", minute: "2-digit" });
}

// ─── Ticket Modal ─────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<
  TicketStatus,
  { icon: React.ReactNode; label: string; body: string; badge: string; iconBg: string }
> = {
  PENDING:  { icon: <Clock className="w-5 h-5 text-amber-500" />,      label: "Receipt submitted",  body: "Waiting for admin verification",           badge: "bg-amber-50 text-amber-600",   iconBg: "bg-amber-50"   },
  APPROVED: { icon: <CheckCircle2 className="w-5 h-5 text-emerald-500" />, label: "Ticket approved", body: "Your receipt has been verified successfully", badge: "bg-emerald-50 text-emerald-600", iconBg: "bg-emerald-50" },
  REJECTED: { icon: <AlertTriangle className="w-5 h-5 text-red-500" />, label: "Receipt rejected",  body: "Please resubmit with a valid receipt",      badge: "bg-red-50 text-red-600",       iconBg: "bg-red-50"     },
};

function TicketModal({
  event,
  ticket,
  onClose,
  onSubmit,
  submitting,
}: {
  event: SchoolEvent;
  ticket: MyTicket | null;
  onClose: () => void;
  onSubmit: (url: string, key: string) => Promise<void>;
  submitting: boolean;
}) {
  const [receiptLink, setReceiptLink] = useState(ticket?.receiptUrl ?? "");
  const [receiptRef,  setReceiptRef]  = useState(ticket?.receiptKey  ?? "");

  async function paste(set: (v: string) => void) {
    try { set(await navigator.clipboard.readText()); } catch {}
  }

  const cfg = ticket ? STATUS_CONFIG[ticket.status] : null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 flex items-end justify-center z-50">
      <div className="w-full max-w-md bg-white rounded-t-3xl p-6">
        <div className="flex items-start justify-between mb-2">
          <h1 className="text-2xl font-bold text-slate-900 pr-4">{event.title} Ticket</h1>
          <button onClick={onClose} className="text-indigo-500 font-semibold shrink-0">
            View event
          </button>
        </div>
        <p className="text-slate-500 mb-5">Submit your payment receipt to claim your event ticket</p>

        {cfg && ticket && (
          <div className="rounded-2xl border border-slate-100 p-4 flex items-center gap-3 mb-6">
            <div className={`w-10 h-10 rounded-full ${cfg.iconBg} flex items-center justify-center shrink-0`}>
              {cfg.icon}
            </div>
            <div className="flex-1">
              <p className="font-bold text-slate-900">{cfg.label}</p>
              <p className="text-slate-500 text-sm">
                {ticket.status === "REJECTED" && ticket.rejectionReason ? ticket.rejectionReason : cfg.body}
              </p>
            </div>
            <span className={`text-xs font-bold rounded-lg px-2.5 py-1.5 shrink-0 ${cfg.badge}`}>
              {ticket.status}
            </span>
          </div>
        )}

        <label className="font-semibold text-slate-800 block mb-2">Receipt link</label>
        <div className="flex items-center rounded-xl bg-slate-50 px-4 mb-4">
          <input
            value={receiptLink}
            onChange={(e) => setReceiptLink(e.target.value)}
            placeholder="https://payments.example.edu/receipt/..."
            className="flex-1 py-3 bg-transparent text-slate-700 text-sm focus:outline-none min-w-0"
          />
          <button
            onClick={() => paste(setReceiptLink)}
            className="flex items-center gap-1.5 bg-slate-100 rounded-lg px-3 py-1.5 font-semibold text-slate-700 text-sm shrink-0"
          >
            <ClipboardPaste className="w-3.5 h-3.5" /> Paste
          </button>
        </div>

        <label className="font-semibold text-slate-800 block mb-2">Receipt reference / key</label>
        <input
          value={receiptRef}
          onChange={(e) => setReceiptRef(e.target.value)}
          placeholder="e.g. SCF-2026-APR-19"
          className="w-full rounded-xl bg-slate-50 px-4 py-3 text-slate-700 mb-6 focus:outline-none focus:ring-2 focus:ring-indigo-300"
        />

        <button
          onClick={() => onSubmit(receiptLink.trim(), receiptRef.trim())}
          disabled={submitting || !receiptLink.trim() || !receiptRef.trim()}
          className="w-full rounded-2xl bg-indigo-500 py-4 font-bold text-white shadow-lg shadow-indigo-200 disabled:opacity-50 transition"
        >
          {submitting
            ? <span className="flex items-center justify-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Submitting…</span>
            : ticket?.status === "REJECTED" ? "Resubmit receipt" : "Submit receipt"
          }
        </button>
      </div>
    </div>
  );
}

// ─── Reminder Modal ───────────────────────────────────────────────────────────

function ReminderModal({
  event,
  onClose,
  onSet,
  setting,
}: {
  event: SchoolEvent;
  onClose: () => void;
  onSet: (notifyAt: string) => Promise<void>;
  setting: boolean;
}) {
  const defaultTime = new Date(new Date(event.startDate).getTime() - 60 * 60 * 1000)
    .toISOString().slice(0, 16);
  const [notifyAt, setNotifyAt] = useState(
    event.myReminder ? new Date(event.myReminder.notifyAt).toISOString().slice(0, 16) : defaultTime,
  );

  return (
    <div className="fixed inset-0 bg-slate-900/60 flex items-end justify-center z-50">
      <div className="w-full max-w-md bg-white rounded-t-3xl p-6">
        <div className="flex items-start justify-between mb-2">
          <h2 className="text-xl font-bold text-slate-900 pr-4">Set Reminder</h2>
          <button onClick={onClose} className="text-slate-400 shrink-0 mt-1"><X className="w-5 h-5" /></button>
        </div>
        <p className="text-slate-500 mb-5">
          Choose when to be notified before <span className="font-semibold text-slate-700">{event.title}</span>
        </p>
        <label className="font-semibold text-slate-800 block mb-2">Notify me at</label>
        <input
          type="datetime-local"
          value={notifyAt}
          max={new Date(event.startDate).toISOString().slice(0, 16)}
          onChange={(e) => setNotifyAt(e.target.value)}
          className="w-full rounded-xl bg-slate-50 px-4 py-3 text-slate-700 mb-6 focus:outline-none focus:ring-2 focus:ring-indigo-300"
        />
        <button
          onClick={() => onSet(new Date(notifyAt).toISOString())}
          disabled={setting || !notifyAt}
          className="w-full rounded-2xl bg-indigo-500 py-4 font-bold text-white shadow-lg shadow-indigo-200 disabled:opacity-50 transition"
        >
          {setting
            ? <span className="flex items-center justify-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Saving…</span>
            : event.myReminder ? "Update reminder" : "Set reminder"
          }
        </button>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function EventDetailPage() {
  const router   = useRouter();
  const params   = useParams();
  const id       = params?.eventId as string;

  const [event, setEvent]           = useState<SchoolEvent | null>(null);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState<string | null>(null);
  const [canManage, setCanManage]   = useState(false);
  const [myUserId, setMyUserId]     = useState<string | null>(null);

  // Ticket
  const [showTicket, setShowTicket]         = useState(false);
  const [myTicket, setMyTicket]             = useState<MyTicket | null>(null);
  const [loadingTicket, setLoadingTicket]   = useState(false);
  const [submittingTicket, setSubmittingTicket] = useState(false);

  // Reminder
  const [showReminder, setShowReminder]     = useState(false);
  const [settingReminder, setSettingReminder] = useState(false);

  // Delete
  const [deleting, setDeleting]             = useState(false);

  // Toast
  const [toast, setToast]                   = useState<string | null>(null);

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  }

  useEffect(() => {
    if (!id) return;
    Promise.all([
      schoolApi.getEvent(id),
      usersApi.getMe(),
    ]).then(([ev, me]) => {
      setEvent(ev);
      setCanManage(CAN_MANAGE.includes(me.role));
      setMyUserId(me.id);
    }).catch((e: any) => setError(e.message || "Failed to load event."))
      .finally(() => setLoading(false));
  }, [id]);

  async function openTicketModal() {
    setShowTicket(true);
    setLoadingTicket(true);
    try {
      const t = await schoolApi.getMyTicket(id);
      setMyTicket(t ?? null);
    } catch {} finally { setLoadingTicket(false); }
  }

  async function handleSubmitReceipt(receiptUrl: string, receiptKey: string) {
    setSubmittingTicket(true);
    try {
      const t = await schoolApi.submitReceipt(id, receiptUrl, receiptKey);
      setMyTicket(t);
      showToast("Receipt submitted! Awaiting verification.");
    } catch (e: any) { showToast(e.message || "Failed to submit receipt."); }
    finally { setSubmittingTicket(false); }
  }

  async function handleSetReminder(notifyAt: string) {
    setSettingReminder(true);
    try {
      await schoolApi.setEventReminder(id, notifyAt);
      setEvent((prev) => prev ? { ...prev, myReminder: { notifyAt } } : prev);
      showToast("Reminder saved!");
      setShowReminder(false);
    } catch (e: any) { showToast(e.message || "Failed to set reminder."); }
    finally { setSettingReminder(false); }
  }

  async function handleDelete() {
    if (!confirm("Delete this event? This cannot be undone.")) return;
    setDeleting(true);
    try {
      await schoolApi.deleteEvent(id);
      router.replace("/dashboard/events");
    } catch (e: any) { showToast(e.message || "Failed to delete event."); }
    finally { setDeleting(false); }
  }

  function handleShare() {
    if (navigator.share && event) {
      navigator.share({ title: event.title, url: window.location.href }).catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href).catch(() => {});
      showToast("Link copied!");
    }
  }

  // ── Loading ──
  if (loading) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
    </div>
  );

  // ── Error ──
  if (error || !event) return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center gap-4 px-6">
      <Ticket className="w-12 h-12 text-slate-300" />
      <p className="text-slate-500 font-medium text-center">{error ?? "Event not found."}</p>
      <BackButton variant="text" label="Go back" />
    </div>
  );

  const isUpcoming = new Date(event.startDate) > new Date();

  return (
    <div className="min-h-screen w-full bg-slate-50 pb-24">

      {/* ── Hero ── */}
      <div
        className="relative aspect-[4/3] flex flex-col px-5 pt-6 pb-6"
        style={
          event.imageUrl
            ? { backgroundImage: `url(${event.imageUrl})`, backgroundSize: "cover", backgroundPosition: "center" }
            : { background: "linear-gradient(to bottom right, #1e293b, #0f172a)" }
        }
      >
        {/* Scrim for text legibility over images */}
        {event.imageUrl && (
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-black/20" />
        )}

        {/* ── Action bar ── */}
        <div className="relative flex items-center justify-between mb-auto">
          <button
            onClick={() => router.back()}
            className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center"
          >
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>

          <div className="flex items-center gap-3">
            <button
              onClick={handleShare}
              className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center"
            >
              <Share2 className="w-4 h-4 text-white" />
            </button>
            <button
              onClick={() => setShowReminder(true)}
              className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center"
            >
              <Bell className={`w-4 h-4 ${event.myReminder ? "text-indigo-300" : "text-white"}`} />
            </button>
            {canManage && (
              <>
                <Link
                  href={`/dashboard/events/create`}
                  className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center"
                  title="Create new event (editing existing events coming soon)"
                >
                  <Pencil className="w-4 h-4 text-white" />
                </Link>
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center disabled:opacity-50"
                >
                  {deleting
                    ? <Loader2 className="w-4 h-4 text-white animate-spin" />
                    : <Trash2 className="w-4 h-4 text-white" />
                  }
                </button>
              </>
            )}
          </div>
        </div>

        {/* ── Title block ── */}
        <div className="relative">
          <span className="inline-block w-fit text-sm font-semibold text-white bg-black/40 rounded-lg px-3 py-1.5 mb-3">
            {formatEventDate(event.startDate)}
          </span>
          <h1 className="text-3xl font-bold text-white leading-tight mb-1">
            {event.title}
          </h1>
          {event.venue && (
            <p className="text-slate-300">{event.venue}</p>
          )}
        </div>
      </div>

      {/* ── Body ── */}
      <div className="px-6 pt-5">

        {/* Organiser row */}
        <div className="flex items-center gap-3 mb-5">
          <div className="w-12 h-12 rounded-full bg-slate-300 shrink-0 flex items-center justify-center overflow-hidden">
            <User className="w-6 h-6 text-slate-500" />
          </div>
          <div className="flex-1">
            <p className="text-slate-400 text-sm">Organized by</p>
            <p className="font-bold text-slate-900">
              {event.createdBy?.fullName ?? "SCH Hub"}
            </p>
          </div>
          {isUpcoming && (
            <button
              onClick={() => setShowReminder(true)}
              className="flex items-center gap-1.5 border border-slate-200 rounded-xl px-4 py-2.5 font-semibold text-slate-800 shrink-0 active:bg-slate-50 transition"
            >
              <Bell className="w-4 h-4" />
              {event.myReminder ? "Reminder set" : "Set reminder"}
            </button>
          )}
        </div>

        {/* Tags */}
        {(event.department || event.level) && (
          <div className="flex items-center gap-4 mb-5 flex-wrap">
            {event.department && (
              <span className="font-semibold text-slate-700 text-sm">
                {event.department.name}
              </span>
            )}
            {event.level && (
              <span className="font-semibold text-slate-700 text-sm">
                Level {event.level}
              </span>
            )}
            <span className="font-semibold text-slate-700 text-sm">
              Open to all students
            </span>
          </div>
        )}

        {/* Description */}
        {event.description && (
          <div className="bg-white rounded-2xl p-5 mb-4">
            <p className="text-slate-600 leading-relaxed">{event.description}</p>
          </div>
        )}

        {/* Tickets section */}
        {isUpcoming && (
          <div className="bg-white rounded-2xl p-5 mb-4">
            <h2 className="text-xl font-bold text-slate-900 mb-1">Tickets</h2>
            <p className="text-slate-500 mb-4">Limited seats available</p>
            <button
              onClick={openTicketModal}
              className="w-full rounded-2xl bg-indigo-500 py-3.5 font-bold text-white shadow-lg shadow-indigo-200 flex items-center justify-center gap-2 transition"
            >
              <Ticket className="w-5 h-5" /> Get ticket
            </button>
          </div>
        )}

        {/* Reminder confirmation */}
        {event.myReminder && (
          <div className="bg-white rounded-2xl p-5 flex items-center gap-3">
            <span className="w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center shrink-0">
              <Check className="w-4 h-4 text-emerald-500" />
            </span>
            <div>
              <p className="font-bold text-slate-900">Reminder set</p>
              <p className="text-slate-500 text-sm">
                {formatReminderDate(event.myReminder.notifyAt)}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* ── Bottom Nav ── */}
      <BottomNav />

      {/* ── Ticket modal ── */}
      {showTicket && (
        loadingTicket ? (
          <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center z-50">
            <Loader2 className="w-8 h-8 text-white animate-spin" />
          </div>
        ) : (
          <TicketModal
            event={event}
            ticket={myTicket}
            onClose={() => setShowTicket(false)}
            onSubmit={handleSubmitReceipt}
            submitting={submittingTicket}
          />
        )
      )}

      {/* ── Reminder modal ── */}
      {showReminder && (
        <ReminderModal
          event={event}
          onClose={() => setShowReminder(false)}
          onSet={handleSetReminder}
          setting={settingReminder}
        />
      )}

      {/* ── Toast ── */}
      {toast && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-sm font-semibold rounded-2xl px-5 py-3 shadow-xl z-50 whitespace-nowrap">
          {toast}
        </div>
      )}
    </div>
  );
}
