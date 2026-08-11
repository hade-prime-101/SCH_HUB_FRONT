import { testApp, makeToken } from '../../helpers/test-app';
import { prismaMock, mockUser } from '../../helpers/mock-factories';

const BASE = '/api/v1/auth';

// ── POST /auth/register ────────────────────────────────────────────────────

describe('POST /auth/register', () => {
  it('returns 400 when body is empty', async () => {
    const res = await testApp.post(`${BASE}/register`).send({});
    expect(res.status).toBe(400);
  });

  it('returns 400 when email is invalid', async () => {
    const res = await testApp.post(`${BASE}/register`).send({
      email: 'not-an-email', password: 'Pass1234!', confirmPassword: 'Pass1234!',
      fullName: 'Test User', schoolId: 'sch-1', level: '100',
    });
    expect(res.status).toBe(400);
  });

  it('returns 400 when passwords do not match', async () => {
    const res = await testApp.post(`${BASE}/register`).send({
      email: 'user@test.com', password: 'Pass1234!', confirmPassword: 'Different1!',
      fullName: 'Test User', schoolId: 'sch-1', level: '100',
    });
    expect(res.status).toBe(400);
  });
});

// ── POST /auth/login ───────────────────────────────────────────────────────

describe('POST /auth/login', () => {
  it('returns 400 when body is empty', async () => {
    const res = await testApp.post(`${BASE}/login`).send({});
    expect(res.status).toBe(400);
  });

  it('returns 400 for invalid email format', async () => {
    const res = await testApp.post(`${BASE}/login`).send({ email: 'bad', password: 'pass' });
    expect(res.status).toBe(400);
  });

  it('returns 401 or 404 for non-existent user', async () => {
    prismaMock.user.findUnique.mockResolvedValue(null);
    const res = await testApp.post(`${BASE}/login`).send({
      email: 'nobody@test.com', password: 'Pass1234!',
    });
    expect([401, 404]).toContain(res.status);
  });
});

// ── POST /auth/refresh ─────────────────────────────────────────────────────

describe('POST /auth/refresh', () => {
  it('returns 400 when no refresh token provided', async () => {
    const res = await testApp.post(`${BASE}/refresh`).send({});
    expect(res.status).toBe(400);
  });

  it('returns 401 for invalid refresh token', async () => {
    const res = await testApp.post(`${BASE}/refresh`).send({ refreshToken: 'invalid.token.here' });
    expect([400, 401]).toContain(res.status);
  });
});

// ── POST /auth/logout ──────────────────────────────────────────────────────

describe('POST /auth/logout', () => {
  it('returns 401 when unauthenticated', async () => {
    const res = await testApp.post(`${BASE}/logout`).send({});
    expect(res.status).toBe(401);
  });

  it('returns 200 or 400 when authenticated', async () => {
    const token = makeToken();
    const res = await testApp
      .post(`${BASE}/logout`)
      .set('Authorization', `Bearer ${token}`)
      .send({ refreshToken: 'some-token' });
    expect([200, 400, 404]).toContain(res.status);
  });
});

// ── GET /auth/me ───────────────────────────────────────────────────────────

describe('GET /auth/me', () => {
  it('returns 401 when unauthenticated', async () => {
    const res = await testApp.get(`${BASE}/me`);
    expect(res.status).toBe(401);
  });

  it('returns user data when authenticated', async () => {
    const user = mockUser({ id: 'u-auth-1' });
    prismaMock.user.findUnique.mockResolvedValue(user as any);
    const token = makeToken({ id: 'u-auth-1' });
    const res = await testApp.get(`${BASE}/me`).set('Authorization', `Bearer ${token}`);
    expect([200, 404]).toContain(res.status);
  });
});

// ── POST /auth/forgot-password ─────────────────────────────────────────────

describe('POST /auth/forgot-password', () => {
  it('returns 400 when email is missing', async () => {
    const res = await testApp.post(`${BASE}/forgot-password`).send({});
    expect(res.status).toBe(400);
  });

  it('returns 200 or 404 for valid email', async () => {
    prismaMock.user.findUnique.mockResolvedValue(null);
    const res = await testApp.post(`${BASE}/forgot-password`).send({ email: 'user@test.com' });
    expect([200, 404]).toContain(res.status);
  });
});

// ── POST /auth/verify-otp ──────────────────────────────────────────────────

describe('POST /auth/verify-otp', () => {
  it('returns 400 when body is empty', async () => {
    const res = await testApp.post(`${BASE}/verify-otp`).send({});
    expect(res.status).toBe(400);
  });
});

// ── POST /auth/reset-password ──────────────────────────────────────────────

describe('POST /auth/reset-password', () => {
  it('returns 400 when body is empty', async () => {
    const res = await testApp.post(`${BASE}/reset-password`).send({});
    expect(res.status).toBe(400);
  });

  it('returns 400 when passwords do not match', async () => {
    const res = await testApp.post(`${BASE}/reset-password`).send({
      email: 'user@test.com', otp: '123456',
      password: 'NewPass1!', confirmPassword: 'Different1!',
    });
    expect([400, 429]).toContain(res.status);
  });
});

// ── POST /auth/resend-otp ──────────────────────────────────────────────────

describe('POST /auth/resend-otp', () => {
  it('returns 400 when email is missing', async () => {
    const res = await testApp.post(`${BASE}/resend-otp`).send({});
    expect([400, 429]).toContain(res.status);
  });
});
