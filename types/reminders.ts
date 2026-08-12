// types/reminders.ts

export interface Reminder {
  id: string;
  title: string;
  description?: string;
  dueDate: string;      // ISO date or datetime
  isCompleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateReminderPayload {
  title: string;
  description?: string;
  dueDate: string;
}

export interface UpdateReminderPayload {
  title?: string;
  description?: string;
  dueDate?: string;
  isCompleted?: boolean;
}