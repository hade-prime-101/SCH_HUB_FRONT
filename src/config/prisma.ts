import { PrismaClient, Prisma } from '@prisma/client';
import { env } from '@/config/env.js';
import { logger } from '@/utils/logger.js';

// ── Main Prisma Client (for web requests) ──────────────────

export const prisma = new PrismaClient({
  log: [
    ...(env.NODE_ENV === 'development'
      ? [{ emit: 'event' as const, level: 'query' as const }]
      : []),
    { emit: 'event' as const, level: 'warn'  as const },
    { emit: 'event' as const, level: 'error' as const },
  ],
});

// ── Jobs Prisma Client (for scheduled tasks) ───────────────
//
// Uses a separate connection string to bypass connection poolers.
// Supports any database provider:
//   - Supabase: Use DIRECT_URL (bypasses transaction pooler)
//   - AWS RDS, DigitalOcean, Railway, etc: Use direct connection URL
//
// Configure in .env:
//   DATABASE_URL_JOBS=postgresql://... (optional, falls back to DIRECT_URL)

const jobsDatabaseUrl = process.env.DATABASE_URL_JOBS || process.env.DIRECT_URL || process.env.DATABASE_URL;

export const prismaJobs = new PrismaClient({
  datasources: {
    db: {
      url: jobsDatabaseUrl,
    },
  },
  log: [
    ...(env.NODE_ENV === 'development'
      ? [{ emit: 'event' as const, level: 'query' as const }]
      : []),
    { emit: 'event' as const, level: 'warn'  as const },
    { emit: 'event' as const, level: 'error' as const },
  ],
});

// ── CWE-117: Log Injection Sanitizer ─────────────────────────────────────

/**
 * ✅ CWE-117 Fix: Strips all characters that could inject
 * fake log entries, ANSI escape sequences, null bytes,
 * carriage returns, newlines, and other control characters.
 */
function sanitizeLogValue(value: unknown): string {
  if (value === null || value === undefined) return '';

  const str = String(value);

  return str
    .replace(/\x1B\[[0-9;]*[a-zA-Z]/g, '')
    .replace(/[\r\n\t\x00-\x1F\x7F]/g, ' ')
    .replace(/ {2,}/g, ' ')
    .trim();
}

/**
 * ✅ Sanitizes a full object's string values recursively
 */
function sanitizeLogObject(
  obj: Record<string, unknown>
): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(obj).map(([key, value]) => [
      key,
      typeof value === 'string' ? sanitizeLogValue(value) : value,
    ])
  );
}

// ── Query Logging (Development Only) ─────────────────────────────────────

if (env.NODE_ENV === 'development') {
  prisma.$on('query', (event: Prisma.QueryEvent) => {
    logger.debug('prisma_query', {
      durationMs : event.duration,
      query      : sanitizeLogValue(event.query),
      params     : sanitizeLogValue(event.params),
      target     : sanitizeLogValue(event.target),
      timestamp  : event.timestamp instanceof Date
        ? event.timestamp.toISOString()
        : sanitizeLogValue(String(event.timestamp)),
    });
  });

  prismaJobs.$on('query', (event: Prisma.QueryEvent) => {
    logger.debug('prisma_jobs_query', {
      durationMs : event.duration,
      query      : sanitizeLogValue(event.query),
      params     : sanitizeLogValue(event.params),
      target     : sanitizeLogValue(event.target),
      timestamp  : event.timestamp instanceof Date
        ? event.timestamp.toISOString()
        : sanitizeLogValue(String(event.timestamp)),
    });
  });
}

// ── Warn Logging ──────────────────────────────────────────────────────────

prisma.$on('warn', (event: Prisma.LogEvent) => {
  logger.warn(
    'prisma_warn',
    sanitizeLogObject({
      message   : event.message,
      target    : event.target,
      timestamp : event.timestamp instanceof Date
        ? event.timestamp.toISOString()
        : String(event.timestamp),
    })
  );
});

prismaJobs.$on('warn', (event: Prisma.LogEvent) => {
  logger.warn(
    'prisma_jobs_warn',
    sanitizeLogObject({
      message   : event.message,
      target    : event.target,
      timestamp : event.timestamp instanceof Date
        ? event.timestamp.toISOString()
        : String(event.timestamp),
    })
  );
});

// ── Error Logging ─────────────────────────────────────────────────────────

prisma.$on('error', (event: Prisma.LogEvent) => {
  logger.error(
    'prisma_error',
    sanitizeLogObject({
      message   : event.message,
      target    : event.target,
      timestamp : event.timestamp instanceof Date
        ? event.timestamp.toISOString()
        : String(event.timestamp),
    })
  );
});

prismaJobs.$on('error', (event: Prisma.LogEvent) => {
  logger.error(
    'prisma_jobs_error',
    sanitizeLogObject({
      message   : event.message,
      target    : event.target,
      timestamp : event.timestamp instanceof Date
        ? event.timestamp.toISOString()
        : String(event.timestamp),
    })
  );
});

// ── Graceful Shutdown ─────────────────────────────────────────────────────

async function disconnectPrisma(): Promise<void> {
  await Promise.all([prisma.$disconnect(), prismaJobs.$disconnect()]);
}

process.on('beforeExit', disconnectPrisma);
process.on('SIGINT',     disconnectPrisma);
process.on('SIGTERM',    disconnectPrisma);