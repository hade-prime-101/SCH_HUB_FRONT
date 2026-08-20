/*
  Warnings:

  - Made the column `preferredArea` on table `roommate_requests` required. This step will fail if there are existing NULL values in that column.
  - Made the column `gender` on table `roommate_requests` required. This step will fail if there are existing NULL values in that column.
  - Made the column `level` on table `roommate_requests` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "audit_logs" DROP CONSTRAINT "audit_logs_performedById_fkey";

-- DropForeignKey
ALTER TABLE "audit_logs" DROP CONSTRAINT "audit_logs_targetUserId_fkey";

-- DropForeignKey
ALTER TABLE "campus_entrances" DROP CONSTRAINT "campus_entrances_featureId_fkey";

-- DropForeignKey
ALTER TABLE "campus_entrances" DROP CONSTRAINT "campus_entrances_schoolId_fkey";

-- DropForeignKey
ALTER TABLE "campus_events" DROP CONSTRAINT "campus_events_schoolId_fkey";

-- DropForeignKey
ALTER TABLE "campus_features" DROP CONSTRAINT "campus_features_schoolId_fkey";

-- DropForeignKey
ALTER TABLE "campus_indoor_features" DROP CONSTRAINT "campus_indoor_features_levelId_fkey";

-- DropForeignKey
ALTER TABLE "campus_indoor_features" DROP CONSTRAINT "campus_indoor_features_schoolId_fkey";

-- DropForeignKey
ALTER TABLE "campus_indoor_levels" DROP CONSTRAINT "campus_indoor_levels_featureId_fkey";

-- DropForeignKey
ALTER TABLE "campus_indoor_levels" DROP CONSTRAINT "campus_indoor_levels_schoolId_fkey";

-- DropForeignKey
ALTER TABLE "campus_live_assets" DROP CONSTRAINT "campus_live_assets_schoolId_fkey";

-- DropForeignKey
ALTER TABLE "campus_paths" DROP CONSTRAINT "campus_paths_schoolId_fkey";

-- DropForeignKey
ALTER TABLE "campus_route_edges" DROP CONSTRAINT "campus_route_edges_fromNodeId_fkey";

-- DropForeignKey
ALTER TABLE "campus_route_edges" DROP CONSTRAINT "campus_route_edges_pathId_fkey";

-- DropForeignKey
ALTER TABLE "campus_route_edges" DROP CONSTRAINT "campus_route_edges_schoolId_fkey";

-- DropForeignKey
ALTER TABLE "campus_route_edges" DROP CONSTRAINT "campus_route_edges_toNodeId_fkey";

-- DropForeignKey
ALTER TABLE "campus_route_nodes" DROP CONSTRAINT "campus_route_nodes_entranceId_fkey";

-- DropForeignKey
ALTER TABLE "campus_route_nodes" DROP CONSTRAINT "campus_route_nodes_featureId_fkey";

-- DropForeignKey
ALTER TABLE "campus_route_nodes" DROP CONSTRAINT "campus_route_nodes_schoolId_fkey";

-- DropForeignKey
ALTER TABLE "planner_entries" DROP CONSTRAINT "planner_entries_userId_fkey";

-- DropIndex
DROP INDEX "campus_entrances_geometry_gix";

-- DropIndex
DROP INDEX "campus_events_geometry_gix";

-- DropIndex
DROP INDEX "campus_features_centroid_gix";

-- DropIndex
DROP INDEX "campus_features_geometry_gix";

-- DropIndex
DROP INDEX "campus_features_name_trgm_idx";

-- DropIndex
DROP INDEX "campus_indoor_features_geometry_gix";

-- DropIndex
DROP INDEX "campus_live_assets_geometry_gix";

-- DropIndex
DROP INDEX "campus_paths_geometry_gix";

-- DropIndex
DROP INDEX "campus_route_edges_geometry_gix";

-- DropIndex
DROP INDEX "campus_route_nodes_geometry_gix";

-- AlterTable
ALTER TABLE "accommodation_posts" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "campus_entrances" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "campus_features" ALTER COLUMN "centroid" DROP EXPRESSION IF EXISTS,
ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "campus_live_assets" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "campus_paths" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "planner_entries" ALTER COLUMN "isAllDay" SET DEFAULT false;

-- AlterTable
ALTER TABLE "roommate_requests" ALTER COLUMN "preferredArea" SET NOT NULL,
ALTER COLUMN "gender" SET NOT NULL,
ALTER COLUMN "level" SET NOT NULL,
ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "service_listings" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AddForeignKey
ALTER TABLE "campus_features" ADD CONSTRAINT "campus_features_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "campus_entrances" ADD CONSTRAINT "campus_entrances_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "campus_entrances" ADD CONSTRAINT "campus_entrances_featureId_fkey" FOREIGN KEY ("featureId") REFERENCES "campus_features"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "campus_paths" ADD CONSTRAINT "campus_paths_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "campus_route_nodes" ADD CONSTRAINT "campus_route_nodes_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "campus_route_nodes" ADD CONSTRAINT "campus_route_nodes_featureId_fkey" FOREIGN KEY ("featureId") REFERENCES "campus_features"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "campus_route_nodes" ADD CONSTRAINT "campus_route_nodes_entranceId_fkey" FOREIGN KEY ("entranceId") REFERENCES "campus_entrances"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "campus_route_edges" ADD CONSTRAINT "campus_route_edges_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "campus_route_edges" ADD CONSTRAINT "campus_route_edges_fromNodeId_fkey" FOREIGN KEY ("fromNodeId") REFERENCES "campus_route_nodes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "campus_route_edges" ADD CONSTRAINT "campus_route_edges_toNodeId_fkey" FOREIGN KEY ("toNodeId") REFERENCES "campus_route_nodes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "campus_route_edges" ADD CONSTRAINT "campus_route_edges_pathId_fkey" FOREIGN KEY ("pathId") REFERENCES "campus_paths"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "campus_indoor_levels" ADD CONSTRAINT "campus_indoor_levels_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "campus_indoor_levels" ADD CONSTRAINT "campus_indoor_levels_featureId_fkey" FOREIGN KEY ("featureId") REFERENCES "campus_features"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "campus_indoor_features" ADD CONSTRAINT "campus_indoor_features_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "campus_indoor_features" ADD CONSTRAINT "campus_indoor_features_levelId_fkey" FOREIGN KEY ("levelId") REFERENCES "campus_indoor_levels"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "campus_events" ADD CONSTRAINT "campus_events_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "campus_live_assets" ADD CONSTRAINT "campus_live_assets_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "planner_entries" ADD CONSTRAINT "planner_entries_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_performedById_fkey" FOREIGN KEY ("performedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_targetUserId_fkey" FOREIGN KEY ("targetUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- RenameIndex
ALTER INDEX "campus_entrances_feature_idx" RENAME TO "campus_entrances_featureId_priority_idx";

-- RenameIndex
ALTER INDEX "campus_features_school_category_idx" RENAME TO "campus_features_schoolId_category_isActive_idx";

-- RenameIndex
ALTER INDEX "campus_route_edges_school_idx" RENAME TO "campus_route_edges_schoolId_fromNodeId_toNodeId_idx";
