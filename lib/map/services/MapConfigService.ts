/**
 * MapConfigService — manage map configuration
 * 
 * Responsible for:
 * - Fetching map API keys (MapTiler, etc.)
 * - Managing map view settings
 * - School-specific map configuration
 */

import { campusMap } from '@/lib/api/campus-map.api';
import { MapConfig } from '../types/map';
import { BaseMapService, MapServiceError } from './baseService';

export interface MapAPIConfig {
  maptilerApiKey?: string | null;
}

/**
 * Config service singleton
 */
export class MapConfigService extends BaseMapService {
  private static instance: MapConfigService;
  private config: MapConfig | null = null;

  private constructor() {
    super();
  }

  static getInstance(): MapConfigService {
    if (!MapConfigService.instance) {
      MapConfigService.instance = new MapConfigService();
    }
    return MapConfigService.instance;
  }

  /**
   * Get or fetch map configuration
   */
  async getMapConfig(): Promise<MapConfig> {
    if (this.config) return this.config;

    const cacheKey = 'map-config';

    // Check cache
    const cached = this.getFromCache<MapConfig>(cacheKey);
    if (cached) {
      this.config = cached;
      return cached;
    }

    try {
      return await this.deduplicate(cacheKey, async () => {
        const apiConfig = await this.fetchMapAPIConfig();
        const config = this.buildMapConfig(apiConfig);

        // Cache for 24 hours (unlikely to change)
        this.setCache(cacheKey, config, 24 * 60 * 60 * 1000);

        this.config = config;
        return config;
      });
    } catch (error) {
      // Return defaults if fetch fails
      console.warn('Failed to fetch map config, using defaults', error);
      return this.getDefaultConfig();
    }
  }

  /**
   * Get only the API keys (MapTiler, etc.)
   */
  async getMapAPIKeys(): Promise<MapAPIConfig> {
    const cacheKey = 'map-api-keys';

    // Check cache
    const cached = this.getFromCache<MapAPIConfig>(cacheKey);
    if (cached) return cached;

    try {
      return await this.deduplicate(cacheKey, async () => {
        const config = await campusMap.getMapConfig();

        // Cache for 12 hours
        this.setCache(cacheKey, config, 12 * 60 * 60 * 1000);

        return config;
      });
    } catch (error) {
      throw new MapServiceError(
        'MAP_CONFIG_FETCH_FAILED',
        'Failed to fetch map API configuration',
        error as Error,
      );
    }
  }

  /**
   * Get map configuration with defaults
   */
  async getFullConfig(): Promise<MapConfig> {
    return this.getMapConfig();
  }

  /**
   * Check if 3D buildings are available
   */
  async has3DBuildings(): Promise<boolean> {
    const config = await this.getMapConfig();
    const keys = await this.getMapAPIKeys();
    return Boolean(keys.maptilerApiKey) && config.defaultZoom >= 14;
  }

  /**
   * Reset configuration cache (call after manual config changes)
   */
  resetConfig(): void {
    this.config = null;
    this.invalidateCache('map-config');
    this.invalidateCache('map-api-keys');
  }

  // ─── Helpers ────────────────────────────────────────────────────────────────

  private async fetchMapAPIConfig(): Promise<MapAPIConfig> {
    try {
      return await campusMap.getMapConfig();
    } catch {
      return {};
    }
  }

  private buildMapConfig(apiConfig: MapAPIConfig): MapConfig {
    return {
      maptilerApiKey: apiConfig.maptilerApiKey,
      defaultCenter: [4.5399, 7.3775], // Nigeria center as default
      defaultZoom: 16,
      defaultPitch: 45,
      defaultBearing: -10,
      minZoom: 14,
      maxZoom: 20,
    };
  }

  private getDefaultConfig(): MapConfig {
    return {
      defaultCenter: [4.5399, 7.3775],
      defaultZoom: 16,
      defaultPitch: 45,
      defaultBearing: -10,
      minZoom: 14,
      maxZoom: 20,
    };
  }
}

/**
 * Export singleton instance
 */
export const mapConfigService = MapConfigService.getInstance();
