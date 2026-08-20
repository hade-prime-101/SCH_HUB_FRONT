import { prisma } from '@/config/prisma.js';
import type { AuditAction, Prisma } from '@prisma/client';

interface AuditParams {
  action: AuditAction;
  performedById: string;
  targetUserId?: string;
  targetId?: string;
  targetType?: string;
  meta?: Prisma.InputJsonValue;
  ipAddress?: string;
}

export const auditService = {
  async log(params: AuditParams) {
    await prisma.auditLog.create({ data: params });
  },

  // SUPER_ADMIN only — full log access
  async listLogs(filters: {
    action?: AuditAction;
    performedById?: string;
    targetUserId?: string;
    from?: Date;
    to?: Date;
    page: number;
    limit: number;
  }) {
    const { action, performedById, targetUserId, from, to, page, limit } = filters;
    const skip = (page - 1) * limit;

    const where = {
      ...(action && { action }),
      ...(performedById && { performedById }),
      ...(targetUserId && { targetUserId }),
      ...((from || to) && {
        createdAt: {
          ...(from && { gte: from }),
          ...(to && { lte: to }),
        },
      }),
    };

    const [items, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        include: {
          performedBy: { select: { id: true, fullName: true, email: true, role: true } },
          targetUser: { select: { id: true, fullName: true, email: true, role: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.auditLog.count({ where }),
    ]);

    return { items, total, page, limit };
  },

  // SCHOOL_ADMIN — logs scoped to actions performed within their school
  async listLogsForSchool(filters: {
    schoolId: string;
    action?: AuditAction;
    performedById?: string;
    targetUserId?: string;
    from?: Date;
    to?: Date;
    page: number;
    limit: number;
  }) {
    const { schoolId, action, performedById, targetUserId, from, to, page, limit } = filters;
    const skip = (page - 1) * limit;

    const where = {
      performedBy: { schoolId },
      ...(action && { action }),
      ...(performedById && { performedById }),
      ...(targetUserId && { targetUserId }),
      ...((from || to) && {
        createdAt: {
          ...(from && { gte: from }),
          ...(to && { lte: to }),
        },
      }),
    };

    const [items, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        include: {
          performedBy: { select: { id: true, fullName: true, email: true, role: true } },
          targetUser: { select: { id: true, fullName: true, email: true, role: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.auditLog.count({ where }),
    ]);

    return { items, total, page, limit };
  },
};
