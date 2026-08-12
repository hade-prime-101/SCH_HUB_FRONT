// lib/campus-map.api.ts

import { apiGet, apiPost, apiPatch, apiDelete } from '@/lib/api';
import type {
  MapFeature,
  MapLocation,
  CreateMapLocationPayload,
  UpdateMapLocationPayload,
  RouteRequestPayload,
  RouteResponse,
  RouteProgressResult,
  SearchParams,
  NearestParams,
} from '@/types/campus-map';

// ─── Features & Search ───────────────────────────────────────
export const listFeatures = (params?: { bbox?: string; category?: string; limit?: number }) =>
  apiGet<MapFeature[]>('/campus-map/features', params as any);

export const getFeatures = listFeatures; // Alias for backward compatibility

export const getFeature = (id: string) =>
  apiGet<MapFeature>(`/campus-map/features/${id}`);

export const getFeatureEntrances = (id: string) =>
  apiGet<MapFeature[]>(`/campus-map/features/${id}/entrances`);

export const searchFeatures = (params: SearchParams) =>
  apiGet<MapFeature[]>('/campus-map/search', params as any);

export const search = searchFeatures; // Alias for backward compatibility

export const nearestFeatures = (params: NearestParams) =>
  apiGet<MapFeature[]>('/campus-map/nearest', params as any);

export const getNearest = (lat: number, lng: number, category?: string) =>
  nearestFeatures({ lat, lng, category });

// ─── Routing ─────────────────────────────────────────────────
export const calculateRoute = (payload: RouteRequestPayload) =>
  apiPost<RouteResponse>('/campus-map/route', payload);

export const calculateSimpleRoute = (params: {
  fromLat: number;
  fromLng: number;
  toLat: number;
  toLng: number;
  profile?: 'foot' | 'bike' | 'car';
}) => apiGet<RouteResponse>('/campus-map/simple-route', params as any);

export const getRouteProgress = (payload: { currentPosition: { lat: number; lng: number }; routeGeometry: { coordinates: [number, number][] } }) =>
  apiPost<RouteProgressResult>('/campus-map/route/progress', payload);

// ─── Categories ──────────────────────────────────────────────
export const getCategories = () => apiGet<string[]>('/campus-map/categories');

// ─── Map Config ──────────────────────────────────────────────
export const getMapConfig = () => apiGet<{ maptilerApiKey: string | null }>('/campus-map/config');

export const getTilesMetadata = () => apiGet<any>('/campus-map/tiles/metadata');

// ─── Map Locations (custom POIs) ─────────────────────────────
export const listMapLocations = (type?: string, search?: string) =>
  apiGet<MapLocation[]>('/campus-map/locations', { type, search } as any);

export const getMapLocation = (id: string) => apiGet<MapLocation>(`/campus-map/locations/${id}`);

export const createMapLocation = (payload: CreateMapLocationPayload) =>
  apiPost<MapLocation>('/campus-map/locations', payload);

export const updateMapLocation = (id: string, payload: UpdateMapLocationPayload) =>
  apiPatch<MapLocation>(`/campus-map/locations/${id}`, payload);

export const deleteMapLocation = (id: string) =>
  apiDelete<{ message: string }>(`/campus-map/locations/${id}`);

// Bulk update (already had signature; ensure it exists)
export const bulkUpdateMapLocations = (payload: { locations: UpdateMapLocationPayload[] }) =>
  apiPatch<{ modified: number }>('/campus-map/locations/bulk', payload);

export const campusMap = {
   listFeatures,
   getFeatures,
   getFeature,
   getFeatureEntrances,
   searchFeatures,
   search,
   nearestFeatures,
   getNearest,

   calculateRoute,
   calculateSimpleRoute,
   getRouteProgress,
   getCategories,
   getMapConfig,
   getTilesMetadata,
   
   listMapLocations,
   getMapLocation,
   createMapLocation,
   deleteMapLocation,
   updateMapLocation,

   bulkUpdateMapLocations
}