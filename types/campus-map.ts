// types/campus-map.ts

export interface MapFeature {
  id: string;
  type: 'Feature';
  geometry: {
    type: 'Point' | 'Polygon' | 'LineString';
    coordinates: number[] | number[][] | number[][][];
  };
  properties: {
    name: string;
    category: string;
    description?: string;
    building?: string;
    floor?: string;
    entranceId?: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    [key: string]: any;
  };
}

export interface MapLocation {
  id: string;
  name: string;
  type: string;          // e.g. 'cafe', 'library', 'classroom'
  description?: string;
  lat: number;
  lng: number;
  schoolId: string;
}

export interface CreateMapLocationPayload {
  name: string;
  type: string;
  description?: string;
  lat: number;
  lng: number;
}

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface UpdateMapLocationPayload extends Partial<CreateMapLocationPayload> {}

export interface RouteRequestPayload {
  waypoints: { lat: number; lng: number }[];
  profile?: 'foot' | 'bike' | 'car';
}

export interface RouteResponse {
  geometry: {
    coordinates: [number, number][];
  };
  distance: number;
  duration: number;
}

export interface RouteProgressInput {
  currentPosition: { lat: number; lng: number };
  routeGeometry: { coordinates: [number, number][] };
}

export interface RouteProgressResult {
  remainingDistance: number;
  remainingDuration: number;
  nextTurnInstruction?: string;
}

export interface SearchParams {
  q: string;
  category?: string;
  near?: string;   // "lat,lng"
  limit?: number;
}

export interface NearestParams {
  lat: number;
  lng: number;
  category?: string;
  limit?: number;
}