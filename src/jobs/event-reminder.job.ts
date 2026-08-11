import { prisma } from '@/config/prisma.js';
import { mailer } from '@/config/mailer.js';
import { whatsapp } from '@/config/whatsapp.js';
import { notificationQueue, EVENT_REMINDER_JOB } from './queues.js';
import { sendAndPersistNotification } from '@/modules/notifications/notifications.service.js';

// ── Queue processor ────────────────────────────────────────

notificationQueue.process(EVENT_REMINDER_JOB, async (job) => {
  const { eventReminderId } = job.data as { eventReminderId: string };

  const er = await prisma.eventReminder.findUnique({
    where: { id: eventReminderId },
    include: {
      event: { select: { title: true, startDate: true, venue: true } },
      user: {
        select: {
          email: true,
          fullName: true,
          phone: true,
          settings: { select: { emailNotifications: true, whatsappOptIn: true } },
        },
      },
    },
  });

  if (!er || er.notificationSent) return;

  const { event } = er;
  const venue = event.venue ? ` @ ${event.venue}` : '';
  const dateStr = event.startDate.toLocaleDateString('en-NG', {
    weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
  });

  await sendAndPersistNotification(
    er.userId,
    `📅 Upcoming: ${event.title}`,
    `${dateStr}${venue}`,
    'EVENT',
    { type: 'EVENT', eventId: er.eventId },
  );

  if (er.user.settings?.emailNotifications !== false) {
    await mailer.sendEventReminder(er.user.email, er.user.fullName, event).catch(() => null);
  }

  if (er.user.phone && er.user.settings?.whatsappOptIn) {
    await whatsapp.sendMessage({
      to: er.user.phone,
      body: `Upcoming event: ${event.title}\n${dateStr}${venue}`,
    }).catch(() => null);
  }

  await prisma.eventReminder.update({
    where: { id: eventReminderId },
    data: { notificationSent: true },
  });
});

// ── Cron: scan every minute ────────────────────────────────

export async function scheduleEventReminders() {
  const now = new Date();
  const windowEnd = new Date(now.getTime() + 60 * 1000);

  const due = await prisma.eventReminder.findMany({
    where: {
      notificationSent: false,
      notifyAt: { gte: now, lte: windowEnd },
    },
    select: { id: true },
  });

  for (const { id } of due) {
    await notificationQueue.add(
      EVENT_REMINDER_JOB,
      { eventReminderId: id },
      { jobId: `event-reminder-${id}`, removeOnComplete: true },
    );
  }
}
