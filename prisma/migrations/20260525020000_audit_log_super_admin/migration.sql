-- Audit Log migration

DO $$ BEGIN
  CREATE TYPE "AuditAction" AS ENUM (
    'ADMIN_CREATED', 'ADMIN_DELETED', 'ADMIN_DEACTIVATED', 'ADMIN_REACTIVATED',
    'ADMIN_PASSWORD_RESET', 'ROLE_ASSIGNED', 'COURSE_REP_NOMINATED',
    'USER_BLOCKED', 'USER_UNBLOCKED', 'MATERIAL_DELETED', 'MATERIAL_VERIFIED',
    'QUIZ_DELETED', 'POST_DELETED', 'LISTING_DELETED', 'SHOP_DELETED',
    'STUDY_GROUP_DELETED', 'SCHOOL_CREATED', 'SCHOOL_UPDATED'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "audit_logs" (
  "id"            TEXT         NOT NULL,
  "action"        "AuditAction" NOT NULL,
  "performedById" TEXT         NOT NULL,
  "targetUserId"  TEXT,
  "targetId"      TEXT,
  "targetType"    TEXT,
  "meta"          JSONB,
  "ipAddress"     TEXT,
  "createdAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "audit_logs_performedById_idx" ON "audit_logs"("performedById");
CREATE INDEX IF NOT EXISTS "audit_logs_action_idx"        ON "audit_logs"("action");
CREATE INDEX IF NOT EXISTS "audit_logs_createdAt_idx"     ON "audit_logs"("createdAt" DESC);

ALTER TABLE "audit_logs"
  ADD CONSTRAINT "audit_logs_performedById_fkey"
  FOREIGN KEY ("performedById") REFERENCES "users"("id") ON DELETE RESTRICT;

ALTER TABLE "audit_logs"
  ADD CONSTRAINT "audit_logs_targetUserId_fkey"
  FOREIGN KEY ("targetUserId") REFERENCES "users"("id") ON DELETE SET NULL;

-- Block column on users (for user blocking feature)
ALTER TABLE "users"
  ADD COLUMN IF NOT EXISTS "isBlocked"   BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "blockedAt"   TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "blockedById" TEXT;
