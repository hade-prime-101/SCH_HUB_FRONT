-- Add SLIDES to MaterialType enum
ALTER TYPE "MaterialType" ADD VALUE IF NOT EXISTS 'SLIDES';

-- Create MaterialVisibility enum
CREATE TYPE "MaterialVisibility" AS ENUM ('PUBLIC', 'DEPARTMENT', 'LEVEL', 'STUDY_GROUP', 'PRIVATE');

-- Add visibility and studyGroupId to materials
ALTER TABLE "materials"
  ADD COLUMN "visibility" "MaterialVisibility" NOT NULL DEFAULT 'PUBLIC',
  ADD COLUMN "studyGroupId" TEXT;

-- Index for visibility-based queries
CREATE INDEX "materials_visibility_departmentId_idx" ON "materials" ("visibility", "departmentId");
CREATE INDEX "materials_visibility_level_idx" ON "materials" ("visibility", "level");
