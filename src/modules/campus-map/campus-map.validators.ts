import { z } from 'zod';

export const campusFeatureCategorySchema = z.enum([
  'BUILDING',
  'HOSTEL',
  'LECTURE_HALL',
  'LIBRARY',
  'CLINIC',
  'CAFETERIA',
  'ATM',
  'SPORTS',
  'SHUTTLE_STOP',
  'GATE',
  'PARKING',
  'LANDMARK',
  'OFFICE',
  'LAB',
  'ROAD',
  'PATH',
  'OTHER',
]);

export const listFeaturesQuerySchema = z.object({
  bbox: z.string().optional(),
  category: campusFeatureCategorySchema.optional(),
  limit: z.coerce.number().int().min(1).max(1000).default(500),
});

export const searchQuerySchema = z.object({
  q: z.string().trim().min(1).max(120),
  category: campusFeatureCategorySchema.optional(),
  near: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(50).default(12),
});

export const nearestQuerySchema = z.object({
  lat: z.coerce.number().min(-90).max(90),
  lng: z.coerce.number().min(-180).max(180),
  category: campusFeatureCategorySchema.optional(),
  limit: z.coerce.number().int().min(1).max(25).default(8),
});

const pointSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
});

export const routeRequestSchema = z.object({
  from: pointSchema,
  to: z.object({
    featureId: z.string().min(1).optional(),
    entranceId: z.string().min(1).optional(),
    lat: z.number().min(-90).max(90).optional(),
    lng: z.number().min(-180).max(180).optional(),
  }).refine((to) => Boolean(to.featureId || to.entranceId || (to.lat !== undefined && to.lng !== undefined)), {
    message: 'Destination must include featureId, entranceId, or lat/lng',
  }),
  mode: z.enum(['walking', 'accessible']).default('walking'),
});

export const routeProgressSchema = z.object({
  routeId: z.string().min(1),
  user: pointSchema,
  route: z.object({
    type: z.literal('LineString'),
    coordinates: z.array(z.tuple([z.number(), z.number()])).min(2),
  }),
});

export function parseBbox(value?: string) {
  if (!value) return undefined;
  const parts = value.split(',').map((part) => Number(part.trim()));
  if (parts.length !== 4 || parts.some((part) => !Number.isFinite(part))) {
    throw new Error('bbox must be minLng,minLat,maxLng,maxLat');
  }
  const [minLng, minLat, maxLng, maxLat] = parts;
  if (minLng >= maxLng || minLat >= maxLat) {
    throw new Error('bbox minimum values must be smaller than maximum values');
  }
  return { minLng, minLat, maxLng, maxLat };
}

export function parseNear(value?: string) {
  if (!value) return undefined;
  const parts = value.split(',').map((part) => Number(part.trim()));
  if (parts.length !== 2 || parts.some((part) => !Number.isFinite(part))) {
    throw new Error('near must be lat,lng');
  }
  return { lat: parts[0], lng: parts[1] };
}
