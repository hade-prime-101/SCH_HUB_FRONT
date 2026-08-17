// types/study-groups.ts

export interface StudyGroup {
  id: string;
  name: string;
  type: GroupType;
  departmentId: string;
  schoolId: string;
  createdBy: string;
  isPrivate: boolean;
  courseTag?: string;
  memberCount: number;
  createdAt: string;
}

export interface GroupMember {
  userId: string;
  name: string;
  avatar?: string;
  role: 'ADMIN' | 'MODERATOR' | 'MEMBER';
}

export interface GroupInvite {
  id: string;
  token: string;
  groupId: string;
  createdBy: string;
  expiresAt?: string;
}

export interface GroupMessage {
  id: string;
  groupId: string;
  senderId: string;
  senderName: string;
  content: string;
  createdAt: string;
}

export interface Challenge {
  id: string;
  groupId: string;
  title: string;
  description?: string;
  createdBy: string;
  status: 'PENDING' | 'ACCEPTED' | 'DECLINED' | 'COMPLETED';
  targetUserId: string;
  createdAt: string;
}

export interface QuizLeaderboardEntry {
  userId: string;
  name: string;
  score: number;
}

export interface GroupQA {
  id: string;
  groupId: string;
  userId: string;
  question: string;
  answer?: string;
}

// ─── Payloads ─────────────────────────────────────────────────

export type GroupType = 'EXAM_PREP' | 'ASSIGNMENT' | 'TUTORIAL' | 'PROJECT' | 'GENERAL';

export interface CreateGroupPayload {
  name: string;
  type: GroupType;
  departmentId: string;
  isPrivate?: boolean;
  courseTag?: string;
}

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface UpdateGroupPayload extends Partial<CreateGroupPayload> {}

export interface UpdateMemberRolePayload {
  role: 'ADMIN' | 'MODERATOR' | 'MEMBER';
}

export interface CreateInvitePayload {
  email?: string;
  userId?: string;
  expiresAt?: string;
}

export interface SendMessagePayload {
  content: string;
}

export interface ShareSummaryPayload {
  summaryId: string;
}

export interface GroupQAPayload {
  question: string;
}

export interface CreateChallengePayload {
  targetUserId: string;
  title: string;
  description?: string;
}