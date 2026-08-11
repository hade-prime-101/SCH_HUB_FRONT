// app/dashboard/campus-map/navigate/page.tsx
"use client";
import { useState, useRef, useEffect } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { getMapConfig, calculateSimpleRoute, getRouteProgress } from "@/lib/api/campus-map.api";
import type { RouteResponse, RouteProgressResult } from "@/types/campus-map";

export default function NavigatePage() {
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [route, setRoute] = useState<RouteResponse | null>(null);
  const [progress, setProgress] = useState<RouteProgressResult | null>(null);
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const watchId = useRef<number | null>(null);

  useEffect(() => {
    getMapConfig().then((c: any) => setApiKey(c.maptilerApiKey));
  }, []);

  useEffect(() => {
    if (!apiKey || !mapContainer.current) return;
    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: `https://api.maptiler.com/maps/streets/style.json?key=${apiKey}`,
      center: [7.5, 9.0],
      zoom: 16,
    });
    map.current.addControl(new maplibregl.NavigationControl(), "top-right");
    return () => map.current?.remove();
  }, [apiKey]);

  const startNavigation = async () => {
    if (!navigator.geolocation) return alert("Geolocation not supported");
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const from = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        // Hardcoded destination; in real app prompt user or select on map
        const to = { lat: 9.05, lng: 7.5 }; // example
        const route = await calculateSimpleRoute({
          fromLat: from.lat, fromLng: from.lng,
          toLat: to.lat, toLng: to.lng,
          profile: "foot",
        });
        setRoute(route);
        drawRoute(route);
        startWatching(route);
      },
      (err) => alert("GPS error: " + err.message)
    );
  };

  const drawRoute = (r: RouteResponse) => {
    if (!map.current) return;
    const sourceId = "nav-route";
    if (map.current.getSource(sourceId)) {
      (map.current.getSource(sourceId) as maplibregl.GeoJSONSource).setData({
        type: "Feature",
        geometry: { type: "LineString", coordinates: r.geometry.coordinates },
        properties: {},
      });
    } else {
      map.current.addSource(sourceId, {
        type: "geojson",
        data: {
          type: "Feature",
          geometry: { type: "LineString", coordinates: r.geometry.coordinates },
          properties: {},
        },
      });
      map.current.addLayer({
        id: "nav-route-layer",
        type: "line",
        source: sourceId,
        paint: { "line-color": "#16a34a", "line-width": 4 },
      });
    }
    map.current.fitBounds(
      new maplibregl.LngLatBounds(
        r.geometry.coordinates[0] as [number, number],
        r.geometry.coordinates[r.geometry.coordinates.length - 1] as [number, number]
      ),
      { padding: 100 }
    );
  };

  const startWatching = (r: RouteResponse) => {
    if (watchId.current) navigator.geolocation.clearWatch(watchId.current);
    watchId.current = navigator.geolocation.watchPosition(
      async (pos) => {
        const current = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        try {
          const prog = await getRouteProgress({
            currentPosition: current,
            routeGeometry: r.geometry,
          });
          setProgress(prog);
        } catch (e) {}
      },
      null,
      { enableHighAccuracy: true }
    );
  };

  return (
    <div className="flex h-screen">
      <div className="w-80 p-4 bg-white border-r">
        <h1 className="text-xl font-bold mb-4">Navigation</h1>
        <button onClick={startNavigation} className="bg-blue-600 text-white px-4 py-2 rounded w-full mb-4">
          Start Navigation
        </button>
        {progress && (
          <div className="bg-gray-50 rounded p-3 text-sm">
            <p><strong>Remaining:</strong> {(progress.remainingDistance).toFixed(0)} m</p>
            <p><strong>ETA:</strong> {Math.round(progress.remainingDuration / 60)} min</p>
            {progress.nextTurnInstruction && (
              <p className="mt-1 text-blue-700">{progress.nextTurnInstruction}</p>
            )}
          </div>
        )}
      </div>
      <div ref={mapContainer} className="flex-1" />
    </div>
  );
}