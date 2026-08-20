import { Router, Request, Response, NextFunction } from 'express';
import multer from 'multer';
import path from 'node:path';
import crypto from 'node:crypto';
import { authenticate } from '@/middleware/authenticate.js';
import { authorize } from '@/middleware/authorize.js';
import { AppError } from '@/utils/response.js';
import {
  getBookmarks,
  getMyMaterials,
  getMyProfile,
  getProfile,
  getSessions,
  getUserMaterials,
  registerFcmToken,
  revokeAllSessions,
  revokeSession,
  updateProfile,
  updateSettings,
  uploadAvatar,
  searchUsers,
  nominateCourseRep,
  assignRole,
  listUsers,
} from '@/modules/users/users.controller.js';

// ── Constants ─────────────────────────────────────────────────────────────

const MAX_AVATAR_SIZE_BYTES   = 5 * 1024 * 1024;    // 5 MB
const MAX_REQUEST_BYTES       = 6 * 1024 * 1024;    // 6 MB (file + fields overhead)
const MAX_FILENAME_LENGTH     = 100;
const MAX_FIELD_VALUE_SIZE    = 2_000;               // 2 KB per field value
const MAX_FIELDS              = 5;
const MAX_HEADER_PAIRS        = 100;

// ✅ CWE-22/23: Use Set for O(1) MIME lookup — never derive type from extension
const ALLOWED_AVATAR_MIME = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
]);

// ✅ Server-determined extensions — never trust uploaded extension
const MIME_TO_EXT: Record<string, string> = {
  'image/jpeg' : '.jpg',
  'image/png'  : '.png',
  'image/webp' : '.webp',
};

// ── CWE-22/23: Filename Sanitizer ─────────────────────────────────────────

/**
 * Fully sanitizes uploaded filenames against all path traversal vectors.
 *
 * Defends against:
 *   ../../../etc/passwd       → direct traversal
 *   ..%2F..%2Fetc%2Fpasswd   → URL-encoded traversal
 *   ..%252F (double-encoded)  → double URL-encoded traversal
 *   .htaccess / .env          → hidden/system file creation
 *   file\x00.jpg              → null byte injection
 *   \x1B[31mevil\x1B[0m      → ANSI terminal escape injection
 *   ｅｖｉｌ (homoglyph)       → Unicode normalization bypass
 */
function sanitizeFilename(originalName: string, mimeType: string): string {
  let name = originalName ?? '';

  // Step 1: Decode URL encoding — catches %2F, %5C traversal sequences
  try { name = decodeURIComponent(name); } catch { /* already decoded */ }

  // Step 2: Decode double-encoded sequences — catches %252F → %2F → /
  try { name = decodeURIComponent(name); } catch { /* already decoded */ }

  // Step 3: Normalize Unicode — prevents homoglyph bypass (ｅｖｉｌ → evil)
  name = name.normalize('NFKC');

  // Step 4: Strip ANSI escape sequences
  name = name.replace(/\x1B\[[0-9;]*[a-zA-Z]/g, '');

  // Step 5: Extract basename only — removes all directory components
  name = path.basename(name);

  // Step 6: Explicitly remove all traversal sequences
  name = name
    .replace(/\.\./g, '')               // Remove double dots
    .replace(/[/\\]/g, '')              // Remove all slashes
    .replace(/[\x00-\x1F\x7F]/g, '');  // Remove control chars + null bytes

  // Step 7: Whitelist — only alphanumeric, dash, underscore, dot
  name = name.replace(/[^a-zA-Z0-9._-]/g, '_');

  // Step 8: Strip leading dots — prevent hidden file creation (.env, .htaccess)
  name = name.replace(/^\.+/, '');

  // Step 9: Remove extension — replaced by server-determined safe extension
  const nameWithoutExt = name.replace(/\.[^.]+$/, '');

  // Step 10: Enforce max length
  const truncated = nameWithoutExt.slice(0, MAX_FILENAME_LENGTH);

  // Step 11: Use server-determined extension from MIME type — never from upload
  const safeExt = MIME_TO_EXT[mimeType] ?? '';

  // Step 12: Fallback to cryptographic random name if result is empty
  const finalName = truncated || crypto.randomBytes(16).toString('hex');

  return `${finalName}${safeExt}`;
}

// ── CWE-770/400: Request Size Limiter ────────────────────────────────────

/**
 * Enforces Content-Length limit BEFORE multer processes the body.
 * Defends against chunked transfer encoding bypass of multer limits.
 */
function limitRequestSize(maxBytes: number) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const contentLength = parseInt(req.headers['content-length'] ?? '0', 10);

    if (contentLength > maxBytes) {
      res.status(413).json({
        success : false,
        error   : `Request too large. Maximum: ${maxBytes / (1024 * 1024)}MB`,
      });
      return;
    }

    // Live byte counter — catches chunked encoding without Content-Length
    let bytesReceived = 0;
    req.on('data', (chunk: Buffer) => {
      bytesReceived += chunk.length;
      if (bytesReceived > maxBytes) {
        req.destroy(new AppError(`Request body exceeded size limit`, 413));
      }
    });

    next();
  };
}

// ── Multer Error Handler ──────────────────────────────────────────────────

function handleMulterError(
  err  : Error,
  _req : Request,
  res  : Response,
  next : NextFunction,
): void {
  if (err instanceof multer.MulterError) {
    const errorMap: Record<string, { status: number; message: string }> = {
      LIMIT_FILE_SIZE      : { status: 413, message: `Avatar too large. Max: ${MAX_AVATAR_SIZE_BYTES / (1024 * 1024)}MB` },
      LIMIT_FILE_COUNT     : { status: 400, message: 'Only one avatar file allowed' },
      LIMIT_FIELD_COUNT    : { status: 400, message: `Too many form fields. Max: ${MAX_FIELDS}` },
      LIMIT_PART_COUNT     : { status: 400, message: 'Too many form parts' },
      LIMIT_FIELD_VALUE    : { status: 400, message: `Field value too large. Max: ${MAX_FIELD_VALUE_SIZE} bytes` },
      LIMIT_UNEXPECTED_FILE: { status: 400, message: 'Unexpected file field name. Use "avatar"' },
    };
    const mapped = errorMap[err.code] ?? { status: 400, message: 'File upload error' };
    res.status(mapped.status).json({ success: false, error: mapped.message });
    return;
  }
  next(err);
}

// ── Multer Instance ───────────────────────────────────────────────────────

const upload = multer({
  // ✅ Memory storage — no temp files written to disk with user-controlled names
  storage : multer.memoryStorage(),

  limits: {
    fileSize    : MAX_AVATAR_SIZE_BYTES,  // ✅ 5MB per file
    files       : 1,                      // ✅ Max 1 file per request
    fields      : MAX_FIELDS,             // ✅ Max form fields
    parts       : MAX_FIELDS + 1,         // ✅ fields + 1 file
    fieldSize   : MAX_FIELD_VALUE_SIZE,   // ✅ Max field value size
    headerPairs : MAX_HEADER_PAIRS,       // ✅ Max header pairs
  },

  fileFilter: (_req, file, cb) => {
    // ✅ CWE-22/23: Validate MIME type against strict allowlist
    if (!ALLOWED_AVATAR_MIME.has(file.mimetype)) {
      return cb(new AppError('Only JPEG, PNG and WebP images are allowed', 400));
    }

    // ✅ CWE-22/23: Full sanitization + server-determined extension
    file.originalname = sanitizeFilename(file.originalname, file.mimetype);

    cb(null, true);
  },
});

// ── Route Parameter Validators ────────────────────────────────────────────

/**
 * ✅ CWE-22/23: Validates :id is a proper UUID v4.
 * Prevents path traversal via route params (e.g. ../../admin).
 *
 * Attack without validation:
 *   GET /users/../../admin/secrets
 *   → Controller receives raw traversal string
 *   → May reach unintended internal resources
 */
function validateUserId(
  req  : Request,
  res  : Response,
  next : NextFunction,
): void {
  const { id } = req.params;
  const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  const CUID_REGEX = /^c[a-z0-9]{24,}$/i;

  if (!id || (!UUID_REGEX.test(id) && !CUID_REGEX.test(id))) {
    res.status(400).json({ success: false, error: 'Invalid user ID format' });
    return;
  }
  next();
}

/**
 * ✅ CWE-22/23: Validates :sessionId is a proper CUID or UUID.
 * Prevents traversal via session ID parameter.
 */
function validateSessionId(
  req  : Request,
  res  : Response,
  next : NextFunction,
): void {
  const { sessionId } = req.params;
  const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  const CUID_REGEX = /^c[a-z0-9]{24,}$/i;

  if (!sessionId || (!UUID_REGEX.test(sessionId) && !CUID_REGEX.test(sessionId))) {
    res.status(400).json({ success: false, error: 'Invalid session ID format' });
    return;
  }
  next();
}

// ── Router ────────────────────────────────────────────────────────────────

export const usersRoutes = Router();

// ✅ Authentication required on all routes
usersRoutes.use(authenticate);

// ── Profile ───────────────────────────────────────────────────────────────

usersRoutes.get('/me', getMyProfile);

// ✅ CWE-22/23: validateUserId before getProfile — blocks traversal via :id
usersRoutes.get('/:id', validateUserId, getProfile);

usersRoutes.patch('/me/profile', updateProfile);

usersRoutes.post(
  '/me/avatar',
  limitRequestSize(MAX_REQUEST_BYTES),  // ✅ Size check before multer
  upload.single('avatar'),              // ✅ Sanitized filename + MIME check
  handleMulterError,                    // ✅ Structured multer error response
  uploadAvatar,
);

// ── Settings ──────────────────────────────────────────────────────────────

usersRoutes.patch('/me/settings', updateSettings);

// ── FCM ───────────────────────────────────────────────────────────────────

usersRoutes.post('/me/fcm-token', registerFcmToken);

// ── Bookmarks & Materials ─────────────────────────────────────────────────

usersRoutes.get('/me/bookmarks',  getBookmarks);
usersRoutes.get('/me/materials',  getMyMaterials);

// ✅ CWE-22/23: validateUserId before getUserMaterials
usersRoutes.get('/:id/materials', validateUserId, getUserMaterials);

// ── Sessions (Security) ───────────────────────────────────────────────────

usersRoutes.get('/me/sessions', getSessions);

// ✅ CWE-22/23: validateSessionId before revokeSession
usersRoutes.delete('/me/sessions/:sessionId', validateSessionId, revokeSession);

usersRoutes.delete('/me/sessions', revokeAllSessions);

// ── Roles (Admin) ─────────────────────────────────────────────────────────

usersRoutes.get(
  '/search',
  authorize('SCHOOL_ADMIN', 'SUPER_ADMIN'),
  searchUsers,
);

usersRoutes.get(
  '/',
  authorize('SCHOOL_ADMIN', 'SUPER_ADMIN'),
  listUsers,
);

usersRoutes.patch(
  '/nominate-course-rep',
  authorize('SCHOOL_ADMIN', 'SUPER_ADMIN'),
  nominateCourseRep,
);

usersRoutes.patch(
  '/assign-role',
  authorize('SCHOOL_ADMIN', 'SUPER_ADMIN'),
  assignRole,
);