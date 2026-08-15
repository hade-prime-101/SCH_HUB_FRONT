// types/school.ts

export interface TimetableEntry {
  id: string;
  courseName: string;
  day: string;           // e.g. 'MONDAY'
  startTime: string;     // 'HH:mm'
  endTime: string;
  venue?: string;
  lecturer?: string;
  type?: string;         // 'LECTURE' | 'TUTORIAL' etc.
  departmentId?: string;
  level?: string;
}

export interface CreateTimetableEntryPayload {
  courseName: string;
  day: string;
  startTime: string;
  endTime: string;
  venue?: string;
  lecturer?: string;
  type?: string;
}

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface UpdateTimetableEntryPayload extends Partial<CreateTimetableEntryPayload> {}

export interface SchoolEvent {
  id: string;
  title: string;
  description: string;
  date: string;          // ISO date string
  time?: string;         // HH:mm
  venue?: string;
  imageUrl?: string;
  departmentId?: string;
  level?: string;
  schoolId: string;
  createdAt: string;
}

export interface CreateEventPayload {
  title: string;
  description: string;
  date: string;
  time?: string;
  venue?: string;
  departmentId?: string;
  level?: string;
}

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface UpdateEventPayload extends Partial<CreateEventPayload> {}

export interface EventReminder {
  id: string;
  eventId: string;
  userId: string;
  minutesBefore: number;
}

export interface SetEventReminderPayload {
  minutesBefore: number;
}

export interface Ticket {
  id: string;
  eventId: string;
  userId: string;
  receiptUrl?: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  rejectionReason?: string;
  createdAt: string;
}

export interface SubmitReceiptPayload {
  receiptUrl: string;     // after image upload we get a URL
}

export interface RejectTicketPayload {
  reason: string;
}

export interface EmergencyContact {
  id: string;
  name: string;
  phone: string;
  role: string;
  schoolId: string;
}

export interface CreateEmergencyContactPayload {
  name: string;
  phone: string;
  role: string;
}

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface UpdateEmergencyContactPayload extends Partial<CreateEmergencyContactPayload> {}