import { z } from 'zod';

// ── Create session: upload new file or pin an existing material ───────────
export const createSessionSchema = z.object({
  title: z.string().min(2).max(200),
  courseCode: z.string().min(2).max(20).toUpperCase(),
  // Provide either a materialId (existing platform material) or upload a file via multipart
  materialId: z.string().optional(),
});

// ── Generate personalised quiz for a session ──────────────────────────────
export const generatePersonalQuizSchema = z.object({
  questionCount: z.number().int().min(3).max(30).default(10),
  focusTopics: z.string().max(300).optional(),
  replaceExisting: z.boolean().default(false),
});

// ── Ask AI a question about the session material ──────────────────────────
export const askPersonalSchema = z.object({
  question: z.string().min(3).max(1000),
});
