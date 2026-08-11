/*
  Warnings:

  - You are about to drop the column `whatsapp_number` on the `emergency_contacts` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "JobType" AS ENUM ('INTERNSHIP', 'PART_TIME', 'CAMPUS_JOB', 'FREELANCE');

-- CreateEnum
CREATE TYPE "JobApprovalStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- AlterTable
ALTER TABLE "emergency_contacts" DROP COLUMN IF EXISTS "whatsapp_number",
ADD COLUMN IF NOT EXISTS "whatsappNumber" TEXT;

-- CreateTable
CREATE TABLE "job_listings" (
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
CREATE INDEX "job_listings_schoolId_approvalStatus_type_idx" ON "job_listings"("schoolId", "approvalStatus", "type");

-- CreateIndex
CREATE INDEX "job_listings_postedById_idx" ON "job_listings"("postedById");

-- AddForeignKey
ALTER TABLE "job_listings" ADD CONSTRAINT "job_listings_postedById_fkey" FOREIGN KEY ("postedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "job_listings" ADD CONSTRAINT "job_listings_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
