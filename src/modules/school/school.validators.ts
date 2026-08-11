import { z } from 'zod';

// ── Timetable ──────────────────────────────────────────────

export const createTimetableEntrySchema = z.object({
  timetableType: z.enum(['PERSONAL', 'DEPARTMENTAL', 'GENERAL']).default('PERSONAL'),
  courseCode: z.string().min(2).max(20).transform((v) => v.toUpperCase()),
  courseTitle: z.string().min(3).max(200),
  venue: z.string().max(200).optional(),
  dayOfWeek: z.number().int().min(0).max(6),
  startTime: z.string().regex(/^\d{2}:\d{2}$/, 'Format HH:MM'),
  endTime: z.string().regex(/^\d{2}:\d{2}$/, 'Format HH:MM'),
  type: z.enum(['LECTURE', 'PRACTICAL', 'SEMINAR', 'EXAM', 'TEST']).default('LECTURE'),
  isRecurring: z.boolean().default(true),
  level: z.string().optional(),         // required when timetableType = DEPARTMENTAL
  departmentId: z.string().optional(),  // required when timetableType = DEPARTMENTAL
  schoolId: z.string().optional(),      // required when timetableType = GENERAL
});

export const updateTimetableEntrySchema = createTimetableEntrySchema.partial();

// ── Events ─────────────────────────────────────────────────

export const createEventSchema = z.object({
  title: z.string().min(3).max(200),
  description: z.string().max(2000).optional(),
  datetime: z.string().datetime().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  location: z.string().max(200).optional(),
  venue: z.string().max(200).optional(),
  imageUrl: z.string().url().optional(),
  departmentId: z.string().optional(),
  level: z.string().optional(),
  requiresTicket: z.boolean().default(false),
}).transform((d) => ({
  title: d.title,
  description: d.description,
  type: 'INFO_ONLY' as const,
  startDate: d.datetime ?? d.startDate,
  endDate: d.endDate,
  venue: d.location ?? d.venue,
  imageUrl: d.imageUrl,
  departmentId: d.departmentId,
  level: d.level,
  requiresTicket: d.requiresTicket,
})).refine((d) => Boolean(d.startDate), {
  message: 'datetime is required',
  path: ['datetime'],
});

export const updateEventSchema = z.object({
  title: z.string().min(3).max(200).optional(),
  description: z.string().max(2000).optional(),
  datetime: z.string().datetime().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  location: z.string().max(200).optional(),
  venue: z.string().max(200).optional(),
  imageUrl: z.string().url().optional(),
  departmentId: z.string().optional().nullable(),
  level: z.string().optional().nullable(),
}).transform((d) => ({
  title: d.title,
  description: d.description,
  startDate: d.datetime ?? d.startDate,
  endDate: d.endDate,
  venue: d.location ?? d.venue,
  imageUrl: d.imageUrl,
  departmentId: d.departmentId,
  level: d.level,
}));

// ── Tickets ────────────────────────────────────────────────

export const submitReceiptSchema = z.object({
  receiptUrl: z.string().url(),
  receiptKey: z.string().min(1),
});

export const rejectTicketSchema = z.object({
  rejectionReason: z.string().min(5).max(500),
});

// ── Event Reminder ─────────────────────────────────────────

export const setEventReminderSchema = z.object({
  notifyAt: z.string().datetime(),
});

// ── Emergency Contacts ─────────────────────────────────────

export const emergencyCategoryEnum = z.enum(['SECURITY', 'CLINIC', 'STUDENT_AFFAIRS', 'OTHER']);

export const createEmergencyContactSchema = z.object({
  name: z.string().min(2).max(200),
  role: z.string().min(2).max(100),
  phone: z.string().min(7).max(20),
  whatsappNumber: z.string().min(7).max(20).optional(),
  extension: z.string().max(10).optional(),
  category: emergencyCategoryEnum.default('OTHER'),
  order: z.number().int().min(0).default(0),
});

export const updateEmergencyContactSchema = createEmergencyContactSchema.partial();
