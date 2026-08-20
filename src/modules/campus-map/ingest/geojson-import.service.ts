import { nanoid } from 'nanoid';
import { readFile } from 'node:fs/promises';
import { prisma } from '@/config/prisma.js';
import type { GeoJsonFeature, GeoJsonFeatureCollection, GeoJsonGeometry } from '../campus-map.types.js';

type RawFeature = GeoJsonFeature<GeoJsonGeometry, Record<string, unknown>>;

function textArray(value: unknown): string[] {
  if (Array.isArray(value)) return value.filter((item): item is string => typeof item === 'string');
  if (typeof value === 'string') return value.split(',').map((item) => item.trim()).filter(Boolean);
  return [];
}

function categoryFromProperties(properties: Record<string, unknown>) {
  const rawType = String(properties.category ?? properties.type ?? 'BUILDING').toUpperCase();
  const allowed = new Set([
    'BUILDING',
    'HOSTEL',
    'LECTURE_HALL',
    'LIBRARY',
    'CLINIC',
    'CAFETERIA',
    'ATM',
    'SPORTS',
    'SHUTTLE_STOP',
    'GATE',
    'PARKING',
    'LANDMARK',
    'OFFICE',
    'LAB',
    'ROAD',
    'PATH',
    'OTHER',
  ]);
  return allowed.has(rawType) ? rawType : 'OTHER';
}

export const campusGeojsonImportService = {
  async importFeaturesFromFile(input: { filePath: string; schoolId: string; dryRun?: boolean }) {
    const body = await readFile(input.filePath, 'utf8');
    return this.importFeaturesFromString({ body, schoolId: input.schoolId, dryRun: input.dryRun });
  },

  async importFeaturesFromString(input: { body: string; schoolId: string; dryRun?: boolean }) {
    const collection = JSON.parse(input.body) as GeoJsonFeatureCollection;
    if (collection.type !== 'FeatureCollection') {
      throw new Error('Expected a GeoJSON FeatureCollection');
    }

    const features = collection.features.filter((feature): feature is RawFeature => Boolean(feature.geometry));
    const rows = features.map((feature, index) => {
      const properties = feature.properties ?? {};
      const name = String(properties.name ?? properties.buildingName ?? `Campus Feature ${index + 1}`);
      return {
        id: String(properties.id ?? `campus_${nanoid(12)}`),
        schoolId: input.schoolId,
        category: categoryFromProperties(properties),
        name,
        description: typeof properties.description === 'string' ? properties.description : null,
        aliases: textArray(properties.aliases),
        tags: textArray(properties.tags ?? properties.searchTags),
        metadata: properties,
        images: textArray(properties.images ?? properties.image),
        routing: { routable: true },
        accessibility: { wheelchair: false, stepFree: false, ramp: false },
        geometry: feature.geometry,
      };
    });

    if (input.dryRun) {
      return { read: collection.features.length, valid: rows.length, imported: 0 };
    }

    await prisma.$transaction(rows.map((row) => prisma.$executeRaw`
      INSERT INTO "campus_features" (
        "id", "schoolId", "category", "name", "description", "aliases", "tags", "metadata", "images", "routing", "accessibility", "geometry", "centroid", "createdAt", "updatedAt"
      )
      VALUES (
        ${row.id},
        ${row.schoolId},
        ${row.category}::"CampusFeatureCategory",
        ${row.name},
        ${row.description},
        ${JSON.stringify(row.aliases)}::jsonb,
        ${JSON.stringify(row.tags)}::jsonb,
        ${JSON.stringify(row.metadata)}::jsonb,
        ${JSON.stringify(row.images)}::jsonb,
        ${JSON.stringify(row.routing)}::jsonb,
        ${JSON.stringify(row.accessibility)}::jsonb,
        ST_SetSRID(ST_GeomFromGeoJSON(${JSON.stringify(row.geometry)}), 4326),
        ST_Centroid(ST_SetSRID(ST_GeomFromGeoJSON(${JSON.stringify(row.geometry)}), 4326)),
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
      )
      ON CONFLICT ("id") DO UPDATE SET
        "name" = EXCLUDED."name",
        "category" = EXCLUDED."category",
        "description" = EXCLUDED."description",
        "aliases" = EXCLUDED."aliases",
        "tags" = EXCLUDED."tags",
        "metadata" = EXCLUDED."metadata",
        "images" = EXCLUDED."images",
        "geometry" = EXCLUDED."geometry",
        "centroid" = EXCLUDED."centroid",
        "updatedAt" = CURRENT_TIMESTAMP
    `));

    return { read: collection.features.length, valid: rows.length, imported: rows.length };
  },
};
