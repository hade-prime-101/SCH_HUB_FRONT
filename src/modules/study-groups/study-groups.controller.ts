import type { NextFunction, Request, Response } from 'express';
import { studyGroupsService } from './study-groups.service.js';
import { sendPaginated, sendSuccess } from '@/utils/response.js';
import {
  createGroupSchema,
  createChallengeSchema,
  createInviteSchema,
  groupQaSchema,
  listGroupsSchema,
  listMessagesSchema,
  sendMessageSchema,
  shareSummarySchema,
  updateGroupSchema,
  updateMemberRoleSchema,
} from './study-groups.validators.js';

const h = (fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>) =>
  (req: Request, res: Response, next: NextFunction) => fn(req, res, next).catch(next);

// ── Core ──────────────────────────────────────────────────────────────────

export const listGroups = h(async (req, res) => {
  const result = await studyGroupsService.listGroups(listGroupsSchema.parse(req.query), req.user!);
  sendPaginated(res, result.data, result.page, result.total, result.limit);
});

export const listAllGroups = h(async (req, res) => {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(100, Number(req.query.limit) || 50);
  const result = await studyGroupsService.listAllGroups(req.user!.schoolId, page, limit);
  sendPaginated(res, result.data, result.page, result.total, result.limit);
});

export const getGroup = h(async (req, res) => {
  sendSuccess(res, await studyGroupsService.getGroup(req.params.id));
});

export const createGroup = h(async (req, res) => {
  sendSuccess(res, await studyGroupsService.createGroup(createGroupSchema.parse(req.body), req.user!), 201);
});

export const updateGroup = h(async (req, res) => {
  sendSuccess(res, await studyGroupsService.updateGroup(req.params.id, updateGroupSchema.parse(req.body), req.user!.id, req.user!.role));
});

export const deleteGroup = h(async (req, res) => {
  sendSuccess(res, await studyGroupsService.deleteGroup(req.params.id, req.user!, req.ip));
});

// ── Join / Leave ──────────────────────────────────────────────────────────

export const joinGroup = h(async (req, res) => {
  sendSuccess(res, await studyGroupsService.joinGroup(req.params.id, req.user!.id));
});

export const leaveGroup = h(async (req, res) => {
  sendSuccess(res, await studyGroupsService.leaveGroup(req.params.id, req.user!.id));
});

// ── Member management ─────────────────────────────────────────────────────

export const updateMemberRole = h(async (req, res) => {
  sendSuccess(res, await studyGroupsService.updateMemberRole(
    req.params.id, req.params.userId,
    updateMemberRoleSchema.parse(req.body),
    req.user!.id, req.user!.role, req.ip,
  ));
});

export const kickMember = h(async (req, res) => {
  sendSuccess(res, await studyGroupsService.kickMember(req.params.id, req.params.userId, req.user!.id, req.user!.role, req.ip));
});

// ── Invites ───────────────────────────────────────────────────────────────

export const createInvite = h(async (req, res) => {
  sendSuccess(res, await studyGroupsService.createInvite(req.params.id, req.user!.id, req.user!.role, createInviteSchema.parse(req.body)), 201);
});

export const acceptInvite = h(async (req, res) => {
  sendSuccess(res, await studyGroupsService.acceptInvite(req.params.token, req.user!.id));
});

export const listInvites = h(async (req, res) => {
  sendSuccess(res, await studyGroupsService.listInvites(req.params.id, req.user!.id, req.user!.role));
});

export const revokeInvite = h(async (req, res) => {
  sendSuccess(res, await studyGroupsService.revokeInvite(req.params.inviteId, req.user!.id, req.user!.role));
});

// ── Messages ──────────────────────────────────────────────────────────────

export const getMessages = h(async (req, res) => {
  sendSuccess(res, await studyGroupsService.getMessages(req.params.id, req.user!.id, listMessagesSchema.parse(req.query)));
});

export const sendMessage = h(async (req, res) => {
  sendSuccess(res, await studyGroupsService.sendMessage(req.params.id, req.user!.id, sendMessageSchema.parse(req.body)), 201);
});

// ── AI features ───────────────────────────────────────────────────────────

export const getQuizLeaderboard = h(async (req, res) => {
  sendSuccess(res, await studyGroupsService.getQuizLeaderboard(req.params.quizId, req.params.id, req.user!.id));
});

export const shareSummary = h(async (req, res) => {
  sendSuccess(res, await studyGroupsService.shareSummaryToGroup(req.params.id, req.user!.id, shareSummarySchema.parse(req.body)));
});

export const askQuestion = h(async (req, res) => {
  sendSuccess(res, await studyGroupsService.askGroupQuestion(req.params.id, req.user!.id, groupQaSchema.parse(req.body)));
});

// ── Challenges ────────────────────────────────────────────────────────────

export const createChallenge = h(async (req, res) => {
  sendSuccess(res, await studyGroupsService.createChallenge(req.params.id, req.user!.id, req.user!.role, createChallengeSchema.parse(req.body), req.ip), 201);
});

export const acceptChallenge = h(async (req, res) => {
  sendSuccess(res, await studyGroupsService.acceptChallenge(req.params.challengeId, req.params.id, req.user!.id, req.user!.role));
});

export const declineChallenge = h(async (req, res) => {
  sendSuccess(res, await studyGroupsService.declineChallenge(req.params.challengeId, req.params.id, req.user!.id, req.user!.role));
});

export const getChallengeResult = h(async (req, res) => {
  sendSuccess(res, await studyGroupsService.getChallengeResult(req.params.challengeId, req.params.id, req.user!.id, req.ip));
});

export const listChallenges = h(async (req, res) => {
  sendSuccess(res, await studyGroupsService.listChallenges(req.params.id, req.user!.id));
});

export const listMembers = h(async (req, res) => {
  sendSuccess(res, await studyGroupsService.listMembers(req.params.id, req.user!.id));
});