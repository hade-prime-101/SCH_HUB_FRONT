/**
 * upload.ts — reusable multer upload middleware factory
 *
 * Provides secure, pre-configured multer instances for different upload contexts.
 * Security properties applied to every instance:
 *   - Memory storage (no temp files with attacker-controlled names on disk)
 *   - Strict MIME-type allowlist validated before any processing
 *   - Server-determined file extension (never trusts uploaded extension)
 *   - Per-file and total-request byte limits (CWE-770)
 *   - Field count / part count caps (CWE-400)
 *   - Filename sanitized against path traversal (CWE-22/23)
 *   - Request Content-Length pre-check before multer processes the body
 *   - Structured error responses for every multer error code
 */

import type { Request, Response, NextFunction } from 'express';
import multer from 'multer';
import path from 'node:path';
import crypto from 'node:crypto';
import { AppError } from '@/utils/response.js';

// ── MIME allowlists ───────────────────────────────────────────────────────

export const IMAGE_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
]);

const MIME_TO_EXT: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png':  '.png',
  'image/webp': '.webp',
};

// ── Filename sanitizer ────────────────────────────────────────────────────

/**
 * Sanitizes an uploaded filename and replaces its extension with a
 * server-determined safe extension derived from the validated MIME type.
 * Defends against CWE-22/23 path traversal, null bytes, ANSI injection,
 * Unicode homoglyph attacks, and hidden-file creation.
 */
function sanitizeImageFilename(originalName: string, mimeType: string): string {
  let name: string;

  // Decode URL-encoded and double-encoded sequences
  try { name = decodeURIComponent(originalName); } catch { name = originalName; }
  try { name = decodeURIComponent(name); }         catch { /* already decoded */ }

  // Normalize Unicode, extract basename, strip dangerous characters
  name = name.normalize('NFKC');
  name = path.basename(name);
  name = name
    .replace(/\.\./g, '')
    .replace(/[/\\]/g, '')
    .replace(/[\x00-\x1f\x7f]/g, '')
    .replace(/[^a-zA-Z0-9._-]/g, '_');
  name = name.replace(/^\.+/, '');

  // Remove extension — will be replaced by server-determined safe extension
  const stem = name.replace(/\.[^.]+$/, '').slice(0, 100);
  const safeExt = MIME_TO_EXT[mimeType] ?? '';
  const finalName = stem || crypto.randomBytes(16).toString('hex');

  return `${finalName}${safeExt}`;
}

// ── Request size pre-check middleware ─────────────────────────────────────

/**
 * Rejects requests whose Content-Length exceeds maxBytes BEFORE multer
 * processes the body. Guards against chunked-encoding bypass of multer limits.
 */
function limitRequestSize(maxBytes: number) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const contentLength = parseInt(req.headers['content-length'] ?? '0', 10);
    if (contentLength > maxBytes) {
      res.status(413).json({
        success: false,
        message: `Request entity too large. Maximum allowed: ${maxBytes / (1024 * 1024)}MB`,
      });
      return;
    }
    let bytesReceived = 0;
    req.on('data', (chunk: Buffer) => {
      bytesReceived += chunk.length;
      if (bytesReceived > maxBytes) {
        req.destroy(new AppError('Request body exceeded maximum allowed size', 413));
      }
    });
    next();
  };
}

// ── Multer error handler ──────────────────────────────────────────────────

export function handleMulterError(
  err: Error,
  _req: Request,
  res: Response,
  next: NextFunction,
): void {
  if (err instanceof multer.MulterError) {
    const errorMap: Record<string, { status: number; message: string }> = {
      LIMIT_FILE_SIZE:       { status: 413, message: 'File too large' },
      LIMIT_FILE_COUNT:      { status: 400, message: 'Too many files. Only one file allowed per request' },
      LIMIT_FIELD_COUNT:     { status: 400, message: 'Too many form fields' },
      LIMIT_UNEXPECTED_FILE: { status: 400, message: 'Unexpected file field name' },
      LIMIT_PART_COUNT:      { status: 400, message: 'Too many form parts' },
      LIMIT_FIELD_VALUE:     { status: 400, message: 'Field value too large' },
    };
    const mapped = errorMap[err.code] ?? { status: 400, message: 'File upload error' };
    res.status(mapped.status).json({ success: false, message: mapped.message });
    return;
  }
  next(err);
}

// ── Factory ───────────────────────────────────────────────────────────────

export interface ImageUploadOptions {
  /** Multer field name (default: 'image') */
  fieldName?: string;
  /** Per-file size limit in bytes (default: 5 MB) */
  maxFileSizeBytes?: number;
}

/**
 * Returns a tuple of [requestSizeLimiter, multerUpload, multerErrorHandler]
 * for use as route-level middleware.
 *
 * Usage:
 *   const [limitSize, upload, handleErr] = createImageUpload();
 *   router.post('/upload', limitSize, upload, handleErr, myController);
 */
export function createImageUpload(opts: ImageUploadOptions = {}) {
  const fieldName       = opts.fieldName       ?? 'image';
  const maxFileSizeBytes = opts.maxFileSizeBytes ?? 5 * 1024 * 1024;   // 5 MB
  const maxRequestBytes  = maxFileSizeBytes + 256 * 1024;              // file + fields overhead

  const uploader = multer({
    storage: multer.memoryStorage(),
    limits: {
      fileSize:    maxFileSizeBytes,
      files:       1,
      fields:      20,
      parts:       21,
      fieldSize:   10_000,
      headerPairs: 100,
    },
    fileFilter: (_req, file, cb) => {
      if (!IMAGE_MIME_TYPES.has(file.mimetype)) {
        return cb(new AppError(
          `File type '${file.mimetype}' is not allowed. Permitted: JPEG, PNG, WEBP`,
          400,
        ));
      }
      file.originalname = sanitizeImageFilename(file.originalname, file.mimetype);
      cb(null, true);
    },
  });

  return [
    limitRequestSize(maxRequestBytes),
    uploader.single(fieldName),
    handleMulterError,
  ] as const;
}
