"use client";

/**
 * NavigationMapView
 *
 * A MapLibre GL map tailored for turn-by-turn navigation.
 * Reuses the same maplibre-gl library and MapTiler key fetch as
 * StudentMapViewer — does NOT re-implement a second map library.
 *
 * Responsibilities (only):
 *   - Render the route as two segments: traveled (gray) + remaining (amber)
 *   - Show a live user-position marker that moves smoothly as GPS updates
 *   - Pan/follow the user as they move, with manual-pan override + re-centre button
 *   - Show a destination pin
 *
 * All data logic (routing, progress polling, ETA, steps) stays in NavigatePage.
 */

import React, { useEffect, useRef, useState } from "react";
import { Loader2, Crosshair } from "lucide-react";

interface Props {
  /** Full route LineString geometry from the backend */
  routeGeometry: { type: string; coordinates: [number, number][] } | null;
  /** Live GPS position — updated by watchPosition in NavigatePage */
  userPosition: { lat: number; lng: number } | null;
  /**
   * Index of the nearest route vertex to the user's current position,
   * from ProgressData.nearestVertexIndex. Coordinates 0..nearestVertexIdx
   * form the "traveled" segment; nearestVertexIdx..end is "remaining".
   */
  nearestVertexIdx: number;
  /** Destination point for the destination pin */
  destination: { lat: number; lng: number } | null;
}

// ── Route styling ─────────────────────────────────────────────────────────────
const ROUTE_COLOR_REMAINING = "#FBBC04";   // Google Maps amber
const ROUTE_CASING_COLOR    = "#9A6E00";   // dark amber outline for contrast
const ROUTE_WIDTH_REMAINING = 8;
const ROUTE_WIDTH_CASING    = 12;
const ROUTE_COLOR_TRAVELED  = "#94a3b8";   // muted gray — recedes visually
const ROUTE_WIDTH_TRAVELED  = 5;

// ── Thresholds ────────────────────────────────────────────────────────────────
// Minimum real-world movement (metres) before the marker position and
// camera are updated. Filters out GPS jitter without adding any
// interpolation complexity.
const MIN_MOVE_METERS = 5;

export default function NavigationMapView({
  routeGeometry,
  userPosition,
  nearestVertexIdx,
  destination,
}: Props) {
  const containerRef    = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapRef          = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const userMarkerRef   = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const destMarkerRef   = useRef<any>(null);
  // Last position that was actually committed to the marker / camera
  const lastCommittedRef = useRef<{ lat: number; lng: number } | null>(null);
  // Whether the user has manually interacted with the map (drag/pinch/scroll)
  // If true, auto-follow is paused and the re-centre button is shown.
  const userInteractedRef = useRef(false);

  const [mapTilerKey, setMapTilerKey] = useState<string | undefined>(undefined);
  const [mapReady, setMapReady]       = useState(false);
  // Drives re-centre button visibility — React state so it triggers a render
  const [followPaused, setFollowPaused] = useState(false);

  // ── Fetch MapTiler key (same endpoint as StudentMapViewer) ────────────────

  useEffect(() => {
    import("@/lib/api/campus-map.api").then(({ getMapConfig }) => {
      getMapConfig()
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .then((cfg: any) => setMapTilerKey(cfg.maptilerApiKey || ""))
        .catch(() => setMapTilerKey(""));
    });
  }, []);

  // ── Bootstrap MapLibre ────────────────────────────────────────────────────

  useEffect(() => {
    if (mapRef.current || !containerRef.current || mapTilerKey === undefined) return;

    let cancelled = false;

    (async () => {
      const maplibre   = await import("maplibre-gl");
      const maplibregl = maplibre.default ?? maplibre;
      if (cancelled || !containerRef.current) return;

      const center: [number, number] =
        userPosition
          ? [userPosition.lng, userPosition.lat]
          : destination
            ? [destination.lng, destination.lat]
            : [3.3792, 6.5244];

      const style = mapTilerKey
        ? `https://api.maptiler.com/maps/hybrid/style.json?key=${mapTilerKey}`
        : {
            version: 8 as const,
            sources: {
              osm: {
                type: "raster" as const,
                tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
                tileSize: 256,
                attribution: "© OpenStreetMap contributors",
              },
            },
            layers: [{ id: "osm", type: "raster" as const, source: "osm" }],
          };

      const map = new maplibregl.Map({
        container: containerRef.current!,
        style,
        center,
        zoom:      17,
        pitch:     45,
        bearing:   0,
        antialias: true,
      });

      map.addControl(
        new maplibregl.NavigationControl({ visualizePitch: true }),
        "top-right",
      );

      // ── Detect manual interaction — pause auto-follow ─────────────────
      // MapLibre fires these events when the user is in control of the camera.
      // We listen only for the start of gesture-driven moves, not programmatic
      // ones (easeTo / fitBounds), which do NOT fire dragstart/touchstart.
      const pauseFollow = () => {
        if (!userInteractedRef.current) {
          userInteractedRef.current = true;
          setFollowPaused(true);
        }
      };

      map.on("dragstart",    pauseFollow);
      map.on("touchstart",   pauseFollow);
      // wheel covers pinch-to-zoom on desktop trackpads
      map.on("wheel",        pauseFollow);

      map.on("load", () => {
        if (cancelled) return;

        // Empty sources — populated once route/position data arrives
        map.addSource("route-traveled", {
          type: "geojson",
          data: { type: "Feature", geometry: { type: "LineString", coordinates: [] }, properties: {} },
        });
        map.addSource("route-remaining", {
          type: "geojson",
          data: { type: "Feature", geometry: { type: "LineString", coordinates: [] }, properties: {} },
        });

        // Traveled (bottom)
        map.addLayer({
          id: "route-traveled-line",
          type: "line",
          source: "route-traveled",
          layout: { "line-join": "round", "line-cap": "round" },
          paint: {
            "line-color":   ROUTE_COLOR_TRAVELED,
            "line-width":   ROUTE_WIDTH_TRAVELED,
            "line-opacity": 0.6,
          },
        });

        // Remaining casing (outline — contrast against satellite tiles)
        map.addLayer({
          id: "route-remaining-casing",
          type: "line",
          source: "route-remaining",
          layout: { "line-join": "round", "line-cap": "round" },
          paint: {
            "line-color":   ROUTE_CASING_COLOR,
            "line-width":   ROUTE_WIDTH_CASING,
            "line-opacity": 0.9,
          },
        });

        // Remaining fill (top — amber)
        map.addLayer({
          id: "route-remaining-line",
          type: "line",
          source: "route-remaining",
          layout: { "line-join": "round", "line-cap": "round" },
          paint: {
            "line-color":   ROUTE_COLOR_REMAINING,
            "line-width":   ROUTE_WIDTH_REMAINING,
            "line-opacity": 1,
          },
        });

        setMapReady(true);
      });

      mapRef.current = map;
    })();

    return () => {
      cancelled = true;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current        = null;
        userMarkerRef.current = null;
        destMarkerRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mapTilerKey]);

  // ── Sync route segments ───────────────────────────────────────────────────

  useEffect(() => {
    if (!mapReady || !mapRef.current) return;
    const map = mapRef.current;

    const coords  = routeGeometry?.coordinates ?? [];
    const splitAt = Math.max(0, Math.min(nearestVertexIdx, coords.length - 1));

    const traveledSource  = map.getSource("route-traveled");
    const remainingSource = map.getSource("route-remaining");
    if (!traveledSource || !remainingSource) return;

    const traveledCoords  = coords.slice(0, splitAt + 1);
    const remainingCoords = coords.slice(splitAt);

    traveledSource.setData({
      type: "Feature",
      geometry: { type: "LineString", coordinates: traveledCoords.length  >= 2 ? traveledCoords  : [] },
      properties: {},
    });
    remainingSource.setData({
      type: "Feature",
      geometry: { type: "LineString", coordinates: remainingCoords.length >= 2 ? remainingCoords : [] },
      properties: {},
    });

    // First load only — fit to full route extent (user hasn't moved yet)
    if (routeGeometry && nearestVertexIdx === 0 && coords.length >= 2) {
      const lngs = coords.map(([lng]) => lng);
      const lats  = coords.map(([, lat]) => lat);
      map.fitBounds(
        [[Math.min(...lngs), Math.min(...lats)], [Math.max(...lngs), Math.max(...lats)]],
        { padding: 80, pitch: 45, duration: 900, maxZoom: 18 },
      );
    }
  }, [routeGeometry, nearestVertexIdx, mapReady]);

  // ── Destination pin ───────────────────────────────────────────────────────

  useEffect(() => {
    if (!mapReady || !mapRef.current) return;

    (async () => {
      const maplibre   = await import("maplibre-gl");
      const maplibregl = maplibre.default ?? maplibre;
      const map = mapRef.current;
      if (!map) return;

      if (destMarkerRef.current) {
        if (destination) {
          destMarkerRef.current.setLngLat([destination.lng, destination.lat]);
        } else {
          destMarkerRef.current.remove();
          destMarkerRef.current = null;
        }
        return;
      }
      if (!destination) return;

      const el = document.createElement("div");
      el.style.cssText = `
        width: 28px; height: 28px;
        background: #10b981;
        border: 3px solid #fff;
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        box-shadow: 0 2px 8px rgba(0,0,0,0.35);
      `;

      destMarkerRef.current = new maplibregl.Marker({ element: el, anchor: "bottom" })
        .setLngLat([destination.lng, destination.lat])
        .setPopup(
          new maplibregl.Popup({ offset: 20, closeButton: false })
            .setHTML('<span style="font-size:12px;font-family:inherit;font-weight:600">Destination</span>'),
        )
        .addTo(map);
    })();
  }, [destination, mapReady]);

  // ── User position marker + camera follow ─────────────────────────────────
  //
  // Two-gate approach:
  //   Gate 1 — MIN_MOVE_METERS threshold:
  //     The marker position is only updated when the user has actually
  //     moved more than 5 m from the last committed position. This filters
  //     GPS noise/jitter at the source — setLngLat is not called on every
  //     watchPosition tick, only when real movement is detected.
  //
  //   Gate 2 — userInteractedRef:
  //     camera easeTo is skipped if the user has manually panned/zoomed.
  //     A re-centre button (rendered below) calls resumeFollow() to clear
  //     the flag and immediately snap back.

  useEffect(() => {
    if (!mapReady || !mapRef.current || !userPosition) return;

    (async () => {
      const maplibre   = await import("maplibre-gl");
      const maplibregl = maplibre.default ?? maplibre;
      const map = mapRef.current;
      if (!map) return;

      // Gate 1: minimum movement threshold
      const prev        = lastCommittedRef.current;
      const movedEnough = !prev || haversineM(prev, userPosition) >= MIN_MOVE_METERS;
      if (!movedEnough) return;

      // Commit the new position
      lastCommittedRef.current = userPosition;

      // Update or create the user marker
      if (userMarkerRef.current) {
        userMarkerRef.current.setLngLat([userPosition.lng, userPosition.lat]);
      } else {
        const el = document.createElement("div");
        el.style.cssText = `
          width: 20px; height: 20px;
          border-radius: 50%;
          background: #3b82f6;
          border: 3px solid #fff;
          box-shadow: 0 0 0 5px rgba(59,130,246,0.25);
        `;
        userMarkerRef.current = new maplibregl.Marker({ element: el, anchor: "center" })
          .setLngLat([userPosition.lng, userPosition.lat])
          .addTo(map);
      }

      // Gate 2: skip camera move if user has taken manual control
      if (userInteractedRef.current) return;

      map.easeTo({
        center:   [userPosition.lng, userPosition.lat],
        zoom:     Math.max(map.getZoom(), 17),
        pitch:    50,
        duration: 800,
      });
    })();
  }, [userPosition, mapReady]);

  // ── Re-centre (resume follow) ─────────────────────────────────────────────

  function resumeFollow() {
    userInteractedRef.current = false;
    setFollowPaused(false);

    const map = mapRef.current;
    const pos = lastCommittedRef.current;
    if (!map || !pos) return;

    map.easeTo({
      center:   [pos.lng, pos.lat],
      zoom:     Math.max(map.getZoom(), 17),
      pitch:    50,
      duration: 600,
    });
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="absolute inset-0">
      {/* MapLibre CSS — same CDN version as StudentMapViewer */}
      <style>{`@import url("https://unpkg.com/maplibre-gl@4.7.1/dist/maplibre-gl.css");`}</style>

      {mapTilerKey === undefined ? (
        <div className="w-full h-full flex items-center justify-center bg-slate-200">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
        </div>
      ) : (
        <div ref={containerRef} className="w-full h-full" />
      )}

      {/* Re-centre button — shown when user has manually panned away */}
      {followPaused && mapReady && (
        <button
          onClick={resumeFollow}
          aria-label="Re-centre on my location"
          className="absolute bottom-4 right-4 z-20 flex items-center gap-1.5 bg-card rounded-full shadow-lg px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 active:scale-95 transition-transform"
        >
          <Crosshair className="w-4 h-4 text-indigo-500" />
          Re-centre
        </button>
      )}
    </div>
  );
}

// ── Haversine helper (metres) ─────────────────────────────────────────────────

function haversineM(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number },
): number {
  const R    = 6_371_000;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const h    =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((a.lat * Math.PI) / 180) *
    Math.cos((b.lat * Math.PI) / 180) *
    Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}
