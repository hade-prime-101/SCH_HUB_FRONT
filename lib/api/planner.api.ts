// lib/planner.api.ts

import { apiGet } from '@/lib/api';
import type { TodayPlanner, WeeklyPlanner } from '@/types/planner';

export const getTodayPlanner = () =>
  apiGet<TodayPlanner>('/planner/today');

export const getWeeklyPlanner = (weekOffset = 0) =>
  apiGet<WeeklyPlanner>(`/planner/weekly?weekOffset=${weekOffset}`);


// ─── Reminders & Notifications ───────────────────────────────
import * as RemindersModule from './reminders.api';
import * as NotificationsModule from './notifications.api';
import { campusMap } from './campus-map.api';

export const remindersApi = {
  listReminders: RemindersModule.listReminders,
  createReminder: RemindersModule.createReminder,
  updateReminder: RemindersModule.updateReminder,
  deleteReminder: RemindersModule.deleteReminder,
  completeReminder: RemindersModule.completeReminder,
};

export const notificationsApi = {
  listNotifications: NotificationsModule.listNotifications,
  markAsRead: NotificationsModule.markAsRead,
  markAllAsRead: NotificationsModule.markAllAsRead,
  deleteNotification: NotificationsModule.deleteNotification,
  getNotificationSettings: NotificationsModule.getNotificationSettings,
  updateNotificationSettings: NotificationsModule.updateNotificationSettings,
};

export const plannerApi = {
  getTodayPlanner,
  getWeeklyPlanner,
};

export const campusMapApi = campusMap;

// ─── Socket Events ───────────────────────────────────────────
export const SOCKET_EVENTS = {
  CONNECT: 'connect',
  DISCONNECT: 'disconnect',
  PLANNER_UPDATE: 'planner:update',
  REMINDER_CREATED: 'reminder:created',
  REMINDER_UPDATED: 'reminder:updated',
  REMINDER_DELETED: 'reminder:deleted',
  NOTIFICATION_NEW: 'notification:new',
  NOTIFICATION_READ: 'notification:read',
  NOTIFICATION_DELETED: 'notification:deleted',
} as const;
