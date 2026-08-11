import { authenticate } from '@/middleware/authenticate';
import { authorize } from '@/middleware/authorize';
import { makeToken } from '../../helpers/test-app';
import type { Request, Response, NextFunction } from 'express';

const mockRes = {} as Response;
const mockNext = jest.fn() as NextFunction;

const makeReq = (authHeader?: string): Request =>
  ({ headers: { authorization: authHeader } } as unknown as Request);

// ── authenticate ──────────────────────────────────────────────────────────

describe('authenticate middleware', () => {
  it('calls next with 401 when no Authorization header', () => {
    authenticate(makeReq(), mockRes, mockNext);
    expect(mockNext).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 401 }));
  });

  it('calls next with 401 when header does not start with Bearer', () => {
    authenticate(makeReq('Basic abc123'), mockRes, mockNext);
    expect(mockNext).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 401 }));
  });

  it('calls next with 401 for invalid token', () => {
    authenticate(makeReq('Bearer invalid.token.here'), mockRes, mockNext);
    expect(mockNext).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 401 }));
  });

  it('calls next with 401 for expired token', () => {
    const jwt = require('jsonwebtoken');
    const expired = jwt.sign({ id: 'u-1' }, process.env.JWT_ACCESS_SECRET, { expiresIn: -1 });
    authenticate(makeReq(`Bearer ${expired}`), mockRes, mockNext);
    expect(mockNext).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 401 }));
  });

  it('sets req.user and calls next() for valid token', () => {
    const token = makeToken({ id: 'u-1', role: 'STUDENT' });
    const req = makeReq(`Bearer ${token}`);
    authenticate(req, mockRes, mockNext);
    expect(mockNext).toHaveBeenCalledWith();
    expect((req as any).user).toMatchObject({ id: 'u-1', role: 'STUDENT' });
  });
});

// ── authorize ─────────────────────────────────────────────────────────────

describe('authorize middleware', () => {
  const makeAuthedReq = (role: string): Request =>
    ({ user: { id: 'u-1', role } } as unknown as Request);

  it('calls next with 401 when req.user is missing', () => {
    const middleware = authorize('SCHOOL_ADMIN' as any);
    middleware({ headers: {} } as unknown as Request, mockRes, mockNext);
    expect(mockNext).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 401 }));
  });

  it('calls next with 403 when role is not allowed', () => {
    const middleware = authorize('SCHOOL_ADMIN' as any);
    middleware(makeAuthedReq('STUDENT'), mockRes, mockNext);
    expect(mockNext).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 403 }));
  });

  it('calls next() when role is allowed', () => {
    const middleware = authorize('SCHOOL_ADMIN' as any, 'SUPER_ADMIN' as any);
    middleware(makeAuthedReq('SCHOOL_ADMIN'), mockRes, mockNext);
    expect(mockNext).toHaveBeenCalledWith();
  });

  it('allows any of multiple roles', () => {
    const middleware = authorize('COURSE_REP' as any, 'STUDENT' as any);
    middleware(makeAuthedReq('STUDENT'), mockRes, mockNext);
    expect(mockNext).toHaveBeenCalledWith();
  });
});
