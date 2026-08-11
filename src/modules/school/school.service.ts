import QRCode from 'qrcode';
import { prisma } from '@/config/prisma.js';
import { AppError } from '@/utils/response.js';
import { env } from '@/config/env.js';
import { r2 } from '@/config/r2.js';
import { whatsapp } from '@/config/whatsapp.js';
import { sendAndPersistNotification } from '@/modules/notifications/notifications.service.js';
import type { z } from 'zod';
import type {
  createTimetableEntrySchema,
  updateTimetableEntrySchema,
  createEventSchema,
  updateEventSchema,
  submitReceiptSchema,
  rejectTicketSchema,
  setEventReminderSchema,
  createEmergencyContactSchema,
  updateEmergencyContactSchema,
} from './school.validators.js';

type CreateTimetableInput = z.infer<typeof createTimetableEntrySchema>;
type UpdateTimetableInput = z.infer<typeof updateTimetableEntrySchema>;
type CreateEventInput = z.infer<typeof createEventSchema>;
type UpdateEventInput = z.infer<typeof updateEventSchema>;
type SubmitReceiptInput = z.infer<typeof submitReceiptSchema>;
type RejectTicketInput = z.infer<typeof rejectTicketSchema>;
type SetReminderInput = z.infer<typeof setEventReminderSchema>;
type CreateContactInput = z.infer<typeof createEmergencyContactSchema>;
type UpdateContactInput = z.infer<typeof updateEmergencyContactSchema>;

type UserCtx = { id: string; role: string; schoolId: string; departmentId: string; level: string };

// ── Helpers ────────────────────────────────────────────────

function generateTicketRef(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let ref = 'TKT-';
  for (let i = 0; i < 6; i++) ref += chars[Math.floor(Math.random() * chars.length)];
  return ref;
}

const ADMIN_ROLES = new Set(['SCHOOL_ADMIN', 'SUPER_ADMIN']);
const REP_ROLES = new Set(['COURSE_REP', 'SCHOOL_ADMIN', 'SUPER_ADMIN']);
const EVENT_MANAGER_ROLES = new Set(['COURSE_REP', 'EVENT_ORCHESTRATOR', 'SCHOOL_ADMIN', 'SUPER_ADMIN']);
const EVENT_ORCHESTRATOR_ROLES = new Set(['EVENT_ORCHESTRATOR', 'SCHOOL_ADMIN', 'SUPER_ADMIN']);

function eventDateLine(event: { startDate: Date; venue?: string | null }) {
  const dateStr = event.startDate.toLocaleString('en-NG', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
  return event.venue ? `${dateStr} @ ${event.venue}` : dateStr;
}

// ── Timetable ──────────────────────────────────────────────

export const schoolService = {
  async getTimetable(user: UserCtx, timetableType?: string) {
    if (!timetableType || timetableType === 'PERSONAL') {
      return prisma.timetableEntry.findMany({
        where: { timetableType: 'PERSONAL', userId: user.id },
        orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
      });
    }

    if (timetableType === 'DEPARTMENTAL') {
      return prisma.timetableEntry.findMany({
        where: { timetableType: 'DEPARTMENTAL', departmentId: user.departmentId, level: user.level },
        orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
        include: { createdBy: { select: { id: true, fullName: true, role: true } } },
      });
    }

    if (timetableType === 'GENERAL') {
      return prisma.timetableEntry.findMany({
        where: { timetableType: 'GENERAL', schoolId: user.schoolId },
        orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
        include: { createdBy: { select: { id: true, fullName: true, role: true } } },
      });
    }

    throw new AppError('Invalid timetable type', 400);
  },

  async createTimetableEntry(input: CreateTimetableInput, user: UserCtx) {
    const { timetableType } = input;

    // Role checks
    if (timetableType === 'DEPARTMENTAL' && !REP_ROLES.has(user.role)) {
      throw new AppError('Only Course Reps and Admins can create departmental timetables', 403);
    }
    if (timetableType === 'GENERAL' && !ADMIN_ROLES.has(user.role)) {
      throw new AppError('Only Admins can create general timetables', 403);
    }

    // Field requirements
    if (timetableType === 'DEPARTMENTAL' && (!input.level || !input.departmentId)) {
      throw new AppError('level and departmentId are required for departmental timetables', 400);
    }
    if (timetableType === 'GENERAL' && !input.schoolId) {
      throw new AppError('schoolId is required for general timetables', 400);
    }

    // Conflict check for PERSONAL only
    if (timetableType === 'PERSONAL') {
      const conflict = await prisma.timetableEntry.findFirst({
        where: {
          userId: user.id,
          timetableType: 'PERSONAL',
          dayOfWeek: input.dayOfWeek,
          OR: [
            { startTime: { gte: input.startTime, lt: input.endTime } },
            { endTime: { gt: input.startTime, lte: input.endTime } },
            { startTime: { lte: input.startTime }, endTime: { gte: input.endTime } },
          ],
        },
      });
      if (conflict) {
        throw new AppError(
          `Time conflict with ${conflict.courseCode} (${conflict.startTime}–${conflict.endTime})`,
          409
        );
      }
    }

    return prisma.timetableEntry.create({
      data: {
        timetableType: timetableType as any,
        courseCode: input.courseCode,
        courseTitle: input.courseTitle,
        venue: input.venue,
        dayOfWeek: input.dayOfWeek,
        startTime: input.startTime,
        endTime: input.endTime,
        type: input.type as any,
        isRecurring: input.isRecurring,
        level: input.level,
        userId: timetableType === 'PERSONAL' ? user.id : null,
        departmentId: timetableType === 'DEPARTMENTAL' ? (input.departmentId ?? user.departmentId) : null,
        schoolId: timetableType === 'GENERAL' ? (input.schoolId ?? user.schoolId) : null,
        createdById: user.id,
      },
    });
  },

  async updateTimetableEntry(id: string, input: UpdateTimetableInput, user: UserCtx) {
    const entry = await prisma.timetableEntry.findUnique({ where: { id } });
    if (!entry) throw new AppError('Timetable entry not found', 404);

    if (entry.timetableType === 'PERSONAL' && entry.userId !== user.id) {
      throw new AppError('Not authorized', 403);
    }
    if (entry.timetableType === 'DEPARTMENTAL' && !REP_ROLES.has(user.role)) {
      throw new AppError('Not authorized', 403);
    }
    if (entry.timetableType === 'GENERAL' && !ADMIN_ROLES.has(user.role)) {
      throw new AppError('Not authorized', 403);
    }

    return prisma.timetableEntry.update({ where: { id }, data: input as any });
  },

  async deleteTimetableEntry(id: string, user: UserCtx) {
    const entry = await prisma.timetableEntry.findUnique({ where: { id } });
    if (!entry) throw new AppError('Timetable entry not found', 404);

    if (entry.timetableType === 'PERSONAL' && entry.userId !== user.id) {
      throw new AppError('Not authorized', 403);
    }
    if (entry.timetableType === 'DEPARTMENTAL' && !REP_ROLES.has(user.role)) {
      throw new AppError('Not authorized', 403);
    }
    if (entry.timetableType === 'GENERAL' && !ADMIN_ROLES.has(user.role)) {
      throw new AppError('Not authorized', 403);
    }

    await prisma.timetableEntry.delete({ where: { id } });
    return { deleted: true };
  },

  // ── Events ─────────────────────────────────────────────────

  async listEvents(schoolId: string, upcoming = true, departmentId?: string, level?: string) {
    return prisma.schoolEvent.findMany({
      where: {
        schoolId,
        isActive: true,
        ...(upcoming && { startDate: { gte: new Date() } }),
        ...(departmentId && { departmentId }),
        ...(level && { level }),
      },
      select: {
        id: true, title: true, description: true, type: true,
        startDate: true, endDate: true, venue: true, imageUrl: true,
        departmentId: true, level: true, createdAt: true,
        department: { select: { id: true, name: true, shortCode: true } },
      },
      orderBy: { startDate: 'asc' },
    });
  },

  async getEvent(id: string) {
    const event = await prisma.schoolEvent.findUnique({
      where: { id, isActive: true },
      select: {
        id: true, title: true, description: true, type: true,
        startDate: true, endDate: true, venue: true, imageUrl: true,
        departmentId: true, level: true,
        createdAt: true, updatedAt: true,
        department: { select: { id: true, name: true, shortCode: true } },
        createdBy: { select: { id: true, fullName: true } },
      },
    });
    if (!event) throw new AppError('Event not found', 404);
    return event;
  },

  async createEvent(input: CreateEventInput, user: UserCtx) {
    if (!EVENT_MANAGER_ROLES.has(user.role)) {
      throw new AppError('Only event orchestrators, course reps and admins can create events', 403);
    }

    const departmentId = EVENT_ORCHESTRATOR_ROLES.has(user.role)
      ? input.departmentId ?? null
      : user.departmentId;

    if (user.role === 'COURSE_REP' && input.departmentId && input.departmentId !== user.departmentId) {
      throw new AppError('Course reps can only create events for their own department', 403);
    }

    if (!input.startDate) throw new AppError('datetime is required', 400);

    const event = await prisma.schoolEvent.create({
      data: {
        title: input.title,
        description: input.description,
        type: 'INFO_ONLY',
        startDate: new Date(input.startDate),
        endDate: input.endDate ? new Date(input.endDate) : undefined,
        venue: input.venue,
        imageUrl: input.imageUrl,
        departmentId,
        level: input.level,
        schoolId: user.schoolId,
        createdById: user.id,
        requiresTicket: false,
        ticketPrice: null,
        bankName: null,
        accountNumber: null,
        accountName: null,
        totalTickets: null,
      },
    });

    await this.syncEventReminders(event.id).catch(() => null);
    await this.broadcastEvent(event.id, false).catch(() => null);

    return event;
  },

  async updateEvent(id: string, input: UpdateEventInput, user: UserCtx) {
    const event = await prisma.schoolEvent.findUnique({ where: { id } });
    if (!event) throw new AppError('Event not found', 404);
    this.assertCanManageEvent(event, user);

    if (user.role === 'COURSE_REP' && input.departmentId && input.departmentId !== user.departmentId) {
      throw new AppError('Course reps can only manage events for their own department', 403);
    }

    const updated = await prisma.schoolEvent.update({
      where: { id },
      data: {
        title: input.title,
        description: input.description,
        startDate: input.startDate ? new Date(input.startDate) : undefined,
        endDate: input.endDate ? new Date(input.endDate) : undefined,
        venue: input.venue,
        imageUrl: input.imageUrl,
        departmentId: EVENT_ORCHESTRATOR_ROLES.has(user.role) ? input.departmentId : undefined,
        level: input.level,
        type: 'INFO_ONLY',
        requiresTicket: false,
        ticketPrice: null,
        bankName: null,
        accountNumber: null,
        accountName: null,
        totalTickets: null,
      },
    });

    await this.syncEventReminders(id).catch(() => null);
    return updated;
  },

  async deleteEvent(id: string, user: UserCtx) {
    const event = await prisma.schoolEvent.findUnique({ where: { id } });
    if (!event) throw new AppError('Event not found', 404);
    this.assertCanManageEvent(event, user);
    await prisma.schoolEvent.update({ where: { id }, data: { isActive: false } });
    return { deleted: true };
  },

  async uploadEventImage(eventId: string, file: Express.Multer.File, user: UserCtx) {
    const event = await prisma.schoolEvent.findUnique({ where: { id: eventId } });
    if (!event) throw new AppError('Event not found', 404);
    this.assertCanManageEvent(event, user);

    if (event.imageUrl) {
      const oldKey = event.imageUrl.split('/').pop();
      if (oldKey) await r2.delete(oldKey).catch(() => null);
    }

    const { url } = await r2.upload(file.buffer, file.originalname, file.mimetype);
    return prisma.schoolEvent.update({
      where: { id: eventId },
      data: { imageUrl: url },
      select: { id: true, imageUrl: true },
    });
  },

  async setEventReminder(eventId: string, userId: string, input: SetReminderInput) {
    const event = await prisma.schoolEvent.findUnique({ where: { id: eventId, isActive: true } });
    if (!event) throw new AppError('Event not found', 404);

    const notifyAt = new Date(input.notifyAt);
    if (notifyAt >= event.startDate) throw new AppError('Reminder must be before the event start', 400);

    return prisma.eventReminder.upsert({
      where: { userId_eventId: { userId, eventId } },
      create: { userId, eventId, notifyAt },
      update: { notifyAt, notificationSent: false },
    });
  },

  assertCanManageEvent(event: { departmentId: string | null }, user: UserCtx) {
    if (!EVENT_MANAGER_ROLES.has(user.role)) throw new AppError('Not authorized', 403);
    if (EVENT_ORCHESTRATOR_ROLES.has(user.role)) return;
    if (event.departmentId !== user.departmentId) {
      throw new AppError('Course reps can only manage events for their own department', 403);
    }
  },

  async eventAudience(eventId: string) {
    const event = await prisma.schoolEvent.findUnique({
      where: { id: eventId, isActive: true },
      select: {
        id: true,
        title: true,
        startDate: true,
        venue: true,
        schoolId: true,
        departmentId: true,
        level: true,
      },
    });
    if (!event) throw new AppError('Event not found', 404);

    const users = await prisma.user.findMany({
      where: {
        schoolId: event.schoolId,
        isDeleted: false,
        ...(event.departmentId && { departmentId: event.departmentId }),
        ...(event.level && { level: event.level }),
      },
      select: {
        id: true,
        phone: true,
        settings: { select: { notificationsEnabled: true, eventPush: true, whatsappOptIn: true } },
      },
    });

    return { event, users };
  },

  async broadcastEvent(eventId: string, isReminder: boolean) {
    const { event, users } = await this.eventAudience(eventId);
    const title = isReminder ? `Upcoming event: ${event.title}` : `New event: ${event.title}`;
    const body = eventDateLine(event);

    type EventUser = typeof users[number];

    await Promise.all(
      users
        .filter((user: EventUser) => user.settings?.notificationsEnabled !== false && user.settings?.eventPush !== false)
        .map((user: EventUser) =>
          sendAndPersistNotification(user.id, title, body, 'EVENT', {
            type: 'EVENT',
            eventId,
            ...(isReminder && { reminder: 'true' }),
          }).catch(() => null)
        )
    );

    await Promise.all(
      users
        .filter((user: EventUser) => user.phone && user.settings?.whatsappOptIn)
        .map((user: EventUser) => whatsapp.sendMessage({ to: user.phone!, body: `${title}\n${body}` }).catch(() => null))
    );

    return { recipients: users.length };
  },

  async syncEventReminders(eventId: string) {
    const { event, users } = await this.eventAudience(eventId);
    const notifyAt = new Date(event.startDate.getTime() - 60 * 60 * 1000);
    if (notifyAt <= new Date()) return { synced: 0 };

    type EventUser = typeof users[number];

    await Promise.all(
      users.map((user: EventUser) =>
        prisma.eventReminder.upsert({
          where: { userId_eventId: { userId: user.id, eventId } },
          create: { userId: user.id, eventId, notifyAt },
          update: { notifyAt, notificationSent: false },
        })
      )
    );

    return { synced: users.length };
  },

  // ── Tickets ────────────────────────────────────────────────

  async submitReceipt(_eventId: string, _userId: string, _input: SubmitReceiptInput) {
    throw new AppError('Ticketing is disabled for informational events', 410);
  },

  async getMyTicket(_eventId: string, _userId: string) {
    throw new AppError('Ticketing is disabled for informational events', 410);
  },

  async listTickets(_eventId: string) {
    throw new AppError('Ticketing is disabled for informational events', 410);
  },

  async approveTicket(_ticketId: string, _adminId: string) {
    throw new AppError('Ticketing is disabled for informational events', 410);
  },

  async rejectTicket(_ticketId: string, _adminId: string, _input: RejectTicketInput) {
    throw new AppError('Ticketing is disabled for informational events', 410);
  },

  // ── Emergency Contacts ─────────────────────────────────────

  async listEmergencyContacts(schoolId: string) {
    return prisma.emergencyContact.findMany({
      where: { schoolId },
      orderBy: { order: 'asc' },
      select: { id: true, name: true, role: true, phone: true, whatsappNumber: true, extension: true, category: true, order: true },
    });
  },

  async createEmergencyContact(input: CreateContactInput, userId: string, schoolId: string) {
    return prisma.emergencyContact.create({
      data: { ...input, schoolId, createdById: userId },
    });
  },

  async updateEmergencyContact(id: string, input: UpdateContactInput, schoolId: string) {
    const contact = await prisma.emergencyContact.findUnique({ where: { id } });
    if (!contact) throw new AppError('Contact not found', 404);
    if (contact.schoolId !== schoolId) throw new AppError('Not authorized', 403);
    return prisma.emergencyContact.update({ where: { id }, data: input });
  },

  async deleteEmergencyContact(id: string, schoolId: string) {
    const contact = await prisma.emergencyContact.findUnique({ where: { id } });
    if (!contact) throw new AppError('Contact not found', 404);
    if (contact.schoolId !== schoolId) throw new AppError('Not authorized', 403);
    await prisma.emergencyContact.delete({ where: { id } });
    return { deleted: true };
  },
};
