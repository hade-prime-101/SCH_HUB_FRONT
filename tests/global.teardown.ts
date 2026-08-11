// ✅ Direct PrismaClient — no @/ alias needed here
import { PrismaClient } from '@prisma/client';
import { config } from 'dotenv';
import { resolve } from 'node:path';

export default async function globalTeardown(): Promise<void> {
  config({ path: resolve(process.cwd(), '.env') });

  const dbUrl = process.env.TEST_DATABASE_URL ?? process.env.DATABASE_URL;
  const prisma = new PrismaClient({
    datasources: { db: { url: dbUrl } },
  });

  try {
    // ✅ Clean test data in dependency order
    await prisma.$transaction([
      prisma.notification.deleteMany(),
      prisma.refreshToken.deleteMany(),
      prisma.material.deleteMany(),
      prisma.user.deleteMany(),
      prisma.school.deleteMany(),
    ]);
    console.log('✅ Test database cleaned');
  } catch (err) {
    // Teardown is best-effort — a missing DB is not fatal
    console.warn('⚠️  Teardown cleanup warning:', (err as Error).message?.split('\n')[0]);
  } finally {
    await prisma.$disconnect();
  }
}