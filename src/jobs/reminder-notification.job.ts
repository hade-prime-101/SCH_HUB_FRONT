import { prisma } from '@/config/prisma.js';
import { notificationQueue, REMINDER_NOTIFY_JOB } from './queues.js';
import { sendAndPersistNotification } from '@/modules/notifications/notifications.service.js';

// ── Queue processor ────────────────────────────────────────

notificationQueue.process(REMINDER_NOTIFY_JOB, async (job) => {
  const { reminderId } = job.data as { reminderId: string };

  const reminder = await prisma.reminder.findUnique({
    where: { id: reminderId },
    include: { user: { select: { id: true, fcmToken: true } } },
  });

  if (!reminder || reminder.isCompleted || reminder.isDeleted || reminder.notificationSent) return;

  const priorityEmoji: Record<string, string> = { HIGH: '🔴', MEDIUM: '🟡', LOW: '🟢' };
  const emoji = priorityEmoji[reminder.priority] ?? '⏰';

  await sendAndPersistNotification(
    reminder.userId,
    `${emoji} ${reminder.title}`,
    reminder.description ?? `Due: ${reminder.dueDate.toLocaleDateString()}`,
    'REMINDER',
    { type: 'REMINDER', reminderId: reminder.id },
  );

  await prisma.reminder.update({
    where: { id: reminderId },
    data: { notificationSent: true },
  });
});

// ── Cron: scan every minute ────────────────────────────────

export async function scheduleReminderNotifications() {
  const now = new Date();
  const windowEnd = new Date(now.getTime() + 60 * 1000); // next 60s

  const due = await prisma.reminder.findMany({
    where: {
      isDeleted: false,
      isCompleted: false,
      notificationSent: false,
      notifyAt: { gte: now, lte: windowEnd },
    },
    select: { id: true },
  });

  for (const { id } of due) {
    await notificationQueue.add(
      REMINDER_NOTIFY_JOB,
      { reminderId: id },
      { jobId: `reminder-${id}`, removeOnComplete: true },
    );
  }
}
