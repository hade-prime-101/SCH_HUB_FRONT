import { apiFetch } from "./base";

export const marketplaceApi = {
  // ─── Listings ────────────────────────────────────────────────────────────────

  getListings: (params?: Record<string, string>) => {
    const q = params ? "?" + new URLSearchParams(params).toString() : "";
    return apiFetch<any>(`/marketplace/listings${q}`);
  },

  getListing: (id: string) => apiFetch<any>(`/marketplace/listings/${id}`),

  getSavedListings: () => apiFetch<any[]>("/marketplace/listings/saved"),

  /** Admin only — listings pending moderation */
  getPendingListings: () => apiFetch<any[]>("/marketplace/listings/pending"),

  createListing: (data: Record<string, unknown>) =>
    apiFetch<any>("/marketplace/listings", { method: "POST", body: JSON.stringify(data) }),

  uploadListingImage: (file: File) => {
    const form = new FormData();
    form.append("image", file);
    return apiFetch<{ url: string }>("/marketplace/listings/upload-image", {
      method: "POST",
      body: form,
    });
  },

  updateListing: (id: string, data: Record<string, unknown>) =>
    apiFetch<any>(`/marketplace/listings/${id}`, { method: "PATCH", body: JSON.stringify(data) }),

  deleteListing: (id: string) =>
    apiFetch<void>(`/marketplace/listings/${id}`, { method: "DELETE" }),

  saveListing: (id: string) =>
    apiFetch<{ saved: boolean }>(`/marketplace/listings/${id}/save`, { method: "POST" }),

  /** Admin — approve or reject a listing */
  moderateListing: (id: string, decision: "APPROVED" | "REJECTED", note?: string) =>
    apiFetch<any>(`/marketplace/listings/${id}/moderate`, {
      method: "PATCH",
      body: JSON.stringify({ decision, note }),
    }),

  // ─── Shops ───────────────────────────────────────────────────────────────────

  getShop: (id: string) => apiFetch<any>(`/marketplace/shops/${id}`),

  getShops: (params?: Record<string, string>) => {
    const q = params ? "?" + new URLSearchParams(params).toString() : "";
    return apiFetch<any[]>(`/marketplace/shops${q}`);
  },

  getMyShop: () => apiFetch<any>("/marketplace/shops/me"),

  createShop: (data: Record<string, unknown>) =>
    apiFetch<any>("/marketplace/shops", { method: "POST", body: JSON.stringify(data) }),

  updateMyShop: (data: Record<string, unknown>) =>
    apiFetch<any>("/marketplace/shops/me", { method: "PATCH", body: JSON.stringify(data) }),

  adminDeleteShop: (id: string) =>
    apiFetch<void>(`/marketplace/shops/${id}`, { method: "DELETE" }),

  followShop: (id: string) =>
    apiFetch<{ following: boolean }>(`/marketplace/shops/${id}/follow`, { method: "POST" }),

  rateSeller: (id: string, rating: number, comment?: string) =>
    apiFetch<any>(`/marketplace/sellers/${id}/rate`, {
      method: "POST",
      body: JSON.stringify({ rating, comment }),
    }),

  // ─── House Agents ─────────────────────────────────────────────────────────────

  applyAsAgent: (data: {
    businessName: string;
    businessAddress: string;
    phoneNumber: string;
    studentIdFile: File;
  }) => {
    const form = new FormData();
    form.append("businessName",    data.businessName);
    form.append("businessAddress", data.businessAddress);
    form.append("phoneNumber",     data.phoneNumber);
    form.append("studentId",       data.studentIdFile);
    return apiFetch<any>("/marketplace/agents/apply", { method: "POST", body: form });
  },

  getMyAgentProfile: () => apiFetch<any>("/marketplace/agents/me"),

  /** Admin — list pending agent applications */
  getPendingAgents: () => apiFetch<any[]>("/marketplace/agents/pending"),

  /** Admin — approve or reject an agent application */
  reviewAgent: (userId: string, decision: "APPROVED" | "REJECTED", note?: string) =>
    apiFetch<any>(`/marketplace/agents/${userId}/review`, {
      method: "PATCH",
      body: JSON.stringify({ decision, note }),
    }),

  // ─── Lost & Found ─────────────────────────────────────────────────────────────

  getLostFound: (params?: Record<string, string>) => {
    const q = params ? "?" + new URLSearchParams(params).toString() : "";
    return apiFetch<any>(`/marketplace/lost-found${q}`);
  },

  reportLostFound: (data: Record<string, unknown>) =>
    apiFetch<any>("/marketplace/lost-found", { method: "POST", body: JSON.stringify(data) }),

  resolveLostFound: (id: string) =>
    apiFetch<any>(`/marketplace/lost-found/${id}/resolve`, { method: "PATCH" }),

  // ─── Accommodation ────────────────────────────────────────────────────────────

  getAccommodation: (params?: Record<string, string>) => {
    const q = params ? "?" + new URLSearchParams(params).toString() : "";
    return apiFetch<any>(`/marketplace/accommodation${q}`);
  },

  getAccommodationItem: (id: string) => apiFetch<any>(`/marketplace/accommodation/${id}`),

  createAccommodation: (data: Record<string, unknown>) =>
    apiFetch<any>("/marketplace/accommodation", { method: "POST", body: JSON.stringify(data) }),

  updateAccommodation: (id: string, data: Record<string, unknown>) =>
    apiFetch<any>(`/marketplace/accommodation/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),

  deleteAccommodation: (id: string) =>
    apiFetch<void>(`/marketplace/accommodation/${id}`, { method: "DELETE" }),

  /** Admin — approve or reject an accommodation listing */
  moderateAccommodation: (id: string, decision: "APPROVED" | "REJECTED", note?: string) =>
    apiFetch<any>(`/marketplace/accommodation/${id}/moderate`, {
      method: "PATCH",
      body: JSON.stringify({ decision, note }),
    }),

  // ─── Roommates ───────────────────────────────────────────────────────────────

  getRoommates: (params?: Record<string, string>) => {
    const q = params ? "?" + new URLSearchParams(params).toString() : "";
    return apiFetch<any>(`/marketplace/roommates${q}`);
  },

  createRoommate: (data: Record<string, unknown>) =>
    apiFetch<any>("/marketplace/roommates", { method: "POST", body: JSON.stringify(data) }),

  updateRoommate: (id: string, data: Record<string, unknown>) =>
    apiFetch<any>(`/marketplace/roommates/${id}`, { method: "PATCH", body: JSON.stringify(data) }),

  deleteRoommate: (id: string) =>
    apiFetch<void>(`/marketplace/roommates/${id}`, { method: "DELETE" }),

  // ─── Services ────────────────────────────────────────────────────────────────

  getServices: (params?: Record<string, string>) => {
    const q = params ? "?" + new URLSearchParams(params).toString() : "";
    return apiFetch<any>(`/marketplace/services${q}`);
  },

  /** Admin — list pending service listings */
  getPendingServices: () => apiFetch<any[]>("/marketplace/services/pending"),

  getService: (id: string) => apiFetch<any>(`/marketplace/services/${id}`),

  createService: (data: Record<string, unknown>) =>
    apiFetch<any>("/marketplace/services", { method: "POST", body: JSON.stringify(data) }),

  updateService: (id: string, data: Record<string, unknown>) =>
    apiFetch<any>(`/marketplace/services/${id}`, { method: "PATCH", body: JSON.stringify(data) }),

  deleteService: (id: string) =>
    apiFetch<void>(`/marketplace/services/${id}`, { method: "DELETE" }),

  /** Admin — approve or reject a service listing */
  moderateService: (id: string, decision: "APPROVED" | "REJECTED", note?: string) =>
    apiFetch<any>(`/marketplace/services/${id}/moderate`, {
      method: "PATCH",
      body: JSON.stringify({ decision, note }),
    }),

  // ─── Jobs ────────────────────────────────────────────────────────────────────

  getJobs: (params?: Record<string, string>) => {
    const q = params ? "?" + new URLSearchParams(params).toString() : "";
    return apiFetch<any>(`/marketplace/jobs${q}`);
  },

  getJob: (id: string) => apiFetch<any>(`/marketplace/jobs/${id}`),

  getPendingJobs: () => apiFetch<any[]>("/marketplace/jobs/pending"),

  createJob: (data: Record<string, unknown>) =>
    apiFetch<any>("/marketplace/jobs", { method: "POST", body: JSON.stringify(data) }),

  updateJob: (id: string, data: Record<string, unknown>) =>
    apiFetch<any>(`/marketplace/jobs/${id}`, { method: "PATCH", body: JSON.stringify(data) }),

  deleteJob: (id: string) =>
    apiFetch<void>(`/marketplace/jobs/${id}`, { method: "DELETE" }),

  approveJob: (id: string) =>
    apiFetch<any>(`/marketplace/jobs/${id}/approve`, { method: "PATCH" }),

  rejectJob: (id: string, rejectionReason: string) =>
    apiFetch<any>(`/marketplace/jobs/${id}/reject`, {
      method: "PATCH",
      body: JSON.stringify({ rejectionReason }),
    }),

  // ─── Marketplace Reports ─────────────────────────────────────────────────────

  /** targetType: listing | accommodation | service */
  reportListing: (data: {
    targetType: "listing" | "accommodation" | "service";
    targetId: string;
    reason: "SPAM" | "FAKE_LISTING" | "INAPPROPRIATE_CONTENT" | "SCAM" | "WRONG_CATEGORY" | "OTHER";
    details?: string;
  }) =>
    apiFetch<any>("/marketplace/report", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  /** Admin — list marketplace reports */
  getMarketplaceReports: () => apiFetch<any>("/marketplace/reports"),

  /** Admin — resolve a marketplace report */
  resolveMarketplaceReport: (id: string) =>
    apiFetch<any>(`/marketplace/reports/${id}/resolve`, { method: "PATCH" }),
};
