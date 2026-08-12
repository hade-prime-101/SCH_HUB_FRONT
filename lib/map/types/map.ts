/**
 * Map state and configuration types
 */

export type MapViewMode = 'map' | 'list' | 'navigate';

export interface MapCamera {
  center: [lng: number, lat: number];
  zoom: number;
  pitch: number;
  bearing: number;
}

export interface MapBounds {
  north: number;
  south: number;
  east: number;
  west: number;
}

/**
 * Map configuration (tiles, style, API keys)
 */
export interface MapConfig {
  maptilerApiKey?: string | null;
  defaultCenter: [lng: number, lat: number];
  defaultZoom: number;
  defaultPitch: number;
  defaultBearing: number;
  minZoom: number;
  maxZoom: number;
}

/**
 * Map layer visibility settings
 */
export interface MapLayerSettings {
  showLocations: boolean;
  showEntrances: boolean;
  showRoute: boolean;
  showUserLocation: boolean;
  showBuildings3D: boolean;
  showRoads: boolean;
  showPathways: boolean;
  showLabels: boolean;
  locationCategoryFilter?: string; // "ALL" or specific category
}

/**
 * User location tracking state
 */
export interface UserLocationState {
  position: { lat: number; lng: number } | null;
  accuracy: number | null;
  heading?: number; // compass direction
  speed?: number;
  timestamp: Date | null;
  isTracking: boolean;
  isFollowing: boolean; // camera follows user?
}

export type LocationPermissionState = 'unknown' | 'prompt' | 'granted' | 'denied';

export interface LocationPermission {
  state: LocationPermissionState;
  deniedReason?: string;
}
