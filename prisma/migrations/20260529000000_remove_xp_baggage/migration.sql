-- Drop the XP tables and user-level XP fields now that XP has been removed from the app.
DROP TABLE IF EXISTS "xp_transactions";
DROP TABLE IF EXISTS "user_badges";
ALTER TABLE "users" DROP COLUMN IF EXISTS "reputationScore";
ALTER TABLE "users" DROP COLUMN IF EXISTS "badges";
DROP TYPE IF EXISTS "XPAction";
