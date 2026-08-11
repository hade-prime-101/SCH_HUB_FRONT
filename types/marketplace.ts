// types/marketplace.ts

export type ListingStatus = 'ACTIVE' | 'SOLD' | 'PENDING' | 'REJECTED';
export type AccommodationType = 'HOSTEL' | 'APARTMENT' | 'SINGLE_ROOM' | 'SELF_CONTAINED';
export type ServiceCategory = 'TUTORING' | 'TECH' | 'BEAUTY' | 'FASHION' | 'OTHER';

export interface Listing {
  id: string;
  title: string;
  description: string;
  price: number;
  images: string[];
  category: string;
  status: ListingStatus;
  sellerId: string;
  schoolId: string;
  createdAt: string;
  updatedAt: string;
  saved?: boolean;
}

export interface CreateListingPayload {
  title: string;
  description: string;
  price: number;
  images?: string[];
  category?: string;
}

export interface UpdateListingPayload extends Partial<CreateListingPayload> {
  status?: ListingStatus;
}

export interface ModerateContentPayload {
  decision: 'APPROVE' | 'REJECT';
  reason?: string;
}

export interface Shop {
  id: string;
  name: string;
  description: string;
  ownerId: string;
  logo?: string;
  banner?: string;
  followerCount: number;
  rating: number;
  schoolId: string;
}

export interface CreateShopPayload {
  name: string;
  description: string;
  logo?: string;
  banner?: string;
}

export interface UpdateShopPayload extends Partial<CreateShopPayload> {}

export interface RateSellerPayload {
  rating: number; // 1-5
}

export interface LostFoundItem {
  id: string;
  title: string;
  description: string;
  type: 'LOST' | 'FOUND';
  location?: string;
  resolved: boolean;
  reporterId: string;
  schoolId: string;
  createdAt: string;
}

export interface CreateLostFoundPayload {
  title: string;
  description: string;
  type: 'LOST' | 'FOUND';
  location?: string;
}

export interface Accommodation {
  id: string;
  title: string;
  description: string;
  type: AccommodationType;
  price: number;
  location: string;
  images: string[];
  agentId: string;
  schoolId: string;
  status: ListingStatus;
}

export interface CreateAccommodationPayload {
  title: string;
  description: string;
  type: AccommodationType;
  price: number;
  location: string;
  images?: string[];
}

export interface UpdateAccommodationPayload extends Partial<CreateAccommodationPayload> {}

export interface AgentProfile {
  userId: string;
  fullName: string;
  studentId: string;
  studentIdUrl: string;
  department: string;
  verified: boolean;
  createdAt: string;
}

export interface ApplyAgentPayload {
  fullName: string;
  studentId: string;
  department: string;
  // studentIdUrl will be uploaded as a file
}

export interface ReviewAgentPayload {
  decision: 'APPROVE' | 'REJECT';
  reason?: string;
}

export interface RoommateRequest {
  id: string;
  title: string;
  description: string;
  budget: number;
  gender?: 'MALE' | 'FEMALE' | 'ANY';
  schoolId: string;
  userId: string;
  createdAt: string;
}

export interface CreateRoommatePayload {
  title: string;
  description: string;
  budget: number;
  gender?: 'MALE' | 'FEMALE' | 'ANY';
}

export interface UpdateRoommatePayload extends Partial<CreateRoommatePayload> {}

export interface Service {
  id: string;
  title: string;
  description: string;
  category: ServiceCategory;
  price: number;
  providerId: string;
  schoolId: string;
  status: ListingStatus;
}

export interface CreateServicePayload {
  title: string;
  description: string;
  category: ServiceCategory;
  price: number;
}

export interface UpdateServicePayload extends Partial<CreateServicePayload> {}

export interface Job {
  id: string;
  title: string;
  description: string;
  company?: string;
  location?: string;
  salary?: string;
  posterId: string;
  schoolId: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
}

export interface CreateJobPayload {
  title: string;
  description: string;
  company?: string;
  location?: string;
  salary?: string;
}

export interface UpdateJobPayload extends Partial<CreateJobPayload> {}

export interface RejectJobPayload {
  reason: string;
}

export interface ContentReport {
  id: string;
  targetType: 'listing' | 'accommodation' | 'service' | 'job';
  targetId: string;
  reason: string;
  reporterId: string;
  schoolId: string;
  resolved: boolean;
  createdAt: string;
}

export interface ReportContentPayload {
  targetType: 'listing' | 'accommodation' | 'service' | 'job';
  targetId: string;
  reason: string;
}