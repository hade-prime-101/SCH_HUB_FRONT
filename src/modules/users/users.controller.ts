import type { RequestHandler } from 'express';
import { usersService } from '@/modules/users/users.service.js';
import {
  registerFcmTokenSchema,
  revokeSessionSchema,
  updateProfileSchema,
  updateSettingsSchema,
  assignRoleSchema,
  nominateCourseRepSchema,
  searchUsersSchema,
  listUsersSchema,
} from '@/modules/users/users.validators.js';
import { AppError, sendSuccess } from '@/utils/response.js';

export const getMyProfile: RequestHandler = async (req, res, next) => {
  try {
    const user = await usersService.getProfile(req.user!.id);
    sendSuccess(res, user);
  } catch (error) {
    next(error);
  }
};

export const getProfile: RequestHandler = async (req, res, next) => {
  try {
    const user = await usersService.getProfile(req.params.id);
    sendSuccess(res, user);
  } catch (error) {
    next(error);
  }
};

export const updateProfile: RequestHandler = async (req, res, next) => {
  try {
    const user = await usersService.updateProfile(req.user!.id, updateProfileSchema.parse(req.body));
    sendSuccess(res, user);
  } catch (error) {
    next(error);
  }
};

export const uploadAvatar: RequestHandler = async (req, res, next) => {
  try {
    if (!req.file) throw new AppError('No file uploaded', 400);
    const result = await usersService.uploadAvatar(
      req.user!.id,
      req.file.buffer,
      req.file.originalname,
      req.file.mimetype
    );
    sendSuccess(res, result);
  } catch (error) {
    next(error);
  }
};

export const updateSettings: RequestHandler = async (req, res, next) => {
  try {
    const settings = await usersService.updateSettings(req.user!.id, updateSettingsSchema.parse(req.body));
    sendSuccess(res, settings);
  } catch (error) {
    next(error);
  }
};

export const registerFcmToken: RequestHandler = async (req, res, next) => {
  try {
    const { fcmToken } = registerFcmTokenSchema.parse(req.body);
    const result = await usersService.registerFcmToken(req.user!.id, fcmToken);
    sendSuccess(res, result);
  } catch (error) {
    next(error);
  }
};

export const getBookmarks: RequestHandler = async (req, res, next) => {
  try {
    const bookmarks = await usersService.getBookmarks(req.user!.id);
    sendSuccess(res, bookmarks);
  } catch (error) {
    next(error);
  }
};

export const getMyMaterials: RequestHandler = async (req, res, next) => {
  try {
    const materials = await usersService.getMaterials(req.user!.id);
    sendSuccess(res, materials);
  } catch (error) {
    next(error);
  }
};

export const getUserMaterials: RequestHandler = async (req, res, next) => {
  try {
    const materials = await usersService.getMaterials(req.params.id);
    sendSuccess(res, materials);
  } catch (error) {
    next(error);
  }
};

export const getSessions: RequestHandler = async (req, res, next) => {
  try {
    const sessions = await usersService.getSessions(req.user!.id);
    sendSuccess(res, sessions);
  } catch (error) {
    next(error);
  }
};

export const revokeSession: RequestHandler = async (req, res, next) => {
  try {
    const sessionId = req.params.sessionId ?? revokeSessionSchema.parse(req.body).sessionId;
    const result = await usersService.revokeSession(req.user!.id, sessionId);
    sendSuccess(res, result);
  } catch (error) {
    next(error);
  }
};

export const revokeAllSessions: RequestHandler = async (req, res, next) => {
  try {
    const result = await usersService.revokeAllSessions(req.user!.id);
    sendSuccess(res, result);
  } catch (error) {
    next(error);
  }
};

// ── Roles ──────────────────────────────────────────────────

export const searchUsers: RequestHandler = async (req, res, next) => {
  try {
    const query = searchUsersSchema.parse(req.query);
    const result = await usersService.searchUsers(req.user!.schoolId, query);
    sendSuccess(res, result.items, 200, {
      total: result.total,
      page: result.page,
      limit: result.limit,
      totalPages: Math.ceil(result.total / result.limit),
      hasMore: result.page * result.limit < result.total,
    });
  } catch (error) { next(error); }
};

export const nominateCourseRep: RequestHandler = async (req, res, next) => {
  try {
    const { userId } = nominateCourseRepSchema.parse(req.body);
    const result = await usersService.nominateCourseRep(userId, req.user!.id);
    sendSuccess(res, result);
  } catch (error) { next(error); }
};

export const assignRole: RequestHandler = async (req, res, next) => {
  try {
    const { userId, role } = assignRoleSchema.parse(req.body);
    const result = await usersService.assignRole(userId, role, req.user!.id);
    sendSuccess(res, result);
  } catch (error) { next(error); }
};

export const listUsers: RequestHandler = async (req, res, next) => {
  try {
    const query = listUsersSchema.parse(req.query);
    const result = await usersService.listUsers(req.user!.schoolId, query);
    sendSuccess(res, result.items, 200, {
      total: result.total,
      page: result.page,
      limit: result.limit,
      totalPages: Math.ceil(result.total / result.limit),
      hasMore: result.page * result.limit < result.total,
    });
  } catch (error) { next(error); }
};
