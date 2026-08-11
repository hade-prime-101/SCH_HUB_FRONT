import type { NextFunction, Request, Response } from 'express';
import { schoolService } from './school.service.js';
import { AppError, sendSuccess } from '@/utils/response.js';
import {
  createTimetableEntrySchema, updateTimetableEntrySchema,
  createEventSchema, updateEventSchema,
  submitReceiptSchema, rejectTicketSchema, setEventReminderSchema,
  createMapLocationSchema, updateMapLocationSchema, bulkUpdateMapLocationsSchema, routeQuerySchema,
  createEmergencyContactSchema, updateEmergencyContactSchema,
} from './school.validators.js';

// ── Timetable ──────────────────────────────────────────────

export const getTimetable = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const type = req.query.type as string | undefined;
    const entries = await schoolService.getTimetable(req.user!, type);
    return sendSuccess(res, entries);
  } catch (e) { return next(e); }
};

export const createTimetableEntry = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const input = createTimetableEntrySchema.parse(req.body);
    const entry = await schoolService.createTimetableEntry(input, req.user!);
    return sendSuccess(res, entry, 201);
  } catch (e) { return next(e); }
};

export const updateTimetableEntry = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const input = updateTimetableEntrySchema.parse(req.body);
    const entry = await schoolService.updateTimetableEntry(req.params.id, input, req.user!);
    return sendSuccess(res, entry);
  } catch (e) { return next(e); }
};

export const deleteTimetableEntry = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await schoolService.deleteTimetableEntry(req.params.id, req.user!);
    return sendSuccess(res, result);
  } catch (e) { return next(e); }
};

// ── Events ─────────────────────────────────────────────────

export const listEvents = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const upcoming = req.query.upcoming !== 'false';
    const departmentId = req.query.departmentId as string | undefined;
    const level = req.query.level as string | undefined;
    const events = await schoolService.listEvents(req.user!.schoolId, upcoming, departmentId, level);
    return sendSuccess(res, events);
  } catch (e) { return next(e); }
};

export const getEvent = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const event = await schoolService.getEvent(req.params.id);
    return sendSuccess(res, event);
  } catch (e) { return next(e); }
};

export const createEvent = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const input = createEventSchema.parse(req.body);
    const event = await schoolService.createEvent(input, req.user!);
    return sendSuccess(res, event, 201);
  } catch (e) { return next(e); }
};

export const updateEvent = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const input = updateEventSchema.parse(req.body);
    const event = await schoolService.updateEvent(req.params.id, input, req.user!);
    return sendSuccess(res, event);
  } catch (e) { return next(e); }
};

export const deleteEvent = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await schoolService.deleteEvent(req.params.id, req.user!);
    return sendSuccess(res, result);
  } catch (e) { return next(e); }
};

export const uploadEventImage = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.file) throw new AppError('No file uploaded', 400);
    const event = await schoolService.uploadEventImage(req.params.id, req.file, req.user!);
    return sendSuccess(res, event);
  } catch (e) { return next(e); }
};

export const setEventReminder = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const input = setEventReminderSchema.parse(req.body);
    const reminder = await schoolService.setEventReminder(req.params.id, req.user!.id, input);
    return sendSuccess(res, reminder, 201);
  } catch (e) { return next(e); }
};

// ── Tickets ────────────────────────────────────────────────

export const submitReceipt = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const input = submitReceiptSchema.parse(req.body);
    const ticket = await schoolService.submitReceipt(req.params.id, req.user!.id, input);
    return sendSuccess(res, ticket, 201);
  } catch (e) { return next(e); }
};

export const getMyTicket = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const ticket = await schoolService.getMyTicket(req.params.id, req.user!.id);
    return sendSuccess(res, ticket);
  } catch (e) { return next(e); }
};

export const listTickets = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tickets = await schoolService.listTickets(req.params.id);
    return sendSuccess(res, tickets);
  } catch (e) { return next(e); }
};

export const approveTicket = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const ticket = await schoolService.approveTicket(req.params.ticketId, req.user!.id);
    return sendSuccess(res, ticket);
  } catch (e) { return next(e); }
};

export const rejectTicket = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const input = rejectTicketSchema.parse(req.body);
    const ticket = await schoolService.rejectTicket(req.params.ticketId, req.user!.id, input);
    return sendSuccess(res, ticket);
  } catch (e) { return next(e); }
};

// ── Map Locations ──────────────────────────────────────────

export const listMapLocations = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const type = req.query.type as string | undefined;
    const search = req.query.search as string | undefined;
    const locations = await schoolService.listMapLocations(req.user!.schoolId, type, search);
    return sendSuccess(res, locations);
  } catch (e) { return next(e); }
};

export const getMapLocation = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const location = await schoolService.getMapLocation(req.params.id);
    return sendSuccess(res, location);
  } catch (e) { return next(e); }
};

export const createMapLocation = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const input = createMapLocationSchema.parse(req.body);
    const location = await schoolService.createMapLocation(input, req.user!.id, req.user!.schoolId);
    return sendSuccess(res, location, 201);
  } catch (e) { return next(e); }
};

export const updateMapLocation = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const input = updateMapLocationSchema.parse(req.body);
    const location = await schoolService.updateMapLocation(req.params.id, input);
    return sendSuccess(res, location);
  } catch (e) { return next(e); }
};

export const bulkUpdateMapLocations = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const input = bulkUpdateMapLocationsSchema.parse(req.body);
    const result = await schoolService.bulkUpdateMapLocations(input);
    return sendSuccess(res, result);
  } catch (e) { return next(e); }
};

export const deleteMapLocation = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await schoolService.deleteMapLocation(req.params.id);
    return sendSuccess(res, result);
  } catch (e) { return next(e); }
};

export const getRoute = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const query = routeQuerySchema.parse(req.query);
    const route = await schoolService.getRoute(query);
    return sendSuccess(res, route);
  } catch (e) { return next(e); }
};

// ── Emergency Contacts ─────────────────────────────────────

export const listEmergencyContacts = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const contacts = await schoolService.listEmergencyContacts(req.user!.schoolId);
    return sendSuccess(res, contacts);
  } catch (e) { return next(e); }
};

export const createEmergencyContact = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const input = createEmergencyContactSchema.parse(req.body);
    const contact = await schoolService.createEmergencyContact(input, req.user!.id, req.user!.schoolId);
    return sendSuccess(res, contact, 201);
  } catch (e) { return next(e); }
};

export const updateEmergencyContact = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const input = updateEmergencyContactSchema.parse(req.body);
    const contact = await schoolService.updateEmergencyContact(req.params.id, input, req.user!.schoolId);
    return sendSuccess(res, contact);
  } catch (e) { return next(e); }
};

export const deleteEmergencyContact = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await schoolService.deleteEmergencyContact(req.params.id, req.user!.schoolId);
    return sendSuccess(res, result);
  } catch (e) { return next(e); }
};
