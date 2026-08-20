-- Phase 6: Reminders + Planner + Notification Preferences

-- Add notification preference columns to user_settings
ALTER TABLE "user_settings"
  ADD COLUMN IF NOT EXISTS "reminderPush"         BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS "eventPush"            BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS "announcementPush"     BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS "quietHoursEnabled"    BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "quietHoursStart"      TEXT    NOT NULL DEFAULT '22:00',
  ADD COLUMN IF NOT EXISTS "quietHoursEnd"        TEXT    NOT NULL DEFAULT '07:00';

-- Add recurring fields to reminders
ALTER TABLE "reminders"
  ADD COLUMN IF NOT EXISTS "isRecurring"   BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "recurringDays" JSONB;

-- PlannerSourceType enum
DO $$ BEGIN
  CREATE TYPE "PlannerSourceType" AS ENUM ('TIMETABLE', 'REMINDER', 'EVENT', 'DEPT_REMINDER');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- PlannerEntry table
CREATE TABLE IF NOT EXISTS "planner_entries" (
  "id"         TEXT        NOT NULL,
  "userId"     TEXT        NOT NULL,
  "title"      TEXT        NOT NULL,
  "sourceType" "PlannerSourceType" NOT NULL,
  "sourceId"   TEXT        NOT NULL,
  "date"       TIMESTAMP(3) NOT NULL,
  "startTime"  TEXT,
  "endTime"    TEXT,
  "isAllDay"   BOOLEAN     NOT NULL DEFAULT true,
  "isDone"     BOOLEAN     NOT NULL DEFAULT false,
  "createdAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"  TIMESTAMP(3) NOT NULL,

  CONSTRAINT "planner_entries_pkey" PRIMARY KEY ("id")
);

-- Unique constraint: one planner entry per source record per user
ALTER TABLE "planner_entries"
  ADD CONSTRAINT "planner_entries_userId_sourceType_sourceId_key"
  UNIQUE ("userId", "sourceType", "sourceId");

-- Index for fast today/weekly queries
CREATE INDEX IF NOT EXISTS "planner_entries_userId_date_idx"
  ON "planner_entries"("userId", "date");

-- Foreign key to users
ALTER TABLE "planner_entries"
  ADD CONSTRAINT "planner_entries_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE;
