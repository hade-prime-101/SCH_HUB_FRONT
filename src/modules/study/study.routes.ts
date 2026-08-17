import { Router, Request, Response, NextFunction } from 'express';
import multer from 'multer';
import path from 'node:path';
import crypto from 'node:crypto';
import { authenticate } from '@/middleware/authenticate.js';
import { authorize } from '@/middleware/authorize.js';
import { AppError } from '@/utils/response.js';
import {
  adminDeleteMaterial,
  approveQuizQuestions,
  bulkUploadMaterials,
  createQuiz,
  deleteMaterial,
  deleteQuiz,
  generateQuizFromMaterial,
  getAdminQuizAnalytics,
  getDownloadUrl,
  getMaterial,
  getMyAnalytics,
  getOverview,
  getQuiz,
  getQuizAttempts,
  incrementDownload,
  listMaterials,
  listPendingReviewMaterials,
  listQuizzes,
  previewExtraction,
  publishQuiz,
  rateMaterial,
  reviewMaterial,
  submitQuizAttempt,
  toggleBookmark,
  updateQuiz,
  updateVisibility,
  uploadMaterial,
  verifyMaterial,
} from '@/modules/study/study.controller.js';

// ── Constants ─────────────────────────────────────────────────────────────

const FILE_SIZE_LIMIT       = 20 * 1024 * 1024;   // 20 MB per file
const SINGLE_REQUEST_LIMIT  = 21 * 1024 * 1024;   // 21 MB (file + fields overhead)
const BULK_REQUEST_LIMIT    = 205 * 1024 * 1024;  // ~205 MB (10 files × 20MB + overhead)
const MAX_FILENAME_LENGTH   = 100;
const MAX_FIELD_VALUE_SIZE  = 5_000;               // 5 KB per field value
const MAX_FIELDS            = 10;
const MAX_HEADER_PAIRS      = 100;

// ✅ CWE-22/23: Use Set for O(1) lookup — never derive type from file extension
const ALLOWED_MIME = new Set([
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'application/vnd.ms-powerpoint',
  'text/plain',
  'image/jpeg',
  'image/png',
  'image/webp',
]);

// ✅ CWE-22/23: Server-determined extensions — never trust uploaded extension
const MIME_TO_EXT: Record<string, string> = {
  'application/pdf'     : '.pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx',
  'application/msword'  : '.doc',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': '.pptx',
  'application/vnd.ms-powerpoint': '.ppt',
  'text/plain'          : '.txt',
  'image/jpeg'          : '.jpg',
  'image/png'           : '.png',
  'image/webp'          : '.webp',
};

// ── CWE-22/23: Filename Sanitizer ─────────────────────────────────────────

/**
 * Fully sanitizes uploaded filenames against path traversal attacks.
 *
 * Attack vectors defended against:
 *   ../../../etc/passwd       → direct traversal
 *   ..%2F..%2Fetc%2Fpasswd   → URL-encoded traversal
 *   ..%252F (double encoded)  → double URL-encoded traversal
 *   .htaccess / .env          → hidden/system file creation
 *   file\x00.pdf              → null byte injection
 *   \x1B[31mevil\x1B[0m      → ANSI escape sequences
 *   ＿evil (Unicode homoglyph) → Unicode normalization bypass
 */
function sanitizeFilename(originalName: string, mimeType: string): string {
  let name = originalName ?? '';

  // Step 1: Decode URL encoding — catch %2F, %5C traversal sequences
  try { name = decodeURIComponent(name); } catch { /* already decoded */ }

  // Step 2: Decode double-encoded sequences — catch %252F → %2F → /
  try { name = decodeURIComponent(name); } catch { /* already decoded */ }

  // Step 3: Normalize Unicode — prevent homoglyph bypass (ｅｖｉｌ → evil)
  name = name.normalize('NFKC');

  // Step 4: Strip ANSI escape sequences
  name = name.replace(/\x1B\[[0-9;]*[a-zA-Z]/g, '');

  // Step 5: Extract basename only — removes directory components
  name = path.basename(name);

  // Step 6: Explicitly remove all traversal sequences
  name = name
    .replace(/\.\./g, '')              // Remove double dots
    .replace(/[/\\]/g, '')             // Remove all slashes
    .replace(/[\x00-\x1F\x7F]/g, ''); // Remove control chars + null bytes

  // Step 7: Whitelist — only alphanumeric, dash, underscore, dot
  name = name.replace(/[^a-zA-Z0-9._-]/g, '_');

  // Step 8: Strip leading dots — prevent hidden file creation (.env, .htaccess)
  name = name.replace(/^\.+/, '');

  // Step 9: Remove extension — will be replaced with server-determined safe ext
  const nameWithoutExt = name.replace(/\.[^.]+$/, '');

  // Step 10: Enforce max length
  const truncated = nameWithoutExt.slice(0, MAX_FILENAME_LENGTH);

  // Step 11: Use safe server-determined extension from MIME type
  const safeExt = MIME_TO_EXT[mimeType] ?? '';

  // Step 12: Fallback to cryptographic random name if result is empty
  const finalName = truncated || crypto.randomBytes(16).toString('hex');

  return `${finalName}${safeExt}`;
}

// ── CWE-770/400: Request Size Limiter ────────────────────────────────────

/**
 * Enforces Content-Length limit BEFORE multer processes the body.
 *
 * Why needed in addition to multer limits:
 *   - Multer's fileSize limit applies AFTER parsing begins
 *   - Chunked transfer encoding can bypass Content-Length header checks
 *   - This middleware catches oversized requests at the earliest point
 *   - Live byte counter catches chunked encoding bypass attempts
 */
function limitRequestSize(maxBytes: number) {
  return (req: Request, res: Response, next: NextFunction): void => {
    // Check declared Content-Length header first (fast path)
    const contentLength = parseInt(req.headers['content-length'] ?? '0', 10);
    if (contentLength > maxBytes) {
      res.status(413).json({
        success : false,
        error   : `Request too large. Maximum: ${maxBytes / (1024 * 1024)}MB`,
      });
      return;
    }

    // Live byte counter — defends against chunked encoding without Content-Length
    let bytesReceived = 0;
    req.on('data', (chunk: Buffer) => {
      bytesReceived += chunk.length;
      if (bytesReceived > maxBytes) {
        req.destroy(
          new AppError(`Request body exceeded ${maxBytes / (1024 * 1024)}MB limit`, 413)
        );
      }
    });

    next();
  };
}

// ── CWE-770/400: Multer Error Handler ────────────────────────────────────

/**
 * Converts multer errors into structured JSON responses.
 * Must be registered AFTER the multer middleware on each route.
 */
function handleMulterError(
  err: Error,
  _req: Request,
  res: Response,
  next: NextFunction,
): void {
  if (err instanceof multer.MulterError) {
    const errorMap: Record<string, { status: number; message: string }> = {
      LIMIT_FILE_SIZE     : { status: 413, message: `File too large. Max: ${FILE_SIZE_LIMIT / (1024 * 1024)}MB` },
      LIMIT_FILE_COUNT    : { status: 400, message: 'Too many files uploaded' },
      LIMIT_FIELD_COUNT   : { status: 400, message: `Too many form fields. Max: ${MAX_FIELDS}` },
      LIMIT_PART_COUNT    : { status: 400, message: 'Too many form parts' },
      LIMIT_FIELD_VALUE   : { status: 400, message: `Field value too large. Max: ${MAX_FIELD_VALUE_SIZE} bytes` },
      LIMIT_UNEXPECTED_FILE: { status: 400, message: 'Unexpected file field name' },
    };
    const mapped = errorMap[err.code] ?? { status: 400, message: 'File upload error' };
    res.status(mapped.status).json({ success: false, error: mapped.message });
    return;
  }
  next(err);
}

// ── Multer Instances ──────────────────────────────────────────────────────

// ✅ fileFilter shared — DRY and consistent between both instances
function createFileFilter(): multer.Options['fileFilter'] {
  return (_req, file, cb) => {
    // ✅ CWE-22/23: Validate MIME type against strict allowlist
    if (!ALLOWED_MIME.has(file.mimetype)) {
      return cb(new AppError(
        'Only PDF, DOCX, PPTX, TXT, JPEG, PNG, WEBP files are allowed', 400
      ));
    }

    // ✅ CWE-22/23: Fully sanitized + server-determined extension
    file.originalname = sanitizeFilename(file.originalname, file.mimetype);

    cb(null, true);
  };
}

// Single file upload (materials, preview)
const upload = multer({
  storage : multer.memoryStorage(),
  limits  : {
    fileSize    : FILE_SIZE_LIMIT,      // ✅ CWE-770: 20MB per file
    files       : 1,                    // ✅ CWE-770: Max 1 file
    fields      : MAX_FIELDS,           // ✅ CWE-400: Max form fields
    parts       : MAX_FIELDS + 1,       // ✅ CWE-400: Fields + 1 file
    fieldSize   : MAX_FIELD_VALUE_SIZE, // ✅ CWE-400: Max field value size
    headerPairs : MAX_HEADER_PAIRS,     // ✅ CWE-400: Max header pairs
  },
  fileFilter: createFileFilter(),
});

// Bulk file upload (up to 10 files)
const bulkUpload = multer({
  storage : multer.memoryStorage(),
  limits  : {
    fileSize    : FILE_SIZE_LIMIT,      // ✅ CWE-770: 20MB per file
    files       : 10,                   // ✅ CWE-770: Max 10 files
    fields      : MAX_FIELDS,           // ✅ CWE-400: Max form fields
    parts       : MAX_FIELDS + 10,      // ✅ CWE-400: Fields + 10 files
    fieldSize   : MAX_FIELD_VALUE_SIZE, // ✅ CWE-400: Max field value size
    headerPairs : MAX_HEADER_PAIRS,     // ✅ CWE-400: Max header pairs
  },
  fileFilter: createFileFilter(),
});

// ── ID Parameter Validator ────────────────────────────────────────────────

/**
 * ✅ CWE-22/23: Validates :id route parameters are proper CUIDs or UUIDs.
 * Prevents path traversal via route params (e.g. ../../admin).
 *
 * Prisma uses CUID by default (e.g. cmsgdk49d0000mefpde2pxun9).
 * UUID regex kept for backward-compatibility with any legacy records.
 */
const _UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const _CUID_REGEX = /^c[a-z0-9]{24,}$/i;

function validateId(req: Request, res: Response, next: NextFunction): void {
  const { id } = req.params;

  if (!id || (!_UUID_REGEX.test(id) && !_CUID_REGEX.test(id))) {
    res.status(400).json({ success: false, error: 'Invalid resource ID format' });
    return;
  }
  next();
}

// ── Router ────────────────────────────────────────────────────────────────

export const studyRoutes = Router();
studyRoutes.use(authenticate);

// ── Materials ─────────────────────────────────────────────────────────────

studyRoutes.post(
  '/materials/extract-preview',
  limitRequestSize(SINGLE_REQUEST_LIMIT),       // ✅ CWE-770: Size check before multer
  upload.single('file'),                         // ✅ CWE-22: Sanitized filename
  handleMulterError,                             // ✅ CWE-400: Structured error response
  previewExtraction,
);

studyRoutes.get('/materials', listMaterials);

studyRoutes.post(
  '/materials',
  limitRequestSize(SINGLE_REQUEST_LIMIT),       // ✅ CWE-770: Size check before multer
  upload.single('file'),                         // ✅ CWE-22: Sanitized filename
  handleMulterError,                             // ✅ CWE-400: Structured error response
  uploadMaterial,
);

studyRoutes.post(
  '/materials/bulk',
  limitRequestSize(BULK_REQUEST_LIMIT),          // ✅ CWE-770: Larger limit for bulk
  bulkUpload.array('files', 10),                 // ✅ CWE-22: Sanitized filenames
  handleMulterError,                             // ✅ CWE-400: Structured error response
  bulkUploadMaterials,
);

studyRoutes.get(   '/materials/:id',                   validateId, getMaterial);
studyRoutes.patch( '/materials/:id/visibility',         validateId, updateVisibility);
studyRoutes.delete('/materials/:id',                   validateId, deleteMaterial);

studyRoutes.delete(
  '/materials/:id/admin',
  validateId,
  authorize('SCHOOL_ADMIN', 'SUPER_ADMIN'),
  adminDeleteMaterial,
);

studyRoutes.patch(
  '/materials/:id/verify',
  validateId,
  authorize('SCHOOL_ADMIN', 'SUPER_ADMIN'),
  verifyMaterial,
);

studyRoutes.post('/materials/:id/download',     validateId, incrementDownload);
studyRoutes.get( '/materials/:id/download-url', validateId, getDownloadUrl);
studyRoutes.post('/materials/:id/rate',         validateId, rateMaterial);
studyRoutes.post('/materials/:id/bookmark',     validateId, toggleBookmark);

// ── Material Review ───────────────────────────────────────────────────────

studyRoutes.get(
  '/materials/review/pending',
  authorize('COURSE_REP', 'SCHOOL_ADMIN', 'SUPER_ADMIN'),
  listPendingReviewMaterials,
);

studyRoutes.patch(
  '/materials/:id/review',
  validateId,
  authorize('COURSE_REP', 'SCHOOL_ADMIN', 'SUPER_ADMIN'),
  reviewMaterial,
);

// ── Quizzes ───────────────────────────────────────────────────────────────

studyRoutes.get('/quizzes', listQuizzes);

studyRoutes.post(
  '/quizzes',
  authorize('COURSE_REP', 'AUTHORIZED_UPLOADER', 'SCHOOL_ADMIN', 'SUPER_ADMIN'),
  createQuiz,
);

studyRoutes.post('/quizzes/generate', generateQuizFromMaterial);

studyRoutes.get(   '/quizzes/:id',         validateId, getQuiz);
studyRoutes.post(  '/quizzes/:id/attempt', validateId, submitQuizAttempt);
studyRoutes.get(   '/quizzes/:id/attempts',validateId, getQuizAttempts);

studyRoutes.patch(
  '/quizzes/:id',
  validateId,
  authorize('COURSE_REP', 'AUTHORIZED_UPLOADER', 'SCHOOL_ADMIN', 'SUPER_ADMIN'),
  updateQuiz,
);

studyRoutes.patch('/quizzes/:id/publish', validateId, publishQuiz);

studyRoutes.patch(
  '/quizzes/:id/approve',
  validateId,
  authorize('COURSE_REP', 'SCHOOL_ADMIN', 'SUPER_ADMIN'),
  approveQuizQuestions,
);

studyRoutes.delete(
  '/quizzes/:id',
  validateId,
  authorize('COURSE_REP', 'SCHOOL_ADMIN', 'SUPER_ADMIN'),
  deleteQuiz,
);

// ── Analytics ─────────────────────────────────────────────────────────────

studyRoutes.get('/analytics/me', getMyAnalytics);
studyRoutes.get('/overview', getOverview);

studyRoutes.get(
  '/analytics/admin',
  authorize('SCHOOL_ADMIN', 'SUPER_ADMIN'),
  getAdminQuizAnalytics,
);