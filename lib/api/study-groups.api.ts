// lib/study-groups.api.ts

import { apiGet, apiPost, apiPatch, apiDelete } from '@/lib/api';
import type {
  StudyGroup,
  GroupMember,
  GroupInvite,
  GroupMessage,
  Challenge,
  QuizLeaderboardEntry,
  GroupQA,
  CreateGroupPayload,
  UpdateGroupPayload,
  UpdateMemberRolePayload,
  CreateInvitePayload,
  SendMessagePayload,
  ShareSummaryPayload,
  GroupQAPayload,
  CreateChallengePayload,
} from '@/types/study-groups';

// ─── Core ────────────────────────────────────────────────────
export const listGroups = (params?: { page?: number; limit?: number; search?: string }) =>
  apiGet<{ data: StudyGroup[]; page: number; total: number; limit: number }>('/study-groups', params as any);

export const listAllGroups = (page = 1, limit = 50) =>
  apiGet<{ data: StudyGroup[]; page: number; total: number; limit: number }>('/study-groups/all', { page, limit });

export const getGroup = (id: string) =>
  apiGet<StudyGroup>(`/study-groups/${id}`);

export const createGroup = (payload: CreateGroupPayload) =>
  apiPost<StudyGroup>('/study-groups', payload);

export const updateGroup = (id: string, payload: UpdateGroupPayload) =>
  apiPatch<StudyGroup>(`/study-groups/${id}`, payload);

export const deleteGroup = (id: string) =>
  apiDelete<{ message: string }>(`/study-groups/${id}`);

// ─── Join / Leave ────────────────────────────────────────────
export const joinGroup = (id: string) =>
  apiPost<{ success: boolean }>(`/study-groups/${id}/join`);

export const leaveGroup = (id: string) =>
  apiPost<{ success: boolean }>(`/study-groups/${id}/leave`);

// ─── Member management ───────────────────────────────────────
export const updateMemberRole = (groupId: string, userId: string, payload: UpdateMemberRolePayload) =>
  apiPatch<GroupMember>(`/study-groups/${groupId}/members/${userId}/role`, payload);

export const kickMember = (groupId: string, userId: string) =>
  apiDelete<{ message: string }>(`/study-groups/${groupId}/members/${userId}`);

// ─── Invites ─────────────────────────────────────────────────
export const createInvite = (groupId: string, payload: CreateInvitePayload) =>
  apiPost<GroupInvite>(`/study-groups/${groupId}/invites`, payload);

export const acceptInvite = (token: string) =>
  apiPost<{ success: boolean }>(`/study-groups/invites/${token}/accept`);

export const listInvites = (groupId: string) =>
  apiGet<GroupInvite[]>(`/study-groups/${groupId}/invites`);

export const revokeInvite = (inviteId: string) =>
  apiDelete<{ message: string }>(`/study-groups/invites/${inviteId}`);

// ─── Messages ────────────────────────────────────────────────
export const getMessages = (groupId: string, params?: { before?: string; limit?: number }) =>
  apiGet<GroupMessage[]>(`/study-groups/${groupId}/messages`, params as any);

export const sendMessage = (groupId: string, payload: SendMessagePayload) =>
  apiPost<GroupMessage>(`/study-groups/${groupId}/messages`, payload);

// ─── AI features ─────────────────────────────────────────────
export const getQuizLeaderboard = (groupId: string, quizId: string) =>
  apiGet<QuizLeaderboardEntry[]>(`/study-groups/${groupId}/quizzes/${quizId}/leaderboard`);

export const shareSummary = (groupId: string, payload: ShareSummaryPayload) =>
  apiPost<{ success: boolean }>(`/study-groups/${groupId}/share-summary`, payload);

export const askGroupQuestion = (groupId: string, payload: GroupQAPayload) =>
  apiPost<GroupQA>(`/study-groups/${groupId}/ask`, payload);

// ─── Challenges ──────────────────────────────────────────────
export const createChallenge = (groupId: string, payload: CreateChallengePayload) =>
  apiPost<Challenge>(`/study-groups/${groupId}/challenges`, payload);

export const acceptChallenge = (groupId: string, challengeId: string) =>
  apiPost<Challenge>(`/study-groups/${groupId}/challenges/${challengeId}/accept`);

export const declineChallenge = (groupId: string, challengeId: string) =>
  apiPost<Challenge>(`/study-groups/${groupId}/challenges/${challengeId}/decline`);

export const getChallengeResult = (groupId: string, challengeId: string) =>
  apiGet<{ winnerId: string; score: number }>(`/study-groups/${groupId}/challenges/${challengeId}/result`);

export const listChallenges = (groupId: string) =>
  apiGet<Challenge[]>(`/study-groups/${groupId}/challenges`);

export const listMembers = (groupId: string) =>
  apiGet<GroupMember[]>(`/study-groups/${groupId}/members`);