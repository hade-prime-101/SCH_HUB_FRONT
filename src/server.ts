import { initSentry } from '@/config/sentry.js';
initSentry();

import http from 'node:http';
import { app } from '@/app.js';
import { env } from '@/config/env.js';
import { prisma } from '@/config/prisma.js';
import { Sentry } from '@/config/sentry.js';
import { notificationQueue, aiSummaryQueue } from '@/jobs/queues.js';
import { scheduleEventReminders } from '@/jobs/event-reminder.job.js';
import { scheduleReminderNotifications } from '@/jobs/reminder-notification.job.js';
import { scheduleTimetableReminders } from '@/jobs/timetable-reminder.job.js';
import { initSocket } from '@/socket/socket.js';
import { logger } from '@/utils/logger.js';

import '@/jobs/ai-summary.job.js';
import '@/jobs/reminder-notification.job.js';
import '@/jobs/event-reminder.job.js';

// ── CWE-117: Log Injection Sanitizer ─────────────────────────────────────
/**
 * Strips characters that enable log injection attacks:
 *
 * Attack without sanitization:
 *   signal = "SIGTERM\nERROR shutdown_failed { signal: 'SIGTERM', error: 'pwned' }"
 *   → Forges an entirely fake ERROR log line below the real one
 *
 * Characters removed:
 *   \r \n   — newline injection (forge new log lines)
 *   \t      — tab injection (misalign structured logs)
 *   \x00    — null byte (truncate log parsers)
 *   \x01–\x1F — all other ASCII control characters
 *   \x7F    — DEL character
 *   \x1B    — ANSI escape (color/terminal manipulation)
 */
function sanitize(value: unknown): string {
  if (value === null || value === undefined) return '';

  const str = String(value);

  return str
    // ✅ Remove ANSI escape sequences (e.g. \x1B[31m....\x1B[0m)
    .replace(/\x1B\[[0-9;]*[a-zA-Z]/g, '')
    // ✅ Remove all control characters including \r \n \t \x00
    .replace(/[\r\n\t\x00-\x1F\x7F]/g, ' ')
    // ✅ Collapse multiple spaces into one
    .replace(/ {2,}/g, ' ')
    .trim();
}

/**
 * ✅ Extracts and sanitizes error message from unknown thrown values.
 * Prevents stack traces or multi-line error messages from injecting log lines.
 */
function sanitizeError(error: unknown): string {
  if (error instanceof Error) {
    // Only log message — never log full stack trace to output logs
    // Stack traces can contain user-controlled file paths or data
    return sanitize(error.message);
  }
  return sanitize(String(error));
}

/**
 * ✅ Sanitizes a signal name — signals are OS-defined but
 * could be spoofed in test/mock environments
 * Allows only valid POSIX signal name characters: uppercase letters + digits
 */
function sanitizeSignal(signal: unknown): string {
  const str = String(signal ?? '');
  // POSIX signal names are only uppercase letters and digits (SIGTERM, SIGINT, etc.)
  return /^[A-Z0-9_]{1,32}$/.test(str) ? str : 'UNKNOWN_SIGNAL';
}

/**
 * ✅ Sanitizes port number — ensures only a numeric value reaches the log
 * Prevents injection if PORT env var is misconfigured with non-numeric content
 */
function sanitizePort(port: unknown): number | string {
  const num = Number(port);
  return Number.isFinite(num) && num > 0 && num <= 65535 ? num : 'INVALID_PORT';
}

// ── Server Setup ──────────────────────────────────────────────────────────

const server = http.createServer(app);
initSocket(server);

let isShuttingDown = false;
let jobsTimer: NodeJS.Timeout | undefined;

// ── Database Check ────────────────────────────────────────────────────────

async function checkDb(): Promise<void> {
  await prisma.$queryRaw`SELECT 1`;
  logger.info('database_ready');
}

// ── Scheduled Jobs ────────────────────────────────────────────────────────

const JOB_NAMES = ['reminder', 'event-reminder', 'timetable-reminder'] as const;

async function runScheduledJobs(): Promise<void> {
  const results = await Promise.allSettled([
    scheduleReminderNotifications(),
    scheduleEventReminders(),
    scheduleTimetableReminders(),
  ]);

  results.forEach((result, index) => {
    if (result.status === 'rejected') {
      const job = JOB_NAMES[index];
      // ✅ CWE-117: sanitizeError() applied to job failure reason
      logger.error('scheduled_job_failed', {
        job,
        error: sanitizeError(result.reason),
      });
      Sentry.captureException(result.reason);
    }
  });
}

// ── Server Close Helper ───────────────────────────────────────────────────

async function closeServer(): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    server.close((err) => (err ? reject(err) : resolve()));
  });
}

// ── Graceful Shutdown ─────────────────────────────────────────────────────

async function shutdown(signal: string, exitCode = 0): Promise<void> {
  if (isShuttingDown) return;
  isShuttingDown = true;

  // ✅ CWE-117 Fix (Line 44): sanitizeSignal() prevents newline injection
  // via signal parameter before it reaches the logger
  const safeSignal = sanitizeSignal(signal);

  logger.info('shutdown_started', { signal: safeSignal });

  if (jobsTimer) clearInterval(jobsTimer);

  const forceExit = setTimeout(() => {
    // ✅ CWE-117: safeSignal already sanitized above — safe to reuse
    logger.error('shutdown_forced_timeout', { signal: safeSignal });
    process.exit(1);
  }, 15_000);
  forceExit.unref();

  try {
    server.closeIdleConnections?.();
    await closeServer();
    await Promise.allSettled([
      notificationQueue.close(),
      aiSummaryQueue.close(),
      prisma.$disconnect(),
      Sentry.close(2000),
    ]);
    // ✅ CWE-117: safeSignal reused — no raw values in log
    logger.info('shutdown_complete', { signal: safeSignal });
    process.exit(exitCode);
  } catch (err) {
    // ✅ CWE-117 Fix (Line 88): Both signal AND error sanitized
    logger.error('shutdown_failed', {
      signal: safeSignal,
      error: sanitizeError(err),
    });
    process.exit(1);
  }
}

// ── Process Event Handlers ────────────────────────────────────────────────

// ✅ CWE-117 Fix (Line 94): sanitizeError(reason) replaces raw reason logging
process.on('unhandledRejection', (reason: unknown) => {
  logger.error('unhandled_rejection', {
    error: sanitizeError(reason),
  });
  Sentry.captureException(reason);     // Sentry receives original (unsanitized) for debugging
  void shutdown('unhandledRejection', 1);
});

// ✅ CWE-117: err.message sanitized — stack trace never logged to output
process.on('uncaughtException', (err: Error) => {
  logger.error('uncaught_exception', {
    error: sanitizeError(err),
  });
  Sentry.captureException(err);        // Sentry receives full Error object for debugging
  void shutdown('uncaughtException', 1);
});

process.on('SIGINT',  () => void shutdown('SIGINT'));
process.on('SIGTERM', () => void shutdown('SIGTERM'));

// ── Startup ───────────────────────────────────────────────────────────────

checkDb()
  .then(() => {
    jobsTimer = setInterval(() => {
      void runScheduledJobs();
    }, 60_000);
    jobsTimer.unref();

    server.listen(env.PORT, () => {
      // ✅ CWE-117 Fix (Line 114): Both port and NODE_ENV sanitized
      // env.PORT could be a non-numeric string if misconfigured
      // env.NODE_ENV could contain injected content in compromised environments
      logger.info('api_listening', {
        port : sanitizePort(env.PORT),
        env  : sanitize(env.NODE_ENV),
      });
    });
  })
  .catch((err: unknown) => {
    // ✅ CWE-117: sanitizeError() applied to startup failure
    logger.error('startup_failed', {
      error: sanitizeError(err),
    });
    Sentry.captureException(err);
    process.exit(1);
  });