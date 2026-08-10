"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft, Plus, Trash2, Loader2, X,
  DoorOpen, Accessibility, MapPin,
} from "lucide-react";
import { adminApi } from "@/lib/api/admin";

type EntranceKind = "MAIN" | "SECONDARY" | "ACCESSIBLE" | "SERVICE" | "EMERGENCY";

interface Entrance {
  id?:           string;
  name?:         string;
  kind?:         EntranceKind;
  isAccessible?: boolean;
  priority?:     number;
  geometry?:     { type: string; coordinates: [number, number] };
}

interface EntForm {
  name: string; kind: EntranceKind; lat: string; lng: string;
  isAccessible: boolean; priority: string;
}

const KIND_OPTIONS: { value: EntranceKind; label: string }[] = [
  { value: "MAIN",       label: "Main" },
  { value: "SECONDARY",  label: "Secondary" },
  { value: "ACCESSIBLE", label: "Accessible" },
  { value: "SERVICE",    label: "Service" },
  { value: "EMERGENCY",  label: "Emergency" },
];

const KIND_BADGE: Record<EntranceKind, string> = {
  MAIN:       "bg-indigo-100 text-indigo-700",
  SECONDARY:  "bg-slate-100 text-slate-600",
  ACCESSIBLE: "bg-emerald-100 text-emerald-700",
  SERVICE:    "bg-amber-100 text-amber-700",
  EMERGENCY:  "bg-rose-100 text-rose-600",
};

const EMPTY: EntForm = { name: "", kind: "SECONDARY", lat: "", lng: "", isAccessible: false, priority: "0" };

export default function ManageEntrancesPage() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const schoolId     = searchParams.get("schoolId") ?? "";
  const featureId    = searchParams.get("featureId") ?? "";
  const featureName  = searchParams.get("featureName") ?? "Feature";

  const [entrances, setEntrances] = useState<Entrance[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState<string | null>(null);
  const [showForm,  setShowForm]  = useState(false);
  const [form,      setForm]      = useState<EntForm>(EMPTY);
  const [saving,    setSaving]    = useState(false);
  const [deleting,  setDeleting]  = useState<string | null>(null);

  useEffect(() => {
    if (!schoolId) { setLoading(false); return; }
    adminApi.getMapEntrances(schoolId)
      .then((e) => {
        const all = Array.isArray(e) ? (e as Entrance[]) : [];
        // Filter to this feature's entrances when a featureId is provided
        setEntrances(featureId ? all.filter((en: any) => en.featureId === featureId) : all);
      })
      .catch(() => setEntrances([]))
      .finally(() => setLoading(false));
  }, [schoolId, featureId]);

  function setF(field: keyof EntForm, value: string | boolean) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) { setError("Name is required."); return; }
    setSaving(true); setError(null);
    try {
      const lat = parseFloat(form.lat);
      const lng = parseFloat(form.lng);
      await adminApi.upsertMapEntrance(schoolId, {
        featureId,
        name: form.name,
        kind: form.kind,
        isAccessible: form.isAccessible,
        priority: parseInt(form.priority) || 0,
        geometry: { type: "Point", coordinates: [isNaN(lng) ? 0 : lng, isNaN(lat) ? 0 : lat] },
      });
      const updated = await adminApi.getMapEntrances(schoolId);
      const all = Array.isArray(updated) ? (updated as Entrance[]) : [];
      setEntrances(featureId ? all.filter((en: any) => en.featureId === featureId) : all);
      setShowForm(false);
      setForm(EMPTY);
    } catch (e: any) { setError(e.message || "Failed to add entrance."); }
    finally { setSaving(false); }
  }

  async function handleDelete(entranceId: string) {
    setDeleting(entranceId); setError(null);
    try {
      await adminApi.deleteMapEntrance(schoolId, entranceId);
      setEntrances((prev) => prev.filter((e) => e.id !== entranceId));
    } catch (e: any) { setError(e.message || "Failed to delete."); }
    finally { setDeleting(null); }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-white px-4 pt-5 pb-4 flex items-center gap-3 border-b border-slate-100">
        <button onClick={() => router.back()} className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
          <ArrowLeft className="w-5 h-5 text-slate-700" />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-bold text-slate-900">Manage Entrances</h1>
          <p className="text-xs text-slate-400 truncate">{featureName}</p>
        </div>
        <button onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-1.5 text-sm font-bold text-indigo-500 bg-indigo-50 px-3 py-2 rounded-xl transition active:bg-indigo-100">
          <Plus className="w-4 h-4" /> Add
        </button>
      </div>

      <div className="px-4 py-4 max-w-lg mx-auto flex flex-col gap-3">
        {error && (
          <div className="flex items-center justify-between bg-rose-50 text-rose-600 rounded-2xl px-4 py-3 text-sm font-medium">
            <span>{error}</span>
            <button onClick={() => setError(null)}><X className="w-4 h-4" /></button>
          </div>
        )}

        {showForm && (
          <form onSubmit={handleAdd} className="bg-white rounded-2xl shadow-sm px-5 py-4 flex flex-col gap-3">
            <h2 className="font-bold text-slate-900 text-sm">New Entrance</h2>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-600">Name *</label>
              <input type="text" value={form.name} onChange={(e) => setF("name", e.target.value)} placeholder="e.g. Main Gate"
                className="px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-600">Kind</label>
                <select value={form.kind} onChange={(e) => setF("kind", e.target.value)}
                  className="px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-white">
                  {KIND_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-600">Priority</label>
                <input type="number" value={form.priority} onChange={(e) => setF("priority", e.target.value)} min={0}
                  className="px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-600">Latitude</label>
                <input type="number" step="any" value={form.lat} onChange={(e) => setF("lat", e.target.value)} placeholder="6.5"
                  className="px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-600">Longitude</label>
                <input type="number" step="any" value={form.lng} onChange={(e) => setF("lng", e.target.value)} placeholder="3.3"
                  className="px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" />
              </div>
            </div>
            <div className="flex items-center justify-between py-1">
              <label className="text-sm font-semibold text-slate-700">Wheelchair accessible</label>
              <button type="button" onClick={() => setF("isAccessible", !form.isAccessible)}
                className={`w-11 h-6 rounded-full transition-colors relative ${form.isAccessible ? "bg-emerald-500" : "bg-slate-200"}`}>
                <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${form.isAccessible ? "translate-x-5" : "translate-x-0.5"}`} />
              </button>
            </div>
            <div className="flex gap-2">
              <button type="button" onClick={() => { setShowForm(false); setForm(EMPTY); }}
                className="flex-1 rounded-xl border-2 border-slate-200 py-2.5 text-sm font-bold text-slate-600 transition active:bg-slate-50">Cancel</button>
              <button type="submit" disabled={saving}
                className="flex-1 rounded-xl bg-indigo-500 py-2.5 text-sm font-bold text-white flex items-center justify-center gap-1.5 disabled:opacity-50">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null} Add Entrance
              </button>
            </div>
          </form>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-10"><Loader2 className="w-7 h-7 text-indigo-400 animate-spin" /></div>
        ) : entrances.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm px-5 py-12 flex flex-col items-center gap-3 text-center">
            <DoorOpen className="w-10 h-10 text-slate-200" />
            <p className="text-slate-400 font-medium">No entrances defined yet.</p>
          </div>
        ) : (
          entrances.map((ent, i) => (
            <div key={ent.id ?? i} className="bg-white rounded-2xl shadow-sm px-5 py-4 flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center shrink-0">
                {ent.isAccessible ? <Accessibility className="w-4 h-4 text-emerald-500" /> : <DoorOpen className="w-4 h-4 text-slate-400" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-slate-900 text-sm">{ent.name ?? "Entrance"}</p>
                <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                  {ent.kind && (
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-lg ${KIND_BADGE[ent.kind]}`}>{ent.kind}</span>
                  )}
                  {ent.geometry?.coordinates && (
                    <span className="flex items-center gap-0.5 text-xs text-slate-400">
                      <MapPin className="w-3 h-3" />
                      {ent.geometry.coordinates[1]?.toFixed(4)}, {ent.geometry.coordinates[0]?.toFixed(4)}
                    </span>
                  )}
                </div>
              </div>
              {ent.id && (
                <button onClick={() => handleDelete(ent.id!)} disabled={deleting === ent.id}
                  className="w-9 h-9 rounded-xl bg-rose-50 flex items-center justify-center shrink-0 disabled:opacity-50 transition active:bg-rose-100">
                  {deleting === ent.id ? <Loader2 className="w-4 h-4 text-rose-400 animate-spin" /> : <Trash2 className="w-4 h-4 text-rose-400" />}
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
