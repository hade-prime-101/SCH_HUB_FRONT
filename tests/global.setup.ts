// ✅ No @/ imports here — global setup runs in Node context before Jest loads
import { execSync } from 'node:child_process';
import { config } from 'dotenv';
import { resolve } from 'node:path';

export default async function globalSetup(): Promise<void> {
  // ✅ Load .env first so TEST_DATABASE_URL is available
  config({ path: resolve(process.cwd(), '.env') });

  // ✅ Set test environment variables BEFORE any module imports
  process.env.NODE_ENV            = 'test';
  process.env.DATABASE_URL        =
    process.env.TEST_DATABASE_URL ??
    process.env.DATABASE_URL      ??
    'postgresql://postgres:postgres@localhost:5432/sch_hub_test';
  process.env.JWT_ACCESS_SECRET   = process.env.JWT_ACCESS_SECRET ?? 'test-access-secret-at-least-32-chars!!!';
  process.env.JWT_REFRESH_SECRET  = process.env.JWT_REFRESH_SECRET ?? 'test-refresh-secret-at-least-32-chars!!';

  const testDbUrl = process.env.DATABASE_URL;

  // ✅ Apply migrations to test database
  try {
    execSync('npx prisma migrate deploy', {
      stdio: 'inherit',
      env  : {
        ...process.env,
        DATABASE_URL            : testDbUrl,
        DIRECT_URL              : testDbUrl,
        // Prevent Prisma CLI from re-loading .env and overwriting DATABASE_URL
        PRISMA_DISABLE_DOTENV   : '1',
      },
    });
    console.log('✅ Test database migrations applied');
  } catch (err) {
    console.warn('⚠️  Migration skipped (no database available):', (err as Error).message?.split('\n')[0]);
  }
}