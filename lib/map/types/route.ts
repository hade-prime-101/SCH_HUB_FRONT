/**
 * Route and navigation types
 */

import { GeoJSONLineString, GeoJSONFeature } from './geojson';

export type RoutingMode = 'walking' | 'driving' | 'cycling';
export type NavigationMode = 'overview' | 'turn-by-turn' | 'live';

export interface RouteRequest {
  from: { lat: number; lng: number };
  to: { lat: number; lng: number; featureId?: string };
  mode?: RoutingMode;
}

export interface RouteStep {
  instruction: string;
  distance: number; // meters
  duration: number; // seconds
  geometry: GeoJSONLineString;
  turnType?: 'left' | 'right' | 'straight' | 'sharp-left' | 'sharp-right' | 'u-turn';
  maneuver?: string;
}

export interface Route {
  // Identity
  id: string;
  createdAt: Date;

  // Endpoints
  origin: { lat: number; lng: number; name?: string };
  destination: { lat: number; lng: number; name?: string };

  // Route geometry
  geometry: GeoJSONLineString;
  distance: number; // meters
  duration: number; // seconds

  // Steps and turn-by-turn
  steps?: RouteStep[];
  waypoints?: Array<{ lat: number; lng: number }>;

  // Metadata
  mode: RoutingMode;
  summary?: string;
  alternatives?: Route[];
}

/**
 * Route progress during navigation
 */
export interface RouteProgress {
  routeId: string;
  currentLocation: { lat: number; lng: number };
  distanceAlongRoute: number; // meters
  distanceToEnd: number; // meters
  durationToEnd: number; // seconds
  currentStep?: number;
  onRoute: boolean;
  deviationDistance?: number; // off-route threshold exceeded
  accuracy: number; // GPS accuracy in meters
}

/**
 * Navigation state
 */
export interface NavigationState {
  route: Route | null;
  isActive: boolean;
  mode: NavigationMode;
  progress: RouteProgress | null;
  currentStepIndex: number;
  startedAt: Date | null;
  paused: boolean;
}

/**
 * Calculate ETA (Estimated Time of Arrival)
 */
export function calculateETA(route: Route, startTime: Date = new Date()): Date {
  return new Date(startTime.getTime() + route.duration * 1000);
}
