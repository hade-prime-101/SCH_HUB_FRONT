import type { Request, Response, NextFunction } from 'express';
import { superAdminService } from './super-admin.service.js';
import { auditService } from './audit.service.js';
import { sendSuccess, AppError } from '@/utils/response.js';
import { campusMapService } from '@/modules/campus-map/campus-map.service.js';
import { campusGeojsonImportService } from '@/modules/campus-map/ingest/geojson-import.service.js';
import { parseBbox as parseBboxParam } from '@/modules/campus-map/campus-map.validators.js';
import {
  createAdminSchema,
  resetAdminPasswordSchema,
  listAuditLogsSchema,
  createSchoolSchema,
  updateSchoolSchema,
  createFacultySchema,
  createDepartmentSchema,
  listMapFeaturesQuerySchema,
  listMapEntrancesQuerySchema,
  upsertMapFeatureSchema,
  upsertEntranceSchema,
  importMapGeoJsonSchema,
  deleteMapFeatureImageSchema,
} from './super-admin.validators.js';
import type { AuditAction } from '@prisma/client';

const ip = (req: Request) => req.ip ?? req.socket.remoteAddress;

// ── Admin management ───────────────────────────────────────

export const createAdmin = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const input = createAdminSchema.parse(req.body);
    const admin = await superAdminService.createAdmin(input, req.user!.id, ip(req));
    return sendSuccess(res, admin, 201);
  } catch (e) { return next(e); }
};

export const listAdmins = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const schoolId = typeof req.query.schoolId === 'string' ? req.query.schoolId : undefined;
    const admins = await superAdminService.listAdmins(schoolId);
    return sendSuccess(res, admins);
  } catch (e) { return next(e); }
};

export const deleteAdmin = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await superAdminService.deleteAdmin(req.params.adminId, req.user!.id, ip(req));
    return sendSuccess(res, result);
  } catch (e) { return next(e); }
};

export const deactivateAdmin = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await superAdminService.deactivateAdmin(req.params.adminId, req.user!.id, ip(req));
    return sendSuccess(res, result);
  } catch (e) { return next(e); }
};

export const reactivateAdmin = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await superAdminService.reactivateAdmin(req.params.adminId, req.user!.id, ip(req));
    return sendSuccess(res, result);
  } catch (e) { return next(e); }
};

export const resetAdminPassword = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const input = resetAdminPasswordSchema.parse(req.body);
    const result = await superAdminService.resetAdminPassword(req.params.adminId, input, req.user!.id, ip(req));
    return sendSuccess(res, result);
  } catch (e) { return next(e); }
};

// ── User block/unblock ─────────────────────────────────────

export const blockUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await superAdminService.blockUser(req.params.userId, req.user!.id, ip(req));
    return sendSuccess(res, result);
  } catch (e) { return next(e); }
};

export const unblockUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await superAdminService.unblockUser(req.params.userId, req.user!.id, ip(req));
    return sendSuccess(res, result);
  } catch (e) { return next(e); }
};

// ── School management ──────────────────────────────────────

export const createSchool = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const input = createSchoolSchema.parse(req.body);
    const school = await superAdminService.createSchool(input, req.user!.id, ip(req));
    return sendSuccess(res, school, 201);
  } catch (e) { return next(e); }
};

export const updateSchool = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const input = updateSchoolSchema.parse(req.body);
    const school = await superAdminService.updateSchool(req.params.schoolId, input, req.user!.id, ip(req));
    return sendSuccess(res, school);
  } catch (e) { return next(e); }
};

export const listAllSchools = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const schools = await superAdminService.listAllSchools();
    return sendSuccess(res, schools);
  } catch (e) { return next(e); }
};

// ── Faculty management ──────────────────────────────────────────────────

export const createFaculty = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, schoolId } = createFacultySchema.parse(req.body);
    const faculty = await superAdminService.createFaculty(req.params.schoolId ?? schoolId!, name);
    return sendSuccess(res, faculty, 201);
  } catch (e) { return next(e); }
};

export const listFaculties = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const faculties = await superAdminService.listFaculties(req.params.schoolId);
    return sendSuccess(res, faculties);
  } catch (e) { return next(e); }
};

export const deleteFaculty = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await superAdminService.deleteFaculty(req.params.facultyId);
    return sendSuccess(res, result);
  } catch (e) { return next(e); }
};

// ── Department management ──────────────────────────────────────────────

export const createDepartment = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, shortCode, facultyId } = createDepartmentSchema.parse(req.body);
    const dept = await superAdminService.createDepartment(req.params.facultyId ?? facultyId!, name, shortCode);
    return sendSuccess(res, dept, 201);
  } catch (e) { return next(e); }
};

export const listDepartments = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const depts = await superAdminService.listDepartments(req.params.facultyId);
    return sendSuccess(res, depts);
  } catch (e) { return next(e); }
};

export const deleteDepartment = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await superAdminService.deleteDepartment(req.params.departmentId);
    return sendSuccess(res, result);
  } catch (e) { return next(e); }
};

// ── Audit logs ─────────────────────────────────────────────

export const getAuditLogs = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const query = listAuditLogsSchema.parse(req.query);
    const result = await auditService.listLogs({
      ...query,
      action: query.action as AuditAction | undefined,
      from: query.from ? new Date(query.from) : undefined,
      to: query.to ? new Date(query.to) : undefined,
    });
    return sendSuccess(res, result.items, 200, { total: result.total, page: result.page, limit: result.limit });
  } catch (e) { return next(e); }
};

// ── Platform analytics ─────────────────────────────────────

export const getPlatformStats = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const stats = await superAdminService.getPlatformStats();
    return sendSuccess(res, stats);
  } catch (e) { return next(e); }
};

// ── School-admin scoped handlers ───────────────────────────

export const getSchoolStats = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const stats = await superAdminService.getSchoolStats(req.user!.schoolId);
    return sendSuccess(res, stats);
  } catch (e) { return next(e); }
};

export const listSchoolUsers = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Math.min(Number(req.query.limit) || 50, 100);
    const search = typeof req.query.search === 'string' ? req.query.search : undefined;
    const role = typeof req.query.role === 'string' ? req.query.role : undefined;
    const result = await superAdminService.listSchoolUsers(req.user!.schoolId, page, limit, search, role);
    return sendSuccess(res, result.items, 200, { total: result.total, page: result.page, limit: result.limit, pages: result.pages });
  } catch (e) { return next(e); }
};

export const blockSchoolUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await superAdminService.blockUserInSchool(req.params.userId, req.user!.id, req.user!.schoolId, ip(req));
    return sendSuccess(res, result);
  } catch (e) { return next(e); }
};

export const unblockSchoolUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await superAdminService.unblockUserInSchool(req.params.userId, req.user!.id, req.user!.schoolId, ip(req));
    return sendSuccess(res, result);
  } catch (e) { return next(e); }
};

export const listAllAgents = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const status = typeof req.query.status === 'string' ? req.query.status : undefined;
    const agents = await superAdminService.listAllAgents(req.user!.schoolId, status);
    return sendSuccess(res, agents);
  } catch (e) { return next(e); }
};

export const revokeAgent = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const note = typeof req.body.note === 'string' ? req.body.note : undefined;
    const result = await superAdminService.revokeAgent(req.params.userId, req.user!.id, req.user!.schoolId, note, ip(req));
    return sendSuccess(res, result);
  } catch (e) { return next(e); }
};

export const getSchoolAuditLogs = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const query = listAuditLogsSchema.parse(req.query);
    const result = await auditService.listLogsForSchool({
      ...query,
      schoolId: req.user!.schoolId,
      action: query.action as AuditAction | undefined,
      from: query.from ? new Date(query.from) : undefined,
      to: query.to ? new Date(query.to) : undefined,
    });
    return sendSuccess(res, result.items, 200, { total: result.total, page: result.page, limit: result.limit });
  } catch (e) { return next(e); }
};

export const getSchoolFaculties = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const faculties = await superAdminService.getSchoolFaculties(req.user!.schoolId);
    return sendSuccess(res, faculties);
  } catch (e) { return next(e); }
};

export const getSchoolDepartments = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const facultyId = typeof req.query.facultyId === 'string' ? req.query.facultyId : undefined;
    const depts = await superAdminService.getSchoolDepartments(req.user!.schoolId, facultyId);
    return sendSuccess(res, depts);
  } catch (e) { return next(e); }
};

export const listSchoolFaqs = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const faqs = await superAdminService.listFaqs(req.user!.schoolId);
    return sendSuccess(res, faqs);
  } catch (e) { return next(e); }
};

export const createSchoolFaq = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { question, answer, category, order } = req.body;
    if (!question || !answer) throw new AppError('question and answer are required', 400);
    const faq = await superAdminService.createFaq(req.user!.schoolId, { question, answer, category, order });
    return sendSuccess(res, faq, 201);
  } catch (e) { return next(e); }
};

export const updateSchoolFaq = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const faq = await superAdminService.updateFaq(req.params.faqId, req.user!.schoolId, req.body);
    return sendSuccess(res, faq);
  } catch (e) { return next(e); }
};

export const deleteSchoolFaq = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await superAdminService.deleteFaq(req.params.faqId, req.user!.schoolId);
    return sendSuccess(res, result);
  } catch (e) { return next(e); }
};

// ── Campus map admin ────────────────────────────────────────

export const listMapFeatures = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { bbox, category, limit } = listMapFeaturesQuerySchema.parse(req.query);
    const parsedBbox = bbox ? parseBboxParam(bbox) : undefined;
    const result = await campusMapService.listFeatures(req.params.schoolId, {
      bbox    : parsedBbox,
      category,
      limit,
    });
    return sendSuccess(res, result);
  } catch (e) { return next(e); }
};

export const listMapEntrances = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { featureId } = listMapEntrancesQuerySchema.parse(req.query);
    const result = await campusMapService.listEntrances(req.params.schoolId, featureId);
    return sendSuccess(res, result);
  } catch (e) { return next(e); }
};

export const upsertMapFeature = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const input = upsertMapFeatureSchema.parse(req.body);
    const feature = await campusMapService.upsertFeature(req.params.schoolId, {
      ...input,
      geometry: JSON.stringify(input.geometry),
    });
    return sendSuccess(res, feature);
  } catch (e) { return next(e); }
};

export const deleteMapFeature = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await campusMapService.deleteFeature(req.params.schoolId, req.params.featureId);
    return sendSuccess(res, { deleted: true });
  } catch (e) { return next(e); }
};

export const upsertMapEntrance = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const input = upsertEntranceSchema.parse(req.body);
    const entrance = await campusMapService.upsertEntrance(req.params.schoolId, {
      ...input,
      geometry: JSON.stringify(input.geometry),
    });
    return sendSuccess(res, entrance);
  } catch (e) { return next(e); }
};

export const deleteMapEntrance = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await campusMapService.deleteEntrance(req.params.schoolId, req.params.entranceId);
    return sendSuccess(res, { deleted: true });
  } catch (e) { return next(e); }
};

export const importMapGeoJson = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const body = importMapGeoJsonSchema.parse(req.body);
    const collection = { type: 'FeatureCollection' as const, features: body.features };
    const result = await campusGeojsonImportService.importFeaturesFromString({
      body: JSON.stringify(collection),
      schoolId: req.params.schoolId,
      dryRun: req.query.dryRun === 'true',
    });
    return sendSuccess(res, result);
  } catch (e) { return next(e); }
};

export const uploadMapFeatureImage = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.file) throw new AppError('Image file is required', 400);
    const result = await campusMapService.uploadFeatureImage(
      req.params.schoolId,
      req.params.featureId,
      req.file.buffer,
      req.file.originalname,
      req.file.mimetype,
    );
    return sendSuccess(res, result, 201);
  } catch (e) { return next(e); }
};

export const deleteMapFeatureImage = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { imageUrl } = deleteMapFeatureImageSchema.parse(req.body);
    if (!imageUrl) throw new AppError('imageUrl is required', 400);
    const result = await campusMapService.deleteFeatureImage(
      req.params.schoolId,
      req.params.featureId,
      imageUrl,
    );
    return sendSuccess(res, result);
  } catch (e) { return next(e); }
};
