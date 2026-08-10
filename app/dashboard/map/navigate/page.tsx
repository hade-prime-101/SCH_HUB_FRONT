"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import dynamic from "next/dynamic";
import {
  ArrowLeft,
  Navigation,
  Loader2,
  MapPin,
  CheckCircle2,
  RefreshCw,
  AlertTriangle,
  X,
  Clock,
} from "lucide-react";
import BackButton from "@/components/shared/BackButton";
import { campusMapApi } from "@/lib/api/planner";

// Lazy-load the map component — maplibre-gl is client-only
const NavigationMapView = dynamic(
  () => import("@/components/dashboard/NavigationMapView"),
  {
    ssr: false,
    loading: () => (
      <div className="absolute inset-0 flex items-center justify-center bg-slate-200">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
      </div>
    ),
  },
);

// ─── Types ────────────────────────────────────────────────────────────────────

interface RouteStep {
  instruction: string;
  distanceMeters: number;
}

interface RouteData {
  routeId?: string;
  distanceMeters?: number;
  /** Backend field name is etaSeconds (not durationSeconds) */
  etaSeconds?: number;
  steps?: RouteStep[];
  geometry?: { type: string; coordinates: [number, number][] };
  warnings?: string[];
}

/**
 * Shape returned by POST /campus-map/route/progress
 * (routeProgress() in offroute.service.ts):
 *   { nearestVertexIndex, distanceFromRouteMeters, offRoute }
 *
 * The backend does NOT compute remainingDistance/ETA server-side — those
 * are derived on the client from the full route data below.
 */
interface ProgressData {
  nearestVertexIndex?: number;
  distanceFromRouteMeters?: number;
  offRoute?: boolean;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDist(m?: number | null): string {
  if (!m) return "—";
  if (m < 1000) return `${Math.round(m)} m`;
  return `${(m / 1000).toFixed(1)} km`;
}

function formatEta(secs?: number | null): string {
  if (!secs) return "—";
  const mins = Math.ceil(secs / 60);
  if (mins < 60) return `${mins} min`;
  return `${Math.floor(mins / 60)}h ${mins % 60}m`;
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function NavigatePage() {
  const router       = useRouter();
  const searchParams = useSearchParams();

  const dest   = searchParams.get("dest") ?? "";
  const entLat = parseFloat(searchParams.get("entLat") ?? "NaN");
  const entLng = parseFloat(searchParams.get("entLng") ?? "NaN");

  const [feature,      setFeature]      = useState<any | null>(null);
  const [route,        setRoute]        = useState<RouteData | null>(null);
  const [progress,     setProgress]     = useState<ProgressData | null>(null);
  const [userPos,      setUserPos]      = useState<{ lat: number; lng: number } | null>(null);
  const [loading,      setLoading]      = useState(true);
  const [recalculating,setRecalculating]= useState(false);
  const [arrived,      setArrived]      = useState(false);
  const [error,        setError]        = useState<string | null>(null);

  const pollRef    = useRef<ReturnType<typeof setInterval> | null>(null);
  const watchIdRef = useRef<number | null>(null);

  // ── Geolocation watcher ──
  const startGeo = useCallback(() => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported on this device.");
      setLoading(false);
      return;
    }
    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => setUserPos({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => setError("Could not get your location. Please enable location access."),
      { enableHighAccuracy: true, maximumAge: 3000 },
    );
  }, []);

  // ── Initial load ──
  useEffect(() => {
    if (!dest) {
      setError("No destination specified.");
      setLoading(false);
      return;
    }
    startGeo();

    campusMapApi.getFeature(dest)
      .then(setFeature)
      .catch(() => { /* non-fatal */ });

    return () => {
      if (watchIdRef.current !== null) navigator.geolocation.clearWatch(watchIdRef.current);
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [dest, startGeo]);

  // ── Fetch route once we have user position ──
  useEffect(() => {
    if (!userPos || route || !dest) return;

    const toPayload: Record<string, unknown> = { featureId: dest };
    if (!isNaN(entLat)) toPayload.lat = entLat;
    if (!isNaN(entLng)) toPayload.lng = entLng;

    campusMapApi.getRoute({
      from: userPos,
      to:   toPayload,
      mode: "walking",
    })
      .then((r) => { setRoute(r); setLoading(false); })
      .catch(() => {
        setError("Could not calculate a route to this destination. Check your connection and try again.");
        setLoading(false);
      });
  }, [userPos, route, dest, entLat, entLng]);

  // ── Poll progress ──
  useEffect(() => {
    if (!route || !userPos) return;
    if (pollRef.current) clearInterval(pollRef.current);

    pollRef.current = setInterval(async () => {
      if (!userPos || !route?.geometry) return;
      try {
        const prog = await campusMapApi.checkRouteProgress({
          routeId: route.routeId ?? "unknown",
          user:    userPos,
          route:   route.geometry,
        });
        setProgress(prog);
        // Arrived = within 20 m of the last coordinate and off-route detection says close
        if (prog?.distanceFromRouteMeters !== undefined && prog.distanceFromRouteMeters < 20) {
          const coords = route.geometry?.coordinates;
          if (coords?.length) {
            const [lastLng, lastLat] = coords[coords.length - 1];
            const R = 6_371_000;
            const dLat = ((userPos.lat - lastLat) * Math.PI) / 180;
            const dLng = ((userPos.lng - lastLng) * Math.PI) / 180;
            const a =
              Math.sin(dLat / 2) ** 2 +
              Math.cos((lastLat * Math.PI) / 180) *
              Math.cos((userPos.lat * Math.PI) / 180) *
              Math.sin(dLng / 2) ** 2;
            const distToEnd = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
            if (distToEnd < 25) setArrived(true);
          }
        }
      } catch { /* silent */ }
    }, 5000);

    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [route, userPos]);

  // ── Recalculate ──
  async function handleRecalculate() {
    if (!userPos || !dest) return;
    setRecalculating(true);
    setRoute(null);
    setProgress(null);
    const toPayload: Record<string, unknown> = { featureId: dest };
    if (!isNaN(entLat)) toPayload.lat = entLat;
    if (!isNaN(entLng)) toPayload.lng = entLng;
    try {
      const r = await campusMapApi.getRoute({ from: userPos, to: toPayload, mode: "walking" });
      setRoute(r);
      setError(null);
    } catch {
      setError("Could not recalculate the route. Check your connection and try again.");
    } finally {
      setRecalculating(false);
    }
  }

  // Derive remaining distance from progress (nearestVertexIndex) or fall back to full route distance.
  // The backend progress endpoint returns distanceFromRouteMeters (how far off-route the user is),
  // not remaining distance — so we compute remaining by slicing coordinates from the nearest vertex.
  const remainDist = (() => {
    if (progress?.nearestVertexIndex !== undefined && route?.geometry?.coordinates) {
      const coords = route.geometry.coordinates;
      const from = progress.nearestVertexIndex;
      let dist = 0;
      const R = 6_371_000;
      for (let i = from + 1; i < coords.length; i++) {
        const [lng1, lat1] = coords[i - 1];
        const [lng2, lat2] = coords[i];
        const dLat = ((lat2 - lat1) * Math.PI) / 180;
        const dLng = ((lng2 - lng1) * Math.PI) / 180;
        const a =
          Math.sin(dLat / 2) ** 2 +
          Math.cos((lat1 * Math.PI) / 180) *
          Math.cos((lat2 * Math.PI) / 180) *
          Math.sin(dLng / 2) ** 2;
        dist += R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      }
      return Math.round(dist);
    }
    return route?.distanceMeters ?? null;
  })();

  // etaSeconds is the backend field (not durationSeconds)
  const remainEta = route?.etaSeconds
    ? remainDist !== null && route.distanceMeters
      ? Math.round(route.etaSeconds * (remainDist / route.distanceMeters))
      : route.etaSeconds
    : null;

  // Steps are objects {instruction, distanceMeters} from the backend
  const steps = route?.steps?.map((s) => s.instruction) ?? ["Follow the campus path to your destination"];

  // Off-route warning from progress
  const isOffRoute = progress?.offRoute === true;

  const destName = feature?.properties?.name ?? feature?.name ?? "Destination";

  // Resolve destination point for the map pin:
  // prefer explicit entrance coords (entLat/entLng from URL params),
  // fall back to the last coordinate of the route geometry.
  const destPoint: { lat: number; lng: number } | null = (() => {
    if (!isNaN(entLat) && !isNaN(entLng)) return { lat: entLat, lng: entLng };
    const coords = route?.geometry?.coordinates;
    if (coords?.length) {
      const [lng, lat] = coords[coords.length - 1];
      return { lat, lng };
    }
    return null;
  })();

  // ── No dest param ──
  if (!dest && !loading) {
    return (
      <div className="min-h-screen bg-slate-100 flex flex-col items-center justify-center gap-4 px-6">
        <AlertTriangle className="w-12 h-12 text-amber-400" />
        <p className="text-slate-600 font-medium text-center">No destination provided.</p>
        <BackButton variant="text" label="Go back" />
      </div>
    );
  }

  // ── Error ──
  if (error && !loading) {
    return (
      <div className="min-h-screen bg-slate-100 flex flex-col items-center justify-center gap-4 px-6">
        <AlertTriangle className="w-12 h-12 text-rose-400" />
        <p className="text-slate-600 font-medium text-center">{error}</p>
        <BackButton variant="text" label="Go back" />
      </div>
    );
  }

  // ── Arrived ──
  if (arrived) {
    return (
      <div className="min-h-screen bg-emerald-50 flex flex-col items-center justify-center gap-5 px-6">
        <CheckCircle2 className="w-16 h-16 text-emerald-500" />
        <h1 className="text-2xl font-bold text-slate-900">You&apos;ve Arrived!</h1>
        <p className="text-slate-500 text-center">You have reached {destName}.</p>
        <button
          onClick={() => router.back()}
          className="mt-4 w-full max-w-sm rounded-2xl bg-emerald-500 py-4 font-bold text-white shadow-lg shadow-emerald-200"
        >
          Done
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-slate-200 relative overflow-hidden flex flex-col">

      {/* ── Real MapLibre map — fills the full background ── */}
      <div className="absolute inset-0">
        <NavigationMapView
          routeGeometry={route?.geometry ?? null}
          userPosition={userPos}
          nearestVertexIdx={progress?.nearestVertexIndex ?? 0}
          destination={destPoint}
        />
      </div>

      {/* ── Top bar ── */}
      <div className="relative z-10 flex items-center gap-3 px-4 pt-5 pb-3">
        <button
          onClick={() => router.back()}
          className="w-11 h-11 rounded-full bg-white shadow-md flex items-center justify-center shrink-0"
        >
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <div className="flex-1 bg-white rounded-2xl px-4 py-3 shadow-md">
          <p className="text-xs text-slate-400 font-medium">Navigating to</p>
          <p className="font-bold text-slate-900 truncate">{destName}</p>
        </div>
      </div>

      {/* Loading overlay — shown while waiting for first GPS fix + route ── */}
      {loading && (
        <div className="relative z-10 flex-1 flex flex-col items-center justify-center gap-3">
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl px-6 py-4 flex items-center gap-3 shadow-lg">
            <Loader2 className="w-6 h-6 text-indigo-500 animate-spin shrink-0" />
            <p className="text-slate-700 font-medium text-sm">Getting your route…</p>
          </div>
        </div>
      )}

      {/* ── Bottom sheet ── */}
      <div className="relative z-10 bg-white rounded-t-3xl px-6 pt-5 pb-8 shadow-2xl">
        {/* Handle */}
        <div className="w-10 h-1.5 rounded-full bg-slate-200 mx-auto mb-5" />

        {recalculating && (
          <div className="flex items-center gap-2 text-indigo-500 text-sm font-medium mb-4">
            <Loader2 className="w-4 h-4 animate-spin" /> Recalculating route…
          </div>
        )}

        {/* Off-route warning */}
        {isOffRoute && !recalculating && (
          <div className="flex items-center gap-2 bg-amber-50 rounded-xl px-3 py-2.5 text-sm font-medium text-amber-700 mb-4">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            You appear to be off-route — tap Recalculate to get a new path.
          </div>
        )}

        {/* Backend warnings (e.g. straight-line fallback notice) */}
        {route?.warnings && route.warnings.length > 0 && (
          <div className="flex items-start gap-2 bg-slate-50 rounded-xl px-3 py-2.5 text-xs text-slate-500 mb-4">
            <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0 text-amber-500" />
            <span>{route.warnings[0]}</span>
          </div>
        )}

        {/* Distance / ETA row */}
        <div className="flex items-center gap-4 mb-5">
          <div className="flex-1 bg-indigo-50 rounded-2xl px-4 py-3 text-center">
            <p className="text-2xl font-bold text-indigo-600">{formatDist(remainDist)}</p>
            <p className="text-xs text-slate-400 font-medium mt-0.5">Remaining</p>
          </div>
          <div className="flex-1 bg-slate-50 rounded-2xl px-4 py-3 text-center">
            <div className="flex items-center justify-center gap-1.5">
              <Clock className="w-4 h-4 text-slate-500" />
              <p className="text-2xl font-bold text-foreground">{formatEta(remainEta)}</p>
            </div>
            <p className="text-xs text-slate-400 font-medium mt-0.5">ETA</p>
          </div>
        </div>

        {/* Steps */}
        <div className="flex flex-col gap-2 mb-6">
          {steps.slice(0, 3).map((step, i) => (
            <div
              key={i}
              className={`flex items-start gap-3 rounded-2xl px-4 py-3 ${i === 0 ? "bg-indigo-50" : "bg-slate-50"}`}
            >
              <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${i === 0 ? "bg-indigo-500" : "bg-slate-200"}`}>
                <span className={`text-xs font-bold ${i === 0 ? "text-white" : "text-slate-500"}`}>{i + 1}</span>
              </div>
              <p className={`text-sm font-medium flex-1 ${i === 0 ? "text-indigo-700" : "text-slate-600"}`}>{step}</p>
            </div>
          ))}
        </div>

        {/* CTAs */}
        <button
          onClick={() => setArrived(true)}
          className="w-full rounded-2xl bg-emerald-500 py-4 font-bold text-white shadow-lg shadow-emerald-100 mb-3 flex items-center justify-center gap-2 transition active:opacity-90"
        >
          <CheckCircle2 className="w-5 h-5" /> I&apos;ve Arrived
        </button>
        <button
          onClick={handleRecalculate}
          disabled={recalculating}
          className="w-full rounded-2xl border-2 border-slate-200 py-3.5 font-bold text-foreground flex items-center justify-center gap-2 transition active:bg-slate-50 disabled:opacity-50"
        >
          <RefreshCw className="w-4 h-4" /> Recalculate Route
        </button>
      </div>
    </div>
  );
}
