import { prismaMock, mockUser } from '../../helpers/mock-factories';

jest.mock('bcryptjs', () => ({
  hash   : jest.fn().mockResolvedValue('$2a$10$hashedpassword'),
  compare: jest.fn(),
}));

import bcrypt from 'bcryptjs';
import { authService } from '@/modules/auth/auth.service';

const baseUser = () => mockUser({
  passwordHash : '$2a$10$hashedpassword',
  isDeleted    : false,
  isBlocked    : false,
  isActive     : true,
  isVerified   : true,
  schoolId     : 'school-1',
  departmentId : 'dept-1',
  level        : '100',
  role         : 'STUDENT',
  fullName     : 'Test User',
});

// ── register ──────────────────────────────────────────────────────────────

describe('authService.register()', () => {
  const input = {
    email           : 'new@test.com',
    password        : 'Password1!',
    confirmPassword : 'Password1!',
    fullName        : 'New User',
    matricNumber    : 'MAT001',
    phone           : '08000000000',
    level           : '100' as const,
    schoolId        : 'school-1',
    facultyId       : 'faculty-1',
    departmentId    : 'dept-1',
  };

  it('throws 409 when email already exists', async () => {
    prismaMock.user.findFirst.mockResolvedValue(baseUser() as any);
    await expect(authService.register(input)).rejects.toMatchObject({ statusCode: 409 });
  });

  it('throws 404 when department not found', async () => {
    prismaMock.user.findFirst.mockResolvedValue(null);
    prismaMock.department.findUnique.mockResolvedValue(null);
    await expect(authService.register(input)).rejects.toMatchObject({ statusCode: 404 });
  });

  it('throws 400 when department does not belong to faculty', async () => {
    prismaMock.user.findFirst.mockResolvedValue(null);
    prismaMock.department.findUnique.mockResolvedValue({
      id: 'dept-1', facultyId: 'other-faculty',
      faculty: { schoolId: 'school-1' },
    } as any);
    await expect(authService.register(input)).rejects.toMatchObject({ statusCode: 400 });
  });

  it('throws 400 when faculty does not belong to school', async () => {
    prismaMock.user.findFirst.mockResolvedValue(null);
    prismaMock.department.findUnique.mockResolvedValue({
      id: 'dept-1', facultyId: 'faculty-1',
      faculty: { schoolId: 'other-school' },
    } as any);
    await expect(authService.register(input)).rejects.toMatchObject({ statusCode: 400 });
  });

  it('creates user and returns tokens on success', async () => {
    const user = baseUser();
    prismaMock.user.findFirst.mockResolvedValue(null);
    prismaMock.department.findUnique.mockResolvedValue({
      id: 'dept-1', facultyId: 'faculty-1',
      faculty: { schoolId: 'school-1' },
    } as any);
    prismaMock.user.create.mockResolvedValue({ ...user, id: 'new-user-id' } as any);
    prismaMock.oTPCode.updateMany.mockResolvedValue({ count: 0 });
    prismaMock.oTPCode.create.mockResolvedValue({} as any);
    prismaMock.refreshToken.create.mockResolvedValue({} as any);

    const result = await authService.register(input);
    expect(result).toHaveProperty('tokens');
    expect(result.tokens).toHaveProperty('accessToken');
    expect(result.tokens).toHaveProperty('refreshToken');
  });
});

// ── login ─────────────────────────────────────────────────────────────────

describe('authService.login()', () => {
  it('throws 401 when user not found', async () => {
    prismaMock.user.findUnique.mockResolvedValue(null);
    (bcrypt.compare as jest.Mock).mockResolvedValue(false);
    await expect(authService.login({ email: 'x@x.com', password: 'wrong' }))
      .rejects.toMatchObject({ statusCode: 401 });
  });

  it('throws 401 when password is wrong', async () => {
    prismaMock.user.findUnique.mockResolvedValue(baseUser() as any);
    (bcrypt.compare as jest.Mock).mockResolvedValue(false);
    await expect(authService.login({ email: 'x@x.com', password: 'wrong' }))
      .rejects.toMatchObject({ statusCode: 401 });
  });

  it('throws 404 when user is deleted', async () => {
    prismaMock.user.findUnique.mockResolvedValue({ ...baseUser(), isDeleted: true } as any);
    (bcrypt.compare as jest.Mock).mockResolvedValue(true);
    await expect(authService.login({ email: 'x@x.com', password: 'pass' }))
      .rejects.toMatchObject({ statusCode: 404 });
  });

  it('throws 403 when user is blocked', async () => {
    prismaMock.user.findUnique.mockResolvedValue({ ...baseUser(), isBlocked: true } as any);
    (bcrypt.compare as jest.Mock).mockResolvedValue(true);
    await expect(authService.login({ email: 'x@x.com', password: 'pass' }))
      .rejects.toMatchObject({ statusCode: 403 });
  });

  it('throws 403 when student is not verified', async () => {
    prismaMock.user.findUnique.mockResolvedValue({ ...baseUser(), isVerified: false } as any);
    (bcrypt.compare as jest.Mock).mockResolvedValue(true);
    prismaMock.oTPCode.updateMany.mockResolvedValue({ count: 0 });
    prismaMock.oTPCode.create.mockResolvedValue({} as any);
    await expect(authService.login({ email: 'x@x.com', password: 'pass' }))
      .rejects.toMatchObject({ statusCode: 403 });
  });

  it('returns tokens and dashboardRedirect on success', async () => {
    prismaMock.user.findUnique.mockResolvedValue(baseUser() as any);
    (bcrypt.compare as jest.Mock).mockResolvedValue(true);
    prismaMock.refreshToken.create.mockResolvedValue({} as any);

    const result = await authService.login({ email: 'x@x.com', password: 'pass' });
    expect(result).toHaveProperty('accessToken');
    expect(result).toHaveProperty('dashboardRedirect', 'mobile_app');
  });
});

// ── refresh ───────────────────────────────────────────────────────────────

describe('authService.refresh()', () => {
  it('throws 401 when token not found', async () => {
    prismaMock.refreshToken.findUnique.mockResolvedValue(null);
    await expect(authService.refresh({ refreshToken: 'bad-token' }))
      .rejects.toMatchObject({ statusCode: 401 });
  });

  it('throws 401 when token is expired', async () => {
    prismaMock.refreshToken.findUnique.mockResolvedValue({
      token: 'tok', expiresAt: new Date(Date.now() - 1000),
      user: baseUser(),
    } as any);
    await expect(authService.refresh({ refreshToken: 'tok' }))
      .rejects.toMatchObject({ statusCode: 401 });
  });

  it('returns new tokens on valid refresh', async () => {
    prismaMock.refreshToken.findUnique.mockResolvedValue({
      token: 'tok', expiresAt: new Date(Date.now() + 100000),
      user: baseUser(),
    } as any);
    prismaMock.refreshToken.delete.mockResolvedValue({} as any);
    prismaMock.refreshToken.create.mockResolvedValue({} as any);

    const result = await authService.refresh({ refreshToken: 'tok' });
    expect(result).toHaveProperty('accessToken');
    expect(result).toHaveProperty('refreshToken');
  });
});

// ── forgotPassword ────────────────────────────────────────────────────────

describe('authService.forgotPassword()', () => {
  it('returns success message even when user not found (anti-enumeration)', async () => {
    prismaMock.user.findUnique.mockResolvedValue(null);
    const result = await authService.forgotPassword({ email: 'ghost@test.com' });
    expect(result.message).toContain('If that email exists');
  });

  it('sends OTP when user exists', async () => {
    prismaMock.user.findUnique.mockResolvedValue(baseUser() as any);
    prismaMock.oTPCode.updateMany.mockResolvedValue({ count: 0 });
    prismaMock.oTPCode.create.mockResolvedValue({} as any);
    const result = await authService.forgotPassword({ email: 'x@x.com' });
    expect(result.message).toContain('If that email exists');
  });
});

// ── verifyOtp ─────────────────────────────────────────────────────────────

describe('authService.verifyOtp()', () => {
  it('throws 400 when user not found', async () => {
    prismaMock.user.findUnique.mockResolvedValue(null);
    await expect(authService.verifyOtp({ email: 'x@x.com', otp: '123456', type: 'EMAIL_VERIFICATION' }))
      .rejects.toMatchObject({ statusCode: 400 });
  });

  it('throws 400 when OTP not found', async () => {
    prismaMock.user.findUnique.mockResolvedValue(baseUser() as any);
    prismaMock.oTPCode.findFirst.mockResolvedValue(null);
    await expect(authService.verifyOtp({ email: 'x@x.com', otp: '000000', type: 'EMAIL_VERIFICATION' }))
      .rejects.toMatchObject({ statusCode: 400 });
  });

  it('verifies email and marks user verified', async () => {
    prismaMock.user.findUnique.mockResolvedValue(baseUser() as any);
    prismaMock.oTPCode.findFirst.mockResolvedValue({ id: 'otp-1', code: '123456' } as any);
    prismaMock.oTPCode.update.mockResolvedValue({} as any);
    prismaMock.user.update.mockResolvedValue({} as any);

    const result = await authService.verifyOtp({ email: 'x@x.com', otp: '123456', type: 'EMAIL_VERIFICATION' });
    expect(result.verified).toBe(true);
  });
});

// ── resetPassword ─────────────────────────────────────────────────────────

describe('authService.resetPassword()', () => {
  it('throws 400 when user not found', async () => {
    prismaMock.user.findUnique.mockResolvedValue(null);
    await expect(authService.resetPassword({ email: 'x@x.com', otp: '123456', password: 'NewPass1!', confirmPassword: 'NewPass1!' }))
      .rejects.toMatchObject({ statusCode: 400 });
  });

  it('throws 400 when OTP is invalid', async () => {
    prismaMock.user.findUnique.mockResolvedValue(baseUser() as any);
    prismaMock.oTPCode.findFirst.mockResolvedValue(null);
    await expect(authService.resetPassword({ email: 'x@x.com', otp: '000000', password: 'NewPass1!', confirmPassword: 'NewPass1!' }))
      .rejects.toMatchObject({ statusCode: 400 });
  });

  it('resets password successfully', async () => {
    prismaMock.user.findUnique.mockResolvedValue(baseUser() as any);
    prismaMock.oTPCode.findFirst.mockResolvedValue({ id: 'otp-1', code: '123456' } as any);
    prismaMock.$transaction.mockResolvedValue([{}, {}, {}] as any);

    const result = await authService.resetPassword({ email: 'x@x.com', otp: '123456', password: 'NewPass1!', confirmPassword: 'NewPass1!' });
    expect(result.message).toContain('Password reset successful');
  });
});

// ── resendOtp ─────────────────────────────────────────────────────────────

describe('authService.resendOtp()', () => {
  it('returns success silently when user not found', async () => {
    prismaMock.user.findUnique.mockResolvedValue(null);
    const result = await authService.resendOtp('ghost@test.com', 'EMAIL_VERIFICATION');
    expect(result.message).toContain('If that email exists');
  });

  it('throws 400 when email already verified', async () => {
    prismaMock.user.findUnique.mockResolvedValue({ ...baseUser(), isVerified: true } as any);
    await expect(authService.resendOtp('x@x.com', 'EMAIL_VERIFICATION'))
      .rejects.toMatchObject({ statusCode: 400 });
  });

  it('resends OTP successfully', async () => {
    prismaMock.user.findUnique.mockResolvedValue({ ...baseUser(), isVerified: false } as any);
    prismaMock.oTPCode.count.mockResolvedValue(0);
    prismaMock.oTPCode.updateMany.mockResolvedValue({ count: 0 });
    prismaMock.oTPCode.create.mockResolvedValue({} as any);
    const result = await authService.resendOtp('x@x.com', 'EMAIL_VERIFICATION');
    expect(result.message).toContain('OTP resent');
  });

  it('throws 429 when daily OTP limit is reached', async () => {
    prismaMock.user.findUnique.mockResolvedValue({ ...baseUser(), isVerified: false } as any);
    prismaMock.oTPCode.count.mockResolvedValue(5); // at the limit
    await expect(authService.resendOtp('x@x.com', 'EMAIL_VERIFICATION'))
      .rejects.toMatchObject({ statusCode: 429 });
  });
});
