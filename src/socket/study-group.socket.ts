import type { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { env } from '@/config/env.js';
import { studyGroupsService } from '@/modules/study-groups/study-groups.service.js';
import { sendMessageSchema } from '@/modules/study-groups/study-groups.validators.js';
import { groupQaSchema } from '@/modules/study-groups/study-groups.validators.js';

interface AuthPayload {
  id: string;
  schoolId: string;
  departmentId: string;
  level: string;
  role: string;
}

export const registerStudyGroupHandlers = (io: Server, socket: Socket) => {
  const token = socket.handshake.auth?.token as string | undefined;
  if (!token) { socket.disconnect(); return; }

  let user: AuthPayload;
  try {
    user = jwt.verify(token, env.JWT_ACCESS_SECRET) as AuthPayload;
  } catch {
    socket.disconnect();
    return;
  }

  // ── Room management ─────────────────────────────────────────────────────

  socket.on('group:join', async (groupId: string) => {
    try {
      const { prisma } = await import('@/config/prisma.js');
      const member = await prisma.studyGroupMember.findUnique({
        where: { groupId_userId: { groupId, userId: user.id } },
      });
      if (!member) { socket.emit('error', { message: 'Not a member of this group' }); return; }
      socket.join(`group:${groupId}`);
      socket.emit('group:joined', { groupId });
    } catch {
      socket.emit('error', { message: 'Failed to join group room' });
    }
  });

  socket.on('group:leave', (groupId: string) => {
    socket.leave(`group:${groupId}`);
  });

  // ── Chat message ────────────────────────────────────────────────────────

  socket.on('group:message', async (data: unknown) => {
    try {
      const messageData = sendMessageSchema.extend({ groupId: z.string().min(1) }).parse(data);
      const { groupId, ...parsed } = messageData;
      const message = await studyGroupsService.sendMessage(groupId, user.id, parsed);
      io.to(`group:${groupId}`).emit('group:message', message);
    } catch (err: any) {
      socket.emit('error', { message: err?.message ?? 'Failed to send message' });
    }
  });

  // ── AI Q&A via socket ───────────────────────────────────────────────────

  socket.on('group:ask', async (data: { groupId: string; question: string }) => {
    try {
      const parsed = groupQaSchema.parse({ question: data.question });
      socket.emit('group:ask:thinking', { groupId: data.groupId });

      const result = await studyGroupsService.askGroupQuestion(data.groupId, user.id, parsed);

      // Broadcast both question and AI answer to room
      io.to(`group:${data.groupId}`).emit('group:message', result.question);
      io.to(`group:${data.groupId}`).emit('group:message', result.answer);
    } catch (err: any) {
      socket.emit('error', { message: err?.message ?? 'Failed to process question' });
    }
  });

  // ── Challenge notifications ─────────────────────────────────────────────

  socket.on('group:challenge:watch', (challengeId: string) => {
    socket.join(`challenge:${challengeId}`);
  });
};
