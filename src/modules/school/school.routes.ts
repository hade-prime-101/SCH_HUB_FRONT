import { Router } from 'express';
import multer from 'multer';
import path from 'node:path';
import { prisma } from '@/config/prisma.js';
import { AppError, sendSuccess } from '@/utils/response.js';
import { authenticate } from '@/middleware/authenticate.js';
import { authorize } from '@/middleware/authorize.js';
import { env } from '@/config/env.js';
import * as c from './school.controller.js';

export const schoolLookupRoutes = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowed.includes(file.mimetype)) {
      return cb(new AppError('Only JPEG, PNG and WebP images are allowed', 400));
    }
    file.originalname = path.basename(file.originalname).replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 200) || 'upload';
    cb(null, true);
  },
});

// ── Public lookup (no auth — used during registration) ─────

schoolLookupRoutes.get('/schools', async (_req, res, next) => {
  try {
    const schools = await prisma.school.findMany({
      where: { isActive: true, ...(env.SCHOOL_ID && { id: env.SCHOOL_ID }) },
      select: { id: true, name: true, shortCode: true, location: true, logoUrl: true },
      orderBy: { name: 'asc' },
    });
    sendSuccess(res, schools);
  } catch (e) { next(e); }
});

schoolLookupRoutes.get('/schools/:id/faculties', async (req, res, next) => {
  try {
    const faculties = await prisma.faculty.findMany({
      where: { schoolId: req.params.id },
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
    });
    sendSuccess(res, faculties);
  } catch (e) { next(e); }
});

schoolLookupRoutes.get('/faculties/:id/departments', async (req, res, next) => {
  try {
    const departments = await prisma.department.findMany({
      where: { facultyId: req.params.id },
      select: { id: true, name: true, shortCode: true },
      orderBy: { name: 'asc' },
    });
    sendSuccess(res, departments);
  } catch (e) { next(e); }
});

// ── All routes below require authentication ────────────────

schoolLookupRoutes.use(authenticate);

// ── Timetable ──────────────────────────────────────────────
// GET ?type=PERSONAL|DEPARTMENTAL|GENERAL
schoolLookupRoutes.get('/timetable', c.getTimetable);
// POST — type in body determines role check
schoolLookupRoutes.post('/timetable', c.createTimetableEntry);
schoolLookupRoutes.put('/timetable/:id', c.updateTimetableEntry);
schoolLookupRoutes.delete('/timetable/:id', c.deleteTimetableEntry);

// ── Events ─────────────────────────────────────────────────
schoolLookupRoutes.get('/events', c.listEvents);
schoolLookupRoutes.get('/events/:id', c.getEvent);
schoolLookupRoutes.post('/events', authorize('COURSE_REP', 'EVENT_ORCHESTRATOR', 'SCHOOL_ADMIN', 'SUPER_ADMIN'), c.createEvent);
schoolLookupRoutes.patch('/events/:id', authorize('COURSE_REP', 'EVENT_ORCHESTRATOR', 'SCHOOL_ADMIN', 'SUPER_ADMIN'), c.updateEvent);
schoolLookupRoutes.post('/events/:id/image', authorize('COURSE_REP', 'EVENT_ORCHESTRATOR', 'SCHOOL_ADMIN', 'SUPER_ADMIN'), upload.single('image'), c.uploadEventImage);
schoolLookupRoutes.delete('/events/:id', authorize('COURSE_REP', 'EVENT_ORCHESTRATOR', 'SCHOOL_ADMIN', 'SUPER_ADMIN'), c.deleteEvent);
schoolLookupRoutes.post('/events/:id/remind', c.setEventReminder);

// ── Tickets ────────────────────────────────────────────────
schoolLookupRoutes.post('/events/:id/tickets', c.submitReceipt);
schoolLookupRoutes.get('/events/:id/tickets/mine', c.getMyTicket);
schoolLookupRoutes.get('/events/:id/tickets', authorize('SCHOOL_ADMIN', 'SUPER_ADMIN'), c.listTickets);
schoolLookupRoutes.patch('/events/:id/tickets/:ticketId/approve', authorize('SCHOOL_ADMIN', 'SUPER_ADMIN'), c.approveTicket);
schoolLookupRoutes.patch('/events/:id/tickets/:ticketId/reject', authorize('SCHOOL_ADMIN', 'SUPER_ADMIN'), c.rejectTicket);

// ── Emergency Contacts ─────────────────────────────────────
schoolLookupRoutes.get('/emergency-contacts', c.listEmergencyContacts);
schoolLookupRoutes.post('/emergency-contacts', authorize('SCHOOL_ADMIN', 'SUPER_ADMIN'), c.createEmergencyContact);
schoolLookupRoutes.patch('/emergency-contacts/:id', authorize('SCHOOL_ADMIN', 'SUPER_ADMIN'), c.updateEmergencyContact);
schoolLookupRoutes.delete('/emergency-contacts/:id', authorize('SCHOOL_ADMIN', 'SUPER_ADMIN'), c.deleteEmergencyContact);
