-- AlterEnum
ALTER TYPE "UserRole" ADD VALUE IF NOT EXISTS 'EVENT_ORCHESTRATOR';

-- AlterEnum
ALTER TYPE "EventType" ADD VALUE IF NOT EXISTS 'INFO_ONLY';

-- AlterTable
ALTER TABLE "school_events" ADD COLUMN "departmentId" TEXT,
ADD COLUMN "level" TEXT;

-- AlterTable
ALTER TABLE "user_settings" ADD COLUMN "whatsappOptIn" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "school_events_departmentId_level_startDate_idx" ON "school_events"("departmentId", "level", "startDate");

-- AddForeignKey
ALTER TABLE "school_events" ADD CONSTRAINT "school_events_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "departments"("id") ON DELETE SET NULL ON UPDATE CASCADE;
