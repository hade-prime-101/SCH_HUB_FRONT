// lib/api/marketplace.api.ts

import { apiGet, apiPost, apiPatch, apiDelete } from '@/lib/api/base';
import type {
  Listing,
  CreateListingPayload,
  UpdateListingPayload,
  ModerateContentPayload,
  Shop,
  CreateShopPayload,
  UpdateShopPayload,
  RateSellerPayload,
  LostFoundItem,
  CreateLostFoundPayload,
  Accommodation,
  CreateAccommodationPayload,
  UpdateAccommodationPayload,
  AgentProfile,
  ApplyAgentPayload,
  ReviewAgentPayload,
  RoommateRequest,
  CreateRoommatePayload,
  UpdateRoommatePayload,
  Service,
  CreateServicePayload,
  UpdateServicePayload,
  Job,
  CreateJobPayload,
  UpdateJobPayload,
  RejectJobPayload,
  ContentReport,
  ReportContentPayload,
} from '@/types/marketplace';

// ─── Image Upload ────────────────────────────────────────────
export const uploadListingImage = (file: File) => {
  const formData = new FormData();
  formData.append('file', file);
  return apiPost<{ url: string }>('/marketplace/images/upload', formData, true);
};

// ─── Listings ────────────────────────────────────────────────
export const listListings = (params?: { page?: number; limit?: number; category?: string }) =>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  apiGet<{ data: Listing[]; page: number; total: number; limit: number }>('/marketplace/listings', params as any);

export const getListing = (id: string) => apiGet<Listing>(`/marketplace/listings/${id}`);

export const createListing = (payload: CreateListingPayload) =>
  apiPost<Listing>('/marketplace/listings', payload);

export const updateListing = (id: string, payload: UpdateListingPayload) =>
  apiPatch<Listing>(`/marketplace/listings/${id}`, payload);

export const deleteListing = (id: string) =>
  apiDelete<{ message: string }>(`/marketplace/listings/${id}`);

export const toggleSaveListing = (id: string) =>
  apiPost<{ saved: boolean }>(`/marketplace/listings/${id}/save`, {});

export const getSavedListings = () =>
  apiGet<Listing[]>('/marketplace/listings/saved');

export const listPendingListings = () =>
  apiGet<Listing[]>('/marketplace/listings/pending');

export const moderateListing = (id: string, payload: ModerateContentPayload) =>
  apiPost<Listing>(`/marketplace/listings/${id}/moderate`, payload);

// ─── Shops ───────────────────────────────────────────────────
export const listShops = (page = 1, limit = 20) =>
  apiGet<{ data: Shop[]; page: number; total: number; limit: number }>(`/marketplace/shops?page=${page}&limit=${limit}`);

export const getMyShop = () => apiGet<Shop>('/marketplace/shops/my');

export const getShop = (id: string) => apiGet<Shop>(`/marketplace/shops/${id}`);

export const createShop = (payload: CreateShopPayload) =>
  apiPost<Shop>('/marketplace/shops', payload);

export const updateShop = (payload: UpdateShopPayload) =>
  apiPatch<Shop>('/marketplace/shops', payload);

export const adminDeleteShop = (id: string) =>
  apiDelete<{ message: string }>(`/marketplace/shops/${id}`);

export const followShop = (id: string) =>
  apiPost<{ following: boolean }>(`/marketplace/shops/${id}/follow`, {});

export const rateSeller = (shopId: string, payload: RateSellerPayload) =>
  apiPost<{ averageRating: number }>(`/marketplace/shops/${shopId}/rate`, payload);

// ─── Lost & Found ───────────────────────────────────────────
export const listLostFound = (params?: { page?: number; limit?: number; type?: 'LOST' | 'FOUND' }) =>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  apiGet<{ data: LostFoundItem[]; page: number; total: number; limit: number }>('/marketplace/lost-found', params as any);

export const createLostFound = (payload: CreateLostFoundPayload) =>
  apiPost<LostFoundItem>('/marketplace/lost-found', payload);

export const resolveLostFound = (id: string) =>
  apiPost<LostFoundItem>(`/marketplace/lost-found/${id}/resolve`, {});

// ─── Accommodation ──────────────────────────────────────────
export const listAccommodation = (params?: { page?: number; limit?: number }) =>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  apiGet<{ data: Accommodation[]; page: number; total: number; limit: number }>('/marketplace/accommodation', params as any);

export const getAccommodation = (id: string) =>
  apiGet<Accommodation>(`/marketplace/accommodation/${id}`);

export const createAccommodation = (payload: CreateAccommodationPayload) =>
  apiPost<Accommodation>('/marketplace/accommodation', payload);

export const updateAccommodation = (id: string, payload: UpdateAccommodationPayload) =>
  apiPatch<Accommodation>(`/marketplace/accommodation/${id}`, payload);

export const deleteAccommodation = (id: string) =>
  apiDelete<{ message: string }>(`/marketplace/accommodation/${id}`);

export const moderateAccommodation = (id: string, payload: ModerateContentPayload) =>
  apiPost<Accommodation>(`/marketplace/accommodation/${id}/moderate`, payload);

export const listPendingAccommodation = () =>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  listAccommodation({ status: 'PENDING' } as any);   // reuse list with filter

// ─── Agent ───────────────────────────────────────────────────
export const applyForAgent = (payload: ApplyAgentPayload, file?: File) => {
  const formData = new FormData();
  formData.append('fullName', payload.fullName);
  formData.append('studentId', payload.studentId);
  formData.append('department', payload.department);
  if (file) formData.append('file', file);
  return apiPost<AgentProfile>('/marketplace/agents/apply', formData, true);
};

export const getMyAgentProfile = () =>
  apiGet<AgentProfile>('/marketplace/agents/me');

export const listPendingAgents = () =>
  apiGet<AgentProfile[]>('/marketplace/agents/pending');

export const reviewAgent = (userId: string, payload: ReviewAgentPayload) =>
  apiPost<AgentProfile>(`/marketplace/agents/${userId}/review`, payload);

// ─── Roommate ────────────────────────────────────────────────
export const listRoommates = (page = 1, limit = 20) =>
  apiGet<{ data: RoommateRequest[]; page: number; total: number; limit: number }>(`/marketplace/roommates?page=${page}&limit=${limit}`);

export const createRoommateRequest = (payload: CreateRoommatePayload) =>
  apiPost<RoommateRequest>('/marketplace/roommates', payload);

export const updateRoommateRequest = (id: string, payload: UpdateRoommatePayload) =>
  apiPatch<RoommateRequest>(`/marketplace/roommates/${id}`, payload);

export const deleteRoommateRequest = (id: string) =>
  apiDelete<{ message: string }>(`/marketplace/roommates/${id}`);

// ─── Services ────────────────────────────────────────────────
export const listServices = (params?: { page?: number; limit?: number; category?: string }) =>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  apiGet<{ data: Service[]; page: number; total: number; limit: number }>('/marketplace/services', params as any);

export const getService = (id: string) =>
  apiGet<Service>(`/marketplace/services/${id}`);

export const createService = (payload: CreateServicePayload) =>
  apiPost<Service>('/marketplace/services', payload);

export const updateService = (id: string, payload: UpdateServicePayload) =>
  apiPatch<Service>(`/marketplace/services/${id}`, payload);

export const deleteService = (id: string) =>
  apiDelete<{ message: string }>(`/marketplace/services/${id}`);

export const listPendingServices = () =>
  apiGet<Service[]>('/marketplace/services/pending');

export const moderateService = (id: string, payload: ModerateContentPayload) =>
  apiPost<Service>(`/marketplace/services/${id}/moderate`, payload);

// ─── Jobs ────────────────────────────────────────────────────
export const listJobs = (params?: { page?: number; limit?: number }) =>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  apiGet<{ data: Job[]; page: number; total: number; limit: number }>('/marketplace/jobs', params as any);

export const getJob = (id: string) =>
  apiGet<Job>(`/marketplace/jobs/${id}`);

export const createJob = (payload: CreateJobPayload) =>
  apiPost<Job>('/marketplace/jobs', payload);

export const updateJob = (id: string, payload: UpdateJobPayload) =>
  apiPatch<Job>(`/marketplace/jobs/${id}`, payload);

export const deleteJob = (id: string) =>
  apiDelete<{ message: string }>(`/marketplace/jobs/${id}`);

export const listPendingJobs = () =>
  apiGet<Job[]>('/marketplace/jobs/pending');

export const approveJob = (id: string) =>
  apiPost<Job>(`/marketplace/jobs/${id}/approve`, {});

export const rejectJob = (id: string, payload: RejectJobPayload) =>
  apiPost<Job>(`/marketplace/jobs/${id}/reject`, payload);

// ─── Reports ─────────────────────────────────────────────────
export const reportContent = (payload: ReportContentPayload) =>
  apiPost<ContentReport>('/marketplace/reports', payload);

export const listReports = () =>
  apiGet<ContentReport[]>('/marketplace/reports');

export const resolveReport = (id: string) =>
  apiPost<{ message: string }>(`/marketplace/reports/${id}/resolve`, {});

// ─── Marketplace API Object (for backward compatibility) ──────
export const marketplaceApi = {
  // Listings
  listListings,
  getListing,
  createListing,
  updateListing,
  deleteListing: (id: string) => deleteListing(id),
  toggleSaveListing,
  getSavedListings,
  listPendingListings,
  moderateListing,
  uploadListingImage,
  // Alias for admin page
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  getListings: (params: any) => listListings(params),
  getPendingListings: listPendingListings,
  
  // Shops
  listShops,
  getMyShop,
  getShop,
  createShop,
  updateShop,
  adminDeleteShop,
  followShop,
  rateSeller,
  
  // Lost & Found
  listLostFound,
  createLostFound,
  resolveLostFound,
  
  // Accommodation
  listAccommodation,
  getAccommodation,
  createAccommodation,
  updateAccommodation,
  deleteAccommodation,
  moderateAccommodation,
  listPendingAccommodation,
  
  // Agent
  applyForAgent: (payload: ApplyAgentPayload, file?: File) => applyForAgent(payload, file),
  // Alias for agent page
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  applyAsAgent: (data: any) => {
    return applyForAgent({
      fullName: data.businessName,
      studentId: data.businessAddress,
      department: data.phoneNumber,
    }, data.studentIdFile);
  },
  getMyAgentProfile,
  listPendingAgents,
  getPendingAgents: listPendingAgents,
  reviewAgent,
  
  // Roommate
  listRoommates,
  createRoommateRequest,
  updateRoommateRequest,
  deleteRoommateRequest,
  
  // Services
  listServices,
  getService,
  createService,
  updateService,
  deleteService,
  listPendingServices,
  getPendingServices: listPendingServices,
  moderateService,
  
  // Jobs
  listJobs,
  getJob,
  createJob,
  updateJob,
  deleteJob,
  listPendingJobs,
  getPendingJobs: listPendingJobs,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  getJobs: (params: any) => listJobs(params),
  approveJob,
  rejectJob: (id: string, reason: string) => rejectJob(id, { reason }),
  
  // Reports
  reportContent,
  listReports,
  resolveReport,
};