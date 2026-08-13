"use client";

import { useEffect, useRef, useCallback } from "react";
import maplibregl, { LngLatLike, GeoJSONSource } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { useMapStore } from "@/lib/map/store";
import { mapConfigService } from "@/lib/map/services";
import { isMapLocation } from "@/lib/map/utils";
import { LayerManager } from "@/lib/map/utils";
import { Loader2 } from "lucide-react";

interface MapCanvasProps {
  locations: any[];
  selectedLocation: any | null;
  onSelectLocation: (location: any) => void;
  userLocation?: { lat: number; lng: number };
  currentRoute?: any;
}

export default function MapCanvas({
  locations,
  selectedLocation,
  onSelectLocation,
  userLocation,
  currentRoute,
}: MapCanvasProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const layerManagerRef = useRef<LayerManager | null>(null);
  const [mapTilerKey, setMapTilerKey] = React.useState<string | undefined>(undefined);
  const [mapReady, setMapReady] = React.useState(false);
  const { camera } = useMapStore();

  // Fetch API key
  useEffect(() => {
    mapConfigService
      .getMapConfig()
      .then((cfg) => setMapTilerKey(cfg.maptilerApiKey))
      .catch(() => setMapTilerKey(""));
  }, []);

  // Init map
  useEffect(() => {
    if (map.current || !mapContainer.current || mapTilerKey === undefined) return;
    let cancelled = false;

    (async () => {
      const maplibre = await import("maplibre-gl");
      const maplibregl = maplibre.default ?? maplibre;
      if (cancelled || !mapContainer.current) return;

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

      const mapInstance = new maplibregl.Map({
        container: mapContainer.current,
        style,
        center: [camera.center[0], camera.center[1]] as LngLatLike,
        zoom: camera.zoom,
        pitch: camera.pitch,
        bearing: camera.bearing,
        antialias: true,
      });

      mapInstance.addControl(new maplibregl.NavigationControl({ visualizePitch: true }), "top-right");

      mapInstance.on("load", () => {
        if (cancelled) return;
        setMapReady(true);
        const lm = new LayerManager(mapInstance);
        layerManagerRef.current = lm;

        // Add sources and layers
        lm.addSource({
          id: "locations",
          type: "geojson",
          data: { type: "FeatureCollection", features: [] },
        });
        lm.addLayer({
          id: "locations",
          type: "circle",
          source: "locations",
          paint: {
            "circle-color": ["get", "color"],
            "circle-radius": ["case", ["boolean", ["feature-state", "selected"], false], 10, 7],
            "circle-opacity": 0.8,
            "circle-stroke-width": 2,
            "circle-stroke-color": ["case", ["boolean", ["feature-state", "selected"], false], "#1e40af", "#fff"],
          },
        });
        lm.addLayer({
          id: "locations-labels",
          type: "symbol",
          source: "locations",
          layout: {
            "text-field": ["get", "name"],
            "text-font": ["Open Sans Regular"],
            "text-size": 12,
            "text-offset": [0, 1.5],
            "text-anchor": "top",
            "text-allow-overlap": false,
          },
          paint: {
            "text-color": "#000",
            "text-halo-color": "#fff",
            "text-halo-width": 1,
          },
        });

        mapInstance.on("click", "locations", (e) => {
          if (!e.features || e.features.length === 0) return;
          const locationId = e.features[0].properties?.id;
          const location = locations.find((loc) => loc.id === locationId);
          if (location) onSelectLocation(location);
        });

        mapInstance.on("mouseenter", "locations", () => {
          if (mapInstance) mapInstance.getCanvas().style.cursor = "pointer";
        });
        mapInstance.on("mouseleave", "locations", () => {
          if (mapInstance) mapInstance.getCanvas().style.cursor = "";
        });

        // Add route source
        lm.addSource({
          id: "route",
          type: "geojson",
          data: { type: "FeatureCollection", features: [] },
        });
        lm.addLayer({
          id: "route-line",
          type: "line",
          source: "route",
          paint: {
            "line-color": "#3b82f6",
            "line-width": 4,
            "line-opacity": 0.8,
          },
        });
        // user location
        lm.addSource({
          id: "user-location",
          type: "geojson",
          data: { type: "FeatureCollection", features: [] },
        });
        lm.addLayer({
          id: "user-location",
          type: "circle",
          source: "user-location",
          paint: {
            "circle-color": "#fff",
            "circle-radius": 6,
            "circle-stroke-width": 2,
            "circle-stroke-color": "#3b82f6",
          },
        });
      });

      map.current = mapInstance;
    })();

    return () => {
      cancelled = true;
      if (map.current) {
        map.current.remove();
        map.current = null;
        layerManagerRef.current = null;
      }
    };
  }, [mapTilerKey]);

  // Update locations
  useEffect(() => {
    if (!mapReady || !layerManagerRef.current) return;
    const features = locations
      .filter(isMapLocation)
      .map((loc) => ({
        type: "Feature" as const,
        geometry: { type: "Point" as const, coordinates: [loc.longitude, loc.latitude] },
        properties: {
          id: loc.id,
          name: loc.name,
          type: loc.type,
          color: getLocationColor(loc.type),
        },
      }));
    layerManagerRef.current.updateSourceData("locations", {
      type: "FeatureCollection",
      features,
    });
  }, [locations, mapReady]);

  // Update selection state
  useEffect(() => {
    if (!mapReady || !layerManagerRef.current) return;
    // Clear previous
    locations.forEach((loc) => {
      if (map.current) {
        map.current.setFeatureState(
          { source: "locations", id: loc.id },
          { selected: false }
        );
      }
    });
    if (selectedLocation && isMapLocation(selectedLocation)) {
      if (map.current) {
        map.current.setFeatureState(
          { source: "locations", id: selectedLocation.id },
          { selected: true }
        );
      }
    }
  }, [selectedLocation, locations, mapReady]);

  // Update user location
  useEffect(() => {
    if (!mapReady || !layerManagerRef.current || !userLocation) return;
    layerManagerRef.current.updateSourceData("user-location", {
      type: "FeatureCollection",
      features: [
        {
          type: "Feature",
          geometry: { type: "Point", coordinates: [userLocation.lng, userLocation.lat] },
          properties: {},
        },
      ],
    });
  }, [userLocation, mapReady]);

  // Update route
  useEffect(() => {
    if (!mapReady || !layerManagerRef.current) return;
    if (!currentRoute) {
      layerManagerRef.current.updateSourceData("route", { type: "FeatureCollection", features: [] });
      return;
    }
    const features = [];
    if (currentRoute.geometry) {
      features.push({
        type: "Feature",
        geometry: currentRoute.geometry,
        properties: { type: "line" },
      });
    }
    if (currentRoute.waypoints) {
      currentRoute.waypoints.forEach((wp: any, idx: number) => {
        features.push({
          type: "Feature",
          geometry: { type: "Point", coordinates: [wp.lng, wp.lat] },
          properties: { index: idx },
        });
      });
    }
    layerManagerRef.current.updateSourceData("route", {
      type: "FeatureCollection",
      features,
    });
  }, [currentRoute, mapReady]);

  return (
    <div className="relative w-full h-full">
      <style>{`@import url("https://unpkg.com/maplibre-gl@4.7.1/dist/maplibre-gl.css");`}</style>
      {mapTilerKey === undefined ? (
        <div className="w-full h-full flex items-center justify-center bg-muted">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      ) : (
        <div ref={mapContainer} className="w-full h-full" />
      )}
    </div>
  );
}

function getLocationColor(type: string): string {
  const colors: Record<string, string> = {
    BUILDING: "#ef4444",
    CLASSROOM: "#f97316",
    LIBRARY: "#eab308",
    CAFETERIA: "#22c55e",
    LAB: "#06b6d4",
    GYM: "#8b5cf6",
    PARKING: "#ec4899",
    ENTRANCE: "#3b82f6",
    RESTROOM: "#14b8a6",
  };
  return colors[type] || "#6b7280";
}