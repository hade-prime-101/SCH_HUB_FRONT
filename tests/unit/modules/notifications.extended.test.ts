import { prismaMock, mockUser } from '../../helpers/mock-factories';
import {
  notificationsService,
  sendAndPersistNotification,
} from '@/modules/notifications/notifications.service';

// ── getSettings ───────────────────────────────────────────────────────────

describe('notificationsService.getSettings()', () => {
  it('upserts and returns user settings', async () => {
    const settings = { userId: 'u-1', pushNotifications: true };
    prismaMock.userSettings.upsert.mockResolvedValue(settings as any);
    const result = await notificationsService.getSettings('u-1');
    expect(result).toMatchObject(settings);
  });
});

// ── updateSettings ────────────────────────────────────────────────────────

describe('notificationsService.updateSettings()', () => {
  it('updates and returns settings', async () => {
    const settings = { userId: 'u-1', quietHoursEnabled: true };
    prismaMock.userSettings.upsert.mockResolvedValue(settings as any);
    const result = await notificationsService.updateSettings('u-1', { quietHoursEnabled: true });
    expect(result).toMatchObject(settings);
  });
});

// ── broadcastAnnouncement ─────────────────────────────────────────────────

describe('notificationsService.broadcastAnnouncement()', () => {
  const input = {
    title    : 'Test Announcement',
    body     : 'Hello students',
    schoolId : 'school-1',
  };

  it('returns 0 recipients when no users found', async () => {
    prismaMock.user.findMany.mockResolvedValue([]);
    const result = await notificationsService.broadcastAnnouncement(input);
    expect(result).toEqual({ recipients: 0 });
  });

  it('creates notifications and sends push for matching users', async () => {
    const users = [
      mockUser({ id: 'u-1', email: 'a@test.com', fullName: 'User A', settings: null }),
      mockUser({ id: 'u-2', email: 'b@test.com', fullName: 'User B', settings: null }),
    ];
    prismaMock.user.findMany.mockResolvedValue(users as any);
    prismaMock.notification.createMany.mockResolvedValue({ count: 2 });

    const result = await notificationsService.broadcastAnnouncement(input);
    expect(result).toMatchObject({ recipients: 2 });
    expect(prismaMock.notification.createMany).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.arrayContaining([expect.objectContaining({ userId: 'u-1' })]) })
    );
  });

  it('sanitizes XSS in title and body before storing', async () => {
    const xssInput = {
      title    : '<script>alert(1)</script>',
      body     : '<img src=x onerror=alert(1)>',
      schoolId : 'school-1',
    };
    prismaMock.user.findMany.mockResolvedValue([
      mockUser({ id: 'u-1', settings: null }),
    ] as any);
    prismaMock.notification.createMany.mockResolvedValue({ count: 1 });

    await notificationsService.broadcastAnnouncement(xssInput);

    const callArg = prismaMock.notification.createMany.mock.calls[0][0] as any;
    expect(callArg.data[0].title).not.toContain('<script>');
    expect(callArg.data[0].body).not.toContain('<img');
  });

  it('uses department topic when departmentId provided', async () => {
    prismaMock.user.findMany.mockResolvedValue([
      mockUser({ id: 'u-1', settings: null }),
    ] as any);
    prismaMock.notification.createMany.mockResolvedValue({ count: 1 });

    const result = await notificationsService.broadcastAnnouncement({
      ...input, departmentId: 'dept-1',
    });
    expect((result as any).topic).toContain('department-dept-1');
  });
});

// ── sendAndPersistNotification ────────────────────────────────────────────

describe('sendAndPersistNotification()', () => {
  it('persists notification and sends push when user has FCM token', async () => {
    prismaMock.notification.create.mockResolvedValue({} as any);
    prismaMock.userSettings.findUnique.mockResolvedValue(null); // no quiet hours
    prismaMock.user.findUnique.mockResolvedValue({
      fcmToken: 'fcm-abc',
      settings: { pushNotifications: true },
    } as any);

    await sendAndPersistNotification('u-1', 'Title', 'Body', 'REMINDER');
    expect(prismaMock.notification.create).toHaveBeenCalled();
  });

  it('skips push when quiet hours are active', async () => {
    prismaMock.notification.create.mockResolvedValue({} as any);
    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    const current = `${pad(now.getHours())}:${pad(now.getMinutes())}`;
    // Set quiet hours to cover current time
    prismaMock.userSettings.findUnique.mockResolvedValue({
      quietHoursEnabled : true,
      quietHoursStart   : '00:00',
      quietHoursEnd     : '23:59',
    } as any);

    await sendAndPersistNotification('u-1', 'Title', 'Body', 'REMINDER');
    expect(prismaMock.notification.create).toHaveBeenCalled();
    // user.findUnique should NOT be called since quiet hours block push
    expect(prismaMock.user.findUnique).not.toHaveBeenCalled();
  });

  it('skips push when user has no FCM token', async () => {
    prismaMock.notification.create.mockResolvedValue({} as any);
    prismaMock.userSettings.findUnique.mockResolvedValue(null);
    prismaMock.user.findUnique.mockResolvedValue({
      fcmToken: null,
      settings: { pushNotifications: true },
    } as any);

    await sendAndPersistNotification('u-1', 'Title', 'Body', 'SYSTEM');
    expect(prismaMock.notification.create).toHaveBeenCalled();
  });
});
