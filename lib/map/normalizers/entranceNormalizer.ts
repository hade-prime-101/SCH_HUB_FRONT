/**
 * Entrance normalization — converts API responses into normalized Entrance objects
 * 
 * Entrances are typically GeoJSON Point features from:
 * - GET /campus-map/features/{id}/entrances (FeatureCollection)
 * - Admin: GET /super-admin/map/schools/{schoolId}/entrances
 */

import { Entrance, EntranceKind } from '../types/entrance';
import { GeoJSONFeature } from '../types/geojson';

export interface RawEntranceData extends Record<string, unknown> {
  id?: string;
  _id?: string;
  name?: string;
  kind?: string;
  tag?: string;
  type?: string;
  isAccessible?: boolean;
  accessible?: boolean;
  latitude?: number;
  lat?: number;
  longitude?: number;
  lng?: number;
  description?: string;
  metadata?: Record<string, unknown>;
  geometry?: unknown;
  properties?: Record<string, unknown>;
  accessibility?: Record<string, unknown>;
  openingHours?: string;
  contactInfo?: string;
  notes?: string;
}

/**
 * Normalize a raw entrance object or GeoJSON Feature into a standardized Entrance
 * 
 * Entrances must always have coordinates (they represent points of entry)
 * If coordinates are missing, returns null
 */
export function normalizeEntrance(raw: RawEntranceData | GeoJSONFeature): Entrance | null {
  if (!raw) return null;

  // Extract ID (optional but helpful)
  const id = extractId(raw) || generateId();

  // Extract name
  const name = extractName(raw);
  if (!name) return null;

  // Extract coordinates (required for entrance)
  const coords = extractEntranceCoordinates(raw);
  if (!coords) return null;

  const [lng, lat] = coords;

  // Extract entrance kind/type
  const kind = extractEntranceKind(raw);

  // Extract accessibility info
  const isAccessible = extractIsAccessible(raw);
  const accessibility = extractAccessibility(raw);

  // Extract optional fields
  const description = extractDescription(raw);
  const metadata = extractMetadata(raw);

  return {
    id,
    name,
    kind,
    isAccessible,
    accessibility,
    latitude: lat,
    longitude: lng,
    description: description || undefined,
    metadata,
  };
}

/**
 * Normalize an array of raw entrances
 */
export function normalizeEntrances(raws: (RawEntranceData | GeoJSONFeature)[]): Entrance[] {
  return raws
    .map(raw => normalizeEntrance(raw))
    .filter((entrance): entrance is Entrance => entrance !== null);
}

/**
 * Create fallback entrances from location tags when backend doesn't provide explicit entrance data
 * 
 * Example: if a building has tags ["MAIN", "ACCESSIBLE"], create entrance objects from those
 * This is a temporary workaround; proper entrance data should come from backend
 */
export function createFallbackEntrances(locationName: string, locationId: string, tags?: string[]): Entrance[] {
  if (!tags || tags.length === 0) {
    // If no tags, create a single generic entrance
    return [
      {
        id: `${locationId}-entrance-main`,
        name: `${locationName} Entrance`,
        kind: 'MAIN',
        latitude: 0, // Placeholder — should not be used for navigation
        longitude: 0,
      },
    ];
  }

  return tags
    .filter(tag => typeof tag === 'string' && tag.trim())
    .map((tag, index) => {
      const entrance: Entrance = {
        id: `${locationId}-entrance-${index}`,
        name: `${tag.replace(/_/g, ' ')} Entrance`,
        kind: normalizeEntranceKindFromTag(tag) || 'OTHER',
        isAccessible: /accessible|wheelchair|disabled/i.test(tag),
        latitude: 0, // Placeholder
        longitude: 0,
      };
      return entrance;
    });
}

// ─── Extraction helpers ────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function extractId(raw: any): string | null {
  const id = raw.id || raw._id || raw.properties?.id;
  return typeof id === 'string' && id.trim() ? id : null;
}

function generateId(): string {
  return `entrance-${crypto.randomUUID()}`;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function extractName(raw: any): string | null {
  const name = raw.name || raw.properties?.name;
  if (typeof name === 'string' && name.trim()) return name.trim();

  // Fallback to properties.kind or tag
  const kind = raw.kind || raw.tag || raw.properties?.kind || raw.properties?.tag;
  if (typeof kind === 'string' && kind.trim()) {
    return `${kind.replace(/_/g, ' ')} Entrance`;
  }

  return null;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function extractEntranceCoordinates(raw: any): [number, number] | null {
  // GeoJSON Point geometry
  if (raw.geometry?.type === 'Point' && Array.isArray(raw.geometry.coordinates)) {
    const [lng, lat] = raw.geometry.coordinates;
    if (typeof lng === 'number' && typeof lat === 'number') {
      return [lng, lat];
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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function extractEntranceKind(raw: any): EntranceKind | undefined {
  const kind = raw.kind || raw.tag || raw.type || raw.properties?.kind || raw.properties?.tag;
  return normalizeEntranceKindFromTag(kind);
}

function normalizeEntranceKindFromTag(tag: unknown): EntranceKind | undefined {
  if (typeof tag !== 'string') return undefined;

  const normalized = tag.toUpperCase();
  const validKinds: EntranceKind[] = ['MAIN', 'SIDE', 'SERVICE', 'ACCESSIBLE', 'EMERGENCY', 'OTHER'];

  if (validKinds.includes(normalized as EntranceKind)) {
    return normalized as EntranceKind;
  }

  // Heuristic: if it contains certain keywords, map to appropriate kind
  if (/main|primary/i.test(tag)) return 'MAIN';
  if (/side|secondary/i.test(tag)) return 'SIDE';
  if (/service|delivery|loading/i.test(tag)) return 'SERVICE';
  if (/accessible|wheelchair|disabled/i.test(tag)) return 'ACCESSIBLE';
  if (/emergency|evacuation/i.test(tag)) return 'EMERGENCY';

  return undefined;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function extractIsAccessible(raw: any): boolean | undefined {
  const accessible = raw.isAccessible ?? raw.accessible ?? raw.properties?.isAccessible;

  if (typeof accessible === 'boolean') return accessible;

  // Check accessibility object
  const a11y = raw.accessibility || raw.properties?.accessibility;
  if (typeof a11y === 'object' && a11y !== null) {
    return Boolean(a11y.wheelchair || a11y.visual || a11y.hearing || a11y.mobility);
  }

  return undefined;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function extractAccessibility(raw: any): Entrance['accessibility'] | undefined {
  const a11y = raw.accessibility || raw.properties?.accessibility;

  if (typeof a11y === 'object' && a11y !== null) {
    return {
      wheelchair: Boolean(a11y.wheelchair),
      visual: Boolean(a11y.visual),
      hearing: Boolean(a11y.hearing),
      mobility: Boolean(a11y.mobility),
    };
  }

  return undefined;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function extractDescription(raw: any): string | null {
  const desc = raw.description || raw.properties?.description;
  return typeof desc === 'string' ? desc.trim() || null : null;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function extractMetadata(raw: any): Entrance['metadata'] | undefined {
  const metadata: Entrance['metadata'] = {};

  const openingHours = raw.openingHours || raw.properties?.openingHours;
  if (typeof openingHours === 'string') metadata.openingHours = openingHours;

  const contactInfo = raw.contactInfo || raw.properties?.contactInfo;
  if (typeof contactInfo === 'string') metadata.contactInfo = contactInfo;

  const notes = raw.notes || raw.properties?.notes;
  if (typeof notes === 'string') metadata.notes = notes;

  // Merge existing metadata object
  const existing = raw.metadata || raw.properties?.metadata;
  if (typeof existing === 'object' && existing !== null) {
    Object.assign(metadata, existing);
  }

  return Object.keys(metadata).length > 0 ? metadata : undefined;
}
