"use client";

/**
 * InteractiveMapPicker
 * Renders an embedded Leaflet map that lets super-admins click to place a pin
 * and populates a sidebar form with the chosen lat / lng.
 *
 * Loaded lazily (dynamic import with ssr:false from the parent page) so that
 * Leaflet's browser-only globals never hit the Next.js server renderer.
 */

import { useEffect, useRef, useState } from "react";
import {
  MapPin, X, CheckCircle2, AlertCircle, Loader2, ChevronDown,
  Image as ImageIcon, Upload, Navigation, ArrowRight,
} from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface PinData {
  name:        string;
  category:    string;
  description: string;
  type:        string;
  latitude:    number;
  longitude:   number;
}

interface Props {
  /** Pre-seeded pins already on the map */
  existingPins?: Array<{ id: string; name: string; latitude: number; longitude: number; category?: string }>;
  /** Centre of the map on first load */
  defaultCenter?: [number, number];
  defaultZoom?:   number;
  /** When true, map clicks and form interactions are blocked */
  disabled?:  boolean;
  onAdd:    (pin: PinData) => Promise<{ id: string } | void>;
  onDelete?: (id: string) => Promise<void>;
  onUploadImage?: (featureId: string, file: File) => Promise<void>;
  saving:   boolean;
  error:    string | null;
}

const LOCATION_TYPES = [
  "BUILDING", "HOSTEL", "CAFETERIA", "LIBRARY", "CLINIC",
  "SPORTS", "GATE", "PARKING", "OFFICE", "LAB", "LECTURE_HALL", "OTHER",
];

const INPUT = [
  "w-full rounded-xl border border-border bg-background px-3 py-2.5",
  "text-sm text-foreground placeholder:text-muted-foreground",
  "focus:outline-none focus:ring-2 focus:ring-ring",
].join(" ");

// ── Component ─────────────────────────────────────────────────────────────────

export default function InteractiveMapPicker({
  existingPins = [],
  defaultCenter = [7.3775, 4.5399], // Nigeria centre
  defaultZoom   = 16,
  disabled      = false,
  onAdd,
  onDelete,
  onUploadImage,
  saving,
  error,
}: Props) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef          = useRef<any>(null);
  const leafletRef      = useRef<any>(null);
  const clickMarkerRef  = useRef<any>(null);
  const existingLayerRef = useRef<Map<string, any>>(new Map());
  const fileInputRef    = useRef<HTMLInputElement>(null);

  const [mapReady, setMapReady] = useState(false);
  const [clickedPos, setClickedPos] = useState<{ lat: number; lng: number } | null>(null);
  const [form, setForm] = useState({
    name: "", category: "BUILDING", description: "", type: "BUILDING",
  });
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Image upload state — shown after a location is saved
  const [savedFeatureId, setSavedFeatureId] = useState<string | null>(null);
  const [savedFeatureName, setSavedFeatureName] = useState<string>("");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadDone, setUploadDone] = useState(false);

  // ── Bootstrap Leaflet ──────────────────────────────────────────────────────

  useEffect(() => {
    if (mapRef.current || !mapContainerRef.current) return;

    let cancelled = false;

    (async () => {
      const L = (await import("leaflet")).default;
      // Fix missing default marker images when bundled with Next.js
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconUrl:       "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        shadowUrl:     "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      });

      if (cancelled || !mapContainerRef.current) return;

      leafletRef.current = L;

      const map = L.map(mapContainerRef.current, {
        center: defaultCenter,
        zoom:   defaultZoom,
        zoomControl: true,
        tap: false,
        dragging: true,
        touchZoom: true,
      } as any);

      // Try to load MapTiler key from backend, fall back to OSM
      let mapTilerKey = "";
      try {
        const { getMapConfig } = await import("@/lib/api/campus-map.api");
        const config = await getMapConfig();
        mapTilerKey = config.maptilerApiKey || "";
      } catch { /* no key — use OSM */ }

      if (mapTilerKey) {
        L.tileLayer(
          `https://api.maptiler.com/maps/hybrid/256/{z}/{x}/{y}.jpg?key=${mapTilerKey}`,
          {
            attribution: '© <a href="https://www.maptiler.com/">MapTiler</a> © <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
            maxZoom: 20,
          },
        ).addTo(map);
      } else {
        L.tileLayer(
          "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
          { attribution: "© OpenStreetMap contributors", maxZoom: 19 },
        ).addTo(map);
      }

      // Click handler — place / move the "new pin" marker
      map.on("click", (e: any) => {
        if (disabled) return;
        const { lat, lng } = e.latlng;
        setClickedPos({ lat: parseFloat(lat.toFixed(6)), lng: parseFloat(lng.toFixed(6)) });

        if (clickMarkerRef.current) {
          clickMarkerRef.current.setLatLng([lat, lng]);
        } else {
          const newPinIcon = L.divIcon({
            html: `<div style="
              width:28px;height:28px;border-radius:50% 50% 50% 0;
              background:#6366f1;border:3px solid #fff;
              transform:rotate(-45deg);box-shadow:0 2px 8px rgba(0,0,0,.35);
            "></div>`,
            iconSize: [28, 28],
            iconAnchor: [14, 28],
            className: "",
          });
          clickMarkerRef.current = L.marker([lat, lng], { icon: newPinIcon, draggable: true })
            .addTo(map)
            .bindPopup("New location — fill in the form →");
          clickMarkerRef.current.on("dragend", (ev: any) => {
            const pos = ev.target.getLatLng();
            setClickedPos({ lat: parseFloat(pos.lat.toFixed(6)), lng: parseFloat(pos.lng.toFixed(6)) });
          });
        }
      });

      mapRef.current = map;
      setMapReady(true);
    })();

    return () => {
      cancelled = true;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        clickMarkerRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Sync existing pins onto the map ──────────────────────────────────────────

  useEffect(() => {
    if (!mapReady || !leafletRef.current || !mapRef.current) return;
    const L   = leafletRef.current;
    const map = mapRef.current;
    const layer = existingLayerRef.current;

    const seen = new Set<string>();
    existingPins.forEach(pin => {
      seen.add(pin.id);
      if (layer.has(pin.id)) {
        layer.get(pin.id)?.setLatLng([pin.latitude, pin.longitude]);
        return;
      }
      const icon = L.divIcon({
        html: `<div style="
          width:22px;height:22px;border-radius:50% 50% 50% 0;
          background:#10b981;border:2px solid #fff;
          transform:rotate(-45deg);box-shadow:0 2px 6px rgba(0,0,0,.25);
        "></div>`,
        iconSize: [22, 22],
        iconAnchor: [11, 22],
        className: "",
      });
      const marker = L.marker([pin.latitude, pin.longitude], { icon })
        .addTo(map)
        .bindPopup(`<strong>${pin.name}</strong>${pin.category ? `<br/><small>${pin.category}</small>` : ""}`);
      layer.set(pin.id, marker);
    });

    layer.forEach((marker, id) => {
      if (!seen.has(id)) {
        map.removeLayer(marker);
        layer.delete(id);
      }
    });
  }, [mapReady, existingPins]);

  // ── Keep form type synced ─────────────────────────────────────────────────

  useEffect(() => {
    setForm(f => ({ ...f, type: f.category }));
  }, [form.category]);

  // ── Handlers ─────────────────────────────────────────────────────────────

  function clearPin() {
    if (clickMarkerRef.current && mapRef.current) {
      mapRef.current.removeLayer(clickMarkerRef.current);
      clickMarkerRef.current = null;
    }
    setClickedPos(null);
    setForm({ name: "", category: "BUILDING", description: "", type: "BUILDING" });
  }

  function dismissImageUpload() {
    setSavedFeatureId(null);
    setSavedFeatureName("");
    setImagePreview(null);
    setImageFile(null);
    setUploadError(null);
    setUploadDone(false);
  }

  async function handleSave() {
    if (!clickedPos || !form.name.trim()) return;
    const result = await onAdd({
      name:        form.name.trim(),
      category:    form.category,
      description: form.description.trim(),
      type:        form.category,
      latitude:    clickedPos.lat,
      longitude:   clickedPos.lng,
    });
    const fid = (result as any)?.id ?? null;
    if (fid && onUploadImage) {
      // Show image upload step
      setSavedFeatureId(fid);
      setSavedFeatureName(form.name.trim());
    }
    clearPin();
  }

  function handleImageFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setUploadError(null);
    setUploadDone(false);
    const reader = new FileReader();
    reader.onload = ev => setImagePreview(ev.target?.result as string ?? null);
    reader.readAsDataURL(file);
    e.target.value = "";
  }

  async function handleImageUpload() {
    if (!imageFile || !savedFeatureId || !onUploadImage) return;
    setUploadingImage(true);
    setUploadError(null);
    try {
      await onUploadImage(savedFeatureId, imageFile);
      setUploadDone(true);
    } catch (e: any) {
      setUploadError(e.message ?? "Upload failed.");
    } finally {
      setUploadingImage(false);
    }
  }

  async function handleDelete(id: string) {
    if (!onDelete || !confirm("Remove this location?")) return;
    setDeletingId(id);
    try { await onDelete(id); } finally { setDeletingId(null); }
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col gap-4">
      {/* Map hint with pin count */}
      <div className="flex items-center justify-between gap-3 bg-primary/5 border border-primary/20 rounded-xl px-4 py-3">
        <div className="flex items-center gap-2 text-sm text-primary font-medium">
          <MapPin className="w-4 h-4 shrink-0" />
          <span>Click anywhere on the map to drop a pin, then fill in the details.</span>
        </div>
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-primary/10 border border-primary/30">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          <span className="text-xs font-semibold text-primary">{existingPins.length}</span>
        </div>
      </div>

      {/* ── Image upload prompt shown after a location is saved ── */}
      {savedFeatureId && onUploadImage && (
        <div className="bg-card border border-border rounded-2xl p-4 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold text-foreground text-sm">
                ✓ <span className="text-emerald-600">{savedFeatureName}</span> saved!
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">Upload a cover image (optional)</p>
            </div>
            <button onClick={dismissImageUpload} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground">
              <X className="w-4 h-4" />
            </button>
          </div>

          {uploadDone ? (
            <div className="flex items-center gap-2 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 rounded-xl px-4 py-3 text-sm font-medium">
              <CheckCircle2 className="w-4 h-4 shrink-0" /> Image uploaded successfully!
              <button onClick={dismissImageUpload} className="ml-auto text-xs underline">Dismiss</button>
            </div>
          ) : (
            <>
              {/* Preview area */}
              <div
                onClick={() => fileInputRef.current?.click()}
                className="relative w-full h-32 rounded-xl border-2 border-dashed border-border bg-muted flex items-center justify-center overflow-hidden cursor-pointer hover:border-primary transition-colors"
              >
                {imagePreview ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  <div className="flex flex-col items-center gap-1.5 text-muted-foreground">
                    <ImageIcon className="w-7 h-7" />
                    <span className="text-xs">Click to choose image</span>
                  </div>
                )}
                {uploadingImage && (
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                    <Loader2 className="w-5 h-5 animate-spin text-white" />
                  </div>
                )}
              </div>
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageFileChange} />

              {uploadError && (
                <p className="text-xs text-destructive">{uploadError}</p>
              )}

              <div className="flex gap-2">
                <button
                  onClick={dismissImageUpload}
                  className="flex-1 py-2 rounded-xl border border-border text-sm font-medium text-muted-foreground hover:bg-accent transition-colors"
                >
                  Skip
                </button>
                <button
                  onClick={handleImageUpload}
                  disabled={!imageFile || uploadingImage}
                  className="flex-1 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-medium disabled:opacity-50 flex items-center justify-center gap-1.5 hover:opacity-90 transition-opacity"
                >
                  {uploadingImage
                    ? <><Loader2 className="w-4 h-4 animate-spin" />Uploading…</>
                    : <><Upload className="w-4 h-4" />Upload</>
                  }
                </button>
              </div>
            </>
          )}
        </div>
      )}

      <div className="flex flex-col lg:flex-row gap-4">
        {/* ── Map canvas ── */}
        <div className="relative flex-1 min-h-[380px] rounded-2xl overflow-hidden border border-border bg-muted">
          <style>{`
            @import url("https://unpkg.com/leaflet@1.9.4/dist/leaflet.css");
            .leaflet-container { font-family: inherit; touch-action: pan-x pan-y; }
          `}</style>
          <div ref={mapContainerRef} className="w-full h-full" style={{ minHeight: 380, touchAction: "pan-x pan-y" }} />
          {!mapReady && (
            <div className="absolute inset-0 flex items-center justify-center bg-muted">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          )}
          {disabled && (
            <div className="absolute inset-0 z-[1000] flex flex-col items-center justify-center gap-3 bg-background/70 backdrop-blur-[2px] rounded-2xl">
              <MapPin className="w-8 h-8 text-muted-foreground" />
              <p className="text-sm font-medium text-muted-foreground text-center px-6">
                Select a school above to start placing pins on the map.
              </p>
            </div>
          )}
          {/* Legend */}
          <div className="absolute bottom-3 left-3 z-[999] bg-card/90 backdrop-blur-sm rounded-xl px-3 py-2 flex flex-col gap-1.5 text-xs shadow">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block" />
              Saved location
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-primary inline-block" />
              New pin
            </div>
          </div>
        </div>

        {/* ── Sidebar form ── */}
        <div className={`w-full lg:w-80 flex flex-col gap-3 transition-opacity ${disabled ? "opacity-40 pointer-events-none" : ""}`}>
          {/* Coordinates badge */}
          <div className={`rounded-xl px-4 py-3 text-sm flex items-center gap-2 transition-colors ${
            clickedPos
              ? "bg-primary/10 text-primary border border-primary/20"
              : "bg-muted text-muted-foreground border border-border"
          }`}>
            <MapPin className="w-4 h-4 shrink-0" />
            {clickedPos
              ? <span className="font-mono font-semibold">{clickedPos.lat}, {clickedPos.lng}</span>
              : <span>No pin placed yet</span>
            }
            {clickedPos && (
              <button onClick={clearPin} className="ml-auto p-0.5 rounded hover:bg-destructive/10 hover:text-destructive transition-colors">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {error && (
            <div className="bg-destructive/10 text-destructive rounded-xl px-4 py-3 text-sm flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" /> {error}
            </div>
          )}

          {/* Name */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-muted-foreground">Location name *</label>
            <input
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              placeholder="e.g. Main Library"
              className={INPUT}
            />
          </div>

          {/* Category / type */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-muted-foreground">Type / category</label>
            <div className="relative">
              <select
                value={form.category}
                onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                className={INPUT + " appearance-none pr-8"}
              >
                {LOCATION_TYPES.map(t => (
                  <option key={t} value={t}>{t.replace(/_/g, " ")}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            </div>
          </div>

          {/* Description */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-muted-foreground">Description</label>
            <textarea
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              placeholder="Optional brief description"
              rows={3}
              className={INPUT + " resize-none"}
            />
          </div>

          {/* Save button */}
          <button
            onClick={handleSave}
            disabled={saving || !clickedPos || !form.name.trim()}
            className="flex items-center justify-center gap-2 py-3 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 disabled:opacity-50 transition-opacity"
          >
            {saving
              ? <><Loader2 className="w-4 h-4 animate-spin" />Saving…</>
              : <><CheckCircle2 className="w-4 h-4" />Save Location</>
            }
          </button>

          {/* Directions hint */}
          <div className="flex items-start gap-2 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-xl px-3 py-2.5">
            <Navigation className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
            <p className="text-xs text-blue-700 dark:text-blue-400">
              Students can get turn-by-turn directions to saved locations from the campus map.
              <span className="flex items-center gap-1 mt-1 font-medium">
                Dashboard → Map <ArrowRight className="w-3 h-3" /> Get Directions
              </span>
            </p>
          </div>

          {/* Existing pins list */}
          {existingPins.length === 0 && (
            <div className="flex flex-col items-center gap-1.5 rounded-xl border border-dashed border-border bg-muted/30 py-6 px-4 text-center mt-1">
              <MapPin className="w-5 h-5 text-muted-foreground/50" />
              <p className="text-xs text-muted-foreground">No locations saved yet</p>
              <p className="text-[10px] text-muted-foreground/60">Click the map to add the first one</p>
            </div>
          )}
          {existingPins.length > 0 && (
            <div className="flex flex-col gap-2 mt-1">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  {existingPins.length} location{existingPins.length !== 1 ? "s" : ""} saved
                </p>
                <span className="text-[10px] text-muted-foreground/70">Hover to delete</span>
              </div>
              <div className="flex flex-col gap-1.5 max-h-56 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent">
                {existingPins.map(pin => (
                  <div
                    key={pin.id}
                    className="flex items-center gap-2 bg-card rounded-xl px-3 py-2.5 border border-border hover:border-primary/30 group transition-all"
                  >
                    <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0 animate-pulse group-hover:animate-none" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{pin.name}</p>
                      {pin.category && (
                        <p className="text-xs text-muted-foreground capitalize">{pin.category.replace(/_/g, " ").toLowerCase()}</p>
                      )}
                    </div>
                    {onDelete && (
                      <button
                        onClick={() => handleDelete(pin.id)}
                        disabled={deletingId === pin.id}
                        className="opacity-0 group-hover:opacity-100 p-1 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-all disabled:opacity-50"
                        title="Delete location"
                      >
                        {deletingId === pin.id
                          ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          : <X className="w-3.5 h-3.5" />
                        }
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
