-- CreateEnum
CREATE TYPE "EmergencyCategory" AS ENUM ('SECURITY', 'CLINIC', 'STUDENT_AFFAIRS', 'OTHER');

-- AlterTable
ALTER TABLE "emergency_contacts"
  ADD COLUMN "category" "EmergencyCategory" NOT NULL DEFAULT 'OTHER',
  ADD COLUMN "whatsapp_number" TEXT;
