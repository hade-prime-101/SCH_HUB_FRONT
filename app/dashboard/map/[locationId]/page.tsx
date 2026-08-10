"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  MapPin,
  DoorOpen,
  Accessibility,
  Map as MapIcon,
  Search,
  User,
  ChevronLeft,
  Loader2,
  Navigation,
} from "lucide-react";
import { schoolApi } from "@/lib/api/school";
import { campusMapApi } from "@/lib/api/planner";

// ─── Types ────────────────────────────────────────────────────────────────────

interface MapLocation {
  id: string;
  name: string;
  type: string;
  description?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  floor?: string | null;
  tags?: string[];
  imageUrl?: string | null;
  distanceM?: number | null;
}

interface Entrance {
  id?:         string;
  name:        string;
  tag?:        string;
  accessible?: boolean;
  latitude?:   number | null;
  longitude?:  number | null;
  description?: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDist(m?: number | null): string {
  if (!m) return "";
  if (m < 1000) return `${Math.round(m)} m from you`;
  return `${(m / 1000).toFixed(1)} km from you`;
}

function formatType(type: string): string {
  return type.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function fallbackEntrances(tags?: string[]): Entrance[] {
  if (!tags || tags.length === 0) {
    return [{ name: "Main Entrance", tag: "MAIN", accessible: false }];
  }
  return tags.map((t) => ({
    name:       t.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
    tag:        t.toUpperCase(),
    accessible: /access|wheelchair|disabled/i.test(t),
  }));
}

/**
 * Normalise a GeoJSON Feature (from /campus-map/features/:id) into a
 * flat MapLocation. Handles Point geometry and Polygon/MultiPolygon via
 * the properties.centroid field computed by ST_Centroid on import.
 */
function normaliseLoc(f: any): MapLocation {
  const geomType: string = f?.geometry?.type ?? "";
  const isPoint = geomType === "Point";
  const coords  = isPoint ? (f?.geometry?.coordinates as [number, number] | null) : null;
  const centroid = f?.properties?.centroid ?? f?.centroid ?? null;
  const centCoords =
    centroid?.type === "Point" && Array.isArray(centroid.coordinates)
      ? (centroid.coordinates as [number, number])
      : null;

  const lat: number | null = coords ? coords[1] : centCoords ? centCoords[1] : null;
  const lng: number | null = coords ? coords[0] : centCoords ? centCoords[0] : null;

  const p = f?.properties ?? {};
  return {
    id:          f?.id          ?? p.id,
    name:        f?.name        ?? p.name,
    type:        f?.type        ?? p.category ?? p.type ?? "OTHER",
    description: f?.description ?? p.description ?? null,
    latitude:    typeof lat === "number" ? lat : null,
    longitude:   typeof lng === "number" ? lng : null,
    tags:        Array.isArray(p.tags) ? p.tags : [],
    imageUrl:    p.images?.[0]  ?? p.imageUrl  ?? f?.imageUrl ?? null,
  };
}

/**
 * Normalise a GeoJSON Feature from the entrances FeatureCollection into
 * a flat Entrance. Entrance geometry is always a Point.
 */
function normaliseEntrance(f: any): Entrance {
  const coords: [number, number] | null =
    f?.geometry?.type === "Point" && Array.isArray(f?.geometry?.coordinates)
      ? f.geometry.coordinates
      : null;
  const p = f?.properties ?? {};
  return {
    id:          f?.id ?? p.id,
    name:        p.name ?? "Entrance",
    tag:         p.kind ?? p.tag,
    accessible:  p.isAccessible ?? false,
    latitude:    coords ? coords[1] : null,
    longitude:   coords ? coords[0] : null,
    description: p.metadata?.description ?? undefined,
  };
}

// ─── Bottom Nav ───────────────────────────────────────────────────────────────

const NAV_ITEMS = [
  { icon: MapIcon, label: "Map",     href: "/dashboard/map"      },
  { icon: Search,  label: "Search",  href: "/dashboard/map"      },
  { icon: MapPin,  label: "Nearby",  href: "/dashboard/map"      },
  { icon: User,    label: "Profile", href: "/dashboard/profile"  },
];

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function MapLocationDetailPage() {
  const router   = useRouter();
  const params   = useParams();
  const pathname = usePathname();
  const id       = params?.locationId as string;

  const [location, setLocation]       = useState<MapLocation | null>(null);
  const [entrances, setEntrances]     = useState<Entrance[]>([]);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    Promise.all([
      schoolApi.getMapLocation(id),
      campusMapApi.getFeatureEntrances(id).catch(() => null),
    ])
      .then(([locRaw, entsRaw]) => {
        // getMapLocation returns a GeoJSON Feature — extract flat fields
        const loc = normaliseLoc(locRaw);
        setLocation(loc);

        // getFeatureEntrances returns a GeoJSON FeatureCollection
        const features: any[] =
          entsRaw?.type === "FeatureCollection" && Array.isArray(entsRaw?.features)
            ? entsRaw.features
            : Array.isArray(entsRaw)
              ? entsRaw
              : [];

        if (features.length > 0) {
          setEntrances(features.map(normaliseEntrance));
        } else {
          setEntrances(fallbackEntrances(loc.tags ?? []));
        }
      })
      .catch((e: any) => setError(e.message || "Failed to load location."))
      .finally(() => setLoading(false));
  }, [id]);

  // ── Loading ──
  if (loading) {
    return (
      <div className="min-h-screen w-full bg-slate-100 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
      </div>
    );
  }

  // ── Error ──
  if (error || !location) {
    return (
      <div className="min-h-screen w-full bg-slate-100 flex flex-col items-center justify-center gap-4 px-6">
        <MapPin className="w-12 h-12 text-slate-300" />
        <p className="text-slate-500 font-medium text-center">
          {error ?? "Location not found."}
        </p>
        <button
          onClick={() => router.back()}
          className="text-indigo-500 font-semibold"
        >
          Go back
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-slate-100 flex flex-col justify-end">

      {/* ── Map background area ── */}
      <div className="flex-1 relative">
        {location.imageUrl ? (
          <img
            src={location.imageUrl}
            alt={location.name}
            className="absolute inset-0 w-full h-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-slate-300 via-emerald-100 to-slate-300" />
        )}
        {/* Back button */}
        <button
          onClick={() => router.back()}
          className="absolute top-6 left-4 w-11 h-11 rounded-full bg-white shadow-md flex items-center justify-center"
        >
          <ChevronLeft className="w-5 h-5 text-slate-800" />
        </button>
      </div>

      {/* ── Bottom sheet ── */}
      <div className="bg-white rounded-t-3xl px-6 pt-6 pb-8">

        {/* Name + type badge */}
        <div className="flex items-start justify-between mb-3">
          <h1 className="text-2xl font-bold text-slate-900 flex-1 pr-3">
            {location.name}
          </h1>
          <span className="text-sm font-bold text-slate-600 bg-slate-100 rounded-lg px-3 py-1.5 shrink-0">
            {formatType(location.type)}
          </span>
        </div>

        {/* Description */}
        {location.description && (
          <p className="text-slate-600 mb-4 leading-relaxed">
            {location.description}
          </p>
        )}

        {/* Tags row */}
        {location.tags && location.tags.length > 0 && (
          <div className="flex items-center gap-4 mb-2 flex-wrap">
            {location.tags.map((t) => (
              <span key={t} className="text-sm font-semibold text-slate-700">
                {t.replace(/_/g, " ")}
              </span>
            ))}
          </div>
        )}

        {/* Distance */}
        {location.distanceM != null && (
          <p className="flex items-center gap-1.5 text-slate-500 text-sm mb-6">
            <MapPin className="w-4 h-4" />
            {formatDist(location.distanceM)}
          </p>
        )}

        {/* ── Entrances ── */}
        <h2 className="text-xl font-bold text-slate-900 mb-3">Entrances</h2>
        <div className="flex flex-col gap-3 mb-6">
          {entrances.map((e, i) => {
            const hasCoords = Boolean(e.latitude && e.longitude);
            return (
              <button
                key={e.id ?? e.tag ?? i}
                onClick={() =>
                  hasCoords
                    ? router.push(`/dashboard/map/navigate?dest=${id}&entLat=${e.latitude}&entLng=${e.longitude}`)
                    : undefined
                }
                disabled={!hasCoords}
                className={`flex items-center justify-between rounded-2xl border border-slate-100 px-4 py-4 text-left transition ${
                  hasCoords
                    ? "active:bg-slate-50"
                    : "opacity-60 cursor-default"
                }`}
              >
                <div>
                  <p className="font-bold text-slate-900">{e.name}</p>
                  {e.description && <p className="text-xs text-slate-400 mt-0.5">{e.description}</p>}
                  {e.tag && <span className="text-xs font-bold text-slate-500">{e.tag}</span>}
                  {!hasCoords && (
                    <p className="text-xs text-slate-400 mt-1">No exact entrance location yet</p>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {e.accessible && <Accessibility className="w-4 h-4 text-slate-500" />}
                  <DoorOpen className="w-4 h-4 text-slate-400" />
                </div>
              </button>
            );
          })}
        </div>

        {/* ── CTA ── */}
        <button
          onClick={() => router.push(`/dashboard/map/navigate?dest=${id}`)}
          className="w-full rounded-2xl bg-indigo-500 py-4 font-bold text-white shadow-lg shadow-indigo-200 mb-5 transition flex items-center justify-center gap-2"
        >
          <Navigation className="w-5 h-5" /> Navigate here
        </button>

        {/* ── Bottom Nav ── */}
        <nav className="flex justify-around items-center">
          {NAV_ITEMS.map(({ icon: Icon, label, href }) => {
            const active = label === "Map" && pathname.startsWith("/dashboard/map");
            return (
              <Link key={label} href={href} className="flex flex-col items-center gap-1">
                <Icon className={`w-5 h-5 ${active ? "text-indigo-500" : "text-slate-400"}`} />
                <span className={`text-xs font-medium ${active ? "text-indigo-500" : "text-slate-400"}`}>
                  {label}
                </span>
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
