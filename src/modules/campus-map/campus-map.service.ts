import crypto from 'node:crypto';
import path from 'node:path';
import { AppError } from '@/utils/response.js';
import { r2 } from '@/config/r2.js';
import { env } from '@/config/env.js';
import { campusMapRepository } from './campus-map.repository.js';
import type {
  CampusEntranceRow,
  CampusFeatureRow,
  GeoJsonFeature,
  GeoJsonGeometry,
  GeoJsonLineString,
  GeoJsonPoint,
  LngLat,
} from './campus-map.types.js';
import { campusGraphService } from './routing/graph.service.js';
import { routeProgress } from './routing/offroute.service.js';
import { campusSearchService } from './search/index.service.js';

// ── CWE-918: Input Validation Constants ──────────────────────────────────

/**
 * Valid travel modes — strict allowlist prevents injection of
 * arbitrary mode strings into internal routing service requests.
 */
const ALLOWED_MODES = new Set(['walking', 'accessible'] as const);
type TravelMode = 'walking' | 'accessible';

/**
 * Geographic coordinate bounds — rejects obviously invalid or
 * crafted coordinates that could be used for SSRF probing.
 *
 * Valid ranges:
 *   Latitude  : -90  to  90
 *   Longitude : -180 to 180
 */
const GEO_BOUNDS = {
  LAT_MIN : -90,
  LAT_MAX :  90,
  LNG_MIN : -180,
  LNG_MAX :  180,
} as const;

/**
 * CUID regex — Prisma default ID format (e.g. cmsgdk49d0000mefpde2pxun9).
 * UUID regex kept for backward-compatibility with any legacy records.
 */
const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const CUID_REGEX = /^c[a-z0-9]{24,}$/i;

// ── CWE-918: Validators ───────────────────────────────────────────────────

/**
 * ✅ CWE-918: Validates a LngLat coordinate pair.
 *
 * Attack without validation:
 *   input.from = { lat: NaN, lng: Infinity }
 *   → Routing service constructs malformed internal URL
 *   → May cause SSRF or denial of service in downstream service
 *
 *   input.from = { lat: "169.254.169.254", lng: "../../admin" }
 *   → String injection into numeric fields
 *   → Could reach cloud metadata endpoint via routing service
 */
function validateLngLat(coord: unknown, fieldName: string): LngLat {
  if (
    typeof coord !== 'object' ||
    coord === null ||
    Array.isArray(coord)
  ) {
    throw new AppError(`Invalid ${fieldName}: must be an object`, 400);
  }

  const { lat, lng } = coord as Record<string, unknown>;

  if (typeof lat !== 'number' || typeof lng !== 'number') {
    throw new AppError(
      `Invalid ${fieldName}: lat and lng must be numbers`, 400
    );
  }

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    throw new AppError(
      `Invalid ${fieldName}: lat and lng must be finite numbers`, 400
    );
  }

  if (lat < GEO_BOUNDS.LAT_MIN || lat > GEO_BOUNDS.LAT_MAX) {
    throw new AppError(
      `Invalid ${fieldName}: lat must be between ${GEO_BOUNDS.LAT_MIN} and ${GEO_BOUNDS.LAT_MAX}`,
      400
    );
  }

  if (lng < GEO_BOUNDS.LNG_MIN || lng > GEO_BOUNDS.LNG_MAX) {
    throw new AppError(
      `Invalid ${fieldName}: lng must be between ${GEO_BOUNDS.LNG_MIN} and ${GEO_BOUNDS.LNG_MAX}`,
      400
    );
  }

  // Return plain validated object — strips any extra properties
  return { lat, lng };
}

/**
 * ✅ CWE-918: Validates travel mode against strict allowlist.
 *
 * Attack without validation:
 *   input.mode = "http://internal-service/admin"
 *   → Injected into routing service URL construction
 *   → May reach internal admin endpoints
 */
function validateMode(mode: unknown): TravelMode {
  if (typeof mode !== 'string' || !ALLOWED_MODES.has(mode as TravelMode)) {
    throw new AppError(
      `Invalid mode. Allowed values: ${[...ALLOWED_MODES].join(', ')}`,
      400
    );
  }
  return mode as TravelMode;
}

/**
 * ✅ CWE-918: Validates ID is a proper UUID v4.
 *
 * Attack without validation:
 *   featureId = "../../admin/secrets"
 *   → Injected into internal service URL path
 *   → Path traversal via routing service HTTP request
 */
function validateUuid(id: unknown, fieldName: string): string {
  if (typeof id !== 'string' || (!UUID_REGEX.test(id) && !CUID_REGEX.test(id))) {
    throw new AppError(`Invalid ${fieldName}: must be a valid ID`, 400);
  }
  return id;
}

// ── Utility Functions ─────────────────────────────────────────────────────

function parseArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === 'string')
    : [];
}

/** Inverts r2.upload's url→key mapping. Returns null for unrecognised origins. */
function urlToKey(url: string): string | null {
  if (url.startsWith('/uploads/')) {
    const key = url.slice('/uploads/'.length);
    return key.length > 0 && !key.includes('/') ? key : null;
  }
  if (env.SUPABASE_PUBLIC_URL) {
    const base = env.SUPABASE_PUBLIC_URL.replace(/\/$/, '');
    if (url.startsWith(base + '/')) {
      const key = url.slice(base.length + 1);
      return key.length > 0 && !key.includes('..') ? key : null;
    }
    return null;
  }
  return url.length > 0 && !url.includes('/') && !url.includes('..')
    ? url
    : null;
}

// ── Row Mappers ───────────────────────────────────────────────────────────

function toFeature(row: CampusFeatureRow): GeoJsonFeature {
  // centroid may be null for features imported before the ST_Centroid fix
  const centroidParsed = row.centroid ? JSON.parse(row.centroid) as GeoJsonGeometry : null;
  return {
    type     : 'Feature',
    id       : row.id,
    geometry : JSON.parse(row.geometry) as GeoJsonGeometry,
    properties: {
      id           : row.id,
      schoolId     : row.schoolId,
      category     : row.category,
      name         : row.name,
      description  : row.description,
      aliases      : parseArray(row.aliases),
      tags         : parseArray(row.tags),
      metadata     : row.metadata,
      images       : parseArray(row.images),
      routing      : row.routing,
      accessibility: row.accessibility,
      importance   : row.importance,
      centroid     : centroidParsed,
    },
  };
}

function toEntrance(row: CampusEntranceRow): GeoJsonFeature<GeoJsonPoint> {
  return {
    type     : 'Feature',
    id       : row.id,
    geometry : JSON.parse(row.geometry) as GeoJsonPoint,
    properties: {
      id          : row.id,
      schoolId    : row.schoolId,
      featureId   : row.featureId,
      kind        : row.kind,
      name        : row.name,
      priority    : row.priority,
      isAccessible: row.isAccessible,
      metadata    : row.metadata,
    },
  };
}

function pointFromFeature(feature: GeoJsonFeature): LngLat {
  if (feature.geometry.type === 'Point') {
    const [lng, lat] = feature.geometry.coordinates as [number, number];
    return { lng, lat };
  }
  // For Polygon/MultiPolygon, use the centroid computed by ST_Centroid on import
  const centroid = feature.properties?.centroid as GeoJsonPoint | null | undefined;
  if (centroid?.type === 'Point' && Array.isArray(centroid.coordinates)) {
    return {
      lng: centroid.coordinates[0],
      lat: centroid.coordinates[1],
    };
  }
  throw new AppError('Feature has no routeable centroid — re-import the GeoJSON to generate one', 422);
}

// ── Nearest Row Type ──────────────────────────────────────────────────────

/**
 * ✅ TS7006 Fix (Line 114): Explicit row type for nearestFeatures result.
 * Replaces implicit `any` with typed interface matching repository return shape.
 */
type NearestFeatureRow = CampusFeatureRow & { distanceMeters?: number };

// ── Categories Row Type ───────────────────────────────────────────────────

/**
 * ✅ TS7006 Fix (Line 201): Explicit row type for listCategories result.
 * Replaces implicit `any` with typed interface matching repository return shape.
 * `count` is bigint because Prisma $queryRaw returns COUNT(*) as bigint.
 */
interface CategoryRow {
  category : string;
  count    : string | number | bigint;
}

// ── Service ───────────────────────────────────────────────────────────────

export const campusMapService = {

  async listFeatures(
    schoolId : string,
    options  : Parameters<typeof campusMapRepository.listFeatures>[1],
  ) {
    const rows = await campusMapRepository.listFeatures(schoolId, options);
    return {
      type    : 'FeatureCollection' as const,
      features: rows.map(toFeature),
    };
  },

  async getFeature(schoolId: string, id: string) {
    const [row] = await campusMapRepository.getFeature(schoolId, id);
    if (!row) throw new AppError('Campus feature not found', 404);
    return toFeature(row);
  },

  async getEntrancesForFeature(schoolId: string, featureId: string) {
    const rows = await campusMapRepository.getEntrancesForFeature(schoolId, featureId);
    return {
      type    : 'FeatureCollection' as const,
      features: rows.map(toEntrance),
    };
  },

  async listEntrances(schoolId: string, featureId?: string) {
    const rows = await campusMapRepository.listEntrancesForSchool(schoolId, featureId);
    return {
      type    : 'FeatureCollection' as const,
      features: rows.map(toEntrance),
    };
  },

  async search(
    schoolId : string,
    options  : Parameters<typeof campusSearchService.search>[1],
  ) {
    return campusSearchService.search(schoolId, options);
  },

  async nearest(
    schoolId : string,
    options  : Parameters<typeof campusMapRepository.nearestFeatures>[1],
  ) {
    const rows = await campusMapRepository.nearestFeatures(schoolId, options);

    // ✅ TS7006 Fix (Line 114): Explicit NearestFeatureRow type — no implicit any
    return rows.map((row: NearestFeatureRow) => {
      const feature = toFeature(row);
      return {
        ...feature.properties,
        geometry: feature.geometry,
      };
    });
  },

  async route(
    schoolId : string,
    input    : {
      from : LngLat;
      to   : { featureId?: string; entranceId?: string; lat?: number; lng?: number };
      mode : 'walking' | 'accessible';
    },
  ) {
    // ✅ CWE-918: Validate ALL user-controlled inputs BEFORE passing to service
    // campusGraphService.route() constructs internal HTTP requests using these values
    const safeFrom = validateLngLat(input.from, 'from');
    const safeMode = validateMode(input.mode);

    // Validate optional destination IDs if present
    const safeTo = {
      featureId : input.to.featureId
        ? validateUuid(input.to.featureId, 'to.featureId')
        : undefined,
      entranceId: input.to.entranceId
        ? validateUuid(input.to.entranceId, 'to.entranceId')
        : undefined,
      lat: input.to.lat !== undefined
        ? validateLngLat({ lat: input.to.lat, lng: input.to.lng ?? 0 }, 'to').lat
        : undefined,
      lng: input.to.lng !== undefined
        ? validateLngLat({ lat: input.to.lat ?? 0, lng: input.to.lng }, 'to').lng
        : undefined,
    };

    try {
      return await this._resolveRoute(schoolId, {
        from : safeFrom,
        to   : safeTo,
        mode : safeMode,
      });
    } catch (err) {
      if (err instanceof AppError) throw err;

      // Fallback to straight-line estimate for infrastructure failures only
      const from = safeFrom;
      const to: LngLat =
        safeTo.lat !== undefined && safeTo.lng !== undefined
          ? { lat: safeTo.lat, lng: safeTo.lng }
          : from;

      const geometry: GeoJsonLineString = {
        type       : 'LineString',
        coordinates: [[from.lng, from.lat], [to.lng, to.lat]],
      };

      const R    = 6_371_000;
      const dLat = ((to.lat - from.lat) * Math.PI) / 180;
      const dLng = ((to.lng - from.lng) * Math.PI) / 180;
      const a    =
        Math.sin(dLat / 2) ** 2 +
        Math.cos((from.lat * Math.PI) / 180) *
        Math.cos((to.lat  * Math.PI) / 180) *
        Math.sin(dLng / 2) ** 2;
      const dist = Math.round(2 * R * Math.asin(Math.sqrt(a)));

      const { nanoid }                  = await import('nanoid');
      const { estimateWalkingEtaSeconds } = await import('./routing/eta.service.js');

      return {
        routeId           : nanoid(),
        geometry,
        distanceMeters    : dist,
        etaSeconds        : estimateWalkingEtaSeconds(dist, safeMode),
        steps             : [{ instruction: 'Walk toward the destination', distanceMeters: dist, geometry }],
        warnings          : ['Route data unavailable — showing straight-line estimate.'],
        destinationEntrance: undefined,
      };
    }
  },

  async _resolveRoute(
    schoolId : string,
    input    : {
      from : LngLat;
      to   : { featureId?: string; entranceId?: string; lat?: number; lng?: number };
      mode : TravelMode;   // ✅ CWE-918: Typed — only 'walking' | 'accessible'
    },
  ) {
    let destination       : LngLat | undefined;
    let destinationEntrance: GeoJsonFeature<GeoJsonPoint> | undefined;

    if (input.to.entranceId) {
      const [entrance] = await campusMapRepository.getEntrance(schoolId, input.to.entranceId);
      if (!entrance) throw new AppError('Destination entrance not found', 404);
      destinationEntrance = toEntrance(entrance);
      destination = pointFromFeature(destinationEntrance);
    } else if (input.to.featureId) {
      const feature       = await this.getFeature(schoolId, input.to.featureId);
      const [bestEntrance] = await campusMapRepository.findBestEntrance(
        schoolId, input.to.featureId, input.mode, input.from
      );
      if (bestEntrance) {
        destinationEntrance = toEntrance(bestEntrance);
        destination = pointFromFeature(destinationEntrance);
      } else {
        destination = pointFromFeature(feature);
      }
    } else if (input.to.lat !== undefined && input.to.lng !== undefined) {
      // ✅ CWE-918: Already validated by validateLngLat() in route() above
      destination = { lat: input.to.lat, lng: input.to.lng };
    }

    if (!destination) throw new AppError('Unable to resolve route destination', 422);

    // ✅ CWE-918: All three parameters are validated before this call:
    //   input.from  → validateLngLat() — finite numbers, valid geo bounds
    //   destination → derived from DB rows or validateLngLat() validated coords
    //   input.mode  → validateMode()   — strict allowlist only
    const route = await campusGraphService.route(
      schoolId,
      input.from,
      destination,
      input.mode,
    );

    return { ...route, destinationEntrance };
  },

  progress(input: {
    routeId : string;
    user    : LngLat;
    route   : GeoJsonLineString;
  }) {
    return {
      routeId: input.routeId,
      ...routeProgress(input.user, input.route),
    };
  },

  async categories(schoolId: string) {
    const rows = await campusMapRepository.listCategories(schoolId);

    // ✅ TS7006 Fix (Line 201): Explicit CategoryRow type — no implicit any
    return rows.map((row: CategoryRow) => ({
      category: row.category,
      count   : Number(row.count),
    }));
  },

  async upsertFeature(
    schoolId : string,
    input    : Parameters<typeof campusMapRepository.upsertFeature>[1],
  ) {
    await campusMapRepository.upsertFeature(schoolId, input);
    const [row] = await campusMapRepository.getFeature(schoolId, input.id);
    if (!row) throw new AppError('Feature not found after upsert', 500);
    return toFeature(row);
  },

  async deleteFeature(schoolId: string, id: string) {
    const count = await campusMapRepository.deleteFeature(schoolId, id);
    if (count === 0) throw new AppError('Campus feature not found', 404);
  },

  async upsertEntrance(
    schoolId : string,
    input    : Parameters<typeof campusMapRepository.upsertEntrance>[1],
  ) {
    await campusMapRepository.upsertEntrance(schoolId, input);
    const [row] = await campusMapRepository.getEntrance(schoolId, input.id);
    if (!row) throw new AppError('Entrance not found after upsert', 500);
    return toEntrance(row);
  },

  async deleteEntrance(schoolId: string, id: string) {
    const count = await campusMapRepository.deleteEntrance(schoolId, id);
    if (count === 0) throw new AppError('Campus entrance not found', 404);
  },

  async uploadFeatureImage(
    schoolId    : string,
    featureId   : string,
    buffer      : Buffer,
    originalName: string,
    mimeType    : string,
  ) {
    const [row] = await campusMapRepository.getFeatureImages(schoolId, featureId);
    if (!row) throw new AppError('Campus feature not found', 404);

    const existing: string[] = Array.isArray(row.images)
      ? row.images as string[]
      : JSON.parse(row.images as string) as string[];

    const ext = /^\.[a-z0-9]+$/.test(path.extname(originalName).toLowerCase())
      ? path.extname(originalName).toLowerCase()
      : '';

    // ✅ Cryptographic key — no user input in storage path
    const safeKey = `map/${featureId}/${Date.now()}-${crypto.randomBytes(8).toString('hex')}${ext}`;

    const { url } = await r2.upload(buffer, safeKey, mimeType);
    const updated = [...existing, url];
    await campusMapRepository.setFeatureImages(schoolId, featureId, updated);
    return { url, images: updated };
  },

  async deleteFeatureImage(
    schoolId  : string,
    featureId : string,
    imageUrl  : string,
  ) {
    const [row] = await campusMapRepository.getFeatureImages(schoolId, featureId);
    if (!row) throw new AppError('Campus feature not found', 404);

    const existing: string[] = Array.isArray(row.images)
      ? row.images as string[]
      : JSON.parse(row.images as string) as string[];

    if (!existing.includes(imageUrl)) {
      throw new AppError('Image not found on this feature', 404);
    }

    const key = urlToKey(imageUrl);
    if (!key) throw new AppError('Invalid image URL', 400);

    await r2.delete(key).catch(() => null);
    const updated = existing.filter((u) => u !== imageUrl);
    await campusMapRepository.setFeatureImages(schoolId, featureId, updated);
    return { images: updated };
  },

  tilesMetadata() {
    return {
      version          : 1,
      source           : 'postgis',
      vectorTilesReady : false,
      supportedLayers  : ['buildings', 'pois', 'entrances', 'routes', 'live', 'indoor'],
    };
  },
};