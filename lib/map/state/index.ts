/**
 * Map state management — Zustand store with slices
 * 
 * Export all state slices, types, and the main store
 */

export * from './slices/mapSlice';
export * from './slices/locationsSlice';
export * from './slices/routeSlice';
export * from './slices/uiSlice';
export * from './slices/userSlice';

export {
  useMapStore,
  useMapRenderData,
  useMapSearch,
  useMapNavigation,
  useLocationPanel,
  useMapUI,
  useUserLocation,
  type MapStore,
} from './store';
