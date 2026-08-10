/**
 * Zustand store for campus map state management
 * 
 * Combines all state slices:
 * - Map view (camera, zoom, pitch)
 * - Locations (features, filtering, search)
 * - Routes (navigation, progress)
 * - UI (panels, modals, modes)
 * - User (location, permissions, tracking)
 */

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { MapCamera, MapViewMode, MapLayerSettings } from '../types/map';
import { Location, LocationType } from '../types/location';
import { Entrance } from '../types/entrance';
import { Route, RouteProgress, NavigationMode } from '../types/route';
import { createMapSlice, MapState, MapActions } from './slices/mapSlice';
import { createLocationsSlice, LocationsState, LocationsActions } from './slices/locationsSlice';
import { createRouteSlice, RouteState, RouteActions } from './slices/routeSlice';
import { createUISlice, UIState, UIActions } from './slices/uiSlice';
import { createUserSlice, UserState, UserActions } from './slices/userSlice';

/**
 * Combined store type — union of all state and action slices
 */
export type MapStore = MapState &
  MapActions &
  LocationsState &
  LocationsActions &
  RouteState &
  RouteActions &
  UIState &
  UIActions &
  UserState &
  UserActions;

/**
 * Default map camera
 */
const DEFAULT_CAMERA: MapCamera = {
  center: [4.5399, 7.3775], // Nigeria default
  zoom: 16,
  pitch: 45,
  bearing: -10,
};

/**
 * Create the store with all slices
 */
export const useMapStore = create<MapStore>()(
  devtools(
    (set, get, store) => ({
      // Map slice
      ...createMapSlice(DEFAULT_CAMERA)(set),

      // Locations slice
      ...createLocationsSlice()(set),

      // Route slice
      ...createRouteSlice()(set),

      // UI slice — needs both set and get
      ...createUISlice()(set, get),

      // User slice
      ...createUserSlice()(set),
    }),
    {
      name: 'map-store',
    },
  ),
);

/**
 * Convenience selectors for common use cases
 */

/** Select all map data that needs to render */
export const useMapRenderData = () =>
  useMapStore(state => ({
    camera: state.camera,
    locations: state.filteredLocations,
    selectedLocation: state.selectedLocation,
    userLocation: state.position,
    currentRoute: state.currentRoute,
    showLocations: state.layerSettings.showLocations,
    showRoute: state.layerSettings.showRoute,
    showUserLocation: state.layerSettings.showUserLocation,
    isNavigating: state.isNavigating,
  }));

/** Select search/filter state */
export const useMapSearch = () =>
  useMapStore(state => ({
    query: state.searchQuery,
    filter: state.activeFilter,
    results: state.filteredLocations,
    isLoading: state.isLoading,
    error: state.error,
  }));

/** Select navigation state */
export const useMapNavigation = () =>
  useMapStore(state => ({
    route: state.currentRoute,
    isNavigating: state.isNavigating,
    progress: state.routeProgress,
    mode: state.navigationMode,
    error: state.navigationError,
    currentStep: state.currentStepIndex,
  }));

/** Select location panel state */
export const useLocationPanel = () =>
  useMapStore(state => ({
    location: state.selectedLocation,
    entrance: state.selectedEntrance,
    showPanel: state.showLocationPanel,
    setLocation: state.setSelectedLocation,
    setEntrance: state.setSelectedEntrance,
    setShow: state.setShowLocationPanel,
  }));

/** Select UI state */
export const useMapUI = () =>
  useMapStore(state => ({
    viewMode: state.viewMode,
    isCompactMode: state.isCompactMode,
    showLocationPanel: state.showLocationPanel,
    showNavigationPanel: state.showNavigationPanel,
    panelHeight: state.panelHeight,
    layerSettings: state.layerSettings,
  }));

/** Select user location state */
export const useUserLocation = () =>
  useMapStore(state => ({
    position: state.position,
    accuracy: state.accuracy,
    heading: state.heading,
    speed: state.speed,
    isTracking: state.isTracking,
    isFollowing: state.isFollowing,
    permissionState: state.permissionState,
    isRequesting: state.isRequesting,
    error: state.trackingError,
  }));
