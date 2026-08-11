import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'node:crypto';
import { prisma } from '@/config/prisma.js';
import { env } from '@/config/env.js';
import { mailer } from '@/config/mailer.js';
import { AppError } from '@/utils/response.js';
import type {
  forgotPasswordSchema,
  loginSchema,
  refreshSchema,
  registerSchema,
  resetPasswordSchema,
  verifyOtpSchema,
} from '@/modules/auth/auth.validators.js';
import type { z } from 'zod';

type RegisterInput = z.infer<typeof registerSchema>;
type LoginInput = z.infer<typeof loginSchema>;
type RefreshInput = z.infer<typeof refreshSchema>;
type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
type VerifyOtpInput = z.infer<typeof verifyOtpSchema>;
type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;

const signAccessToken = (payload: Express.User) => {
  return jwt.sign(payload as object, env.JWT_ACCESS_SECRET, {
    expiresIn: env.ACCESS_TOKEN_TTL as `${number}${'s' | 'm' | 'h' | 'd'}`,
  });
};

const signRefreshToken = (userId: string) => {
  return jwt.sign({ sub: userId }, env.JWT_REFRESH_SECRET, {
    expiresIn: `${env.REFRESH_TOKEN_TTL_DAYS}d` as `${number}d`,
  });
};

const tokenResponse = async (user: {
  id: string;
  email: string;
  role: Express.User['role'];
  schoolId: string;
  departmentId: string;
  level: string;
}) => {
  const payload = { id: user.id, email: user.email, role: user.role, schoolId: user.schoolId, departmentId: user.departmentId, level: user.level };
  const accessToken = signAccessToken(payload);
  const refreshToken = signRefreshToken(user.id);
  const expiresAt = new Date(Date.now() + env.REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000);

  await prisma.refreshToken.create({ data: { userId: user.id, token: refreshToken, expiresAt } });

  return { accessToken, refreshToken };
};

const generateOTP = () => crypto.randomInt(100000, 999999).toString();

const OTP_TTL_MINUTES = 10;

export const authService = {
  async register(input: RegisterInput) {
    const existing = await prisma.user.findFirst({
      where: { OR: [{ email: input.email.toLowerCase() }, { matricNumber: input.matricNumber }] },
    });
    if (existing) {
      if (existing.email === input.email.toLowerCase()) throw new AppError('Email already registered', 409);
      throw new AppError('Matric number already registered', 409);
    }

    const department = await prisma.department.findUnique({
      where: { id: input.departmentId },
      include: { faculty: true },
    });
    if (!department) throw new AppError('Department not found', 404);
    if (department.facultyId !== input.facultyId)
      throw new AppError('Department does not belong to selected faculty', 400);
    if (department.faculty.schoolId !== input.schoolId)
      throw new AppError('Faculty does not belong to selected school', 400);

    const passwordHash = await bcrypt.hash(input.password, 12);
    const user = await prisma.user.create({
      data: {
        fullName: input.fullName,
        email: input.email.toLowerCase(),
        phone: input.phone,
        matricNumber: input.matricNumber,
        passwordHash,
        level: input.level,
        schoolId: input.schoolId,
        facultyId: input.facultyId,
        departmentId: input.departmentId,
      },
      select: { id: true, fullName: true, email: true, role: true, level: true, schoolId: true, departmentId: true },
    });

    // Send email verification OTP
    await authService.sendOtp(user.id, user.email, user.fullName, 'EMAIL_VERIFICATION');

    return { user, tokens: await tokenResponse(user) };
  },

  async login(input: LoginInput) {
    const user = await prisma.user.findUnique({ where: { email: input.email.toLowerCase() } });

    if (!user || !(await bcrypt.compare(input.password, user.passwordHash))) {
      throw new AppError('Invalid email or password', 401);
    }

    if (user.isDeleted) throw new AppError('Account not found', 404);
    if (user.isBlocked) throw new AppError('Your account has been suspended. Contact support.', 403);
    if (!user.isActive) throw new AppError('Your account has been deactivated. Contact support.', 403);

    if (!user.isVerified && user.role === 'STUDENT') {
      await authService.sendOtp(user.id, user.email, user.fullName, 'EMAIL_VERIFICATION');
      throw new AppError('Email not verified. A new OTP has been sent to your email.', 403);
    }

    const publicUser = {
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      role: user.role,
      level: user.level,
      schoolId: user.schoolId,
      departmentId: user.departmentId,
      isVerified: user.isVerified,
    };

    const tokens = await tokenResponse(publicUser);

    // Dashboard redirect hint — frontend uses this to route after login
    const redirectMap: Record<string, string> = {
      STUDENT: 'mobile_app',
      COURSE_REP: 'course_rep_dashboard',
      AUTHORIZED_UPLOADER: 'course_rep_dashboard',
      EVENT_ORCHESTRATOR: 'event_orchestrator_dashboard',
      HOUSE_AGENT: 'house_agent_dashboard',
      SCHOOL_ADMIN: 'admin_dashboard',
      SUPER_ADMIN: 'super_admin_dashboard',
    };
    const dashboardRedirect = redirectMap[user.role] ?? 'mobile_app';

    return {
      user: publicUser,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      role: user.role,
      dashboardRedirect,
    };
  },

  async refresh(input: RefreshInput) {
    const storedToken = await prisma.refreshToken.findUnique({
      where: { token: input.refreshToken },
      include: { user: true },
    });

    if (!storedToken || storedToken.expiresAt < new Date()) {
      throw new AppError('Invalid refresh token', 401);
    }

    await prisma.refreshToken.delete({ where: { token: input.refreshToken } });
    return tokenResponse({
      id: storedToken.user.id,
      email: storedToken.user.email,
      role: storedToken.user.role,
      schoolId: storedToken.user.schoolId,
      departmentId: storedToken.user.departmentId,
      level: storedToken.user.level,
    });
  },

  async logout(refreshToken: string) {
    await prisma.refreshToken.deleteMany({ where: { token: refreshToken } });
  },

  // ── OTP helpers ──────────────────────────────────────────────

  async sendOtp(userId: string, email: string, fullName: string, type: 'EMAIL_VERIFICATION' | 'PASSWORD_RESET') {
    // ── Daily OTP limit ──────────────────────────────────────────────────
    // Max 5 OTPs of each type per user per 24-hour rolling window.
    // Counted against all OTPs ever created (used or not) — prevents
    // bypassing the check by burning through codes quickly.
    const OTP_DAILY_LIMIT   = 5;
    const OTP_WINDOW_MS     = 24 * 60 * 60 * 1000;

    const sentInWindow = await prisma.oTPCode.count({
      where: {
        userId,
        type,
        createdAt: { gt: new Date(Date.now() - OTP_WINDOW_MS) },
      },
    });

    if (sentInWindow >= OTP_DAILY_LIMIT) {
      throw new AppError(
        'Too many OTP requests. Please wait 24 hours before requesting another code.',
        429,
      );
    }

    // Invalidate any existing unused OTPs of same type
    await prisma.oTPCode.updateMany({
      where: { userId, type, usedAt: null },
      data: { usedAt: new Date() },
    });

    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + OTP_TTL_MINUTES * 60 * 1000);

    await prisma.oTPCode.create({ data: { userId, code: otp, type, expiresAt } });
    await mailer.sendOTP(email, fullName, otp, type === 'EMAIL_VERIFICATION' ? 'verification' : 'reset');
  },

  // ── Forgot password ──────────────────────────────────────────

  async forgotPassword(input: ForgotPasswordInput) {
    const user = await prisma.user.findUnique({ where: { email: input.email.toLowerCase() } });

    // Always return success to prevent email enumeration
    if (!user || user.isDeleted) return { message: 'If that email exists, an OTP has been sent.' };

    await authService.sendOtp(user.id, user.email, user.fullName, 'PASSWORD_RESET');
    return { message: 'If that email exists, an OTP has been sent.' };
  },

  // ── Verify OTP ───────────────────────────────────────────────

  async verifyOtp(input: VerifyOtpInput) {
    const user = await prisma.user.findUnique({ where: { email: input.email.toLowerCase() } });
    if (!user) throw new AppError('Invalid OTP', 400);

    const otpRecord = await prisma.oTPCode.findFirst({
      where: {
        userId: user.id,
        type: input.type,
        usedAt: null,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!otpRecord || otpRecord.code !== input.otp) {
      throw new AppError('Invalid or expired OTP', 400);
    }

    if (input.type === 'EMAIL_VERIFICATION') {
      // Mark OTP as used
      await prisma.oTPCode.update({ where: { id: otpRecord.id }, data: { usedAt: new Date() } });

      // If email verification, mark user as verified
      await prisma.user.update({ where: { id: user.id }, data: { isVerified: true } });
    }

    return { verified: true };
  },

  // ── Reset password ───────────────────────────────────────────

  async resetPassword(input: ResetPasswordInput) {
    const user = await prisma.user.findUnique({ where: { email: input.email.toLowerCase() } });
    if (!user) throw new AppError('Invalid request', 400);

    const otpRecord = await prisma.oTPCode.findFirst({
      where: {
        userId: user.id,
        type: 'PASSWORD_RESET',
        usedAt: null,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!otpRecord || otpRecord.code !== input.otp) {
      throw new AppError('Invalid or expired OTP', 400);
    }

    const passwordHash = await bcrypt.hash(input.password, 12);

    await prisma.$transaction([
      prisma.oTPCode.update({ where: { id: otpRecord.id }, data: { usedAt: new Date() } }),
      prisma.user.update({ where: { id: user.id }, data: { passwordHash } }),
      // Invalidate all refresh tokens on password reset
      prisma.refreshToken.deleteMany({ where: { userId: user.id } }),
    ]);

    return { message: 'Password reset successful. Please log in.' };
  },

  // ── Resend OTP ───────────────────────────────────────────────

  async resendOtp(email: string, type: 'EMAIL_VERIFICATION' | 'PASSWORD_RESET') {
    const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (!user) return { message: 'If that email exists, an OTP has been sent.' };

    if (type === 'EMAIL_VERIFICATION' && user.isVerified) {
      throw new AppError('Email already verified', 400);
    }

    await authService.sendOtp(user.id, user.email, user.fullName, type);
    return { message: 'OTP resent successfully.' };
  },
};
