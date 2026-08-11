import { prisma } from '@/config/prisma.js';

type UserCtx = { id: string; schoolId: string; departmentId: string; level: string };

function startOfDay(d: Date) {
  const r = new Date(d);
  r.setHours(0, 0, 0, 0);
  return r;
}

function endOfDay(d: Date) {
  const r = new Date(d);
  r.setHours(23, 59, 59, 999);
  return r;
}

function dayName(dayOfWeek: number) {
  return ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][dayOfWeek];
}

// Map a timetable entry to a planner item shape
function timetableToItem(entry: any, date: Date) {
  return {
    id: entry.id,
    sourceType: 'TIMETABLE' as const,
    title: `${entry.courseCode} — ${entry.courseTitle}`,
    subtitle: entry.venue ?? undefined,
    date: date.toISOString(),
    startTime: entry.startTime,
    endTime: entry.endTime,
    type: entry.type,
    isDone: false,
    priority: null,
  };
}

export const plannerService = {
  // ── Today view ─────────────────────────────────────────────
  async getToday(user: UserCtx) {
    const today = new Date();
    const dow = today.getDay();
    const start = startOfDay(today);
    const end = endOfDay(today);

    const [timetable, reminders, events, deptReminders] = await Promise.all([
      // Timetable entries for today's day-of-week (personal + departmental)
      prisma.timetableEntry.findMany({
        where: {
          dayOfWeek: dow,
          isRecurring: true,
          OR: [
            { timetableType: 'PERSONAL', userId: user.id },
            { timetableType: 'DEPARTMENTAL', departmentId: user.departmentId, level: user.level },
          ],
        },
        orderBy: { startTime: 'asc' },
      }),

      // Personal reminders due today
      prisma.reminder.findMany({
        where: {
          userId: user.id,
          isDeleted: false,
          isCompleted: false,
          dueDate: { gte: start, lte: end },
        },
        orderBy: { dueDate: 'asc' },
      }),

      // School events today
      prisma.schoolEvent.findMany({
        where: {
          schoolId: user.schoolId,
          isActive: true,
          startDate: { gte: start, lte: end },
        },
        orderBy: { startDate: 'asc' },
        select: { id: true, title: true, type: true, startDate: true, endDate: true, venue: true },
      }),

      // Dept reminders due today
      prisma.deptReminder.findMany({
        where: {
          departmentId: user.departmentId,
          dueDate: { gte: start, lte: end },
        },
        orderBy: { dueDate: 'asc' },
      }),
    ]);

    const items = [
      ...timetable.map((e: typeof timetable[number]) => timetableToItem(e, today)),
      ...reminders.map((r: typeof reminders[number]) => ({
        id: r.id,
        sourceType: 'REMINDER' as const,
        title: r.title,
        subtitle: r.description ?? undefined,
        date: r.dueDate.toISOString(),
        startTime: null,
        endTime: null,
        type: r.category,
        isDone: r.isCompleted,
        priority: r.priority,
      })),
      ...events.map((e: typeof events[number]) => ({
        id: e.id,
        sourceType: 'EVENT' as const,
        title: e.title,
        subtitle: e.venue ?? undefined,
        date: e.startDate.toISOString(),
        startTime: `${String(e.startDate.getHours()).padStart(2, '0')}:${String(e.startDate.getMinutes()).padStart(2, '0')}`,
        endTime: e.endDate ? `${String(e.endDate.getHours()).padStart(2, '0')}:${String(e.endDate.getMinutes()).padStart(2, '0')}` : null,
        type: e.type,
        isDone: false,
        priority: null,
      })),
      ...deptReminders.map((r: typeof deptReminders[number]) => ({
        id: r.id,
        sourceType: 'DEPT_REMINDER' as const,
        title: r.title,
        subtitle: r.description ?? undefined,
        date: r.dueDate.toISOString(),
        startTime: null,
        endTime: null,
        type: 'DEPT_REMINDER',
        isDone: false,
        priority: null,
      })),
    ];

    // Sort by startTime then date
    items.sort((a, b) => {
      const ta = a.startTime ?? '99:99';
      const tb = b.startTime ?? '99:99';
      if (ta !== tb) return ta.localeCompare(tb);
      return new Date(a.date).getTime() - new Date(b.date).getTime();
    });

    return { date: today.toISOString().split('T')[0], dayName: dayName(dow), items };
  },

  // ── Weekly view ────────────────────────────────────────────
  async getWeekly(user: UserCtx, weekOffset = 0) {
    // Monday-based week
    const now = new Date();
    const dow = now.getDay();
    const monday = new Date(now);
    monday.setDate(now.getDate() - ((dow + 6) % 7) + weekOffset * 7);
    monday.setHours(0, 0, 0, 0);

    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    sunday.setHours(23, 59, 59, 999);

    const [timetable, reminders, events, deptReminders] = await Promise.all([
      prisma.timetableEntry.findMany({
        where: {
          isRecurring: true,
          OR: [
            { timetableType: 'PERSONAL', userId: user.id },
            { timetableType: 'DEPARTMENTAL', departmentId: user.departmentId, level: user.level },
          ],
        },
        orderBy: { startTime: 'asc' },
      }),

      prisma.reminder.findMany({
        where: {
          userId: user.id,
          isDeleted: false,
          dueDate: { gte: monday, lte: sunday },
        },
        orderBy: { dueDate: 'asc' },
      }),

      prisma.schoolEvent.findMany({
        where: {
          schoolId: user.schoolId,
          isActive: true,
          startDate: { gte: monday, lte: sunday },
        },
        orderBy: { startDate: 'asc' },
        select: { id: true, title: true, type: true, startDate: true, endDate: true, venue: true },
      }),

      prisma.deptReminder.findMany({
        where: {
          departmentId: user.departmentId,
          dueDate: { gte: monday, lte: sunday },
        },
        orderBy: { dueDate: 'asc' },
      }),
    ]);

    // Build a map keyed by ISO date string (YYYY-MM-DD)
    const days: Record<string, { dayName: string; items: any[] }> = {};

    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      const key = d.toISOString().split('T')[0];
      days[key] = { dayName: dayName(d.getDay()), items: [] };
    }

    // Timetable — map recurring entries to their day in the week
    for (const entry of timetable) {
      const d = new Date(monday);
      // dayOfWeek: 0=Sun, adjust to find the correct date in this Mon-Sun week
      const targetDow = entry.dayOfWeek;
      const mondayDow = 1; // Monday
      let diff = targetDow - mondayDow;
      if (diff < 0) diff += 7;
      d.setDate(monday.getDate() + diff);
      const key = d.toISOString().split('T')[0];
      if (days[key]) days[key].items.push(timetableToItem(entry, d));
    }

    for (const r of reminders) {
      const key = r.dueDate.toISOString().split('T')[0];
      if (days[key]) {
        days[key].items.push({
          id: r.id, sourceType: 'REMINDER', title: r.title,
          subtitle: r.description ?? undefined,
          date: r.dueDate.toISOString(), startTime: null, endTime: null,
          type: r.category, isDone: r.isCompleted, priority: r.priority,
        });
      }
    }

    for (const e of events) {
      const key = e.startDate.toISOString().split('T')[0];
      if (days[key]) {
        days[key].items.push({
          id: e.id, sourceType: 'EVENT', title: e.title,
          subtitle: e.venue ?? undefined,
          date: e.startDate.toISOString(),
          startTime: `${String(e.startDate.getHours()).padStart(2, '0')}:${String(e.startDate.getMinutes()).padStart(2, '0')}`,
          endTime: e.endDate ? `${String(e.endDate.getHours()).padStart(2, '0')}:${String(e.endDate.getMinutes()).padStart(2, '0')}` : null,
          type: e.type, isDone: false, priority: null,
        });
      }
    }

    for (const r of deptReminders) {
      const key = r.dueDate.toISOString().split('T')[0];
      if (days[key]) {
        days[key].items.push({
          id: r.id, sourceType: 'DEPT_REMINDER', title: r.title,
          subtitle: r.description ?? undefined,
          date: r.dueDate.toISOString(), startTime: null, endTime: null,
          type: 'DEPT_REMINDER', isDone: false, priority: null,
        });
      }
    }

    // Sort each day's items
    for (const day of Object.values(days)) {
      day.items.sort((a, b) => {
        const ta = a.startTime ?? '99:99';
        const tb = b.startTime ?? '99:99';
        return ta.localeCompare(tb);
      });
    }

    return {
      weekStart: monday.toISOString().split('T')[0],
      weekEnd: sunday.toISOString().split('T')[0],
      weekOffset,
      days,
    };
  },
};
