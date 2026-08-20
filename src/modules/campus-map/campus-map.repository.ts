import { Prisma } from '@prisma/client';
import { prisma } from '@/config/prisma.js';
import type { CampusEntranceRow, CampusFeatureCategory, CampusFeatureRow, LngLat, RouteEdge, RouteNode } from './campus-map.types.js';

type Bbox = {
  minLng: number;
  minLat: number;
  maxLng: number;
  maxLat: number;
};

const featureSelect = Prisma.sql`
  SELECT
    "id",
    "schoolId",
    "category",
    "name",
    "description",
    "aliases",
    "tags",
    "metadata",
    "images",
    "routing",
    "accessibility",
    "importance",
    ST_AsGeoJSON("geometry") AS "geometry",
    ST_AsGeoJSON("centroid") AS "centroid"
  FROM "campus_features"
`;

const entranceSelect = Prisma.sql`
  SELECT
    "id",
    "schoolId",
    "featureId",
    "kind",
    "name",
    "priority",
    "isAccessible",
    "metadata",
    ST_AsGeoJSON("geometry") AS "geometry"
  FROM "campus_entrances"
`;

export const campusMapRepository = {
  listFeatures(schoolId: string, options: { bbox?: Bbox; category?: CampusFeatureCategory; limit: number }) {
    const filters: Prisma.Sql[] = [Prisma.sql`"schoolId" = ${schoolId}`, Prisma.sql`"isActive" = true`];

    if (options.category) filters.push(Prisma.sql`"category" = ${options.category}::"CampusFeatureCategory"`);
    if (options.bbox) {
      filters.push(Prisma.sql`
        "geometry" && ST_MakeEnvelope(${options.bbox.minLng}, ${options.bbox.minLat}, ${options.bbox.maxLng}, ${options.bbox.maxLat}, 4326)
      `);
    }

    return prisma.$queryRaw<CampusFeatureRow[]>`
      ${featureSelect}
      WHERE ${Prisma.join(filters, ' AND ')}
      ORDER BY "importance" DESC, "name" ASC
      LIMIT ${options.limit}
    `;
  },

  getFeature(schoolId: string, id: string) {
    return prisma.$queryRaw<CampusFeatureRow[]>`
      ${featureSelect}
      WHERE "schoolId" = ${schoolId} AND "id" = ${id} AND "isActive" = true
      LIMIT 1
    `;
  },

  getEntrancesForFeature(schoolId: string, featureId: string) {
    return prisma.$queryRaw<CampusEntranceRow[]>`
      ${entranceSelect}
      WHERE "schoolId" = ${schoolId} AND "featureId" = ${featureId}
      ORDER BY "priority" ASC, "kind" ASC
    `;
  },

  listEntrancesForSchool(schoolId: string, featureId?: string) {
    const filters: Prisma.Sql[] = [Prisma.sql`"schoolId" = ${schoolId}`];
    if (featureId) {
      filters.push(Prisma.sql`"featureId" = ${featureId}`);
    }

    return prisma.$queryRaw<CampusEntranceRow[]>`
      ${entranceSelect}
      WHERE ${Prisma.join(filters, ' AND ')}
      ORDER BY "priority" ASC, "kind" ASC
    `;
  },

  getEntrance(schoolId: string, id: string) {
    return prisma.$queryRaw<CampusEntranceRow[]>`
      ${entranceSelect}
      WHERE "schoolId" = ${schoolId} AND "id" = ${id}
      LIMIT 1
    `;
  },

  findBestEntrance(schoolId: string, featureId: string, mode: 'walking' | 'accessible', origin: LngLat) {
    const accessibleFilter = mode === 'accessible' ? Prisma.sql`AND "isAccessible" = true` : Prisma.empty;

    return prisma.$queryRaw<CampusEntranceRow[]>`
      ${entranceSelect}
      WHERE "schoolId" = ${schoolId}
        AND "featureId" = ${featureId}
        ${accessibleFilter}
      ORDER BY
        CASE "kind"
          WHEN 'MAIN' THEN 0
          WHEN 'ACCESSIBLE' THEN 1
          WHEN 'SECONDARY' THEN 2
          WHEN 'SERVICE' THEN 3
          WHEN 'EMERGENCY' THEN 4
          ELSE 5
        END,
        "priority" ASC,
        ST_Distance("geometry"::geography, ST_SetSRID(ST_MakePoint(${origin.lng}, ${origin.lat}), 4326)::geography) ASC
      LIMIT 1
    `;
  },

  searchFeatures(schoolId: string, options: { q: string; category?: CampusFeatureCategory; near?: LngLat; limit: number }) {
    const query = options.q.toLowerCase();
    const filters: Prisma.Sql[] = [Prisma.sql`"schoolId" = ${schoolId}`, Prisma.sql`"isActive" = true`];
    if (options.category) filters.push(Prisma.sql`"category" = ${options.category}::"CampusFeatureCategory"`);

    const nearScore = options.near
      ? Prisma.sql`- LEAST(ST_Distance("centroid"::geography, ST_SetSRID(ST_MakePoint(${options.near.lng}, ${options.near.lat}), 4326)::geography) / 1000, 50)`
      : Prisma.sql`0`;

    return prisma.$queryRaw<CampusFeatureRow[]>`
      ${featureSelect}
      WHERE ${Prisma.join(filters, ' AND ')}
        AND (
          lower("name") LIKE ${`%${query}%`}
          OR EXISTS (SELECT 1 FROM jsonb_array_elements_text("aliases") AS alias WHERE lower(alias) LIKE ${`%${query}%`})
          OR EXISTS (SELECT 1 FROM jsonb_array_elements_text("tags") AS tag WHERE lower(tag) LIKE ${`%${query}%`})
          OR similarity(lower("name"), ${query}) > 0.2
        )
      ORDER BY
        CASE WHEN lower("name") = ${query} THEN 100 ELSE 0 END
        + CASE WHEN lower("name") LIKE ${`${query}%`} THEN 40 ELSE 0 END
        + (similarity(lower("name"), ${query}) * 30)
        + "importance"
        + ${nearScore} DESC,
        "name" ASC
      LIMIT ${options.limit}
    `;
  },

  nearestFeatures(schoolId: string, options: { point: LngLat; category?: CampusFeatureCategory; limit: number }) {
    const filters: Prisma.Sql[] = [Prisma.sql`"schoolId" = ${schoolId}`, Prisma.sql`"isActive" = true`];
    if (options.category) filters.push(Prisma.sql`"category" = ${options.category}::"CampusFeatureCategory"`);

    return prisma.$queryRaw<CampusFeatureRow[]>`
      ${featureSelect}
      WHERE ${Prisma.join(filters, ' AND ')}
      ORDER BY ST_Distance("centroid"::geography, ST_SetSRID(ST_MakePoint(${options.point.lng}, ${options.point.lat}), 4326)::geography) ASC
      LIMIT ${options.limit}
    `;
  },

  nearestRouteNode(schoolId: string, point: LngLat, accessibleOnly = false) {
    const accessibleJoin = accessibleOnly
      ? Prisma.sql`
        WHERE n."schoolId" = ${schoolId}
          AND EXISTS (
            SELECT 1 FROM "campus_route_edges" e
            WHERE e."schoolId" = n."schoolId"
              AND e."isAccessible" = true
              AND (e."fromNodeId" = n."id" OR e."toNodeId" = n."id")
          )
      `
      : Prisma.sql`WHERE n."schoolId" = ${schoolId}`;

    return prisma.$queryRaw<RouteNode[]>`
      SELECT n."id", ST_X(n."geometry") AS "lng", ST_Y(n."geometry") AS "lat"
      FROM "campus_route_nodes" n
      ${accessibleJoin}
      ORDER BY ST_Distance(n."geometry"::geography, ST_SetSRID(ST_MakePoint(${point.lng}, ${point.lat}), 4326)::geography) ASC
      LIMIT 1
    `;
  },

  listRouteEdges(schoolId: string, accessibleOnly = false) {
    const accessibleFilter = accessibleOnly ? Prisma.sql`AND "isAccessible" = true` : Prisma.empty;
    return prisma.$queryRaw<RouteEdge[]>`
      SELECT
        "id",
        "fromNodeId",
        "toNodeId",
        "distanceMeters",
        "isAccessible",
        "metadata",
        ST_AsGeoJSON("geometry") AS "geometry"
      FROM "campus_route_edges"
      WHERE "schoolId" = ${schoolId}
      ${accessibleFilter}
    `;
  },

  listCategories(schoolId: string) {
    return prisma.$queryRaw<Array<{ category: CampusFeatureCategory; count: bigint }>>`
      SELECT "category", COUNT(*) AS "count"
      FROM "campus_features"
      WHERE "schoolId" = ${schoolId} AND "isActive" = true
      GROUP BY "category"
      ORDER BY "category" ASC
    `;
  },

  upsertFeature(schoolId: string, input: {
    id: string;
    name: string;
    category: CampusFeatureCategory;
    geometry: string;
    description?: string | null;
    aliases?: string[];
    tags?: string[];
    images?: string[];
    metadata?: Record<string, unknown>;
    routing?: Record<string, unknown>;
    accessibility?: Record<string, unknown>;
    importance?: number;
    isActive?: boolean;
  }) {
    return prisma.$executeRaw`
      INSERT INTO "campus_features" (
        "id", "schoolId", "category", "name", "description", "aliases", "tags", "metadata",
        "images", "routing", "accessibility", "importance", "isActive", "geometry", "centroid",
        "createdAt", "updatedAt"
      )
      VALUES (
        ${input.id}, ${schoolId}, ${input.category}::"CampusFeatureCategory", ${input.name},
        ${input.description ?? null},
        ${JSON.stringify(input.aliases ?? [])}::jsonb,
        ${JSON.stringify(input.tags ?? [])}::jsonb,
        ${JSON.stringify(input.metadata ?? {})}::jsonb,
        ${JSON.stringify(input.images ?? [])}::jsonb,
        ${JSON.stringify(input.routing ?? { routable: true })}::jsonb,
        ${JSON.stringify(input.accessibility ?? { wheelchair: false, stepFree: false, ramp: false })}::jsonb,
        ${input.importance ?? 0}, ${input.isActive ?? true},
        ST_SetSRID(ST_GeomFromGeoJSON(${input.geometry}), 4326),
        ST_Centroid(ST_SetSRID(ST_GeomFromGeoJSON(${input.geometry}), 4326)),
        CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
      )
      ON CONFLICT ("id") DO UPDATE SET
        "category" = EXCLUDED."category",
        "name" = EXCLUDED."name",
        "description" = EXCLUDED."description",
        "aliases" = EXCLUDED."aliases",
        "tags" = EXCLUDED."tags",
        "metadata" = EXCLUDED."metadata",
        "images" = EXCLUDED."images",
        "routing" = EXCLUDED."routing",
        "accessibility" = EXCLUDED."accessibility",
        "importance" = EXCLUDED."importance",
        "isActive" = EXCLUDED."isActive",
        "geometry" = EXCLUDED."geometry",
        "centroid" = EXCLUDED."centroid",
        "updatedAt" = CURRENT_TIMESTAMP
    `;
  },

  deleteFeature(schoolId: string, id: string) {
    return prisma.$executeRaw`
      DELETE FROM "campus_features" WHERE "id" = ${id} AND "schoolId" = ${schoolId}
    `;
  },

  upsertEntrance(schoolId: string, input: {
    id: string;
    featureId?: string | null;
    kind: string;
    geometry: string;
    name?: string | null;
    priority?: number;
    isAccessible?: boolean;
    metadata?: Record<string, unknown>;
  }) {
    return prisma.$executeRaw`
      INSERT INTO "campus_entrances" (
        "id", "schoolId", "featureId", "kind", "name", "priority", "isAccessible",
        "metadata", "geometry", "createdAt", "updatedAt"
      )
      VALUES (
        ${input.id}, ${schoolId}, ${input.featureId ?? null},
        ${input.kind}::"CampusEntranceKind",
        ${input.name ?? null}, ${input.priority ?? 50}, ${input.isAccessible ?? false},
        ${JSON.stringify(input.metadata ?? {})}::jsonb,
        ST_SetSRID(ST_GeomFromGeoJSON(${input.geometry}), 4326),
        CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
      )
      ON CONFLICT ("id") DO UPDATE SET
        "featureId" = EXCLUDED."featureId",
        "kind" = EXCLUDED."kind",
        "name" = EXCLUDED."name",
        "priority" = EXCLUDED."priority",
        "isAccessible" = EXCLUDED."isAccessible",
        "metadata" = EXCLUDED."metadata",
        "geometry" = EXCLUDED."geometry",
        "updatedAt" = CURRENT_TIMESTAMP
    `;
  },

  deleteEntrance(schoolId: string, id: string) {
    return prisma.$executeRaw`
      DELETE FROM "campus_entrances" WHERE "id" = ${id} AND "schoolId" = ${schoolId}
    `;
  },

  getFeatureImages(schoolId: string, id: string) {
    return prisma.$queryRaw<Array<{ images: unknown }>>`
      SELECT "images" FROM "campus_features"
      WHERE "id" = ${id} AND "schoolId" = ${schoolId}
      LIMIT 1
    `;
  },

  setFeatureImages(schoolId: string, id: string, images: string[]) {
    return prisma.$executeRaw`
      UPDATE "campus_features"
      SET "images" = ${JSON.stringify(images)}::jsonb, "updatedAt" = CURRENT_TIMESTAMP
      WHERE "id" = ${id} AND "schoolId" = ${schoolId}
    `;
  },
};
