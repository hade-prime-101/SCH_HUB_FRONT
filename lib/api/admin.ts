import { apiFetch } from "./base";

export const adminApi = {


  // ─── School Admin — Scoped Dashboard ─────────────────────────────────────────

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  getSchoolAdminStats: () => apiFetch<any>("/school-admin/stats"),

  getSchoolAdminAuditLogs: (params?: Record<string, string>) => {
    const q = params ? "?" + new URLSearchParams(params).toString() : "";
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return apiFetch<any>(`/school-admin/audit-logs${q}`);
  },

  getSchoolAdminUsers: (params?: Record<string, string>) => {
    const q = params ? "?" + new URLSearchParams(params).toString() : "";
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return apiFetch<any>(`/school-admin/users${q}`);
  },

  schoolAdminBlockUser: (userId: string) =>
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    apiFetch<any>(`/school-admin/users/${userId}/block`, { method: "PATCH" }),

  schoolAdminUnblockUser: (userId: string) =>
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    apiFetch<any>(`/school-admin/users/${userId}/unblock`, { method: "PATCH" }),

  getSchoolAdminAgents: (status?: "PENDING" | "APPROVED" | "REJECTED") => {
    const q = status ? `?status=${status}` : "";
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return apiFetch<any[]>(`/school-admin/agents${q}`);
  },

  revokeAgent: (userId: string) =>
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    apiFetch<any>(`/school-admin/agents/${userId}/revoke`, { method: "PATCH" }),

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  getSchoolAdminFaculties: () => apiFetch<any[]>("/school-admin/faculties"),

  getSchoolAdminDepartments: (facultyId?: string) => {
    const q = facultyId ? `?facultyId=${facultyId}` : "";
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return apiFetch<any[]>(`/school-admin/departments${q}`);
  },

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  getSchoolAdminFaqs: () => apiFetch<any[]>("/school-admin/faqs"),

  createSchoolAdminFaq: (data: Record<string, unknown>) =>
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    apiFetch<any>("/school-admin/faqs", { method: "POST", body: JSON.stringify(data) }),

  updateSchoolAdminFaq: (faqId: string, data: Record<string, unknown>) =>
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    apiFetch<any>(`/school-admin/faqs/${faqId}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),

  deleteSchoolAdminFaq: (faqId: string) =>
    apiFetch<void>(`/school-admin/faqs/${faqId}`, { method: "DELETE" }),
};
