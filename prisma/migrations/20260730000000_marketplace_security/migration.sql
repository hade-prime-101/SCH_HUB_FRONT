-- Migration: marketplace_security
-- 1. Add HOUSE_AGENT to UserRole enum
-- 2. Add MarketplaceApprovalStatus, AgentVerificationStatus, MarketplaceReportReason enums
-- 3. Add moderation fields to listings, accommodation, service_listings
-- 4. Add agent_profiles table
-- 5. Add marketplace_reports table

-- Add new enum values
ALTER TYPE "UserRole" ADD VALUE IF NOT EXISTS 'HOUSE_AGENT';

-- CreateEnum
CREATE TYPE "MarketplaceApprovalStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');
CREATE TYPE "AgentVerificationStatus"   AS ENUM ('PENDING', 'APPROVED', 'REJECTED');
CREATE TYPE "MarketplaceReportReason"   AS ENUM ('SPAM', 'FAKE_LISTING', 'INAPPROPRIATE_CONTENT', 'SCAM', 'WRONG_CATEGORY', 'OTHER');

-- AlterTable listings: add moderation columns
-- Default existing rows to APPROVED so nothing breaks for existing data
ALTER TABLE "listings"
  ADD COLUMN "approvalStatus" "MarketplaceApprovalStatus" NOT NULL DEFAULT 'APPROVED',
  ADD COLUMN "isFlagged"      BOOLEAN                    NOT NULL DEFAULT false,
  ADD COLUMN "reportCount"    INTEGER                    NOT NULL DEFAULT 0;

-- New listings start PENDING — update default after backfill
ALTER TABLE "listings" ALTER COLUMN "approvalStatus" SET DEFAULT 'PENDING';

-- AlterTable accommodation_posts
ALTER TABLE "accommodation_posts"
  ADD COLUMN "approvalStatus" "MarketplaceApprovalStatus" NOT NULL DEFAULT 'APPROVED',
  ADD COLUMN "isFlagged"      BOOLEAN                    NOT NULL DEFAULT false,
  ADD COLUMN "reportCount"    INTEGER                    NOT NULL DEFAULT 0;

-- AlterTable service_listings
ALTER TABLE "service_listings"
  ADD COLUMN "approvalStatus" "MarketplaceApprovalStatus" NOT NULL DEFAULT 'APPROVED',
  ADD COLUMN "isFlagged"      BOOLEAN                    NOT NULL DEFAULT false,
  ADD COLUMN "reportCount"    INTEGER                    NOT NULL DEFAULT 0;

-- CreateTable: agent_profiles
CREATE TABLE "agent_profiles" (
  "id"              TEXT          NOT NULL,
  "userId"          TEXT          NOT NULL,
  "businessName"    TEXT          NOT NULL,
  "businessAddress" TEXT          NOT NULL,
  "phoneNumber"     TEXT          NOT NULL,
  "idDocumentUrl"   TEXT          NOT NULL,
  "status"          "AgentVerificationStatus" NOT NULL DEFAULT 'PENDING',
  "rejectionReason" TEXT,
  "reviewedById"    TEXT,
  "reviewedAt"      TIMESTAMP(3),
  "createdAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "agent_profiles_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "agent_profiles_userId_key" ON "agent_profiles"("userId");
CREATE INDEX "agent_profiles_status_idx" ON "agent_profiles"("status");

-- AddForeignKey: agent_profiles → users
ALTER TABLE "agent_profiles"
  ADD CONSTRAINT "agent_profiles_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- CreateTable: marketplace_reports
CREATE TABLE "marketplace_reports" (
  "id"              TEXT          NOT NULL,
  "reportedById"    TEXT          NOT NULL,
  "reason"          "MarketplaceReportReason" NOT NULL,
  "details"         TEXT,
  "listingId"       TEXT,
  "accommodationId" TEXT,
  "serviceId"       TEXT,
  "isResolved"      BOOLEAN       NOT NULL DEFAULT false,
  "resolvedAt"      TIMESTAMP(3),
  "createdAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "marketplace_reports_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "marketplace_reports_isResolved_createdAt_idx" ON "marketplace_reports"("isResolved", "createdAt" DESC);

-- AddForeignKeys: marketplace_reports
ALTER TABLE "marketplace_reports"
  ADD CONSTRAINT "marketplace_reports_reportedById_fkey"
  FOREIGN KEY ("reportedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "marketplace_reports"
  ADD CONSTRAINT "marketplace_reports_listingId_fkey"
  FOREIGN KEY ("listingId") REFERENCES "listings"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "marketplace_reports"
  ADD CONSTRAINT "marketplace_reports_accommodationId_fkey"
  FOREIGN KEY ("accommodationId") REFERENCES "accommodation_posts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "marketplace_reports"
  ADD CONSTRAINT "marketplace_reports_serviceId_fkey"
  FOREIGN KEY ("serviceId") REFERENCES "service_listings"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Update indexes
DROP INDEX IF EXISTS "listings_category_isAvailable_idx";
CREATE INDEX "listings_category_isAvailable_approvalStatus_idx" ON "listings"("category", "isAvailable", "approvalStatus");

DROP INDEX IF EXISTS "accommodation_posts_schoolId_isAvailable_idx";
CREATE INDEX "accommodation_posts_schoolId_isAvailable_approvalStatus_isDeleted_idx"
  ON "accommodation_posts"("schoolId", "isAvailable", "approvalStatus", "isDeleted");

DROP INDEX IF EXISTS "service_listings_schoolId_category_isActive_idx";
CREATE INDEX "service_listings_schoolId_category_isActive_approvalStatus_idx"
  ON "service_listings"("schoolId", "category", "isActive", "approvalStatus");
