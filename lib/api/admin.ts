import { apiFetch } from "./base";

export const adminApi = {
  // ─── Super Admin — Stats & Logs ──────────────────────────────────────────────

  getStats: () => apiFetch<any>("/super-admin/stats"),

  getAuditLogs: (params?: Record<string, string>) => {
    const q = params ? "?" + new URLSearchParams(params).toString() : "";
    return apiFetch<any>(`/super-admin/audit-logs${q}`);
  },

  // ─── Super Admin — Schools ───────────────────────────────────────────────────

  getSchools: () => apiFetch<any[]>("/super-admin/schools"),

  createSchool: (data: Record<string, unknown>) =>
    apiFetch<any>("/super-admin/schools", { method: "POST", body: JSON.stringify(data) }),

  updateSchool: (schoolId: string, data: Record<string, unknown>) =>
    apiFetch<any>(`/super-admin/schools/${schoolId}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),

  // ─── Super Admin — Faculties ─────────────────────────────────────────────────

  getFaculties: (schoolId: string) =>
    apiFetch<any[]>(`/super-admin/schools/${schoolId}/faculties`),

  createFaculty: (schoolId: string, name: string) =>
    apiFetch<any>(`/super-admin/schools/${schoolId}/faculties`, {
      method: "POST",
      body: JSON.stringify({ name }),
    }),

  deleteFaculty: (facultyId: string) =>
    apiFetch<void>(`/super-admin/faculties/${facultyId}`, { method: "DELETE" }),

  // ─── Super Admin — Departments ───────────────────────────────────────────────

  getDepartments: (facultyId: string) =>
    apiFetch<any[]>(`/super-admin/faculties/${facultyId}/departments`),

  createDepartment: (facultyId: string, data: Record<string, unknown>) =>
    apiFetch<any>(`/super-admin/faculties/${facultyId}/departments`, {
      method: "POST",
      body: JSON.stringify(data),
    }),

  deleteDepartment: (departmentId: string) =>
    apiFetch<void>(`/super-admin/departments/${departmentId}`, { method: "DELETE" }),

  // ─── Super Admin — School Admins ─────────────────────────────────────────────

  getAdmins: (schoolId?: string) => {
    const q = schoolId ? `?schoolId=${schoolId}` : "";
    return apiFetch<any[]>(`/super-admin/admins${q}`);
  },

  createAdmin: (data: Record<string, unknown>) =>
    apiFetch<any>("/super-admin/admins", { method: "POST", body: JSON.stringify(data) }),

  deactivateAdmin: (adminId: string) =>
    apiFetch<any>(`/super-admin/admins/${adminId}/deactivate`, { method: "PATCH" }),

  reactivateAdmin: (adminId: string) =>
    apiFetch<any>(`/super-admin/admins/${adminId}/reactivate`, { method: "PATCH" }),

  resetAdminPassword: (adminId: string, newPassword: string) =>
    apiFetch<any>(`/super-admin/admins/${adminId}/reset-password`, {
      method: "PATCH",
      body: JSON.stringify({ newPassword }),
    }),

  deleteAdmin: (adminId: string) =>
    apiFetch<void>(`/super-admin/admins/${adminId}`, { method: "DELETE" }),

  // ─── Super Admin — User Controls ─────────────────────────────────────────────

  blockUser: (userId: string) =>
    apiFetch<any>(`/super-admin/users/${userId}/block`, { method: "PATCH" }),

  unblockUser: (userId: string) =>
    apiFetch<any>(`/super-admin/users/${userId}/unblock`, { method: "PATCH" }),

  // ─── Super Admin — Campus Map Management ─────────────────────────────────────

  getMapFeatures: (schoolId: string) =>
    apiFetch<any[]>(`/super-admin/map/schools/${schoolId}/features`),

  getMapEntrances: (schoolId: string) =>
    apiFetch<any[]>(`/super-admin/map/schools/${schoolId}/entrances`),

  upsertMapFeature: (schoolId: string, data: Record<string, unknown>) =>
    apiFetch<any>(`/super-admin/map/schools/${schoolId}/features`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  deleteMapFeature: (schoolId: string, featureId: string) =>
    apiFetch<void>(`/super-admin/map/schools/${schoolId}/features/${featureId}`, {
      method: "DELETE",
    }),

  uploadMapFeatureImage: (schoolId: string, featureId: string, file: File) => {
    const form = new FormData();
    form.append("image", file);
    return apiFetch<any>(
      `/super-admin/map/schools/${schoolId}/features/${featureId}/images`,
      { method: "POST", body: form },
    );
  },

  deleteMapFeatureImages: (schoolId: string, featureId: string, imageUrl?: string) =>
    apiFetch<void>(
      `/super-admin/map/schools/${schoolId}/features/${featureId}/images`,
      { method: "DELETE", body: JSON.stringify({ imageUrl }) },
    ),

  upsertMapEntrance: (schoolId: string, data: Record<string, unknown>) =>
    apiFetch<any>(`/super-admin/map/schools/${schoolId}/entrances`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  deleteMapEntrance: (schoolId: string, entranceId: string) =>
    apiFetch<void>(`/super-admin/map/schools/${schoolId}/entrances/${entranceId}`, {
      method: "DELETE",
    }),

  importMapData: (schoolId: string, features: unknown[]) =>
    apiFetch<any>(`/super-admin/map/schools/${schoolId}/import`, {
      method: "POST",
      body: JSON.stringify({ features }),
    }),

  // ─── School Admin — Scoped Dashboard ─────────────────────────────────────────

  getSchoolAdminStats: () => apiFetch<any>("/school-admin/stats"),

  getSchoolAdminAuditLogs: (params?: Record<string, string>) => {
    const q = params ? "?" + new URLSearchParams(params).toString() : "";
    return apiFetch<any>(`/school-admin/audit-logs${q}`);
  },

  getSchoolAdminUsers: (params?: Record<string, string>) => {
    const q = params ? "?" + new URLSearchParams(params).toString() : "";
    return apiFetch<any>(`/school-admin/users${q}`);
  },

  schoolAdminBlockUser: (userId: string) =>
    apiFetch<any>(`/school-admin/users/${userId}/block`, { method: "PATCH" }),

  schoolAdminUnblockUser: (userId: string) =>
    apiFetch<any>(`/school-admin/users/${userId}/unblock`, { method: "PATCH" }),

  getSchoolAdminAgents: (status?: "PENDING" | "APPROVED" | "REJECTED") => {
    const q = status ? `?status=${status}` : "";
    return apiFetch<any[]>(`/school-admin/agents${q}`);
  },

  revokeAgent: (userId: string) =>
    apiFetch<any>(`/school-admin/agents/${userId}/revoke`, { method: "PATCH" }),

  getSchoolAdminFaculties: () => apiFetch<any[]>("/school-admin/faculties"),

  getSchoolAdminDepartments: (facultyId?: string) => {
    const q = facultyId ? `?facultyId=${facultyId}` : "";
    return apiFetch<any[]>(`/school-admin/departments${q}`);
  },

  getSchoolAdminFaqs: () => apiFetch<any[]>("/school-admin/faqs"),

  createSchoolAdminFaq: (data: Record<string, unknown>) =>
    apiFetch<any>("/school-admin/faqs", { method: "POST", body: JSON.stringify(data) }),

  updateSchoolAdminFaq: (faqId: string, data: Record<string, unknown>) =>
    apiFetch<any>(`/school-admin/faqs/${faqId}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),

  deleteSchoolAdminFaq: (faqId: string) =>
    apiFetch<void>(`/school-admin/faqs/${faqId}`, { method: "DELETE" }),
};
