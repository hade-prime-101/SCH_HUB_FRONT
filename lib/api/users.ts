import { apiFetch } from "./base";
import type { User } from "@/types/auth";

export const usersApi = {
  getMe: () => apiFetch<User>("/users/me"),

  getUser: (id: string) => apiFetch<User>(`/users/${id}`),

  updateProfile: (data: { fullName?: string; phone?: string; bio?: string; level?: string }) =>
    apiFetch<User>("/users/me/profile", { method: "PATCH", body: JSON.stringify(data) }),

  uploadAvatar: (file: File) => {
    const form = new FormData();
    form.append("avatar", file);
    return apiFetch<{ profilePictureUrl: string }>("/users/me/avatar", {
      method: "POST",
      body: form,
    });
  },

  updateSettings: (data: Record<string, unknown>) =>
    apiFetch<any>("/users/me/settings", { method: "PATCH", body: JSON.stringify(data) }),

  registerFcmToken: (fcmToken: string) =>
    apiFetch<any>("/users/me/fcm-token", { method: "POST", body: JSON.stringify({ fcmToken }) }),

  getBookmarks: () => apiFetch<any[]>("/users/me/bookmarks"),

  getMyMaterials: () => apiFetch<any[]>("/users/me/materials"),

  getUserMaterials: (id: string) => apiFetch<any[]>(`/users/${id}/materials`),

  getSessions: () => apiFetch<any[]>("/users/me/sessions"),

  revokeSession: (sessionId: string) =>
    apiFetch<void>(`/users/me/sessions/${sessionId}`, { method: "DELETE" }),

  revokeAllSessions: () =>
    apiFetch<void>("/users/me/sessions", { method: "DELETE" }),

  searchUsers: (q: string, page = 1, limit = 20) =>
    apiFetch<any>(`/users/search?q=${encodeURIComponent(q)}&page=${page}&limit=${limit}`),

  listUsers: (params?: Record<string, string>) => {
    const q = params ? "?" + new URLSearchParams(params).toString() : "";
    return apiFetch<any>(`/users${q}`);
  },

  nominateCourseRep: (userId: string) =>
    apiFetch<any>("/users/nominate-course-rep", {
      method: "PATCH",
      body: JSON.stringify({ userId }),
    }),

  assignRole: (userId: string, role: string) =>
    apiFetch<any>("/users/assign-role", {
      method: "PATCH",
      body: JSON.stringify({ userId, role }),
    }),
};
