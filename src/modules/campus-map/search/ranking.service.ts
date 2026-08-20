import type { CampusFeatureRow } from '../campus-map.types.js';
import type { GeoJsonPoint } from '../campus-map.types.js';

function parseArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : [];
}

export function toSearchResult(row: CampusFeatureRow) {
  // centroid may be null for features imported before the ST_Centroid fix
  const centroidParsed = row.centroid ? JSON.parse(row.centroid) as GeoJsonPoint : null;
  return {
    id: row.id,
    category: row.category,
    name: row.name,
    description: row.description,
    aliases: parseArray(row.aliases),
    tags: parseArray(row.tags),
    images: parseArray(row.images),
    metadata: row.metadata,
    accessibility: row.accessibility,
    centroid: centroidParsed,
  };
}
