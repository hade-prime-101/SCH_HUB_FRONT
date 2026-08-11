// Runs in every Jest worker BEFORE any module is imported.
// Loads .env first so TEST_DATABASE_URL is available, then overrides
// for test mode so env.ts sees the correct values.
import { config } from 'dotenv';
import { resolve } from 'node:path';

config({ path: resolve(process.cwd(), '.env') });

process.env.NODE_ENV           = 'test';
process.env.DATABASE_URL       = process.env.TEST_DATABASE_URL
  ?? process.env.DATABASE_URL
  ?? 'postgresql://postgres:postgres@localhost:5432/sch_hub_test';
process.env.JWT_ACCESS_SECRET  = process.env.JWT_ACCESS_SECRET
  ?? 'test-access-secret-at-least-32-chars!!!';
process.env.JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET
  ?? 'test-refresh-secret-at-least-32-chars!!';
