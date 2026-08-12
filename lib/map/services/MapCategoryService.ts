/**
 * MapCategoryService — manage location categories and filtering
 * 
 * Responsible for:
 * - Fetching available categories from backend
 * - Category metadata and display info
 * - Filtering locations by category
 */

import { campusMap } from '@/lib/api/campus-map.api';
import { Location, LocationType } from '../types/location';
import { BaseMapService, MapServiceError } from './baseService';

export interface Category {
  type: LocationType;
  label: string;
  count: number;
  icon?: string;
  color?: string;
}

/**
 * Category service singleton
 */
export class MapCategoryService extends BaseMapService {
  private static instance: MapCategoryService;

  private constructor() {
    super();
  }

  static getInstance(): MapCategoryService {
    if (!MapCategoryService.instance) {
      MapCategoryService.instance = new MapCategoryService();
    }
    return MapCategoryService.instance;
  }

  /**
   * Fetch available categories from backend
   */
  async getCategories(): Promise<Category[]> {
    const cacheKey = 'categories:all';

    // Check cache
    const cached = this.getFromCache<Category[]>(cacheKey);
    if (cached) return cached;

    try {
      return await this.deduplicate(cacheKey, async () => {
        const raw = await campusMap.getCategories();

        const categories = this.normalizeCategoryList(raw);

        // Cache for 1 hour (unlikely to change frequently)
        this.setCache(cacheKey, categories, 60 * 60 * 1000);

        return categories;
      });
    } catch (error) {
      throw new MapServiceError(
        'CATEGORIES_FETCH_FAILED',
        'Failed to fetch location categories',
        error as Error,
      );
    }
  }

  /**
   * Get a single category by type
   */
  async getCategory(type: LocationType): Promise<Category | null> {
    const categories = await this.getCategories();
    return categories.find(c => c.type === type) || null;
  }

  /**
   * Filter locations by category
   */
  filterByCategory(locations: Location[], category: LocationType): Location[] {
    return locations.filter(loc => loc.type === category);
  }

  /**
   * Group locations by category
   */
  groupByCategory(locations: Location[]): Map<LocationType, Location[]> {
    const grouped = new Map<LocationType, Location[]>();

    for (const location of locations) {
      if (!grouped.has(location.type)) {
        grouped.set(location.type, []);
      }
      grouped.get(location.type)!.push(location);
    }

    return grouped;
  }

  /**
   * Invalidate category cache
   */
  invalidateCategoryCache(): void {
    this.invalidateCache('categories:all');
  }

  // ─── Helpers ────────────────────────────────────────────────────────────────

  private normalizeCategoryList(raw: unknown): Category[] {
    if (!Array.isArray(raw)) return [];

    return raw
      .map(item => this.normalizeCategory(item))
      .filter((cat): cat is Category => cat !== null)
      .filter(cat => cat.count > 0); // Only include categories with locations
  }

  private normalizeCategory(item: unknown): Category | null {
    if (!item || typeof item !== 'object') return null;

    const obj = item as Record<string, unknown>;
    const type = obj.category || obj.type;
    const count = obj.count || 0;

    if (typeof type !== 'string' || typeof count !== 'number') return null;

    return {
      type: type as LocationType,
      label: this.formatCategoryLabel(type),
      count,
    };
  }

  private formatCategoryLabel(type: string): string {
    const acronyms = new Set(['ATM']);
    if (acronyms.has(type)) return type;

    return type
      .replace(/_/g, ' ')
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  }
}

/**
 * Export singleton instance
 */
export const mapCategoryService = MapCategoryService.getInstance();
