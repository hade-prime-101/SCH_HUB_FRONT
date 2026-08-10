import { apiFetch } from "./base";
import type { SchoolType, FacultyType, DepartmentType, User } from "@/types/auth";

export const schoolApi = {
  getSchools: () => apiFetch<SchoolType[]>("/school/schools"),

  getFaculties: (schoolId: string) =>
    apiFetch<FacultyType[]>(`/school/schools/${schoolId}/faculties`),

  getDepartments: (facultyId: string) =>
    apiFetch<DepartmentType[]>(`/school/faculties/${facultyId}/departments`),

  // Timetable
  getTimetable: (type: "PERSONAL" | "DEPARTMENTAL" | "GENERAL" = "PERSONAL") =>
    apiFetch<any[]>(`/school/timetable?type=${type}`),

  createTimetableEntry: (data: Record<string, unknown>) =>
    apiFetch<any>("/school/timetable", { method: "POST", body: JSON.stringify(data) }),

  updateTimetableEntry: (id: string, data: Record<string, unknown>) =>
    apiFetch<any>(`/school/timetable/${id}`, { method: "PUT", body: JSON.stringify(data) }),

  deleteTimetableEntry: (id: string) =>
    apiFetch<void>(`/school/timetable/${id}`, { method: "DELETE" }),

  // Events
  getEvents: (params?: Record<string, string>) => {
    const q = params ? "?" + new URLSearchParams(params).toString() : "";
    return apiFetch<any[]>(`/school/events${q}`);
  },

  getEvent: (id: string) => apiFetch<any>(`/school/events/${id}`),

  createEvent: (data: Record<string, unknown>) =>
    apiFetch<any>("/school/events", { method: "POST", body: JSON.stringify(data) }),

  updateEvent: (id: string, data: Record<string, unknown>) =>
    apiFetch<any>(`/school/events/${id}`, { method: "PATCH", body: JSON.stringify(data) }),

  deleteEvent: (id: string) =>
    apiFetch<void>(`/school/events/${id}`, { method: "DELETE" }),

  setEventReminder: (id: string, notifyAt: string) =>
    apiFetch<any>(`/school/events/${id}/remind`, {
      method: "POST",
      body: JSON.stringify({ notifyAt }),
    }),

  uploadEventImage: (id: string, file: File) => {
    const form = new FormData();
    form.append("image", file);
    return apiFetch<any>(`/school/events/${id}/image`, { method: "POST", body: form });
  },

  // Tickets
  submitReceipt: (id: string, receiptUrl: string, receiptKey: string) =>
    apiFetch<any>(`/school/events/${id}/tickets`, {
      method: "POST",
      body: JSON.stringify({ receiptUrl, receiptKey }),
    }),

  getMyTicket: (id: string) => apiFetch<any>(`/school/events/${id}/tickets/mine`),

  listTickets: (id: string) => apiFetch<any[]>(`/school/events/${id}/tickets`),

  approveTicket: (eventId: string, ticketId: string) =>
    apiFetch<any>(`/school/events/${eventId}/tickets/${ticketId}/approve`, { method: "PATCH" }),

  rejectTicket: (eventId: string, ticketId: string, rejectionReason: string) =>
    apiFetch<any>(`/school/events/${eventId}/tickets/${ticketId}/reject`, {
      method: "PATCH",
      body: JSON.stringify({ rejectionReason }),
    }),

  // Emergency Contacts
  getEmergencyContacts: () => apiFetch<any[]>("/school/emergency-contacts"),

  createEmergencyContact: (data: Record<string, unknown>) =>
    apiFetch<any>("/school/emergency-contacts", { method: "POST", body: JSON.stringify(data) }),

  updateEmergencyContact: (id: string, data: Record<string, unknown>) =>
    apiFetch<any>(`/school/emergency-contacts/${id}`, { method: "PATCH", body: JSON.stringify(data) }),

  deleteEmergencyContact: (id: string) =>
    apiFetch<void>(`/school/emergency-contacts/${id}`, { method: "DELETE" }),

  // Map config
  getMapConfig: () => apiFetch<{ maptilerApiKey: string }>("/school/map-config"),

  // Campus Map — correct endpoints
  getMapFeatures: (params?: { category?: string; search?: string; bbox?: string; limit?: number }) => {
    if (params?.search) {
      // Search uses a dedicated endpoint
      const q = new URLSearchParams({ q: params.search });
      if (params.category) q.set("category", params.category);
      return apiFetch<any>(`/campus-map/search?${q.toString()}`);
    }
    const q = new URLSearchParams();
    if (params?.category) q.set("category", params.category);
    if (params?.bbox)     q.set("bbox", params.bbox);
    if (params?.limit)    q.set("limit", String(params.limit));
    const qs = q.toString();
    return apiFetch<any>(`/campus-map/features${qs ? "?" + qs : ""}`);
  },

  getMapFeature: (id: string) => apiFetch<any>(`/campus-map/features/${id}`),

  getRoute: (from: { lat: number; lng: number }, to: { lat: number; lng: number; featureId?: string }) =>
    apiFetch<any>("/campus-map/route", {
      method: "POST",
      body: JSON.stringify({
        from: { lat: from.lat, lng: from.lng },
        to:   { lat: to.lat,  lng: to.lng, ...(to.featureId ? { featureId: to.featureId } : {}) },
        mode: "walking",
      }),
    }),

  // Keep old names as aliases so nothing else breaks
  getMapLocations: (params?: { type?: string; search?: string }) => {
    const q = new URLSearchParams();
    if (params?.search) q.set("q", params.search);
    if (params?.type)   q.set("category", params.type);
    const qs = q.toString();
    if (params?.search) return apiFetch<any>(`/campus-map/search?${qs}`);
    return apiFetch<any>(`/campus-map/features${qs ? "?" + qs : ""}`);
  },

  getMapLocation: (id: string) => apiFetch<any>(`/campus-map/features/${id}`),
};
