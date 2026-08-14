// lib/notifications.api.ts

import { apiGet, apiPost, apiPatch, apiDelete } from '@/lib/api';
import type {
  Notification,
  NotificationSettings,
  UpdateSettingsPayload,
} from '@/types/notifications';

// ─── Notifications ───────────────────────────────────────────
export const listNotifications = (params?: { page?: number; limit?: number }) =>
  apiGet<{
    data: Notification[];
    total: number;
    unreadCount: number;
    page: number;
    limit: number;
  }>('/notifications', params as any);

export const markAsRead = (id: string) =>
  apiPost<Notification>(`/notifications/${id}/read`, {});

export const markAllAsRead = () =>
  apiPost<{ modified: number }>('/notifications/read-all', {});

export const deleteNotification = (id: string) =>
  apiDelete<{ message: string }>(`/notifications/${id}`);

// ─── Settings ────────────────────────────────────────────────
export const getNotificationSettings = () =>
  apiGet<NotificationSettings>('/notifications/settings');

export const updateNotificationSettings = (payload: UpdateSettingsPayload) =>
  apiPatch<NotificationSettings>('/notifications/settings', payload);