import { Router, Request, Response, NextFunction } from 'express';
import multer from 'multer';
import path from 'node:path';
import crypto from 'node:crypto';
import { authenticate } from '@/middleware/authenticate.js';
import { AppError } from '@/utils/response.js';
import {
  askQuestion,
  createSession,
  deleteSession,
  generatePersonalQuiz,
  getSession,
  listSessions,
  submitPersonalQuiz,
} from '@/modules/ai/personal-study.controller.js';

// ── Constants ──────────────────────────────────────────────────────────────

const MAX_FILE_SIZE_BYTES = 20 * 1024 * 1024;          // 20 MB
const MAX_REQUEST_BODY_BYTES = 21 * 1024 * 1024;        // 21 MB (file + fields overhead)
const MAX_FILENAME_LENGTH = 100;
const MAX_FIELD_VALUE_LENGTH = 5000;                     // Prevent oversized field values
const MAX_FIELDS = 10;
const MAX_PARTS = 11;
const MAX_FILES = 1;

// ✅ CWE-22/23 Fix: Strict MIME allowlist — never derive type from filename extension
// Note: image types (jpeg/png/webp) are intentionally excluded — the AI features
// require extractable text, and there is no OCR pipeline. Accepting images and then
// rejecting them with a 422 downstream is confusing; block them at the gate instead.
const ALLOWED_MIME = new Set([
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'application/vnd.ms-powerpoint',
  'text/plain',
]);

// ✅ Map MIME → safe extension (never trust uploaded extension)
const MIME_TO_EXT: Record<string, string> = {
  'application/pdf': '.pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx',
  'application/msword': '.doc',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': '.pptx',
  'application/vnd.ms-powerpoint': '.ppt',
  'text/plain': '.txt',
};

// ── Filename Sanitizer ────────────────────────────────────────────────────

/**
 * ✅ CWE-22/23: Sanitizes filenames against path traversal attacks
 *
 * Defenses applied:
 * 1. Decode URI encoding (%2F, %5C) before processing
 * 2. Strip ALL directory separators (/, \, ..)
 * 3. Whitelist-only character set — alphanumeric, dash, underscore, dot
 * 4. Strip leading dots to prevent hidden file creation (.htaccess, .env)
 * 5. Enforce max length
 * 6. Replace extension with server-determined safe extension from MIME type
 * 7. Fallback to cryptographic random name if result is empty
 */
function sanitizeFilename(originalName: string, mimeType: string): string {
  // Step 1: Decode any URL-encoded traversal sequences
  let name: string;
  try {
    name = decodeURIComponent(originalName);
  } catch {
    name = originalName;
  }

  // Step 2: Also decode double-encoded sequences (%252F → %2F → /)
  try {
    name = decodeURIComponent(name);
  } catch {
    // Already fully decoded
  }

  // Step 3: Normalize Unicode to prevent homoglyph attacks
  name = name.normalize('NFKC');

  // Step 4: Extract basename only — removes any path components
  name = path.basename(name);

  // Step 5: Remove ALL path traversal sequences explicitly
  name = name
    .replace(/\.\./g, '')          // Remove double dots
    .replace(/[/\\]/g, '')         // Remove all forward/back slashes
    .replace(/[\x00-\x1f\x7f]/g, '') // Remove control characters
    .replace(/[^a-zA-Z0-9._-]/g, '_'); // Whitelist: alphanumeric, dot, dash, underscore

  // Step 6: Strip leading dots (prevents hidden files like .env, .htaccess)
  name = name.replace(/^\.+/, '');

  // Step 7: Remove extension from sanitized name — will be replaced by server-determined ext
  const nameWithoutExt = name.replace(/\.[^.]+$/, '') || '';

  // Step 8: Enforce max filename length (before extension)
  const truncatedName = nameWithoutExt.slice(0, MAX_FILENAME_LENGTH);

  // Step 9: Use server-determined safe extension from MIME type (never trust uploaded ext)
  const safeExt = MIME_TO_EXT[mimeType] || '';

  // Step 10: Generate cryptographic random name if sanitized result is empty
  const finalName = truncatedName || crypto.randomBytes(16).toString('hex');

  return `${finalName}${safeExt}`;
}

// ── Multer Configuration ──────────────────────────────────────────────────

const upload = multer({
  // ✅ Memory storage — no temp files written to disk with attacker-controlled names
  storage: multer.memoryStorage(),

  limits: {
    fileSize: MAX_FILE_SIZE_BYTES,   // ✅ CWE-770: Per-file size limit
    files: MAX_FILES,                // ✅ CWE-770: Max number of files
    fields: MAX_FIELDS,              // ✅ CWE-400: Max form fields
    parts: MAX_PARTS,                // ✅ CWE-400: Max total parts (files + fields)
    fieldSize: MAX_FIELD_VALUE_LENGTH, // ✅ CWE-400: Max field value size
    headerPairs: 100,                // ✅ CWE-400: Max header pairs
  },

  fileFilter: (_req, file, cb) => {
    // ✅ CWE-22/23: Validate MIME type against strict allowlist
    if (!ALLOWED_MIME.has(file.mimetype)) {
      return cb(
        new AppError(
          `File type '${file.mimetype}' is not allowed. Permitted: PDF, DOCX, PPTX, TXT`,
          400
        )
      );
    }

    // ✅ CWE-22/23: Replace filename with fully sanitized + server-determined version
    file.originalname = sanitizeFilename(file.originalname, file.mimetype);

    cb(null, true);
  },
});

// ── Request Size Limiter Middleware ───────────────────────────────────────

/**
 * ✅ CWE-770/400: Enforce Content-Length header limit BEFORE multer processes body
 * Prevents attackers from bypassing multer's fileSize limit via chunked encoding
 */
function limitRequestSize(req: Request, res: Response, next: NextFunction): void {
  const contentLength = parseInt(req.headers['content-length'] ?? '0', 10);

  if (contentLength > MAX_REQUEST_BODY_BYTES) {
    res.status(413).json({
      success: false,
      error: `Request entity too large. Maximum allowed: ${MAX_REQUEST_BODY_BYTES / (1024 * 1024)}MB`,
    });
    return;
  }

  // ✅ Track actual bytes received (defends against missing Content-Length header)
  let bytesReceived = 0;

  req.on('data', (chunk: Buffer) => {
    bytesReceived += chunk.length;
    if (bytesReceived > MAX_REQUEST_BODY_BYTES) {
      req.destroy(new AppError('Request body exceeded maximum allowed size', 413));
    }
  });

  next();
}

/**
 * ✅ CWE-770/400: Multer-specific error handler
 * Converts multer errors to structured API responses
 */
function handleMulterError(
  err: Error,
  _req: Request,
  res: Response,
  next: NextFunction
): void {
  if (err instanceof multer.MulterError) {
    const errorMap: Record<string, { status: number; message: string }> = {
      LIMIT_FILE_SIZE: {
        status: 413,
        message: `File too large. Maximum size: ${MAX_FILE_SIZE_BYTES / (1024 * 1024)}MB`,
      },
      LIMIT_FILE_COUNT: {
        status: 400,
        message: 'Too many files. Only one file allowed per request',
      },
      LIMIT_FIELD_COUNT: {
        status: 400,
        message: `Too many form fields. Maximum: ${MAX_FIELDS}`,
      },
      LIMIT_UNEXPECTED_FILE: {
        status: 400,
        message: 'Unexpected file field name',
      },
      LIMIT_PART_COUNT: {
        status: 400,
        message: 'Too many form parts',
      },
      LIMIT_FIELD_VALUE: {
        status: 400,
        message: 'Field value too large',
      },
    };

    const mapped = errorMap[err.code] ?? {
      status: 400,
      message: 'File upload error',
    };

    res.status(mapped.status).json({
      success: false,
      error: mapped.message,
    });
    return;
  }

  // Pass non-multer errors to global error handler
  next(err);
}

// ── Session ID Validator ──────────────────────────────────────────────────

/**
 * ✅ CWE-22/23: Validate sessionId path parameter
 * Prevents path traversal via route parameters (e.g., ../../admin)
 */
function validateSessionId(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const { sessionId } = req.params;

  // Accepts Prisma CUID (default) and UUID v4 (legacy)
  const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  const CUID_REGEX = /^c[a-z0-9]{24,}$/i;

  if (!sessionId || (!UUID_REGEX.test(sessionId) && !CUID_REGEX.test(sessionId))) {
    res.status(400).json({
      success: false,
      error: 'Invalid session ID format',
    });
    return;
  }

  next();
}

// ── Router ────────────────────────────────────────────────────────────────

export const personalStudyRoutes = Router();

// ✅ Authentication on all routes
personalStudyRoutes.use(authenticate);

// ── Sessions ───────────────────────────────────────────────────────────────

personalStudyRoutes.get('/sessions', listSessions);

personalStudyRoutes.post(
  '/sessions',
  limitRequestSize,                  // ✅ CWE-770: Check size BEFORE multer
  upload.single('file'),             // ✅ CWE-22: Sanitized filename + MIME check
  handleMulterError,                 // ✅ CWE-400: Structured multer error handling
  createSession
);

personalStudyRoutes.get(
  '/sessions/:sessionId',
  validateSessionId,                 // ✅ CWE-22/23: Validate path param
  getSession
);

personalStudyRoutes.delete(
  '/sessions/:sessionId',
  validateSessionId,                 // ✅ CWE-22/23: Validate path param
  deleteSession
);

// ── AI: Personalised Quiz ──────────────────────────────────────────────────

personalStudyRoutes.post(
  '/sessions/:sessionId/quiz/generate',
  validateSessionId,                 // ✅ CWE-22/23: Validate path param
  generatePersonalQuiz
);

personalStudyRoutes.post(
  '/sessions/:sessionId/quiz/submit',
  validateSessionId,                 // ✅ CWE-22/23: Validate path param
  submitPersonalQuiz
);

// ── AI: Ask Question ───────────────────────────────────────────────────────

personalStudyRoutes.post(
  '/sessions/:sessionId/ask',
  validateSessionId,                 // ✅ CWE-22/23: Validate path param
  askQuestion
);