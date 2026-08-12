/**
 * MapLocationService — manage locations/features on the campus map
 * 
 * Responsible for:
 * - Fetching location lists with filtering
 * - Getting individual location details
 * - Searching locations
 * - Finding nearest locations
 * - Caching and deduplication
 */

import { campusMapApi } from '@/lib/api/planner';
import { campusMap } from '@/lib/api/campus-map.api';
import { Location, MapLocation, isMapLocation, LocationType } from '../types/location';
import { normalizeLocation, normalizeLocations } from '../normalizers/locationNormalizer';
import { BaseMapService, MapServiceError } from './baseService';
import { haversineDistance } from '../utils/distance';

export interface LocationListOptions {
  category?: LocationType;
  limit?: number;
  bbox?: { minLng: number; maxLng: number; minLat: number; maxLat: number };
}

export interface LocationSearchOptions {
  query: string;
  category?: LocationType;
  userLocation?: { lat: number; lng: number };
  limit?: number;
}

export interface NearestLocationsOptions {
  userLocation: { lat: number; lng: number };
  category?: LocationType;
  radiusMeters?: number;
  limit?: number;
}

/**
 * Location service singleton
 */
export class MapLocationService extends BaseMapService {
  private static instance: MapLocationService;

  private constructor() {
    super();
  }

  static getInstance(): MapLocationService {
    if (!MapLocationService.instance) {
      MapLocationService.instance = new MapLocationService();
    }
    return MapLocationService.instance;
  }

  /**
   * Get all locations, optionally filtered by category
   */
  async getLocations(options?: LocationListOptions): Promise<Location[]> {
    const cacheKey = `locations:${options?.category || 'all'}`;

    // Check cache first
    const cached = this.getFromCache<Location[]>(cacheKey);
    if (cached) return cached;

    try {
      return await this.deduplicate(cacheKey, async () => {
        const params: Record<string, string> = {};
        if (options?.category) params.category = options.category;
        if (options?.limit) params.limit = String(options.limit);

        const raw = await campusMapApi.getFeatures(params);
        const normalized = normalizeLocations(this.ensureArray(raw) as Record<string, unknown>[]);

        // Cache for 10 minutes
        this.setCache(cacheKey, normalized, 10 * 60 * 1000);

        return normalized;
      });
    } catch (error) {
      throw new MapServiceError(
        'LOCATION_LIST_FAILED',
        'Failed to fetch locations',
        error as Error,
      );
    }
  }

  /**
   * Get a single location by ID
   */
  async getLocation(id: string): Promise<Location | null> {
    if (!id) {
      throw new MapServiceError('INVALID_ID', 'Location ID is required');
    }

    const cacheKey = `location:${id}`;

    // Check cache first
    const cached = this.getFromCache<Location | null>(cacheKey);
    if (cached !== null && cached !== undefined) return cached;

    try {
      return await this.deduplicate(cacheKey, async () => {
        const raw = await campusMapApi.getFeature(id);
        const normalized = normalizeLocation(raw);

        // Cache for 30 minutes
        if (normalized) {
          this.setCache(cacheKey, normalized, 30 * 60 * 1000);
        }

        return normalized;
      });
    } catch (error) {
      throw new MapServiceError(
        'LOCATION_DETAIL_FAILED',
        `Failed to fetch location ${id}`,
        error as Error,
      );
    }
  }

  /**
   * Search locations by query string
   */
  async searchLocations(options: LocationSearchOptions): Promise<Location[]> {
    const { query, category, userLocation, limit } = options;

    if (!query || query.trim().length === 0) {
      throw new MapServiceError('INVALID_QUERY', 'Search query is required');
    }

    const cacheKey = `search:${query}:${category || 'all'}:${userLocation ? `${userLocation.lat},${userLocation.lng}` : 'no-location'}`;

    // Check cache first (shorter TTL for search results)
    const cached = this.getFromCache<Location[]>(cacheKey);
    if (cached) return cached;

    try {
      return await this.deduplicate(cacheKey, async () => {
        const near = userLocation ? `${userLocation.lat},${userLocation.lng}` : undefined;

        const raw = await campusMapApi.search(
          query,
          category,
          near,
        );

        let normalized = normalizeLocations(this.ensureArray(raw) as Record<string, unknown>[]);

        // Apply limit if specified
        if (limit && normalized.length > limit) {
          normalized = normalized.slice(0, limit);
        }

        // Cache for 5 minutes
        this.setCache(cacheKey, normalized, 5 * 60 * 1000);

        return normalized;
      });
    } catch (error) {
      throw new MapServiceError(
        'LOCATION_SEARCH_FAILED',
        'Failed to search locations',
        error as Error,
      );
    }
  }

  /**
   * Get nearest locations to user
   * Server computes distances for accuracy
   */
  async getNearestLocations(options: NearestLocationsOptions): Promise<Location[]> {
    const { userLocation, category, radiusMeters, limit } = options;

    const cacheKey = `nearest:${userLocation.lat},${userLocation.lng}:${category || 'all'}`;

    // Check cache first
    const cached = this.getFromCache<Location[]>(cacheKey);
    if (cached) return cached;

    try {
      return await this.deduplicate(cacheKey, async () => {
        const raw = await campusMapApi.getNearest(
          userLocation.lat,
          userLocation.lng,
          category,
        );

        let normalized = normalizeLocations(this.ensureArray(raw) as Record<string, unknown>[]);

        // Filter by radius if specified
        if (radiusMeters) {
          normalized = normalized.filter(loc => {
            if (!isMapLocation(loc)) return false;
            const distance = haversineDistance(userLocation, { lat: loc.latitude, lng: loc.longitude });
            return distance <= radiusMeters;
          });
        }

        // Apply limit if specified
        if (limit && normalized.length > limit) {
          normalized = normalized.slice(0, limit);
        }

        // Cache for 2 minutes (nearest results change as user moves)
        this.setCache(cacheKey, normalized, 2 * 60 * 1000);

        return normalized;
      });
    } catch (error) {
      throw new MapServiceError(
        'NEAREST_LOCATION_FAILED',
        'Failed to fetch nearest locations',
        error as Error,
      );
    }
  }

  /**
   * Filter locations by mapability (have valid coordinates)
   */
  filterMapLocations(locations: Location[]): MapLocation[] {
    return locations.filter(isMapLocation);
  }

  /**
   * Sort locations by distance from a point
   */
  sortByDistance(locations: Location[], center: { lat: number; lng: number }): Location[] {
    return [...locations].sort((a, b) => {
      const distA = isMapLocation(a) ? haversineDistance(center, { lat: a.latitude, lng: a.longitude }) : Infinity;
      const distB = isMapLocation(b) ? haversineDistance(center, { lat: b.latitude, lng: b.longitude }) : Infinity;
      return distA - distB;
    });
  }

  /**
   * Invalidate location caches (call this after admin creates/updates locations)
   */
  invalidateLocationCache(): void {
    this.clearCachePattern(/^(locations|location|search|nearest):/);
  }

  // ─── Helpers ────────────────────────────────────────────────────────────────

  private ensureArray(data: unknown): unknown[] {
    if (Array.isArray(data)) return data;
    if (data && typeof data === 'object') {
      const obj = data as Record<string, unknown>;
      if (Array.isArray(obj.features)) return obj.features;
      if (Array.isArray(obj.locations)) return obj.locations;
      if (Array.isArray(obj.data)) return obj.data;
    }
    return [];
  }
}

/**
 * Export singleton instance
 */
export const mapLocationService = MapLocationService.getInstance();
