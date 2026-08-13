// app/dashboard/campus-map/page.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import {
  getMapConfig,
  listFeatures,
  searchFeatures,
  nearestFeatures,
  calculateSimpleRoute,
  getCategories,
  listMapLocations,
  createMapLocation,
  deleteMapLocation,
} from "@/lib/api/campus-map.api";
import type { MapFeature, MapLocation } from "@/types/campus-map";

export default function CampusMapPage() {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [categories, setCategories] = useState<string[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>("");
  const [searchQ, setSearchQ] = useState("");
  const [features, setFeatures] = useState<MapFeature[]>([]);
  const [locations, setLocations] = useState<MapLocation[]>([]);
  const [routeCoords, setRouteCoords] = useState<[number, number][] | null>(null);
  const [clickMode, setClickMode] = useState<"none" | "route">("none");
  const [routeWaypoints, setRouteWaypoints] = useState<{ lat: number; lng: number }[]>([]);
  const [showLocationForm, setShowLocationForm] = useState(false);
  const [newLoc, setNewLoc] = useState({ name: "", type: "", description: "", lat: 0, lng: 0 });

  // Fetch API key and initial data
  useEffect(() => {
    getMapConfig().then((cfg: any) => setApiKey(cfg.maptilerApiKey));
    getCategories().then(setCategories);
    refreshLocations();
  }, []);

  const refreshLocations = () => listMapLocations().then(setLocations);

  // Initialize map once we have the API key
  useEffect(() => {
    if (!apiKey || !mapContainer.current) return;

    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: `https://api.maptiler.com/maps/streets/style.json?key=${apiKey}`,
      center: [7.5, 9.0], // default, adjust to your campus
      zoom: 16,
    });

    map.current.addControl(new maplibregl.NavigationControl(), "top-right");

    map.current.on("load", () => {
      // Add custom POI layers if needed
      refreshFeatures();
    });

    // Click handler for route mode
    map.current.on("click", (e) => {
      if (clickMode === "route") {
        const { lat, lng } = e.lngLat;
        const newWaypoints = [...routeWaypoints, { lat, lng }];
        setRouteWaypoints(newWaypoints);
        if (newWaypoints.length === 2) {
          handleRouteRequest(newWaypoints);
          setClickMode("none");
        }
      } else if ((clickMode as any) === "addLocation") {
        const { lat, lng } = e.lngLat;
        setNewLoc({ ...newLoc, lat, lng });
        setShowLocationForm(true);
        setClickMode("none");
      }
    });

    return () => { map.current?.remove(); };
  }, [apiKey]);

  const refreshFeatures = async () => {
    if (!map.current) return;
    const bounds = map.current.getBounds();
    const bbox = `${bounds.getWest()},${bounds.getSouth()},${bounds.getEast()},${bounds.getNorth()}`;
    const feats = await listFeatures({ bbox, category: activeCategory || undefined, limit: 100 });
    setFeatures(feats);
    updateFeatureLayer(feats);
  };

  const updateFeatureLayer = (feats: MapFeature[]) => {
    if (!map.current) return;
    const sourceId = "campus-features";
    if (map.current.getSource(sourceId)) {
      (map.current.getSource(sourceId) as maplibregl.GeoJSONSource).setData({
        type: "FeatureCollection",
        features: feats as any[],
      });
    } else {
      map.current.addSource(sourceId, {
        type: "geojson",
        data: { type: "FeatureCollection", features: [] },
      });
      map.current.addLayer({
        id: "campus-features-layer",
        type: "circle",
        source: sourceId,
        paint: {
          "circle-color": "#3b82f6",
          "circle-radius": 8,
          "circle-stroke-width": 2,
          "circle-stroke-color": "#ffffff",
        },
      });
    }
  };

  const handleSearch = async () => {
    if (!searchQ.trim()) return;
    const results = await searchFeatures({ q: searchQ });
    if (results.length > 0 && map.current) {
      const [lng, lat] = results[0].geometry.coordinates as [number, number];
      map.current.flyTo({ center: [lng, lat], zoom: 18 });
      // Optionally highlight
    }
  };

  const handleNearest = async () => {
    if (!map.current) return;
    const center = map.current.getCenter();
    const results = await nearestFeatures({ lat: center.lat, lng: center.lng, category: activeCategory || undefined });
    if (results.length > 0 && map.current) {
      const [lng, lat] = results[0].geometry.coordinates as [number, number];
      map.current.flyTo({ center: [lng, lat], zoom: 18 });
    }
  };

  const handleRouteRequest = async (waypoints: { lat: number; lng: number }[]) => {
    if (waypoints.length !== 2) return;
    const route = await calculateSimpleRoute({
      fromLat: waypoints[0].lat,
      fromLng: waypoints[0].lng,
      toLat: waypoints[1].lat,
      toLng: waypoints[1].lng,
      profile: "foot",
    });
    setRouteCoords(route.geometry.coordinates);
    if (map.current) {
      const sourceId = "route-line";
      if (map.current.getSource(sourceId)) {
        (map.current.getSource(sourceId) as maplibregl.GeoJSONSource).setData({
          type: "Feature",
          geometry: { type: "LineString", coordinates: route.geometry.coordinates },
          properties: {},
        });
      } else {
        map.current.addSource(sourceId, {
          type: "geojson",
          data: {
            type: "Feature",
            geometry: { type: "LineString", coordinates: route.geometry.coordinates },
            properties: {},
          },
        });
        map.current.addLayer({
          id: "route-line-layer",
          type: "line",
          source: sourceId,
          paint: {
            "line-color": "#2563eb",
            "line-width": 4,
          },
        });
      }
    }
  };

  const handleAddLocation = async () => {
    await createMapLocation(newLoc);
    setShowLocationForm(false);
    setNewLoc({ name: "", type: "", description: "", lat: 0, lng: 0 });
    refreshLocations();
  };

  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      <div className="w-80 bg-card border-r p-4 overflow-y-auto">
        <h1 className="text-xl font-bold mb-4">Campus Map</h1>

        {/* Search */}
        <div className="mb-4 flex gap-2">
          <input
            type="text"
            placeholder="Search location..."
            value={searchQ}
            onChange={(e) => setSearchQ(e.target.value)}
            className="border p-2 flex-1"
          />
          <button onClick={handleSearch} className="bg-primary text-primary-foreground px-3 rounded">Search</button>
        </div>

        {/* Category filter */}
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">Filter by category</label>
          <select value={activeCategory} onChange={(e) => { setActiveCategory(e.target.value); refreshFeatures(); }} className="border p-2 w-full">
            <option value="">All</option>
            {categories.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        {/* Quick actions */}
        <button onClick={handleNearest} className="mb-4 bg-secondary/50 px-3 py-2 rounded w-full">Find nearest to map center</button>

        {/* Route controls */}
        <div className="mb-4">
          <button
            onClick={() => { setClickMode("route"); setRouteWaypoints([]); }}
            className={`px-3 py-2 rounded w-full ${clickMode === "route" ? "bg-success text-primary-foreground" : "bg-secondary/50"}`}
          >
            {clickMode === "route" ? "Click two points on map..." : "Plan Route (click map)"}
          </button>
        </div>

        {/* Add location (admin) */}
        <div className="mb-4">
          <button
            onClick={() => setClickMode("none")}
            className="bg-info text-primary-foreground px-3 py-2 rounded w-full"
          >
            Add Custom POI
          </button>
        </div>

        {showLocationForm && (
          <div className="bg-card shadow rounded p-4 mb-4 border">
            <h3 className="font-semibold">New POI</h3>
            <input
              type="text" placeholder="Name" value={newLoc.name}
              onChange={(e) => setNewLoc({ ...newLoc, name: e.target.value })}
              className="border p-1 w-full mb-1"
            />
            <input
              type="text" placeholder="Type (e.g. cafe)" value={newLoc.type}
              onChange={(e) => setNewLoc({ ...newLoc, type: e.target.value })}
              className="border p-1 w-full mb-1"
            />
            <input
              type="text" placeholder="Description" value={newLoc.description}
              onChange={(e) => setNewLoc({ ...newLoc, description: e.target.value })}
              className="border p-1 w-full mb-1"
            />
            <div className="text-sm text-muted-foreground mb-2">Lat: {newLoc.lat.toFixed(5)}, Lng: {newLoc.lng.toFixed(5)}</div>
            <div className="flex gap-2">
              <button onClick={handleAddLocation} className="bg-success text-primary-foreground px-3 py-1 rounded">Save</button>
              <button onClick={() => setShowLocationForm(false)} className="bg-secondary/50 px-3 py-1 rounded">Cancel</button>
            </div>
          </div>
        )}

        {/* Custom locations list */}
        <div>
          <h2 className="font-semibold mb-2">Custom POIs</h2>
          {locations.map((loc) => (
            <div key={loc.id} className="bg-muted rounded p-2 mb-1 flex justify-between">
              <div>
                <p className="text-sm font-medium">{loc.name}</p>
                <p className="text-xs text-muted-foreground">{loc.type}</p>
              </div>
              <button onClick={async () => { await deleteMapLocation(loc.id); refreshLocations(); }} className="text-red-600 text-xs">Delete</button>
            </div>
          ))}
        </div>
      </div>

      {/* Map container */}
      <div ref={mapContainer} className="flex-1" />
    </div>
  );
}