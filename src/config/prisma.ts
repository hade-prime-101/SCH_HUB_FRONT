import { PrismaClient, Prisma } from '@prisma/client';
import { env } from '@/config/env.js';
import { logger } from '@/utils/logger.js';

// ── Prisma Client ─────────────────────────────────────────────────────────

export const prisma = new PrismaClient({
  log: [
    // ✅ Only emit query events in development
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
 *
 * Attack example without sanitization:
 *   event.message = "ok\nERROR: Admin logged in as attacker"
 *   → Forges a second log line in the output
 */
function sanitizeLogValue(value: unknown): string {
  if (value === null || value === undefined) return '';

  const str = String(value);

  return str
    // Remove ANSI escape sequences (e.g. \x1B[31m red text \x1B[0m)
    .replace(/\x1B\[[0-9;]*[a-zA-Z]/g, '')
    // Remove all control characters including \r \n \t and null bytes
    .replace(/[\r\n\t\x00-\x1F\x7F]/g, ' ')
    // Collapse multiple spaces into one for clean log output
    .replace(/ {2,}/g, ' ')
    .trim();
}

/**
 * ✅ Sanitizes a full object's string values recursively
 * Prevents injection through nested properties
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
  // ✅ TS Fix: Explicit Prisma.QueryEvent type eliminates TS7006
  prisma.$on('query', (event: Prisma.QueryEvent) => {
    logger.debug('prisma_query', {
      durationMs : event.duration,
      // ✅ CWE-117: Sanitize query before logging
      // A malicious DB value could inject fake log entries
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

// ✅ TS Fix: Explicit Prisma.LogEvent type eliminates TS7006
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

// ── Error Logging ─────────────────────────────────────────────────────────

// ✅ TS Fix: Explicit Prisma.LogEvent type eliminates TS7006
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

// ── Graceful Shutdown ─────────────────────────────────────────────────────

/**
 * Ensures Prisma connection pool is properly closed on process exit.
 * Prevents connection leaks in containerized / serverless environments.
 */
async function disconnectPrisma(): Promise<void> {
  await prisma.$disconnect();
}

process.on('beforeExit', disconnectPrisma);
process.on('SIGINT',     disconnectPrisma);
process.on('SIGTERM',    disconnectPrisma);