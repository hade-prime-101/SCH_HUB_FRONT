/**
 * Map services — data layer for campus map feature
 * 
 * All services are singletons with:
 * - Request deduplication (multiple identical requests share one promise)
 * - Intelligent caching with TTL
 * - Normalization of API responses
 * - Error handling with descriptive codes
 */

export * from './baseService';
export * from './MapLocationService';
export * from './MapEntranceService';
export * from './MapRoutingService';
export * from './MapCategoryService';
export * from './MapConfigService';

// Re-export commonly used singletons for convenience
export { mapLocationService } from './MapLocationService';
export { mapEntranceService } from './MapEntranceService';
export { mapRoutingService } from './MapRoutingService';
export { mapCategoryService } from './MapCategoryService';
export { mapConfigService } from './MapConfigService';
