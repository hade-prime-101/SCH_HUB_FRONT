/*
  Warnings:

  - Added the required column `createdById` to the `emergency_contacts` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `emergency_contacts` table without a default value. This is not possible if the table is not empty.
  - Added the required column `createdById` to the `map_locations` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `map_locations` table without a default value. This is not possible if the table is not empty.
  - Added the required column `createdById` to the `school_events` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `school_events` table without a default value. This is not possible if the table is not empty.
  - Added the required column `createdById` to the `timetable_entries` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "TimetableType" AS ENUM ('PERSONAL', 'DEPARTMENTAL', 'GENERAL');

-- CreateEnum
CREATE TYPE "TicketStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- AlterEnum
ALTER TYPE "ClassType" ADD VALUE 'TEST';

-- DropForeignKey
ALTER TABLE "timetable_entries" DROP CONSTRAINT "timetable_entries_userId_fkey";

-- AlterTable
ALTER TABLE "emergency_contacts" ADD COLUMN     "createdById" TEXT NOT NULL,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "map_locations" ADD COLUMN     "createdById" TEXT NOT NULL,
ADD COLUMN     "floor" TEXT,
ADD COLUMN     "tags" JSONB,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "school_events" ADD COLUMN     "accountName" TEXT,
ADD COLUMN     "accountNumber" TEXT,
ADD COLUMN     "bankName" TEXT,
ADD COLUMN     "createdById" TEXT NOT NULL,
ADD COLUMN     "imageUrl" TEXT,
ADD COLUMN     "requiresTicket" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "ticketPrice" DECIMAL(10,2),
ADD COLUMN     "ticketsSold" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "totalTickets" INTEGER,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "timetable_entries" ADD COLUMN     "createdById" TEXT NOT NULL,
ADD COLUMN     "departmentId" TEXT,
ADD COLUMN     "level" TEXT,
ADD COLUMN     "schoolId" TEXT,
ADD COLUMN     "timetableType" "TimetableType" NOT NULL DEFAULT 'PERSONAL',
ALTER COLUMN "userId" DROP NOT NULL;

-- CreateTable
CREATE TABLE "event_tickets" (
    "id" TEXT NOT NULL,
    "ticketRef" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "receiptUrl" TEXT NOT NULL,
    "receiptKey" TEXT NOT NULL,
    "status" "TicketStatus" NOT NULL DEFAULT 'PENDING',
    "qrCode" TEXT,
    "rejectionReason" TEXT,
    "approvedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "event_tickets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "event_reminders" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "notifyAt" TIMESTAMP(3) NOT NULL,
    "notificationSent" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "event_reminders_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "event_tickets_ticketRef_key" ON "event_tickets"("ticketRef");

-- CreateIndex
CREATE INDEX "event_tickets_eventId_status_idx" ON "event_tickets"("eventId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "event_tickets_userId_eventId_key" ON "event_tickets"("userId", "eventId");

-- CreateIndex
CREATE INDEX "event_reminders_notifyAt_notificationSent_idx" ON "event_reminders"("notifyAt", "notificationSent");

-- CreateIndex
CREATE UNIQUE INDEX "event_reminders_userId_eventId_key" ON "event_reminders"("userId", "eventId");

-- CreateIndex
CREATE INDEX "timetable_entries_departmentId_level_idx" ON "timetable_entries"("departmentId", "level");

-- CreateIndex
CREATE INDEX "timetable_entries_schoolId_idx" ON "timetable_entries"("schoolId");

-- AddForeignKey
ALTER TABLE "timetable_entries" ADD CONSTRAINT "timetable_entries_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "timetable_entries" ADD CONSTRAINT "timetable_entries_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "departments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "timetable_entries" ADD CONSTRAINT "timetable_entries_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "timetable_entries" ADD CONSTRAINT "timetable_entries_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "school_events" ADD CONSTRAINT "school_events_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "map_locations" ADD CONSTRAINT "map_locations_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "emergency_contacts" ADD CONSTRAINT "emergency_contacts_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_tickets" ADD CONSTRAINT "event_tickets_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_tickets" ADD CONSTRAINT "event_tickets_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "school_events"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_tickets" ADD CONSTRAINT "event_tickets_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_reminders" ADD CONSTRAINT "event_reminders_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_reminders" ADD CONSTRAINT "event_reminders_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "school_events"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
