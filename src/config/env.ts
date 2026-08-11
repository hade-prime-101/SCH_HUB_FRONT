import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const optionalString = z.preprocess(
  (value) => (value === '' ? undefined : value),
  z.string().optional(),
);
const optionalUrl = z.preprocess(
  (value) => (value === '' ? undefined : value),
  z.string().url().optional(),
);

const envSchema = z
  .object({
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    PORT:     z.coerce.number().default(3000),

    // ── Database ───────────────────────────────────────────────────────────
    DATABASE_URL: z.string().min(1),
    DIRECT_URL:   optionalString,

    // ── Auth ───────────────────────────────────────────────────────────────
    JWT_ACCESS_SECRET:     z.string().min(16),
    JWT_REFRESH_SECRET:    z.string().min(16),
    ACCESS_TOKEN_TTL:      z.string().default('15m'),
    REFRESH_TOKEN_TTL_DAYS: z.coerce.number().default(30),

    // ── CORS / Proxy ───────────────────────────────────────────────────────
    CORS_ORIGIN:  z.string().default('*'),
    TRUST_PROXY:  z.coerce.boolean().default(false),

    // ── Redis ──────────────────────────────────────────────────────────────
    REDIS_URL: z.string().default('redis://localhost:6379'),

    // ── Supabase Storage (S3-compatible) ───────────────────────────────────
    // Get these from: Supabase dashboard → Project Settings → Storage → S3 Access
    SUPABASE_S3_ENDPOINT:    optionalString,   // https://<ref>.storage.supabase.co/storage/v1/s3
    SUPABASE_S3_REGION:      optionalString,   // e.g. ap-southeast-1
    SUPABASE_S3_ACCESS_KEY:  optionalString,   // generated S3 access key
    SUPABASE_S3_SECRET_KEY:  optionalString,   // generated S3 secret key
    SUPABASE_STORAGE_BUCKET: z.string().default('sch-hub'),
    // Public URL prefix for public buckets — leave blank to use signed URLs
    // e.g. https://<ref>.storage.supabase.co/storage/v1/object/public/<bucket>
    SUPABASE_PUBLIC_URL: optionalUrl,

    // ── Brevo Email (optional locally — logs mail to console) ─────────────
    // Get API key from: https://app.brevo.com → Settings → API Keys
    BREVO_API_KEY:      optionalString,
    BREVO_SENDER_EMAIL: optionalString,   // e.g. no-reply@sch-hub.app
    BREVO_SENDER_NAME:  optionalString,   // e.g. SCH Hub

    // ── Firebase Admin (optional — FCM push notifications) ─────────────────
    FIREBASE_PROJECT_ID:    optionalString,
    FIREBASE_CLIENT_EMAIL:  optionalString,
    FIREBASE_PRIVATE_KEY:   optionalString,

    // ── Sentry (optional — error tracking) ────────────────────────────────
    SENTRY_DSN: optionalUrl,

    // ── AI providers (text chat / completion) ─────────────────────────────
    // Primary: Groq — fast inference, generous free tier
    // Get key at: https://console.groq.com/keys
    GROQ_API_KEY: optionalString,

    // Text fallback 1: OpenRouter — 300+ models, OpenAI-compatible
    // Get key at: https://openrouter.ai/keys
    OPENROUTER_API_KEY: optionalString,
    // Override default OpenRouter model (default: meta-llama/llama-3.3-70b-instruct:free)
    // Any model slug from https://openrouter.ai/models works here
    OPENROUTER_MODEL: optionalString,

    // Text fallback 2: DeepSeek — cost-effective, strong reasoning, OpenAI-compatible
    // Get key at: https://platform.deepseek.com/api_keys
    DEEPSEEK_API_KEY: optionalString,
    // Override default DeepSeek model (default: deepseek-chat)
    // Options: deepseek-chat | deepseek-reasoner
    DEEPSEEK_MODEL: optionalString,

    // ── OCR providers (scanned PDF fallback) ───────────────────────────────
    // Primary OCR: Groq Vision — reuses GROQ_API_KEY above, no extra key needed.
    // Fallback OCR: Gemini Vision
    // Get key at: https://aistudio.google.com/app/apikey
    GEMINI_API_KEY: optionalString,
    // Override default Gemini model (default: gemini-2.0-flash)
    GEMINI_MODEL: optionalString,

    // ── Campus Map ─────────────────────────────────────────────────────────
    ORS_API_KEY:     optionalString,
    MAPTILER_API_KEY: optionalString,

    // ── WhatsApp broadcast ─────────────────────────────────────────────────
    // provider: fonnte | twilio | wati  (leave blank to disable / use dev stub)
    WHATSAPP_PROVIDER: z
      .enum(['fonnte', 'twilio', 'wati'])
      .optional()
      .or(z.literal(''))
      .transform((v) => (v === '' ? undefined : v)),

    // Fonnte — open-source friendly, self-managed WA device
    // Get token from: https://fonnte.com → Dashboard → Device → Token
    FONNTE_TOKEN: optionalString,

    // Twilio WhatsApp (legacy option)
    TWILIO_ACCOUNT_SID:    optionalString,
    TWILIO_AUTH_TOKEN:     optionalString,
    TWILIO_WHATSAPP_FROM:  optionalString,

    // WATI (legacy option)
    WATI_API_URL:   optionalUrl,
    WATI_API_TOKEN: optionalString,

    // ── Single-school mode ─────────────────────────────────────────────────
    // After running prisma:seed, paste the school cuid here to lock the app
    // to one school. Leave blank for multi-school mode.
    SCHOOL_ID: optionalString,
  })
  .superRefine((value, ctx) => {
    const isProd = value.NODE_ENV === 'production';

    // ── CORS ───────────────────────────────────────────────────────────────
    if (isProd && value.CORS_ORIGIN.trim() === '*') {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['CORS_ORIGIN'],
        message: 'CORS_ORIGIN must list explicit origins in production.',
      });
    }

    // ── JWT secrets ────────────────────────────────────────────────────────
    if (isProd && value.JWT_ACCESS_SECRET.length < 32) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['JWT_ACCESS_SECRET'],
        message: 'JWT_ACCESS_SECRET must be at least 32 characters in production.',
      });
    }
    if (isProd && value.JWT_REFRESH_SECRET.length < 32) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['JWT_REFRESH_SECRET'],
        message: 'JWT_REFRESH_SECRET must be at least 32 characters in production.',
      });
    }

    // ── Supabase Storage ───────────────────────────────────────────────────
    // All three S3 credentials must be provided together if any one is set
    const supabaseS3 = [
      value.SUPABASE_S3_ENDPOINT,
      value.SUPABASE_S3_ACCESS_KEY,
      value.SUPABASE_S3_SECRET_KEY,
    ];
    if (supabaseS3.some(Boolean) && !supabaseS3.every(Boolean)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['SUPABASE_S3_ENDPOINT'],
        message:
          'SUPABASE_S3_ENDPOINT, SUPABASE_S3_ACCESS_KEY, and SUPABASE_S3_SECRET_KEY must all be set together.',
      });
    }
    // In production, storage must be configured (files would otherwise be lost on restart)
    if (isProd && !supabaseS3.every(Boolean)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['SUPABASE_S3_ENDPOINT'],
        message: 'Supabase Storage must be configured in production (SUPABASE_S3_* vars).',
      });
    }

    // ── Brevo ──────────────────────────────────────────────────────────────
    if (isProd && !value.BREVO_API_KEY) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['BREVO_API_KEY'],
        message: 'BREVO_API_KEY must be configured in production.',
      });
    }

    // ── Firebase ───────────────────────────────────────────────────────────
    const firebaseValues = [
      value.FIREBASE_PROJECT_ID,
      value.FIREBASE_CLIENT_EMAIL,
      value.FIREBASE_PRIVATE_KEY,
    ];
    if (firebaseValues.some(Boolean) && !firebaseValues.every(Boolean)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['FIREBASE_PROJECT_ID'],
        message: 'Firebase project id, client email, and private key must be configured together.',
      });
    }

    // ── AI — at least one text provider required in production ────────────
    if (isProd && !value.GROQ_API_KEY && !value.OPENROUTER_API_KEY && !value.DEEPSEEK_API_KEY) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['GROQ_API_KEY'],
        message:
          'At least one AI provider must be configured in production: ' +
          'GROQ_API_KEY, OPENROUTER_API_KEY, or DEEPSEEK_API_KEY.',
      });
    }

    // ── WhatsApp provider credential completeness ──────────────────────────
    if (value.WHATSAPP_PROVIDER === 'fonnte' && !value.FONNTE_TOKEN) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['WHATSAPP_PROVIDER'],
        message: 'Fonnte WhatsApp provider requires FONNTE_TOKEN.',
      });
    }
    if (value.WHATSAPP_PROVIDER === 'twilio') {
      const twilioValues = [
        value.TWILIO_ACCOUNT_SID,
        value.TWILIO_AUTH_TOKEN,
        value.TWILIO_WHATSAPP_FROM,
      ];
      if (!twilioValues.every(Boolean)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['WHATSAPP_PROVIDER'],
          message:
            'Twilio WhatsApp provider requires TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_WHATSAPP_FROM.',
        });
      }
    }
    if (value.WHATSAPP_PROVIDER === 'wati') {
      if (!value.WATI_API_URL || !value.WATI_API_TOKEN) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['WHATSAPP_PROVIDER'],
          message: 'WATI WhatsApp provider requires WATI_API_URL and WATI_API_TOKEN.',
        });
      }
    }
  });

export const env = envSchema.parse(process.env);
