/**
 * MapRoutingService — route calculation and navigation
 * 
 * Responsible for:
 * - Calculating walking routes between points
 * - Normalizing route responses
 * - Caching routes
 * - Route progress tracking (future: real-time navigation)
 */

import { campusMap } from '@/lib/api/campus-map.api';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { Route, RouteRequest, RouteProgress, NavigationMode } from '../types/route';
import { Location } from '../types/location';
import { Entrance } from '../types/entrance';
import { normalizeRoute } from '../normalizers/routeNormalizer';
import { BaseMapService, MapServiceError } from './baseService';
import { haversineDistance, estimateWalkingTime, formatDistance, formatDuration } from '../utils/distance';

/**
 * Routing service singleton
 */
export class MapRoutingService extends BaseMapService {
  private static instance: MapRoutingService;

  private constructor() {
    super();
  }

  static getInstance(): MapRoutingService {
    if (!MapRoutingService.instance) {
      MapRoutingService.instance = new MapRoutingService();
    }
    return MapRoutingService.instance;
  }

  /**
   * Calculate route from origin to destination
   */
  async calculateRoute(
    origin: { lat: number; lng: number },
    destination: { lat: number; lng: number; name?: string },
  ): Promise<Route | null> {
    if (!this.isValidLocation(origin) || !this.isValidLocation(destination)) {
      throw new MapServiceError(
        'INVALID_COORDINATES',
        'Origin and destination must have valid latitude and longitude',
      );
    }

    const cacheKey = `route:${origin.lat},${origin.lng}:${destination.lat},${destination.lng}`;

    // Check cache (short TTL since user may move)
    const cached = this.getFromCache<Route | null>(cacheKey);
    if (cached !== undefined && cached !== null) return cached;

    try {
      return await this.deduplicate(cacheKey, async () => {
        const raw = await campusMap.calculateSimpleRoute({
          fromLat: origin.lat,
          fromLng: origin.lng,
          toLat: destination.lat,
          toLng: destination.lng,
          profile: 'foot',
        });

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const route = normalizeRoute(raw as any, origin, destination);

        // If route calculation failed or no geometry
        if (!route) {
          // Fallback: Create a simple straight-line route
          const fallbackRoute = this.createFallbackRoute(origin, destination);
          this.setCache(cacheKey, fallbackRoute, 5 * 60 * 1000);
          return fallbackRoute;
        }

        // Cache for 2 minutes (user may move, route may change)
        this.setCache(cacheKey, route, 2 * 60 * 1000);

        return route;
      });
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      // Try fallback route
      const fallback = this.createFallbackRoute(origin, destination);
      this.setCache(cacheKey, fallback, 2 * 60 * 1000);
      return fallback;
    }
  }

  /**
   * Calculate route from location to its entrance
   */
  async calculateRouteToEntrance(
    origin: { lat: number; lng: number },
    entrance: Entrance,
    locationName?: string,
  ): Promise<Route | null> {
    return this.calculateRoute(origin, {
      lat: entrance.latitude,
      lng: entrance.longitude,
      name: `${locationName} - ${entrance.name}`,
    });
  }

  /**
   * Calculate route to location
   */
  async calculateRouteToLocation(
    origin: { lat: number; lng: number },
    location: Location,
  ): Promise<Route | null> {
    if (!location.latitude || !location.longitude) {
      throw new MapServiceError('INVALID_LOCATION', 'Destination location has no valid coordinates');
    }

    return this.calculateRoute(origin, {
      lat: location.latitude,
      lng: location.longitude,
      name: location.name,
    });
  }

  /**
   * Get turn-by-turn directions from route
   */
  getDirections(route: Route): string[] {
    if (!route.steps || route.steps.length === 0) {
      return [`Head towards ${route.destination.name || 'destination'}`];
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    return route.steps.map((step, index) => {
      const distance = formatDistance(step.distance);
      return `${step.instruction} (${distance})`;
    });
  }

  /**
   * Calculate route progress
   */
  calculateRouteProgress(
  route: Route,
  currentLocation: { lat: number; lng: number },
  accuracy: number = 5,
): RouteProgress {
  // Find nearest vertex on route
  const coords = route.geometry.coordinates;
  let nearestVertexIndex = 0;
  let minDist = Infinity;
  for (let i = 0; i < coords.length; i++) {
    const [lng, lat] = coords[i];
    const d = haversineDistance(currentLocation, { lat, lng });
    if (d < minDist) {
      minDist = d;
      nearestVertexIndex = i;
    }
  }

  // Compute distance along route up to nearest vertex
  let distanceFromStart = 0;
  for (let i = 0; i < nearestVertexIndex; i++) {
    const [lng1, lat1] = coords[i];
    const [lng2, lat2] = coords[i + 1];
    distanceFromStart += haversineDistance({ lat: lat1, lng: lng1 }, { lat: lat2, lng: lng2 });
  }

  const distanceToEnd = route.distance - distanceFromStart;
  const durationToEnd = estimateWalkingTime(distanceToEnd);
  const onRoute = minDist < 30; // within 30m of route

  return {
    routeId: route.id,
    currentLocation,
    distanceAlongRoute: distanceFromStart,
    distanceToEnd,
    durationToEnd,
    currentStep: this.getCurrentStep(route, distanceFromStart),
    onRoute,
    accuracy,
    nearestVertexIndex,
  };
}

  /**
   * Check if user is off route
   */
  isOffRoute(progress: RouteProgress, toleranceMeters: number = 50): boolean {
    return progress.distanceAlongRoute > (progress.routeId.length * 111 + toleranceMeters); // Very rough fallback
  }

  /**
   * Get route summary string
   */
  getRouteSummary(route: Route): string {
    const distance = formatDistance(route.distance);
    const duration = formatDuration(route.duration);
    return `${distance} • ${duration}`;
  }

  /**
   * Invalidate route cache when user location changes significantly
   */
  invalidateRouteCache(): void {
    this.clearCachePattern(/^route:/);
  }

  // ─── Private helpers ────────────────────────────────────────────────────────

  private isValidLocation(loc: { lat: number; lng: number }): boolean {
    return (
      typeof loc.lat === 'number' &&
      typeof loc.lng === 'number' &&
      !isNaN(loc.lat) &&
      !isNaN(loc.lng) &&
      loc.lat >= -90 &&
      loc.lat <= 90 &&
      loc.lng >= -180 &&
      loc.lng <= 180
    );
  }

  /**
   * Create a fallback straight-line route when routing service fails
   */
  private createFallbackRoute(
  origin: { lat: number; lng: number },
  destination: { lat: number; lng: number; name?: string },
): Route {
  const distance = haversineDistance(origin, destination);
  const duration = estimateWalkingTime(distance);

  return {
    id: `fallback-${Date.now()}`,
    createdAt: new Date(),
    origin,
    destination,
    geometry: {
      type: 'LineString' as const,
      coordinates: [
        [origin.lng, origin.lat],
        [destination.lng, destination.lat],
      ],
    },
    distance,
    duration,
    mode: 'walking',
    summary: `Direct route: ${formatDistance(distance)}`,
  };
}
  /**
   * Find which step the user is currently on
   */
  private getCurrentStep(route: Route, distanceFromStart: number): number | undefined {
    if (!route.steps) return undefined;

    let distanceCovered = 0;
    for (let i = 0; i < route.steps.length; i++) {
      distanceCovered += route.steps[i].distance;
      if (distanceFromStart < distanceCovered) {
        return i;
      }
    }

    return route.steps.length - 1;
  }
}

/**
 * Export singleton instance
 */
export const mapRoutingService = MapRoutingService.getInstance();
