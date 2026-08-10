"use client";

/**
 * StudentMapViewer
 * 3-D MapLibre GL map showing campus locations.
 * - MapTiler vector tiles + 3-D building extrusion when an API key is available
 * - OSM raster fallback (no 3-D buildings) when no key is configured
 * - Coloured pins, route polyline, user-location dot
 */

import React, { useEffect, useRef } from "react";
import { Loader2 } from "lucide-react";

interface MapLocation {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  type: string;
  description?: string | null;
  imageUrl?: string | null;
}

interface Props {
  locations: MapLocation[];
  onSelectLocation?: (location: MapLocation) => void;
  selectedId?: string;
  userLocation?: { lat: number; lng: number } | null;
  routeGeoJson?: any | null;
}

// Pin colours per category — kept in sync with the dashboard page
const TYPE_COLORS: Record<string, string> = {
  LIBRARY:      "#0ea5e9",
  BUILDING:     "#6366f1",
  HOSTEL:       "#10b981",
  CAFETERIA:    "#f59e0b",
  CLINIC:       "#f43f5e",
  SPORTS:       "#f97316",
  GATE:         "#64748b",
  PARKING:      "#3b82f6",
  OFFICE:       "#a855f7",
  LAB:          "#14b8a6",
  LECTURE_HALL: "#818cf8",
  OTHER:        "#94a3b8",
  UNKNOWN:      "#94a3b8",
};
function colorFor(type: string) { return TYPE_COLORS[type] ?? TYPE_COLORS.UNKNOWN; }

// SVG pin marker — rotated diamond shape, same visual as the old Leaflet version
function pinSvg(color: string, size: number) {
  return `
    <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 32 32">
      <circle cx="16" cy="16" r="13" fill="${color}" stroke="white" stroke-width="3"/>
    </svg>`.trim();
}

function svgToDataUrl(svg: string) {
  return "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
}

export default function StudentMapViewer({
  locations,
  onSelectLocation,
  selectedId,
  userLocation,
  routeGeoJson,
}: Props) {
  const containerRef    = useRef<HTMLDivElement>(null);
  const mapRef          = useRef<any>(null);
  const markersRef      = useRef<Map<string, any>>(new Map());
  const userMarkerRef   = useRef<any>(null);
  const [mapTilerKey, setMapTilerKey] = React.useState<string | undefined>(undefined);
  const [mapReady, setMapReady]       = React.useState(false);

  // ── Fetch MapTiler key ────────────────────────────────────────────────────

  React.useEffect(() => {
    import("@/lib/api/school").then(({ schoolApi }) => {
      schoolApi.getMapConfig()
        .then((cfg) => setMapTilerKey(cfg.maptilerApiKey || ""))
        .catch(() => setMapTilerKey(""));
    });
  }, []);

  // ── Bootstrap MapLibre ────────────────────────────────────────────────────

  useEffect(() => {
    if (mapRef.current || !containerRef.current || mapTilerKey === undefined) return;

    let cancelled = false;

    (async () => {
      const maplibre = await import("maplibre-gl");
      const maplibregl = maplibre.default ?? maplibre;
      if (cancelled || !containerRef.current) return;

      // Compute centre from locations or default to Nigeria centre
      const center: [number, number] =
        locations.length > 0
          ? [
              locations.reduce((s, l) => s + l.longitude, 0) / locations.length,
              locations.reduce((s, l) => s + l.latitude,  0) / locations.length,
            ]
          : [4.5399, 7.3775]; // [lng, lat]

      // ── Choose style ──────────────────────────────────────────────────────
      // MapTiler GL style → full vector tiles with 3-D buildings + terrain
      // OSM raster fallback → flat map, no extrusion
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
        zoom:    locations.length > 0 ? 16 : 14,
        pitch:   45,      // 3-D tilt
        bearing: -10,
        antialias: true,
      });

      // Navigation control (zoom + compass)
      map.addControl(new maplibregl.NavigationControl({ visualizePitch: true }), "top-right");

      map.on("load", () => {
        if (cancelled) return;

        // ── 3-D building extrusion (MapTiler vector tiles only) ───────────
        if (mapTilerKey) {
          // Find the first symbol layer to insert buildings below labels
          const firstSymbolId = map.getStyle().layers?.find(
            (l: any) => l.type === "symbol"
          )?.id;

          // Only add if the source has building data
          const hasBuildingSource =
            map.getSource("maptiler_planet") ||
            map.getSource("openmaptiles") ||
            map.getSource("composite");

          if (hasBuildingSource) {
            try {
              map.addLayer(
                {
                  id: "3d-buildings",
                  source: hasBuildingSource ? (
                    map.getSource("maptiler_planet") ? "maptiler_planet" :
                    map.getSource("openmaptiles")    ? "openmaptiles"    :
                    "composite"
                  ) : "",
                  "source-layer": "building",
                  type: "fill-extrusion",
                  minzoom: 14,
                  paint: {
                    "fill-extrusion-color": [
                      "interpolate", ["linear"], ["zoom"],
                      14, "#d1d5db",
                      16, "#9ca3af",
                    ],
                    "fill-extrusion-height": [
                      "interpolate", ["linear"], ["zoom"],
                      14, 0,
                      14.5, ["coalesce", ["get", "render_height"], ["get", "height"], 6],
                    ],
                    "fill-extrusion-base": [
                      "interpolate", ["linear"], ["zoom"],
                      14, 0,
                      14.5, ["coalesce", ["get", "render_min_height"], ["get", "min_height"], 0],
                    ],
                    "fill-extrusion-opacity": 0.7,
                  },
                },
                firstSymbolId,
              );
            } catch {
              // Style doesn't have a building source layer — silently skip
            }
          }
        }

        setMapReady(true);
      });

      mapRef.current = map;
    })();

    return () => {
      cancelled = true;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current    = null;
        userMarkerRef.current = null;
        markersRef.current.clear();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mapTilerKey]);

  // ── Sync location pins ────────────────────────────────────────────────────

  useEffect(() => {
    if (!mapReady || !mapRef.current) return;

    (async () => {
      const maplibre = await import("maplibre-gl");
      const maplibregl = maplibre.default ?? maplibre;
      const map = mapRef.current;
      if (!map) return;

      const markers = markersRef.current;
      const seen = new Set<string>();

      locations.forEach((loc) => {
        seen.add(loc.id);
        const isSelected = selectedId === loc.id;
        const size = isSelected ? 36 : 28;
        const color = colorFor(loc.type);

        if (markers.has(loc.id)) {
          // Update position
          markers.get(loc.id).setLngLat([loc.longitude, loc.latitude]);
          // Update icon size on selection change
          const el = markers.get(loc.id).getElement();
          el.style.width  = `${size}px`;
          el.style.height = `${size}px`;
          el.style.zIndex = isSelected ? "2" : "1";
          return;
        }

        // Create custom marker element
        const el = document.createElement("div");
        el.style.width         = `${size}px`;
        el.style.height        = `${size}px`;
        el.style.cursor        = "pointer";
        el.style.backgroundImage   = `url("${svgToDataUrl(pinSvg(color, 32))}")`;
        el.style.backgroundSize    = "contain";
        el.style.backgroundRepeat  = "no-repeat";
        el.style.transition        = "width .15s, height .15s";
        el.style.zIndex            = isSelected ? "2" : "1";
        el.style.filter            = isSelected ? "drop-shadow(0 0 6px rgba(0,0,0,.5))" : "drop-shadow(0 2px 3px rgba(0,0,0,.35))";

        const popup = new maplibregl.Popup({ offset: 25, closeButton: false })
          .setHTML(
            `<div style="font-family:inherit;padding:4px 2px">
              <strong style="font-size:13px">${loc.name}</strong>
              ${loc.type ? `<br/><small style="color:#6b7280">${loc.type.replace(/_/g, " ")}</small>` : ""}
              ${loc.description ? `<br/><span style="font-size:11px;color:#374151">${loc.description}</span>` : ""}
            </div>`,
          );

        const marker = new maplibregl.Marker({ element: el, anchor: "bottom" })
          .setLngLat([loc.longitude, loc.latitude])
          .setPopup(popup)
          .addTo(map);

        el.addEventListener("click", (e) => {
          e.stopPropagation();
          if (onSelectLocation) onSelectLocation(loc);
        });

        markers.set(loc.id, marker);
      });

      // Remove stale markers
      markers.forEach((marker, id) => {
        if (!seen.has(id)) {
          marker.remove();
          markers.delete(id);
        }
      });
    })();
  }, [locations, selectedId, onSelectLocation, mapReady]);

  // ── Pan to selected ───────────────────────────────────────────────────────

  useEffect(() => {
    if (!mapReady || !mapRef.current || !selectedId) return;
    const loc = locations.find((l) => l.id === selectedId);
    if (!loc) return;
    mapRef.current.easeTo({
      center: [loc.longitude, loc.latitude],
      zoom: Math.max(mapRef.current.getZoom(), 17),
      pitch: 50,
      duration: 600,
    });
  }, [selectedId, locations, mapReady]);

  // ── Route GeoJSON ─────────────────────────────────────────────────────────

  useEffect(() => {
    if (!mapReady || !mapRef.current) return;
    const map = mapRef.current;

    // Remove old route layers/source
    if (map.getLayer("route-line"))  map.removeLayer("route-line");
    if (map.getLayer("route-casing")) map.removeLayer("route-casing");
    if (map.getSource("route"))      map.removeSource("route");

    if (!routeGeoJson) return;

    try {
      map.addSource("route", { type: "geojson", data: routeGeoJson });

      // White casing underneath
      map.addLayer({
        id: "route-casing",
        type: "line",
        source: "route",
        layout: { "line-join": "round", "line-cap": "round" },
        paint: { "line-color": "#ffffff", "line-width": 9, "line-opacity": 0.8 },
      });

      // Indigo route line on top
      map.addLayer({
        id: "route-line",
        type: "line",
        source: "route",
        layout: { "line-join": "round", "line-cap": "round" },
        paint: {
          "line-color": "#6366f1",
          "line-width": 5,
          "line-opacity": 0.95,
          "line-dasharray": [2, 1.5],
        },
      });

      // Fit map to route bounds
      const coords: [number, number][] = [];
      function collectCoords(geom: any) {
        if (!geom) return;
        if (geom.type === "LineString") coords.push(...geom.coordinates);
        if (geom.type === "FeatureCollection") geom.features?.forEach((f: any) => collectCoords(f.geometry));
        if (geom.type === "Feature") collectCoords(geom.geometry);
      }
      collectCoords(routeGeoJson);

      if (coords.length >= 2) {
        const lngs = coords.map(([lng]) => lng);
        const lats = coords.map(([, lat]) => lat);
        map.fitBounds(
          [[Math.min(...lngs), Math.min(...lats)], [Math.max(...lngs), Math.max(...lats)]],
          { padding: 60, pitch: 50, duration: 800 },
        );
      }
    } catch (e) {
      console.warn("Failed to render route", e);
    }
  }, [routeGeoJson, mapReady]);

  // ── User location dot ─────────────────────────────────────────────────────

  useEffect(() => {
    if (!mapReady || !mapRef.current) return;

    (async () => {
      const maplibre = await import("maplibre-gl");
      const maplibregl = maplibre.default ?? maplibre;
      const map = mapRef.current;
      if (!map) return;

      if (userMarkerRef.current) {
        userMarkerRef.current.remove();
        userMarkerRef.current = null;
      }
      if (!userLocation) return;

      const el = document.createElement("div");
      el.style.width  = "18px";
      el.style.height = "18px";
      el.style.borderRadius = "50%";
      el.style.background   = "#6366f1";
      el.style.border       = "3px solid #fff";
      el.style.boxShadow    = "0 0 0 4px rgba(99,102,241,0.3)";

      userMarkerRef.current = new maplibregl.Marker({ element: el, anchor: "center" })
        .setLngLat([userLocation.lng, userLocation.lat])
        .setPopup(
          new maplibregl.Popup({ offset: 14, closeButton: false })
            .setHTML('<span style="font-size:12px;font-family:inherit">Your location</span>'),
        )
        .addTo(map);
    })();
  }, [userLocation, mapReady]);

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="relative w-full h-full">
      {/* MapLibre CSS */}
      <style>{`@import url("https://unpkg.com/maplibre-gl@4.7.1/dist/maplibre-gl.css");`}</style>

      {mapTilerKey === undefined ? (
        <div className="w-full h-full flex items-center justify-center bg-muted">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      ) : (
        <div ref={containerRef} className="w-full h-full" />
      )}

      {/* 3-D toggle hint — only shown when MapTiler key is active */}
      {mapReady && mapTilerKey && (
        <div className="absolute bottom-10 right-3 z-10 bg-card/90 backdrop-blur-sm rounded-xl px-3 py-1.5 text-xs text-muted-foreground shadow pointer-events-none">
          🏢 3D buildings on
        </div>
      )}
    </div>
  );
}
