/**
 * Location normalization — converts API responses into normalized Location objects
 * 
 * Handles multiple response shapes:
 * 1. GeoJSON Feature (from /campus-map/features/{id})
 * 2. Flat object (from /campus-map/search results)
 * 3. Nested properties (from /campus-map/nearest)
 */

import { Location, LocationType, isValidLocationType } from '../types/location';
import { GeoJSONFeature, extractCoordinates, calculateCentroid } from '../types/geojson';

export interface RawLocationData extends Record<string, unknown> {
  id?: string;
  _id?: string;
  name?: string;
  type?: string;
  category?: string;
  description?: string;
  latitude?: number;
  lat?: number;
  longitude?: number;
  lng?: number;
  images?: string[];
  imageUrl?: string;
  tags?: string[];
  distanceMeters?: number;
  geometry?: unknown;
  properties?: Record<string, unknown>;
  centroid?: unknown;
  floor?: string;
  capacity?: number;
  isOpen?: boolean;
  metadata?: Record<string, unknown>;
}

/**
 * Normalize a raw location object or GeoJSON Feature into a standardized Location
 * 
 * Priority order for coordinate extraction:
 * 1. GeoJSON geometry (Point)
 * 2. GeoJSON geometry centroid (for Polygon/MultiPolygon)
 * 3. Top-level latitude/longitude or lat/lng
 * 4. properties.latitude/longitude
 * 5. Return null if no coordinates available
 * 
 * Priority order for location type:
 * 1. category (most common in API)
 * 2. type
 * 3. properties.category
 * 4. properties.type
 * 5. Defaults to "OTHER"
 */
export function normalizeLocation(raw: RawLocationData | GeoJSONFeature): Location | null {
  if (!raw) return null;

  // Extract ID
  const id = extractId(raw);
  if (!id) return null;

  // Extract name
  const name = extractName(raw);
  if (!name) return null;

  // Extract location type
  const type = extractLocationType(raw);

  // Extract coordinates
  const coords = extractLocationCoordinates(raw);
  if (!coords) return null;

  const [lng, lat] = coords;

  // Extract optional fields
  const description = extractDescription(raw);
  const images = extractImages(raw);
  const tags = extractTags(raw);
  const distanceM = extractDistance(raw);
  const floor = extractFloor(raw);
  const capacity = extractCapacity(raw);
  const isOpen = extractIsOpen(raw);
  const metadata = extractMetadata(raw);

  // Extract geometry for map rendering
  const geometry = extractGeometry(raw);

  return {
    id,
    name,
    type,
    description: description || null,
    tags,
    latitude: lat,
    longitude: lng,
    geometry,
    images,
    imageUrl: images?.[0] || null,
    distanceM: distanceM || null,
    floor: floor || null,
    capacity,
    isOpen,
    metadata,
  };
}

/**
 * Normalize an array of raw locations
 */
export function normalizeLocations(raws: RawLocationData[] | GeoJSONFeature[]): Location[] {
  return raws
    .map(raw => normalizeLocation(raw))
    .filter((loc): loc is Location => loc !== null);
}

// ─── Extraction helpers ────────────────────────────────────────────────────────

function extractId(raw: any): string | null {
  const id = raw.id || raw._id || raw.properties?.id;
  return typeof id === 'string' && id.trim() ? id : null;
}

function extractName(raw: any): string | null {
  const name = raw.name || raw.properties?.name;
  return typeof name === 'string' && name.trim() ? name.trim() : null;
}

function extractLocationType(raw: any): LocationType {
  const candidates = [
    raw.category,
    raw.type,
    raw.properties?.category,
    raw.properties?.type,
  ];

  for (const candidate of candidates) {
    if (isValidLocationType(candidate)) return candidate;
  }

  return 'OTHER';
}

function extractLocationCoordinates(raw: any): [number, number] | null {
  // GeoJSON Feature with geometry
  if (raw.geometry) {
    // Point geometry
    if (raw.geometry.type === 'Point' && Array.isArray(raw.geometry.coordinates)) {
      const [lng, lat] = raw.geometry.coordinates;
      if (typeof lng === 'number' && typeof lat === 'number') {
        return [lng, lat];
      }
    }

    // Non-Point geometry: use centroid
    if (raw.geometry.type !== 'Point' && raw.geometry.coordinates) {
      const centroidCoords = raw.properties?.centroid?.coordinates || raw.centroid?.coordinates;
      if (Array.isArray(centroidCoords)) {
        const [lng, lat] = centroidCoords;
        if (typeof lng === 'number' && typeof lat === 'number') {
          return [lng, lat];
        }
      }

      // Fallback: calculate centroid
      const calculated = calculateCentroid(raw.geometry);
      if (calculated) return calculated;
    }
  }

  // Top-level coordinates
  const lat = typeof raw.latitude === 'number' ? raw.latitude : typeof raw.lat === 'number' ? raw.lat : null;
  const lng = typeof raw.longitude === 'number' ? raw.longitude : typeof raw.lng === 'number' ? raw.lng : null;

  if (typeof lat === 'number' && typeof lng === 'number') {
    return [lng, lat];
  }

  // Properties coordinates
  const propLat = typeof raw.properties?.latitude === 'number' ? raw.properties.latitude : null;
  const propLng = typeof raw.properties?.longitude === 'number' ? raw.properties.longitude : null;

  if (typeof propLat === 'number' && typeof propLng === 'number') {
    return [propLng, propLat];
  }

  return null;
}

function extractDescription(raw: any): string | null {
  const desc = raw.description || raw.properties?.description;
  return typeof desc === 'string' ? desc.trim() || null : null;
}

function extractImages(raw: any): string[] | undefined {
  const images = raw.images || raw.properties?.images;
  if (Array.isArray(images)) {
    return images.filter((img): img is string => typeof img === 'string');
  }
  return undefined;
}

function extractTags(raw: any): string[] | undefined {
  const tags = raw.tags || raw.properties?.tags;
  if (Array.isArray(tags)) {
    return tags.filter((tag): tag is string => typeof tag === 'string');
  }
  return undefined;
}

function extractDistance(raw: any): number | null {
  const dist = raw.distanceMeters || raw.distance;
  return typeof dist === 'number' ? dist : null;
}

function extractFloor(raw: any): string | null {
  const floor = raw.floor || raw.properties?.floor;
  return typeof floor === 'string' ? floor.trim() || null : null;
}

function extractCapacity(raw: any): number | undefined {
  const capacity = raw.capacity || raw.properties?.capacity;
  return typeof capacity === 'number' ? capacity : undefined;
}

function extractIsOpen(raw: any): boolean | undefined {
  const isOpen = raw.isOpen || raw.properties?.isOpen;
  return typeof isOpen === 'boolean' ? isOpen : undefined;
}

function extractMetadata(raw: any): Record<string, unknown> | undefined {
  const metadata = raw.metadata || raw.properties?.metadata;
  return typeof metadata === 'object' && metadata !== null ? metadata : undefined;
}

function extractGeometry(raw: any): Location['geometry'] | undefined {
  if (!raw.geometry || typeof raw.geometry !== 'object') return undefined;

  const { type, coordinates } = raw.geometry;
  if (!type || !coordinates) return undefined;

  // Only preserve geometries we can render
  if (['Point', 'Polygon', 'MultiPolygon', 'LineString'].includes(type)) {
    return { type, coordinates };
  }

  return undefined;
}
