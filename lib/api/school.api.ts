// lib/school.api.ts

import { apiGet, apiPost, apiPatch, apiDelete } from '@/lib/api';
import type {
  TimetableEntry,
  CreateTimetableEntryPayload,
  UpdateTimetableEntryPayload,
  SchoolEvent,
  CreateEventPayload,
  UpdateEventPayload,
  SetEventReminderPayload,
  Ticket,
  SubmitReceiptPayload,
  RejectTicketPayload,
  EmergencyContact,
  CreateEmergencyContactPayload,
  UpdateEmergencyContactPayload,
} from '@/types/school';

// ─── Timetable ──────────────────────────────────────────────
export const getTimetable = (type?: string) =>
  apiGet<TimetableEntry[]>('/school/timetable', { type });

export const createTimetableEntry = (payload: CreateTimetableEntryPayload) =>
  apiPost<TimetableEntry>('/school/timetable', payload);

export const updateTimetableEntry = (id: string, payload: UpdateTimetableEntryPayload) =>
  apiPatch<TimetableEntry>(`/school/timetable/${id}`, payload);

export const deleteTimetableEntry = (id: string) =>
  apiDelete<{ message: string }>(`/school/timetable/${id}`);

// ─── Events ─────────────────────────────────────────────────
export const listEvents = (params?: { upcoming?: boolean; departmentId?: string; level?: string }) =>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  apiGet<SchoolEvent[]>('/school/events', params as any);

export const getEvent = (id: string) =>
  apiGet<SchoolEvent>(`/school/events/${id}`);

export const createEvent = (payload: CreateEventPayload) =>
  apiPost<SchoolEvent>('/school/events', payload);

export const updateEvent = (id: string, payload: UpdateEventPayload) =>
  apiPatch<SchoolEvent>(`/school/events/${id}`, payload);

export const deleteEvent = (id: string) =>
  apiDelete<{ message: string }>(`/school/events/${id}`);

export const uploadEventImage = (eventId: string, file: File) => {
  const formData = new FormData();
  formData.append('file', file);
  return apiPost<SchoolEvent>(`/school/events/${eventId}/image`, formData, true);
};

export const setEventReminder = (eventId: string, payload: SetEventReminderPayload) =>
  apiPost<{ id: string; eventId: string; minutesBefore: number }>(`/school/events/${eventId}/reminder`, payload);

// ─── Tickets ────────────────────────────────────────────────
export const submitReceipt = (eventId: string, payload: SubmitReceiptPayload) =>
  apiPost<Ticket>(`/school/events/${eventId}/ticket`, payload);

export const getMyTicket = (eventId: string) =>
  apiGet<Ticket>(`/school/events/${eventId}/ticket/my`);

export const listTickets = (eventId: string) =>
  apiGet<Ticket[]>(`/school/events/${eventId}/tickets`);

export const approveTicket = (ticketId: string) =>
  apiPost<Ticket>(`/school/tickets/${ticketId}/approve`, {});

export const rejectTicket = (ticketId: string, payload: RejectTicketPayload) =>
  apiPost<Ticket>(`/school/tickets/${ticketId}/reject`, payload);

// ─── Emergency Contacts ─────────────────────────────────────
export const listEmergencyContacts = () =>
  apiGet<EmergencyContact[]>('/school/emergency-contacts');

export const createEmergencyContact = (payload: CreateEmergencyContactPayload) =>
  apiPost<EmergencyContact>('/school/emergency-contacts', payload);

export const updateEmergencyContact = (id: string, payload: UpdateEmergencyContactPayload) =>
  apiPatch<EmergencyContact>(`/school/emergency-contacts/${id}`, payload);

export const deleteEmergencyContact = (id: string) =>
  apiDelete<{ message: string }>(`/school/emergency-contacts/${id}`);

// ─── School Configuration ───────────────────────────────────
export const getSchools = () =>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  apiGet<any[]>('/schools');

export const getFaculties = (schoolId: string) =>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  apiGet<any[]>(`/schools/${schoolId}/faculties`);

export const getDepartments = (facultyId: string) =>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  apiGet<any[]>(`/faculties/${facultyId}/departments`);

export const getMapConfig = () =>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  apiGet<any>('/school/map-config');

export const getRoute = (origin: string, destination: string) =>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  apiGet<any>('/school/route', { origin, destination });



export const schoolApi = {
  //Timetable
 getTimetable,
 createTimetableEntry,
 updateTimetableEntry,
 deleteTimetableEntry,

 //Events
  createEvent,
  deleteEvent,
  updateEvent,
  getEvent,
  listEvents,
  setEventReminder,
  uploadEventImage,
  
  // Event Ticket
  submitReceipt,
  getMyTicket,
  listTickets,
  approveTicket,
  rejectTicket,
  
  // Emergency
  listEmergencyContacts,
  createEmergencyContact,
  updateEmergencyContact,
  deleteEmergencyContact,

  // School Configuration
  getSchools,
  getFaculties,
  getDepartments,
  getMapConfig,
  getRoute,
};