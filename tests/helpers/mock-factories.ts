// ✅ Remove .js extensions — CJS mode doesn't need them
import { randomUUID } from 'crypto';
import { mockDeep } from 'jest-mock-extended';
import type { PrismaClient } from '@prisma/client';

// ── Simple random helpers (no faker needed — avoids ESM compat issues) ────

const rand = (n: number) => Math.random().toString(36).slice(2, 2 + n);
const randEmail = () => `${rand(8)}@${rand(6)}.test`;
const randName  = () => `${rand(5)} ${rand(6)}`;
const randCompany = () => `${rand(6)} Inc`;
const randWord  = () => rand(8);
const randSentence = () => `${rand(6)} ${rand(5)} ${rand(7)}`;
const randParagraph = () => `${randSentence()}. ${randSentence()}. ${randSentence()}.`;
const randAlpha = (n: number) => Array.from({ length: n }, () => 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'[Math.floor(Math.random() * 26)]).join('');

// ── Prisma Deep Mock ──────────────────────────────────────────────────────

export const prismaMock = mockDeep<PrismaClient>();

// ✅ Mock must be declared before any test imports @/config/prisma
jest.mock('@/config/prisma', () => ({
  prisma: prismaMock,
}));

// ── Firebase Mock ─────────────────────────────────────────────────────────

export const firebaseMock = {
  sendPush           : jest.fn().mockResolvedValue({ messageId: 'mock-push-id' }),
  sendTopic          : jest.fn().mockResolvedValue({ messageId: 'mock-topic-id' }),
  sendMulticast      : jest.fn().mockResolvedValue(undefined),
  subscribeToTopics  : jest.fn().mockResolvedValue(undefined),
};

jest.mock('@/config/firebase', () => ({
  firebase: firebaseMock,
}));

// ── Mailer Mock ───────────────────────────────────────────────────────────

export const mailerMock = {
  sendMail          : jest.fn().mockResolvedValue(undefined),
  sendOTP           : jest.fn().mockResolvedValue(undefined),
  sendAnnouncement  : jest.fn().mockResolvedValue(undefined),
  sendEventReminder : jest.fn().mockResolvedValue(undefined),
};

jest.mock('@/config/mailer', () => ({
  mailer: mailerMock,
}));

// ── Data Factories ────────────────────────────────────────────────────────

export const mockUser = (overrides: Record<string, unknown> = {}) => ({
  id        : randomUUID(),
  email     : randEmail(),
  fullName  : randName(),
  role      : 'STUDENT',
  schoolId  : randomUUID(),
  fcmToken  : null,
  isDeleted : false,
  createdAt : new Date(),
  updatedAt : new Date(),
  settings  : null,
  ...overrides,
});

export const mockNotification = (overrides: Record<string, unknown> = {}) => ({
  id        : randomUUID(),
  userId    : randomUUID(),
  title     : randSentence(),
  body      : randParagraph(),
  type      : 'ANNOUNCEMENT',
  isRead    : false,
  readAt    : null,
  data      : {},
  createdAt : new Date(),
  updatedAt : new Date(),
  ...overrides,
});

export const mockSchool = (overrides: Record<string, unknown> = {}) => ({
  id        : randomUUID(),
  name      : randCompany(),
  shortCode : randAlpha(5),
  isActive  : true,
  createdAt : new Date(),
  updatedAt : new Date(),
  ...overrides,
});