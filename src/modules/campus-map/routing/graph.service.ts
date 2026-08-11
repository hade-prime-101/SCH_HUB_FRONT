import { nanoid } from 'nanoid';
import { campusMapRepository } from '../campus-map.repository.js';
import type { GeoJsonLineString, GeoJsonPosition, LngLat, RouteEdge, RouteStep } from '../campus-map.types.js';
import { estimateWalkingEtaSeconds } from './eta.service.js';
import { AppError } from '@/utils/response.js';

// ── Campus boundary guard ────────────────────────────────────────────────────
// Fetches the bounding box of all campus features and rejects points that fall
// outside a padded perimeter (default 1 km padding).

async function getCampusBounds(schoolId: string) {
  const rows = await campusMapRepository.listFeatures(schoolId, { limit: 1000 });
  if (!rows.length) return null;

  let minLng = Infinity, minLat = Infinity, maxLng = -Infinity, maxLat = -Infinity;
  for (const row of rows) {
    // centroid may be null for features imported before the ST_Centroid fix — skip them
    if (!row.centroid) continue;
    const geom = JSON.parse(row.centroid) as { coordinates: [number, number] };
    if (!geom?.coordinates) continue;
    const [lng, lat] = geom.coordinates;
    if (!Number.isFinite(lng) || !Number.isFinite(lat)) continue;
    if (lng < minLng) minLng = lng;
    if (lat < minLat) minLat = lat;
    if (lng > maxLng) maxLng = lng;
    if (lat > maxLat) maxLat = lat;
  }
  // Return null if no valid centroids were found
  if (!Number.isFinite(minLng)) return null;
  return { minLng, minLat, maxLng, maxLat };
}

// 1 degree ≈ 111 km, so 0.009 ≈ 1 km padding
const BOUNDARY_PAD_DEG = 0.009;

function isWithinBounds(
  point: LngLat,
  bounds: { minLng: number; minLat: number; maxLng: number; maxLat: number },
  pad = BOUNDARY_PAD_DEG,
) {
  return (
    point.lng >= bounds.minLng - pad &&
    point.lng <= bounds.maxLng + pad &&
    point.lat >= bounds.minLat - pad &&
    point.lat <= bounds.maxLat + pad
  );
}

// ── ORS external routing ────────────────────────────────────────────────────

const ORS_BASE = 'https://api.openrouteservice.org/v2';

async function orsRoute(from: LngLat, to: LngLat, mode: 'walking' | 'accessible'): Promise<GeoJsonLineString | null> {
  const apiKey = process.env.ORS_API_KEY;
  if (!apiKey) return null;

  const profile = mode === 'accessible' ? 'foot-wheelchair' : 'foot-walking';

  try {
    const res = await fetch(`${ORS_BASE}/directions/${profile}/geojson`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: apiKey },
      body: JSON.stringify({
        coordinates: [[from.lng, from.lat], [to.lng, to.lat]],
        instructions: false,
        geometry_simplify: false,
      }),
    });

    if (!res.ok) return null;

    const body = await res.json() as {
      features: Array<{ geometry: GeoJsonLineString; properties: { summary: { distance: number } } }>;
    };

    return body.features?.[0]?.geometry ?? null;
  } catch {
    return null;
  }
}

// ── Internal graph routing (fallback when ORS unavailable) ──────────────────

type GraphEdge = RouteEdge & { neighbor: string };

function parseLineString(value: string): GeoJsonLineString {
  return JSON.parse(value) as GeoJsonLineString;
}

function mergeCoordinates(edges: RouteEdge[]) {
  const coordinates: GeoJsonPosition[] = [];
  for (const edge of edges) {
    const line = parseLineString(edge.geometry);
    if (coordinates.length && line.coordinates.length) {
      const [lastLng, lastLat] = coordinates[coordinates.length - 1];
      const [firstLng, firstLat] = line.coordinates[0];
      if (lastLng === firstLng && lastLat === firstLat) {
        coordinates.push(...line.coordinates.slice(1));
      } else {
        coordinates.push(...line.coordinates);
      }
    } else {
      coordinates.push(...line.coordinates);
    }
  }
  return coordinates;
}

function straightLine(from: LngLat, to: LngLat): GeoJsonLineString {
  return { type: 'LineString', coordinates: [[from.lng, from.lat], [to.lng, to.lat]] };
}

function haversineMeters(a: LngLat, b: LngLat) {
  const R = 6371000;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

function lineStringDistance(geometry: GeoJsonLineString): number {
  let total = 0;
  for (let i = 1; i < geometry.coordinates.length; i++) {
    const [lng1, lat1] = geometry.coordinates[i - 1];
    const [lng2, lat2] = geometry.coordinates[i];
    total += haversineMeters({ lng: lng1, lat: lat1 }, { lng: lng2, lat: lat2 });
  }
  return Math.round(total);
}

function buildAdjacency(edges: RouteEdge[]) {
  const adjacency = new Map<string, GraphEdge[]>();
  for (const edge of edges) {
    adjacency.set(edge.fromNodeId, [...(adjacency.get(edge.fromNodeId) ?? []), { ...edge, neighbor: edge.toNodeId }]);
    adjacency.set(edge.toNodeId, [...(adjacency.get(edge.toNodeId) ?? []), { ...edge, neighbor: edge.fromNodeId }]);
  }
  return adjacency;
}

function shortestPath(start: string, end: string, edges: RouteEdge[]) {
  const adjacency = buildAdjacency(edges);
  const distances = new Map<string, number>([[start, 0]]);
  const previous = new Map<string, { nodeId: string; edge: RouteEdge }>();
  const queue = new Set<string>([start]);

  while (queue.size) {
    let current = '';
    let currentDistance = Infinity;
    for (const nodeId of queue) {
      const d = distances.get(nodeId) ?? Infinity;
      if (d < currentDistance) { current = nodeId; currentDistance = d; }
    }
    queue.delete(current);
    if (current === end) break;

    for (const edge of adjacency.get(current) ?? []) {
      const candidate = currentDistance + edge.distanceMeters;
      if (candidate < (distances.get(edge.neighbor) ?? Infinity)) {
        distances.set(edge.neighbor, candidate);
        previous.set(edge.neighbor, { nodeId: current, edge });
        queue.add(edge.neighbor);
      }
    }
  }

  if (!previous.has(end)) return null;
  const path: RouteEdge[] = [];
  let cursor = end;
  while (cursor !== start) {
    const entry = previous.get(cursor);
    if (!entry) return null;
    path.unshift(entry.edge);
    cursor = entry.nodeId;
  }
  return path;
}

function makeSteps(edges: RouteEdge[]): RouteStep[] {
  return edges.map((edge, i) => ({
    instruction: i === 0 ? 'Start walking along the campus path' : 'Continue on the campus path',
    distanceMeters: Math.round(edge.distanceMeters),
    geometry: parseLineString(edge.geometry),
  }));
}

// ── Main export ─────────────────────────────────────────────────────────────

export const campusGraphService = {
  async route(schoolId: string, from: LngLat, to: LngLat, mode: 'walking' | 'accessible') {
    // 0. Validate both points are within campus boundary (best-effort — skip if DB unavailable)
    const bounds = await getCampusBounds(schoolId).catch(() => null);
    if (bounds) {
      if (!isWithinBounds(from, bounds)) {
        throw new AppError('Origin is outside the campus boundary. Please choose a location on campus.', 422);
      }
      if (!isWithinBounds(to, bounds)) {
        throw new AppError('Destination is outside the campus boundary. Please choose a campus location.', 422);
      }
    }

    // 1. Try ORS first — real road-following route
    const orsGeometry = await orsRoute(from, to, mode);
    if (orsGeometry) {
      const distanceMeters = lineStringDistance(orsGeometry);
      return {
        routeId: nanoid(),
        geometry: orsGeometry,
        distanceMeters,
        etaSeconds: estimateWalkingEtaSeconds(distanceMeters, mode),
        steps: [{ instruction: 'Follow the route to your destination', distanceMeters, geometry: orsGeometry }],
        warnings: [],
      };
    }

    // 2. Try internal campus graph (best-effort — fall through if DB unavailable)
    try {
      const accessibleOnly = mode === 'accessible';
      const [startNode] = await campusMapRepository.nearestRouteNode(schoolId, from, accessibleOnly);
      const [endNode] = await campusMapRepository.nearestRouteNode(schoolId, to, accessibleOnly);

      if (startNode && endNode) {
        const edges = await campusMapRepository.listRouteEdges(schoolId, accessibleOnly);
        const path = shortestPath(startNode.id, endNode.id, edges);

        if (path?.length) {
          const distanceMeters = Math.round(path.reduce((sum, e) => sum + e.distanceMeters, 0));
          return {
            routeId: nanoid(),
            geometry: { type: 'LineString' as const, coordinates: mergeCoordinates(path) },
            distanceMeters,
            etaSeconds: estimateWalkingEtaSeconds(distanceMeters, mode),
            steps: makeSteps(path),
            warnings: [],
          };
        }
      }
    } catch {
      // graph DB unavailable — fall through to straight-line
    }

    // 3. Straight-line fallback
    const geometry = straightLine(from, to);
    const distanceMeters = Math.round(haversineMeters(from, to));
    return {
      routeId: nanoid(),
      geometry,
      distanceMeters,
      etaSeconds: estimateWalkingEtaSeconds(distanceMeters, mode),
      steps: [{ instruction: 'Walk toward the destination', distanceMeters, geometry }],
      warnings: ['No route data available — showing straight-line estimate.'],
    };
  },
};
