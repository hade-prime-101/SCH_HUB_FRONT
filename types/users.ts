// types/users.ts

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  bio?: string;
  department?: string;
  level?: string;
  role: string;
  schoolId?: string;
  isActive: boolean;
  createdAt: string;
}

export interface UpdateProfilePayload {
  name?: string;
  bio?: string;
  department?: string;
  level?: string;
}

export interface UserSettings {
  id: string;
  userId: string;
  emailEnabled: boolean;
  pushEnabled: boolean;
  // other settings fields
  [key: string]: any;
}

export interface UpdateSettingsPayload {
  emailEnabled?: boolean;
  pushEnabled?: boolean;
  [key: string]: any;
}

export interface UserSession {
  id: string;
  userId: string;
  deviceInfo?: string;
  ip?: string;
  createdAt: string;
  lastActiveAt?: string;
}

export interface Bookmark {
  id: string;
  userId: string;
  targetType: 'material' | 'listing' | 'post'; // adjust as needed
  targetId: string;
  createdAt: string;
}

export interface UserMaterial {
  id: string;
  title: string;
  courseCode?: string;
  courseTitle?: string;
  createdAt: string;
  // other fields
}

export interface RegisterFcmTokenPayload {
  fcmToken: string;
}

export interface SearchUsersQuery {
  q?: string;
  page?: number;
  limit?: number;
  role?: string;
}

export interface ListUsersQuery {
  page?: number;
  limit?: number;
  role?: string;
  search?: string;
}

export interface AssignRolePayload {
  userId: string;
  role: string; // e.g. 'COURSE_REP', 'MODERATOR', 'ADMIN'
}

export interface NominateCourseRepPayload {
  userId: string;
}