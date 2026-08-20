import { z } from 'zod';

/**
 * Accepts attachments as either a JSON array or a JSON-stringified string
 * (handles FormData sends where the frontend serialises the array).
 */
const attachmentsField = z.preprocess(
  (val) => {
    if (typeof val === 'string') {
      try { return JSON.parse(val); } catch { return val; }
    }
    return val;
  },
  z.array(z.object({
    url: z.string().url(),
    name: z.string(),
    mimeType: z.string().optional(),
  })).max(3).optional(),
);

export const createGroupSchema = z.object({
  name: z.string().min(3).max(100),
  description: z.string().max(500).optional(),
  type: z.enum(['EXAM_PREP', 'ASSIGNMENT', 'TUTORIAL', 'PROJECT', 'GENERAL']),
  isPrivate: z.boolean().default(false),
  courseTag: z.string().max(20).optional(),
  departmentId: z.string().optional(),
});

export const updateGroupSchema = z.object({
  name: z.string().min(3).max(100).optional(),
  description: z.string().max(500).optional(),
  courseTag: z.string().max(20).optional(),
  isPrivate: z.boolean().optional(),
});

export const listGroupsSchema = z.object({
  type: z.enum(['EXAM_PREP', 'ASSIGNMENT', 'TUTORIAL', 'PROJECT', 'GENERAL']).optional(),
  courseTag: z.string().optional(),
  departmentId: z.string().optional(),
  discover: z.coerce.boolean().default(false), // true = school-wide public groups (ignores dept filter)
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

export const sendMessageSchema = z.object({
  content: z.string().min(1).max(2000),
  attachments: attachmentsField,
});

export const listMessagesSchema = z.object({
  before: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
});

export const createInviteSchema = z.object({
  maxUses: z.number().int().min(1).max(100).default(1),
  expiresInHours: z.number().int().min(1).max(168).optional(), // max 7 days
});

export const updateMemberRoleSchema = z.object({
  role: z.enum(['ADMIN', 'MEMBER']),
});

export const groupQaSchema = z.object({
  question: z.string().min(3).max(500),
});

export const shareSummarySchema = z.object({
  materialId: z.string().min(1),
});

export const createChallengeSchema = z.object({
  receiverGroupId: z.string().min(1),
  quizId: z.string().min(1),
  expiresInHours: z.number().int().min(1).max(24).default(24),
});
