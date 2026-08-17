import type { RequestHandler } from 'express';
import { studyService } from '@/modules/study/study.service.js';
import {
  adminQuizAnalyticsSchema,
  approveQuizQuestionsSchema,
  createQuizSchema,
  generateQuizFromMaterialSchema,
  listMaterialsSchema,
  listQuizzesSchema,
  publishQuizSchema,
  rateMaterialSchema,
  reviewMaterialSchema,
  submitQuizAttemptSchema,
  updateVisibilitySchema,
  updateMaterialSchema,
  uploadMaterialSchema,
} from '@/modules/study/study.validators.js';
import { AppError, sendPaginated, sendSuccess } from '@/utils/response.js';

// ── Text Preview (pre-upload) ────────────────────────────────

export const previewExtraction: RequestHandler = async (req, res, next) => {
  try {
    if (!req.file) throw new AppError('No file uploaded', 400);
    const { extractText } = await import('@/utils/extractText.js');
    const result = await extractText(req.file.buffer, req.file.mimetype, req.file.originalname);
    sendSuccess(res, {
      status: result.status,
      charCount: result.charCount,
      preview: result.preview,
      readable: result.status === 'READABLE',
    });
  } catch (error) { next(error); }
};

// ── Materials ─────────────────────────────────────────────────

export const listMaterials: RequestHandler = async (req, res, next) => {
  try {
    const input = listMaterialsSchema.parse(req.query);
    const result = await studyService.listMaterials(input, req.user!.id);
    sendPaginated(res, result.data, result.page, result.total, result.limit);
  } catch (error) { next(error); }
};

export const getMaterial: RequestHandler = async (req, res, next) => {
  try {
    const material = await studyService.getMaterial(req.params.id, req.user!.id, req.user!.role);
    sendSuccess(res, material);
  } catch (error) { next(error); }
};

export const uploadMaterial: RequestHandler = async (req, res, next) => {
  try {
    if (!req.file) throw new AppError('No file uploaded', 400);
    const material = await studyService.uploadMaterial(uploadMaterialSchema.parse(req.body), req.user!.id, req.user!.role, req.file, req.ip);
    sendSuccess(res, material, 201);
  } catch (error) { next(error); }
};

export const bulkUploadMaterials: RequestHandler = async (req, res, next) => {
  try {
    const files = req.files as Express.Multer.File[];
    if (!files?.length) throw new AppError('No files uploaded', 400);
    const rawMaterials = req.body.materials;
    let materials: unknown[];
    try {
      materials = (typeof rawMaterials === 'string' ? JSON.parse(rawMaterials) : rawMaterials) as unknown[];
    } catch {
      throw new AppError('materials field must be a valid JSON array', 400);
    }
    if (!Array.isArray(materials)) throw new AppError('materials must be a JSON array', 400);
    if (materials.length !== files.length) {
      throw new AppError(`materials array length (${materials.length}) must match number of uploaded files (${files.length})`, 400);
    }
    const result = await studyService.bulkUploadMaterials(materials.map((m) => uploadMaterialSchema.parse(m)), req.user!.id, req.user!.role, files, req.ip);
    sendSuccess(res, result, 207);
  } catch (error) { next(error); }
};

export const updateVisibility: RequestHandler = async (req, res, next) => {
  try {
    const result = await studyService.updateVisibility(req.params.id, updateVisibilitySchema.parse(req.body), req.user!.id, req.user!.role, req.ip);
    sendSuccess(res, result);
  } catch (error) { next(error); }
};

export const updateMaterial: RequestHandler = async (req, res, next) => {
  try {
    const result = await studyService.updateMaterial(req.params.id, updateMaterialSchema.parse(req.body), req.user!.id, req.user!.role, req.ip);
    sendSuccess(res, result);
  } catch (error) { next(error); }
};

export const deleteMaterial: RequestHandler = async (req, res, next) => {
  try {
    sendSuccess(res, await studyService.deleteMaterial(req.params.id, req.user!.id, req.user!.role, req.ip));
  } catch (error) { next(error); }
};

export const adminDeleteMaterial: RequestHandler = async (req, res, next) => {
  try {
    sendSuccess(res, await studyService.deleteMaterial(req.params.id, req.user!.id, req.user!.role, req.ip));
  } catch (error) { next(error); }
};

export const verifyMaterial: RequestHandler = async (req, res, next) => {
  try {
    sendSuccess(res, await studyService.verifyMaterial(req.params.id, req.user!.id, req.ip));
  } catch (error) { next(error); }
};

export const listPendingReviewMaterials: RequestHandler = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(String(req.query.page ?? '1'), 10));
    const limit = Math.min(50, Math.max(1, parseInt(String(req.query.limit ?? '20'), 10)));
    const result = await studyService.listPendingReviewMaterials(req.user!.role, page, limit);
    sendPaginated(res, result.data, result.page, result.total, result.limit);
  } catch (error) { next(error); }
};

export const reviewMaterial: RequestHandler = async (req, res, next) => {
  try {
    const { decision, note } = reviewMaterialSchema.parse(req.body);
    sendSuccess(res, await studyService.reviewMaterial(req.params.id, req.user!.id, decision, note, req.ip));
  } catch (error) { next(error); }
};

export const incrementDownload: RequestHandler = async (req, res, next) => {
  try {
    sendSuccess(res, await studyService.incrementDownload(req.params.id));
  } catch (error) { next(error); }
};

export const rateMaterial: RequestHandler = async (req, res, next) => {
  try {
    sendSuccess(res, await studyService.rateMaterial(req.params.id, req.user!.id, rateMaterialSchema.parse(req.body)));
  } catch (error) { next(error); }
};

export const toggleBookmark: RequestHandler = async (req, res, next) => {
  try {
    sendSuccess(res, await studyService.toggleBookmark(req.params.id, req.user!.id));
  } catch (error) { next(error); }
};

export const getDownloadUrl: RequestHandler = async (req, res, next) => {
  try {
    sendSuccess(res, await studyService.getDownloadUrl(req.params.id, req.user!.id, req.user!.role));
  } catch (error) { next(error); }
};

// ── Quizzes ───────────────────────────────────────────────────

export const listQuizzes: RequestHandler = async (req, res, next) => {
  try {
    const input = listQuizzesSchema.parse(req.query);
    const result = await studyService.listQuizzes(input, req.user!.id);
    sendPaginated(res, result.data, result.page, result.total, result.limit);
  } catch (error) { next(error); }
};

export const getQuiz: RequestHandler = async (req, res, next) => {
  try {
    sendSuccess(res, await studyService.getQuiz(req.params.id, req.user!.id, req.user!.role));
  } catch (error) { next(error); }
};

export const createQuiz: RequestHandler = async (req, res, next) => {
  try {
    const quiz = await studyService.createQuiz(createQuizSchema.parse(req.body), req.user!.id, req.user!.role);
    sendSuccess(res, quiz, 201);
  } catch (error) { next(error); }
};

export const updateQuiz: RequestHandler = async (req, res, next) => {
  try {
    sendSuccess(res, await studyService.updateQuiz(req.params.id, createQuizSchema.partial().parse(req.body), req.user!.id, req.user!.role));
  } catch (error) { next(error); }
};

export const publishQuiz: RequestHandler = async (req, res, next) => {
  try {
    const { isDraft } = publishQuizSchema.parse(req.body);
    sendSuccess(res, await studyService.publishQuiz(req.params.id, isDraft, req.user!.id, req.user!.role));
  } catch (error) { next(error); }
};

export const deleteQuiz: RequestHandler = async (req, res, next) => {
  try {
    sendSuccess(res, await studyService.deleteQuiz(req.params.id, req.user!.id, req.user!.role));
  } catch (error) { next(error); }
};

export const generateQuizFromMaterial: RequestHandler = async (req, res, next) => {
  try {
    const quiz = await studyService.generateQuizFromMaterial(generateQuizFromMaterialSchema.parse(req.body), req.user!.id);
    sendSuccess(res, quiz, 201);
  } catch (error) { next(error); }
};

export const submitQuizAttempt: RequestHandler = async (req, res, next) => {
  try {
    const result = await studyService.submitQuizAttempt(req.params.id, req.user!.id, submitQuizAttemptSchema.parse(req.body), req.user!.role);
    sendSuccess(res, result);
  } catch (error) { next(error); }
};

export const getQuizAttempts: RequestHandler = async (req, res, next) => {
  try {
    sendSuccess(res, await studyService.getQuizAttempts(req.params.id, req.user!.id));
  } catch (error) { next(error); }
};

// ── Analytics ─────────────────────────────────────────────────

export const getMyAnalytics: RequestHandler = async (req, res, next) => {
  try {
    sendSuccess(res, await studyService.getMyAnalytics(req.user!.id));
  } catch (error) { next(error); }
};

export const getOverview: RequestHandler = async (req, res, next) => {
  try {
    sendSuccess(res, await studyService.getOverview(req.user!.id));
  } catch (error) { next(error); }
};

export const approveQuizQuestions: RequestHandler = async (req, res, next) => {
  try {
    const { approvals } = approveQuizQuestionsSchema.parse(req.body);
    const result = await studyService.approveQuizQuestions(req.params.id, approvals, req.user!.id, req.user!.role, req.ip);
    sendSuccess(res, result);
  } catch (error) { next(error); }
};

export const getAdminQuizAnalytics: RequestHandler = async (req, res, next) => {
  try {
    sendSuccess(res, await studyService.getAdminQuizAnalytics(adminQuizAnalyticsSchema.parse(req.query), req.user!.role));
  } catch (error) { next(error); }
};
