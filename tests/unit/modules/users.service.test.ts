import { prismaMock, mockUser } from '../../helpers/mock-factories';

jest.mock('@/config/r2', () => ({
  r2: {
    upload: jest.fn().mockResolvedValue({ url: 'https://r2.example.com/avatar.jpg' }),
    delete: jest.fn().mockResolvedValue(undefined),
  },
}));

import { usersService } from '@/modules/users/users.service';

const base = () => mockUser({
  schoolId     : 'school-1',
  departmentId : 'dept-1',
  level        : '100',
  receivedRatings: [],
});

// ── getProfile ────────────────────────────────────────────────────────────

describe('usersService.getProfile()', () => {
  it('throws 404 when user not found', async () => {
    prismaMock.user.findUnique.mockResolvedValue(null);
    await expect(usersService.getProfile('missing')).rejects.toMatchObject({ statusCode: 404 });
  });

  it('returns user with null sellerRating when no ratings', async () => {
    prismaMock.user.findUnique.mockResolvedValue({ ...base(), receivedRatings: [] } as any);
    const result = await usersService.getProfile('u-1');
    expect(result.sellerRating).toBeNull();
  });

  it('returns averaged sellerRating when ratings exist', async () => {
    prismaMock.user.findUnique.mockResolvedValue({
      ...base(),
      receivedRatings: [{ rating: 4 }, { rating: 2 }],
    } as any);
    const result = await usersService.getProfile('u-1');
    expect(result.sellerRating).toBe(3);
  });
});

// ── updateProfile ─────────────────────────────────────────────────────────

describe('usersService.updateProfile()', () => {
  it('updates and returns user', async () => {
    const user = base();
    prismaMock.user.update.mockResolvedValue(user as any);
    const result = await usersService.updateProfile('u-1', { fullName: 'New Name' });
    expect(result).toMatchObject({ id: user.id });
  });
});

// ── updateSettings ────────────────────────────────────────────────────────

describe('usersService.updateSettings()', () => {
  it('upserts and returns settings', async () => {
    const settings = { userId: 'u-1', pushNotifications: true };
    prismaMock.userSettings.upsert.mockResolvedValue(settings as any);
    const result = await usersService.updateSettings('u-1', { pushNotifications: true });
    expect(result).toMatchObject(settings);
  });
});

// ── registerFcmToken ──────────────────────────────────────────────────────

describe('usersService.registerFcmToken()', () => {
  it('registers token and subscribes to topics', async () => {
    prismaMock.user.update.mockResolvedValue({
      schoolId: 'school-1', departmentId: 'dept-1',
    } as any);
    const result = await usersService.registerFcmToken('u-1', 'fcm-token-abc');
    expect(result.registered).toBe(true);
    expect(result.topics).toHaveLength(2);
  });
});

// ── getBookmarks ──────────────────────────────────────────────────────────

describe('usersService.getBookmarks()', () => {
  it('returns bookmarks list', async () => {
    prismaMock.bookmark.findMany.mockResolvedValue([{ id: 'b-1' }] as any);
    const result = await usersService.getBookmarks('u-1');
    expect(result).toHaveLength(1);
  });
});

// ── getMaterials ──────────────────────────────────────────────────────────

describe('usersService.getMaterials()', () => {
  it('returns materials list', async () => {
    prismaMock.material.findMany.mockResolvedValue([{ id: 'm-1' }, { id: 'm-2' }] as any);
    const result = await usersService.getMaterials('u-1');
    expect(result).toHaveLength(2);
  });
});

// ── getSessions ───────────────────────────────────────────────────────────

describe('usersService.getSessions()', () => {
  it('returns active sessions', async () => {
    prismaMock.refreshToken.findMany.mockResolvedValue([{ id: 's-1' }] as any);
    const result = await usersService.getSessions('u-1');
    expect(result).toHaveLength(1);
  });
});

// ── revokeSession ─────────────────────────────────────────────────────────

describe('usersService.revokeSession()', () => {
  it('throws 404 when session not found', async () => {
    prismaMock.refreshToken.findUnique.mockResolvedValue(null);
    await expect(usersService.revokeSession('u-1', 's-missing'))
      .rejects.toMatchObject({ statusCode: 404 });
  });

  it('throws 404 when session belongs to different user', async () => {
    prismaMock.refreshToken.findUnique.mockResolvedValue({ id: 's-1', userId: 'other-user' } as any);
    await expect(usersService.revokeSession('u-1', 's-1'))
      .rejects.toMatchObject({ statusCode: 404 });
  });

  it('revokes session successfully', async () => {
    prismaMock.refreshToken.findUnique.mockResolvedValue({ id: 's-1', userId: 'u-1' } as any);
    prismaMock.refreshToken.delete.mockResolvedValue({} as any);
    const result = await usersService.revokeSession('u-1', 's-1');
    expect(result.revoked).toBe(true);
  });
});

// ── revokeAllSessions ─────────────────────────────────────────────────────

describe('usersService.revokeAllSessions()', () => {
  it('revokes all sessions', async () => {
    prismaMock.refreshToken.deleteMany.mockResolvedValue({ count: 3 });
    const result = await usersService.revokeAllSessions('u-1');
    expect(result.revoked).toBe(true);
  });
});
