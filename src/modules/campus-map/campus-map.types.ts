export type CampusFeatureCategory =
  | 'BUILDING'
  | 'HOSTEL'
  | 'LECTURE_HALL'
  | 'LIBRARY'
  | 'CLINIC'
  | 'CAFETERIA'
  | 'ATM'
  | 'SPORTS'
  | 'SHUTTLE_STOP'
  | 'GATE'
  | 'PARKING'
  | 'LANDMARK'
  | 'OFFICE'
  | 'LAB'
  | 'ROAD'
  | 'PATH'
  | 'OTHER';

export type CampusEntranceKind = 'MAIN' | 'ACCESSIBLE' | 'SERVICE' | 'EMERGENCY' | 'SECONDARY';
export type CampusRouteMode = 'walking' | 'accessible';

export type GeoJsonPosition = [number, number] | [number, number, number];

export type GeoJsonPoint = {
  type: 'Point';
  coordinates: GeoJsonPosition;
};

export type GeoJsonLineString = {
  type: 'LineString';
  coordinates: GeoJsonPosition[];
};

export type GeoJsonGeometry = GeoJsonPoint | GeoJsonLineString | {
  type: string;
  coordinates: unknown;
};

export type GeoJsonFeature<G extends GeoJsonGeometry = GeoJsonGeometry, P = Record<string, unknown>> = {
  type: 'Feature';
  id?: string | number;
  geometry: G;
  properties: P;
};

export type GeoJsonFeatureCollection<G extends GeoJsonGeometry = GeoJsonGeometry, P = Record<string, unknown>> = {
  type: 'FeatureCollection';
  features: Array<GeoJsonFeature<G, P>>;
};

export type LngLat = {
  lng: number;
  lat: number;
};

export type CampusFeatureRow = {
  id: string;
  schoolId: string;
  category: CampusFeatureCategory;
  name: string;
  description: string | null;
  aliases: unknown;
  tags: unknown;
  metadata: unknown;
  images: unknown;
  routing: unknown;
  accessibility: unknown;
  importance: number;
  geometry: string;
  centroid: string | null;  // nullable — features imported before ST_Centroid fix may have null
};

export type CampusEntranceRow = {
  id: string;
  schoolId: string;
  featureId: string | null;
  kind: CampusEntranceKind;
  name: string | null;
  priority: number;
  isAccessible: boolean;
  metadata: unknown;
  geometry: string;
};

export type RouteNode = {
  id: string;
  lng: number;
  lat: number;
};

export type RouteEdge = {
  id: string;
  fromNodeId: string;
  toNodeId: string;
  distanceMeters: number;
  isAccessible: boolean;
  geometry: string;
  metadata: unknown;
};

export type RouteStep = {
  instruction: string;
  distanceMeters: number;
  geometry: GeoJsonLineString;
};
