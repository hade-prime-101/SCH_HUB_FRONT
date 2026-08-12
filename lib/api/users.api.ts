// lib/users.api.ts

import { apiGet, apiPost, apiPatch } from '@/lib/api';
import type {
  UserProfile,
  UpdateProfilePayload,
  UserSettings,
  UpdateSettingsPayload,
  UserSession,
  Bookmark,
  UserMaterial,
  RegisterFcmTokenPayload,
  SearchUsersQuery,
  ListUsersQuery,
  AssignRolePayload,
  NominateCourseRepPayload,
} from '@/types/users';

// ─── Profile ─────────────────────────────────────────────────
export const getMyProfile = () => apiGet<UserProfile>('/users/me');
export const getMe = () => apiGet<UserProfile>('/users/me');
export const getProfile = (id: string) => apiGet<UserProfile>(`/users/${id}`);
export const updateProfile = (payload: UpdateProfilePayload) =>
  apiPatch<UserProfile>('/users/me', payload);
export const uploadAvatar = (file: File) => {
  const formData = new FormData();
  formData.append('file', file);
  return apiPost<{ avatarUrl: string }>('/users/me/avatar', formData, true);
};

// ─── Settings & FCM ─────────────────────────────────────────
export const updateSettings = (payload: UpdateSettingsPayload) =>
  apiPatch<UserSettings>('/users/me/settings', payload);
export const registerFcmToken = (payload: RegisterFcmTokenPayload) =>
  apiPost<{ success: boolean }>('/users/me/fcm-token', payload);

// ─── Bookmarks ──────────────────────────────────────────────
export const getBookmarks = () => apiGet<Bookmark[]>('/users/me/bookmarks');

// ─── Materials ──────────────────────────────────────────────
export const getMyMaterials = () => apiGet<UserMaterial[]>('/users/me/materials');
export const getUserMaterials = (id: string) => apiGet<UserMaterial[]>(`/users/${id}/materials`);

// ─── Sessions ───────────────────────────────────────────────
export const getSessions = () => apiGet<UserSession[]>('/users/me/sessions');
export const revokeSession = (sessionId: string) =>
  apiPost<{ message: string }>('/users/me/sessions/revoke', { sessionId });
export const revokeAllSessions = () =>
  apiPost<{ message: string }>('/users/me/sessions/revoke-all');

// ─── User management (roles, search, list) ─────────────────
export const searchUsers = (query: SearchUsersQuery) =>
  apiGet<{ data: UserProfile[]; total: number; page: number; limit: number; totalPages: number; hasMore: boolean }>(
    '/users/search',
    query as any
  );

export const nominateCourseRep = (payload: NominateCourseRepPayload) =>
  apiPost<{ message: string }>('/users/nominate-course-rep', payload);

export const assignRole = (payload: AssignRolePayload) =>
  apiPost<{ message: string }>('/users/assign-role', payload);

export const listUsers = (query: ListUsersQuery) =>
  apiGet<{ data: UserProfile[]; total: number; page: number; limit: number; totalPages: number; hasMore: boolean }>(
    '/users',
    query as any
  );


// ─── Users API Object ────────────────────────────────────────
export const usersApi = {
  // Profile
  getMyProfile,
  getMe,
  getProfile,
  updateProfile,
  uploadAvatar,

  // Settings & FCM
  updateSettings,
  registerFcmToken,

  // Bookmarks
  getBookmarks,

  // Materials
  getMyMaterials,
  getUserMaterials,

  // Sessions
  getSessions,
  revokeSession,
  revokeAllSessions,

  // User management
  searchUsers,
  nominateCourseRep,
  assignRole,
  listUsers,
};
