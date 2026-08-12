import { apiFetch } from "./base";

export const adminApi = {


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
