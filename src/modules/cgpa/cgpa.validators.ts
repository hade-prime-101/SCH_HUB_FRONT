import { z } from 'zod';

export const createCourseSchema = z.object({
  courseCode: z.string().min(2).max(20).toUpperCase(),
  courseTitle: z.string().min(2).max(200),
  creditUnit: z.number().int().min(1).max(6),
  score: z.number().min(0).max(100).optional(),
  passmark: z.number().min(0).max(100).default(40),
  semester: z.enum(['FIRST', 'SECOND']),
  session: z.string().regex(/^\d{4}\/\d{4}$/, 'Session format must be YYYY/YYYY e.g. 2023/2024'),
});

export const updateCourseSchema = createCourseSchema.partial();

export const calculateSchema = z.object({
  semester: z.enum(['FIRST', 'SECOND']),
  session: z.string().regex(/^\d{4}\/\d{4}$/),
  // Optional inline courses — when provided, CGPA is calculated from these
  // values directly without touching the DB. Each course runs through
  // getGradeInfo(score, passmark) server-side so the client only needs to
  // send raw scores, not pre-computed grade points.
  courses: z.array(
    z.object({
      courseCode: z.string().min(1).max(20).toUpperCase(),
      creditUnit: z.number().int().min(1).max(6),
      score:      z.number().min(0).max(100),
      passmark:   z.number().min(0).max(100).default(40),
    }),
  ).min(1).optional(),
});

export const listCoursesSchema = z.object({
  semester: z.enum(['FIRST', 'SECOND']).optional(),
  session: z.string().optional(),
});
