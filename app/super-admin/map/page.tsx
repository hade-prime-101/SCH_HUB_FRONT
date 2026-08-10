"use client";

import dynamic from "next/dynamic";
import { useState, useEffect, useCallback, useRef } from "react";
import { adminApi } from "@/lib/api/admin";
import {
  Map, Plus, Trash2, Upload, Download, AlertCircle,
  Loader2, X, Image as ImageIcon, DoorOpen, ChevronDown,
  MapPin, RefreshCw,
} from "lucide-react";

// ── Lazy-load the Leaflet-based interactive picker (SSR disabled) ──────────────
const InteractiveMapPicker = dynamic(
  () => import("@/components/super-admin/InteractiveMapPicker"),
  { ssr: false, loading: () => (
    <div className="flex items-center justify-center min-h-[380px] rounded-2xl bg-muted">
      <Loader2 className="w-6 h-6 animate-spin text-primary" />
    </div>
  )},
);

// ── Types ─────────────────────────────────────────────────────────────────────

interface School { id: string; name: string; shortCode: string; latitude?: number; longitude?: number }

interface MapLocation {
  id:          string;
  name:        string;
  type?:       string;
  category?:   string;
  description?: string;
  latitude?:   number;
  longitude?:  number;
  imageUrl?:   string | null;
  tags?:       string[];
}

interface MapEntrance {
  id:        string;
  name:      string;
  latitude?: number;
  longitude?: number;
}

type ActiveTab = "interactive" | "locations" | "entrances" | "import";

const INPUT = "w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring";

// ── EntranceForm modal ────────────────────────────────────────────────────────

function EntranceForm({ onClose, onSubmit, loading, error }: {
  onClose: () => void;
  onSubmit: (d: Record<string, string>) => void;
  loading: boolean;
  error: string | null;
}) {
  const [f, setF] = useState({ name: "", latitude: "", longitude: "" });
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-card rounded-2xl w-full max-w-sm p-6 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-foreground">Add Entrance</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted"><X className="w-4 h-4" /></button>
        </div>
        {error && (
          <div className="mb-3 bg-destructive/10 text-destructive rounded-xl p-3 text-sm flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />{error}
          </div>
        )}
        <div className="flex flex-col gap-3">
          {([
            { label: "Name *",    key: "name",      placeholder: "e.g. Main Gate" },
            { label: "Latitude",  key: "latitude",  placeholder: "7.3775" },
            { label: "Longitude", key: "longitude", placeholder: "4.5399" },
          ] as const).map(({ label, key, placeholder }) => (
            <div key={key} className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-muted-foreground">{label}</label>
              <input
                value={(f as any)[key]}
                onChange={e => setF(p => ({ ...p, [key]: e.target.value }))}
                placeholder={placeholder}
                className={INPUT}
              />
            </div>
          ))}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-border text-sm font-medium">Cancel</button>
            <button
              onClick={() => onSubmit(f)}
              disabled={loading}
              className="flex-1 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {loading ? "Saving…" : "Save"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Image upload modal ────────────────────────────────────────────────────────

function ImageUploadModal({ location, schoolId, onClose, onUploaded }: {
  location: MapLocation;
  schoolId: string;
  onClose:    () => void;
  onUploaded: (url: string) => void;
}) {
  const [preview, setPreview] = useState<string | null>(location.imageUrl ?? null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    // Local preview
    const reader = new FileReader();
    reader.onload = ev => setPreview(ev.target?.result as string ?? null);
    reader.readAsDataURL(file);

    setUploading(true); setUploadError(null);
    try {
      const result: any = await adminApi.uploadMapFeatureImage(schoolId, location.id, file);
      const url: string = result?.imageUrl ?? result?.url ?? preview ?? "";
      onUploaded(url);
      onClose();
    } catch (err: any) {
      setUploadError(err.message ?? "Upload failed.");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-card rounded-2xl w-full max-w-sm p-6 shadow-xl flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-foreground">Upload Image</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted"><X className="w-4 h-4" /></button>
        </div>

        <p className="text-sm text-muted-foreground">
          Upload a cover image for <span className="font-semibold text-foreground">{location.name}</span>.
        </p>

        {/* Preview */}
        <div
          className="relative w-full aspect-video rounded-xl border-2 border-dashed border-border bg-muted flex items-center justify-center overflow-hidden cursor-pointer hover:border-primary transition-colors"
          onClick={() => fileRef.current?.click()}
        >
          {preview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={preview} alt="Preview" className="w-full h-full object-cover" />
          ) : (
            <div className="flex flex-col items-center gap-2 text-muted-foreground">
              <ImageIcon className="w-8 h-8" />
              <span className="text-sm">Click to choose image</span>
            </div>
          )}
          {uploading && (
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
              <Loader2 className="w-6 h-6 animate-spin text-white" />
            </div>
          )}
        </div>

        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />

        {uploadError && (
          <div className="bg-destructive/10 text-destructive rounded-xl px-4 py-3 text-sm flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />{uploadError}
          </div>
        )}

        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-border text-sm font-medium">
            Cancel
          </button>
          <button
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="flex-1 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {uploading ? <><Loader2 className="w-4 h-4 animate-spin" />Uploading…</> : <><Upload className="w-4 h-4" />Choose & Upload</>}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function SuperAdminMapPage() {
  const [schools, setSchools]         = useState<School[]>([]);
  const [selected, setSelected]       = useState<School | null>(null);
  const [tab, setTab]                 = useState<ActiveTab>("interactive");

  const [locations, setLocations]     = useState<MapLocation[]>([]);
  const [entrances, setEntrances]     = useState<MapEntrance[]>([]);

  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState<string | null>(null);

  const [showEntranceForm, setShowEF] = useState(false);
  const [modalLoading, setMLoding]    = useState(false);
  const [modalError, setMError]       = useState<string | null>(null);
  const [deletingId, setDelId]        = useState<string | null>(null);

  // interactive tab
  const [mapSaving, setMapSaving]     = useState(false);
  const [mapError, setMapError]       = useState<string | null>(null);

  // import tab
  const [importing, setImporting]     = useState(false);
  const [importText, setImportText]   = useState("");
  const [importError, setImportError] = useState<string | null>(null);
  const [importDone, setImportDone]   = useState(false);

  // image upload modal
  const [imageTarget, setImageTarget] = useState<MapLocation | null>(null);

  // list expand
  const [expandedId, setExpandedId]   = useState<string | null>(null);

  // ── Bootstrap ──────────────────────────────────────────────────────────────

  useEffect(() => {
    adminApi.getSchools()
      .then((d: any) => setSchools(Array.isArray(d) ? d : []))
      .catch(() => {});
  }, []);

  /** Accepts any non-empty ID string (cuid, UUID, or other format-agnostic IDs) */
  function isValidId(id: unknown): id is string {
    return typeof id === "string" && id.trim().length > 0;
  }

  /** Resolve the school ID — the backend may use 'id', 'schoolId', or 'uuid' */
  function resolveSchoolId(s: School & Record<string, any>): string {
    return s.id || s.schoolId || s.uuid || "";
  }

  const loadSchoolData = useCallback(async (school: School) => {
    const schoolId = resolveSchoolId(school as any);
    if (!isValidId(schoolId)) {
      setError(`Invalid school ID "${schoolId}" — no valid ID field found on the school record.`);
      return;
    }
    setLoading(true); setError(null);
    setLocations([]); setEntrances([]);
    try {
      const [locsRaw, entsRaw] = await Promise.all([
        adminApi.getMapFeatures(schoolId).catch(() => null),
        adminApi.getMapEntrances(schoolId).catch(() => null),
      ]);

      // Defensively unwrap the response — the API may return:
      //   an array directly, { features: [...] }, { data: [...] }, etc.
      function extractArray(raw: any): any[] {
        if (Array.isArray(raw)) return raw;
        if (raw && typeof raw === "object") {
          // try common envelope keys
          for (const key of ["features", "entrances", "data", "items", "results", "locations"]) {
            if (Array.isArray(raw[key])) return raw[key];
          }
        }
        return [];
      }

      // Normalise a feature from the API into our MapLocation shape.
      // Backend returns GeoJSON: geometry is Point ([lng, lat]) or Polygon (nested arrays).
      // For non-Point geometries, fall back to properties.centroid which the backend
      // always populates via ST_Centroid() — giving a stable Point coordinate for map pins.
      function normaliseLocation(f: any): MapLocation {
        const geomType: string = f?.geometry?.type ?? "";
        const isPoint = geomType === "Point";
        const coords = isPoint ? f?.geometry?.coordinates : null;
        // For Polygon/MultiPolygon, use the centroid Point the backend provides
        const centroid = !isPoint ? (f?.properties?.centroid ?? f?.centroid) : null;
        const centroidCoords = centroid?.coordinates ?? null;
        const lat = coords ? coords[1]
          : centroidCoords ? centroidCoords[1]
          : (f?.latitude ?? f?.lat);
        const lng = coords ? coords[0]
          : centroidCoords ? centroidCoords[0]
          : (f?.longitude ?? f?.lng);
        return {
          id:          f?.id ?? f?._id,
          name:        f?.name ?? f?.properties?.name,
          type:        f?.category ?? f?.type ?? f?.properties?.category ?? f?.properties?.type,
          category:    f?.category ?? f?.properties?.category,
          description: f?.description ?? f?.properties?.description,
          latitude:    typeof lat === "number" ? lat : undefined,
          longitude:   typeof lng === "number" ? lng : undefined,
          imageUrl:    f?.imageUrl ?? f?.images?.[0] ?? f?.properties?.imageUrl ?? null,
          tags:        f?.tags ?? f?.properties?.tags,
        };
      }

      setLocations(extractArray(locsRaw).map(normaliseLocation));
      setEntrances(extractArray(entsRaw).map((e: any) => {
        const coords = e?.geometry?.coordinates;
        return {
          id:        e?.id,
          name:      e?.name ?? e?.properties?.name ?? e?.kind ?? "Entrance",
          latitude:  Array.isArray(coords) ? coords[1] : e?.latitude,
          longitude: Array.isArray(coords) ? coords[0] : e?.longitude,
        };
      }));
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  }, []);

  function selectSchool(s: School) {
    setSelected(s);
    setTab("interactive");
    loadSchoolData(s);
  }

  // ── Interactive map add ────────────────────────────────────────────────────

  async function handleMapAdd(data: {
    name: string; category: string; description: string; type: string;
    latitude: number; longitude: number;
  }) {
    const schoolId = selected ? resolveSchoolId(selected as any) : "";
    if (!selected || !isValidId(schoolId)) {
      setMapError("No valid school selected. Please pick a school first.");
      return;
    }
    setMapSaving(true); setMapError(null);
    try {
      const payload = {
        id:          crypto.randomUUID(),
        name:        data.name,
        category:    data.category,
        description: data.description || undefined,
        geometry: {
          type:        "Point",
          coordinates: [data.longitude, data.latitude], // GeoJSON is [lng, lat]
        },
        tags: ["campus"],
      };
      const result: any = await adminApi.upsertMapFeature(schoolId, payload);
      const newLoc: MapLocation = {
        id:          result?.id ?? payload.id,
        name:        result?.name ?? data.name,
        type:        result?.category ?? result?.type ?? data.category,
        category:    result?.category ?? data.category,
        description: result?.description ?? data.description,
        latitude:    result?.geometry?.coordinates?.[1] ?? data.latitude,
        longitude:   result?.geometry?.coordinates?.[0] ?? data.longitude,
        imageUrl:    result?.imageUrl ?? result?.images?.[0] ?? null,
      };
      setLocations(p => {
        const idx = p.findIndex(l => l.id === newLoc.id);
        return idx >= 0 ? p.map((l, i) => i === idx ? newLoc : l) : [...p, newLoc];
      });
      // Return id so InteractiveMapPicker can show the image upload prompt
      return { id: newLoc.id };
    } catch (e: any) { setMapError(e.message ?? "Failed to save location."); throw e; }
    finally { setMapSaving(false); }
  }

  async function handleMapUploadImage(featureId: string, file: File) {
    const schoolId = selected ? resolveSchoolId(selected as any) : "";
    if (!selected || !isValidId(schoolId)) return;
    const result: any = await adminApi.uploadMapFeatureImage(schoolId, featureId, file);
    const url: string = result?.imageUrl ?? result?.url ?? result?.images?.[0] ?? "";
    if (url) {
      setLocations(p => p.map(l => l.id === featureId ? { ...l, imageUrl: url } : l));
    }
  }

  async function handleDeleteLocation(locationId: string) {
    const schoolId = selected ? resolveSchoolId(selected as any) : "";
    if (!selected || !isValidId(schoolId)) return;
    setDelId(locationId);
    try {
      await adminApi.deleteMapFeature(schoolId, locationId);
      setLocations(p => p.filter(l => l.id !== locationId));
    } catch (e: any) { setError(e.message); }
    finally { setDelId(null); }
  }

  // ── Entrances ──────────────────────────────────────────────────────────────

  async function handleUpsertEntrance(data: Record<string, string>) {
    const schoolId = selected ? resolveSchoolId(selected as any) : "";
    if (!selected || !isValidId(schoolId) || !data.name.trim()) { setMError("Name is required."); return; }
    setMLoding(true); setMError(null);
    try {
      const payload: Record<string, unknown> = { name: data.name.trim() };
      if (data.latitude)  payload.latitude  = Number(data.latitude);
      if (data.longitude) payload.longitude = Number(data.longitude);
      const result: any = await adminApi.upsertMapEntrance(schoolId, payload);
      setEntrances(p => {
        const existing = p.find(e => e.id === result?.id);
        return existing
          ? p.map(e => e.id === result.id ? { ...e, ...result } : e)
          : [...p, result as MapEntrance];
      });
      setShowEF(false);
    } catch (e: any) { setMError(e.message); }
    finally { setMLoding(false); }
  }

  async function handleDeleteEntrance(entranceId: string) {
    const schoolId = selected ? resolveSchoolId(selected as any) : "";
    if (!selected || !isValidId(schoolId) || !confirm("Delete this entrance?")) return;
    setDelId(entranceId);
    try {
      await adminApi.deleteMapEntrance(schoolId, entranceId);
      setEntrances(p => p.filter(e => e.id !== entranceId));
    } catch (e: any) { setError(e.message); }
    finally { setDelId(null); }
  }

  // ── GeoJSON import ─────────────────────────────────────────────────────────

  async function handleImport() {
    const schoolId = selected ? resolveSchoolId(selected as any) : "";
    if (!selected || !isValidId(schoolId) || !importText.trim()) { setImportError("Paste a GeoJSON features array."); return; }
    setImporting(true); setImportError(null); setImportDone(false);
    try {
      const parsed = JSON.parse(importText);
      if (!Array.isArray(parsed)) throw new Error("Must be a JSON array of features.");

      // Convert simple flat objects to proper GeoJSON Features
      // Accepts both: [{name, latitude, longitude, ...}] and [{type:"Feature", geometry, properties}]
      const features = parsed.map((item: any) => {
        // Already a valid GeoJSON Feature
        if (item.type === "Feature" && item.geometry) return item;

        // Flat object — build GeoJSON Feature from it
        const lat = Number(item.latitude ?? item.lat);
        const lng = Number(item.longitude ?? item.lng);
        if (isNaN(lat) || isNaN(lng)) {
          throw new Error(`Feature "${item.name || "unknown"}" is missing valid latitude/longitude.`);
        }
        return {
          type:     "Feature",
          id:       item.id || crypto.randomUUID(),
          geometry: {
            type:        "Point",
            coordinates: [lng, lat], // GeoJSON: [longitude, latitude]
          },
          properties: {
            name:        item.name,
            category:    item.category ?? item.type,
            description: item.description,
            tags:        item.tags,
          },
        };
      });

      await adminApi.importMapData(schoolId, features);
      setImportDone(true);
      setImportText("");
      await loadSchoolData(selected);
    } catch (e: any) { setImportError(e.message); }
    finally { setImporting(false); }
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  const TABS: { key: ActiveTab; label: string; icon: React.ElementType }[] = [
    { key: "interactive", label: "Interactive Map",  icon: MapPin    },
    { key: "locations",   label: "Locations List",   icon: Map       },
    { key: "entrances",   label: "Entrances",        icon: DoorOpen  },
    { key: "import",      label: "GeoJSON Import",   icon: Download  },
  ];

  return (
    <div className="flex flex-col gap-6">

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Campus Map Management</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Interactively place locations on the map, manage entrances, or bulk-import via GeoJSON.
        </p>
      </div>

      {error && (
        <div className="bg-destructive/10 text-destructive rounded-xl p-4 flex items-center gap-2 text-sm">
          <AlertCircle className="w-4 h-4 shrink-0" /> {error}
          <button onClick={() => setError(null)} className="ml-auto p-0.5 hover:opacity-70"><X className="w-4 h-4" /></button>
        </div>
      )}

      {/* School picker */}
      <div>
        <p className="text-sm font-semibold text-muted-foreground mb-2">Select school</p>
        <div className="flex gap-2 flex-wrap">
          {schools.length === 0 && (
            <p className="text-sm text-muted-foreground">Loading schools…</p>
          )}
          {schools.map(s => (
            <button
              key={s.id}
              onClick={() => selectSchool(s)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                selected?.id === s.id
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "bg-card text-muted-foreground hover:bg-accent border border-border"
              }`}
            >
              {s.shortCode}
            </button>
          ))}
        </div>
      </div>

      {/* Prompt shown when no school has been selected yet */}
      {!selected && schools.length > 0 && (
        <div className="flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 dark:border-amber-900/50 dark:bg-amber-950/30 px-4 py-3 text-sm text-amber-800 dark:text-amber-300">
          <MapPin className="w-4 h-4 shrink-0" />
          Select a school from the list above to start adding map locations.
        </div>
      )}

      {selected && (
        <>
          {/* Tabs */}
          <div className="flex gap-2 flex-wrap">
            {TABS.map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setTab(key)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                  tab === key
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "bg-card text-muted-foreground hover:bg-accent border border-border"
                }`}
              >
                <Icon className="w-4 h-4" /> {label}
              </button>
            ))}
            {/* Refresh */}
            <button
              onClick={() => loadSchoolData(selected)}
              disabled={loading}
              className="ml-auto flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium text-muted-foreground hover:bg-accent border border-border transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </button>
          </div>

          {/* ── Interactive Map Tab ── */}
          {tab === "interactive" && (
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                  <h2 className="font-semibold text-foreground">{selected.name} — Place Locations</h2>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Click the map to drop a pin, fill the form, then save.
                  </p>
                </div>
                {/* Status indicator */}
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-muted/50 border border-border">
                  <div className={`w-2 h-2 rounded-full ${locations.length > 0 ? "bg-emerald-500" : "bg-amber-500"} animate-pulse`} />
                  <span className="text-xs font-medium text-muted-foreground">
                    {locations.length} location{locations.length !== 1 ? "s" : ""} on map
                  </span>
                </div>
              </div>

              <InteractiveMapPicker
                disabled={!selected}
                existingPins={locations
                  .filter(l => typeof l.latitude === "number" && typeof l.longitude === "number")
                  .map(l => ({
                    id:        l.id,
                    name:      l.name,
                    latitude:  l.latitude!,
                    longitude: l.longitude!,
                    category:  l.type ?? l.category,
                  }))
                }
                defaultCenter={
                  selected.latitude && selected.longitude
                    ? [selected.latitude, selected.longitude]
                    : [7.3775, 4.5399]
                }
                defaultZoom={17}
                onAdd={handleMapAdd}
                onDelete={handleDeleteLocation}
                onUploadImage={handleMapUploadImage}
                saving={mapSaving}
                error={mapError}
              />
            </div>
          )}

          {/* ── Locations List Tab ── */}
          {tab === "locations" && (
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <h2 className="font-semibold text-foreground">{selected.name} — Saved Locations</h2>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground bg-muted px-3 py-1 rounded-full">
                    {locations.length} location{locations.length !== 1 ? "s" : ""}
                  </span>
                  <button
                    onClick={() => loadSchoolData(selected)}
                    disabled={loading}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-xs font-medium text-muted-foreground hover:bg-accent transition-colors disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
                    Refresh
                  </button>
                </div>
              </div>

              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-6 h-6 text-primary animate-spin" />
                </div>
              ) : locations.length === 0 ? (
                <div className="flex flex-col gap-3">
                  <div className="bg-card rounded-2xl p-8 text-center text-muted-foreground text-sm border border-border">
                    <MapPin className="w-8 h-8 text-muted-foreground/30 mx-auto mb-3" />
                    <p className="font-medium text-foreground mb-1">No locations found</p>
                    <p className="text-xs">
                      If you just imported a JSON, click <strong>Refresh</strong> above, or try re-selecting the school.
                    </p>
                  </div>
                  {/* API debug hint — helps diagnose if the response shape is unexpected */}
                  <details className="bg-muted/40 rounded-xl border border-border text-xs">
                    <summary className="px-4 py-2.5 cursor-pointer font-medium text-muted-foreground select-none">
                      🔍 Troubleshoot: API not returning data?
                    </summary>
                    <div className="px-4 pb-4 pt-2 text-muted-foreground space-y-1.5">
                      <p>1. Open browser DevTools → Network tab → look for <code className="bg-muted px-1 rounded">features</code> request.</p>
                      <p>2. Check the response shape. Expected: a JSON array <code className="bg-muted px-1 rounded">[ &#123;...&#125;, ... ]</code></p>
                      <p>3. If it returns <code className="bg-muted px-1 rounded">&#123; data: [...] &#125;</code> or <code className="bg-muted px-1 rounded">&#123; features: [...] &#125;</code> that is handled. Any other shape → report to backend.</p>
                      <p>4. Make sure your JSON had valid <code className="bg-muted px-1 rounded">latitude</code> and <code className="bg-muted px-1 rounded">longitude</code> as numbers, not strings.</p>
                    </div>
                  </details>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  {locations.map(loc => (
                    <div key={loc.id} className="bg-card rounded-2xl overflow-hidden border border-border">
                      <button
                        onClick={() => setExpandedId(expandedId === loc.id ? null : loc.id)}
                        className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-accent/40 transition-colors"
                      >
                        {loc.imageUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={loc.imageUrl}
                            alt={loc.name}
                            className="w-8 h-8 rounded-lg object-cover shrink-0 border border-border"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                            <MapPin className="w-4 h-4 text-primary" />
                          </div>
                        )}
                        <span className="flex-1 font-medium text-foreground text-sm">{loc.name}</span>
                        {(loc.type ?? loc.category) && (
                          <span className="text-xs bg-primary/10 text-primary rounded-lg px-2 py-0.5 shrink-0">
                            {(loc.type ?? loc.category)!.replace(/_/g, " ")}
                          </span>
                        )}
                        <ChevronDown className={`w-4 h-4 text-muted-foreground shrink-0 transition-transform ${expandedId === loc.id ? "rotate-180" : ""}`} />
                      </button>

                      {expandedId === loc.id && (
                        <div className="border-t border-border px-4 pb-4 pt-3 flex flex-col gap-3">
                          {/* Image preview */}
                          {loc.imageUrl && (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={loc.imageUrl}
                              alt={loc.name}
                              className="w-full h-36 object-cover rounded-xl border border-border"
                            />
                          )}

                          {loc.description && (
                            <p className="text-sm text-muted-foreground">{loc.description}</p>
                          )}
                          {(typeof loc.latitude === "number" || typeof loc.longitude === "number") && (
                            <p className="text-xs font-mono text-muted-foreground">
                              {loc.latitude}, {loc.longitude}
                            </p>
                          )}

                          <div className="flex items-center gap-2 flex-wrap">
                            {/* Upload image */}
                            <button
                              onClick={() => setImageTarget(loc)}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-sm font-medium text-foreground hover:bg-accent transition-colors"
                            >
                              <ImageIcon className="w-3.5 h-3.5" />
                              {loc.imageUrl ? "Change Image" : "Upload Image"}
                            </button>

                            {/* Delete */}
                            <button
                              onClick={() => {
                                if (!confirm("Delete this location?")) return;
                                handleDeleteLocation(loc.id);
                              }}
                              disabled={deletingId === loc.id}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-destructive/40 text-destructive text-sm font-medium hover:bg-destructive/5 transition-colors disabled:opacity-50"
                            >
                              {deletingId === loc.id
                                ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                : <Trash2 className="w-3.5 h-3.5" />
                              }
                              Delete
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── Entrances Tab ── */}
          {tab === "entrances" && (
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <h2 className="font-semibold text-foreground">{selected.name} — Entrances</h2>
                <button
                  onClick={() => { setShowEF(true); setMError(null); }}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity"
                >
                  <Plus className="w-4 h-4" /> Add Entrance
                </button>
              </div>

              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-6 h-6 text-primary animate-spin" />
                </div>
              ) : entrances.length === 0 ? (
                <div className="bg-card rounded-2xl p-10 text-center text-muted-foreground text-sm border border-border">
                  No entrances yet.
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  {entrances.map(e => (
                    <div key={e.id} className="bg-card rounded-2xl flex items-center gap-3 px-4 py-3 border border-border">
                      <DoorOpen className="w-4 h-4 text-primary shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-foreground text-sm">{e.name}</p>
                        {(e.latitude ?? e.longitude) != null && (
                          <p className="text-xs font-mono text-muted-foreground">{e.latitude}, {e.longitude}</p>
                        )}
                      </div>
                      <button
                        onClick={() => handleDeleteEntrance(e.id)}
                        disabled={deletingId === e.id}
                        className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors disabled:opacity-50"
                      >
                        {deletingId === e.id
                          ? <Loader2 className="w-4 h-4 animate-spin" />
                          : <Trash2 className="w-4 h-4" />
                        }
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── GeoJSON Import Tab ── */}
          {tab === "import" && (
            <div className="flex flex-col gap-4">
              <div>
                <h2 className="font-semibold text-foreground mb-1">Bulk GeoJSON Import</h2>
                <p className="text-sm text-muted-foreground">
                  Paste a JSON array of feature objects to bulk-import map data for{" "}
                  <span className="font-semibold text-foreground">{selected.name}</span>.
                </p>
              </div>

              {/* Import guide callout */}
              <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
                <h3 className="font-semibold text-sm text-blue-900 dark:text-blue-300 mb-2">📋 Import Format Guide</h3>
                <div className="text-xs text-blue-800 dark:text-blue-400 space-y-1.5">
                  <p>• Both flat objects and GeoJSON Features are accepted</p>
                  <p>• Required: <code className="bg-blue-100 dark:bg-blue-900/40 px-1.5 py-0.5 rounded">name</code>, <code className="bg-blue-100 dark:bg-blue-900/40 px-1.5 py-0.5 rounded">latitude</code>, <code className="bg-blue-100 dark:bg-blue-900/40 px-1.5 py-0.5 rounded">longitude</code> (as numbers)</p>
                  <p>• Optional: <code className="bg-blue-100 dark:bg-blue-900/40 px-1.5 py-0.5 rounded">category</code>, <code className="bg-blue-100 dark:bg-blue-900/40 px-1.5 py-0.5 rounded">description</code>, <code className="bg-blue-100 dark:bg-blue-900/40 px-1.5 py-0.5 rounded">tags</code></p>
                  <p>• Valid categories: BUILDING, HOSTEL, LIBRARY, CAFETERIA, LAB, CLINIC, SPORTS, GATE, PARKING, OFFICE, LECTURE_HALL, ATM, SHUTTLE_STOP, LANDMARK, ROAD, PATH</p>
                </div>
              </div>

              {importDone && (
                <div className="bg-emerald-50 border border-emerald-200 dark:bg-emerald-900/20 dark:border-emerald-700 rounded-xl p-4 text-sm text-emerald-700 dark:text-emerald-400 flex items-center justify-between gap-3 flex-wrap">
                  <span className="font-semibold flex items-center gap-2">
                    ✓ Import successful! {locations.length} location{locations.length !== 1 ? "s" : ""} now on map.
                  </span>
                  <button
                    onClick={() => { setTab("locations"); setImportDone(false); }}
                    className="px-4 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 transition-colors shrink-0"
                  >
                    View Locations →
                  </button>
                </div>
              )}
              {importError && (
                <div className="bg-destructive/10 text-destructive rounded-xl p-3 text-sm flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" /> {importError}
                </div>
              )}

              <textarea
                value={importText}
                onChange={e => { setImportText(e.target.value); setImportError(null); setImportDone(false); }}
                placeholder={`[\n  {\n    "name": "Main Library",\n    "category": "LIBRARY",\n    "type": "LIBRARY",\n    "description": "Central library building",\n    "latitude": 7.3775,\n    "longitude": 4.5399,\n    "tags": ["campus", "academics"]\n  },\n  {\n    "name": "Student Hostel A",\n    "category": "HOSTEL",\n    "latitude": 7.3780,\n    "longitude": 4.5405\n  }\n]`}
                rows={14}
                className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm font-mono text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
              />

              <div className="flex gap-3 flex-wrap">
                <button
                  onClick={handleImport}
                  disabled={importing || !importText.trim()}
                  className="flex-1 min-w-[160px] flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 disabled:opacity-60 transition-opacity"
                >
                  {importing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                  {importing ? "Importing…" : "Import Data"}
                </button>
                
                {importText && (
                  <button
                    onClick={() => { setImportText(""); setImportError(null); setImportDone(false); }}
                    className="px-4 py-3 rounded-xl border border-border text-sm font-medium text-muted-foreground hover:bg-accent transition-colors"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>
          )}
        </>
      )}

      {/* Modals */}
      {showEntranceForm && (
        <EntranceForm
          onClose={() => setShowEF(false)}
          onSubmit={handleUpsertEntrance}
          loading={modalLoading}
          error={modalError}
        />
      )}

      {imageTarget && selected && (
        <ImageUploadModal
          location={imageTarget}
          schoolId={resolveSchoolId(selected as any)}
          onClose={() => setImageTarget(null)}
          onUploaded={url => {
            setLocations(p => p.map(l =>
              l.id === imageTarget.id ? { ...l, imageUrl: url } : l,
            ));
          }}
        />
      )}
    </div>
  );
}
