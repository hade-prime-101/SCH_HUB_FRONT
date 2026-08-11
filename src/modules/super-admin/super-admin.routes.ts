import { Router, Request, Response, NextFunction } from 'express';
import multer from 'multer';
import path from 'node:path';
import crypto from 'node:crypto';
import { authenticate } from '@/middleware/authenticate.js';
import { authorize } from '@/middleware/authorize.js';
import { AppError } from '@/utils/response.js';
import * as c from './super-admin.controller.js';

// ── Constants ─────────────────────────────────────────────────────────────

const MAX_IMAGE_SIZE_BYTES  = 10 * 1024 * 1024;   // 10 MB
const MAX_REQUEST_BYTES     = 11 * 1024 * 1024;   // 11 MB (file + fields overhead)
const MAX_FILENAME_LENGTH   = 100;
const MAX_FIELD_VALUE_SIZE  = 2_000;               // 2 KB per field value
const MAX_FIELDS            = 5;
const MAX_HEADER_PAIRS      = 100;

// ✅ CWE-22/23: Set for O(1) MIME lookup — never derive type from extension
const ALLOWED_IMAGE_MIME = new Set([
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

// ── UUID Regex ────────────────────────────────────────────────────────────

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

// Matches Prisma's default cuid() format (e.g. cmsgdk49d0000mefpde2pxun9)
const CUID_REGEX = /^c[a-z0-9]{24,}$/i;

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

  // Step 1: Decode URL encoding — catches %2F, %5C
  try { name = decodeURIComponent(name); } catch { /* already decoded */ }

  // Step 2: Decode double-encoded sequences — catches %252F → %2F → /
  try { name = decodeURIComponent(name); } catch { /* already decoded */ }

  // Step 3: Normalize Unicode — prevents homoglyph bypass
  name = name.normalize('NFKC');

  // Step 4: Strip ANSI escape sequences
  name = name.replace(/\x1B\[[0-9;]*[a-zA-Z]/g, '');

  // Step 5: Extract basename only — removes all directory components
  name = path.basename(name);

  // Step 6: Remove all traversal sequences explicitly
  name = name
    .replace(/\.\./g, '')               // Remove double dots
    .replace(/[/\\]/g, '')              // Remove all slashes
    .replace(/[\x00-\x1F\x7F]/g, '');  // Remove control chars + null bytes

  // Step 7: Whitelist — alphanumeric, dash, underscore, dot only
  name = name.replace(/[^a-zA-Z0-9._-]/g, '_');

  // Step 8: Strip leading dots — prevent hidden file creation
  name = name.replace(/^\.+/, '');

  // Step 9: Remove extension — replaced by server-determined safe extension
  const nameWithoutExt = name.replace(/\.[^.]+$/, '');

  // Step 10: Enforce max length
  const truncated = nameWithoutExt.slice(0, MAX_FILENAME_LENGTH);

  // Step 11: Server-determined extension from MIME — never from upload
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
        req.destroy(new AppError('Request body exceeded size limit', 413));
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
      LIMIT_FILE_SIZE      : { status: 413, message: `Image too large. Max: ${MAX_IMAGE_SIZE_BYTES / (1024 * 1024)}MB` },
      LIMIT_FILE_COUNT     : { status: 400, message: 'Only one image file allowed' },
      LIMIT_FIELD_COUNT    : { status: 400, message: `Too many form fields. Max: ${MAX_FIELDS}` },
      LIMIT_PART_COUNT     : { status: 400, message: 'Too many form parts' },
      LIMIT_FIELD_VALUE    : { status: 400, message: `Field value too large. Max: ${MAX_FIELD_VALUE_SIZE} bytes` },
      LIMIT_UNEXPECTED_FILE: { status: 400, message: 'Unexpected file field. Use "image"' },
    };
    const mapped = errorMap[err.code] ?? { status: 400, message: 'File upload error' };
    res.status(mapped.status).json({ success: false, error: mapped.message });
    return;
  }
  next(err);
}

// ── Multer Instance ───────────────────────────────────────────────────────

const upload = multer({
  storage : multer.memoryStorage(),
  limits  : {
    fileSize    : MAX_IMAGE_SIZE_BYTES,  // ✅ CWE-770: 10MB per file
    files       : 1,                     // ✅ CWE-770: Max 1 file
    fields      : MAX_FIELDS,            // ✅ CWE-400: Max form fields
    parts       : MAX_FIELDS + 1,        // ✅ CWE-400: fields + 1 file
    fieldSize   : MAX_FIELD_VALUE_SIZE,  // ✅ CWE-400: Max field value size
    headerPairs : MAX_HEADER_PAIRS,      // ✅ CWE-400: Max header pairs
  },
  fileFilter: (_req, file, cb) => {
    // ✅ CWE-22/23: Strict MIME allowlist
    if (!ALLOWED_IMAGE_MIME.has(file.mimetype)) {
      return cb(new AppError('Only JPEG, PNG and WebP images are allowed', 400));
    }
    // ✅ CWE-22/23: Full sanitization + server-determined extension
    file.originalname = sanitizeFilename(file.originalname, file.mimetype);
    cb(null, true);
  },
});

// ── Route Parameter Validators ────────────────────────────────────────────

/**
 * ✅ CWE-22/23: Generic ID validator factory.
 * Prevents path traversal via route params (e.g. ../../secrets).
 * Accepts both UUID v4 and Prisma CUID formats.
 *
 * Attack without validation:
 *   DELETE /admins/../../superuser
 *   PATCH  /schools/%2e%2e%2fadmin/features
 *   → Controller receives raw traversal string
 *   → May reach unintended internal resources or DB records
 */
function validateParam(paramName: string) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const value = req.params[paramName];

    if (!value || (!UUID_REGEX.test(value) && !CUID_REGEX.test(value))) {
      res.status(400).json({
        success : false,
        error   : `Invalid ${paramName}: must be a valid ID`,
      });
      return;
    }
    next();
  };
}

// Pre-built param validators — one per route param name
const validateAdminId      = validateParam('adminId');
const validateUserId       = validateParam('userId');
const validateSchoolId     = validateParam('schoolId');
const validateFacultyId    = validateParam('facultyId');
const validateDepartmentId = validateParam('departmentId');
const validateFeatureId    = validateParam('featureId');
const validateEntranceId   = validateParam('entranceId');

// ── Router ────────────────────────────────────────────────────────────────

export const superAdminRoutes = Router();

// ✅ All routes require authentication + SUPER_ADMIN role
superAdminRoutes.use(authenticate);
superAdminRoutes.use(authorize('SUPER_ADMIN'));

// ── Admin Management ──────────────────────────────────────────────────────

superAdminRoutes.post('/admins',                                         c.createAdmin);
superAdminRoutes.get( '/admins',                                         c.listAdmins);
superAdminRoutes.delete('/admins/:adminId',     validateAdminId,         c.deleteAdmin);
superAdminRoutes.patch( '/admins/:adminId/deactivate',   validateAdminId, c.deactivateAdmin);
superAdminRoutes.patch( '/admins/:adminId/reactivate',   validateAdminId, c.reactivateAdmin);
superAdminRoutes.patch( '/admins/:adminId/reset-password', validateAdminId, c.resetAdminPassword);

// ── User Block / Unblock ──────────────────────────────────────────────────

superAdminRoutes.patch('/users/:userId/block',   validateUserId, c.blockUser);
superAdminRoutes.patch('/users/:userId/unblock', validateUserId, c.unblockUser);

// ── School Management ─────────────────────────────────────────────────────

superAdminRoutes.get(  '/schools',                                        c.listAllSchools);
superAdminRoutes.post( '/schools',                                        c.createSchool);
superAdminRoutes.patch('/schools/:schoolId',          validateSchoolId,   c.updateSchool);
superAdminRoutes.get(  '/schools/:schoolId/faculties', validateSchoolId,  c.listFaculties);
superAdminRoutes.post( '/schools/:schoolId/faculties', validateSchoolId,  c.createFaculty);

superAdminRoutes.delete('/faculties/:facultyId',           validateFacultyId, c.deleteFaculty);
superAdminRoutes.get(   '/faculties/:facultyId/departments', validateFacultyId, c.listDepartments);
superAdminRoutes.post(  '/faculties/:facultyId/departments', validateFacultyId, c.createDepartment);

superAdminRoutes.delete('/departments/:departmentId', validateDepartmentId, c.deleteDepartment);

// ── Audit Logs ────────────────────────────────────────────────────────────

superAdminRoutes.get('/audit-logs', c.getAuditLogs);

// ── Platform Analytics ────────────────────────────────────────────────────

superAdminRoutes.get('/stats', c.getPlatformStats);

// ── Campus Map Admin ──────────────────────────────────────────────────────

superAdminRoutes.get(
  '/map/schools/:schoolId/features',
  validateSchoolId,
  c.listMapFeatures,
);

superAdminRoutes.get(
  '/map/schools/:schoolId/entrances',
  validateSchoolId,
  c.listMapEntrances,
);

superAdminRoutes.put(
  '/map/schools/:schoolId/features',
  validateSchoolId,
  c.upsertMapFeature,
);

superAdminRoutes.delete(
  '/map/schools/:schoolId/features/:featureId',
  validateSchoolId,
  validateFeatureId,
  c.deleteMapFeature,
);

superAdminRoutes.post(
  '/map/schools/:schoolId/features/:featureId/images',
  validateSchoolId,
  validateFeatureId,
  limitRequestSize(MAX_REQUEST_BYTES),   // ✅ CWE-770: Size check before multer
  upload.single('image'),                 // ✅ CWE-22: Sanitized filename + MIME
  handleMulterError,                      // ✅ CWE-400: Structured error response
  c.uploadMapFeatureImage,
);

superAdminRoutes.delete(
  '/map/schools/:schoolId/features/:featureId/images',
  validateSchoolId,
  validateFeatureId,
  c.deleteMapFeatureImage,
);

superAdminRoutes.put(
  '/map/schools/:schoolId/entrances',
  validateSchoolId,
  c.upsertMapEntrance,
);

superAdminRoutes.delete(
  '/map/schools/:schoolId/entrances/:entranceId',
  validateSchoolId,
  validateEntranceId,
  c.deleteMapEntrance,
);

superAdminRoutes.post(
  '/map/schools/:schoolId/import',
  validateSchoolId,
  c.importMapGeoJson,
);