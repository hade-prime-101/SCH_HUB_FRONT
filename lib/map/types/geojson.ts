/**
 * GeoJSON type definitions — aligned with RFC 7946
 * Used throughout the campus map for API responses and internal data structures
 */

export type GeoJSONGeometryType = 'Point' | 'LineString' | 'Polygon' | 'MultiPoint' | 'MultiLineString' | 'MultiPolygon' | 'GeometryCollection';

export type GeoJSONPosition = [number, number] | [number, number, number];

export interface GeoJSONPoint {
  type: 'Point';
  coordinates: GeoJSONPosition;
}

export interface GeoJSONLineString {
  type: 'LineString';
  coordinates: GeoJSONPosition[];
}

export interface GeoJSONPolygon {
  type: 'Polygon';
  coordinates: GeoJSONPosition[][];
}

export interface GeoJSONMultiPoint {
  type: 'MultiPoint';
  coordinates: GeoJSONPosition[];
}

export interface GeoJSONMultiLineString {
  type: 'MultiLineString';
  coordinates: GeoJSONPosition[][];
}

export interface GeoJSONMultiPolygon {
  type: 'MultiPolygon';
  coordinates: GeoJSONPosition[][][];
}

export interface GeoJSONGeometryCollection {
  type: 'GeometryCollection';
  geometries: GeoJSONGeometry[];
}

export type GeoJSONGeometry =
  | GeoJSONPoint
  | GeoJSONLineString
  | GeoJSONPolygon
  | GeoJSONMultiPoint
  | GeoJSONMultiLineString
  | GeoJSONMultiPolygon
  | GeoJSONGeometryCollection;

export interface GeoJSONFeature<T extends Record<string, unknown> = Record<string, unknown>> {
  type: 'Feature';
  id?: string | number;
  geometry: GeoJSONGeometry | null;
  properties: T | null;
  bbox?: [number, number, number, number];
}

export interface GeoJSONFeatureCollection<T extends Record<string, unknown> = Record<string, unknown>> {
  type: 'FeatureCollection';
  features: GeoJSONFeature<T>[];
  bbox?: [number, number, number, number];
}

/**
 * Helper to extract coordinates from any GeoJSON geometry
 * Returns [longitude, latitude] or null if unable
 */
export function extractCoordinates(geometry: GeoJSONGeometry | null): [number, number] | null {
  if (!geometry) return null;

  switch (geometry.type) {
    case 'Point':
      return [geometry.coordinates[0], geometry.coordinates[1]];
    case 'LineString':
      return geometry.coordinates.length > 0 ? [geometry.coordinates[0][0], geometry.coordinates[0][1]] : null;
    case 'Polygon':
      return geometry.coordinates[0] && geometry.coordinates[0].length > 0
        ? [geometry.coordinates[0][0][0], geometry.coordinates[0][0][1]]
        : null;
    case 'MultiPoint':
      return geometry.coordinates.length > 0 ? [geometry.coordinates[0][0], geometry.coordinates[0][1]] : null;
    case 'MultiLineString':
      return geometry.coordinates[0] && geometry.coordinates[0].length > 0
        ? [geometry.coordinates[0][0][0], geometry.coordinates[0][0][1]]
        : null;
    case 'MultiPolygon':
      return geometry.coordinates[0] && geometry.coordinates[0][0] && geometry.coordinates[0][0].length > 0
        ? [geometry.coordinates[0][0][0][0], geometry.coordinates[0][0][0][1]]
        : null;
    case 'GeometryCollection':
      for (const g of geometry.geometries) {
        const coords = extractCoordinates(g);
        if (coords) return coords;
      }
      return null;
  }
}

/**
 * Calculate the centroid (center point) of a geometry
 * For Point: returns the point itself
 * For others: returns average of all coordinates
 */
export function calculateCentroid(geometry: GeoJSONGeometry | null): [number, number] | null {
  if (!geometry) return null;

  const coords: GeoJSONPosition[] = [];

  function collectCoords(geom: GeoJSONGeometry) {
    switch (geom.type) {
      case 'Point':
        coords.push(geom.coordinates);
        break;
      case 'LineString':
      case 'MultiPoint':
        coords.push(...geom.coordinates);
        break;
      case 'Polygon':
      case 'MultiLineString':
        for (const ring of geom.coordinates) {
          coords.push(...ring);
        }
        break;
      case 'MultiPolygon':
        for (const polygon of geom.coordinates) {
          for (const ring of polygon) {
            coords.push(...ring);
          }
        }
        break;
      case 'GeometryCollection':
        for (const g of geom.geometries) {
          collectCoords(g);
        }
        break;
    }
  }

  collectCoords(geometry);

  if (coords.length === 0) return null;

  const avgLng = coords.reduce((sum, coord) => sum + coord[0], 0) / coords.length;
  const avgLat = coords.reduce((sum, coord) => sum + coord[1], 0) / coords.length;

  return [avgLng, avgLat];
}
