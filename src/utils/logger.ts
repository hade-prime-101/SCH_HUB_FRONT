import { env } from '@/config/env.js';

type LogLevel = 'debug' | 'info' | 'warn' | 'error';
type LogMeta = Record<string, unknown>;

const LEVELS: Record<LogLevel, number> = { debug: 0, info: 1, warn: 2, error: 3 };
const MIN_LEVEL: LogLevel = env.NODE_ENV === 'production' ? 'info' : 'debug';

const sanitize = (s: string) => s.replace(/[\r\n\t\x00-\x1F\x7F]/g, ' ');

function normalize(value: unknown): unknown {
  if (value instanceof Error) {
    return { name: sanitize(value.name), message: sanitize(value.message) };
  }

  if (typeof value === 'string') return sanitize(value);

  if (typeof value === 'bigint') return value.toString();

  return value;
}

function safeJson(value: unknown) {
  const seen = new WeakSet<object>();
  return JSON.stringify(value, (_key, current) => {
    const normalized = normalize(current);
    if (normalized && typeof normalized === 'object') {
      if (seen.has(normalized)) return '[Circular]';
      seen.add(normalized);
    }
    return normalized;
  });
}

function write(level: LogLevel, message: string, meta?: LogMeta) {
  if (LEVELS[level] < LEVELS[MIN_LEVEL]) return;

  const entry = {
    ts: new Date().toISOString(),
    level,
    msg: message,
    ...(meta && Object.keys(meta).length > 0 ? { meta } : {}),
  };

  const out = env.NODE_ENV === 'production'
    ? safeJson(entry)
    : `[${entry.ts}] ${level.toUpperCase()} ${message.replace(/[\r\n\t\x00-\x1F\x7F]/g, ' ')}${meta ? ' ' + safeJson(meta) : ''}`;

  if (level === 'error' || level === 'warn') {
    process.stderr.write(out + '\n');
  } else {
    process.stdout.write(out + '\n');
  }
}

export const logger = {
  debug: (msg: string, meta?: LogMeta) => write('debug', msg, meta),
  info:  (msg: string, meta?: LogMeta) => write('info',  msg, meta),
  warn:  (msg: string, meta?: LogMeta) => write('warn',  msg, meta),
  error: (msg: string, meta?: LogMeta) => write('error', msg, meta),
};
