"use client";

import React, { useEffect, useRef, useState } from "react";
import { Loader2, Crosshair } from "lucide-react";
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { GeoJSONLineString } from "@/lib/map/types/geojson";

interface Props {
  routeGeometry: GeoJSONLineString | null;
  userPosition: { lat: number; lng: number } | null;
  nearestVertexIdx: number;
  destination: { lat: number; lng: number } | null;
}

const ROUTE_COLOR_REMAINING = "#FBBC04";
const ROUTE_CASING_COLOR = "#9A6E00";
const ROUTE_WIDTH_REMAINING = 8;
const ROUTE_WIDTH_CASING = 12;
const ROUTE_COLOR_TRAVELED = "#94a3b8";
const ROUTE_WIDTH_TRAVELED = 5;
const MIN_MOVE_METERS = 5;

export default function NavigationMapView({
  routeGeometry,
  userPosition,
  nearestVertexIdx,
  destination,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const userMarkerRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const destMarkerRef = useRef<any>(null);
  const lastCommittedRef = useRef<{ lat: number; lng: number } | null>(null);
  const userInteractedRef = useRef(false);

  const [mapTilerKey, setMapTilerKey] = useState<string | undefined>(undefined);
  const [mapReady, setMapReady] = useState(false);
  const [followPaused, setFollowPaused] = useState(false);

  useEffect(() => {
    import("@/lib/api/campus-map.api")
      .then(({ getMapConfig }) =>
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        getMapConfig().then((cfg: any) => setMapTilerKey(cfg.maptilerApiKey || ""))
      )
      .catch(() => setMapTilerKey(""));
  }, []);

  useEffect(() => {
    if (mapRef.current || !containerRef.current || mapTilerKey === undefined) return;
    let cancelled = false;

    (async () => {
      const maplibre = await import("maplibre-gl");
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
        zoom: 17,
        pitch: 45,
        bearing: 0,
        antialias: true,
      });

      map.addControl(
        new maplibregl.NavigationControl({ visualizePitch: true }),
        "top-right"
      );

      const pauseFollow = () => {
        if (!userInteractedRef.current) {
          userInteractedRef.current = true;
          setFollowPaused(true);
        }
      };
      map.on("dragstart", pauseFollow);
      map.on("touchstart", pauseFollow);
      map.on("wheel", pauseFollow);

      map.on("load", () => {
        if (cancelled) return;
        map.addSource("route-traveled", {
          type: "geojson",
          data: { type: "Feature", geometry: { type: "LineString", coordinates: [] }, properties: {} },
        });
        map.addSource("route-remaining", {
          type: "geojson",
          data: { type: "Feature", geometry: { type: "LineString", coordinates: [] }, properties: {} },
        });

        map.addLayer({
          id: "route-traveled-line",
          type: "line",
          source: "route-traveled",
          layout: { "line-join": "round", "line-cap": "round" },
          paint: {
            "line-color": ROUTE_COLOR_TRAVELED,
            "line-width": ROUTE_WIDTH_TRAVELED,
            "line-opacity": 0.6,
          },
        });
        map.addLayer({
          id: "route-remaining-casing",
          type: "line",
          source: "route-remaining",
          layout: { "line-join": "round", "line-cap": "round" },
          paint: {
            "line-color": ROUTE_CASING_COLOR,
            "line-width": ROUTE_WIDTH_CASING,
            "line-opacity": 0.9,
          },
        });
        map.addLayer({
          id: "route-remaining-line",
          type: "line",
          source: "route-remaining",
          layout: { "line-join": "round", "line-cap": "round" },
          paint: {
            "line-color": ROUTE_COLOR_REMAINING,
            "line-width": ROUTE_WIDTH_REMAINING,
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
        mapRef.current = null;
        userMarkerRef.current = null;
        destMarkerRef.current = null;
      }
    };
  }, [mapTilerKey]);

  // Sync route
  useEffect(() => {
    if (!mapReady || !mapRef.current) return;
    const map = mapRef.current;
    const coords = routeGeometry?.coordinates ?? [];
    const splitAt = Math.max(0, Math.min(nearestVertexIdx, coords.length - 1));
    const traveledSource = map.getSource("route-traveled");
    const remainingSource = map.getSource("route-remaining");
    if (!traveledSource || !remainingSource) return;
    traveledSource.setData({
      type: "Feature",
      geometry: { type: "LineString", coordinates: coords.slice(0, splitAt + 1) },
      properties: {},
    });
    remainingSource.setData({
      type: "Feature",
      geometry: { type: "LineString", coordinates: coords.slice(splitAt) },
      properties: {},
    });
    if (routeGeometry && nearestVertexIdx === 0 && coords.length >= 2) {
      const lngs = coords.map(([lng]) => lng);
      const lats = coords.map(([, lat]) => lat);
      map.fitBounds(
        [
          [Math.min(...lngs), Math.min(...lats)],
          [Math.max(...lngs), Math.max(...lats)],
        ],
        { padding: 80, pitch: 45, duration: 900, maxZoom: 18 }
      );
    }
  }, [routeGeometry, nearestVertexIdx, mapReady]);

  // Destination pin
  useEffect(() => {
    if (!mapReady || !mapRef.current) return;
    (async () => {
      const maplibre = await import("maplibre-gl");
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
          new maplibregl.Popup({ offset: 20, closeButton: false }).setHTML(
            '<span style="font-size:12px;font-family:inherit;font-weight:600">Destination</span>'
          )
        )
        .addTo(map);
    })();
  }, [destination, mapReady]);

  // User position
  useEffect(() => {
    if (!mapReady || !mapRef.current || !userPosition) return;
    (async () => {
      const maplibre = await import("maplibre-gl");
      const maplibregl = maplibre.default ?? maplibre;
      const map = mapRef.current;
      if (!map) return;
      const prev = lastCommittedRef.current;
      const movedEnough = !prev || haversineM(prev, userPosition) >= MIN_MOVE_METERS;
      if (!movedEnough) return;
      lastCommittedRef.current = userPosition;

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
      if (userInteractedRef.current) return;
      map.easeTo({
        center: [userPosition.lng, userPosition.lat],
        zoom: Math.max(map.getZoom(), 17),
        pitch: 50,
        duration: 800,
      });
    })();
  }, [userPosition, mapReady]);

  function resumeFollow() {
    userInteractedRef.current = false;
    setFollowPaused(false);
    const map = mapRef.current;
    const pos = lastCommittedRef.current;
    if (!map || !pos) return;
    map.easeTo({
      center: [pos.lng, pos.lat],
      zoom: Math.max(map.getZoom(), 17),
      pitch: 50,
      duration: 600,
    });
  }

  return (
    <div className="absolute inset-0">
      <style>{`@import url("https://unpkg.com/maplibre-gl@4.7.1/dist/maplibre-gl.css");`}</style>
      {mapTilerKey === undefined ? (
        <div className="w-full h-full flex items-center justify-center bg-muted">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : (
        <div ref={containerRef} className="w-full h-full" />
      )}
      {followPaused && mapReady && (
        <Button
          onClick={resumeFollow}
          variant="default"
          className="absolute bottom-4 right-4 z-20 shadow-lg flex items-center gap-1.5"
        >
          <Crosshair className="w-4 h-4" />
          Re-centre
        </Button>
      )}
    </div>
  );
}

function haversineM(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const R = 6_371_000;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((a.lat * Math.PI) / 180) *
      Math.cos((b.lat * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}