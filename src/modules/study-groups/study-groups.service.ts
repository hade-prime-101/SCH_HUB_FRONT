import { prisma } from '@/config/prisma.js';
import { AppError } from '@/utils/response.js';
import { groqChat } from '@/config/groq.js';
import { auditService } from '@/modules/super-admin/audit.service.js';
import { sendAndPersistNotification } from '@/modules/notifications/notifications.service.js';
import { GROUP_QA_SYSTEM, groupQaPrompt } from '@/modules/ai/prompts/group-qa.prompt.js';
import type { z } from 'zod';
import type {
  createGroupSchema,
  createChallengeSchema,
  createInviteSchema,
  listGroupsSchema,
  listMessagesSchema,
  sendMessageSchema,
  updateGroupSchema,
  updateMemberRoleSchema,
  groupQaSchema,
  shareSummarySchema,
} from './study-groups.validators.js';

type CreateGroupInput    = z.infer<typeof createGroupSchema>;
type UpdateGroupInput    = z.infer<typeof updateGroupSchema>;
type ListGroupsInput     = z.infer<typeof listGroupsSchema>;
type SendMessageInput    = z.infer<typeof sendMessageSchema>;
type ListMessagesInput   = z.infer<typeof listMessagesSchema>;
type CreateInviteInput   = z.infer<typeof createInviteSchema>;
type UpdateRoleInput     = z.infer<typeof updateMemberRoleSchema>;
type GroupQaInput        = z.infer<typeof groupQaSchema>;
type ShareSummaryInput   = z.infer<typeof shareSummarySchema>;
type CreateChallengeInput = z.infer<typeof createChallengeSchema>;

const GROUP_SELECT = {
  id: true, name: true, description: true, type: true, isPrivate: true,
  courseTag: true, memberCount: true, isActive: true, createdAt: true, updatedAt: true,
  department: { select: { id: true, name: true, shortCode: true } },
  createdBy: { select: { id: true, fullName: true, profilePictureUrl: true } },
};

// ── Guard helpers ──────────────────────────────────────────────────────────

async function assertMember(groupId: string, userId: string) {
  const member = await prisma.studyGroupMember.findUnique({
    where: { groupId_userId: { groupId, userId } },
  });
  if (!member) throw new AppError('You are not a member of this group', 403);
  return member;
}

async function assertAdmin(groupId: string, userId: string, userRole?: string) {
  const isSystemAdmin = userRole === 'SCHOOL_ADMIN' || userRole === 'SUPER_ADMIN';
  if (isSystemAdmin) return;
  const member = await prisma.studyGroupMember.findUnique({
    where: { groupId_userId: { groupId, userId } },
  });
  if (!member || member.role !== 'ADMIN') throw new AppError('Only group admins can do this', 403);
}

export const studyGroupsService = {

  // ── Core CRUD ──────────────────────────────────────────────────────────

  async listGroups(input: ListGroupsInput, user: { departmentId: string; schoolId: string }) {
    const { type, courseTag, departmentId, discover, page, limit } = input;
    const skip = (page - 1) * limit;

    const where = {
      isActive: true, isPrivate: false,
      // discover=true → school-wide; default → caller's department (or explicit departmentId filter)
      ...(discover
        ? { department: { faculty: { schoolId: user.schoolId } } }
        : { departmentId: departmentId ?? user.departmentId }),
      ...(type && { type }),
      ...(courseTag && { courseTag: { contains: courseTag, mode: 'insensitive' as const } }),
    };
    const [data, total] = await Promise.all([
      prisma.studyGroup.findMany({ where, select: GROUP_SELECT, skip, take: limit, orderBy: { memberCount: 'desc' } }),
      prisma.studyGroup.count({ where }),
    ]);
    return { data, total, page, limit };
  },

  async getGroup(id: string) {
    const group = await prisma.studyGroup.findUnique({
      where: { id, isActive: true },
      select: {
        ...GROUP_SELECT,
        members: {
          select: {
            role: true, joinedAt: true,
            user: { select: { id: true, fullName: true, profilePictureUrl: true, level: true } },
          },
          orderBy: { joinedAt: 'asc' },
        },
      },
    });
    if (!group) throw new AppError('Study group not found', 404);
    return group;
  },

  async createGroup(input: CreateGroupInput, user: { id: string; departmentId: string }) {
    const deptId = input.departmentId ?? user.departmentId;
    return prisma.studyGroup.create({
      data: {
        name: input.name, description: input.description,
        type: input.type as any, isPrivate: input.isPrivate,
        courseTag: input.courseTag, departmentId: deptId, createdById: user.id,
        members: { create: { userId: user.id, role: 'ADMIN' } },
      },
      select: GROUP_SELECT,
    });
  },

  async updateGroup(id: string, input: UpdateGroupInput, userId: string, userRole: string) {
    await assertAdmin(id, userId, userRole);
    return prisma.studyGroup.update({
      where: { id },
      data: {
        ...(input.name !== undefined && { name: input.name }),
        ...(input.description !== undefined && { description: input.description }),
        ...(input.courseTag !== undefined && { courseTag: input.courseTag }),
        ...(input.isPrivate !== undefined && { isPrivate: input.isPrivate }),
      },
      select: GROUP_SELECT,
    });
  },

  async deleteGroup(id: string, user: { id: string; role: string }, ipAddress?: string) {
    const group = await prisma.studyGroup.findUnique({ where: { id }, select: { createdById: true, name: true } });
    if (!group) throw new AppError('Study group not found', 404);

    const isAdmin = user.role === 'SCHOOL_ADMIN' || user.role === 'SUPER_ADMIN';
    if (!isAdmin && group.createdById !== user.id) throw new AppError('Not authorized', 403);

    await prisma.studyGroup.update({ where: { id }, data: { isActive: false } });
    await auditService.log({ action: 'STUDY_GROUP_DELETED', performedById: user.id, targetId: id, targetType: 'StudyGroup', meta: { name: group.name }, ipAddress }).catch(() => null);
    return { deleted: true };
  },

  async listAllGroups(schoolId: string, page: number, limit: number) {
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      prisma.studyGroup.findMany({
        where: { department: { faculty: { schoolId } } },
        select: { ...GROUP_SELECT, _count: { select: { members: true, messages: true } } },
        skip, take: limit, orderBy: { createdAt: 'desc' },
      }),
      prisma.studyGroup.count({ where: { department: { faculty: { schoolId } } } }),
    ]);
    return { data, total, page, limit };
  },

  // ── Join / Leave ───────────────────────────────────────────────────────

  async joinGroup(groupId: string, userId: string) {
    const group = await prisma.studyGroup.findUnique({ where: { id: groupId, isActive: true }, select: { isPrivate: true } });
    if (!group) throw new AppError('Study group not found', 404);
    if (group.isPrivate) throw new AppError('This group is private. Use an invite link to join.', 403);

    const existing = await prisma.studyGroupMember.findUnique({ where: { groupId_userId: { groupId, userId } } });
    if (existing) throw new AppError('Already a member', 409);

    await prisma.$transaction([
      prisma.studyGroupMember.create({ data: { groupId, userId, role: 'MEMBER' } }),
      prisma.studyGroup.update({ where: { id: groupId }, data: { memberCount: { increment: 1 } } }),
    ]);
    return { joined: true };
  },

  async leaveGroup(groupId: string, userId: string) {
    const member = await prisma.studyGroupMember.findUnique({ where: { groupId_userId: { groupId, userId } } });
    if (!member) throw new AppError('Not a member of this group', 404);

    const group = await prisma.studyGroup.findUnique({ where: { id: groupId }, select: { createdById: true } });
    if (group?.createdById === userId) throw new AppError('Group creator cannot leave. Transfer ownership or delete the group.', 400);

    await prisma.$transaction([
      prisma.studyGroupMember.delete({ where: { groupId_userId: { groupId, userId } } }),
      prisma.studyGroup.update({ where: { id: groupId }, data: { memberCount: { decrement: 1 } } }),
    ]);
    return { left: true };
  },

  // ── Member role management ─────────────────────────────────────────────

  async updateMemberRole(groupId: string, targetUserId: string, input: UpdateRoleInput, actorId: string, userRole: string, ipAddress?: string) {
    await assertAdmin(groupId, actorId, userRole);

    const member = await prisma.studyGroupMember.findUnique({ where: { groupId_userId: { groupId, userId: targetUserId } } });
    if (!member) throw new AppError('User is not a member of this group', 404);

    // Prevent demoting the group creator
    const group = await prisma.studyGroup.findUnique({ where: { id: groupId }, select: { createdById: true } });
    if (group?.createdById === targetUserId && input.role !== 'ADMIN') {
      throw new AppError('Cannot change the role of the group creator', 400);
    }

    await prisma.studyGroupMember.update({
      where: { groupId_userId: { groupId, userId: targetUserId } },
      data: { role: input.role },
    });

    await auditService.log({ action: 'GROUP_ROLE_CHANGED', performedById: actorId, targetUserId, targetId: groupId, targetType: 'StudyGroup', meta: { newRole: input.role }, ipAddress }).catch(() => null);
    return { updated: true, role: input.role };
  },

  async kickMember(groupId: string, targetUserId: string, actorId: string, userRole: string, ipAddress?: string) {
    await assertAdmin(groupId, actorId, userRole);

    const member = await prisma.studyGroupMember.findUnique({ where: { groupId_userId: { groupId, userId: targetUserId } } });
    if (!member) throw new AppError('User is not a member of this group', 404);

    const group = await prisma.studyGroup.findUnique({ where: { id: groupId }, select: { createdById: true } });
    if (group?.createdById === targetUserId) throw new AppError('Cannot kick the group creator', 400);
    if (actorId === targetUserId) throw new AppError('Cannot kick yourself', 400);

    await prisma.$transaction([
      prisma.studyGroupMember.delete({ where: { groupId_userId: { groupId, userId: targetUserId } } }),
      prisma.studyGroup.update({ where: { id: groupId }, data: { memberCount: { decrement: 1 } } }),
    ]);

    await sendAndPersistNotification(targetUserId, 'Removed from group', 'You have been removed from the study group.', 'SYSTEM', { type: 'GROUP_KICKED', groupId }).catch(() => null);
    await auditService.log({ action: 'GROUP_MEMBER_KICKED', performedById: actorId, targetUserId, targetId: groupId, targetType: 'StudyGroup', ipAddress }).catch(() => null);
    return { kicked: true };
  },

  // ── Invites ────────────────────────────────────────────────────────────

  async createInvite(groupId: string, userId: string, userRole: string, input: CreateInviteInput) {
    await assertAdmin(groupId, userId, userRole);

    const expiresAt = input.expiresInHours
      ? new Date(Date.now() + input.expiresInHours * 60 * 60 * 1000)
      : undefined;

    const invite = await prisma.groupInvite.create({
      data: { groupId, createdById: userId, maxUses: input.maxUses, expiresAt },
      select: { id: true, token: true, maxUses: true, expiresAt: true, createdAt: true },
    });

    return { ...invite, inviteUrl: `/groups/join/${invite.token}` };
  },

  async acceptInvite(token: string, userId: string) {
    const invite = await prisma.groupInvite.findUnique({
      where: { token },
      include: { group: { select: { id: true, name: true, isActive: true } } },
    });

    if (!invite || invite.isRevoked) throw new AppError('Invalid or revoked invite link', 404);
    if (!invite.group.isActive) throw new AppError('This group no longer exists', 404);
    if (invite.expiresAt && invite.expiresAt < new Date()) throw new AppError('This invite link has expired', 410);
    if (invite.useCount >= invite.maxUses) throw new AppError('This invite link has reached its maximum uses', 410);

    const existing = await prisma.studyGroupMember.findUnique({
      where: { groupId_userId: { groupId: invite.groupId, userId } },
    });
    if (existing) throw new AppError('You are already a member of this group', 409);

    await prisma.$transaction([
      prisma.studyGroupMember.create({ data: { groupId: invite.groupId, userId, role: 'MEMBER' } }),
      prisma.studyGroup.update({ where: { id: invite.groupId }, data: { memberCount: { increment: 1 } } }),
      prisma.groupInvite.update({ where: { id: invite.id }, data: { useCount: { increment: 1 } } }),
    ]);

    return { joined: true, groupId: invite.groupId, groupName: invite.group.name };
  },

  async listInvites(groupId: string, userId: string, userRole: string) {
    await assertAdmin(groupId, userId, userRole);
    return prisma.groupInvite.findMany({
      where: { groupId, isRevoked: false },
      select: { id: true, token: true, maxUses: true, useCount: true, expiresAt: true, createdAt: true,
        createdBy: { select: { id: true, fullName: true } } },
      orderBy: { createdAt: 'desc' },
    });
  },

  async revokeInvite(inviteId: string, userId: string, userRole: string) {
    const invite = await prisma.groupInvite.findUnique({ where: { id: inviteId } });
    if (!invite) throw new AppError('Invite not found', 404);
    await assertAdmin(invite.groupId, userId, userRole);
    await prisma.groupInvite.update({ where: { id: inviteId }, data: { isRevoked: true } });
    return { revoked: true };
  },

  // ── Messages ───────────────────────────────────────────────────────────

  async getMessages(groupId: string, userId: string, input: ListMessagesInput) {
    await assertMember(groupId, userId);
    const { before, limit } = input;
    const where: Record<string, unknown> = { groupId };
    if (before) {
      const cursor = await prisma.studyGroupMessage.findUnique({ where: { id: before }, select: { createdAt: true } });
      if (cursor) where.createdAt = { lt: cursor.createdAt };
    }
    const messages = await prisma.studyGroupMessage.findMany({
      where,
      select: {
        id: true, content: true, attachments: true, isAiReply: true, aiContext: true, createdAt: true,
        sender: { select: { id: true, fullName: true, profilePictureUrl: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
    return messages.reverse();
  },

  async sendMessage(groupId: string, userId: string, input: SendMessageInput) {
    await assertMember(groupId, userId);
    return prisma.studyGroupMessage.create({
      data: { groupId, senderId: userId, content: input.content, attachments: input.attachments ?? [] },
      select: {
        id: true, content: true, attachments: true, isAiReply: true, aiContext: true, createdAt: true,
        sender: { select: { id: true, fullName: true, profilePictureUrl: true } },
      },
    });
  },

  // ── 4.1 Group Quiz Leaderboard ─────────────────────────────────────────

  async getQuizLeaderboard(quizId: string, groupId: string, userId: string) {
    await assertMember(groupId, userId);

    const quiz = await prisma.quiz.findUnique({ where: { id: quizId }, select: { studyGroupId: true, title: true, courseCode: true } });
    if (!quiz) throw new AppError('Quiz not found', 404);
    if (quiz.studyGroupId !== groupId) throw new AppError('This quiz does not belong to your group', 403);

    const members = await prisma.studyGroupMember.findMany({
      where: { groupId },
      select: { userId: true },
    });
    const memberIds = members.map((m: { userId: string }) => m.userId);
    const attempts = await prisma.quizAttempt.findMany({
      where: { quizId, userId: { in: memberIds } },
      select: {
        userId: true, score: true, totalQuestions: true, percentage: true, timeTaken: true, completedAt: true,
        user: { select: { id: true, fullName: true, profilePictureUrl: true } },
      },
      orderBy: [{ percentage: 'desc' }, { timeTaken: 'asc' }],
    });

    // Keep only best attempt per user
    const seen = new Set<string>();
    const leaderboard = attempts
      .filter((a: typeof attempts[number]) => { if (seen.has(a.userId)) return false; seen.add(a.userId); return true; })
      .map((a: typeof attempts[number], idx: number) => ({ rank: idx + 1, user: a.user, score: a.score, totalQuestions: a.totalQuestions, percentage: Math.round(a.percentage * 10) / 10, timeTaken: a.timeTaken, completedAt: a.completedAt }));

    return { quiz: { id: quizId, title: quiz.title, courseCode: quiz.courseCode }, leaderboard, totalMembers: memberIds.length, participated: leaderboard.length };
  },

  // ── 4.2 Group AI Summaries ─────────────────────────────────────────────

  async shareSummaryToGroup(groupId: string, userId: string, input: ShareSummaryInput) {
    await assertMember(groupId, userId);

    const summary = await prisma.aISummary.findUnique({
      where: { materialId: input.materialId },
      select: {
        status: true, finalSummary: true, combinedKeyPoints: true,
        combinedExamTopics: true, revisionSheet: true, revisionRoadmap: true,
        material: { select: { title: true, courseCode: true } },
      },
    });

    if (!summary) throw new AppError('No AI summary found for this material. Request one first.', 404);
    if (summary.status !== 'COMPLETED') throw new AppError('AI summary is not yet complete', 400);

    // Post summary as a system message in group chat
    const content = [
      `📚 *AI Summary: ${summary.material.title} (${summary.material.courseCode})*`,
      '',
      summary.finalSummary ?? '',
      '',
      summary.combinedKeyPoints ? `*Key Points:*\n${(summary.combinedKeyPoints as string[]).map((p) => `• ${p}`).join('\n')}` : '',
      summary.combinedExamTopics ? `\n*Exam Focus:*\n${(summary.combinedExamTopics as string[]).map((t) => `• ${t}`).join('\n')}` : '',
    ].filter(Boolean).join('\n');

    const message = await prisma.studyGroupMessage.create({
      data: {
        groupId, senderId: userId, content,
        isAiReply: true,
        aiContext: `Summary of "${summary.material.title}" shared by a group member`,
        attachments: [],
      },
      select: {
        id: true, content: true, isAiReply: true, aiContext: true, createdAt: true,
        sender: { select: { id: true, fullName: true, profilePictureUrl: true } },
      },
    });

    return { message, materialTitle: summary.material.title };
  },

  // ── 4.3 Group AI Q&A ──────────────────────────────────────────────────

  async askGroupQuestion(groupId: string, userId: string, input: GroupQaInput) {
    await assertMember(groupId, userId);

    // Fetch all materials uploaded by group members with extracted text
    const groupMembers = await prisma.studyGroupMember.findMany({
      where: { groupId }, select: { userId: true },
    });
    const memberIds = groupMembers.map((m: { userId: string }) => m.userId);

    const materials = await prisma.material.findMany({
      where: {
        uploadedById: { in: memberIds },
        isDeleted: false,
        textExtractionStatus: 'READABLE',
        extractedText: { not: null },
      },
      select: {
        title: true, extractedText: true,
        uploadedBy: { select: { fullName: true } },
      },
      take: 10,
    });

    if (materials.length === 0) {
      throw new AppError('No readable materials found in this group to answer from.', 400);
    }

    // Build context excerpts (first 600 chars per material)
    const context = materials.map((m: typeof materials[number]) => ({
      title: m.title,
      uploader: m.uploadedBy.fullName,
      excerpt: (m.extractedText ?? '').slice(0, 600),
    }));

    const raw = await groqChat(GROUP_QA_SYSTEM, groupQaPrompt(input.question, context));

    let parsed: { answer: string; sources: string[]; confidence: string; notFound: boolean };
    try { parsed = JSON.parse(raw); } catch { parsed = { answer: raw, sources: [], confidence: 'LOW', notFound: false }; }

    const aiContext = parsed.sources.length
      ? `Based on: ${parsed.sources.join(', ')}`
      : 'Based on group materials';

    // Persist Q as user message, A as AI message
    const [questionMsg, answerMsg] = await prisma.$transaction([
      prisma.studyGroupMessage.create({
        data: { groupId, senderId: userId, content: `❓ ${input.question}`, attachments: [] },
        select: { id: true, content: true, createdAt: true, sender: { select: { id: true, fullName: true, profilePictureUrl: true } } },
      }),
      prisma.studyGroupMessage.create({
        data: {
          groupId, senderId: userId, content: `🤖 ${parsed.answer}`,
          isAiReply: true, aiContext, attachments: [],
        },
        select: { id: true, content: true, isAiReply: true, aiContext: true, createdAt: true, sender: { select: { id: true, fullName: true, profilePictureUrl: true } } },
      }),
    ]);

    return { question: questionMsg, answer: answerMsg, sources: parsed.sources, confidence: parsed.confidence, notFound: parsed.notFound };
  },

  // ── 4.4 Quiz Challenges ────────────────────────────────────────────────

  async createChallenge(groupId: string, userId: string, userRole: string, input: CreateChallengeInput, ipAddress?: string) {
    await assertAdmin(groupId, userId, userRole);

    if (groupId === input.receiverGroupId) throw new AppError('Cannot challenge your own group', 400);

    const [quiz, receiverGroup] = await Promise.all([
      prisma.quiz.findUnique({ where: { id: input.quizId, isActive: true }, select: { id: true, title: true, studyGroupId: true, quizApprovalStatus: true } }),
      prisma.studyGroup.findUnique({ where: { id: input.receiverGroupId, isActive: true }, select: { id: true, name: true } }),
    ]);

    if (!quiz) throw new AppError('Quiz not found', 404);
    if (quiz.quizApprovalStatus !== 'APPROVED') throw new AppError('Quiz must be approved before use in a challenge', 400);
    if (!receiverGroup) throw new AppError('Target group not found', 404);

    // One active challenge per pair at a time
    const existing = await prisma.groupChallenge.findFirst({
      where: {
        initiatorGroupId: groupId,
        receiverGroupId: input.receiverGroupId,
        status: { in: ['PENDING', 'ACCEPTED'] },
      },
    });
    if (existing) throw new AppError('An active challenge already exists with this group', 409);

    const expiresAt = new Date(Date.now() + input.expiresInHours * 60 * 60 * 1000);

    const challenge = await prisma.groupChallenge.create({
      data: {
        initiatorGroupId: groupId,
        receiverGroupId: input.receiverGroupId,
        quizId: input.quizId,
        expiresAt,
        createdById: userId,
      },
    });

    // Notify receiver group members
    const receiverMembers = await prisma.studyGroupMember.findMany({
      where: { groupId: input.receiverGroupId }, select: { userId: true },
    });

    const initiatorGroup = await prisma.studyGroup.findUnique({ where: { id: groupId }, select: { name: true } });

    await Promise.all(
      receiverMembers.map((m: { userId: string }) =>
        sendAndPersistNotification(m.userId, '⚔️ Quiz Challenge!', `"${initiatorGroup?.name}" has challenged your group to a quiz: "${quiz.title}"`, 'SYSTEM', { type: 'GROUP_CHALLENGE', challengeId: challenge.id }).catch(() => null)
      )
    );

    await auditService.log({ action: 'GROUP_CHALLENGE_CREATED', performedById: userId, targetId: challenge.id, targetType: 'GroupChallenge', meta: { quizTitle: quiz.title, receiverGroup: receiverGroup.name }, ipAddress }).catch(() => null);

    return challenge;
  },

  async acceptChallenge(challengeId: string, groupId: string, userId: string, userRole: string) {
    await assertAdmin(groupId, userId, userRole);

    const challenge = await prisma.groupChallenge.findUnique({ where: { id: challengeId } });
    if (!challenge) throw new AppError('Challenge not found', 404);
    if (challenge.receiverGroupId !== groupId) throw new AppError('This challenge is not for your group', 403);
    if (challenge.status !== 'PENDING') throw new AppError(`Challenge is already ${challenge.status.toLowerCase()}`, 400);
    if (challenge.expiresAt < new Date()) throw new AppError('This challenge has expired', 410);

    await prisma.groupChallenge.update({ where: { id: challengeId }, data: { status: 'ACCEPTED' } });

    // Notify initiator group
    const initiatorMembers = await prisma.studyGroupMember.findMany({
      where: { groupId: challenge.initiatorGroupId }, select: { userId: true },
    });
    const receiverGroup = await prisma.studyGroup.findUnique({ where: { id: groupId }, select: { name: true } });

    await Promise.all(
      initiatorMembers.map((m: { userId: string }) =>
        sendAndPersistNotification(m.userId, '✅ Challenge Accepted!', `"${receiverGroup?.name}" accepted your quiz challenge!`, 'SYSTEM', { type: 'GROUP_CHALLENGE_ACCEPTED', challengeId }).catch(() => null)
      )
    );

    return { accepted: true };
  },

  async declineChallenge(challengeId: string, groupId: string, userId: string, userRole: string) {
    await assertAdmin(groupId, userId, userRole);
    const challenge = await prisma.groupChallenge.findUnique({ where: { id: challengeId } });
    if (!challenge) throw new AppError('Challenge not found', 404);
    if (challenge.receiverGroupId !== groupId) throw new AppError('This challenge is not for your group', 403);
    if (challenge.status !== 'PENDING') throw new AppError(`Challenge is already ${challenge.status.toLowerCase()}`, 400);
    await prisma.groupChallenge.update({ where: { id: challengeId }, data: { status: 'DECLINED' } });
    return { declined: true };
  },

  async getChallengeResult(challengeId: string, groupId: string, userId: string, ipAddress?: string) {
    await assertMember(groupId, userId);

    const challenge = await prisma.groupChallenge.findUnique({
      where: { id: challengeId },
      include: {
        initiatorGroup: { select: { id: true, name: true } },
        receiverGroup: { select: { id: true, name: true } },
      },
    });
    if (!challenge) throw new AppError('Challenge not found', 404);

    // If already completed, return stored result
    if (challenge.status === 'COMPLETED') return challenge;

    if (challenge.status !== 'ACCEPTED') throw new AppError('Challenge has not been accepted yet', 400);
    if (challenge.expiresAt > new Date()) throw new AppError('Challenge window is still open', 400);

    // Compute avg scores for both groups
    const [initiatorMembers, receiverMembers] = await Promise.all([
      prisma.studyGroupMember.findMany({ where: { groupId: challenge.initiatorGroupId }, select: { userId: true } }),
      prisma.studyGroupMember.findMany({ where: { groupId: challenge.receiverGroupId }, select: { userId: true } }),
    ]);

    const avgScore = async (memberIds: string[]) => {
      const attempts = await prisma.quizAttempt.findMany({
        where: { quizId: challenge.quizId, userId: { in: memberIds } },
        select: { userId: true, percentage: true },
        orderBy: { percentage: 'desc' },
      });
      // Best attempt per member
      const seen = new Set<string>();
      const best = attempts.filter((a: typeof attempts[number]) => { if (seen.has(a.userId)) return false; seen.add(a.userId); return true; });
      return best.length > 0 ? best.reduce((sum: number, a: typeof attempts[number]) => sum + a.percentage, 0) / best.length : 0;
    };

    const [initiatorAvg, receiverAvg] = await Promise.all([
      avgScore(initiatorMembers.map((m: { userId: string }) => m.userId)),
      avgScore(receiverMembers.map((m: { userId: string }) => m.userId)),
    ]);

    const winnerGroupId = initiatorAvg >= receiverAvg ? challenge.initiatorGroupId : challenge.receiverGroupId;

    const updated = await prisma.groupChallenge.update({
      where: { id: challengeId },
      data: {
        status: 'COMPLETED',
        initiatorAvgScore: Math.round(initiatorAvg * 100) / 100,
        receiverAvgScore: Math.round(receiverAvg * 100) / 100,
        winnerGroupId,
        initiatorBadgeAwarded: true,
        receiverBadgeAwarded: true,
      },
      include: {
        initiatorGroup: { select: { id: true, name: true } },
        receiverGroup: { select: { id: true, name: true } },
      },
    });

    // Notify both groups
    const allMembers = [...initiatorMembers, ...receiverMembers];
    const winnerName = winnerGroupId === challenge.initiatorGroupId
      ? challenge.initiatorGroup.name
      : challenge.receiverGroup.name;

    await Promise.all(
      allMembers.map((m) =>
        sendAndPersistNotification(m.userId, '🏆 Challenge Complete!', `"${winnerName}" wins the quiz challenge!`, 'SYSTEM', { type: 'GROUP_CHALLENGE_RESULT', challengeId }).catch(() => null)
      )
    );

    await auditService.log({ action: 'GROUP_CHALLENGE_COMPLETED', performedById: userId, targetId: challengeId, targetType: 'GroupChallenge', meta: { winnerGroupId, initiatorAvg, receiverAvg }, ipAddress }).catch(() => null);

    return updated;
  },

  async listChallenges(groupId: string, userId: string) {
    await assertMember(groupId, userId);
    return prisma.groupChallenge.findMany({
      where: {
        OR: [{ initiatorGroupId: groupId }, { receiverGroupId: groupId }],
      },
      include: {
        initiatorGroup: { select: { id: true, name: true } },
        receiverGroup: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  },
};
