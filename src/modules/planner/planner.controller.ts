import type { NextFunction, Request, Response } from 'express';
import { sendSuccess } from '@/utils/response.js';
import { plannerService } from './planner.service.js';

// GET /planner/today
export const getToday = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await plannerService.getToday(req.user!);
    return sendSuccess(res, data);
  } catch (e) { return next(e); }
};

// GET /planner/weekly?weekOffset=0
export const getWeekly = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const weekOffset = Math.max(-52, Math.min(52, Number(req.query.weekOffset) || 0));
    const data = await plannerService.getWeekly(req.user!, weekOffset);
    return sendSuccess(res, data);
  } catch (e) { return next(e); }
};
