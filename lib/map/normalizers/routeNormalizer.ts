/**
 * Route normalization — converts API responses into normalized Route objects
 * 
 * Backend returns routing data from POST /campus-map/route
 */

import { Route, RoutingMode, RouteStep } from '../types/route';
import { GeoJSONLineString } from '../types/geojson';

export interface RawRouteData extends Record<string, unknown> {
  id?: string;
  geometry?: unknown;
  distance?: number;
  duration?: number;
  steps?: unknown[];
  waypoints?: unknown[];
  mode?: string;
  summary?: string;
  alternatives?: unknown[];
  origin?: unknown;
  destination?: unknown;
  routes?: unknown[];
  code?: string;
}

/**
 * Normalize a raw route response from the backend
 */
export function normalizeRoute(
  raw: RawRouteData,
  origin?: { lat: number; lng: number; name?: string },
  destination?: { lat: number; lng: number; name?: string },
): Route | null {
  if (!raw) return null;

  // Handle wrapped format: { routes: [...] }
  let routeData = raw;
  if (Array.isArray(raw.routes) && raw.routes.length > 0) {
    routeData = raw.routes[0] as RawRouteData;
  }

  // Extract geometry
  const geometry = extractGeometry(routeData);
  if (!geometry) return null;

  // Extract endpoints
  const extractedOrigin = extractEndpoint(routeData.origin) || origin;
  const extractedDestination = extractEndpoint(routeData.destination) || destination;

  if (!extractedOrigin || !extractedDestination) return null;

  // Extract metrics
  const distance = extractDistance(routeData);
  const duration = extractDuration(routeData);
  const mode = extractMode(routeData);
  const steps = extractSteps(routeData);
  const waypoints = extractWaypoints(routeData);
  const summary = extractSummary(routeData);

  return {
    id: routeData.id || generateRouteId(),
    createdAt: new Date(),
    origin: extractedOrigin,
    destination: extractedDestination,
    geometry,
    distance: distance || 0,
    duration: duration || 0,
    steps,
    waypoints,
    mode,
    summary: summary || undefined,
  };
}

/**
 * Normalize multiple routes (alternatives)
 */
export function normalizeRoutes(
  raws: RawRouteData[],
  origin?: { lat: number; lng: number; name?: string },
  destination?: { lat: number; lng: number; name?: string },
): Route[] {
  return raws
    .map(raw => normalizeRoute(raw, origin, destination))
    .filter((route): route is Route => route !== null);
}

// ─── Extraction helpers ────────────────────────────────────────────────────────

function generateRouteId(): string {
  return `route-${crypto.randomUUID()}`;
}

function extractGeometry(raw: any): GeoJSONLineString | null {
  const geom = raw.geometry;

  // GeoJSON format
  if (geom && typeof geom === 'object') {
    if (geom.type === 'LineString' && Array.isArray(geom.coordinates)) {
      return geom as GeoJSONLineString;
    }

    // Flat coordinates array
    if (Array.isArray(geom)) {
      return {
        type: 'LineString',
        coordinates: geom,
      };
    }
  }

  // Try polyline string
  if (typeof raw.polyline === 'string') {
    const decoded = decodePolyline(raw.polyline);
    if (decoded && decoded.length > 0) {
      return {
        type: 'LineString',
        coordinates: decoded,
      };
    }
  }

  return null;
}

function extractEndpoint(endpoint: unknown): { lat: number; lng: number; name?: string } | null {
  if (!endpoint || typeof endpoint !== 'object') return null;

  const e = endpoint as Record<string, unknown>;
  const lat = typeof e.lat === 'number' ? e.lat : typeof e.latitude === 'number' ? e.latitude : null;
  const lng = typeof e.lng === 'number' ? e.lng : typeof e.longitude === 'number' ? e.longitude : null;
  const name = typeof e.name === 'string' ? e.name : undefined;

  if (typeof lat === 'number' && typeof lng === 'number') {
    return { lat, lng, name };
  }

  return null;
}

function extractDistance(raw: any): number | null {
  const distance = raw.distance || raw.distances?.[0];
  return typeof distance === 'number' && distance > 0 ? distance : null;
}

function extractDuration(raw: any): number | null {
  const duration = raw.duration || raw.durations?.[0];
  return typeof duration === 'number' && duration > 0 ? duration : null;
}

function extractMode(raw: any): RoutingMode {
  const mode = (raw.mode || raw.type || raw.routeType || '').toLowerCase();
  if (['driving', 'walking', 'cycling'].includes(mode)) return mode as RoutingMode;
  return 'walking';
}

function extractSteps(raw: any): RouteStep[] | undefined {
  const steps = raw.steps || raw.legs?.[0]?.steps;
  if (!Array.isArray(steps)) return undefined;

  const extracted: RouteStep[] = [];
  
  for (const step of steps) {
    const geometry = extractGeometry(step);
    if (!geometry) continue;

    extracted.push({
      instruction: step.instruction || step.maneuver?.instruction || step.name || '',
      distance: step.distance || step.distances?.[0] || 0,
      duration: step.duration || step.durations?.[0] || 0,
      geometry,
      turnType: extractTurnType(step.maneuver),
      maneuver: step.maneuver?.type || undefined,
    });
  }

  return extracted.length > 0 ? extracted : undefined;
}

function extractTurnType(maneuver: unknown): RouteStep['turnType'] | undefined {
  if (!maneuver || typeof maneuver !== 'object') return undefined;

  const m = maneuver as Record<string, unknown>;
  const typeStr = m.type || m.modifier;
  const type = (typeof typeStr === 'string' ? typeStr : '').toLowerCase();

  const validTurns: RouteStep['turnType'][] = ['left', 'right', 'straight', 'sharp-left', 'sharp-right', 'u-turn'];
  if (validTurns.includes(type as RouteStep['turnType'])) {
    return type as RouteStep['turnType'];
  }

  return undefined;
}

function extractWaypoints(raw: any): Route['waypoints'] | undefined {
  const waypoints = raw.waypoints;
  if (!Array.isArray(waypoints)) return undefined;

  return waypoints
    .map((wp: any) => {
      const lat = typeof wp.lat === 'number' ? wp.lat : typeof wp.latitude === 'number' ? wp.latitude : null;
      const lng = typeof wp.lng === 'number' ? wp.lng : typeof wp.longitude === 'number' ? wp.longitude : null;

      if (typeof lat === 'number' && typeof lng === 'number') {
        return { lat, lng };
      }

      return null;
    })
    .filter((wp): wp is { lat: number; lng: number } => wp !== null);
}

function extractSummary(raw: any): string | null {
  const summary = raw.summary || raw.name || raw.instruction;
  return typeof summary === 'string' ? summary.trim() || null : null;
}

/**
 * Decode polyline string (Google polyline encoding format)
 */
function decodePolyline(polyline: string): [number, number][] {
  const coordinates: [number, number][] = [];
  let index = 0;
  let lat = 0;
  let lng = 0;

  while (index < polyline.length) {
    let result = 0;
    let shift = 0;

    let char: number;
    do {
      char = polyline.charCodeAt(index++) - 63;
      result |= (char & 0x1f) << shift;
      shift += 5;
    } while (char >= 0x20);

    const dlat = result & 1 ? ~(result >> 1) : result >> 1;
    lat += dlat;

    result = 0;
    shift = 0;

    do {
      char = polyline.charCodeAt(index++) - 63;
      result |= (char & 0x1f) << shift;
      shift += 5;
    } while (char >= 0x20);

    const dlng = result & 1 ? ~(result >> 1) : result >> 1;
    lng += dlng;

    coordinates.push([lng / 1e5, lat / 1e5]);
  }

  return coordinates;
}