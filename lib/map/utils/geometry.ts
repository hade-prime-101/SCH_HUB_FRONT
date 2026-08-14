/**
 * GeoJSON and geometry utilities
 */

// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { GeoJSONGeometry, GeoJSONLineString, GeoJSONPolygon } from '../types/geojson';

/**
 * Calculate length of a LineString in meters
 */
export function lineStringLength(lineString: GeoJSONLineString): number {
  if (lineString.coordinates.length < 2) return 0;

  let length = 0;
  for (let i = 0; i < lineString.coordinates.length - 1; i++) {
    const [lng1, lat1] = lineString.coordinates[i];
    const [lng2, lat2] = lineString.coordinates[i + 1];
    length += haversineDistance(lat1, lng1, lat2, lng2);
  }

  return length;
}

/**
 * Calculate area of a Polygon in square meters
 * Using the Shoelace formula projected to equirectangular
 */
export function polygonArea(polygon: GeoJSONPolygon): number {
  if (polygon.coordinates.length === 0) return 0;

  let area = 0;
  const [outerRing] = polygon.coordinates;

  // Shoelace formula
  for (let i = 0; i < outerRing.length - 1; i++) {
    const [lng1, lat1] = outerRing[i];
    const [lng2, lat2] = outerRing[i + 1];
    area += (lng2 - lng1) * (lat2 + lat1);
  }

  // Convert from degrees² to meters² (very rough approximation)
  const latRadians = (outerRing[0][1] * Math.PI) / 180;
  const metersPerDegreeLng = 111320 * Math.cos(latRadians);
  const metersPerDegreeLat = 111320;

  return Math.abs(area * metersPerDegreeLng * metersPerDegreeLat) / 2;
}

/**
 * Check if a point is inside a polygon (ray casting algorithm)
 */
export function isPointInPolygon(
  point: { lat: number; lng: number },
  polygon: GeoJSONPolygon,
): boolean {
  const [lng, lat] = [point.lng, point.lat];
  const [outerRing] = polygon.coordinates;

  let isInside = false;
  let j = outerRing.length - 1;

  for (let i = 0; i < outerRing.length; i++) {
    const xi = outerRing[i][0];
    const yi = outerRing[i][1];
    const xj = outerRing[j][0];
    const yj = outerRing[j][1];

    const intersect = yi > lat !== yj > lat && lng < ((xj - xi) * (lat - yi)) / (yj - yi) + xi;
    if (intersect) isInside = !isInside;

    j = i;
  }

  return isInside;
}

/**
 * Get the center of a polygon
 */
export function polygonCenter(polygon: GeoJSONPolygon): { lat: number; lng: number } | null {
  const [outerRing] = polygon.coordinates;
  if (outerRing.length === 0) return null;

  let sumLng = 0;
  let sumLat = 0;

  for (const [lng, lat] of outerRing) {
    sumLng += lng;
    sumLat += lat;
  }

  return {
    lng: sumLng / outerRing.length,
    lat: sumLat / outerRing.length,
  };
}

/**
 * Simplify a line string using the Ramer-Douglas-Peucker algorithm
 * Reduces number of points while maintaining general shape
 */
export function simplifyLineString(
  lineString: GeoJSONLineString,
  tolerance: number = 0.0001, // in decimal degrees (~10 meters)
): GeoJSONLineString {
  if (lineString.coordinates.length <= 2) return lineString;

  const pointsOnly = lineString.coordinates.map(pos => [pos[0], pos[1]] as [number, number]);
  const simplified = rdpSimplify(pointsOnly, tolerance);

  return {
    type: 'LineString',
    coordinates: simplified as GeoJSONLineString['coordinates'],
  };
}

/**
 * Ramer-Douglas-Peucker implementation
 */
function rdpSimplify(points: [number, number][], tolerance: number): [number, number][] {
  if (points.length < 3) return points;

  const start = points[0];
  const end = points[points.length - 1];

  let maxDist = 0;
  let maxIndex = 0;

  for (let i = 1; i < points.length - 1; i++) {
    const dist = perpendicularDistance(points[i], start, end);
    if (dist > maxDist) {
      maxDist = dist;
      maxIndex = i;
    }
  }

  if (maxDist > tolerance) {
    const left = rdpSimplify(points.slice(0, maxIndex + 1), tolerance);
    const right = rdpSimplify(points.slice(maxIndex), tolerance);
    return [...left.slice(0, -1), ...right];
  }

  return [start, end];
}

/**
 * Calculate perpendicular distance from a point to a line
 */
function perpendicularDistance(point: [number, number], lineStart: [number, number], lineEnd: [number, number]): number {
  const [px, py] = point;
  const [x1, y1] = lineStart;
  const [x2, y2] = lineEnd;

  const num = Math.abs((y2 - y1) * px - (x2 - x1) * py + x2 * y1 - y2 * x1);
  const den = Math.sqrt(Math.pow(y2 - y1, 2) + Math.pow(x2 - x1, 2));

  return den === 0 ? 0 : num / den;
}

// ─── Helper ────────────────────────────────────────────────────────────────────

/**
 * Haversine distance in meters
 */
function haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6_371_000;
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lng2 - lng1) * Math.PI) / 180;

  const a = Math.sin(Δφ / 2) ** 2 + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}
