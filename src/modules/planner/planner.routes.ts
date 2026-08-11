import { Router } from 'express';
import type { Request, Response, NextFunction } from 'express';
import { authenticate } from '@/middleware/authenticate.js';
import { plannerService } from './planner.service.js';
import { sendSuccess } from '@/utils/response.js';

export const plannerRoutes = Router();

plannerRoutes.use(authenticate);

// GET /planner/today
plannerRoutes.get('/today', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await plannerService.getToday(req.user!);
    return sendSuccess(res, data);
  } catch (e) { return next(e); }
});

// GET /planner/weekly?weekOffset=0
plannerRoutes.get('/weekly', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const weekOffset = Math.max(-52, Math.min(52, Number(req.query.weekOffset) || 0));
    const data = await plannerService.getWeekly(req.user!, weekOffset);
    return sendSuccess(res, data);
  } catch (e) { return next(e); }
});
