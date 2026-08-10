/**
 * Campus Map Module — Complete feature for interactive campus navigation
 * 
 * This module provides:
 * - Type definitions (Location, Entrance, Route, etc.)
 * - Data normalization (convert API responses to internal types)
 * - Service layer (business logic: search, routing, location management)
 * - State management (Zustand store with slices)
 * - Configuration (categories, styles, colors)
 * - Utilities (distance, bounds, geometry calculations)
 * 
 * Architecture is designed for:
 * - Testability (pure functions, services with clear interfaces)
 * - Extensibility (ready for indoor maps, accessibility routing, real-time updates)
 * - Performance (caching, deduplication, selective rendering)
 * - Maintainability (clear separation of concerns)
 */

// Types
export * from './types';

// Normalizers
export * from './normalizers';

// Services
export * from './services';

// State
export * from './state';

// Configuration
export * from './config';

// Utilities
export * from './utils';
