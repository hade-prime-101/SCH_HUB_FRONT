import type { Request, Response, NextFunction } from 'express';
import { remindersService } from './reminders.service.js';
import { sendSuccess } from '@/utils/response.js';
import {
  createReminderSchema,
  updateReminderSchema,
  listRemindersSchema,
} from './reminders.validators.js';

export const listReminders = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const query = listRemindersSchema.parse(req.query);
    const result = await remindersService.list(req.user!.id, query);
    return sendSuccess(res, result.items, 200, {
      total: result.total,
      page: result.page,
      limit: result.limit,
    });
  } catch (e) { return next(e); }
};

export const createReminder = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const input = createReminderSchema.parse(req.body);
    const reminder = await remindersService.create(req.user!.id, input);
    return sendSuccess(res, reminder, 201);
  } catch (e) { return next(e); }
};

export const updateReminder = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const input = updateReminderSchema.parse(req.body);
    const reminder = await remindersService.update(req.params.id, req.user!.id, input);
    return sendSuccess(res, reminder);
  } catch (e) { return next(e); }
};

export const deleteReminder = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await remindersService.delete(req.params.id, req.user!.id);
    return sendSuccess(res, result);
  } catch (e) { return next(e); }
};

export const completeReminder = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const reminder = await remindersService.complete(req.params.id, req.user!.id);
    return sendSuccess(res, reminder);
  } catch (e) { return next(e); }
};
