import { Router } from 'express';
import { authenticate } from '@/middleware/authenticate.js';
import { authorize } from '@/middleware/authorize.js';
import * as c from './study-groups.controller.js';

export const studyGroupRoutes = Router();
studyGroupRoutes.use(authenticate);

// ── Core ──────────────────────────────────────────────────────────────────
studyGroupRoutes.get('/', c.listGroups);
studyGroupRoutes.get('/all', authorize('SCHOOL_ADMIN', 'SUPER_ADMIN'), c.listAllGroups);
studyGroupRoutes.post('/', c.createGroup);
studyGroupRoutes.get('/:id', c.getGroup);
studyGroupRoutes.patch('/:id', c.updateGroup);
studyGroupRoutes.delete('/:id', c.deleteGroup);

// ── Join / Leave ──────────────────────────────────────────────────────────
studyGroupRoutes.post('/:id/join', c.joinGroup);
studyGroupRoutes.delete('/:id/leave', c.leaveGroup);

// ── Member management ─────────────────────────────────────────────────────
studyGroupRoutes.get('/:id/members', c.listMembers);
studyGroupRoutes.patch('/:id/members/:userId/role', c.updateMemberRole);
studyGroupRoutes.delete('/:id/members/:userId', c.kickMember);

// ── Invites ───────────────────────────────────────────────────────────────
studyGroupRoutes.post('/:id/invites', c.createInvite);
studyGroupRoutes.get('/:id/invites', c.listInvites);
studyGroupRoutes.delete('/:id/invites/:inviteId', c.revokeInvite);
studyGroupRoutes.post('/join/:token', c.acceptInvite);        // public-ish — just needs auth

// ── Messages ──────────────────────────────────────────────────────────────
studyGroupRoutes.get('/:id/messages', c.getMessages);
studyGroupRoutes.post('/:id/messages', c.sendMessage);

// ── AI features ───────────────────────────────────────────────────────────
studyGroupRoutes.get('/:id/quizzes/:quizId/leaderboard', c.getQuizLeaderboard);
studyGroupRoutes.post('/:id/ai/summary', c.shareSummary);
studyGroupRoutes.post('/:id/ai/ask', c.askQuestion);

// ── Challenges ────────────────────────────────────────────────────────────
studyGroupRoutes.get('/:id/challenges', c.listChallenges);
studyGroupRoutes.post('/:id/challenges', c.createChallenge);
studyGroupRoutes.patch('/:id/challenges/:challengeId/accept', c.acceptChallenge);
studyGroupRoutes.patch('/:id/challenges/:challengeId/decline', c.declineChallenge);
studyGroupRoutes.get('/:id/challenges/:challengeId/result', c.getChallengeResult);
