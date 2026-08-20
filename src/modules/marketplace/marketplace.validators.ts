import { z } from 'zod';

// ── Listings ───────────────────────────────────────────────

export const createListingSchema = z.object({
  title: z.string().min(3).max(200),
  description: z.string().min(10).max(2000),
  price: z.coerce.number().min(0).max(10_000_000),
  category: z.enum(['BOOKS', 'ELECTRONICS', 'CLOTHING', 'FOOD', 'FURNITURE', 'HANDOUTS', 'SERVICES', 'OTHER']),
  condition: z.enum(['NEW', 'LIKE_NEW', 'GOOD', 'FAIR']).optional(),
  images: z.array(z.string()).max(5).default([]),
  location: z.string().max(200).optional(),
  whatsapp: z.string().max(20).optional(),
  shopId: z.string().optional(),
});

export const updateListingSchema = createListingSchema.partial().extend({
  isAvailable: z.boolean().optional(),
});

export const listListingsSchema = z.object({
  category: z.enum(['BOOKS', 'ELECTRONICS', 'CLOTHING', 'FOOD', 'FURNITURE', 'HANDOUTS', 'SERVICES', 'OTHER']).optional(),
  condition: z.enum(['NEW', 'LIKE_NEW', 'GOOD', 'FAIR']).optional(),
  minPrice: z.coerce.number().min(0).optional(),
  maxPrice: z.coerce.number().min(0).optional(),
  search: z.string().max(100).optional(),
  sellerId: z.string().optional(),
  shopId: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

// ── Shop ──────────────────────────────────────────────────

export const createShopSchema = z.object({
  name: z.string().min(2).max(100),
  description: z.string().max(1000).optional(),
});

export const updateShopSchema = createShopSchema.partial().extend({
  logoUrl: z.string().url().optional(),
  isActive: z.boolean().optional(),
});

// ── Seller Rating ─────────────────────────────────────────

export const rateSellerSchema = z.object({
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(500).optional(),
});

// ── Lost & Found ──────────────────────────────────────────

export const createLostFoundSchema = z.object({
  type: z.enum(['LOST', 'FOUND']),
  title: z.string().min(3).max(200),
  description: z.string().min(10).max(1000),
  location: z.string().max(200).optional(),
  contactInfo: z.string().min(5).max(200),
  imageUrl: z.string().url().optional(),
});

export const listLostFoundSchema = z.object({
  type: z.enum(['LOST', 'FOUND']).optional(),
  search: z.string().max(100).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

// ── Accommodation ─────────────────────────────────────────

export const createAccommodationSchema = z.object({
  title: z.string().min(3).max(200),
  description: z.string().min(10).max(2000),
  type: z.enum(['SELF_CONTAIN', 'ROOM_AND_PARLOUR', 'SINGLE_ROOM', 'SHARED_ROOM', 'HOSTEL', 'FLAT', 'OTHER']),
  price: z.number().min(0).max(100_000_000),
  period: z.enum(['year', 'month', 'semester']).default('year'),
  location: z.string().min(3).max(200),
  images: z.array(z.string().url()).max(5).default([]),
  whatsapp: z.string().min(7).max(20),
});

export const updateAccommodationSchema = createAccommodationSchema.partial().extend({
  isAvailable: z.boolean().optional(),
});

export const listAccommodationSchema = z.object({
  type: z.enum(['SELF_CONTAIN', 'ROOM_AND_PARLOUR', 'SINGLE_ROOM', 'SHARED_ROOM', 'HOSTEL', 'FLAT', 'OTHER']).optional(),
  minPrice: z.coerce.number().min(0).optional(),
  maxPrice: z.coerce.number().min(0).optional(),
  search: z.string().max(100).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

// ── Roommate ──────────────────────────────────────────────

export const createRoommateSchema = z.object({
  description: z.string().min(10).max(1000),
  budget: z.number().min(0).optional(),
  preferredArea: z.string().min(3).max(200),
  gender: z.enum(['male', 'female', 'any']),
  level: z.string().min(1).max(10),
  whatsapp: z.string().min(7).max(20),
});

export const updateRoommateSchema = createRoommateSchema.partial().extend({
  isActive: z.boolean().optional(),
});

// ── Services ──────────────────────────────────────────────

export const createServiceSchema = z.object({
  title: z.string().min(3).max(200),
  description: z.string().min(10).max(2000),
  category: z.enum(['TUTORING', 'GRAPHICS', 'CODING', 'PHOTOGRAPHY', 'PRINTING', 'LAUNDRY', 'FOOD', 'DELIVERY', 'OTHER']),
  price: z.number().min(0).optional(),
  priceNote: z.string().max(100).optional(),
  images: z.array(z.string().url()).max(5).default([]),
  whatsapp: z.string().min(7).max(20),
});

export const updateServiceSchema = createServiceSchema.partial().extend({
  isActive: z.boolean().optional(),
});

export const listServicesSchema = z.object({
  category: z.enum(['TUTORING', 'GRAPHICS', 'CODING', 'PHOTOGRAPHY', 'PRINTING', 'LAUNDRY', 'FOOD', 'DELIVERY', 'OTHER']).optional(),
  search: z.string().max(100).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

// ── Jobs ──────────────────────────────────────────────────

export const createJobSchema = z.object({
  title: z.string().min(3).max(200),
  description: z.string().min(10).max(2000),
  type: z.enum(['INTERNSHIP', 'PART_TIME', 'CAMPUS_JOB', 'FREELANCE']),
  pay: z.string().max(100).optional(),
  location: z.string().min(3).max(200),
  whatsapp: z.string().min(7).max(20),
});

export const updateJobSchema = createJobSchema.partial();

export const listJobsSchema = z.object({
  type: z.enum(['INTERNSHIP', 'PART_TIME', 'CAMPUS_JOB', 'FREELANCE']).optional(),
  search: z.string().max(100).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

export const rejectJobSchema = z.object({
  rejectionReason: z.string().min(5).max(500),
});

// ── Agent Verification ─────────────────────────────────────

// Fields submitted as multipart form-data text fields
export const applyAgentFieldsSchema = z.object({
  businessName:    z.string().min(2).max(200),
  businessAddress: z.string().min(5).max(500),
  phoneNumber:     z.string().min(7).max(20),
});

// Full shape passed to the service (studentIdUrl injected by controller after upload)
export const applyAgentSchema = z.object({
  businessName:    z.string().min(2).max(200),
  businessAddress: z.string().min(5).max(500),
  phoneNumber:     z.string().min(7).max(20),
  studentIdUrl:    z.string().url('Must be a valid URL to your uploaded student ID card'),
});

export const reviewAgentSchema = z.object({
  decision: z.enum(['APPROVED', 'REJECTED']),
  note:     z.string().max(500).optional(),
});

// ── Content Moderation ─────────────────────────────────────

export const moderateContentSchema = z.object({
  decision: z.enum(['APPROVED', 'REJECTED']),
  note:     z.string().max(500).optional(),
});

// ── Report ─────────────────────────────────────────────────

export const reportContentSchema = z.object({
  targetType: z.enum(['listing', 'accommodation', 'service']),
  targetId:   z.string().min(1),
  reason:     z.enum(['SPAM', 'FAKE_LISTING', 'INAPPROPRIATE_CONTENT', 'SCAM', 'WRONG_CATEGORY', 'OTHER']),
  details:    z.string().max(500).optional(),
});
