import { prisma } from '@/config/prisma.js';
import { r2 } from '@/config/r2.js';
import { firebase } from '@/config/firebase.js';
import { AppError } from '@/utils/response.js';
import { notificationTopic } from '@/modules/notifications/notifications.service.js';
import type { updateProfileSchema, updateSettingsSchema } from '@/modules/users/users.validators.js';
import type { z } from 'zod';

type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
type UpdateSettingsInput = z.infer<typeof updateSettingsSchema>;

const PUBLIC_USER_SELECT = {
  id: true,
  fullName: true,
  email: true,
  phone: true,
  matricNumber: true,
  profilePictureUrl: true,
  bio: true,
  role: true,
  level: true,
  isVerified: true,
  createdAt: true,
  updatedAt: true,
  school: { select: { id: true, name: true, shortCode: true } },
  faculty: { select: { id: true, name: true } },
  department: { select: { id: true, name: true, shortCode: true } },
  shop: { select: { id: true, name: true } },
  settings: true,
  _count: { select: { materials: true, listings: true } },
};

export const usersService = {
  async getProfile(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId, isDeleted: false },
      select: {
        ...PUBLIC_USER_SELECT,
        receivedRatings: {
          select: { rating: true },
        },
      },
    });

    if (!user) throw new AppError('User not found', 404);

    const sellerRating =
      user.receivedRatings.length > 0
        ? user.receivedRatings.reduce((sum: number, r: typeof user.receivedRatings[number]) => sum + r.rating, 0) / user.receivedRatings.length
        : null;

    const { receivedRatings, ...rest } = user;
    return { ...rest, sellerRating };
  },

  async updateProfile(userId: string, input: UpdateProfileInput) {
    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(input.fullName && { fullName: input.fullName }),
        ...(input.phone !== undefined && { phone: input.phone }),
        ...(input.bio !== undefined && { bio: input.bio }),
        ...(input.level && { level: input.level }),
      },
      select: PUBLIC_USER_SELECT,
    });
    return user;
  },

  async uploadAvatar(userId: string, buffer: Buffer, originalName: string, mimeType: string) {
    // Delete old avatar from R2 if exists
    const existing = await prisma.user.findUnique({
      where: { id: userId },
      select: { profilePictureUrl: true },
    });

    if (existing?.profilePictureUrl) {
      const oldKey = existing.profilePictureUrl.split('/').pop();
      if (oldKey) await r2.delete(oldKey).catch(() => null);
    }

    const { url } = await r2.upload(buffer, originalName, mimeType);

    const user = await prisma.user.update({
      where: { id: userId },
      data: { profilePictureUrl: url },
      select: { id: true, profilePictureUrl: true },
    });

    return user;
  },

  async updateSettings(userId: string, input: UpdateSettingsInput) {
    const settings = await prisma.userSettings.upsert({
      where: { userId },
      create: { userId, ...input },
      update: input,
    });
    return settings;
  },

  async registerFcmToken(userId: string, fcmToken: string) {
    const user = await prisma.user.update({
      where: { id: userId },
      data: { fcmToken },
      select: { schoolId: true, departmentId: true },
    });

    const topics = [
      notificationTopic('school', user.schoolId),
      notificationTopic('department', user.departmentId),
    ];

    await firebase.subscribeToTopics(fcmToken, topics);
    return { registered: true, topics };
  },

  async getBookmarks(userId: string) {
    const bookmarks = await prisma.bookmark.findMany({
      where: { userId },
      include: {
        material: {
          select: { id: true, title: true, type: true, courseCode: true, fileUrl: true, createdAt: true },
        },
        post: {
          select: { id: true, content: true, type: true, createdAt: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    return bookmarks;
  },

  async getMaterials(userId: string) {
    return prisma.material.findMany({
      where: { uploadedById: userId, isDeleted: false },
      select: {
        id: true,
        title: true,
        type: true,
        courseCode: true,
        courseTitle: true,
        fileUrl: true,
        fileSize: true,
        downloadCount: true,
        avgRating: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  },

  async getSessions(userId: string) {
    const sessions = await prisma.refreshToken.findMany({
      where: { userId, expiresAt: { gt: new Date() } },
      select: { id: true, deviceInfo: true, createdAt: true, expiresAt: true },
      orderBy: { createdAt: 'desc' },
    });
    return sessions;
  },

  async revokeSession(userId: string, sessionId: string) {
    const session = await prisma.refreshToken.findUnique({ where: { id: sessionId } });
    if (!session || session.userId !== userId) throw new AppError('Session not found', 404);
    await prisma.refreshToken.delete({ where: { id: sessionId } });
    return { revoked: true };
  },

  async revokeAllSessions(userId: string, exceptToken?: string) {
    await prisma.refreshToken.deleteMany({
      where: { userId, ...(exceptToken ? { token: { not: exceptToken } } : {}) },
    });
    return { revoked: true };
  },

  // ── Roles ──────────────────────────────────────────────────

  // Search users within a school — used by admin to find who to nominate
  async searchUsers(adminSchoolId: string, query: {
    search: string; departmentId?: string; level?: string; page: number; limit: number;
  }) {
    const { search, departmentId, level, page, limit } = query;
    const skip = (page - 1) * limit;

    const where = {
      schoolId: adminSchoolId,
      isDeleted: false,
      ...(departmentId && { departmentId }),
      ...(level && { level }),
      OR: [
        { fullName: { contains: search, mode: 'insensitive' as const } },
        { email: { contains: search, mode: 'insensitive' as const } },
        { matricNumber: { contains: search, mode: 'insensitive' as const } },
      ],
    };

    const [items, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true, fullName: true, email: true, matricNumber: true,
          role: true, level: true, profilePictureUrl: true,
          department: { select: { id: true, name: true, shortCode: true } },
        },
        orderBy: { fullName: 'asc' },
        skip,
        take: limit,
      }),
      prisma.user.count({ where }),
    ]);

    return { items, total, page, limit };
  },

  // Nominate a specific user as COURSE_REP for their dept+level
  // Automatically demotes any existing course rep in the same dept+level
  async nominateCourseRep(targetUserId: string, adminId: string) {
    const [target, admin] = await Promise.all([
      prisma.user.findUnique({ where: { id: targetUserId } }),
      prisma.user.findUnique({ where: { id: adminId } }),
    ]);

    if (!target || target.isDeleted) throw new AppError('User not found', 404);
    if (!admin) throw new AppError('Admin not found', 404);

    if (admin.role === 'SCHOOL_ADMIN' && target.schoolId !== admin.schoolId) {
      throw new AppError('Cannot nominate users outside your school', 403);
    }

    // Demote existing course rep in same dept + level back to STUDENT
    await prisma.user.updateMany({
      where: {
        departmentId: target.departmentId,
        level: target.level,
        role: 'COURSE_REP',
        id: { not: targetUserId },
      },
      data: { role: 'STUDENT' },
    });

    return prisma.user.update({
      where: { id: targetUserId },
      data: { role: 'COURSE_REP' },
      select: {
        id: true, fullName: true, email: true, matricNumber: true,
        role: true, level: true,
        department: { select: { id: true, name: true, shortCode: true } },
      },
    });
  },

  // Direct role assignment for SCHOOL_ADMIN and SUPER_ADMIN roles
  async assignRole(targetUserId: string, role: string, adminId: string) {
    const [target, admin] = await Promise.all([
      prisma.user.findUnique({ where: { id: targetUserId } }),
      prisma.user.findUnique({ where: { id: adminId } }),
    ]);

    if (!target || target.isDeleted) throw new AppError('User not found', 404);
    if (!admin) throw new AppError('Admin not found', 404);

    if (admin.role === 'SCHOOL_ADMIN' && target.schoolId !== admin.schoolId) {
      throw new AppError('Cannot assign roles to users outside your school', 403);
    }
    if (admin.role === 'SCHOOL_ADMIN' && role === 'SUPER_ADMIN') {
      throw new AppError('Insufficient permissions to assign SUPER_ADMIN', 403);
    }

    return prisma.user.update({
      where: { id: targetUserId },
      data: { role: role as any },
      select: { id: true, fullName: true, email: true, role: true },
    });
  },

  async listUsers(adminSchoolId: string, query: {
    role?: string; departmentId?: string; search?: string; page: number; limit: number;
  }) {
    const { role, departmentId, search, page, limit } = query;
    const skip = (page - 1) * limit;

    const where = {
      schoolId: adminSchoolId,
      isDeleted: false,
      ...(role && { role: role as any }),
      ...(departmentId && { departmentId }),
      ...(search && {
        OR: [
          { fullName: { contains: search, mode: 'insensitive' as const } },
          { email: { contains: search, mode: 'insensitive' as const } },
          { matricNumber: { contains: search, mode: 'insensitive' as const } },
        ],
      }),
    };

    const [items, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true, fullName: true, email: true, matricNumber: true, role: true,
          level: true, isVerified: true, createdAt: true,
          department: { select: { name: true, shortCode: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.user.count({ where }),
    ]);

    return { items, total, page, limit };
  },
};
