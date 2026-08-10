import { apiFetch } from "./base";

export const plannerApi = {
  getToday: () => apiFetch<any[]>("/planner/today"),

  /** weekOffset: 0 = current week, 1 = next week, -1 = last week */
  getWeekly: (weekOffset = 0) =>
    apiFetch<any[]>(`/planner/weekly?weekOffset=${weekOffset}`),
};

export const remindersApi = {
  getReminders: (params?: Record<string, string>) => {
    const q = params ? "?" + new URLSearchParams(params).toString() : "";
    return apiFetch<any>(`/reminders${q}`);
  },

  createReminder: (data: Record<string, unknown>) =>
    apiFetch<any>("/reminders", { method: "POST", body: JSON.stringify(data) }),

  updateReminder: (id: string, data: Record<string, unknown>) =>
    apiFetch<any>(`/reminders/${id}`, { method: "PATCH", body: JSON.stringify(data) }),

  deleteReminder: (id: string) =>
    apiFetch<void>(`/reminders/${id}`, { method: "DELETE" }),

  completeReminder: (id: string) =>
    apiFetch<any>(`/reminders/${id}/complete`, { method: "PATCH" }),
};

export const notificationsApi = {
  getNotifications: (params?: Record<string, string>) => {
    const q = params ? "?" + new URLSearchParams(params).toString() : "";
    return apiFetch<any>(`/notifications${q}`);
  },

  markAllRead: () =>
    apiFetch<any>("/notifications/read-all", { method: "PATCH" }),

  markRead: (id: string) =>
    apiFetch<any>(`/notifications/${id}/read`, { method: "PATCH" }),

  deleteNotification: (id: string) =>
    apiFetch<void>(`/notifications/${id}`, { method: "DELETE" }),

  getSettings: () => apiFetch<any>("/notifications/settings"),

  updateSettings: (data: Record<string, unknown>) =>
    apiFetch<any>("/notifications/settings", {
      method: "PATCH",
      body: JSON.stringify(data),
    }),
};

export const campusMapApi = {
  getFeatures: (params?: Record<string, string>) => {
    const q = params ? "?" + new URLSearchParams(params).toString() : "";
    return apiFetch<any>(`/campus-map/features${q}`);
  },

  getFeature: (id: string) => apiFetch<any>(`/campus-map/features/${id}`),

  /** Get entrance points for a specific campus feature — returns GeoJSON FeatureCollection */
  getFeatureEntrances: (id: string) =>
    apiFetch<any>(`/campus-map/features/${id}/entrances`),

  getCategories: () => apiFetch<any[]>("/campus-map/categories"),

  search: (q: string, category?: string, near?: string) => {
    const params = new URLSearchParams({ q });
    if (category) params.set("category", category);
    if (near) params.set("near", near);
    return apiFetch<any>(`/campus-map/search?${params.toString()}`);
  },

  getNearest: (lat: number, lng: number, category?: string) => {
    const params = new URLSearchParams({ lat: String(lat), lng: String(lng) });
    if (category) params.set("category", category);
    return apiFetch<any[]>(`/campus-map/nearest?${params.toString()}`);
  },

  getRoute: (data: Record<string, unknown>) =>
    apiFetch<any>("/campus-map/route", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  checkRouteProgress: (data: { routeId: string; user: { lat: number; lng: number }; route: unknown }) =>
    apiFetch<any>("/campus-map/route/progress", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  getTilesMetadata: () => apiFetch<any>("/campus-map/tiles/metadata"),
};

/**
 * Socket.IO event names for study group real-time chat.
 *
 * Connect with:
 *   io(SOCKET_URL, { auth: { token: accessToken } })
 *
 * IMPORTANT: Always include groupId in message payloads — the backend
 * reads it from data.groupId (known gap in backend, not inferred from room).
 */
export const SOCKET_EVENTS = {
  // Client → Server
  JOIN_GROUP: "group:join",
  LEAVE_GROUP: "group:leave",
  SEND_MESSAGE: "group:message",
  ASK_AI: "group:ask",
  WATCH_CHALLENGE: "group:challenge:watch",

  // Server → Client
  NEW_MESSAGE: "group:message",
  JOINED: "group:joined",
  AI_THINKING: "group:ask:thinking",
  ERROR: "error",
} as const;
