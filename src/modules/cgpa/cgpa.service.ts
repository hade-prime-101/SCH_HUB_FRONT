import { prisma } from '@/config/prisma.js';
import { AppError } from '@/utils/response.js';
import type { CGPACourse } from '@prisma/client';
import type {
  calculateSchema,
  createCourseSchema,
  listCoursesSchema,
  updateCourseSchema,
} from '@/modules/cgpa/cgpa.validators.js';
import type { z } from 'zod';

type CreateCourseInput = z.infer<typeof createCourseSchema>;
type UpdateCourseInput = z.infer<typeof updateCourseSchema>;
type CalculateInput = z.infer<typeof calculateSchema>;
type ListCoursesInput = z.infer<typeof listCoursesSchema>;

// Nigerian 5-point grading system
const getGradeInfo = (score: number, passmark: number): { grade: string; gradePoint: number } => {
  if (score < passmark) return { grade: 'F', gradePoint: 0.0 };
  if (score < 45) return { grade: 'E', gradePoint: 1.0 };
  if (score < 50) return { grade: 'D', gradePoint: 2.0 };
  if (score < 60) return { grade: 'C', gradePoint: 3.0 };
  if (score < 70) return { grade: 'B', gradePoint: 4.0 };
  return { grade: 'A', gradePoint: 5.0 };
};

export const cgpaService = {
  async listCourses(userId: string, input: ListCoursesInput) {
    return prisma.cGPACourse.findMany({
      where: {
        userId,
        ...(input.semester && { semester: input.semester }),
        ...(input.session && { session: input.session }),
      },
      orderBy: [{ session: 'desc' }, { semester: 'asc' }, { courseCode: 'asc' }],
    });
  },

  async createCourse(userId: string, input: CreateCourseInput) {
    const gradeInfo = input.score !== undefined ? getGradeInfo(input.score, input.passmark) : null;

    return prisma.cGPACourse.create({
      data: {
        userId,
        courseCode: input.courseCode,
        courseTitle: input.courseTitle,
        creditUnit: input.creditUnit,
        score: input.score,
        grade: gradeInfo?.grade,
        gradePoint: gradeInfo?.gradePoint,
        passmark: input.passmark,
        semester: input.semester,
        session: input.session,
      },
    });
  },

  async updateCourse(id: string, userId: string, input: UpdateCourseInput) {
    const course = await prisma.cGPACourse.findUnique({ where: { id } });
    if (!course) throw new AppError('Course not found', 404);
    if (course.userId !== userId) throw new AppError('Not authorized', 403);

    const passmark = input.passmark ?? course.passmark;
    const score = input.score !== undefined ? input.score : course.score;
    const gradeInfo = score !== null && score !== undefined ? getGradeInfo(score, passmark) : null;

    return prisma.cGPACourse.update({
      where: { id },
      data: {
        ...input,
        grade: gradeInfo?.grade ?? course.grade,
        gradePoint: gradeInfo?.gradePoint ?? course.gradePoint,
      },
    });
  },

  async deleteCourse(id: string, userId: string) {
    const course = await prisma.cGPACourse.findUnique({ where: { id } });
    if (!course) throw new AppError('Course not found', 404);
    if (course.userId !== userId) throw new AppError('Not authorized', 403);

    await prisma.cGPACourse.delete({ where: { id } });
    return { deleted: true };
  },

  async calculate(userId: string, input: CalculateInput) {
    let gradedCourses: Array<{ courseCode: string; creditUnit: number; gradePoint: number; grade: string }>;

    if (input.courses && input.courses.length > 0) {
      // ── Inline path: client supplied courses directly ──────────────────
      // Derive grade and gradePoint server-side — client only sends scores.
      gradedCourses = input.courses.map((c) => {
        const { grade, gradePoint } = getGradeInfo(c.score, c.passmark);
        return { courseCode: c.courseCode, creditUnit: c.creditUnit, grade, gradePoint };
      });
    } else {
      // ── DB path: fetch saved courses for this semester/session ─────────
      const dbCourses = await prisma.cGPACourse.findMany({
        where: { userId, semester: input.semester, session: input.session },
      });

      if (dbCourses.length === 0) throw new AppError('No courses found for this semester/session', 400);

      const filtered = dbCourses.filter((c: CGPACourse) => c.gradePoint !== null && c.creditUnit);
      if (filtered.length === 0) throw new AppError('No graded courses found. Please add scores first.', 400);

      gradedCourses = filtered.map((c: CGPACourse) => ({
        courseCode: c.courseCode,
        creditUnit: c.creditUnit,
        grade:      c.grade ?? '',
        gradePoint: c.gradePoint!,
      }));
    }

    // ── Semester GPA ───────────────────────────────────────────────────────
    const totalWeightedPoints = gradedCourses.reduce((sum, c) => sum + c.gradePoint * c.creditUnit, 0);
    const totalUnits           = gradedCourses.reduce((sum, c) => sum + c.creditUnit, 0);
    const gpa                  = totalUnits > 0 ? totalWeightedPoints / totalUnits : 0;

    // ── Cumulative CGPA ────────────────────────────────────────────────────
    // Always computed from all graded DB courses so historical semesters
    // are included. Inline submissions are not persisted (they're ephemeral
    // what-if calculations), so they don't affect the cumulative figure.
    const allCourses = await prisma.cGPACourse.findMany({
      where: { userId, gradePoint: { not: null } },
    });

    const cumulativeWeighted = allCourses.reduce((sum: number, c: CGPACourse) => sum + (c.gradePoint! * c.creditUnit), 0);
    const cumulativeUnits    = allCourses.reduce((sum: number, c: CGPACourse) => sum + c.creditUnit, 0);
    const cgpa               = cumulativeUnits > 0 ? cumulativeWeighted / cumulativeUnits : gpa; // fallback to semester GPA when no DB history

    // ── Persist record only for DB-backed calculations ─────────────────────
    let record: { id: string; semester: string; session: string } | null = null;
    if (!input.courses) {
      record = await prisma.cGPARecord.upsert({
        where: { userId_semester_session: { userId, semester: input.semester, session: input.session } },
        create: { userId, semester: input.semester, session: input.session, gpa, cgpa, totalUnits },
        update: { gpa, cgpa, totalUnits },
      });
    }

    return {
      ...(record ?? { semester: input.semester, session: input.session }),
      gpa:            Math.round(gpa  * 100) / 100,
      cgpa:           Math.round(cgpa * 100) / 100,
      totalUnits,
      classification: getClassification(cgpa),
      courses:        gradedCourses,
    };
  },

  async getRecords(userId: string) {
    const records = await prisma.cGPARecord.findMany({
      where: { userId },
      orderBy: [{ session: 'desc' }, { semester: 'asc' }],
    });
    return records.map((r: typeof records[number]) => ({ ...r, classification: getClassification(r.cgpa) }));
  },

  async getCurrentCGPA(userId: string) {
    const allCourses = await prisma.cGPACourse.findMany({
      where: { userId, gradePoint: { not: null } },
    });

    if (allCourses.length === 0) return { cgpa: 0, totalUnits: 0, classification: 'No grades yet' };

    const totalWeighted = allCourses.reduce((sum: number, c: CGPACourse) => sum + (c.gradePoint! * c.creditUnit), 0);
    const totalUnits = allCourses.reduce((sum: number, c: CGPACourse) => sum + c.creditUnit, 0);
    const cgpa = totalUnits > 0 ? Math.round((totalWeighted / totalUnits) * 100) / 100 : 0;

    return { cgpa, totalUnits, classification: getClassification(cgpa) };
  },
};

const getClassification = (cgpa: number): string => {
  if (cgpa >= 4.5) return 'First Class';
  if (cgpa >= 3.5) return 'Second Class Upper';
  if (cgpa >= 2.5) return 'Second Class Lower';
  if (cgpa >= 1.5) return 'Third Class';
  if (cgpa >= 1.0) return 'Pass';
  return 'Fail';
};
