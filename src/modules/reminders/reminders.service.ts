import { prisma } from '@/config/prisma.js';
import { AppError } from '@/utils/response.js';
import type { z } from 'zod';
import type {
  createReminderSchema,
  updateReminderSchema,
  listRemindersSchema,
} from './reminders.validators.js';

type CreateInput = z.infer<typeof createReminderSchema>;
type UpdateInput = z.infer<typeof updateReminderSchema>;
type ListInput = z.infer<typeof listRemindersSchema>;

export const remindersService = {
  async list(userId: string, query: ListInput) {
    const { isCompleted, category, priority, page, limit } = query;
    const skip = (page - 1) * limit;

    const where = {
      userId,
      isDeleted: false,
      ...(isCompleted !== undefined && { isCompleted }),
      ...(category && { category }),
      ...(priority && { priority }),
    };

    const [items, total] = await Promise.all([
      prisma.reminder.findMany({
        where,
        orderBy: [{ dueDate: 'asc' }, { priority: 'asc' }],
        skip,
        take: limit,
      }),
      prisma.reminder.count({ where }),
    ]);

    return { items, total, page, limit };
  },

  async create(userId: string, input: CreateInput) {
    const reminder = await prisma.reminder.create({
      data: {
        userId,
        title: input.title,
        description: input.description,
        dueDate: new Date(input.dueDate),
        notifyAt: new Date(input.notifyAt),
        priority: input.priority,
        category: input.category,
        isRecurring: input.isRecurring,
        recurringDays: input.recurringDays ?? [],
      },
    });

    // Sync to planner
    await prisma.plannerEntry.upsert({
      where: { userId_sourceType_sourceId: { userId, sourceType: 'REMINDER', sourceId: reminder.id } },
      create: {
        userId,
        title: reminder.title,
        sourceType: 'REMINDER',
        sourceId: reminder.id,
        date: new Date(input.dueDate),
        isAllDay: true,
      },
      update: {
        title: reminder.title,
        date: new Date(input.dueDate),
      },
    });

    return reminder;
  },

  async update(id: string, userId: string, input: UpdateInput) {
    const reminder = await prisma.reminder.findUnique({ where: { id } });
    if (!reminder || reminder.isDeleted) throw new AppError('Reminder not found', 404);
    if (reminder.userId !== userId) throw new AppError('Not authorized', 403);

    const updated = await prisma.reminder.update({
      where: { id },
      data: {
        ...input,
        dueDate: input.dueDate ? new Date(input.dueDate) : undefined,
        notifyAt: input.notifyAt ? new Date(input.notifyAt) : undefined,
        completedAt: input.isCompleted ? new Date() : undefined,
        // Reset notification flag if notifyAt changed
        notificationSent: input.notifyAt ? false : undefined,
      },
    });

    // Sync planner entry
    if (input.dueDate || input.title) {
      await prisma.plannerEntry.upsert({
        where: { userId_sourceType_sourceId: { userId, sourceType: 'REMINDER', sourceId: id } },
        create: {
          userId,
          title: updated.title,
          sourceType: 'REMINDER',
          sourceId: id,
          date: updated.dueDate,
          isAllDay: true,
        },
        update: {
          title: updated.title,
          date: updated.dueDate,
          isDone: updated.isCompleted,
        },
      });
    }

    return updated;
  },

  async delete(id: string, userId: string) {
    const reminder = await prisma.reminder.findUnique({ where: { id } });
    if (!reminder || reminder.isDeleted) throw new AppError('Reminder not found', 404);
    if (reminder.userId !== userId) throw new AppError('Not authorized', 403);

    await Promise.all([
      prisma.reminder.update({ where: { id }, data: { isDeleted: true } }),
      prisma.plannerEntry.deleteMany({ where: { userId, sourceType: 'REMINDER', sourceId: id } }),
    ]);

    return { deleted: true };
  },

  async complete(id: string, userId: string) {
    const reminder = await prisma.reminder.findUnique({ where: { id } });
    if (!reminder || reminder.isDeleted) throw new AppError('Reminder not found', 404);
    if (reminder.userId !== userId) throw new AppError('Not authorized', 403);

    const updated = await prisma.reminder.update({
      where: { id },
      data: { isCompleted: true, completedAt: new Date() },
    });

    await prisma.plannerEntry.updateMany({
      where: { userId, sourceType: 'REMINDER', sourceId: id },
      data: { isDone: true },
    });

    // If recurring, schedule next occurrence
    if (reminder.isRecurring && Array.isArray(reminder.recurringDays) && (reminder.recurringDays as number[]).length > 0) {
      const days = reminder.recurringDays as number[];
      const nextDue = getNextRecurringDate(reminder.dueDate, days);
      const notifyOffset = reminder.dueDate.getTime() - reminder.notifyAt.getTime();
      const nextNotify = new Date(nextDue.getTime() - notifyOffset);

      const next = await prisma.reminder.create({
        data: {
          userId,
          title: reminder.title,
          description: reminder.description,
          dueDate: nextDue,
          notifyAt: nextNotify,
          priority: reminder.priority,
          category: reminder.category,
          isRecurring: true,
          recurringDays: days,
        },
      });

      await prisma.plannerEntry.create({
        data: {
          userId,
          title: next.title,
          sourceType: 'REMINDER',
          sourceId: next.id,
          date: nextDue,
          isAllDay: true,
        },
      });
    }

    return updated;
  },
};

function getNextRecurringDate(from: Date, days: number[]): Date {
  const sorted = [...days].sort((a, b) => a - b);
  const current = from.getDay();
  const next = sorted.find((d) => d > current) ?? sorted[0];
  const diff = next > current ? next - current : 7 - current + next;
  const result = new Date(from);
  result.setDate(result.getDate() + diff);
  return result;
}
