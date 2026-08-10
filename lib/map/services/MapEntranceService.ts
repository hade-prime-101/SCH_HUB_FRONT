/**
 * MapEntranceService — manage entrances for buildings/locations
 * 
 * Responsible for:
 * - Fetching entrances for a location
 * - Finding nearest entrance for routing
 * - Sorting entrances by priority
 * - Fallback generation when backend doesn't provide entrance data
 */

import { campusMapApi } from '@/lib/api/planner';
import { Entrance, sortEntrancesByPriority, hasEntranceCoordinates } from '../types/entrance';
import { Location } from '../types/location';
import {
  normalizeEntrance,
  normalizeEntrances,
  createFallbackEntrances,
} from '../normalizers/entranceNormalizer';
import { BaseMapService, MapServiceError } from './baseService';
import { haversineDistance, findNearest } from '../utils/distance';

/**
 * Entrance service singleton
 */
export class MapEntranceService extends BaseMapService {
  private static instance: MapEntranceService;

  private constructor() {
    super();
  }

  static getInstance(): MapEntranceService {
    if (!MapEntranceService.instance) {
      MapEntranceService.instance = new MapEntranceService();
    }
    return MapEntranceService.instance;
  }

  /**
   * Get all entrances for a location
   * Falls back to generated entrances from location tags if backend has no explicit entrances
   */
  async getEntrances(locationId: string, location?: Location): Promise<Entrance[]> {
    if (!locationId) {
      throw new MapServiceError('INVALID_ID', 'Location ID is required');
    }

    const cacheKey = `entrances:${locationId}`;

    // Check cache first
    const cached = this.getFromCache<Entrance[]>(cacheKey);
    if (cached) return cached;

    try {
      return await this.deduplicate(cacheKey, async () => {
        // Try fetching from backend
        const raw = await campusMapApi.getFeatureEntrances(locationId);
        const features = this.ensureArray(raw) as Array<Record<string, unknown>>;

        let entrances: Entrance[] = [];

        if (features.length > 0) {
          // Backend has explicit entrance data
          entrances = normalizeEntrances(features);
        } else if (location) {
          // No explicit entrances — create fallback from location tags
          entrances = createFallbackEntrances(location.name, location.id, location.tags);
        } else {
          // No data and no location object — return empty with warning
          console.warn(`No entrances found for location ${locationId} and no fallback location provided`);
          return [];
        }

        // Sort by priority (main entrance first)
        entrances = sortEntrancesByPriority(entrances);

        // Cache for 30 minutes
        this.setCache(cacheKey, entrances, 30 * 60 * 1000);

        return entrances;
      });
    } catch (error) {
      // Non-fatal — return fallback entrances if available
      if (location) {
        const fallback = createFallbackEntrances(location.name, location.id, location.tags);
        this.setCache(cacheKey, fallback, 10 * 60 * 1000);
        return fallback;
      }

      throw new MapServiceError(
        'ENTRANCE_FETCH_FAILED',
        `Failed to fetch entrances for location ${locationId}`,
        error as Error,
      );
    }
  }

  /**
   * Find the best entrance for navigation
   * Prioritizes: main entrance → accessible entrance → nearest entrance
   */
  async selectBestEntrance(
    locationId: string,
    location: Location,
    options?: {
      userLocation?: { lat: number; lng: number };
      preferAccessible?: boolean;
    },
  ): Promise<Entrance | null> {
    const entrances = await this.getEntrances(locationId, location);

    if (entrances.length === 0) return null;

    // Filter valid entrances (must have coordinates)
    const validEntrances = entrances.filter(hasEntranceCoordinates);
    if (validEntrances.length === 0) return null;

    // Priority 1: Accessible entrance if requested
    if (options?.preferAccessible) {
      const accessible = validEntrances.find(e => e.isAccessible);
      if (accessible) return accessible;
    }

    // Priority 2: Main entrance
    const main = validEntrances.find(e => e.kind === 'MAIN');
    if (main) return main;

    // Priority 3: Nearest to user if user location available
    if (options?.userLocation) {
      const entrancePoints = validEntrances.map(e => ({ ...e, lat: e.latitude, lng: e.longitude }));
      const nearest = findNearest(options.userLocation, entrancePoints);
      if (nearest) {
        return validEntrances.find(e => e.id === nearest.point.id) || null;
      }
    }

    // Fallback: First valid entrance
    return validEntrances[0];
  }

  /**
   * Find nearest entrance across all locations
   */
  findNearestEntrance(
    userLocation: { lat: number; lng: number },
    entrances: Entrance[],
  ): { entrance: Entrance; distance: number } | null {
    const validEntrances = entrances.filter(hasEntranceCoordinates);
    if (validEntrances.length === 0) return null;

    const entrancePoints = validEntrances.map(e => ({ ...e, lat: e.latitude, lng: e.longitude }));
    const nearest = findNearest(userLocation, entrancePoints);
    if (!nearest) return null;

    const entrance = validEntrances.find(e => e.id === nearest.point.id);
    if (!entrance) return null;

    return {
      entrance,
      distance: nearest.distance,
    };
  }

  /**
   * Get entrance with minimum distance to user
   */
  getClosestEntrance(
    entrances: Entrance[],
    userLocation: { lat: number; lng: number },
  ): Entrance | null {
    const validEntrances = entrances.filter(hasEntranceCoordinates);
    if (validEntrances.length === 0) return null;

    let closest = validEntrances[0];
    let minDistance = haversineDistance(userLocation, { lat: closest.latitude, lng: closest.longitude });

    for (const entrance of validEntrances.slice(1)) {
      const distance = haversineDistance(userLocation, { lat: entrance.latitude, lng: entrance.longitude });
      if (distance < minDistance) {
        minDistance = distance;
        closest = entrance;
      }
    }

    return closest;
  }

  /**
   * Invalidate entrance caches (call when admin updates entrances)
   */
  invalidateEntranceCache(locationId?: string): void {
    if (locationId) {
      this.invalidateCache(`entrances:${locationId}`);
    } else {
      this.clearCachePattern(/^entrances:/);
    }
  }

  // ─── Helpers ────────────────────────────────────────────────────────────────

  private ensureArray(data: unknown): unknown[] {
    if (Array.isArray(data)) return data;
    if (data && typeof data === 'object') {
      const obj = data as Record<string, unknown>;
      if (Array.isArray(obj.features)) return obj.features;
      if (Array.isArray(obj.entrances)) return obj.entrances;
      if (Array.isArray(obj.data)) return obj.data;
    }
    return [];
  }
}

/**
 * Export singleton instance
 */
export const mapEntranceService = MapEntranceService.getInstance();
