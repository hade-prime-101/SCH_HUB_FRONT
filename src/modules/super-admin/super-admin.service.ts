import bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';
import { prisma } from '@/config/prisma.js';
import { AppError } from '@/utils/response.js';
import { auditService } from './audit.service.js';
import type { z } from 'zod';
import type {
  createAdminSchema,
  resetAdminPasswordSchema,
  createSchoolSchema,
  updateSchoolSchema,
} from './super-admin.validators.js';

type CreateAdminInput = z.infer<typeof createAdminSchema>;
type ResetPasswordInput = z.infer<typeof resetAdminPasswordSchema>;
type CreateSchoolInput = z.infer<typeof createSchoolSchema>;
type UpdateSchoolInput = z.infer<typeof updateSchoolSchema>;

const ADMIN_SELECT = {
  id: true, fullName: true, email: true, role: true,
  isActive: true, isBlocked: true, isVerified: true, createdAt: true,
  school: { select: { id: true, name: true, shortCode: true } },
};

export const superAdminService = {
  // ── Admin management ───────────────────────────────────────

  async createAdmin(input: CreateAdminInput, performedById: string, ipAddress?: string) {
    const existing = await prisma.user.findUnique({ where: { email: input.email.toLowerCase() } });
    if (existing) throw new AppError('Email already registered', 409);

    const school = await prisma.school.findUnique({ where: { id: input.schoolId } });
    if (!school) throw new AppError('School not found', 404);

    // Admins get a placeholder dept/faculty/level — find first dept in school
    const faculty = await prisma.faculty.findFirst({ where: { schoolId: input.schoolId }, include: { departments: true } });
    if (!faculty || !faculty.departments[0]) throw new AppError('School has no departments yet', 400);

    const passwordHash = await bcrypt.hash(input.password, 12);

    const admin = await prisma.user.create({
      data: {
        fullName: input.fullName,
        email: input.email.toLowerCase(),
        matricNumber: `ADMIN-${randomUUID()}`, // placeholder — admins don't have matric numbers
        passwordHash,
        role: 'SCHOOL_ADMIN',
        level: 'N/A',
        schoolId: input.schoolId,
        facultyId: faculty.id,
        departmentId: faculty.departments[0].id,
        isVerified: true, // admins are pre-verified
        isActive: true,
      },
      select: ADMIN_SELECT,
    });

    await auditService.log({
      action: 'ADMIN_CREATED',
      performedById,
      targetUserId: admin.id,
      targetId: input.schoolId,
      targetType: 'School',
      meta: { email: admin.email, role: admin.role, schoolName: school.name },
      ipAddress,
    });

    return admin;
  },

  async listAdmins(schoolId?: string) {
    return prisma.user.findMany({
      where: {
        role: { in: ['SCHOOL_ADMIN', 'SUPER_ADMIN'] },
        isDeleted: false,
        ...(schoolId && { schoolId }),
      },
      select: ADMIN_SELECT,
      orderBy: { createdAt: 'desc' },
    });
  },

  // ── School-admin scoped operations ────────────────────────

  async listSchoolUsers(schoolId: string, page = 1, limit = 50, search?: string, role?: string) {
    const skip = (page - 1) * limit;
    const where = {
      schoolId,
      isDeleted: false,
      ...(role && { role: role as any }),
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
          id: true, fullName: true, email: true, matricNumber: true,
          role: true, level: true, isActive: true, isBlocked: true,
          isVerified: true, createdAt: true,
          department: { select: { id: true, name: true, shortCode: true } },
          faculty: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.user.count({ where }),
    ]);
    return { items, total, page, limit, pages: Math.ceil(total / limit) };
  },

  async blockUserInSchool(targetId: string, performedById: string, schoolId: string, ipAddress?: string) {
    const target = await prisma.user.findUnique({ where: { id: targetId } });
    if (!target) throw new AppError('User not found', 404);
    if (target.schoolId !== schoolId) throw new AppError('User not found', 404);
    if (['SCHOOL_ADMIN', 'SUPER_ADMIN'].includes(target.role)) {
      throw new AppError('Cannot block admin accounts', 403);
    }
    await prisma.user.update({
      where: { id: targetId },
      data: { isBlocked: true, blockedAt: new Date(), blockedById: performedById },
    });
    await auditService.log({
      action: 'USER_BLOCKED', performedById, targetUserId: targetId,
      meta: { email: target.email }, ipAddress,
    });
    return { blocked: true };
  },

  async unblockUserInSchool(targetId: string, performedById: string, schoolId: string, ipAddress?: string) {
    const target = await prisma.user.findUnique({ where: { id: targetId } });
    if (!target) throw new AppError('User not found', 404);
    if (target.schoolId !== schoolId) throw new AppError('User not found', 404);
    await prisma.user.update({
      where: { id: targetId },
      data: { isBlocked: false, blockedAt: null, blockedById: null },
    });
    await auditService.log({
      action: 'USER_UNBLOCKED', performedById, targetUserId: targetId,
      meta: { email: target.email }, ipAddress,
    });
    return { unblocked: true };
  },

  async getSchoolStats(schoolId: string) {
    const [
      totalUsers, totalAgents, pendingAgents,
      totalListings, pendingListings, flaggedListings,
      pendingServices, pendingJobs,
      totalAccommodation, openReports,
    ] = await Promise.all([
      prisma.user.count({ where: { schoolId, isDeleted: false, role: 'STUDENT' } }),
      prisma.user.count({ where: { schoolId, isDeleted: false, role: 'HOUSE_AGENT' } }),
      prisma.agentProfile.count({ where: { status: 'PENDING', user: { schoolId } } }),
      prisma.listing.count({ where: { isDeleted: false, seller: { schoolId } } }),
      prisma.listing.count({ where: { isDeleted: false, approvalStatus: 'PENDING', seller: { schoolId } } }),
      prisma.listing.count({ where: { isDeleted: false, isFlagged: true, seller: { schoolId } } }),
      prisma.serviceListing.count({ where: { schoolId, isDeleted: false, approvalStatus: 'PENDING' } }),
      prisma.jobListing.count({ where: { schoolId, isDeleted: false, approvalStatus: 'PENDING' } }),
      prisma.accommodationPost.count({ where: { schoolId, isDeleted: false } }),
      prisma.marketplaceReport.count({
        where: {
          isResolved: false,
          OR: [
            { listing: { seller: { schoolId } } },
            { accommodation: { schoolId } },
            { service: { schoolId } },
          ],
        },
      }),
    ]);
    return {
      users: { total: totalUsers, agents: totalAgents, pendingAgents },
      marketplace: { totalListings, pendingListings, flaggedListings, pendingServices, pendingJobs, totalAccommodation },
      reports: { open: openReports },
    };
  },

  async listAllAgents(schoolId: string, status?: string) {
    return prisma.agentProfile.findMany({
      where: {
        user: { schoolId },
        ...(status && { status: status as any }),
      },
      select: {
        id: true,
        businessName: true,
        businessAddress: true,
        phoneNumber: true,
        status: true,
        rejectionReason: true,
        reviewedAt: true,
        createdAt: true,
        updatedAt: true,
        user: { select: { id: true, fullName: true, email: true, matricNumber: true, role: true } },
        reviewedBy: { select: { id: true, fullName: true } },
      },
      orderBy: { updatedAt: 'desc' },
    });
  },

  async revokeAgent(agentUserId: string, adminId: string, schoolId: string, note?: string, ipAddress?: string) {
    const profile = await prisma.agentProfile.findUnique({
      where: { userId: agentUserId },
      include: { user: { select: { schoolId: true } } },
    });
    if (!profile || profile.user.schoolId !== schoolId) throw new AppError('Agent not found', 404);
    if (profile.status !== 'APPROVED') throw new AppError('Agent is not currently approved', 400);

    await prisma.$transaction([
      prisma.agentProfile.update({
        where: { userId: agentUserId },
        data: { status: 'REJECTED', rejectionReason: note ?? 'Agent status revoked by admin', reviewedById: adminId, reviewedAt: new Date() },
      }),
      prisma.user.update({ where: { id: agentUserId }, data: { role: 'STUDENT' } }),
    ]);

    await auditService.log({
      action: 'AGENT_REJECTED', performedById: adminId, targetId: agentUserId,
      targetType: 'User', meta: { note, revoked: true }, ipAddress,
    }).catch(() => null);

    return { revoked: true };
  },

  // ── School structure (read-only for school admin) ─────────────────

  async getSchoolFaculties(schoolId: string) {
    return prisma.faculty.findMany({
      where: { schoolId },
      include: { _count: { select: { departments: true, users: true } } },
      orderBy: { name: 'asc' },
    });
  },

  async getSchoolDepartments(schoolId: string, facultyId?: string) {
    return prisma.department.findMany({
      where: { faculty: { schoolId }, ...(facultyId && { facultyId }) },
      include: {
        faculty: { select: { id: true, name: true } },
        _count: { select: { users: true } },
      },
      orderBy: { name: 'asc' },
    });
  },

  // ── Freshers FAQ management ───────────────────────────────

  async listFaqs(schoolId: string) {
    return prisma.freshersFaq.findMany({
      where: { schoolId, isActive: true },
      orderBy: [{ category: 'asc' }, { order: 'asc' }],
    });
  },

  async createFaq(schoolId: string, data: { question: string; answer: string; category?: string; order?: number }) {
    return prisma.freshersFaq.create({
      data: {
        question: data.question,
        answer: data.answer,
        category: data.category ?? 'general',
        order: data.order ?? 0,
        schoolId,
      },
    });
  },

  async updateFaq(faqId: string, schoolId: string, data: { question?: string; answer?: string; category?: string; order?: number; isActive?: boolean }) {
    const faq = await prisma.freshersFaq.findUnique({ where: { id: faqId } });
    if (!faq || faq.schoolId !== schoolId) throw new AppError('FAQ not found', 404);
    return prisma.freshersFaq.update({ where: { id: faqId }, data });
  },

  async deleteFaq(faqId: string, schoolId: string) {
    const faq = await prisma.freshersFaq.findUnique({ where: { id: faqId } });
    if (!faq || faq.schoolId !== schoolId) throw new AppError('FAQ not found', 404);
    await prisma.freshersFaq.delete({ where: { id: faqId } });
    return { deleted: true };
  },

  async deleteAdmin(targetId: string, performedById: string, ipAddress?: string) {
    const target = await prisma.user.findUnique({ where: { id: targetId } });
    if (!target) throw new AppError('Admin not found', 404);
    if (target.role === 'SUPER_ADMIN') throw new AppError('Cannot delete a SUPER_ADMIN', 403);
    if (!['SCHOOL_ADMIN'].includes(target.role)) throw new AppError('Target is not an admin', 400);

    await prisma.user.update({ where: { id: targetId }, data: { isDeleted: true, deletedAt: new Date() } });

    await auditService.log({
      action: 'ADMIN_DELETED',
      performedById,
      targetUserId: targetId,
      meta: { email: target.email },
      ipAddress,
    });

    return { deleted: true };
  },

  async deactivateAdmin(targetId: string, performedById: string, ipAddress?: string) {
    const target = await prisma.user.findUnique({ where: { id: targetId } });
    if (!target) throw new AppError('Admin not found', 404);
    if (target.role === 'SUPER_ADMIN') throw new AppError('Cannot deactivate a SUPER_ADMIN', 403);

    await prisma.user.update({ where: { id: targetId }, data: { isActive: false } });

    await auditService.log({
      action: 'ADMIN_DEACTIVATED',
      performedById,
      targetUserId: targetId,
      meta: { email: target.email },
      ipAddress,
    });

    return { deactivated: true };
  },

  async reactivateAdmin(targetId: string, performedById: string, ipAddress?: string) {
    const target = await prisma.user.findUnique({ where: { id: targetId } });
    if (!target) throw new AppError('Admin not found', 404);

    await prisma.user.update({ where: { id: targetId }, data: { isActive: true } });

    await auditService.log({
      action: 'ADMIN_REACTIVATED',
      performedById,
      targetUserId: targetId,
      meta: { email: target.email },
      ipAddress,
    });

    return { reactivated: true };
  },

  async resetAdminPassword(targetId: string, input: ResetPasswordInput, performedById: string, ipAddress?: string) {
    const target = await prisma.user.findUnique({ where: { id: targetId } });
    if (!target) throw new AppError('Admin not found', 404);
    if (target.role === 'SUPER_ADMIN') throw new AppError('Cannot reset a SUPER_ADMIN password this way', 403);

    const passwordHash = await bcrypt.hash(input.newPassword, 12);

    await prisma.$transaction([
      prisma.user.update({ where: { id: targetId }, data: { passwordHash } }),
      prisma.refreshToken.deleteMany({ where: { userId: targetId } }),
    ]);

    await auditService.log({
      action: 'ADMIN_PASSWORD_RESET',
      performedById,
      targetUserId: targetId,
      meta: { email: target.email },
      ipAddress,
    });

    return { reset: true };
  },

  // ── User management (block/unblock) ───────────────────────

  async blockUser(targetId: string, performedById: string, ipAddress?: string) {
    const target = await prisma.user.findUnique({ where: { id: targetId } });
    if (!target) throw new AppError('User not found', 404);
    if (['SCHOOL_ADMIN', 'SUPER_ADMIN'].includes(target.role)) {
      throw new AppError('Cannot block admin accounts this way', 403);
    }

    await prisma.user.update({
      where: { id: targetId },
      data: { isBlocked: true, blockedAt: new Date(), blockedById: performedById },
    });

    await auditService.log({
      action: 'USER_BLOCKED',
      performedById,
      targetUserId: targetId,
      meta: { email: target.email },
      ipAddress,
    });

    return { blocked: true };
  },

  async unblockUser(targetId: string, performedById: string, ipAddress?: string) {
    const target = await prisma.user.findUnique({ where: { id: targetId } });
    if (!target) throw new AppError('User not found', 404);

    await prisma.user.update({
      where: { id: targetId },
      data: { isBlocked: false, blockedAt: null, blockedById: null },
    });

    await auditService.log({
      action: 'USER_UNBLOCKED',
      performedById,
      targetUserId: targetId,
      meta: { email: target.email },
      ipAddress,
    });

    return { unblocked: true };
  },

  // ── School management ──────────────────────────────────────

  async createSchool(input: CreateSchoolInput, performedById: string, ipAddress?: string) {
    const existing = await prisma.school.findUnique({ where: { shortCode: input.shortCode } });
    if (existing) throw new AppError('School short code already exists', 409);

    const school = await prisma.school.create({ data: input });

    await auditService.log({
      action: 'SCHOOL_CREATED',
      performedById,
      targetId: school.id,
      targetType: 'School',
      meta: { name: school.name, shortCode: school.shortCode },
      ipAddress,
    });

    return school;
  },

  async updateSchool(schoolId: string, input: UpdateSchoolInput, performedById: string, ipAddress?: string) {
    const school = await prisma.school.findUnique({ where: { id: schoolId } });
    if (!school) throw new AppError('School not found', 404);

    const updated = await prisma.school.update({ where: { id: schoolId }, data: input });

    await auditService.log({
      action: 'SCHOOL_UPDATED',
      performedById,
      targetId: schoolId,
      targetType: 'School',
      meta: input,
      ipAddress,
    });

    return updated;
  },

  async listAllSchools() {
    return prisma.school.findMany({
      orderBy: { name: 'asc' },
      include: {
        _count: { select: { users: true, faculties: true } },
      },
    });
  },

  // ── Faculty management ─────────────────────────────────────

  async createFaculty(schoolId: string, name: string) {
    const school = await prisma.school.findUnique({ where: { id: schoolId } });
    if (!school) throw new AppError('School not found', 404);

    const existing = await prisma.faculty.findFirst({ where: { name, schoolId } });
    if (existing) throw new AppError('Faculty already exists in this school', 409);

    return prisma.faculty.create({ data: { name, schoolId } });
  },

  async listFaculties(schoolId: string) {
    return prisma.faculty.findMany({
      where: { schoolId },
      include: { _count: { select: { departments: true, users: true } } },
      orderBy: { name: 'asc' },
    });
  },

  async deleteFaculty(facultyId: string) {
    const faculty = await prisma.faculty.findUnique({ where: { id: facultyId }, include: { _count: { select: { users: true } } } });
    if (!faculty) throw new AppError('Faculty not found', 404);
    if (faculty._count.users > 0) throw new AppError('Cannot delete faculty with active users', 400);
    await prisma.faculty.delete({ where: { id: facultyId } });
    return { deleted: true };
  },

  // ── Department management ─────────────────────────────────

  async createDepartment(facultyId: string, name: string, shortCode: string) {
    const faculty = await prisma.faculty.findUnique({ where: { id: facultyId } });
    if (!faculty) throw new AppError('Faculty not found', 404);

    const existing = await prisma.department.findFirst({ where: { shortCode, facultyId } });
    if (existing) throw new AppError('Department short code already exists in this faculty', 409);

    return prisma.department.create({ data: { name, shortCode, facultyId } });
  },

  async listDepartments(facultyId: string) {
    return prisma.department.findMany({
      where: { facultyId },
      include: { _count: { select: { users: true } } },
      orderBy: { name: 'asc' },
    });
  },

  async deleteDepartment(departmentId: string) {
    const dept = await prisma.department.findUnique({ where: { id: departmentId }, include: { _count: { select: { users: true } } } });
    if (!dept) throw new AppError('Department not found', 404);
    if (dept._count.users > 0) throw new AppError('Cannot delete department with active users', 400);
    await prisma.department.delete({ where: { id: departmentId } });
    return { deleted: true };
  },

  // ── Platform analytics ─────────────────────────────────────

  async getPlatformStats() {
    const [
      totalUsers, totalAdmins, totalSchools, totalMaterials,
      totalListings, totalPosts, totalQuizzes, recentAuditLogs,
    ] = await Promise.all([
      prisma.user.count({ where: { isDeleted: false, role: 'STUDENT' } }),
      prisma.user.count({ where: { role: { in: ['SCHOOL_ADMIN', 'SUPER_ADMIN'] } } }),
      prisma.school.count({ where: { isActive: true } }),
      prisma.material.count({ where: { isDeleted: false } }),
      prisma.listing.count({ where: { isDeleted: false } }),
      prisma.communityPost.count({ where: { isDeleted: false } }),
      prisma.quiz.count({ where: { isActive: true } }),
      prisma.auditLog.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: {
          performedBy: { select: { id: true, fullName: true, role: true } },
          targetUser: { select: { id: true, fullName: true } },
        },
      }),
    ]);

    return {
      totalUsers, totalAdmins, totalSchools, totalMaterials,
      totalListings, totalPosts, totalQuizzes, recentAuditLogs,
    };
  },
};
