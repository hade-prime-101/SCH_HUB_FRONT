-- CreateEnum (idempotent)
DO $$ BEGIN
  CREATE TYPE "JobType" AS ENUM ('INTERNSHIP', 'PART_TIME', 'CAMPUS_JOB', 'FREELANCE');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE "JobApprovalStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- CreateTable
CREATE TABLE IF NOT EXISTS "job_listings" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "type" "JobType" NOT NULL,
    "pay" TEXT,
    "location" TEXT NOT NULL,
    "whatsapp" TEXT NOT NULL,
    "approvalStatus" "JobApprovalStatus" NOT NULL DEFAULT 'PENDING',
    "rejectionReason" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "postedById" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "job_listings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "job_listings_schoolId_approvalStatus_type_idx" ON "job_listings"("schoolId", "approvalStatus", "type");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "job_listings_postedById_idx" ON "job_listings"("postedById");

-- AddForeignKey
ALTER TABLE "job_listings" DROP CONSTRAINT IF EXISTS "job_listings_postedById_fkey";
ALTER TABLE "job_listings" ADD CONSTRAINT "job_listings_postedById_fkey" FOREIGN KEY ("postedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "job_listings" DROP CONSTRAINT IF EXISTS "job_listings_schoolId_fkey";
ALTER TABLE "job_listings" ADD CONSTRAINT "job_listings_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
