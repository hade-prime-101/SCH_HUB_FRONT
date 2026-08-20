import { Router } from 'express';
import { authenticate } from '@/middleware/authenticate.js';
import * as controller from './planner.controller.js';

export const plannerRoutes = Router();

plannerRoutes.use(authenticate);

// GET /planner/today
plannerRoutes.get('/today', controller.getToday);

// GET /planner/weekly?weekOffset=0
plannerRoutes.get('/weekly', controller.getWeekly);
