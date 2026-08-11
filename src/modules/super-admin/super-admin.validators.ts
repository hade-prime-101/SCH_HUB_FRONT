import { z } from 'zod';

export const createAdminSchema = z.object({
  fullName: z.string().min(2).max(100),
  email: z.string().email(),
  password: z.string().min(8),
  schoolId: z.string().min(1),
  role: z.enum(['SCHOOL_ADMIN']).default('SCHOOL_ADMIN'),
});

export const resetAdminPasswordSchema = z.object({
  newPassword: z.string().min(8),
});

export const listAuditLogsSchema = z.object({
  action: z.string().optional(),
  performedById: z.string().optional(),
  targetUserId: z.string().optional(),
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(50),
});

export const createSchoolSchema = z.object({
  name: z.string().min(2).max(200),
  shortCode: z.string().min(2).max(20).toUpperCase(),
  location: z.string().min(2).max(200),
  country: z.string().default('Nigeria'),
  logoUrl: z.string().url().optional(),
});

export const updateSchoolSchema = createSchoolSchema.partial();

export const createFacultySchema = z.object({
  name: z.string().min(2).max(200),
  schoolId: z.string().min(1).optional(),
});

export const createDepartmentSchema = z.object({
  name: z.string().min(2).max(200),
  shortCode: z.string().min(2).max(20).toUpperCase(),
  facultyId: z.string().min(1).optional(),
});

// ── Campus map admin ───────────────────────────────────────

const geometrySchema = z.object({
  type: z.string(),
  coordinates: z.unknown(),
}).passthrough();

export const listMapFeaturesQuerySchema = z.object({
  bbox    : z.string().optional(),
  category: z.enum([
    'BUILDING', 'HOSTEL', 'LECTURE_HALL', 'LIBRARY', 'CLINIC', 'CAFETERIA',
    'ATM', 'SPORTS', 'SHUTTLE_STOP', 'GATE', 'PARKING', 'LANDMARK', 'OFFICE',
    'LAB', 'ROAD', 'PATH', 'OTHER',
  ]).optional(),
  limit   : z.coerce.number().int().min(1).max(2000).default(1000),
});

export const listMapEntrancesQuerySchema = z.object({
  featureId: z.string().min(1).optional(),
});

export const upsertMapFeatureSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1).max(200),
  category: z.enum([
    'BUILDING', 'HOSTEL', 'LECTURE_HALL', 'LIBRARY', 'CLINIC', 'CAFETERIA',
    'ATM', 'SPORTS', 'SHUTTLE_STOP', 'GATE', 'PARKING', 'LANDMARK', 'OFFICE',
    'LAB', 'ROAD', 'PATH', 'OTHER',
  ]),
  geometry: geometrySchema,
  description: z.string().max(1000).optional().nullable(),
  aliases: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional(),
  images: z.array(z.string().url()).optional(),
  metadata: z.record(z.unknown()).optional(),
  routing: z.record(z.unknown()).optional(),
  accessibility: z.record(z.unknown()).optional(),
  importance: z.number().int().min(0).max(100).optional(),
  isActive: z.boolean().optional(),
});

export const upsertEntranceSchema = z.object({
  id: z.string().min(1),
  featureId: z.string().min(1).optional().nullable(),
  kind: z.enum(['MAIN', 'SECONDARY', 'ACCESSIBLE', 'SERVICE', 'EMERGENCY']).default('SECONDARY'),
  geometry: geometrySchema,
  name: z.string().max(200).optional().nullable(),
  priority: z.number().int().min(0).max(100).optional(),
  isAccessible: z.boolean().optional(),
  metadata: z.record(z.unknown()).optional(),
});

export const importMapGeoJsonSchema = z.object({
  features: z.array(z.object({
    type: z.literal('Feature'),
    geometry: geometrySchema,
    properties: z.record(z.unknown()).nullable(),
  })),
});

export const deleteMapFeatureImageSchema = z.object({
  imageUrl: z.string().min(1).optional(),
});
