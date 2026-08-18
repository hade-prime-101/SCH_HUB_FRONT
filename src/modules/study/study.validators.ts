import { z } from 'zod';

export const MATERIAL_TYPES = ['PAST_QUESTION', 'NOTE', 'HANDOUT', 'ASSIGNMENT', 'SUMMARY', 'SLIDES', 'OTHER'] as const;
export const MATERIAL_LEVELS = ['100', '200', '300', '400', '500', '600'] as const;
export const MATERIAL_VISIBILITIES = ['PUBLIC', 'DEPARTMENT', 'LEVEL', 'STUDY_GROUP', 'PRIVATE'] as const;
export const QUIZ_VISIBILITIES = ['PUBLIC', 'DEPARTMENT', 'LEVEL', 'STUDY_GROUP', 'PRIVATE'] as const;

export const uploadMaterialSchema = z.object({
  title: z.string().min(3).max(200),
  type: z.enum(MATERIAL_TYPES),
  courseCode: z.string().min(2).max(20).toUpperCase(),
  courseTitle: z.string().min(3).max(200),
  year: z.coerce.number().int().min(2000).max(new Date().getFullYear()).optional(),
  level: z.enum(MATERIAL_LEVELS).optional(),
  description: z.string().max(1000).optional(),
  departmentId: z.string().min(1).optional().or(z.literal('')).transform(v => v === '' ? undefined : v),
  visibility: z.enum(MATERIAL_VISIBILITIES).default('PUBLIC'),
  studyGroupId: z.string().optional().or(z.literal('')).transform(v => v === '' ? undefined : v),
});

export const bulkUploadMaterialSchema = z.object({
  materials: z.array(uploadMaterialSchema).min(1).max(10),
});

export const listMaterialsSchema = z.object({
  type: z.enum(MATERIAL_TYPES).optional(),
  courseCode: z.string().optional(),
  level: z.enum(MATERIAL_LEVELS).optional(),
  departmentId: z.string().optional(),
  visibility: z.enum(MATERIAL_VISIBILITIES).optional(),
  studyGroupId: z.string().optional(),
  search: z.string().max(100).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const rateMaterialSchema = z.object({
  rating: z.number().int().min(1).max(5),
});

export const updateVisibilitySchema = z.object({
  visibility: z.enum(MATERIAL_VISIBILITIES),
  studyGroupId: z.string().optional(),
});

export const updateMaterialSchema = z.object({
  title: z.string().min(3).max(200).optional(),
  description: z.string().max(1000).optional().or(z.literal('')).transform(v => v === '' ? undefined : v),
  level: z.enum(MATERIAL_LEVELS).optional(),
  visibility: z.enum(MATERIAL_VISIBILITIES).optional(),
  studyGroupId: z.string().optional().or(z.literal('')).transform(v => v === '' ? undefined : v),
});

export const createQuizSchema = z.object({
  title: z.string().min(3).max(200),
  courseCode: z.string().min(2).max(20).toUpperCase(),
  description: z.string().max(1000).optional(),
  level: z.enum(MATERIAL_LEVELS).optional(),
  timeLimit: z.number().int().min(60).max(7200),
  departmentId: z.string().optional(),
  visibility: z.enum(QUIZ_VISIBILITIES).default('DEPARTMENT'),
  studyGroupId: z.string().optional(),
  isDraft: z.boolean().default(false),
  questions: z.array(
    z.object({
      question: z.string().min(5),
      options: z.array(z.string().min(1)).min(2).max(6),
      correctAnswer: z.number().int().min(0),
      explanation: z.string().optional(),
      topic: z.string().max(100).optional(),
      order: z.number().int().min(0),
    })
  ).min(1),
});

export const listQuizzesSchema = z.object({
  departmentId: z.string().optional(),
  studyGroupId: z.string().optional(),
  courseCode: z.string().optional(),
  level: z.enum(MATERIAL_LEVELS).optional(),
  visibility: z.enum(QUIZ_VISIBILITIES).optional(),
  isDraft: z.coerce.boolean().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

export const publishQuizSchema = z.object({
  isDraft: z.boolean(),
});

export const generateQuizFromMaterialSchema = z.object({
  materialId: z.string().min(1),
  questionCount: z.number().int().min(5).max(30).default(15),
  departmentId: z.string().optional(),
  visibility: z.enum(QUIZ_VISIBILITIES).default('DEPARTMENT'),
  studyGroupId: z.string().nullish(), // null when quiz is not scoped to a study group
});

export const submitQuizAttemptSchema = z.object({
  answers: z.array(
    z.object({
      questionId: z.string().min(1),
      selected: z.number().int().min(0),
    })
  ),
  timeTaken: z.number().int().min(0),
});

export const approveQuizQuestionsSchema = z.object({
  approvals: z.array(z.object({
    questionId: z.string().min(1),
    approved: z.boolean(),
  })).min(1),
});

export const adminQuizAnalyticsSchema = z.object({
  departmentId: z.string().min(1).optional(),
  courseCode: z.string().optional(),
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
});

export const reviewMaterialSchema = z.object({
  decision: z.enum(['APPROVED', 'REJECTED']),
  note: z.string().max(500).optional(),
});
