"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Calendar,
  Ticket,
  Phone,
  Plus,
  MapPin,
  Bell,
  BellOff,
  X,
  Loader2,
  CheckCircle2,
  ClipboardPaste,
  Clock,
  AlertTriangle,
} from "lucide-react";
import { useRouter } from "next/navigation";
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
  departmentId?: string | null;
  level?: string | null;
  isActive: boolean;
  createdAt: string;
  department?: { name: string } | null;
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

const CAN_CREATE: UserRole[] = [
  "COURSE_REP",
  "EVENT_ORCHESTRATOR",
  "SCHOOL_ADMIN",
  "SUPER_ADMIN",
];

const LEVEL_FILTERS = ["All", "100 Level", "200 Level", "300 Level", "400 Level", "500 Level"];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatEventDate(iso: string) {
  const d = new Date(iso);
  const date = d.toLocaleDateString("en-NG", {
    weekday: "short",
    month:   "short",
    day:     "numeric",
  });
  const time = d.toLocaleTimeString("en-NG", {
    hour:   "numeric",
    minute: "2-digit",
  });
  return `${date} · ${time}`;
}

function isUpcoming(iso: string) {
  return new Date(iso) > new Date();
}

// ─── Ticket Claim Modal ───────────────────────────────────────────────────────

const STATUS_CONFIG: Record<
  TicketStatus,
  { icon: React.ReactNode; label: string; body: string; badge: string; iconBg: string }
> = {
  PENDING: {
    icon:   <Clock className="w-5 h-5 text-amber-500" />,
    label:  "Receipt submitted",
    body:   "Waiting for admin verification",
    badge:  "bg-amber-50 text-amber-600",
    iconBg: "bg-amber-50",
  },
  APPROVED: {
    icon:   <CheckCircle2 className="w-5 h-5 text-emerald-500" />,
    label:  "Ticket approved",
    body:   "Your receipt has been verified successfully",
    badge:  "bg-emerald-50 text-emerald-600",
    iconBg: "bg-emerald-50",
  },
  REJECTED: {
    icon:   <AlertTriangle className="w-5 h-5 text-red-500" />,
    label:  "Receipt rejected",
    body:   "Please resubmit with a valid receipt",
    badge:  "bg-red-50 text-red-600",
    iconBg: "bg-red-50",
  },
};

function TicketClaimModal({
  event,
  ticket,
  onClose,
  onSubmit,
  submitting,
}: {
  event: SchoolEvent;
  ticket: MyTicket | null;
  onClose: () => void;
  onSubmit: (receiptUrl: string, receiptKey: string) => Promise<void>;
  submitting: boolean;
}) {
  const [receiptLink, setReceiptLink] = useState(ticket?.receiptUrl ?? "");
  const [receiptRef, setReceiptRef]   = useState(ticket?.receiptKey  ?? "");

  async function handlePaste(setter: (v: string) => void) {
    try {
      const text = await navigator.clipboard.readText();
      setter(text);
    } catch {}
  }

  const cfg = ticket ? STATUS_CONFIG[ticket.status] : null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 flex items-end justify-center z-50">
      <div className="w-full max-w-md bg-white rounded-t-3xl p-6">

        <div className="flex items-start justify-between mb-2">
          <h1 className="text-2xl font-bold text-slate-900 pr-4">
            {event.title} Ticket
          </h1>
          <button onClick={onClose} className="text-indigo-500 font-semibold shrink-0">
            View event
          </button>
        </div>
        <p className="text-slate-500 mb-5">
          Submit your payment receipt to claim your event ticket
        </p>

        {cfg && ticket && (
          <div className="rounded-2xl border border-slate-100 p-4 flex items-center gap-3 mb-6">
            <div className={`w-10 h-10 rounded-full ${cfg.iconBg} flex items-center justify-center shrink-0`}>
              {cfg.icon}
            </div>
            <div className="flex-1">
              <p className="font-bold text-slate-900">{cfg.label}</p>
              <p className="text-slate-500 text-sm">
                {ticket.status === "REJECTED" && ticket.rejectionReason
                  ? ticket.rejectionReason
                  : cfg.body}
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
            onClick={() => handlePaste(setReceiptLink)}
            className="flex items-center gap-1.5 bg-slate-100 rounded-lg px-3 py-1.5 font-semibold text-slate-700 text-sm shrink-0"
          >
            <ClipboardPaste className="w-3.5 h-3.5" /> Paste
          </button>
        </div>

        <label className="font-semibold text-slate-800 block mb-2">
          Receipt reference / key
        </label>
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
          {submitting ? (
            <span className="flex items-center justify-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" /> Submitting…
            </span>
          ) : ticket?.status === "REJECTED" ? "Resubmit receipt" : "Submit receipt"}
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
    event.myReminder
      ? new Date(event.myReminder.notifyAt).toISOString().slice(0, 16)
      : defaultTime,
  );

  return (
    <div className="fixed inset-0 bg-slate-900/60 flex items-end justify-center z-50">
      <div className="w-full max-w-md bg-white rounded-t-3xl p-6">
        <div className="flex items-start justify-between mb-2">
          <h2 className="text-xl font-bold text-slate-900 pr-4">Set Reminder</h2>
          <button onClick={onClose} className="text-slate-400 shrink-0 mt-1">
            <X className="w-5 h-5" />
          </button>
        </div>
        <p className="text-slate-500 mb-5">
          Choose when to be notified before{" "}
          <span className="font-semibold text-slate-700">{event.title}</span>
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
          {setting ? (
            <span className="flex items-center justify-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" /> Saving…
            </span>
          ) : event.myReminder ? "Update reminder" : "Set reminder"}
        </button>
      </div>
    </div>
  );
}

// ─── Event Card ───────────────────────────────────────────────────────────────

function EventCard({
  event,
  onTicket,
  onReminder,
}: {
  event: SchoolEvent;
  onTicket: (e: SchoolEvent) => void;
  onReminder: (e: SchoolEvent) => void;
}) {
  const router   = useRouter();
  const upcoming = isUpcoming(event.startDate);

  // Build tag list from department name + level
  const tags: string[] = [];
  if (event.department?.name) tags.push(event.department.name);
  if (event.level)            tags.push(`${event.level} Level`);
  if (tags.length === 0)      tags.push("All Levels");

  return (
    <div
      className="rounded-2xl overflow-hidden bg-white cursor-pointer"
      onClick={() => router.push(`/dashboard/events/${event.id}`)}
    >
      {/* ── Image / date overlay ── */}
      <div className="relative aspect-video bg-slate-800">
        {event.imageUrl && (
          <img
            src={event.imageUrl}
            alt={event.title}
            className="absolute inset-0 w-full h-full object-cover"
          />
        )}
        <span className="absolute bottom-3 left-3 text-white text-sm font-semibold bg-black/40 rounded-lg px-2.5 py-1">
          {formatEventDate(event.startDate)}
        </span>
        {/* Upcoming / Past badge */}
        <span
          className={`absolute top-3 right-3 text-xs font-bold rounded-lg px-2.5 py-1 ${
            upcoming
              ? "bg-indigo-500 text-white"
              : "bg-black/40 text-white"
          }`}
        >
          {upcoming ? "UPCOMING" : "PAST"}
        </span>
      </div>

      {/* ── Body ── */}
      <div className="p-4">
        <h3 className="text-lg font-bold text-slate-900 mb-1">{event.title}</h3>

        {event.venue && (
          <p className="text-slate-500 mb-2 flex items-center gap-1.5 text-sm">
            <MapPin className="w-3.5 h-3.5 shrink-0" />
            {event.venue}
          </p>
        )}

        {/* Tags row */}
        <div className="flex gap-2 flex-wrap mb-3">
          {tags.map((t) => (
            <span key={t} className="text-sm font-semibold text-slate-700">
              {t}
            </span>
          ))}
        </div>

        {/* Actions — only for upcoming events */}
        {upcoming && (
          <div className="flex items-center gap-2">
            <button
              onClick={(e) => { e.stopPropagation(); onReminder(event); }}
              className={`flex items-center gap-1.5 text-sm font-semibold rounded-xl px-3 py-2 transition ${
                event.myReminder
                  ? "bg-indigo-50 text-indigo-600"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {event.myReminder
                ? <Bell className="w-4 h-4" />
                : <BellOff className="w-4 h-4" />
              }
              {event.myReminder ? "Reminder set" : "Remind me"}
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onTicket(event); }}
              className="ml-auto flex items-center gap-1.5 text-sm font-semibold rounded-xl px-4 py-2 bg-indigo-500 text-white shadow-sm shadow-indigo-200 hover:bg-indigo-600 transition"
            >
              <Ticket className="w-4 h-4" />
              Get ticket
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function CampusEventsPage() {
  const [events, setEvents]           = useState<SchoolEvent[]>([]);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState("All");
  const [canCreate, setCanCreate]     = useState(false);

  // Modals
  const [ticketEvent, setTicketEvent]         = useState<SchoolEvent | null>(null);
  const [reminderEvent, setReminderEvent]     = useState<SchoolEvent | null>(null);
  const [myTicket, setMyTicket]               = useState<MyTicket | null>(null);
  const [loadingTicket, setLoadingTicket]     = useState(false);
  const [submittingTicket, setSubmittingTicket] = useState(false);
  const [settingReminder, setSettingReminder] = useState(false);
  const [toastMsg, setToastMsg]               = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await schoolApi.getEvents({ upcoming: "true" });
      setEvents(Array.isArray(data) ? data : []);
    } catch (e: any) {
      setError(e.message || "Failed to load events.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    usersApi.getMe()
      .then((u) => setCanCreate(CAN_CREATE.includes(u.role)))
      .catch(() => {});
  }, []);

  // ── Build category tabs from real data ──
  const deptNames = Array.from(
    new Set(events.map((e) => e.department?.name).filter(Boolean) as string[]),
  );
  const levelNames = Array.from(
    new Set(events.map((e) => (e.level ? `${e.level} Level` : null)).filter(Boolean) as string[]),
  ).sort();
  const categories = ["All", ...deptNames, ...levelNames];

  // ── Filter events by active tab ──
  const filtered = events.filter((e) => {
    if (activeFilter === "All") return true;
    if (e.department?.name === activeFilter) return true;
    if (e.level && `${e.level} Level` === activeFilter) return true;
    return false;
  });

  function showToast(msg: string) {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  }

  async function openTicketModal(event: SchoolEvent) {
    setTicketEvent(event);
    setMyTicket(null);
    setLoadingTicket(true);
    try {
      const ticket = await schoolApi.getMyTicket(event.id);
      setMyTicket(ticket ?? null);
    } catch {
      // no ticket yet
    } finally {
      setLoadingTicket(false);
    }
  }

  async function handleSubmitReceipt(receiptUrl: string, receiptKey: string) {
    if (!ticketEvent) return;
    setSubmittingTicket(true);
    try {
      const ticket = await schoolApi.submitReceipt(ticketEvent.id, receiptUrl, receiptKey);
      setMyTicket(ticket);
      showToast("Receipt submitted! Awaiting verification.");
    } catch (e: any) {
      showToast(e.message || "Failed to submit receipt.");
    } finally {
      setSubmittingTicket(false);
    }
  }

  async function handleSetReminder(notifyAt: string) {
    if (!reminderEvent) return;
    setSettingReminder(true);
    try {
      await schoolApi.setEventReminder(reminderEvent.id, notifyAt);
      setEvents((prev) =>
        prev.map((e) =>
          e.id === reminderEvent.id ? { ...e, myReminder: { notifyAt } } : e,
        ),
      );
      showToast("Reminder saved!");
      setReminderEvent(null);
    } catch (e: any) {
      showToast(e.message || "Failed to set reminder.");
    } finally {
      setSettingReminder(false);
    }
  }

  return (
    <div className="min-h-screen w-full bg-slate-50 px-5 py-5 pb-24">

      {/* ── Header ── */}
      <div className="flex items-start justify-between mb-4">
        <BackButton href="/dashboard" />
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Campus Events</h1>
          <p className="text-slate-500">Browse upcoming events</p>
        </div>
        {canCreate && (
          <Link
            href="/dashboard/events/create"
            className="border border-slate-300 rounded-xl px-4 py-2.5 font-bold text-slate-800 shrink-0 active:bg-slate-100 transition"
          >
            Create event
          </Link>
        )}
      </div>

      {/* ── Category filter pills ── */}
      <div className="flex gap-2 overflow-x-auto mb-5 pb-1 scrollbar-none">
        {categories.map((c) => (
          <button
            key={c}
            onClick={() => setActiveFilter(c)}
            className={`shrink-0 text-sm font-bold px-4 py-2.5 rounded-full transition ${
              activeFilter === c
                ? "bg-slate-900 text-white"
                : "bg-white border border-slate-200 text-slate-600"
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      {/* ── Error banner ── */}
      {error && (
        <div className="flex items-center justify-between bg-rose-50 text-rose-600 rounded-xl px-4 py-3 mb-4 font-medium">
          <span>{error}</span>
          <button onClick={() => setError(null)}>
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ── Content ── */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <Ticket className="w-12 h-12 text-slate-300" />
          <p className="text-slate-500 font-medium">No events found</p>
          {activeFilter !== "All" && (
            <button
              onClick={() => setActiveFilter("All")}
              className="text-indigo-500 text-sm font-semibold underline"
            >
              Clear filter
            </button>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-5">
          {filtered.map((event) => (
            <EventCard
              key={event.id}
              event={event}
              onTicket={openTicketModal}
              onReminder={setReminderEvent}
            />
          ))}
        </div>
      )}

      <BottomNav />

      {/* ── Ticket modal ── */}
      {ticketEvent && (
        loadingTicket ? (
          <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center z-50">
            <Loader2 className="w-8 h-8 text-white animate-spin" />
          </div>
        ) : (
          <TicketClaimModal
            event={ticketEvent}
            ticket={myTicket}
            onClose={() => setTicketEvent(null)}
            onSubmit={handleSubmitReceipt}
            submitting={submittingTicket}
          />
        )
      )}

      {/* ── Reminder modal ── */}
      {reminderEvent && (
        <ReminderModal
          event={reminderEvent}
          onClose={() => setReminderEvent(null)}
          onSet={handleSetReminder}
          setting={settingReminder}
        />
      )}

      {/* ── Toast ── */}
      {toastMsg && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-sm font-semibold rounded-2xl px-5 py-3 shadow-xl z-50 whitespace-nowrap">
          {toastMsg}
        </div>
      )}
    </div>
  );
}
