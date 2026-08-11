import { z } from 'zod';

export const listNotificationsSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(30),
});

const timeRegex = /^\d{2}:\d{2}$/;

export const updateSettingsSchema = z.object({
  pushNotifications: z.boolean().optional(),
  reminderPush: z.boolean().optional(),
  eventPush: z.boolean().optional(),
  whatsappOptIn: z.boolean().optional(),
  announcementPush: z.boolean().optional(),
  quietHoursEnabled: z.boolean().optional(),
  quietHoursStart: z.string().regex(timeRegex, 'Format HH:MM').optional(),
  quietHoursEnd: z.string().regex(timeRegex, 'Format HH:MM').optional(),
  lowDataMode: z.boolean().optional(),
  darkMode: z.boolean().optional(),
});
