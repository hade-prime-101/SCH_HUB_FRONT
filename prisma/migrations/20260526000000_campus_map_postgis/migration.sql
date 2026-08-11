CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE TYPE "CampusFeatureCategory" AS ENUM (
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
  'OTHER'
);

CREATE TYPE "CampusEntranceKind" AS ENUM ('MAIN', 'ACCESSIBLE', 'SERVICE', 'EMERGENCY', 'SECONDARY');
CREATE TYPE "CampusRouteMode" AS ENUM ('WALKING', 'ACCESSIBLE');
CREATE TYPE "CampusLiveAssetType" AS ENUM ('SHUTTLE', 'CROWD_HEATMAP', 'EMERGENCY', 'SENSOR');

CREATE TABLE "campus_features" (
  "id" TEXT PRIMARY KEY,
  "schoolId" TEXT NOT NULL REFERENCES "schools"("id") ON DELETE CASCADE,
  "category" "CampusFeatureCategory" NOT NULL DEFAULT 'OTHER',
  "name" TEXT NOT NULL,
  "description" TEXT,
  "aliases" JSONB NOT NULL DEFAULT '[]',
  "tags" JSONB NOT NULL DEFAULT '[]',
  "metadata" JSONB NOT NULL DEFAULT '{}',
  "images" JSONB NOT NULL DEFAULT '[]',
  "routing" JSONB NOT NULL DEFAULT '{"routable":true}',
  "accessibility" JSONB NOT NULL DEFAULT '{"wheelchair":false,"stepFree":false,"ramp":false}',
  "importance" INTEGER NOT NULL DEFAULT 0,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "geometry" geometry(Geometry, 4326) NOT NULL,
  "centroid" geometry(Point, 4326) GENERATED ALWAYS AS (ST_PointOnSurface("geometry")) STORED,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "campus_entrances" (
  "id" TEXT PRIMARY KEY,
  "schoolId" TEXT NOT NULL REFERENCES "schools"("id") ON DELETE CASCADE,
  "featureId" TEXT REFERENCES "campus_features"("id") ON DELETE CASCADE,
  "kind" "CampusEntranceKind" NOT NULL DEFAULT 'SECONDARY',
  "name" TEXT,
  "priority" INTEGER NOT NULL DEFAULT 50,
  "isAccessible" BOOLEAN NOT NULL DEFAULT false,
  "metadata" JSONB NOT NULL DEFAULT '{}',
  "geometry" geometry(Point, 4326) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "campus_paths" (
  "id" TEXT PRIMARY KEY,
  "schoolId" TEXT NOT NULL REFERENCES "schools"("id") ON DELETE CASCADE,
  "name" TEXT,
  "kind" TEXT NOT NULL DEFAULT 'walkway',
  "isAccessible" BOOLEAN NOT NULL DEFAULT true,
  "metadata" JSONB NOT NULL DEFAULT '{}',
  "geometry" geometry(LineString, 4326) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "campus_route_nodes" (
  "id" TEXT PRIMARY KEY,
  "schoolId" TEXT NOT NULL REFERENCES "schools"("id") ON DELETE CASCADE,
  "featureId" TEXT REFERENCES "campus_features"("id") ON DELETE SET NULL,
  "entranceId" TEXT REFERENCES "campus_entrances"("id") ON DELETE SET NULL,
  "metadata" JSONB NOT NULL DEFAULT '{}',
  "geometry" geometry(Point, 4326) NOT NULL
);

CREATE TABLE "campus_route_edges" (
  "id" TEXT PRIMARY KEY,
  "schoolId" TEXT NOT NULL REFERENCES "schools"("id") ON DELETE CASCADE,
  "fromNodeId" TEXT NOT NULL REFERENCES "campus_route_nodes"("id") ON DELETE CASCADE,
  "toNodeId" TEXT NOT NULL REFERENCES "campus_route_nodes"("id") ON DELETE CASCADE,
  "pathId" TEXT REFERENCES "campus_paths"("id") ON DELETE SET NULL,
  "distanceMeters" DOUBLE PRECISION NOT NULL,
  "isAccessible" BOOLEAN NOT NULL DEFAULT true,
  "slope" DOUBLE PRECISION,
  "restrictions" JSONB NOT NULL DEFAULT '[]',
  "metadata" JSONB NOT NULL DEFAULT '{}',
  "geometry" geometry(LineString, 4326) NOT NULL
);

CREATE TABLE "campus_indoor_levels" (
  "id" TEXT PRIMARY KEY,
  "schoolId" TEXT NOT NULL REFERENCES "schools"("id") ON DELETE CASCADE,
  "featureId" TEXT NOT NULL REFERENCES "campus_features"("id") ON DELETE CASCADE,
  "levelIndex" INTEGER NOT NULL,
  "label" TEXT NOT NULL,
  "metadata" JSONB NOT NULL DEFAULT '{}'
);

CREATE TABLE "campus_indoor_features" (
  "id" TEXT PRIMARY KEY,
  "schoolId" TEXT NOT NULL REFERENCES "schools"("id") ON DELETE CASCADE,
  "levelId" TEXT NOT NULL REFERENCES "campus_indoor_levels"("id") ON DELETE CASCADE,
  "category" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "metadata" JSONB NOT NULL DEFAULT '{}',
  "geometry" geometry(Geometry, 4326) NOT NULL
);

CREATE TABLE "campus_events" (
  "id" TEXT PRIMARY KEY,
  "schoolId" TEXT NOT NULL REFERENCES "schools"("id") ON DELETE CASCADE,
  "title" TEXT NOT NULL,
  "category" TEXT NOT NULL DEFAULT 'event',
  "startsAt" TIMESTAMP(3),
  "endsAt" TIMESTAMP(3),
  "metadata" JSONB NOT NULL DEFAULT '{}',
  "geometry" geometry(Geometry, 4326)
);

CREATE TABLE "campus_live_assets" (
  "id" TEXT PRIMARY KEY,
  "schoolId" TEXT NOT NULL REFERENCES "schools"("id") ON DELETE CASCADE,
  "type" "CampusLiveAssetType" NOT NULL,
  "label" TEXT,
  "metadata" JSONB NOT NULL DEFAULT '{}',
  "geometry" geometry(Geometry, 4326),
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX "campus_features_geometry_gix" ON "campus_features" USING GIST ("geometry");
CREATE INDEX "campus_features_centroid_gix" ON "campus_features" USING GIST ("centroid");
CREATE INDEX "campus_features_school_category_idx" ON "campus_features" ("schoolId", "category", "isActive");
CREATE INDEX "campus_features_name_trgm_idx" ON "campus_features" USING GIN ("name" gin_trgm_ops);
CREATE INDEX "campus_entrances_geometry_gix" ON "campus_entrances" USING GIST ("geometry");
CREATE INDEX "campus_entrances_feature_idx" ON "campus_entrances" ("featureId", "priority");
CREATE INDEX "campus_paths_geometry_gix" ON "campus_paths" USING GIST ("geometry");
CREATE INDEX "campus_route_nodes_geometry_gix" ON "campus_route_nodes" USING GIST ("geometry");
CREATE INDEX "campus_route_edges_school_idx" ON "campus_route_edges" ("schoolId", "fromNodeId", "toNodeId");
CREATE INDEX "campus_route_edges_geometry_gix" ON "campus_route_edges" USING GIST ("geometry");
CREATE INDEX "campus_indoor_features_geometry_gix" ON "campus_indoor_features" USING GIST ("geometry");
CREATE INDEX "campus_events_geometry_gix" ON "campus_events" USING GIST ("geometry");
CREATE INDEX "campus_live_assets_geometry_gix" ON "campus_live_assets" USING GIST ("geometry");
