import { z } from 'zod';

export const createReminderSchema = z.object({
  title: z.string().min(2).max(200),
  description: z.string().max(1000).optional(),
  dueDate: z.string().datetime(),
  notifyAt: z.string().datetime(),
  priority: z.enum(['HIGH', 'MEDIUM', 'LOW']).default('MEDIUM'),
  category: z.enum(['ASSIGNMENT', 'TEST', 'EXAM', 'PROJECT', 'PRACTICAL', 'OTHER']),
  isRecurring: z.boolean().default(false),
  recurringDays: z.array(z.number().int().min(0).max(6)).max(7).optional(),
});

export const updateReminderSchema = createReminderSchema.partial().extend({
  isCompleted: z.boolean().optional(),
});

export const listRemindersSchema = z.object({
  isCompleted: z
    .string()
    .transform((v) => v === 'true')
    .optional(),
  category: z.enum(['ASSIGNMENT', 'TEST', 'EXAM', 'PROJECT', 'PRACTICAL', 'OTHER']).optional(),
  priority: z.enum(['HIGH', 'MEDIUM', 'LOW']).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(50),
});
