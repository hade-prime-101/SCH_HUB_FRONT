import type { Request, Response, NextFunction } from 'express';
import { notificationsService } from './notifications.service.js';
import { sendSuccess } from '@/utils/response.js';
import { listNotificationsSchema, updateSettingsSchema } from './notifications.validators.js';

export const listNotifications = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { page, limit } = listNotificationsSchema.parse(req.query);
    const result = await notificationsService.list(req.user!.id, page, limit);
    return sendSuccess(res, result.items, 200, {
      total: result.total,
      unreadCount: result.unreadCount,
      page: result.page,
      limit: result.limit,
    });
  } catch (e) { return next(e); }
};

export const markRead = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const notif = await notificationsService.markRead(req.params.id, req.user!.id);
    return sendSuccess(res, notif);
  } catch (e) { return next(e); }
};

export const markAllRead = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await notificationsService.markAllRead(req.user!.id);
    return sendSuccess(res, result);
  } catch (e) { return next(e); }
};

export const deleteNotification = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await notificationsService.delete(req.params.id, req.user!.id);
    return sendSuccess(res, result);
  } catch (e) { return next(e); }
};

export const getSettings = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const settings = await notificationsService.getSettings(req.user!.id);
    return sendSuccess(res, settings);
  } catch (e) { return next(e); }
};

export const updateSettings = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const input = updateSettingsSchema.parse(req.body);
    const settings = await notificationsService.updateSettings(req.user!.id, input);
    return sendSuccess(res, settings);
  } catch (e) { return next(e); }
};
