/**
 * Distance and spatial calculation utilities
 */

/**
 * Calculate distance between two points using Haversine formula
 * 
 * @param from - Starting point [lat, lng]
 * @param to - Ending point [lat, lng]
 * @returns Distance in meters
 */
export function haversineDistance(
  from: { lat: number; lng: number } | [lat: number, lng: number],
  to: { lat: number; lng: number } | [lat: number, lng: number],
): number {
  const lat1 = Array.isArray(from) ? from[0] : from.lat;
  const lng1 = Array.isArray(from) ? from[1] : from.lng;
  const lat2 = Array.isArray(to) ? to[0] : to.lat;
  const lng2 = Array.isArray(to) ? to[1] : to.lng;

  const R = 6_371_000; // Earth's radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lng2 - lng1) * Math.PI) / 180;

  const a = Math.sin(Δφ / 2) ** 2 + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

/**
 * Calculate bearing (compass direction) from one point to another
 * 
 * @param from - Starting point
 * @param to - Ending point
 * @returns Bearing in degrees (0-360, where 0 is North)
 */
export function calculateBearing(
  from: { lat: number; lng: number } | [lat: number, lng: number],
  to: { lat: number; lng: number } | [lat: number, lng: number],
): number {
  const lat1 = Array.isArray(from) ? from[0] : from.lat;
  const lng1 = Array.isArray(from) ? from[1] : from.lng;
  const lat2 = Array.isArray(to) ? to[0] : to.lat;
  const lng2 = Array.isArray(to) ? to[1] : to.lng;

  const dLng = lng2 - lng1;
  const y = Math.sin(dLng * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180));
  const x =
    Math.cos(lat1 * (Math.PI / 180)) * Math.sin(lat2 * (Math.PI / 180)) -
    Math.sin(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * Math.cos(dLng * (Math.PI / 180));

  let bearing = Math.atan2(y, x) * (180 / Math.PI);
  bearing = (bearing + 360) % 360; // Normalize to 0-360
  return bearing;
}

/**
 * Find the closest point in an array
 */
export function findNearest<T extends { lat: number; lng: number }>(
  origin: { lat: number; lng: number },
  points: T[],
): { point: T; distance: number } | null {
  if (points.length === 0) return null;

  let nearest = points[0];
  let minDistance = haversineDistance(origin, nearest);

  for (let i = 1; i < points.length; i++) {
    const distance = haversineDistance(origin, points[i]);
    if (distance < minDistance) {
      minDistance = distance;
      nearest = points[i];
    }
  }

  return { point: nearest, distance: minDistance };
}

/**
 * Filter points within a certain radius
 */
export function filterByRadius<T extends { lat: number; lng: number }>(
  origin: { lat: number; lng: number },
  points: T[],
  radiusMeters: number,
): T[] {
  return points.filter(point => haversineDistance(origin, point) <= radiusMeters);
}

/**
 * Format distance for display
 * 
 * @param meters - Distance in meters
 * @returns Formatted string like "500 m" or "2.5 km"
 */
export function formatDistance(meters: number): string {
  if (meters < 1000) {
    return `${Math.round(meters)} m`;
  }
  return `${(meters / 1000).toFixed(1)} km`;
}

/**
 * Format duration for display
 * 
 * @param seconds - Duration in seconds
 * @returns Formatted string like "5 min" or "1 hr 23 min"
 */
export function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  if (hours === 0) return `${minutes} min`;
  if (minutes === 0) return `${hours} hr`;
  return `${hours} hr ${minutes} min`;
}

/**
 * Calculate walking time estimate
 * Average walking speed: ~1.4 m/s (5 km/h)
 * 
 * @param meters - Distance in meters
 * @returns Estimated walking time in seconds
 */
export function estimateWalkingTime(meters: number): number {
  const walkingSpeed = 1.4; // m/s
  return Math.round(meters / walkingSpeed);
}
