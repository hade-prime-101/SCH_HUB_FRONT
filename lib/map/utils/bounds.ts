/**
 * Bounding box and geographic boundary utilities
 */

import { MapBounds } from '../types/map';

export interface BoundingBox {
  minLng: number;
  maxLng: number;
  minLat: number;
  maxLat: number;
}

/**
 * Create a bounding box from an array of points
 */
export function calculateBounds(points: Array<{ lat: number; lng: number }>): BoundingBox | null {
  if (points.length === 0) return null;

  let minLat = points[0].lat;
  let maxLat = points[0].lat;
  let minLng = points[0].lng;
  let maxLng = points[0].lng;

  for (const point of points) {
    minLat = Math.min(minLat, point.lat);
    maxLat = Math.max(maxLat, point.lat);
    minLng = Math.min(minLng, point.lng);
    maxLng = Math.max(maxLng, point.lng);
  }

  return { minLat, maxLat, minLng, maxLng };
}

/**
 * Expand bounds by a padding distance (in degrees)
 * Rule of thumb: 1 degree ≈ 111 km
 * 
 * @param bounds - Original bounds
 * @param paddingDegrees - Padding in decimal degrees
 */
export function expandBounds(bounds: BoundingBox, paddingDegrees: number): BoundingBox {
  return {
    minLat: bounds.minLat - paddingDegrees,
    maxLat: bounds.maxLat + paddingDegrees,
    minLng: bounds.minLng - paddingDegrees,
    maxLng: bounds.maxLng + paddingDegrees,
  };
}

/**
 * Convert bounding box to MapLibre LngLatBounds format
 * MapLibre expects: [[minLng, minLat], [maxLng, maxLat]]
 */
export function boundsToLngLatArray(bounds: BoundingBox): [[number, number], [number, number]] {
  return [
    [bounds.minLng, bounds.minLat],
    [bounds.maxLng, bounds.maxLat],
  ];
}

/**
 * Check if a point is within bounds
 */
export function isPointInBounds(point: { lat: number; lng: number }, bounds: BoundingBox): boolean {
  return (
    point.lat >= bounds.minLat &&
    point.lat <= bounds.maxLat &&
    point.lng >= bounds.minLng &&
    point.lng <= bounds.maxLng
  );
}

/**
 * Calculate center of bounds
 */
export function boundsCentre(bounds: BoundingBox): { lat: number; lng: number } {
  return {
    lat: (bounds.minLat + bounds.maxLat) / 2,
    lng: (bounds.minLng + bounds.maxLng) / 2,
  };
}

/**
 * Calculate approximate zoom level based on bounds width
 * 
 * Rough guide:
 * - 360° → zoom 0
 * - 180° → zoom 1
 * - 90° → zoom 2
 * - etc.
 */
export function calculateZoomForBounds(bounds: BoundingBox): number {
  const lngDiff = bounds.maxLng - bounds.minLng;
  return Math.floor(Math.log2(360 / lngDiff)) - 1;
}

/**
 * Constrain point within bounds
 */
export function constrainPointToBounds(
  point: { lat: number; lng: number },
  bounds: BoundingBox,
): { lat: number; lng: number } {
  return {
    lat: Math.max(bounds.minLat, Math.min(bounds.maxLat, point.lat)),
    lng: Math.max(bounds.minLng, Math.min(bounds.maxLng, point.lng)),
  };
}

/**
 * Create a bounding box for a circle (approximation)
 * 
 * @param center - Center point
 * @param radiusMeters - Radius in meters
 */
export function circleToBounds(center: { lat: number; lng: number }, radiusMeters: number): BoundingBox {
  // Rough approximation: 1 degree ≈ 111 km
  const radiusDegrees = radiusMeters / (111 * 1000);

  return {
    minLat: center.lat - radiusDegrees,
    maxLat: center.lat + radiusDegrees,
    minLng: center.lng - radiusDegrees,
    maxLng: center.lng + radiusDegrees,
  };
}

/**
 * Merge multiple bounding boxes into one larger box
 */
export function mergeBounds(boundingBoxes: BoundingBox[]): BoundingBox | null {
  if (boundingBoxes.length === 0) return null;

  let minLat = boundingBoxes[0].minLat;
  let maxLat = boundingBoxes[0].maxLat;
  let minLng = boundingBoxes[0].minLng;
  let maxLng = boundingBoxes[0].maxLng;

  for (const box of boundingBoxes.slice(1)) {
    minLat = Math.min(minLat, box.minLat);
    maxLat = Math.max(maxLat, box.maxLat);
    minLng = Math.min(minLng, box.minLng);
    maxLng = Math.max(maxLng, box.maxLng);
  }

  return { minLat, maxLat, minLng, maxLng };
}
