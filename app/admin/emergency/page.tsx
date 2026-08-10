"use client";

import { useEffect, useState } from "react";
import { schoolApi } from "@/lib/api/school";
import { PhoneCall, Plus, Trash2, AlertCircle, X } from "lucide-react";

interface Contact {
  id: string;
  name: string;
  role?: string;
  phone: string;
  whatsappNumber?: string;
  extension?: string;
  category: string;
  order: number;
}

const CATEGORIES = ["SECURITY", "CLINIC", "STUDENT_AFFAIRS", "OTHER"];

const CAT_BADGE: Record<string, string> = {
  SECURITY:        "bg-red-100 text-red-700",
  CLINIC:          "bg-emerald-100 text-emerald-700",
  STUDENT_AFFAIRS: "bg-blue-100 text-blue-700",
  OTHER:           "bg-muted text-muted-foreground",
};

function CreateContactModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: (c: Contact) => void;
}) {
  const [form, setForm] = useState({ name: "", role: "", phone: "", whatsappNumber: "", extension: "", category: "OTHER", order: "0" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function set(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const payload: Record<string, unknown> = {
        name: form.name,
        phone: form.phone,
        category: form.category,
        order: Number(form.order),
      };
      if (form.role)          payload.role          = form.role;
      if (form.whatsappNumber) payload.whatsappNumber = form.whatsappNumber;
      if (form.extension)     payload.extension     = form.extension;

      const created = await schoolApi.createEmergencyContact(payload);
      onCreated(created as Contact);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-card rounded-2xl w-full max-w-md p-6 shadow-xl">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-bold text-lg text-foreground">Add Emergency Contact</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted">
            <X className="w-4 h-4" />
          </button>
        </div>

        {error && (
          <div className="mb-4 bg-destructive/10 text-destructive rounded-xl p-3 flex items-center gap-2 text-sm">
            <AlertCircle className="w-4 h-4 shrink-0" /> {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {[
            { label: "Name *",    field: "name",           required: true },
            { label: "Role",      field: "role",           required: false },
            { label: "Phone *",   field: "phone",          required: true },
            { label: "WhatsApp",  field: "whatsappNumber", required: false },
            { label: "Extension", field: "extension",      required: false },
          ].map(({ label, field, required }) => (
            <div key={field} className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-foreground">{label}</label>
              <input
                required={required}
                value={(form as any)[field]}
                onChange={(e) => set(field, e.target.value)}
                className="px-3 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          ))}

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-foreground">Category</label>
              <select
                value={form.category}
                onChange={(e) => set("category", e.target.value)}
                className="px-3 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-foreground">Order</label>
              <input
                type="number"
                min="0"
                value={form.order}
                onChange={(e) => set("order", e.target.value)}
                className="px-3 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </div>

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-border text-sm font-medium hover:bg-muted transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="flex-1 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 disabled:opacity-60 transition-opacity">
              {loading ? "Saving…" : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function AdminEmergencyPage() {
  const [contacts, setContacts]   = useState<Contact[]>([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    schoolApi
      .getEmergencyContacts()
      .then((data: any) => setContacts(Array.isArray(data) ? data : []))
      .catch((e: any) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  async function handleDelete(id: string) {
    if (!confirm("Delete this contact?")) return;
    setDeletingId(id);
    try {
      await schoolApi.deleteEmergencyContact(id);
      setContacts((prev) => prev.filter((c) => c.id !== id));
    } catch (e: any) {
      alert(e.message);
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Emergency Contacts</h1>
          <p className="text-muted-foreground text-sm mt-1">{contacts.length} contacts</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity"
        >
          <Plus className="w-4 h-4" />
          Add Contact
        </button>
      </div>

      {error && (
        <div className="bg-destructive/10 text-destructive rounded-xl p-4 flex items-center gap-2 text-sm">
          <AlertCircle className="w-4 h-4 shrink-0" /> {error}
        </div>
      )}

      {loading ? (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-card rounded-2xl p-5 h-20 animate-pulse" />
          ))}
        </div>
      ) : contacts.length === 0 ? (
        <div className="bg-card rounded-2xl p-10 text-center text-muted-foreground text-sm">
          No emergency contacts yet.
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {contacts.map((c) => (
            <div key={c.id} className="bg-card rounded-2xl p-4 flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <PhoneCall className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-semibold text-foreground">{c.name}</p>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${CAT_BADGE[c.category] ?? CAT_BADGE.OTHER}`}>
                    {c.category}
                  </span>
                </div>
                {c.role && <p className="text-xs text-muted-foreground">{c.role}</p>}
                <p className="text-sm text-foreground mt-0.5">{c.phone}</p>
              </div>
              <button
                disabled={deletingId === c.id}
                onClick={() => handleDelete(c.id)}
                className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors disabled:opacity-50 shrink-0"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <CreateContactModal
          onClose={() => setShowModal(false)}
          onCreated={(c) => {
            setContacts((prev) => [...prev, c].sort((a, b) => a.order - b.order));
            setShowModal(false);
          }}
        />
      )}
    </div>
  );
}
