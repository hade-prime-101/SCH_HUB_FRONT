import { app } from '@/app';
import supertest from 'supertest';
import { prisma } from '@/config/prisma';
import { randomUUID } from 'crypto';
import jwt from 'jsonwebtoken';
import { env } from '@/config/env';
import type { UserRole } from '@prisma/client';

// ── Simple random helpers (avoids ESM-only @faker-js/faker) ──────────────
const rand     = (n: number) => Math.random().toString(36).slice(2, 2 + n);
const randEmail   = () => `${rand(8)}@${rand(6)}.test`;
const randName    = () => `${rand(5)} ${rand(6)}`;
const randCompany = () => `${rand(6)} Inc`;
const randAlpha   = (n: number) =>
  Array.from({ length: n }, () =>
    'ABCDEFGHIJKLMNOPQRSTUVWXYZ'[Math.floor(Math.random() * 26)]
  ).join('');

export const testApp = supertest(app);

// ── Auth Token Factory ────────────────────────────────────────────────────

export function makeToken(overrides: Partial<{
  id       : string;
  email    : string;
  role     : string;
  schoolId : string;
}> = {}): string {
  const payload = {
    id       : overrides.id       ?? randomUUID(),
    email    : overrides.email    ?? randEmail(),
    role     : overrides.role     ?? 'STUDENT',
    schoolId : overrides.schoolId ?? randomUUID(),
  };
  return jwt.sign(payload, env.JWT_ACCESS_SECRET, { expiresIn: '1h' });
}

// ── User Factory ──────────────────────────────────────────────────────────

export async function createTestUser(overrides: Partial<{
  role        : UserRole;
  schoolId    : string;
  email       : string;
  facultyId   : string;
  departmentId: string;
}> = {}) {
  const user = await prisma.user.create({
    data: {
      id           : randomUUID(),
      email        : overrides.email        ?? randEmail(),
      fullName     : randName(),
      role         : overrides.role         ?? 'STUDENT',
      schoolId     : overrides.schoolId     ?? randomUUID(),
      facultyId    : overrides.facultyId    ?? randomUUID(),
      departmentId : overrides.departmentId ?? randomUUID(),
      passwordHash : '$2a$10$hashedpasswordfortest',
      matricNumber : rand(10).toUpperCase(),
      level        : '100',
      isVerified   : true,
    },
  });

  const token = makeToken({
    id       : user.id,
    email    : user.email,
    role     : user.role,
    schoolId : user.schoolId ?? undefined,
  });

  return { user, token };
}

// ── School Factory ────────────────────────────────────────────────────────

export async function createTestSchool() {
  return prisma.school.create({
    data: {
      id        : randomUUID(),
      name      : randCompany(),
      shortCode : randAlpha(5),
      location  : 'Test City',
      isActive  : true,
    },
  });
}

// ── Cleanup Helper ────────────────────────────────────────────────────────

export async function cleanupTestData(ids: {
  userIds?    : string[];
  schoolIds?  : string[];
  materialIds?: string[];
}) {
  if (ids.materialIds?.length) {
    await prisma.material.deleteMany({ where: { id: { in: ids.materialIds } } });
  }
  if (ids.userIds?.length) {
    await prisma.user.deleteMany({ where: { id: { in: ids.userIds } } });
  }
  if (ids.schoolIds?.length) {
    await prisma.school.deleteMany({ where: { id: { in: ids.schoolIds } } });
  }
}
