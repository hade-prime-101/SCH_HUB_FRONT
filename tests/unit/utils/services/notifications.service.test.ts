import { prismaMock } from '../../../helpers/mock-factories';
import { mockNotification, mockUser } from '../../../helpers/mock-factories';

// Must be imported AFTER mock-factories which sets up jest.mock('@/config/prisma')
import { notificationsService } from '@/modules/notifications/notifications.service';
import { notificationTopic } from '@/modules/notifications/notifications.service';

describe('notificationsService', () => {
  describe('list()', () => {
    it('returns paginated notifications with counts', async () => {
      const userId = 'user-1';
      const notifs = [mockNotification({ userId }), mockNotification({ userId })];

      prismaMock.notification.findMany.mockResolvedValue(notifs as any);
      prismaMock.notification.count
        .mockResolvedValueOnce(10)   // total
        .mockResolvedValueOnce(3);   // unread

      const result = await notificationsService.list(userId, 1, 20);

      expect(result.items).toHaveLength(2);
      expect(result.total).toBe(10);
      expect(result.unreadCount).toBe(3);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(20);
    });
  });

  describe('markRead()', () => {
    it('marks a notification as read', async () => {
      const notif = mockNotification({ id: 'n-1', userId: 'u-1', isRead: false });
      prismaMock.notification.findUnique.mockResolvedValue(notif as any);
      prismaMock.notification.update.mockResolvedValue({ ...notif, isRead: true, readAt: new Date() } as any);

      const result = await notificationsService.markRead('n-1', 'u-1');
      expect(result.isRead).toBe(true);
    });

    it('throws 404 when notification not found', async () => {
      prismaMock.notification.findUnique.mockResolvedValue(null);

      await expect(notificationsService.markRead('missing', 'u-1')).rejects.toMatchObject({
        statusCode: 404,
      });
    });

    it('throws 403 when user does not own notification', async () => {
      const notif = mockNotification({ id: 'n-1', userId: 'owner' });
      prismaMock.notification.findUnique.mockResolvedValue(notif as any);

      await expect(notificationsService.markRead('n-1', 'someone-else')).rejects.toMatchObject({
        statusCode: 403,
      });
    });
  });

  describe('markAllRead()', () => {
    it('marks all unread notifications as read and returns count', async () => {
      prismaMock.notification.updateMany.mockResolvedValue({ count: 5 });

      const result = await notificationsService.markAllRead('u-1');
      expect(result.updated).toBe(5);
    });
  });

  describe('delete()', () => {
    it('deletes notification belonging to the user', async () => {
      const notif = mockNotification({ id: 'n-1', userId: 'u-1' });
      prismaMock.notification.findUnique.mockResolvedValue(notif as any);
      prismaMock.notification.delete.mockResolvedValue(notif as any);

      const result = await notificationsService.delete('n-1', 'u-1');
      expect(result.deleted).toBe(true);
    });

    it('throws 404 when notification not found', async () => {
      prismaMock.notification.findUnique.mockResolvedValue(null);

      await expect(notificationsService.delete('missing', 'u-1')).rejects.toMatchObject({
        statusCode: 404,
      });
    });

    it('throws 403 when user does not own notification', async () => {
      const notif = mockNotification({ id: 'n-1', userId: 'owner' });
      prismaMock.notification.findUnique.mockResolvedValue(notif as any);

      await expect(notificationsService.delete('n-1', 'attacker')).rejects.toMatchObject({
        statusCode: 403,
      });
    });
  });
});

// ── notificationTopic() pure function tests ───────────────────────────────

describe('notificationTopic()', () => {
  it('generates correct school topic string', () => {
    const topic = notificationTopic('school', 'abc123');
    expect(topic).toBe('school-abc123');
  });

  it('generates correct department topic string', () => {
    const topic = notificationTopic('department', 'dept-456');
    expect(topic).toBe('department-dept-456');
  });

  it('sanitizes special characters in ID to dashes', () => {
    const topic = notificationTopic('school', 'bad id!@#$');
    // Only [a-zA-Z0-9-_.~%] are allowed
    expect(topic).toMatch(/^[a-zA-Z0-9\-_.~%]+$/);
  });

  it('allows valid URL-safe characters through', () => {
    const topic = notificationTopic('school', 'valid_id~1.2%20');
    expect(topic).toBe('school-valid_id~1.2%20');
  });
});
