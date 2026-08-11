import { prismaJobs } from '@/config/prisma.js';
import { sendAndPersistNotification } from '@/modules/notifications/notifications.service.js';

const NOTIFY_BEFORE_MINUTES = 15;

// Returns "HH:MM" for a given Date
function toHHMM(date: Date): string {
  const h = String(date.getHours()).padStart(2, '0');
  const m = String(date.getMinutes()).padStart(2, '0');
  return `${h}:${m}`;
}

// Returns all HH:MM strings in [from, to) window
function timeRange(from: Date, to: Date): string[] {
  const times: string[] = [];
  const cursor = new Date(from);
  while (cursor < to) {
    times.push(toHHMM(cursor));
    cursor.setMinutes(cursor.getMinutes() + 1);
  }
  return times;
}

export async function scheduleTimetableReminders() {
  try {
    const now = new Date();
    const windowStart = new Date(now.getTime() + NOTIFY_BEFORE_MINUTES * 60 * 1000);
    const windowEnd = new Date(windowStart.getTime() + 60 * 1000); // +1 min (job cadence)

    const dayOfWeek = windowStart.getDay(); // 0=Sun..6=Sat
    const targetTimes = timeRange(windowStart, windowEnd);

    if (!targetTimes.length) return;

    // Fetch all timetable entries for today that start in the notify window
    const entries = await prismaJobs.timetableEntry.findMany({
      where: {
        dayOfWeek,
        startTime: { in: targetTimes },
      },
      select: {
        id: true,
        courseCode: true,
        courseTitle: true,
        venue: true,
        startTime: true,
        type: true,
        timetableType: true,
        userId: true,
        departmentId: true,
      },
    });

    for (const entry of entries) {
      const venue = entry.venue ? ` @ ${entry.venue}` : '';
      const title = `🎓 Class in ${NOTIFY_BEFORE_MINUTES}min: ${entry.courseCode}`;
      const body = `${entry.courseTitle}${venue} starts at ${entry.startTime}`;
      const data = { type: 'TIMETABLE', timetableEntryId: entry.id };

      if (entry.timetableType === 'PERSONAL' && entry.userId) {
        await sendAndPersistNotification(entry.userId, title, body, 'TIMETABLE', data);
      } else if (entry.departmentId) {
        // Notify all users in the department who have this entry on their schedule
        const users = await prismaJobs.user.findMany({
          where: { departmentId: entry.departmentId, isDeleted: false, isActive: true },
          select: { id: true },
        });
        await Promise.all(
          users.map((u: { id: string }) => sendAndPersistNotification(u.id, title, body, 'TIMETABLE', data)),
        );
      }
    }
  } catch (err) {
    console.error('[TIMETABLE_REMINDER_SCHEDULER] Failed to scan timetable reminders:', err);
  }
}
