/*
  Warnings:

  - You are about to drop the column `idDocumentUrl` on the `agent_profiles` table. All the data in the column will be lost.
  - You are about to drop the column `whatsapp_number` on the `emergency_contacts` table. All the data in the column will be lost.
  - Added the required column `studentIdUrl` to the `agent_profiles` table without a default value. This is not possible if the table is not empty.

*/
-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "AuditAction" ADD VALUE 'MATERIAL_REVIEW_APPROVED';
ALTER TYPE "AuditAction" ADD VALUE 'MATERIAL_REVIEW_REJECTED';
ALTER TYPE "AuditAction" ADD VALUE 'AGENT_APPROVED';
ALTER TYPE "AuditAction" ADD VALUE 'AGENT_REJECTED';
ALTER TYPE "AuditAction" ADD VALUE 'LISTING_APPROVED';
ALTER TYPE "AuditAction" ADD VALUE 'LISTING_REJECTED';
ALTER TYPE "AuditAction" ADD VALUE 'ACCOMMODATION_APPROVED';
ALTER TYPE "AuditAction" ADD VALUE 'ACCOMMODATION_REJECTED';
ALTER TYPE "AuditAction" ADD VALUE 'SERVICE_APPROVED';
ALTER TYPE "AuditAction" ADD VALUE 'SERVICE_REJECTED';
ALTER TYPE "AuditAction" ADD VALUE 'JOB_APPROVED';
ALTER TYPE "AuditAction" ADD VALUE 'JOB_REJECTED';
ALTER TYPE "AuditAction" ADD VALUE 'REPORT_RESOLVED';

-- AlterEnum
ALTER TYPE "NotificationType" ADD VALUE 'TIMETABLE';

-- AlterTable
ALTER TABLE "accommodation_posts" ADD COLUMN     "deletedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "agent_profiles" DROP COLUMN "idDocumentUrl",
ADD COLUMN     "studentIdUrl" TEXT NOT NULL,
ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "emergency_contacts" DROP COLUMN "whatsapp_number";

-- AlterTable
ALTER TABLE "job_listings" ADD COLUMN     "deletedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "personal_study_sessions" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "service_listings" ADD COLUMN     "deletedAt" TIMESTAMP(3),
ALTER COLUMN "approvalStatus" SET DEFAULT 'PENDING';

-- AddForeignKey
ALTER TABLE "agent_profiles" ADD CONSTRAINT "agent_profiles_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- RenameIndex
ALTER INDEX "accommodation_posts_schoolId_isAvailable_approvalStatus_isDelet" RENAME TO "accommodation_posts_schoolId_isAvailable_approvalStatus_isD_idx";
