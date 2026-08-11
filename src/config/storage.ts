/**
 * storage.ts — Supabase Storage via the S3-compatible API
 *
 * Supabase exposes an S3-compatible endpoint, so we reuse the same
 * @aws-sdk/client-s3 package (already a dependency).
 *
 * Required env vars (set in Supabase dashboard → Project Settings → Storage → S3):
 *   SUPABASE_S3_ENDPOINT   e.g. https://<project_ref>.storage.supabase.co/storage/v1/s3
 *   SUPABASE_S3_REGION     e.g. ap-southeast-1  (shown on the same settings page)
 *   SUPABASE_S3_ACCESS_KEY generated S3 access key from Supabase dashboard
 *   SUPABASE_S3_SECRET_KEY generated S3 secret key from Supabase dashboard
 *   SUPABASE_STORAGE_BUCKET bucket name you created in Supabase Storage (e.g. "sch-hub")
 *   SUPABASE_PUBLIC_URL    public URL prefix for public buckets
 *                          e.g. https://<project_ref>.storage.supabase.co/storage/v1/object/public/<bucket>
 *                          Leave blank if the bucket is private — signed URLs are used instead.
 */

import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { env } from '@/config/env.js';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

// ── Configuration check ───────────────────────────────────────────────────

const isConfigured =
  Boolean(env.SUPABASE_S3_ENDPOINT) &&
  Boolean(env.SUPABASE_S3_ACCESS_KEY) &&
  Boolean(env.SUPABASE_S3_SECRET_KEY);

// ── S3 client pointed at Supabase ─────────────────────────────────────────

const s3 = isConfigured
  ? new S3Client({
      // forcePathStyle is required for Supabase S3 compatibility
      forcePathStyle: true,
      region: env.SUPABASE_S3_REGION ?? 'ap-southeast-1',
      endpoint: env.SUPABASE_S3_ENDPOINT!,
      credentials: {
        accessKeyId: env.SUPABASE_S3_ACCESS_KEY!,
        secretAccessKey: env.SUPABASE_S3_SECRET_KEY!,
      },
    })
  : null;

const BUCKET = env.SUPABASE_STORAGE_BUCKET ?? 'sch-hub';

// ── Local fallback (development only) ────────────────────────────────────

const LOCAL_UPLOAD_DIR = path.resolve('uploads');

function safeExt(originalName: string): string {
  const ext = path.extname(originalName).toLowerCase();
  return /^\.[a-z0-9]+$/.test(ext) ? ext : '';
}

function sanitizeKey(key: string): string {
  // Strip directory components, allow only safe characters
  return path.basename(key).replace(/[^a-zA-Z0-9._/-]/g, '_');
}

function resolveLocalPath(safeKey: string): string {
  const resolved = path.resolve(LOCAL_UPLOAD_DIR, path.basename(safeKey));
  if (!resolved.startsWith(LOCAL_UPLOAD_DIR + path.sep)) {
    throw new Error('Invalid file key — path traversal detected');
  }
  return resolved;
}

// ── Storage interface (same shape as the old r2 export) ──────────────────

export interface UploadResult {
  key: string;
  url: string;
}

export const storage = {
  /**
   * Upload a file buffer to Supabase Storage (or local disk in dev).
   *
   * Returns:
   *   key — the storage object key (used for deletion / presigned URLs)
   *   url — public URL (if bucket is public) or the object key (if private)
   */
  async upload(
    buffer: Buffer,
    originalName: string,
    mimeType: string,
  ): Promise<UploadResult> {
    const ext = safeExt(originalName);
    const key = `uploads/${Date.now()}-${crypto.randomBytes(8).toString('hex')}${ext}`;

    if (s3) {
      await s3.send(
        new PutObjectCommand({
          Bucket: BUCKET,
          Key: key,
          Body: buffer,
          ContentType: mimeType,
        }),
      );

      // If a public URL prefix is configured, build a direct public URL.
      // Otherwise callers must use getDownloadUrl() to get a signed URL.
      const url = env.SUPABASE_PUBLIC_URL
        ? `${env.SUPABASE_PUBLIC_URL.replace(/\/$/, '')}/${key}`
        : key;

      return { key, url };
    }

    // ── Local fallback ────────────────────────────────────────────────────
    if (!fs.existsSync(LOCAL_UPLOAD_DIR)) {
      fs.mkdirSync(LOCAL_UPLOAD_DIR, { recursive: true });
    }
    const safeLocalKey = sanitizeKey(key);
    fs.writeFileSync(resolveLocalPath(safeLocalKey), buffer);
    return { key, url: `/uploads/${path.basename(safeLocalKey)}` };
  },

  /** Delete an object from Supabase Storage (or local disk in dev). */
  async delete(key: string): Promise<void> {
    if (s3) {
      await s3.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: key }));
      return;
    }
    const localPath = resolveLocalPath(sanitizeKey(key));
    if (fs.existsSync(localPath)) fs.unlinkSync(localPath);
  },

  /**
   * Generate a presigned download URL for a private object.
   * For public buckets, prefer using the public URL returned by upload().
   *
   * Expires in `expiresInSeconds` (default 1 hour).
   */
  async getDownloadUrl(
    key: string,
    expiresInSeconds = 3600,
  ): Promise<string> {
    if (s3) {
      const command = new GetObjectCommand({ Bucket: BUCKET, Key: key });
      return getSignedUrl(s3, command, { expiresIn: expiresInSeconds });
    }
    return `/uploads/${path.basename(sanitizeKey(key))}`;
  },
};

// ── Backward-compatible alias ─────────────────────────────────────────────
// All existing code imports `r2` — re-export storage as r2 so nothing else
// in the codebase needs to change.
export const r2 = storage;
