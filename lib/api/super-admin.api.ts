// lib/super-admin.api.ts

import { apiGet, apiPost, apiPatch, apiDelete } from '@/lib/api';
import type {
  AdminUser, School, Faculty, Department, AuditLog, PlatformStats, SchoolStats,
  SchoolUser, Agent, FAQ, MapFeature, MapEntrance,
  CreateAdminPayload, ResetAdminPasswordPayload, CreateSchoolPayload, UpdateSchoolPayload,
  CreateFacultyPayload, CreateDepartmentPayload, ListAuditLogsQuery,
  UpsertMapFeaturePayload, UpsertMapEntrancePayload, ImportMapGeoJsonPayload,
} from '@/types/super-admin';

// ─── Admin management ───────────────────────────────────────
export const createAdmin = (payload: CreateAdminPayload) =>
  apiPost<AdminUser>('/super-admin/admins', payload);

export const listAdmins = (schoolId?: string) =>
  apiGet<AdminUser[]>('/super-admin/admins', { schoolId });

export const deleteAdmin = (adminId: string) =>
  apiDelete<{ message: string }>(`/super-admin/admins/${adminId}`);

export const deactivateAdmin = (adminId: string) =>
  apiPost<AdminUser>(`/super-admin/admins/${adminId}/deactivate`);

export const reactivateAdmin = (adminId: string) =>
  apiPost<AdminUser>(`/super-admin/admins/${adminId}/reactivate`);

export const resetAdminPassword = (adminId: string, payload: ResetAdminPasswordPayload) =>
  apiPost<{ message: string }>(`/super-admin/admins/${adminId}/reset-password`, payload);

// ─── User block/unblock ─────────────────────────────────────
export const blockUser = (userId: string) =>
  apiPost<{ message: string }>(`/super-admin/users/${userId}/block`);

export const unblockUser = (userId: string) =>
  apiPost<{ message: string }>(`/super-admin/users/${userId}/unblock`);

// ─── School management ──────────────────────────────────────
export const createSchool = (payload: CreateSchoolPayload) =>
  apiPost<School>('/super-admin/schools', payload);

export const updateSchool = (schoolId: string, payload: UpdateSchoolPayload) =>
  apiPatch<School>(`/super-admin/schools/${schoolId}`, payload);

export const listAllSchools = () =>
  apiGet<School[]>('/super-admin/schools');

// ─── Faculty / Department ───────────────────────────────────
export const createFaculty = (schoolId: string, payload: CreateFacultyPayload) =>
  apiPost<Faculty>(`/super-admin/schools/${schoolId}/faculties`, payload);

export const listFaculties = (schoolId: string) =>
  apiGet<Faculty[]>(`/super-admin/schools/${schoolId}/faculties`);

export const deleteFaculty = (facultyId: string) =>
  apiDelete<{ message: string }>(`/super-admin/faculties/${facultyId}`);

export const createDepartment = (facultyId: string, payload: CreateDepartmentPayload) =>
  apiPost<Department>(`/super-admin/faculties/${facultyId}/departments`, payload);

export const listDepartments = (facultyId: string) =>
  apiGet<Department[]>(`/super-admin/faculties/${facultyId}/departments`);

export const deleteDepartment = (departmentId: string) =>
  apiDelete<{ message: string }>(`/super-admin/departments/${departmentId}`);

// ─── Audit logs ─────────────────────────────────────────────
export const getAuditLogs = (params: ListAuditLogsQuery) =>
  apiGet<{ data: AuditLog[]; total: number; page: number; limit: number }>(
    '/super-admin/audit-logs',
    params as any
  );

// ─── Analytics ──────────────────────────────────────────────
export const getPlatformStats = () =>
  apiGet<PlatformStats>('/super-admin/stats/platform');

export const getSchoolStats = () =>
  apiGet<SchoolStats>('/super-admin/stats/school');

// ─── School users & agents ─────────────────────────────────
export const listSchoolUsers = (params?: { page?: number; limit?: number; search?: string; role?: string }) =>
  apiGet<{ data: SchoolUser[]; total: number; page: number; limit: number; pages: number }>(
    '/super-admin/school/users',
    params as any
  );

export const blockSchoolUser = (userId: string) =>
  apiPost<{ message: string }>(`/super-admin/school/users/${userId}/block`);

export const unblockSchoolUser = (userId: string) =>
  apiPost<{ message: string }>(`/super-admin/school/users/${userId}/unblock`);

export const listAllAgents = (status?: string) =>
  apiGet<Agent[]>('/super-admin/agents', { status });

export const revokeAgent = (userId: string, note?: string) =>
  apiPost<{ message: string }>(`/super-admin/agents/${userId}/revoke`, { note });

// ─── School audit logs ──────────────────────────────────────
export const getSchoolAuditLogs = (params: ListAuditLogsQuery) =>
  apiGet<{ data: AuditLog[]; total: number; page: number; limit: number }>(
    '/super-admin/school/audit-logs',
    params as any
  );

// ─── Faculties & Departments (school scoped) ────────────────
export const getSchoolFaculties = () =>
  apiGet<Faculty[]>('/super-admin/school/faculties');

export const getSchoolDepartments = (facultyId?: string) =>
  apiGet<Department[]>('/super-admin/school/departments', { facultyId });

// ─── FAQs ───────────────────────────────────────────────────
export const listSchoolFaqs = () =>
  apiGet<FAQ[]>('/super-admin/school/faqs');

export const createSchoolFaq = (payload: Partial<FAQ>) =>
  apiPost<FAQ>('/super-admin/school/faqs', payload);

export const updateSchoolFaq = (faqId: string, payload: Partial<FAQ>) =>
  apiPatch<FAQ>(`/super-admin/school/faqs/${faqId}`, payload);

export const deleteSchoolFaq = (faqId: string) =>
  apiDelete<{ message: string }>(`/super-admin/school/faqs/${faqId}`);

// ─── Campus map admin ───────────────────────────────────────
export const listMapFeatures = (schoolId: string, params?: { bbox?: string; category?: string; limit?: number }) =>
  apiGet<MapFeature[]>(`/super-admin/schools/${schoolId}/map/features`, params as any);

export const listMapEntrances = (schoolId: string, featureId?: string) =>
  apiGet<MapEntrance[]>(`/super-admin/schools/${schoolId}/map/entrances`, { featureId });

export const upsertMapFeature = (schoolId: string, payload: UpsertMapFeaturePayload) =>
  apiPost<MapFeature>(`/super-admin/schools/${schoolId}/map/features`, payload);

export const deleteMapFeature = (schoolId: string, featureId: string) =>
  apiDelete<{ message: string }>(`/super-admin/schools/${schoolId}/map/features/${featureId}`);

export const upsertMapEntrance = (schoolId: string, payload: UpsertMapEntrancePayload) =>
  apiPost<MapEntrance>(`/super-admin/schools/${schoolId}/map/entrances`, payload);

export const deleteMapEntrance = (schoolId: string, entranceId: string) =>
  apiDelete<{ message: string }>(`/super-admin/schools/${schoolId}/map/entrances/${entranceId}`);

export const importMapGeoJson = (schoolId: string, payload: ImportMapGeoJsonPayload) =>
  apiPost<{ imported: number }>(`/super-admin/schools/${schoolId}/map/import`, payload);

export const uploadMapFeatureImage = (schoolId: string, featureId: string, file: File) => {
  const formData = new FormData();
  formData.append('file', file);
  return apiPost<{ imageUrl: string }>(
    `/super-admin/schools/${schoolId}/map/features/${featureId}/image`,
    formData,
    true
  );
};

export const deleteMapFeatureImage = (schoolId: string, featureId: string, imageUrl: string) =>
  apiPost<{ message: string }>(`/super-admin/schools/${schoolId}/map/features/${featureId}/image/delete`, { imageUrl });