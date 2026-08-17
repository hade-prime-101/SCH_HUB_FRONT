import { z } from 'zod';

const attachmentSchema = z.object({
  url: z.string().url(),
  name: z.string(),
  size: z.number().int().optional(),
  mimeType: z.string().optional(),
});

/**
 * Accepts attachments as either:
 *   - a proper JSON array (application/json body)
 *   - a JSON-stringified string (e.g. multipart/form-data field or stringified frontend send)
 * Rejects anything that is neither.
 */
const attachmentsField = z.preprocess(
  (val) => {
    if (typeof val === 'string') {
      try { return JSON.parse(val); } catch { return val; }
    }
    return val;
  },
  z.array(attachmentSchema).max(5).optional(),
);

const SECTIONS = ['FEED', 'NOTICE_BOARD', 'QNA', 'DEPT_UPDATES', 'CROSS_LEVEL', 'FRESHERS_CORNER', 'ANONYMOUS', 'CAMPUS_CULTURE', 'LOUNGE'] as const;
const QUESTION_TYPES = ['COURSE_HELP', 'ASSIGNMENT_HELP', 'CONCEPT_EXPLANATION', 'EXAM_PREP', 'PROJECT_GUIDANCE'] as const;

// ── 6.1 Announcements / Posts ─────────────────────────────────────────────

export const createPostSchema = z.object({
  content: z.string().min(1).max(5000),
  section: z.enum(SECTIONS),
  priority: z.enum(['URGENT', 'ACADEMIC', 'GENERAL']).default('GENERAL'),
  isAnonymous: z.boolean().default(false),
  courseTag: z.string().max(20).optional(),
  expiresAt: z.string().datetime().optional(),
  attachments: attachmentsField,
  departmentId: z.string().optional(),
  targetLevel: z.string().optional(),         // 6.1 level targeting
  isMentorQuestion: z.boolean().default(false), // 6.3
  mentorCourseCode: z.string().max(20).optional(), // 6.3
});

export const listPostsSchema = z.object({
  section: z.enum(SECTIONS).optional(),
  departmentId: z.string().optional(),
  courseTag: z.string().optional(),
  targetLevel: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

export const pinPostSchema = z.object({ isPinned: z.boolean() });

export const createCommentSchema = z.object({
  content: z.string().min(1).max(2000),
  parentId: z.string().optional(),
});

// ── 6.2 Q&A ───────────────────────────────────────────────────────────────

export const createQuestionSchema = z.object({
  title: z.string().min(5).max(300),
  content: z.string().min(10).max(5000),
  type: z.enum(QUESTION_TYPES),
  courseTag: z.string().min(2).max(20),       // required — no tagless questions
  isAnonymous: z.boolean().default(false),
  attachments: attachmentsField,
  departmentId: z.string().optional(),
  isMentorQuestion: z.boolean().default(false), // 6.3 route to mentor
});

export const listQuestionsSchema = z.object({
  type: z.enum(QUESTION_TYPES).optional(),
  courseTag: z.string().optional(),
  isSolved: z.coerce.boolean().optional(),
  isMentorQuestion: z.coerce.boolean().optional(),
  departmentId: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

export const createAnswerSchema = z.object({
  content: z.string().min(5).max(5000),
  attachments: attachmentsField,
});

// ── 6.3 Mentoring ─────────────────────────────────────────────────────────

export const registerMentorSchema = z.object({
  courseCode: z.string().min(2).max(20).toUpperCase(),
  departmentId: z.string().optional(),
});

export const listMentorsSchema = z.object({
  courseCode: z.string().optional(),
  departmentId: z.string().optional(),
});

// ── 6.4 Freshers FAQ (admin management) ──────────────────────────────────

export const createFaqSchema = z.object({
  question: z.string().min(5).max(300),
  answer: z.string().min(5).max(2000),
  category: z.string().max(50).default('general'),
  order: z.number().int().min(0).default(0),
});

// ── Reactions / Reports ───────────────────────────────────────────────────

// 6.2: Only upvote (helpful) — no noisy social reactions on Q&A
export const upvoteSchema = z.object({
  targetType: z.enum(['post', 'question', 'answer', 'comment']),
});

export const reactSchema = z.object({
  type: z.enum(['LIKE', 'HELPFUL', 'INSIGHTFUL', 'FUNNY', 'SUPPORT']),
  targetType: z.enum(['post', 'question', 'answer', 'comment']),
});

export const reportSchema = z.object({
  reason: z.enum(['SPAM', 'INAPPROPRIATE', 'HARASSMENT', 'MISINFORMATION', 'OTHER']),
  details: z.string().max(500).optional(),
  targetType: z.enum(['post', 'question', 'answer']),
});
