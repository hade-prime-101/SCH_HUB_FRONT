import type { RequestHandler } from 'express';
import { personalStudyService } from '@/modules/ai/personal-study.service.js';
import {
  askPersonalSchema,
  createSessionSchema,
  generatePersonalQuizSchema,
} from '@/modules/ai/personal-study.validators.js';
import { AppError, sendSuccess } from '@/utils/response.js';
import { z } from 'zod';

const submitAnswersSchema = z.object({
  answers: z.array(
    z.object({
      questionId: z.string().min(1),
      selected: z.number().int().min(0),
    }),
  ).min(1),
});

// ── Sessions ──────────────────────────────────────────────────

export const listSessions: RequestHandler = async (req, res, next) => {
  try {
    sendSuccess(res, await personalStudyService.listSessions(req.user!.id));
  } catch (error) { next(error); }
};

export const getSession: RequestHandler = async (req, res, next) => {
  try {
    sendSuccess(res, await personalStudyService.getSession(req.params.sessionId, req.user!.id));
  } catch (error) { next(error); }
};

export const createSession: RequestHandler = async (req, res, next) => {
  try {
    const input = createSessionSchema.parse(req.body);
    const session = await personalStudyService.createSession(input, req.user!.id, req.file);
    sendSuccess(res, session, 201);
  } catch (error) { next(error); }
};

export const deleteSession: RequestHandler = async (req, res, next) => {
  try {
    sendSuccess(res, await personalStudyService.deleteSession(req.params.sessionId, req.user!.id));
  } catch (error) { next(error); }
};

// ── AI: Quiz generation ───────────────────────────────────────

export const generatePersonalQuiz: RequestHandler = async (req, res, next) => {
  try {
    const input = generatePersonalQuizSchema.parse(req.body);
    sendSuccess(res, await personalStudyService.generatePersonalQuiz(req.params.sessionId, req.user!.id, input));
  } catch (error) { next(error); }
};

export const submitPersonalQuiz: RequestHandler = async (req, res, next) => {
  try {
    const { answers } = submitAnswersSchema.parse(req.body);
    sendSuccess(res, await personalStudyService.submitQuizAnswers(req.params.sessionId, req.user!.id, answers));
  } catch (error) { next(error); }
};

// ── AI: Ask question ──────────────────────────────────────────

export const askQuestion: RequestHandler = async (req, res, next) => {
  try {
    const input = askPersonalSchema.parse(req.body);
    sendSuccess(res, await personalStudyService.askQuestion(req.params.sessionId, req.user!.id, input));
  } catch (error) { next(error); }
};
