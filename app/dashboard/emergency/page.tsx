"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Phone,
  MessageCircle,
  Shield,
  HeartPulse,
  Users,
  HelpCircle,
  Loader2,
  RefreshCw,
  X,
  ArrowLeft,
} from "lucide-react";
import RefreshButton from "@/components/shared/RefreshButton";
import BackButton from "@/components/shared/BackButton";
import { schoolApi } from "@/lib/api/school";

// ─── Types ────────────────────────────────────────────────────────────────────

type Category = "SECURITY" | "CLINIC" | "STUDENT_AFFAIRS" | "OTHER";

interface EmergencyContact {
  id: string;
  name: string;
  role: string;
  phone: string;
  whatsappNumber?: string | null;
  extension?: string | null;
  category: Category;
  order: number;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const CATEGORY_META: Record<
  Category,
  { label: string; icon: React.ElementType; iconBg: string; iconColor: string; headerBg: string; headerText: string }
> = {
  SECURITY: {
    label:      "Security",
    icon:       Shield,
    iconBg:     "bg-indigo-100",
    iconColor:  "text-indigo-600",
    headerBg:   "bg-indigo-50",
    headerText: "text-indigo-700",
  },
  CLINIC: {
    label:      "Clinic / Health",
    icon:       HeartPulse,
    iconBg:     "bg-rose-100",
    iconColor:  "text-rose-600",
    headerBg:   "bg-rose-50",
    headerText: "text-rose-700",
  },
  STUDENT_AFFAIRS: {
    label:      "Student Affairs",
    icon:       Users,
    iconBg:     "bg-emerald-100",
    iconColor:  "text-emerald-600",
    headerBg:   "bg-emerald-50",
    headerText: "text-emerald-700",
  },
  OTHER: {
    label:      "Other",
    icon:       HelpCircle,
    iconBg:     "bg-slate-100",
    iconColor:  "text-slate-500",
    headerBg:   "bg-slate-50",
    headerText: "text-slate-600",
  },
};

const CATEGORY_ORDER: Category[] = ["SECURITY", "CLINIC", "STUDENT_AFFAIRS", "OTHER"];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function buildWhatsAppLink(contact: EmergencyContact): string {
  const number = (contact.whatsappNumber ?? contact.phone).replace(/\D/g, "");
  return `https://wa.me/${number}`;
}

function buildCallLink(contact: EmergencyContact): string {
  const number = contact.extension
    ? `${contact.phone},${contact.extension}`
    : contact.phone;
  return `tel:${number}`;
}

// ─── Contact Card ─────────────────────────────────────────────────────────────

function ContactCard({ contact }: { contact: EmergencyContact }) {
  const meta = CATEGORY_META[contact.category] ?? CATEGORY_META.OTHER;
  const Icon = meta.icon;

  return (
    <div className="bg-white rounded-2xl p-5 flex items-center gap-4">
      {/* Icon */}
      <div className={`w-12 h-12 rounded-2xl ${meta.iconBg} flex items-center justify-center shrink-0`}>
        <Icon className={`w-6 h-6 ${meta.iconColor}`} />
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="font-bold text-slate-900 leading-snug">{contact.name}</p>
        <p className="text-slate-500 text-sm">{contact.role}</p>
        <p className="text-slate-400 text-sm mt-0.5">
          {contact.phone}
          {contact.extension && (
            <span className="ml-1 text-xs font-semibold text-slate-400">
              ext. {contact.extension}
            </span>
          )}
        </p>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 shrink-0">
        {/* WhatsApp */}
        <a
          href={buildWhatsAppLink(contact)}
          target="_blank"
          rel="noopener noreferrer"
          className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center active:bg-emerald-100 transition"
          aria-label={`WhatsApp ${contact.name}`}
        >
          <MessageCircle className="w-5 h-5 text-emerald-600" />
        </a>
        {/* Call */}
        <a
          href={buildCallLink(contact)}
          className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center active:bg-indigo-100 transition"
          aria-label={`Call ${contact.name}`}
        >
          <Phone className="w-5 h-5 text-indigo-600" />
        </a>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function EmergencyPage() {
  const router = useRouter();

  const [contacts, setContacts] = useState<EmergencyContact[]>([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await schoolApi.getEmergencyContacts();
      setContacts(Array.isArray(data) ? data : []);
    } catch (e: any) {
      setError(e.message || "Failed to load emergency contacts.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // Group by category, in defined order
  const grouped = CATEGORY_ORDER.reduce<Record<Category, EmergencyContact[]>>(
    (acc, cat) => {
      acc[cat] = contacts.filter((c) => c.category === cat);
      return acc;
    },
    { SECURITY: [], CLINIC: [], STUDENT_AFFAIRS: [], OTHER: [] },
  );

  return (
    <div className="min-h-screen w-full bg-slate-50 px-5 py-5">

      {/* ── Header ── */}
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            aria-label="Go back"
            className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm transition active:bg-slate-50"
          >
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
          <div>
            <p className="text-xs font-bold tracking-widest text-slate-400 uppercase">
              SCH Hub
            </p>
            <h1 className="text-2xl font-bold text-slate-900">Emergency Contacts</h1>
          </div>
        </div>
        <RefreshButton onClick={() => load()} loading={loading} />
      </div>
      <p className="text-slate-500 mb-5">Tap a contact to call or message</p>

      {/* ── SOS Banner ── */}
      <a
        href="tel:112"
        className="flex items-center gap-4 bg-rose-500 rounded-2xl px-5 py-4 mb-6 shadow-lg shadow-rose-200 active:bg-rose-600 transition"
      >
        <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center shrink-0">
          <Phone className="w-6 h-6 text-white" />
        </div>
        <div className="flex-1">
          <p className="font-bold text-white text-lg leading-tight">Call Emergency Services</p>
          <p className="text-rose-100 text-sm">Dial 112 · Available 24/7</p>
        </div>
        <span className="text-white font-black text-2xl tracking-tight">112</span>
      </a>

      {/* ── Error ── */}
      {error && (
        <div className="flex items-center justify-between bg-rose-50 text-rose-600 rounded-xl px-4 py-3 mb-4 font-medium text-sm">
          <span>{error}</span>
          <button onClick={() => setError(null)}><X className="w-4 h-4" /></button>
        </div>
      )}

      {/* ── Loading ── */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
        </div>
      ) : contacts.length === 0 ? (
        <div className="flex flex-col items-center py-20 gap-3">
          <Phone className="w-12 h-12 text-slate-300" />
          <p className="text-slate-400 font-medium">No emergency contacts available</p>
          <p className="text-slate-400 text-sm text-center px-8">
            Contact your school admin to add emergency contacts.
          </p>
        </div>
      ) : (
        /* ── Grouped sections ── */
        CATEGORY_ORDER.filter((cat) => grouped[cat].length > 0).map((cat) => {
          const meta = CATEGORY_META[cat];
          const Icon = meta.icon;
          return (
            <div key={cat} className="mb-6">
              {/* Section header */}
              <div className={`flex items-center gap-2 ${meta.headerBg} rounded-xl px-4 py-2.5 mb-3`}>
                <Icon className={`w-4 h-4 ${meta.iconColor} shrink-0`} />
                <span className={`text-sm font-bold ${meta.headerText}`}>{meta.label}</span>
                <span className={`ml-auto text-xs font-bold ${meta.headerText} opacity-60`}>
                  {grouped[cat].length}
                </span>
              </div>
              {/* Cards */}
              <div className="flex flex-col gap-3">
                {grouped[cat].map((contact) => (
                  <ContactCard key={contact.id} contact={contact} />
                ))}
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}
