import type { RequestHandler } from 'express';
import { aiService } from '@/modules/ai/ai.service.js';
import { summarizeSchema } from '@/modules/ai/ai.validators.js';
import { sendSuccess } from '@/utils/response.js';

export const requestSummary: RequestHandler = async (req, res, next) => {
  try {
    const { materialId } = summarizeSchema.parse(req.body);
    const result = await aiService.requestSummary(materialId, req.user!.id);
    sendSuccess(res, result, result.cached ? 200 : 202);
  } catch (error) {
    next(error);
  }
};

export const getSummary: RequestHandler = async (req, res, next) => {
  try {
    const summary = await aiService.getSummary(req.params.materialId);
    sendSuccess(res, summary);
  } catch (error) {
    next(error);
  }
};

export const getUserSummaries: RequestHandler = async (req, res, next) => {
  try {
    const summaries = await aiService.getUserSummaries(req.user!.id);
    sendSuccess(res, summaries);
  } catch (error) {
    next(error);
  }
};
