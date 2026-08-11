import { Router } from 'express';
import { authenticate } from '@/middleware/authenticate.js';
import { getSummary, getUserSummaries, requestSummary } from '@/modules/ai/ai.controller.js';

export const aiRoutes = Router();

aiRoutes.use(authenticate);

aiRoutes.post('/summarize', requestSummary);
aiRoutes.get('/summaries', getUserSummaries);
aiRoutes.get('/summaries/:materialId', getSummary);
