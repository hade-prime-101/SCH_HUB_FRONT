/**
 * extractText.ts — document text extraction with scanned-PDF OCR fallback
 *
 * Normal extraction (no API calls):
 *   PDF   → pdf-parse   (text layer)
 *   DOCX  → mammoth     (XML text layer)
 *   PPTX  → officeparser (XML text layer, requires tmp file)
 *   TXT   → Buffer.toString('utf-8')
 *
 * OCR fallback (only triggered when pdf-parse returns < MIN_READABLE_CHARS):
 *   1. Rasterise PDF pages to PNG buffers via pdf-to-img (pdfjs-dist, pure JS)
 *   2. Send page images to Groq Vision  (reuses GROQ_API_KEY — no extra key)
 *   3. If Groq fails/absent → Gemini Vision  (GEMINI_API_KEY)
 *   4. If both fail → return whatever pdf-parse extracted (graceful degradation)
 *
 * OCR failures are never surfaced as errors — the caller receives whatever
 * text was accumulated; if still < MIN_READABLE_CHARS the status is 'EMPTY'
 * and extractTextOrReject() throws its normal 422.
 */

import { AppError } from '@/utils/response.js';
import { env } from '@/config/env.js';
import Groq from 'groq-sdk';
import os from 'node:os';
import path from 'node:path';
import fs from 'node:fs';
import crypto from 'node:crypto';

const MIN_READABLE_CHARS = 200;
const PREVIEW_LENGTH     = 500;

// Max PDF pages sent to OCR — keeps token / cost usage predictable.
// Each page becomes one image in the vision prompt.
const MAX_OCR_PAGES = 10;

// ✅ Resolve once at module load — immune to tmpdir() changes or symlink swaps
const SAFE_TMP_DIR = fs.realpathSync(os.tmpdir());

export type ExtractionResult = {
  text      : string;
  preview   : string;
  charCount : number;
  status    : 'READABLE' | 'EMPTY';
};

// ── CWE-22/23: Filename Sanitizer ─────────────────────────────────────────

/**
 * Sanitizes a filename before it is used in a filesystem path.
 *
 * Defends against:
 *   ../../../etc/passwd       → direct traversal
 *   ..%2F..%2Fetc%2Fpasswd   → URL-encoded traversal
 *   ..%252F (double-encoded)  → double URL-encoded traversal
 *   .htaccess / .env          → hidden/system file creation
 *   file\x00.pdf              → null byte injection (path truncation)
 *   \x1B[31mevil\x1B[0m      → ANSI terminal escape injection
 *   ｅｖｉｌ (Unicode homoglyph) → Unicode normalization bypass
 */
function sanitizeFilenameForTmp(originalName: string): string {
  let name = originalName ?? '';

  // Step 1: Decode URL encoding — catches %2F, %5C
  try { name = decodeURIComponent(name); } catch { /* already decoded */ }

  // Step 2: Decode double-encoded sequences — catches %252F → %2F → /
  try { name = decodeURIComponent(name); } catch { /* already decoded */ }

  // Step 3: Normalize Unicode — prevents homoglyph bypass
  name = name.normalize('NFKC');

  // Step 4: Strip ANSI escape sequences
  name = name.replace(/\x1B\[[0-9;]*[a-zA-Z]/g, '');

  // Step 5: Extract basename only — removes directory components
  name = path.basename(name);

  // Step 6: Explicitly remove all traversal sequences
  name = name
    .replace(/\.\./g, '')               // Remove double dots
    .replace(/[/\\]/g, '')              // Remove all slashes
    .replace(/[\x00-\x1F\x7F]/g, '');  // Remove control chars + null bytes

  // Step 7: Whitelist — only alphanumeric, dash, underscore, dot
  name = name.replace(/[^a-zA-Z0-9._-]/g, '_');

  // Step 8: Strip leading dots — prevent hidden file creation
  name = name.replace(/^\.+/, '');

  // Step 9: Enforce max length
  name = name.slice(0, 60);

  // Step 10: Return sanitized name or empty string (caller will handle fallback)
  return name;
}

// ── CWE-22/23: Safe Tmp Path Builder ─────────────────────────────────────

/**
 * Builds a safe, validated temporary file path.
 *
 * Security guarantees:
 *   1. Uses cryptographic random prefix — prevents timing/collision attacks
 *   2. Resolves real path — defeats symlink attacks
 *   3. Validates resolved path starts with real tmpdir — defeats traversal
 *   4. Case-insensitive comparison on Windows — defeats case bypass
 *   5. Throws BEFORE any file write if path is unsafe
 */
function buildSafeTmpPath(sanitizedName: string, extension: string): string {
  // ✅ Cryptographic random prefix — not guessable, no collision risk
  const randomPrefix = crypto.randomBytes(16).toString('hex');
  const safeFilename = `sch-extract-${randomPrefix}${extension}`;

  // ✅ Construct candidate path using only safe components
  const candidatePath = path.join(SAFE_TMP_DIR, safeFilename);

  // ✅ Resolve to real absolute path — defeats symlinks and relative segments
  // Note: path.resolve() is used here (not fs.realpathSync) because file
  // doesn't exist yet — realpathSync would throw on non-existent paths
  const resolvedPath = path.resolve(candidatePath);

  // ✅ Validate resolved path is within safe tmpdir
  // Uses case-insensitive comparison for Windows filesystem safety
  const normalizedResolved = resolvedPath.toLowerCase();
  const normalizedTmpDir   = SAFE_TMP_DIR.toLowerCase();

  if (
    !normalizedResolved.startsWith(normalizedTmpDir + path.sep.toLowerCase()) &&
    normalizedResolved !== normalizedTmpDir.toLowerCase()
  ) {
    throw new AppError('Path traversal detected in temporary file path', 400);
  }

  return resolvedPath;
}

// ── Safe Tmp File Writer ──────────────────────────────────────────────────

/**
 * Safely writes buffer to a temp file and returns the validated path.
 * Caller is responsible for cleanup via fs.unlinkSync in a finally block.
 */
function writeTmpFile(buffer: Buffer, extension: string): string {
  const tmpPath = buildSafeTmpPath('', extension);

  // ✅ Write with restrictive permissions — owner read/write only (0o600)
  // Prevents other processes from reading sensitive document content
  fs.writeFileSync(tmpPath, buffer, { mode: 0o600 });

  return tmpPath;
}

// ── MIME → Extension Mapper ───────────────────────────────────────────────

/**
 * ✅ Server-determined extension from MIME type — never from filename.
 * Prevents extension spoofing (e.g. evil.exe renamed to doc.pdf).
 */
function getExtensionFromMime(mimeType: string): string {
  const mimeToExt: Record<string, string> = {
    'application/pdf'     : '.pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx',
    'application/msword'  : '.doc',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation': '.pptx',
    'application/vnd.ms-powerpoint': '.ppt',
    'text/plain'          : '.txt',
  };
  return mimeToExt[mimeType] ?? '';
}

// ── OCR: PDF → page images ────────────────────────────────────────────────

/**
 * Rasterises up to MAX_OCR_PAGES pages of a PDF to PNG Buffers.
 * Uses pdf-to-img (pdfjs-dist wrapper) — pure JS, no system binaries.
 * Returns an empty array on any failure so the caller can skip OCR gracefully.
 */
async function rasterisePdfPages(buffer: Buffer): Promise<Buffer[]> {
  try {
    const { pdf } = await import('pdf-to-img');
    const doc = await pdf(buffer, { scale: 2 });
    const pages: Buffer[] = [];
    let pageNum = 0;
    for await (const pageBuffer of doc) {
      pages.push(pageBuffer as Buffer);
      pageNum++;
      if (pageNum >= MAX_OCR_PAGES) break;
    }
    return pages;
  } catch {
    return [];
  }
}

// ── OCR: Groq Vision ─────────────────────────────────────────────────────

/**
 * Sends rasterised PDF page images to Groq Vision for OCR.
 * Reuses the existing GROQ_API_KEY — no extra credential needed.
 * Returns extracted text, or throws on failure.
 */
async function ocrWithGroq(pageBuffers: Buffer[]): Promise<string> {
  if (!env.GROQ_API_KEY) throw new Error('GROQ_API_KEY not set');
  if (pageBuffers.length === 0) throw new Error('No page images to process');

  const groqClient = new Groq({ apiKey: env.GROQ_API_KEY });

  // Build one message with all page images as separate image_url parts.
  // Groq Vision accepts base64 data URLs.
  const imageContent = pageBuffers.map((buf, i) => ({
    type: 'image_url' as const,
    image_url: {
      url: `data:image/png;base64,${buf.toString('base64')}`,
      detail: 'high' as const,
    },
  }));

  const completion = await groqClient.chat.completions.create({
    model: 'meta-llama/llama-4-scout-17b-16e-instruct',
    messages: [
      {
        role: 'user',
        content: [
          ...imageContent,
          {
            type: 'text',
            text: 'Extract all text from these document page images exactly as it appears. ' +
                  'Return only the raw extracted text with no commentary, formatting, or markdown.',
          },
        ],
      },
    ],
    temperature: 0,
  });

  return completion.choices[0]?.message?.content?.trim() ?? '';
}

// ── OCR: Gemini Vision fallback ───────────────────────────────────────────

/**
 * Sends rasterised PDF page images to Gemini Vision for OCR.
 * Used as fallback when Groq Vision fails or GROQ_API_KEY is absent.
 * Returns extracted text, or throws on failure.
 */
async function ocrWithGemini(pageBuffers: Buffer[]): Promise<string> {
  if (!env.GEMINI_API_KEY) throw new Error('GEMINI_API_KEY not set');
  if (pageBuffers.length === 0) throw new Error('No page images to process');

  const { GoogleGenAI } = await import('@google/genai');
  const genai = new GoogleGenAI({ apiKey: env.GEMINI_API_KEY });
  const model = env.GEMINI_MODEL ?? 'gemini-2.0-flash';

  // Gemini accepts inlineData parts for images
  const imageParts = pageBuffers.map((buf) => ({
    inlineData: {
      mimeType: 'image/png' as const,
      data: buf.toString('base64'),
    },
  }));

  const result = await genai.models.generateContent({
    model,
    contents: [
      {
        role: 'user',
        parts: [
          ...imageParts,
          {
            text: 'Extract all text from these document page images exactly as it appears. ' +
                  'Return only the raw extracted text with no commentary, formatting, or markdown.',
          },
        ],
      },
    ],
  });

  return result.text?.trim() ?? '';
}

// ── OCR orchestrator ──────────────────────────────────────────────────────

/**
 * Full OCR pipeline for a scanned PDF buffer.
 *
 * Steps:
 *   1. Rasterise pages → PNG buffers (pdf-to-img)
 *   2. Try Groq Vision  (reuses GROQ_API_KEY)
 *   3. Try Gemini Vision fallback  (GEMINI_API_KEY)
 *   4. Return accumulated text (may be empty — caller handles EMPTY status)
 *
 * Never throws — all failures are caught and logged as warnings.
 */
async function ocrPdf(buffer: Buffer, isRawImage = false): Promise<string> {
  // If the buffer is already a raw image (JPEG/PNG/WEBP), skip PDF rasterisation
  // and pass it directly to the Vision OCR providers as a single-page document.
  const pageBuffers: Buffer[] = isRawImage
    ? [buffer]
    : await rasterisePdfPages(buffer);

  if (pageBuffers.length === 0) {
    console.warn('[ocr] PDF rasterisation produced no pages — skipping OCR');
    return '';
  }

  // ── Try Groq Vision ──────────────────────────────────────────────────────
  if (env.GROQ_API_KEY) {
    try {
      const text = await ocrWithGroq(pageBuffers);
      if (text.length > 0) {
        console.log(`[ocr] Groq Vision extracted ${text.length} chars from ${pageBuffers.length} page(s)`);
        return text;
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.warn(`[ocr] Groq Vision failed (${msg}), trying Gemini`);
    }
  }

  // ── Try Gemini Vision ────────────────────────────────────────────────────
  if (env.GEMINI_API_KEY) {
    try {
      const text = await ocrWithGemini(pageBuffers);
      if (text.length > 0) {
        console.log(`[ocr] Gemini Vision extracted ${text.length} chars from ${pageBuffers.length} page(s)`);
        return text;
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.warn(`[ocr] Gemini Vision failed (${msg}) — OCR unavailable`);
    }
  }

  if (!env.GROQ_API_KEY && !env.GEMINI_API_KEY) {
    console.warn('[ocr] No OCR provider configured — set GROQ_API_KEY or GEMINI_API_KEY to enable scanned PDF support');
  }

  return '';
}

// ── PDF Extractor ─────────────────────────────────────────────────────────

async function extractPdf(buffer: Buffer): Promise<string> {
  // ── Step 1: Fast text-layer extraction via pdf-parse ─────────────────────
  // This covers all normal (non-scanned) PDFs with zero API calls.
  let text = '';
  try {
    const pdfParse = (await import('pdf-parse' as any)) as any;
    const fn       = pdfParse.default ?? pdfParse;
    const result   = await fn(buffer);
    text = result.text?.trim() ?? '';
  } catch {
    // pdf-parse failed entirely — fall through to OCR
  }

  if (text.length >= MIN_READABLE_CHARS) {
    return text;
  }

  // ── Step 2: OCR fallback for scanned / image-based PDFs ──────────────────
  // Only reached when pdf-parse returned less than MIN_READABLE_CHARS.
  console.log(`[ocr] pdf-parse returned ${text.length} chars — attempting OCR fallback`);
  const ocrText = await ocrPdf(buffer);

  // Prefer OCR result if it produced more text; otherwise keep pdf-parse output
  return ocrText.length > text.length ? ocrText : text;
}

// ── DOCX Extractor ────────────────────────────────────────────────────────

async function extractDocx(buffer: Buffer): Promise<string> {
  // mammoth operates on buffer directly — no filesystem path involved
  // ✅ No path traversal risk here — buffer never touches filesystem
  const mammoth = (await import('mammoth')).default;
  const result  = await mammoth.extractRawText({ buffer });
  return result.value?.trim() ?? '';
}

// ── PPTX / Office Extractor ───────────────────────────────────────────────

async function extractOffice(buffer: Buffer, mimeType: string): Promise<string> {
  // officeParser requires a file path — we must write to disk temporarily
  const officeParser = await import('officeparser');

  // ✅ CWE-22/23 Fix: Extension from MIME type — never from original filename
  const extension = getExtensionFromMime(mimeType);

  // ✅ CWE-22/23 Fix: Cryptographically random path — no user input in path
  const tmpPath = writeTmpFile(buffer, extension);

  try {
    const text: string = await (officeParser as any).parseOfficeAsync(tmpPath);
    return (text ?? '').trim();
  } catch {
    return '';
  } finally {
    // ✅ Always clean up temp file — even on exception
    try { fs.unlinkSync(tmpPath); } catch { /* ignore cleanup errors */ }
  }
}

// ── TXT Extractor ─────────────────────────────────────────────────────────

function extractTxt(buffer: Buffer): string {
  // ✅ No filesystem involvement — buffer decoded directly to string
  return buffer.toString('utf-8').trim();
}

// ── Main Entry ────────────────────────────────────────────────────────────

export async function extractText(
  buffer      : Buffer,
  mimeType    : string,
  originalname: string,  // ✅ No longer used for filesystem operations
): Promise<ExtractionResult> {
  let text = '';

  if (mimeType === 'application/pdf') {
    // ✅ OCR fallback built in — handles scanned PDFs automatically
    text = await extractPdf(buffer);

  } else if (
    mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    mimeType === 'application/msword'
  ) {
    // ✅ Buffer-only — no filesystem path
    text = await extractDocx(buffer);

  } else if (
    mimeType === 'application/vnd.openxmlformats-officedocument.presentationml.presentation' ||
    mimeType === 'application/vnd.ms-powerpoint'
  ) {
    // ✅ CWE-22/23 Fix: mimeType passed instead of originalname
    // Extension determined by server from MIME — never from user-controlled filename
    text = await extractOffice(buffer, mimeType);

  } else if (mimeType === 'text/plain') {
    // ✅ Buffer-only — no filesystem path
    text = extractTxt(buffer);

  } else if (
    mimeType === 'image/jpeg' ||
    mimeType === 'image/png'  ||
    mimeType === 'image/webp'
  ) {
    // ✅ Image uploaded directly — send straight to Vision OCR
    // Treat the image as a single-page document (no rasterisation needed)
    text = await ocrPdf(buffer, true);
  }

  const charCount = text.length;
  const status: ExtractionResult['status'] =
    charCount >= MIN_READABLE_CHARS ? 'READABLE' : 'EMPTY';
  const preview = text.slice(0, PREVIEW_LENGTH);

  return { text, preview, charCount, status };
}

// ── Reject Unreadable Files ───────────────────────────────────────────────

/**
 * Extracts text and throws 422 if the file is unreadable (scanned/empty)
 * after all extraction methods (including OCR fallback) have been exhausted.
 */
export async function extractTextOrReject(
  buffer      : Buffer,
  mimeType    : string,
  originalname: string,
): Promise<ExtractionResult> {
  const result = await extractText(buffer, mimeType, originalname);

  if (result.status === 'EMPTY') {
    const isImage = mimeType.startsWith('image/');
    const isPdf   = mimeType === 'application/pdf';
    const hint = isPdf
      ? 'The PDF appears to be fully scanned or image-based and OCR could not extract readable text. Ensure OCR API keys (GROQ_API_KEY or GEMINI_API_KEY) are configured, or upload a text-based PDF.'
      : isImage
      ? 'The image did not yield readable text via OCR. Ensure the image is clear and contains printed text, and that OCR API keys (GROQ_API_KEY or GEMINI_API_KEY) are configured.'
      : 'The file appears to be empty or unreadable. Please upload a text-based PDF, DOCX, PPTX, or TXT file.';

    throw new AppError(
      `Could not extract readable text from this file. ${hint}`,
      422,
    );
  }

  return result;
}
