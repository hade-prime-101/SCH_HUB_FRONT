// types/notifications.ts

export interface Notification {
  id: string;
  userId: string;
  title: string;
  body: string;
  type: string;             // e.g. 'event_reminder', 'ticket_update', 'mention'
  data?: Record<string, any>; // optional payload (eventId, etc.)
  isRead: boolean;
  createdAt: string;
}

export interface NotificationSettings {
  id: string;
  userId: string;
  emailEnabled: boolean;
  pushEnabled: boolean;
  // additional type‑specific toggles as needed
  types?: {
    event_reminder?: boolean;
    ticket_update?: boolean;
    mention?: boolean;
    // ...
  };
}

export interface UpdateSettingsPayload {
  emailEnabled?: boolean;
  pushEnabled?: boolean;
  types?: Record<string, boolean>;
}