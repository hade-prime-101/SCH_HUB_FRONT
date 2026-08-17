import crypto from 'node:crypto';
import { prisma } from '@/config/prisma.js';
import { r2 } from '@/config/r2.js';
import { AppError } from '@/utils/response.js';
import { auditService } from '@/modules/super-admin/audit.service.js';
import { sendAndPersistNotification } from '@/modules/notifications/notifications.service.js';
import { extractTextOrReject } from '@/utils/extractText.js';
import { aiService } from '@/modules/ai/ai.service.js';
import type { QuizQuestion, Material as PrismaMaterial } from '@prisma/client';
import type {
  createQuizSchema,
  generateQuizFromMaterialSchema,
  listMaterialsSchema,
  listQuizzesSchema,
  rateMaterialSchema,
  submitQuizAttemptSchema,
  uploadMaterialSchema,
  updateVisibilitySchema,
  updateMaterialSchema,
  adminQuizAnalyticsSchema,
} from '@/modules/study/study.validators.js';
import type { z } from 'zod';

type UploadMaterialInput = z.infer<typeof uploadMaterialSchema>;
type ListMaterialsInput = z.infer<typeof listMaterialsSchema>;
type RateMaterialInput = z.infer<typeof rateMaterialSchema>;
type CreateQuizInput = z.infer<typeof createQuizSchema>;
type ListQuizzesInput = z.infer<typeof listQuizzesSchema>;
type SubmitAttemptInput = z.infer<typeof submitQuizAttemptSchema>;
type UpdateVisibilityInput = z.infer<typeof updateVisibilitySchema>;
type UpdateMaterialInput = z.infer<typeof updateMaterialSchema>;
type GenerateQuizInput = z.infer<typeof generateQuizFromMaterialSchema>;
type AdminAnalyticsInput = z.infer<typeof adminQuizAnalyticsSchema>;

const UPLOADER_ROLES = new Set(['COURSE_REP', 'AUTHORIZED_UPLOADER', 'SCHOOL_ADMIN', 'SUPER_ADMIN']);
const QUIZ_CREATOR_ROLES = new Set(['COURSE_REP', 'AUTHORIZED_UPLOADER', 'SCHOOL_ADMIN', 'SUPER_ADMIN']);
const PRIVILEGED_UPLOADER_ROLES = new Set(['COURSE_REP', 'AUTHORIZED_UPLOADER', 'SCHOOL_ADMIN', 'SUPER_ADMIN']);

const MATERIAL_SELECT = {
  id: true,
  title: true,
  type: true,
  courseCode: true,
  courseTitle: true,
  year: true,
  level: true,
  description: true,
  fileUrl: true,
  fileSize: true,
  mimeType: true,
  downloadCount: true,
  viewCount: true,
  avgRating: true,
  isVerified: true,
  verifiedAt: true,
  visibility: true,
  studyGroupId: true,
  textExtractionStatus: true,
  extractedTextPreview: true,
  createdAt: true,
  uploadedBy: { select: { id: true, fullName: true, profilePictureUrl: true } },
  department: { select: { id: true, name: true, shortCode: true } },
  _count: { select: { ratings: true, bookmarks: true } },
};

// ── Visibility helpers ──────────────────────────────────────────────────────

async function visibilityFilter(userId: string, user: { departmentId: string; level: string }, input: ListMaterialsInput) {
  const { visibility, studyGroupId, departmentId, level } = input;

  if (visibility) {
    return {
      visibility,
      ...(visibility === 'DEPARTMENT' && { departmentId: user.departmentId }),
      ...(visibility === 'LEVEL' && { departmentId: user.departmentId, level: user.level }),
      ...(visibility === 'STUDY_GROUP' && studyGroupId && { studyGroupId }),
      ...(visibility === 'PRIVATE' && { uploadedById: userId }),
    };
  }

  return {
    OR: [
      { visibility: 'PUBLIC' as const },
      { visibility: 'DEPARTMENT' as const, departmentId: departmentId ?? user.departmentId },
      { visibility: 'LEVEL' as const, departmentId: departmentId ?? user.departmentId, level: level ?? user.level },
      { visibility: 'PRIVATE' as const, uploadedById: userId },
      { visibility: 'STUDY_GROUP' as const, studyGroupId: { in: await prisma.studyGroupMember.findMany({ where: { userId }, select: { groupId: true } }).then((ms: Array<{ groupId: string }>) => ms.map((m) => m.groupId)) } },
    ],
  };
}

async function assertVisibilityAccess(
  material: { visibility: string; uploadedById: string; studyGroupId: string | null; department: { id: string }; level: string | null },
  userId: string,
  userRole: string,
) {
  const isAdmin = userRole === 'SCHOOL_ADMIN' || userRole === 'SUPER_ADMIN';
  if (isAdmin) return;

  switch (material.visibility) {
    case 'PRIVATE':
      if (material.uploadedById !== userId) throw new AppError('Material not found', 404);
      break;
    case 'DEPARTMENT': {
      const user = await prisma.user.findUnique({ where: { id: userId }, select: { departmentId: true } });
      if (user?.departmentId !== material.department.id) throw new AppError('Material not found', 404);
      break;
    }
    case 'LEVEL': {
      const user = await prisma.user.findUnique({ where: { id: userId }, select: { departmentId: true, level: true } });
      if (user?.departmentId !== material.department.id) throw new AppError('Material not found', 404);
      if (user?.level !== material.level) throw new AppError('Material not found', 404);
      break;
    }
    case 'STUDY_GROUP': {
      if (!material.studyGroupId) throw new AppError('Material not found', 404);
      const member = await prisma.studyGroupMember.findUnique({
        where: { groupId_userId: { groupId: material.studyGroupId, userId } },
      });
      if (!member) throw new AppError('Material not found', 404);
      break;
    }
  }
}

// Build quiz visibility filter for list queries
async function quizVisibilityFilter(userId: string, user: { departmentId: string; level: string }, input: ListQuizzesInput) {
  // Explicit filter from query
  if (input.visibility) {
    return {
      visibility: input.visibility,
      ...(input.visibility === 'DEPARTMENT' && { departmentId: user.departmentId }),
      ...(input.visibility === 'LEVEL' && { departmentId: user.departmentId, level: user.level }),
      ...(input.visibility === 'STUDY_GROUP' && input.studyGroupId && { studyGroupId: input.studyGroupId }),
      ...(input.visibility === 'PRIVATE' && { createdById: userId }),
    };
  }

  return {
    OR: [
      { visibility: 'PUBLIC' as const },
      { visibility: 'DEPARTMENT' as const, departmentId: user.departmentId },
      { visibility: 'LEVEL' as const, departmentId: user.departmentId, level: user.level },
      { visibility: 'PRIVATE' as const, createdById: userId },
      { visibility: 'STUDY_GROUP' as const, studyGroupId: { in: await prisma.studyGroupMember.findMany({ where: { userId }, select: { groupId: true } }).then((ms: Array<{ groupId: string }>) => ms.map((m) => m.groupId)) } },
    ],
  };
}

async function assertQuizAccess(quiz: { visibility: string; createdById: string; studyGroupId: string | null; departmentId: string; level: string | null }, userId: string, userRole: string) {
  const isAdmin = userRole === 'SCHOOL_ADMIN' || userRole === 'SUPER_ADMIN';
  if (isAdmin) return;

  switch (quiz.visibility) {
    case 'PRIVATE':
      if (quiz.createdById !== userId) throw new AppError('Quiz not found', 404);
      break;
    case 'DEPARTMENT': {
      const user = await prisma.user.findUnique({ where: { id: userId }, select: { departmentId: true } });
      if (user?.departmentId !== quiz.departmentId) throw new AppError('Quiz not available for your department', 403);
      break;
    }
    case 'LEVEL': {
      const user = await prisma.user.findUnique({ where: { id: userId }, select: { departmentId: true, level: true } });
      if (user?.departmentId !== quiz.departmentId) throw new AppError('Quiz not available for your department', 403);
      if (user?.level !== quiz.level) throw new AppError('Quiz not available for your level', 403);
      break;
    }
    case 'STUDY_GROUP': {
      if (!quiz.studyGroupId) throw new AppError('Quiz not found', 404);
      const member = await prisma.studyGroupMember.findUnique({
        where: { groupId_userId: { groupId: quiz.studyGroupId, userId } },
      });
      if (!member) throw new AppError('You must be a study group member to access this quiz', 403);
      break;
    }
  }
}

// ── Topic extraction helper ────────────────────────────────────────────────

function extractTopic(questionText: string, courseCode: string): string {
  // Simple heuristic: first meaningful noun phrase or fall back to course code
  const match = questionText.match(/\b(?:about|of|in|on|for)\s+([A-Za-z\s]{4,30})/i);
  return match ? match[1].trim() : courseCode;
}

// ── Student analytics update (called after every attempt) ─────────────────

async function updateStudentAnalytics(
  userId: string,
  gradedAnswers: Array<{ questionId: string; correct: boolean; topic: string }>,
) {
  const analytics = await prisma.quizAnalytics.upsert({
    where: { userId },
    create: { userId, totalAttempts: 0, totalCorrect: 0, totalQuestions: 0, weakTopics: [], topicAttempts: {} },
    update: {},
  });

  const topicAttempts = (analytics.topicAttempts as Record<string, { attempts: number; wrong: number }>) ?? {};

  let correctDelta = 0;
  for (const answer of gradedAnswers) {
    const t = answer.topic;
    if (!topicAttempts[t]) topicAttempts[t] = { attempts: 0, wrong: 0 };
    topicAttempts[t].attempts++;
    if (answer.correct) {
      correctDelta++;
    } else {
      topicAttempts[t].wrong++;
    }
  }

  // A topic becomes "weak" when wrong >= 2
  const weakTopics = Object.entries(topicAttempts)
    .filter(([, v]) => v.wrong >= 2)
    .map(([topic]) => topic);

  await prisma.quizAnalytics.update({
    where: { userId },
    data: {
      totalAttempts: { increment: 1 },
      totalCorrect: { increment: correctDelta },
      totalQuestions: { increment: gradedAnswers.length },
      weakTopics,
      topicAttempts,
    },
  });
}

// ── Per-question stat update ───────────────────────────────────────────────

async function updateQuestionStats(
  quizId: string,
  gradedAnswers: Array<{ questionId: string; correct: boolean; topic: string }>,
) {
  for (const answer of gradedAnswers) {
    await prisma.quizQuestionStat.upsert({
      where: { questionId: answer.questionId },
      create: {
        quizId,
        questionId: answer.questionId,
        topic: answer.topic,
        totalAttempts: 1,
        totalWrong: answer.correct ? 0 : 1,
      },
      update: {
        totalAttempts: { increment: 1 },
        totalWrong: { increment: answer.correct ? 0 : 1 },
      },
    });
  }
}

// ── Notify quiz participants ───────────────────────────────────────────────

async function notifyQuizParticipants(quiz: { id: string; title: string; departmentId: string; studyGroupId: string | null; visibility: string; level: string | null }) {
  let userIds: string[] = [];

  if (quiz.visibility === 'STUDY_GROUP' && quiz.studyGroupId) {
    const members = await prisma.studyGroupMember.findMany({
      where: { groupId: quiz.studyGroupId },
      select: { userId: true },
    });
    userIds = members.map((m: { userId: string }) => m.userId);
  } else if (quiz.visibility === 'DEPARTMENT' || quiz.visibility === 'LEVEL') {
    const users = await prisma.user.findMany({
      where: {
        departmentId: quiz.departmentId,
        isDeleted: false,
        isActive: true,
        ...(quiz.visibility === 'LEVEL' && quiz.level ? { level: quiz.level } : {}),
      },
      select: { id: true },
    });
    userIds = users.map((u: { id: string }) => u.id);
  }

  await Promise.all(
    userIds.map((uid) =>
      sendAndPersistNotification(uid, '📝 New Quiz Available', `A new quiz "${quiz.title}" has been published.`, 'SYSTEM', {
        type: 'NEW_QUIZ',
        quizId: quiz.id,
      }).catch(() => null)
    )
  );
}

export const studyService = {
  // ── Materials ────────────────────────────────────────────────

  async listMaterials(input: ListMaterialsInput, userId: string) {
    const { page, limit, search, type, courseCode, level, departmentId } = input;
    const skip = (page - 1) * limit;

    const user = await prisma.user.findUnique({ where: { id: userId }, select: { departmentId: true, level: true } });
    if (!user) throw new AppError('User not found', 404);

    const where = {
      isDeleted: false,
      ...await visibilityFilter(userId, user, input),
      ...(type && { type }),
      ...(level && { level }),
      ...(departmentId && { departmentId }),
      ...(courseCode && { courseCode: { contains: courseCode.toUpperCase() } }),
      ...(search && {
        OR: [
          { title: { contains: search, mode: 'insensitive' as const } },
          { courseCode: { contains: search.toUpperCase() } },
          { courseTitle: { contains: search, mode: 'insensitive' as const } },
        ],
      }),
      // Hide pending-review materials from everyone except the uploader and admins
      OR: [
        { reviewStatus: 'APPROVED' as const },
        { uploadedById: userId },
      ],
    };

    const [data, total] = await Promise.all([
      prisma.material.findMany({ where, select: MATERIAL_SELECT, skip, take: limit, orderBy: { createdAt: 'desc' } }),
      prisma.material.count({ where }),
    ]);

    const bookmarkedIds = new Set(
      (await prisma.bookmark.findMany({ where: { userId, materialId: { in: data.map((m: typeof data[number]) => m.id) } }, select: { materialId: true } }))
        .map((b: { materialId: string | null }) => b.materialId)
        .filter((id): id is string => id !== null)
    );

    return { data: data.map((m: typeof data[number]) => ({ ...m, isBookmarked: bookmarkedIds.has(m.id) })), total, page, limit };
  },

  async getMaterial(id: string, userId: string, userRole: string) {
    const material = await prisma.material.findUnique({
      where: { id, isDeleted: false },
      select: {
        ...MATERIAL_SELECT,
        uploadedById: true,
        studyGroupId: true,
        aiSummary: { select: { status: true, shortSummary: true, keyPoints: true, likelyExamTopics: true, simplifiedExplanation: true } },
      },
    });

    if (!material) throw new AppError('Material not found', 404);
    await assertVisibilityAccess(material, userId, userRole);
    await prisma.material.update({ where: { id }, data: { viewCount: { increment: 1 } } });

    const isBookmarked = !!(await prisma.bookmark.findUnique({ where: { userId_materialId: { userId, materialId: id } } }));
    const userRating = await prisma.materialRating.findUnique({ where: { userId_materialId: { userId, materialId: id } } });

    const { uploadedById: _, ...rest } = material;
    return { ...rest, isBookmarked, userRating: userRating?.rating ?? null };
  },

  async uploadMaterial(input: UploadMaterialInput, userId: string, userRole: string, file: Express.Multer.File, ipAddress?: string) {
    // All authenticated users may upload; privileged roles are auto-approved,
    // everyone else goes into PENDING_REVIEW until an admin approves.
    const isPrivileged = PRIVILEGED_UPLOADER_ROLES.has(userRole);
    const reviewStatus = isPrivileged ? 'APPROVED' : 'PENDING_REVIEW';

    // Get user's department if not provided
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { departmentId: true } });
    const departmentId = input.departmentId || user?.departmentId;
    if (!departmentId) throw new AppError('Department information is required', 400);

    // Extract text — tries text layer first, then Groq Vision → Gemini OCR for scanned PDFs.
    // Throws 422 only if all methods are exhausted and file remains unreadable.
    const extraction = await extractTextOrReject(file.buffer, file.mimetype, file.originalname);

    const contentHash = crypto.createHash('sha256').update(file.buffer).digest('hex');
    const duplicate = await prisma.material.findFirst({ where: { contentHash, isDeleted: false } });
    if (duplicate) throw new AppError(`Duplicate file detected. This file already exists as "${duplicate.title}"`, 409);

    const { key, url } = await r2.upload(file.buffer, file.originalname, file.mimetype);

    const material = await prisma.material.create({
      data: {
        title: input.title, type: input.type, courseCode: input.courseCode, courseTitle: input.courseTitle,
        year: input.year, level: input.level, description: input.description,
        fileUrl: url, fileKey: key, fileSize: file.size, mimeType: file.mimetype, contentHash,
        extractedText: extraction.text,
        extractedTextPreview: extraction.preview,
        textExtractionStatus: extraction.status,
        uploadedById: userId, departmentId: departmentId as string,
        visibility: input.visibility, studyGroupId: input.studyGroupId,
        reviewStatus,
        // Student uploads default to PRIVATE until reviewed so they don't appear in public feed
        ...(reviewStatus === 'PENDING_REVIEW' && { visibility: 'PRIVATE' }),
      },
      select: MATERIAL_SELECT,
    });

    await auditService.log({ action: 'MATERIAL_UPLOADED', performedById: userId, targetId: material.id, targetType: 'Material', meta: { title: material.title, visibility: material.visibility, courseCode: material.courseCode, reviewStatus }, ipAddress }).catch(() => null);

    // Auto-trigger AI summary generation for PDF files (smooth UX — summary ready on detail page load)
    if (material.mimeType === 'application/pdf') {
      aiService.requestSummary(material.id, userId).catch((err) => {
        // Log but don't fail upload if summary generation fails to start
        console.error(`Failed to start summary generation for material ${material.id}:`, err.message);
      });
    }

    return { ...material, reviewStatus, pendingReview: reviewStatus === 'PENDING_REVIEW' };
  },

  async bulkUploadMaterials(inputs: UploadMaterialInput[], userId: string, userRole: string, files: Express.Multer.File[], ipAddress?: string) {
    if (inputs.length !== files.length) throw new AppError('Number of metadata entries must match number of files', 400);

    const isPrivileged = PRIVILEGED_UPLOADER_ROLES.has(userRole);
    const reviewStatus = isPrivileged ? 'APPROVED' : 'PENDING_REVIEW';
    const results: { success: boolean; title: string; error?: string }[] = [];

    // Get user's department once
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { departmentId: true } });
    const userDepartmentId = user?.departmentId;
    if (!userDepartmentId) throw new AppError('Department information is required', 400);

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const input = inputs[i];
      try {
        const extraction = await extractTextOrReject(file.buffer, file.mimetype, file.originalname).catch((e: Error) => { throw e; });
        const contentHash = crypto.createHash('sha256').update(file.buffer).digest('hex');
        const duplicate = await prisma.material.findFirst({ where: { contentHash, isDeleted: false } });
        if (duplicate) { results.push({ success: false, title: input.title, error: `Duplicate: already exists as "${duplicate.title}"` }); continue; }
        const { key, url } = await r2.upload(file.buffer, file.originalname, file.mimetype);
        const departmentId = input.departmentId || userDepartmentId;
        const material = await prisma.material.create({
          data: {
            title: input.title, type: input.type, courseCode: input.courseCode, courseTitle: input.courseTitle,
            year: input.year, level: input.level, description: input.description,
            fileUrl: url, fileKey: key, fileSize: file.size, mimeType: file.mimetype, contentHash,
            extractedText: extraction.text,
            extractedTextPreview: extraction.preview,
            textExtractionStatus: extraction.status,
            uploadedById: userId, departmentId: departmentId as string,
            visibility: reviewStatus === 'PENDING_REVIEW' ? 'PRIVATE' : input.visibility,
            studyGroupId: input.studyGroupId,
            reviewStatus,
          },
        });
        await auditService.log({ action: 'MATERIAL_UPLOADED', performedById: userId, targetId: material.id, targetType: 'Material', meta: { title: material.title, visibility: material.visibility }, ipAddress }).catch(() => null);
        
        // Auto-trigger AI summary generation for PDF files
        if (material.mimeType === 'application/pdf') {
          aiService.requestSummary(material.id, userId).catch((err) => {
            console.error(`Failed to start summary generation for material ${material.id}:`, err.message);
          });
        }

        results.push({ success: true, title: input.title });
      } catch (err) {
        results.push({ success: false, title: input.title, error: err instanceof Error ? err.message : 'Upload failed' });
      }
    }

    return { total: files.length, uploaded: results.filter((r) => r.success).length, failed: results.filter((r) => !r.success).length, results };
  },

  async updateVisibility(id: string, input: UpdateVisibilityInput, userId: string, userRole: string, ipAddress?: string) {
    const material = await prisma.material.findUnique({ where: { id, isDeleted: false } });
    if (!material) throw new AppError('Material not found', 404);

    const isAdmin = userRole === 'SCHOOL_ADMIN' || userRole === 'SUPER_ADMIN';
    if (!isAdmin && material.uploadedById !== userId) throw new AppError('Not authorized', 403);
    if (input.visibility === 'STUDY_GROUP' && !input.studyGroupId) throw new AppError('studyGroupId is required for STUDY_GROUP visibility', 400);

    const updated = await prisma.material.update({
      where: { id },
      data: { visibility: input.visibility, studyGroupId: input.visibility === 'STUDY_GROUP' ? input.studyGroupId : null },
      select: { id: true, title: true, visibility: true, studyGroupId: true },
    });

    await auditService.log({ action: 'MATERIAL_VISIBILITY_CHANGED', performedById: userId, targetId: id, targetType: 'Material', meta: { from: material.visibility, to: input.visibility }, ipAddress }).catch(() => null);
    return updated;
  },

  async updateMaterial(id: string, input: UpdateMaterialInput, userId: string, userRole: string, ipAddress?: string) {
    const material = await prisma.material.findUnique({ where: { id, isDeleted: false } });
    if (!material) throw new AppError('Material not found', 404);

    const isAdmin = userRole === 'SCHOOL_ADMIN' || userRole === 'SUPER_ADMIN';
    if (!isAdmin && material.uploadedById !== userId) throw new AppError('Not authorized', 403);

    if (input.visibility === 'STUDY_GROUP' && !input.studyGroupId) throw new AppError('studyGroupId is required for STUDY_GROUP visibility', 400);

    const updated = await prisma.material.update({
      where: { id },
      data: {
        ...(input.title && { title: input.title }),
        ...(input.description !== undefined && { description: input.description }),
        ...(input.level && { level: input.level }),
        ...(input.visibility && { visibility: input.visibility, studyGroupId: input.visibility === 'STUDY_GROUP' ? input.studyGroupId : null }),
      },
      select: MATERIAL_SELECT,
    });

    // Log audit only if visibility changed
    if (input.visibility) {
      await auditService.log({ action: 'MATERIAL_VISIBILITY_CHANGED', performedById: userId, targetId: id, targetType: 'Material', meta: { from: material.visibility, to: input.visibility }, ipAddress }).catch(() => null);
    }
    return updated;
  },

  async deleteMaterial(id: string, userId: string, userRole: string, ipAddress?: string) {
    const material = await prisma.material.findUnique({ where: { id } });
    if (!material) throw new AppError('Material not found', 404);

    const isAdmin = userRole === 'SCHOOL_ADMIN' || userRole === 'SUPER_ADMIN';
    if (!isAdmin && material.uploadedById !== userId) throw new AppError('Not authorized', 403);

    await prisma.material.update({ where: { id }, data: { isDeleted: true, deletedAt: new Date() } });
    await r2.delete(material.fileKey).catch(() => null);
    await auditService.log({ action: 'MATERIAL_DELETED', performedById: userId, targetId: id, targetType: 'Material', meta: { title: material.title }, ipAddress }).catch(() => null);
    return { deleted: true };
  },

  async verifyMaterial(id: string, adminId: string, ipAddress?: string) {
    const material = await prisma.material.findUnique({ where: { id } });
    if (!material || material.isDeleted) throw new AppError('Material not found', 404);

    const updated = await prisma.material.update({
      where: { id },
      data: { isVerified: true, verifiedAt: new Date(), verifiedById: adminId },
      select: { id: true, title: true, isVerified: true, verifiedAt: true },
    });

    await auditService.log({ action: 'MATERIAL_VERIFIED', performedById: adminId, targetId: id, targetType: 'Material', meta: { title: material.title }, ipAddress }).catch(() => null);
    return updated;
  },

  async reviewMaterial(id: string, adminId: string, decision: 'APPROVED' | 'REJECTED', note: string | undefined, ipAddress?: string) {
    const material = await prisma.material.findUnique({ where: { id } });
    if (!material || material.isDeleted) throw new AppError('Material not found', 404);
    if (material.reviewStatus !== 'PENDING_REVIEW') throw new AppError('Material is not pending review', 400);

    const updated = await prisma.material.update({
      where: { id },
      data: {
        reviewStatus: decision,
        reviewedAt: new Date(),
        reviewedById: adminId,
        reviewNote: note ?? null,
        // When approved, restore the uploader's intended visibility; otherwise keep PRIVATE
        ...(decision === 'APPROVED' && { visibility: material.visibility === 'PRIVATE' ? 'PUBLIC' : material.visibility }),
      },
      select: { id: true, title: true, reviewStatus: true, reviewedAt: true, reviewNote: true, visibility: true },
    });

    await auditService.log({
      action: decision === 'APPROVED' ? 'MATERIAL_REVIEW_APPROVED' : 'MATERIAL_REVIEW_REJECTED',
      performedById: adminId, targetId: id, targetType: 'Material',
      meta: { title: material.title, note },
      ipAddress,
    }).catch(() => null);

    return updated;
  },

  async listPendingReviewMaterials(userRole: string, page: number, limit: number) {
    const isAdmin = userRole === 'SCHOOL_ADMIN' || userRole === 'SUPER_ADMIN' || userRole === 'COURSE_REP';
    if (!isAdmin) throw new AppError('Insufficient permissions', 403);

    const skip = (page - 1) * limit;
    const where = { isDeleted: false, reviewStatus: 'PENDING_REVIEW' as const };

    const [data, total] = await Promise.all([
      prisma.material.findMany({
        where,
        select: {
          ...MATERIAL_SELECT,
          reviewStatus: true,
          createdAt: true,
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'asc' },
      }),
      prisma.material.count({ where }),
    ]);

    return { data, total, page, limit };
  },

  async incrementDownload(id: string) {
    await prisma.material.update({ where: { id }, data: { downloadCount: { increment: 1 } } });
    return { counted: true };
  },

  async rateMaterial(id: string, userId: string, input: RateMaterialInput) {
    await prisma.materialRating.upsert({
      where: { userId_materialId: { userId, materialId: id } },
      create: { userId, materialId: id, rating: input.rating },
      update: { rating: input.rating },
    });
    const { _avg } = await prisma.materialRating.aggregate({ where: { materialId: id }, _avg: { rating: true } });
    await prisma.material.update({ where: { id }, data: { avgRating: _avg.rating ?? 0 } });
    return { rated: true, avgRating: _avg.rating ?? 0 };
  },

  async toggleBookmark(materialId: string, userId: string) {
    const existing = await prisma.bookmark.findUnique({ where: { userId_materialId: { userId, materialId } } });
    if (existing) {
      await prisma.bookmark.delete({ where: { userId_materialId: { userId, materialId } } });
      return { bookmarked: false };
    }
    await prisma.bookmark.create({ data: { userId, materialId, type: 'MATERIAL' } });
    return { bookmarked: true };
  },

  async getDownloadUrl(id: string, userId: string, userRole: string) {
    const material = await prisma.material.findUnique({
      where: { id, isDeleted: false },
      select: { fileKey: true, title: true, mimeType: true, visibility: true, uploadedById: true, studyGroupId: true, department: { select: { id: true } }, level: true },
    });
    if (!material) throw new AppError('Material not found', 404);
    await assertVisibilityAccess(material, userId, userRole);
    await prisma.material.update({ where: { id }, data: { downloadCount: { increment: 1 } } });
    const url = await r2.getDownloadUrl(material.fileKey);
    return { url, title: material.title, mimeType: material.mimeType, expiresIn: 3600 };
  },

  // ── Quizzes ──────────────────────────────────────────────────

  async listQuizzes(input: ListQuizzesInput, userId: string) {
    const { page, limit, courseCode, level, isDraft } = input;
    const skip = (page - 1) * limit;

    const user = await prisma.user.findUnique({ where: { id: userId }, select: { departmentId: true, level: true } });
    if (!user) throw new AppError('User not found', 404);

    const where = {
      isActive: true,
      isDraft: isDraft ?? false,
      ...await quizVisibilityFilter(userId, user, input),
      ...(input.departmentId && { departmentId: input.departmentId }),
      ...(input.studyGroupId && { studyGroupId: input.studyGroupId }),
      ...(courseCode && { courseCode: courseCode.toUpperCase() }),
      ...(level && { level }),
    };

    const [data, total] = await Promise.all([
      prisma.quiz.findMany({
        where,
        select: {
          id: true, title: true, courseCode: true, description: true, level: true,
          timeLimit: true, visibility: true, isAiGenerated: true, isDraft: true,
          createdAt: true, creatorRole: true,
          _count: { select: { questions: true, attempts: true } },
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.quiz.count({ where }),
    ]);

    return { data, total, page, limit };
  },

  async getQuiz(id: string, userId: string, userRole: string) {
    const quiz = await prisma.quiz.findUnique({
      where: { id, isActive: true },
      select: {
        id: true, title: true, courseCode: true, description: true, level: true,
        timeLimit: true, visibility: true, studyGroupId: true, departmentId: true,
        isAiGenerated: true, isDraft: true, quizApprovalStatus: true,
        createdById: true, creatorRole: true, createdAt: true,
        questions: {
          select: { id: true, question: true, options: true, order: true },
          orderBy: { order: 'asc' },
        },
      },
    });

    if (!quiz) throw new AppError('Quiz not found', 404);
    await assertQuizAccess(quiz, userId, userRole);

    const isAdmin = userRole === 'SCHOOL_ADMIN' || userRole === 'SUPER_ADMIN' || userRole === 'COURSE_REP';
    if (!isAdmin && quiz.quizApprovalStatus !== 'APPROVED') throw new AppError('Quiz not found', 404);
    return quiz;
  },

  async createQuiz(input: CreateQuizInput, userId: string, userRole: string) {
    if (!QUIZ_CREATOR_ROLES.has(userRole)) {
      throw new AppError('Only course reps, admins, or authorized uploaders can create quizzes', 403);
    }

    if (input.visibility === 'STUDY_GROUP' && !input.studyGroupId) {
      throw new AppError('studyGroupId is required for STUDY_GROUP visibility', 400);
    }

    const quiz = await prisma.quiz.create({
      data: {
        title: input.title,
        courseCode: input.courseCode,
        description: input.description,
        level: input.level,
        timeLimit: input.timeLimit,
        departmentId: input.departmentId,
        createdById: userId,
        creatorRole: userRole,
        visibility: input.visibility,
        studyGroupId: input.studyGroupId ?? null,
        isDraft: input.isDraft,
        questions: {
          create: input.questions.map((q) => ({
            question: q.question,
            options: q.options,
            correctAnswer: q.correctAnswer,
            explanation: q.explanation,
            order: q.order,
          })),
        },
      },
      include: { questions: { orderBy: { order: 'asc' } } },
    });

    // Initialise question stats rows
    await prisma.quizQuestionStat.createMany({
      data: quiz.questions.map((q: QuizQuestion) => ({
        quizId: quiz.id,
        questionId: q.id,
        topic: extractTopic(q.question, quiz.courseCode),
      })),
      skipDuplicates: true,
    });

    // Notify participants when published (not a draft)
    if (!input.isDraft) {
      await notifyQuizParticipants({ id: quiz.id, title: quiz.title, departmentId: quiz.departmentId, studyGroupId: quiz.studyGroupId, visibility: quiz.visibility, level: quiz.level }).catch(() => null);
    }

    return quiz;
  },

  async publishQuiz(id: string, isDraft: boolean, userId: string, userRole: string) {
    const quiz = await prisma.quiz.findUnique({ where: { id } });
    if (!quiz) throw new AppError('Quiz not found', 404);

    const isAdmin = userRole === 'SCHOOL_ADMIN' || userRole === 'SUPER_ADMIN';
    if (!isAdmin && quiz.createdById !== userId) throw new AppError('Not authorized', 403);

    const updated = await prisma.quiz.update({
      where: { id },
      data: { isDraft },
      select: { id: true, title: true, isDraft: true },
    });

    // Notify when publishing (draft → live)
    if (!isDraft) {
      await notifyQuizParticipants({ id: quiz.id, title: quiz.title, departmentId: quiz.departmentId, studyGroupId: quiz.studyGroupId, visibility: quiz.visibility, level: quiz.level }).catch(() => null);
    }

    return updated;
  },

  async updateQuiz(id: string, input: Partial<CreateQuizInput>, userId: string, userRole: string) {
    const quiz = await prisma.quiz.findUnique({ where: { id } });
    if (!quiz) throw new AppError('Quiz not found', 404);

    const isAdmin = userRole === 'SCHOOL_ADMIN' || userRole === 'SUPER_ADMIN';
    if (!isAdmin && quiz.createdById !== userId) throw new AppError('Not authorized', 403);

    return prisma.quiz.update({
      where: { id },
      data: {
        ...(input.title && { title: input.title }),
        ...(input.courseCode && { courseCode: input.courseCode }),
        ...(input.description !== undefined && { description: input.description }),
        ...(input.level !== undefined && { level: input.level }),
        ...(input.timeLimit && { timeLimit: input.timeLimit }),
        ...(input.visibility && { visibility: input.visibility }),
        ...(input.studyGroupId !== undefined && { studyGroupId: input.studyGroupId }),
      },
      include: { questions: { orderBy: { order: 'asc' } } },
    });
  },

  async deleteQuiz(id: string, userId: string, userRole: string) {
    const quiz = await prisma.quiz.findUnique({ where: { id } });
    if (!quiz) throw new AppError('Quiz not found', 404);

    const isAdmin = userRole === 'SCHOOL_ADMIN' || userRole === 'SUPER_ADMIN';
    if (!isAdmin && quiz.createdById !== userId) throw new AppError('Not authorized', 403);

    await prisma.quiz.update({ where: { id }, data: { isActive: false } });
    return { deleted: true };
  },

  // ── AI Quiz Generation ────────────────────────────────────────

  async generateQuizFromMaterial(input: GenerateQuizInput, userId: string) {
    const material = await prisma.material.findUnique({
      where: { id: input.materialId, isDeleted: false },
      select: { id: true, title: true, courseCode: true, mimeType: true, aiSummary: { select: { status: true, chunks: { select: { quizQuestions: true, chunkNumber: true } } } } },
    });

    if (!material) throw new AppError('Material not found', 404);
    if (!material.aiSummary || material.aiSummary.status !== 'COMPLETED') {
      throw new AppError('AI summary must be completed before generating a quiz. Request a summary first.', 400);
    }

    // Collect all AI-generated questions from summary chunks
    type RawQuestion = { question: string; options: string[]; correctAnswer: number; explanation: string };
    const allQuestions: RawQuestion[] = material.aiSummary.chunks
      .sort((a: typeof material.aiSummary.chunks[number], b: typeof material.aiSummary.chunks[number]) => a.chunkNumber - b.chunkNumber)
      .flatMap((c: typeof material.aiSummary.chunks[number]) => (Array.isArray(c.quizQuestions) ? (c.quizQuestions as RawQuestion[]) : []));

    if (allQuestions.length === 0) throw new AppError('No questions were generated from this material. Try re-running the AI summary.', 400);

    // Deduplicate by question text and cap at requested count
    const seen = new Set<string>();
    const unique = allQuestions.filter((q) => {
      const key = q.question.toLowerCase().slice(0, 60);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    }).slice(0, input.questionCount);

    if (input.visibility === 'STUDY_GROUP' && !input.studyGroupId) {
      throw new AppError('studyGroupId is required for STUDY_GROUP visibility', 400);
    }

    const quiz = await prisma.quiz.create({
      data: {
        title: `AI Quiz: ${material.title}`,
        courseCode: material.courseCode,
        description: `Auto-generated from "${material.title}". Review and edit before publishing.`,
        timeLimit: unique.length * 60,
        departmentId: input.departmentId,
        createdById: userId,
        creatorRole: 'STUDENT',
        visibility: input.visibility,
        studyGroupId: input.studyGroupId ?? null,
        isAiGenerated: true,
        isDraft: true, // always starts as draft — user reviews before publish
        questions: {
          create: unique.map((q, idx) => ({
            question: q.question,
            options: q.options,
            correctAnswer: q.correctAnswer,
            explanation: q.explanation,
            order: idx,
          })),
        },
      },
      include: { questions: { orderBy: { order: 'asc' } } },
    });

    // Initialise question stats
    await prisma.quizQuestionStat.createMany({
      data: quiz.questions.map((q: QuizQuestion) => ({
        quizId: quiz.id,
        questionId: q.id,
        topic: extractTopic(q.question, quiz.courseCode),
      })),
      skipDuplicates: true,
    });

    return quiz;
  },

  async approveQuizQuestions(
    quizId: string,
    approvals: Array<{ questionId: string; approved: boolean }>,
    userId: string,
    userRole: string,
    ipAddress?: string,
  ) {
    const isAuthorised = userRole === 'COURSE_REP' || userRole === 'SCHOOL_ADMIN' || userRole === 'SUPER_ADMIN';
    if (!isAuthorised) throw new AppError('Only course reps and admins can approve quiz questions', 403);

    const quiz = await prisma.quiz.findUnique({ where: { id: quizId }, include: { questions: true } });
    if (!quiz) throw new AppError('Quiz not found', 404);
    if (!quiz.isAiGenerated) throw new AppError('Only AI-generated quizzes require question approval', 400);

    const approvedIds = new Set(approvals.filter((a) => a.approved).map((a) => a.questionId));
    const rejectedIds = approvals.filter((a) => !a.approved).map((a) => a.questionId);

    // Soft-remove rejected questions by setting order to -1 and a flag
    // We delete them outright to keep the quiz clean
    if (rejectedIds.length > 0) {
      await prisma.quizQuestion.deleteMany({ where: { id: { in: rejectedIds }, quizId } });
    }

    const remainingCount = approvedIds.size;
    if (remainingCount === 0) {
      // All questions rejected — mark quiz as rejected
      await prisma.quiz.update({
        where: { id: quizId },
        data: { quizApprovalStatus: 'REJECTED', isDraft: true },
      });
      await prisma.aISummary.updateMany({
        where: { masterQuizId: quizId },
        data: { quizApprovalStatus: 'REJECTED' },
      });
      await auditService.log({ action: 'QUIZ_REJECTED', performedById: userId, targetId: quizId, targetType: 'Quiz', meta: { reason: 'All questions rejected' }, ipAddress }).catch(() => null);
      return { approved: false, approvedCount: 0, rejectedCount: rejectedIds.length };
    }

    // Approved — update timeLimit to match remaining questions, set approved
    await prisma.quiz.update({
      where: { id: quizId },
      data: {
        quizApprovalStatus: 'APPROVED',
        isDraft: false,          // now visible to students
        timeLimit: remainingCount * 60,
      },
    });

    await prisma.aISummary.updateMany({
      where: { masterQuizId: quizId },
      data: { quizApprovalStatus: 'APPROVED' },
    });

    // Initialise question stats for approved questions
    const approvedQuestions = quiz.questions.filter((q: QuizQuestion) => approvedIds.has(q.id));
    await prisma.quizQuestionStat.createMany({
      data: approvedQuestions.map((q: QuizQuestion) => ({
        quizId,
        questionId: q.id,
        topic: extractTopic(q.question, quiz.courseCode),
      })),
      skipDuplicates: true,
    });

    // Notify department students
    await notifyQuizParticipants({ id: quiz.id, title: quiz.title, departmentId: quiz.departmentId, studyGroupId: quiz.studyGroupId, visibility: quiz.visibility, level: quiz.level }).catch(() => null);

    await auditService.log({ action: 'QUIZ_APPROVED', performedById: userId, targetId: quizId, targetType: 'Quiz', meta: { approvedCount: remainingCount, rejectedCount: rejectedIds.length }, ipAddress }).catch(() => null);

    return { approved: true, approvedCount: remainingCount, rejectedCount: rejectedIds.length };
  },

  // ── Quiz Attempts ─────────────────────────────────────────────

  async submitQuizAttempt(quizId: string, userId: string, input: SubmitAttemptInput, userRole: string) {
    const quiz = await prisma.quiz.findUnique({
      where: { id: quizId, isActive: true },
      include: { questions: true },
    });

    if (!quiz) throw new AppError('Quiz not found', 404);
    if (quiz.quizApprovalStatus !== 'APPROVED') throw new AppError('This quiz is not yet available', 403);
    await assertQuizAccess(quiz, userId, userRole);

    const questionMap = new Map<string, QuizQuestion>(quiz.questions.map((q: QuizQuestion) => [q.id, q]));
    let score = 0;

    const gradedAnswers = input.answers.map((a: typeof input.answers[number]) => {
      const question = questionMap.get(a.questionId);
      const correct = question ? question.correctAnswer === a.selected : false;
      if (correct) score++;
      const topic = extractTopic(question?.question ?? '', quiz.courseCode);
      return { questionId: a.questionId, selected: a.selected, correct, topic, explanation: question?.explanation ?? null };
    });

    const percentage = (score / quiz.questions.length) * 100;

    const attempt = await prisma.quizAttempt.create({
      data: { userId, quizId, score, totalQuestions: quiz.questions.length, percentage, timeTaken: input.timeTaken, answers: gradedAnswers },
    });

    // Update analytics in background (non-blocking)
    Promise.all([
      updateStudentAnalytics(userId, gradedAnswers),
      updateQuestionStats(quizId, gradedAnswers),
    ]).catch(() => null);

    return { ...attempt, answers: gradedAnswers };
  },

  async getQuizAttempts(quizId: string, userId: string) {
    return prisma.quizAttempt.findMany({ where: { quizId, userId }, orderBy: { completedAt: 'desc' } });
  },

  // ── Student Analytics ─────────────────────────────────────────

  async getMyAnalytics(userId: string) {
    const [analytics, recentAttempts] = await Promise.all([
      prisma.quizAnalytics.findUnique({ where: { userId } }),
      prisma.quizAttempt.findMany({
        where: { userId },
        orderBy: { completedAt: 'desc' },
        take: 10,
        select: { quizId: true, score: true, totalQuestions: true, percentage: true, completedAt: true, quiz: { select: { title: true, courseCode: true } } },
      }),
    ]);

    const completionRate = analytics && analytics.totalQuestions > 0
      ? Math.round((analytics.totalCorrect / analytics.totalQuestions) * 100)
      : 0;

    const topicAttempts = (analytics?.topicAttempts ?? {}) as Record<string, { attempts: number; wrong: number }>;
    const topicBreakdown = Object.entries(topicAttempts).map(([topic, stats]) => ({
      topic,
      attempts: stats.attempts,
      wrongCount: stats.wrong,
      accuracy: stats.attempts > 0 ? Math.round(((stats.attempts - stats.wrong) / stats.attempts) * 100) : 0,
    })).sort((a, b) => a.accuracy - b.accuracy); // worst first

    return {
      totalAttempts: analytics?.totalAttempts ?? 0,
      totalCorrect: analytics?.totalCorrect ?? 0,
      totalQuestions: analytics?.totalQuestions ?? 0,
      completionRate,
      weakTopics: (analytics?.weakTopics ?? []) as string[],
      topicBreakdown,
      recentAttempts,
    };
  },

  async getOverview(userId: string) {
    const [user, materialsCount, quizAttempts, cgpaRecord, recentMaterials] = await Promise.all([
      prisma.user.findUnique({ where: { id: userId }, select: { id: true, fullName: true, level: true } }),
      prisma.material.count({ where: { uploadedById: userId, isDeleted: false } }),
      prisma.quizAttempt.findMany({
        where: { userId },
        select: { score: true, totalQuestions: true, percentage: true, completedAt: true, quiz: { select: { title: true, courseCode: true, id: true } } },
        orderBy: { completedAt: 'desc' },
      }),
      prisma.cGPARecord.findFirst({ where: { userId }, select: { gpa: true, cgpa: true }, orderBy: { createdAt: 'desc' } }),
      prisma.material.findMany({
        where: { uploadedById: userId, isDeleted: false },
        select: { id: true, title: true, courseCode: true, createdAt: true },
        orderBy: { createdAt: 'desc' },
        take: 3,
      }),
    ]);

    if (!user) throw new AppError('User not found', 404);

    const quizzesTaken = quizAttempts.length;
    const averageQuizScore = quizzesTaken > 0
      ? Math.round(quizAttempts.reduce((sum: number, a: typeof quizAttempts[number]) => sum + (a.percentage || 0), 0) / quizzesTaken * 10) / 10
      : 0;

    const recentQuizzes = quizAttempts.slice(0, 3).map((attempt: typeof quizAttempts[number]) => ({
      id: attempt.quiz?.id || '',
      title: attempt.quiz?.title || 'Unknown Quiz',
      attemptedAt: attempt.completedAt,
      score: attempt.score || 0,
    }));

    return {
      materialsCount: materialsCount || 0,
      quizzesTaken,
      averageQuizScore,
      cgpa: cgpaRecord?.cgpa ?? 0,
      recentMaterials: recentMaterials && recentMaterials.length > 0 ? recentMaterials : [],
      recentQuizzes: recentQuizzes && recentQuizzes.length > 0 ? recentQuizzes : [],
    };
  },

  // ── Admin Analytics ───────────────────────────────────────────

  async getAdminQuizAnalytics(input: AdminAnalyticsInput, userRole: string) {
    const isAdmin = userRole === 'SCHOOL_ADMIN' || userRole === 'SUPER_ADMIN';
    if (!isAdmin) throw new AppError('Insufficient permissions', 403);

    const { departmentId, courseCode, from, to } = input;

    const quizWhere = {
      departmentId,
      isActive: true,
      isDraft: false,
      ...(courseCode && { courseCode: courseCode.toUpperCase() }),
    };

    const attemptWhere = {
      quiz: quizWhere,
      ...(from || to ? { completedAt: { ...(from && { gte: from }), ...(to && { lte: to }) } } : {}),
    };

    const [quizzes, totalAttempts, questionStats, enrolledCount, activeStudents] = await Promise.all([
      prisma.quiz.findMany({
        where: quizWhere,
        select: { id: true, title: true, courseCode: true, _count: { select: { attempts: true } } },
      }),
      prisma.quizAttempt.aggregate({ where: attemptWhere, _count: true, _avg: { percentage: true } }),
      prisma.quizQuestionStat.findMany({
        where: { quiz: quizWhere },
        select: { questionId: true, topic: true, totalAttempts: true, totalWrong: true },
      }),
      prisma.user.count({ where: { departmentId, isDeleted: false } }),
      prisma.quizAttempt.findMany({
        where: { ...attemptWhere, completedAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } },
        distinct: ['userId'],
        select: { userId: true },
      }),
    ]);

    const uniqueAttemptors = await prisma.quizAttempt.findMany({
      where: attemptWhere,
      distinct: ['userId'],
      select: { userId: true },
    });

    const participationRate = enrolledCount > 0 ? Math.round((uniqueAttemptors.length / enrolledCount) * 100) : 0;

    // Topic difficulty index
    const topicStats: Record<string, { attempts: number; wrong: number }> = {};
    for (const stat of questionStats) {
      if (!topicStats[stat.topic]) topicStats[stat.topic] = { attempts: 0, wrong: 0 };
      topicStats[stat.topic].attempts += stat.totalAttempts;
      topicStats[stat.topic].wrong += stat.totalWrong;
    }

    const topicDifficulty = Object.entries(topicStats).map(([topic, s]) => ({
      topic,
      difficultyIndex: s.attempts > 0 ? Math.round((s.wrong / s.attempts) * 100) / 100 : 0,
      totalAttempts: s.attempts,
      totalWrong: s.wrong,
    })).sort((a, b) => b.difficultyIndex - a.difficultyIndex);

    const hardTopics = topicDifficulty.filter((t) => t.difficultyIndex > 0.7);

    return {
      quizCount: quizzes.length,
      totalAttempts: totalAttempts._count,
      avgScore: Math.round((totalAttempts._avg.percentage ?? 0) * 100) / 100,
      participationRate,
      enrolledCount,
      activeStudentsLast7Days: activeStudents.length,
      lowActivityCohortSize: enrolledCount - activeStudents.length,
      hardTopics,
      topicDifficulty,
      quizBreakdown: quizzes.map((q: typeof quizzes[number]) => ({ id: q.id, title: q.title, courseCode: q.courseCode, attempts: q._count.attempts })),
    };
  },
};
