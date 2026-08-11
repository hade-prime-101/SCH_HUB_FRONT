-- Material verification fields
ALTER TABLE "materials"
  ADD COLUMN IF NOT EXISTS "isVerified"   BOOLEAN      NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "verifiedAt"   TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "verifiedById" TEXT;
