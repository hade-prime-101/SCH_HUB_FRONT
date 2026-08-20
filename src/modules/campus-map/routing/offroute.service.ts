import type { GeoJsonLineString, LngLat } from '../campus-map.types.js';

const EARTH_RADIUS_METERS = 6371000;

function toRadians(value: number) {
  return (value * Math.PI) / 180;
}

function distanceMeters(a: LngLat, b: LngLat) {
  const dLat = toRadians(b.lat - a.lat);
  const dLng = toRadians(b.lng - a.lng);
  const lat1 = toRadians(a.lat);
  const lat2 = toRadians(b.lat);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_METERS * Math.asin(Math.sqrt(h));
}

export function routeProgress(user: LngLat, route: GeoJsonLineString) {
  const points = route.coordinates.map(([lng, lat]) => ({ lng, lat }));
  const nearest = points.reduce(
    (best, point, index) => {
      const distance = distanceMeters(user, point);
      return distance < best.distance ? { distance, index } : best;
    },
    { distance: Number.POSITIVE_INFINITY, index: 0 },
  );

  return {
    nearestVertexIndex: nearest.index,
    distanceFromRouteMeters: Math.round(nearest.distance),
    offRoute: nearest.distance > 35,
  };
}
