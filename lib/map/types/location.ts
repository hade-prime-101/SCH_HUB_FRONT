/**
 * Location types — represents a campus location (building, hostel, POI, etc.)
 * Normalized from backend GeoJSON responses
 */

export type LocationType =
  | 'BUILDING'
  | 'HOSTEL'
  | 'CAFETERIA'
  | 'LIBRARY'
  | 'CLINIC'
  | 'SPORTS'
  | 'GATE'
  | 'PARKING'
  | 'OFFICE'
  | 'LAB'
  | 'LECTURE_HALL'
  | 'ATM'
  | 'SHUTTLE_STOP'
  | 'LANDMARK'
  | 'ROAD'
  | 'PATH'
  | 'OTHER'
  | 'UNKNOWN';

export const LOCATION_TYPES: LocationType[] = [
  'BUILDING',
  'HOSTEL',
  'CAFETERIA',
  'LIBRARY',
  'CLINIC',
  'SPORTS',
  'GATE',
  'PARKING',
  'OFFICE',
  'LAB',
  'LECTURE_HALL',
  'ATM',
  'SHUTTLE_STOP',
  'LANDMARK',
  'ROAD',
  'PATH',
  'OTHER',
  'UNKNOWN',
];

/**
 * Normalized location object — what the frontend works with internally
 * 
 * Key design decisions:
 * - latitude/longitude always present (validated, or calculated from geometry centroid)
 * - images is an array (frontend can support multiple images in future)
 * - distanceM is optional and may be server-computed or client-calculated
 * - geometry is preserved for map rendering (building footprints, etc.)
 * - tags allow flexible metadata without schema changes
 */
export interface Location {
  // Identity
  id: string;
  name: string;
  type: LocationType;

  // Description
  description?: string | null;
  tags?: string[];

  // Geometry & coordinates
  latitude: number;
  longitude: number;
  geometry?: {
    type: 'Point' | 'Polygon' | 'MultiPolygon' | 'LineString';
    coordinates: unknown; // Raw GeoJSON coordinates
  };

  // Media
  images?: string[];
  imageUrl?: string | null; // Primary/cover image (for backward compat)

  // Computed fields
  distanceM?: number | null; // From user location
  floor?: string | null; // For indoor map support (future)
  capacity?: number; // For venues/halls
  isOpen?: boolean; // For facilities with hours
  metadata?: Record<string, unknown>; // Extensible data
}

/**
 * Location for map rendering — subset of Location with guaranteed coordinates
 */
export type MapLocation = Location & {
  latitude: number;
  longitude: number;
  id: string;
  name: string;
};

/**
 * Type guard: check if Location can be rendered on map
 */
export function isMapLocation(location: Location): location is MapLocation {
  return (
    typeof location.latitude === 'number' &&
    typeof location.longitude === 'number' &&
    Boolean(location.id && location.name)
  );
}

/**
 * Type guard for location type
 */
export function isValidLocationType(value: unknown): value is LocationType {
  return typeof value === 'string' && LOCATION_TYPES.includes(value as LocationType);
}

/**
 * Format location type for display: "LECTURE_HALL" → "Lecture Hall"
 */
export function formatLocationType(type: LocationType): string {
  const acronyms = new Set(['ATM']);
  if (acronyms.has(type)) return type;
  return type
    .replace(/_/g, ' ')
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}
