import { z } from 'zod';

export const nominateCourseRepSchema = z.object({
  userId: z.string().min(1),
});

export const assignRoleSchema = z.object({
  userId: z.string().min(1),
  // SUPER_ADMIN intentionally excluded — cannot be assigned via this endpoint
  role: z.enum(['STUDENT', 'COURSE_REP', 'AUTHORIZED_UPLOADER', 'EVENT_ORCHESTRATOR', 'HOUSE_AGENT', 'SCHOOL_ADMIN']),
});

export const searchUsersSchema = z.object({
  search: z.string().min(1).max(100),
  departmentId: z.string().optional(),
  level: z.enum(['100', '200', '300', '400', '500', '600']).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

export const listUsersSchema = z.object({
  role: z.enum(['STUDENT', 'COURSE_REP', 'AUTHORIZED_UPLOADER', 'EVENT_ORCHESTRATOR', 'HOUSE_AGENT', 'SCHOOL_ADMIN', 'SUPER_ADMIN']).optional(),
  departmentId: z.string().optional(),
  search: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(50),
});

export const updateProfileSchema = z.object({
  fullName: z.string().min(2).max(100).optional(),
  phone: z.string().min(7).max(20).nullable().optional(),
  bio: z.string().max(500).nullable().optional(),
  level: z.enum(['100', '200', '300', '400', '500', '600']).optional(),
});

export const updateSettingsSchema = z.object({
  darkMode: z.boolean().optional(),
  lowDataMode: z.boolean().optional(),
  notificationsEnabled: z.boolean().optional(),
  emailNotifications: z.boolean().optional(),
  pushNotifications: z.boolean().optional(),
});

export const registerFcmTokenSchema = z.object({
  fcmToken: z.string().min(10),
});

export const revokeSessionSchema = z.object({
  sessionId: z.string().min(1),
});
