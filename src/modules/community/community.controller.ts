import type { NextFunction, Request, Response } from 'express';
import { communityService } from './community.service.js';
import { sendPaginated, sendSuccess } from '@/utils/response.js';
import {
  createPostSchema, listPostsSchema, pinPostSchema,
  createQuestionSchema, listQuestionsSchema, createAnswerSchema,
  createCommentSchema, reactSchema, reportSchema,
  registerMentorSchema, listMentorsSchema, createFaqSchema,
} from './community.validators.js';

const h = (fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>) =>
  (req: Request, res: Response, next: NextFunction) => fn(req, res, next).catch(next);

// ── Posts ─────────────────────────────────────────────────────────────────

export const listPosts = h(async (req, res) => {
  const result = await communityService.listPosts(listPostsSchema.parse(req.query), req.user!);
  sendPaginated(res, result.data, result.page, result.total, result.limit);
});

export const getPost = h(async (req, res) => {
  sendSuccess(res, await communityService.getPost(req.params.id));
});

export const createPost = h(async (req, res) => {
  sendSuccess(res, await communityService.createPost(createPostSchema.parse(req.body), req.user!), 201);
});

export const createNoticePost = h(async (req, res) => {
  // Force section=NOTICE_BOARD regardless of what the caller sends
  const input = createPostSchema.parse({ ...req.body, section: 'NOTICE_BOARD' });
  sendSuccess(res, await communityService.createPost(input, req.user!), 201);
});

export const deletePost = h(async (req, res) => {
  sendSuccess(res, await communityService.deletePost(req.params.id, req.user!));
});

export const pinPost = h(async (req, res) => {
  const { isPinned } = pinPostSchema.parse(req.body);
  sendSuccess(res, await communityService.pinPost(req.params.id, isPinned));
});

export const upvotePost = h(async (req, res) => {
  sendSuccess(res, await communityService.upvotePost(req.params.id));
});

// ── Comments ──────────────────────────────────────────────────────────────

export const createComment = h(async (req, res) => {
  sendSuccess(res, await communityService.createComment(req.params.id, createCommentSchema.parse(req.body), req.user!.id), 201);
});

export const upvoteComment = h(async (req, res) => {
  sendSuccess(res, await communityService.upvoteComment(req.params.commentId));
});

// ── Questions ─────────────────────────────────────────────────────────────

export const listQuestions = h(async (req, res) => {
  const result = await communityService.listQuestions(listQuestionsSchema.parse(req.query), req.user!);
  sendPaginated(res, result.data, result.page, result.total, result.limit);
});

export const getQuestion = h(async (req, res) => {
  sendSuccess(res, await communityService.getQuestion(req.params.id));
});

export const createQuestion = h(async (req, res) => {
  sendSuccess(res, await communityService.createQuestion(createQuestionSchema.parse(req.body), req.user!), 201);
});

export const deleteQuestion = h(async (req, res) => {
  sendSuccess(res, await communityService.deleteQuestion(req.params.id, req.user!));
});

export const upvoteQuestion = h(async (req, res) => {
  sendSuccess(res, await communityService.upvoteQuestion(req.params.id));
});

export const createAnswer = h(async (req, res) => {
  sendSuccess(res, await communityService.createAnswer(req.params.id, createAnswerSchema.parse(req.body), req.user!), 201);
});

export const acceptAnswer = h(async (req, res) => {
  sendSuccess(res, await communityService.acceptAnswer(req.params.id, req.params.answerId, req.user!.id));
});

export const pinAnswer = h(async (req, res) => {
  sendSuccess(res, await communityService.pinAnswer(req.params.id, req.params.answerId, req.user!.id, req.user!.role));
});

export const upvoteAnswer = h(async (req, res) => {
  sendSuccess(res, await communityService.upvoteAnswer(req.params.answerId));
});

export const deleteAnswer = h(async (req, res) => {
  sendSuccess(res, await communityService.deleteAnswer(req.params.answerId, req.user!));
});

// ── Mentors ───────────────────────────────────────────────────────────────

export const registerMentor = h(async (req, res) => {
  sendSuccess(res, await communityService.registerMentor(registerMentorSchema.parse(req.body), req.user!));
});

export const listMentors = h(async (req, res) => {
  sendSuccess(res, await communityService.listMentors(listMentorsSchema.parse(req.query), req.user!));
});

export const getMyMentorships = h(async (req, res) => {
  sendSuccess(res, await communityService.getMyMentorships(req.user!.id));
});

// ── Freshers FAQ ──────────────────────────────────────────────────────────

export const listFaqs = h(async (req, res) => {
  sendSuccess(res, await communityService.listFaqs(req.user!.schoolId, req.query.category as string | undefined));
});

export const createFaq = h(async (req, res) => {
  sendSuccess(res, await communityService.createFaq(createFaqSchema.parse(req.body), req.user!.schoolId), 201);
});

export const deleteFaq = h(async (req, res) => {
  sendSuccess(res, await communityService.deleteFaq(req.params.id));
});

// ── Reactions & Reports ───────────────────────────────────────────────────

export const react = h(async (req, res) => {
  sendSuccess(res, await communityService.react(req.params.id, reactSchema.parse(req.body), req.user!.id));
});

export const report = h(async (req, res) => {
  sendSuccess(res, await communityService.report(req.params.id, reportSchema.parse(req.body), req.user!.id));
});

export const listReports = h(async (req, res) => {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(50, Number(req.query.limit) || 20);
  const isResolved = req.query.resolved === 'true';
  sendSuccess(res, await communityService.listReports(req.user!.schoolId, isResolved, page, limit));
});

export const resolveReport = h(async (req, res) => {
  sendSuccess(res, await communityService.resolveReport(req.params.reportId));
});
