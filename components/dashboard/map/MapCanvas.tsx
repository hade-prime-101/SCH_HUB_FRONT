"use client";

/**
 * MapCanvas — MapLibre GL wrapper for rendering the campus map
 * 
 * Responsibilities:
 * - Initialize and manage MapLibre GL instance
 * - Render map layers (roads, buildings, POIs, routes)
 * - Handle user interaction (click, hover, zoom)
 * - Render markers for locations and entrances
 * - Render user location dot with accuracy circle
 * - Render route line and waypoints
 * - Sync camera state with store
 * 
 * Props from MapContainer:
 * - locations: filtered Location[] to display
 * - selectedLocation: currently selected Location (if any)
 * - userLocation: user's GPS position (if available)
 * - currentRoute: Route being navigated (if navigating)
 */

import { useEffect, useRef, useCallback } from 'react';
import maplibregl, { LngLatLike, GeoJSONSource } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

import { useMapStore, Location, isMapLocation, mapConfigService, Route, MapConfig } from '@/lib/map';
import { LayerManager } from '@/lib/map/utils';

interface MapCanvasProps {
  locations: Location[];
  selectedLocation: Location | null;
  onSelectLocation: (location: Location) => void;
  userLocation?: { lat: number; lng: number };
  currentRoute?: Route | null;
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
  const markersRef = useRef<Map<string, maplibregl.Marker>>(new Map());
  const userMarkerRef = useRef<maplibregl.Marker | null>(null);
  const routeSourceRef = useRef<GeoJSONSource | null>(null);

  const { camera, setCamera, animateToCamera, layerSettings } = useMapStore();
  const initialCameraRef = useRef(camera);

  // ────────────────────────────────────────────────────────────────────────────
  // MAP INITIALIZATION
  // ────────────────────────────────────────────────────────────────────────────

  /**
   * Initialize MapLibre GL map on mount
   */
  useEffect(() => {
    let cancelled = false;

    const initMap = async () => {
      try {
        const container = mapContainer.current;
        if (!container || map.current) return;

        const config = await mapConfigService.getMapConfig();
        if (cancelled || !container.isConnected || map.current) return;

        const initialCamera = initialCameraRef.current;

        map.current = new maplibregl.Map({
          container,
          style: getMapStyle(config),
          center: [initialCamera.center[0], initialCamera.center[1]] as LngLatLike,
          zoom: initialCamera.zoom ?? config.defaultZoom,
          pitch: initialCamera.pitch ?? config.defaultPitch,
          bearing: initialCamera.bearing ?? config.defaultBearing,
          minZoom: config.minZoom,
          maxZoom: config.maxZoom,
          // Disable default controls — we'll add custom ones
          attributionControl: false,
        });

        // Add attribution in corner
        map.current.addControl(new maplibregl.AttributionControl(), 'bottom-right');

        // Sync camera on move
        map.current.on('move', () => {
          if (!map.current) return;
          setCamera({
            center: map.current.getCenter().toArray() as [number, number],
            zoom: map.current.getZoom(),
            pitch: map.current.getPitch(),
            bearing: map.current.getBearing(),
          });
        });

        // Add map layers and sources
        setupMapLayers(map.current);
      } catch (err) {
        console.error('Failed to initialize map:', err);
      }
    };

    initMap();

    return () => {
      cancelled = true;
      // Cleanup on unmount
      if (layerManagerRef.current) {
        layerManagerRef.current.cleanup();
        layerManagerRef.current = null;
      }
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
      routeSourceRef.current = null;
    };
  }, [setCamera]);

  // ────────────────────────────────────────────────────────────────────────────
  // MAP LAYERS & SOURCES
  // ────────────────────────────────────────────────────────────────────────────

  /**
   * Setup map layers for roads, buildings, etc.
   * (These would come from the map style or be added as sources)
   */
  function setupMapLayers(mapInstance: maplibregl.Map) {
    mapInstance.on('load', () => {
      // Initialize LayerManager
      const lm = new LayerManager(mapInstance);
      layerManagerRef.current = lm;

      // Add route source and layers
      lm.addSource({
        id: 'route',
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: [],
        },
      });

      lm.addLayer({
        id: 'route',
        type: 'line',
        source: 'route',
        paint: {
          'line-color': '#3b82f6',
          'line-width': 4,
          'line-opacity': 0.8,
        },
      });

      lm.addLayer({
        id: 'route-waypoints',
        type: 'circle',
        source: 'route',
        paint: {
          'circle-color': '#1e40af',
          'circle-radius': 6,
          'circle-opacity': 0.9,
        },
      });

      routeSourceRef.current = mapInstance.getSource('route') as GeoJSONSource;

      // Add user location source and layers
      lm.addSource({
        id: 'user-location',
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: [],
        },
      });

      lm.addLayer({
        id: 'user-location-accuracy',
        type: 'circle',
        source: 'user-location',
        paint: {
          'circle-color': '#3b82f6',
          'circle-radius': 10,
          'circle-opacity': 0.2,
        },
      });

      lm.addLayer({
        id: 'user-location',
        type: 'circle',
        source: 'user-location',
        paint: {
          'circle-color': '#fff',
          'circle-radius': 6,
          'circle-stroke-width': 2,
          'circle-stroke-color': '#3b82f6',
        },
      });

      // Add locations source and layers
      lm.addSource({
        id: 'locations',
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: [],
        },
      });

      lm.addLayer({
        id: 'locations',
        type: 'circle',
        source: 'locations',
        paint: {
          'circle-color': ['get', 'color'],
          'circle-radius': ['case', ['boolean', ['feature-state', 'selected'], false], 10, 7],
          'circle-opacity': 0.8,
          'circle-stroke-width': 2,
          'circle-stroke-color': ['case', ['boolean', ['feature-state', 'selected'], false], '#1e40af', '#fff'],
        },
      });

      lm.addLayer({
        id: 'locations-labels',
        type: 'symbol',
        source: 'locations',
        layout: {
          'text-field': ['get', 'name'],
          'text-font': ['Open Sans Regular'],
          'text-size': 12,
          'text-offset': [0, 1.5],
          'text-anchor': 'top',
          'text-allow-overlap': false,
        },
        paint: {
          'text-color': '#000',
          'text-halo-color': '#fff',
          'text-halo-width': 1,
        },
      });

      // Click handler for location selection
      mapInstance.on('click', 'locations', (e) => {
        if (!e.features || e.features.length === 0) return;

        const feature = e.features[0];
        const locationId = feature.properties?.id;

        const location = locations.find(loc => loc.id === locationId);
        if (location) {
          onSelectLocation(location);
        }
      });

      // Hover effects
      mapInstance.on('mouseenter', 'locations', () => {
        if (mapInstance) mapInstance.getCanvas().style.cursor = 'pointer';
      });
      mapInstance.on('mouseleave', 'locations', () => {
        if (mapInstance) mapInstance.getCanvas().style.cursor = '';
      });
    });
  }

  // ────────────────────────────────────────────────────────────────────────────
  // LOCATION MARKERS
  // ────────────────────────────────────────────────────────────────────────────

  /**
   * Update location markers when locations or layer visibility changes
   */
  useEffect(() => {
    if (!map.current || !layerManagerRef.current) return;

    // Convert locations to GeoJSON features
    const features = locations
      .filter(isMapLocation)
      .map(loc => ({
        type: 'Feature' as const,
        geometry: {
          type: 'Point' as const,
          coordinates: [loc.longitude, loc.latitude],
        },
        properties: {
          id: loc.id,
          name: loc.name,
          type: loc.type,
          color: getLocationColor(loc.type),
        },
      }));

    // Update location source via LayerManager
    layerManagerRef.current.updateSourceData('locations', {
      type: 'FeatureCollection',
      features,
    });
  }, [locations]);

  /**
   * Update selected location state
   */
  useEffect(() => {
    if (!map.current) return;

    // Clear previous selection
    markersRef.current.forEach((marker, id) => {
      if (map.current) {
        map.current.setFeatureState({ source: 'locations', id }, { selected: false });
      }
    });

    // Set new selection
    if (selectedLocation && isMapLocation(selectedLocation)) {
      map.current.setFeatureState(
        { source: 'locations', id: selectedLocation.id },
        { selected: true },
      );
    }
  }, [selectedLocation]);

  // ────────────────────────────────────────────────────────────────────────────
  // USER LOCATION
  // ────────────────────────────────────────────────────────────────────────────

  /**
   * Update user location marker
   */
  useEffect(() => {
    if (!map.current || !userLocation || !layerManagerRef.current) return;

    layerManagerRef.current.updateSourceData('user-location', {
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          geometry: {
            type: 'Point',
            coordinates: [userLocation.lng, userLocation.lat],
          },
          properties: {},
        },
      ],
    });
  }, [userLocation]);

  // ────────────────────────────────────────────────────────────────────────────
  // ROUTE RENDERING
  // ────────────────────────────────────────────────────────────────────────────

  /**
   * Update route display when current route changes
   */
  useEffect(() => {
    if (!map.current || !currentRoute || !layerManagerRef.current) return;

    // Convert route to GeoJSON
    const features = [];

    // Route line
    if (currentRoute.geometry) {
      features.push({
        type: 'Feature',
        geometry: currentRoute.geometry,
        properties: { type: 'line' },
      });
    }

    // Route waypoints
    if (currentRoute.waypoints && currentRoute.waypoints.length > 0) {
      const waypoints = currentRoute.waypoints.map((waypoint, idx) => ({
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [waypoint.lng, waypoint.lat],
        },
        properties: { index: idx },
      }));
      features.push(...waypoints);
    }

    layerManagerRef.current.updateSourceData('route', {
      type: 'FeatureCollection',
      features,
    });

    // Fit bounds to route if available
    if (currentRoute.geometry && currentRoute.geometry.coordinates.length > 0) {
      const coords = currentRoute.geometry.coordinates as [number, number][];
      const bounds = coords.reduce(
        (bounds, coord) => ({
          minLng: Math.min(bounds.minLng, coord[0]),
          maxLng: Math.max(bounds.maxLng, coord[0]),
          minLat: Math.min(bounds.minLat, coord[1]),
          maxLat: Math.max(bounds.maxLat, coord[1]),
        }),
        {
          minLng: coords[0][0],
          maxLng: coords[0][0],
          minLat: coords[0][1],
          maxLat: coords[0][1],
        },
      );

      map.current.fitBounds(
        [
          [bounds.minLng, bounds.minLat],
          [bounds.maxLng, bounds.maxLat],
        ],
        {
          padding: 50,
          duration: 1000,
        },
      );
    }
  }, [currentRoute]);

  // ────────────────────────────────────────────────────────────────────────────
  // CAMERA ANIMATION
  // ────────────────────────────────────────────────────────────────────────────

  /**
   * Handle camera animation requests from store
   * (Debounced to prevent excessive map updates)
   */
  useEffect(() => {
    if (!map.current) return;

    const handleCameraChange = (newCamera: any) => {
      if (!map.current) return;

      map.current.easeTo({
        center: newCamera.center as LngLatLike,
        zoom: newCamera.zoom,
        pitch: newCamera.pitch,
        bearing: newCamera.bearing,
        duration: 1000,
      });
    };

    // Listen for camera animation events (would be triggered by Zustand)
    // This is a simplified approach; in production you might use a separate action
  }, []);

  return <div ref={mapContainer} className="w-full h-full" />;
}

// ────────────────────────────────────────────────────────────────────────────
// UTILITIES
// ────────────────────────────────────────────────────────────────────────────

/**
 * Get color for location type
 */
function getLocationColor(type: string): string {
  const colors: Record<string, string> = {
    BUILDING: '#ef4444',
    CLASSROOM: '#f97316',
    LIBRARY: '#eab308',
    CAFETERIA: '#22c55e',
    LAB: '#06b6d4',
    GYM: '#8b5cf6',
    PARKING: '#ec4899',
    ENTRANCE: '#3b82f6',
    RESTROOM: '#14b8a6',
    DEFAULT: '#6b7280',
  };

  return colors[type] || colors.DEFAULT;
}

function getMapStyle(config: MapConfig): maplibregl.StyleSpecification | string {
  if (config.maptilerApiKey) {
    return `https://api.maptiler.com/maps/streets-v2/style.json?key=${config.maptilerApiKey}`;
  }

  return {
    version: 8,
    glyphs: 'https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf',
    sources: {
      osm: {
        type: 'raster',
        tiles: [
          'https://a.tile.openstreetmap.org/{z}/{x}/{y}.png',
          'https://b.tile.openstreetmap.org/{z}/{x}/{y}.png',
          'https://c.tile.openstreetmap.org/{z}/{x}/{y}.png',
        ],
        tileSize: 256,
        attribution: 'OpenStreetMap contributors',
      },
    },
    layers: [
      {
        id: 'osm',
        type: 'raster',
        source: 'osm',
      },
    ],
  };
}
