// lib/reminders.api.ts

import { apiGet, apiPost, apiPatch, apiDelete } from '@/lib/api';
import type {
  Reminder,
  CreateReminderPayload,
  UpdateReminderPayload,
} from '@/types/reminders';

export const listReminders = (params?: { page?: number; limit?: number }) =>
  apiGet<{ data: Reminder[]; total: number; page: number; limit: number }>(
    '/reminders',
    params as any
  );

export const createReminder = (payload: CreateReminderPayload) =>
  apiPost<Reminder>('/reminders', payload);

export const updateReminder = (id: string, payload: UpdateReminderPayload) =>
  apiPatch<Reminder>(`/reminders/${id}`, payload);

export const deleteReminder = (id: string) =>
  apiDelete<{ message: string }>(`/reminders/${id}`);

export const completeReminder = (id: string) =>
  apiPost<Reminder>(`/reminders/${id}/complete`, {});