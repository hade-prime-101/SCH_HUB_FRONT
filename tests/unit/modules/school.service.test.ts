import { randomUUID } from 'crypto';
import { prismaMock } from '../../helpers/mock-factories';
import { schoolService } from '@/modules/school/school.service';

const user = {
  id: 'u-1', role: 'STUDENT', schoolId: 'sch-1',
  departmentId: 'dep-1', level: '200',
};
const adminUser = { ...user, role: 'SCHOOL_ADMIN' };
const repUser   = { ...user, role: 'COURSE_REP' };

// ── Timetable ──────────────────────────────────────────────────────────────

describe('schoolService.getTimetable', () => {
  it('returns personal timetable by default', async () => {
    prismaMock.timetableEntry.findMany.mockResolvedValue([]);
    const result = await schoolService.getTimetable(user);
    expect(prismaMock.timetableEntry.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ timetableType: 'PERSONAL' }) })
    );
    expect(result).toEqual([]);
  });

  it('returns departmental timetable', async () => {
    prismaMock.timetableEntry.findMany.mockResolvedValue([]);
    await schoolService.getTimetable(user, 'DEPARTMENTAL');
    expect(prismaMock.timetableEntry.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ timetableType: 'DEPARTMENTAL' }) })
    );
  });

  it('returns general timetable', async () => {
    prismaMock.timetableEntry.findMany.mockResolvedValue([]);
    await schoolService.getTimetable(user, 'GENERAL');
    expect(prismaMock.timetableEntry.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ timetableType: 'GENERAL' }) })
    );
  });

  it('throws 400 for invalid timetable type', async () => {
    await expect(schoolService.getTimetable(user, 'INVALID')).rejects.toMatchObject({ statusCode: 400 });
  });
});

describe('schoolService.createTimetableEntry', () => {
  const base = {
    timetableType: 'PERSONAL' as const, courseCode: 'CSC101', courseTitle: 'Intro',
    dayOfWeek: 1, startTime: '08:00', endTime: '10:00',
    type: 'LECTURE' as const, isRecurring: true,
  };

  it('throws 403 when student tries to create DEPARTMENTAL timetable', async () => {
    await expect(
      schoolService.createTimetableEntry({ ...base, timetableType: 'DEPARTMENTAL' as any }, user)
    ).rejects.toMatchObject({ statusCode: 403 });
  });

  it('throws 403 when non-admin tries to create GENERAL timetable', async () => {
    await expect(
      schoolService.createTimetableEntry({ ...base, timetableType: 'GENERAL' as any }, user)
    ).rejects.toMatchObject({ statusCode: 403 });
  });

  it('throws 400 when DEPARTMENTAL missing level/departmentId', async () => {
    await expect(
      schoolService.createTimetableEntry({ ...base, timetableType: 'DEPARTMENTAL' as any }, repUser)
    ).rejects.toMatchObject({ statusCode: 400 });
  });

  it('creates personal entry without conflict', async () => {
    prismaMock.timetableEntry.findFirst.mockResolvedValue(null);
    const entry = { id: 'e-1', ...base };
    prismaMock.timetableEntry.create.mockResolvedValue(entry as any);
    const result = await schoolService.createTimetableEntry(base, user);
    expect(result).toMatchObject({ id: 'e-1' });
  });

  it('throws 409 on time conflict for PERSONAL', async () => {
    prismaMock.timetableEntry.findFirst.mockResolvedValue({
      id: 'e-existing', courseCode: 'CSC200', startTime: '08:00', endTime: '10:00',
    } as any);
    await expect(schoolService.createTimetableEntry(base, user)).rejects.toMatchObject({ statusCode: 409 });
  });
});

describe('schoolService.deleteTimetableEntry', () => {
  it('throws 404 when entry not found', async () => {
    prismaMock.timetableEntry.findUnique.mockResolvedValue(null);
    await expect(schoolService.deleteTimetableEntry('e-1', user)).rejects.toMatchObject({ statusCode: 404 });
  });

  it('throws 403 when student deletes another user personal entry', async () => {
    prismaMock.timetableEntry.findUnique.mockResolvedValue({
      id: 'e-1', timetableType: 'PERSONAL', userId: 'other-user',
    } as any);
    await expect(schoolService.deleteTimetableEntry('e-1', user)).rejects.toMatchObject({ statusCode: 403 });
  });

  it('deletes own personal entry', async () => {
    prismaMock.timetableEntry.findUnique.mockResolvedValue({
      id: 'e-1', timetableType: 'PERSONAL', userId: 'u-1',
    } as any);
    prismaMock.timetableEntry.delete.mockResolvedValue({} as any);
    const result = await schoolService.deleteTimetableEntry('e-1', user);
    expect(result).toEqual({ deleted: true });
  });
});

// ── Events ─────────────────────────────────────────────────────────────────

describe('schoolService.getEvent', () => {
  it('throws 404 when event not found', async () => {
    prismaMock.schoolEvent.findUnique.mockResolvedValue(null);
    await expect(schoolService.getEvent('ev-1')).rejects.toMatchObject({ statusCode: 404 });
  });

  it('returns event when found', async () => {
    const event = { id: 'ev-1', title: 'Hackathon', startDate: new Date() };
    prismaMock.schoolEvent.findUnique.mockResolvedValue(event as any);
    const result = await schoolService.getEvent('ev-1');
    expect(result).toMatchObject({ id: 'ev-1' });
  });
});

describe('schoolService.createEvent', () => {
  it('throws 403 when student tries to create event', async () => {
    await expect(
      schoolService.createEvent({ title: 'Fest', startDate: new Date().toISOString() } as any, user)
    ).rejects.toMatchObject({ statusCode: 403 });
  });

  it('creates event for admin', async () => {
    const event = { id: 'ev-new', title: 'Fest', startDate: new Date(), departmentId: null };
    prismaMock.schoolEvent.create.mockResolvedValue(event as any);
    // eventAudience called by syncEventReminders + broadcastEvent — stub them
    prismaMock.schoolEvent.findUnique.mockResolvedValue({ ...event, schoolId: 'sch-1', level: null, venue: null } as any);
    prismaMock.user.findMany.mockResolvedValue([]);

    const result = await schoolService.createEvent(
      { title: 'Fest', startDate: new Date().toISOString() } as any,
      adminUser,
    );
    expect(result).toMatchObject({ id: 'ev-new' });
  });
});

describe('schoolService.deleteEvent', () => {
  it('throws 404 when event not found', async () => {
    prismaMock.schoolEvent.findUnique.mockResolvedValue(null);
    await expect(schoolService.deleteEvent('ev-1', adminUser)).rejects.toMatchObject({ statusCode: 404 });
  });

  it('soft-deletes event', async () => {
    prismaMock.schoolEvent.findUnique.mockResolvedValue({ id: 'ev-1', departmentId: 'dep-1' } as any);
    prismaMock.schoolEvent.update.mockResolvedValue({} as any);
    const result = await schoolService.deleteEvent('ev-1', adminUser);
    expect(result).toEqual({ deleted: true });
  });
});

// ── Map Locations ──────────────────────────────────────────────────────────

describe('schoolService.getMapLocation', () => {
  it('throws 404 when not found', async () => {
    prismaMock.mapLocation.findUnique.mockResolvedValue(null);
    await expect(schoolService.getMapLocation('loc-1')).rejects.toMatchObject({ statusCode: 404 });
  });

  it('returns location when found', async () => {
    const loc = { id: 'loc-1', name: 'Library' };
    prismaMock.mapLocation.findUnique.mockResolvedValue(loc as any);
    expect(await schoolService.getMapLocation('loc-1')).toMatchObject({ id: 'loc-1' });
  });
});

describe('schoolService.deleteMapLocation', () => {
  it('throws 404 when not found', async () => {
    prismaMock.mapLocation.findUnique.mockResolvedValue(null);
    await expect(schoolService.deleteMapLocation('loc-1')).rejects.toMatchObject({ statusCode: 404 });
  });

  it('deletes location', async () => {
    prismaMock.mapLocation.findUnique.mockResolvedValue({ id: 'loc-1' } as any);
    prismaMock.mapLocation.delete.mockResolvedValue({} as any);
    expect(await schoolService.deleteMapLocation('loc-1')).toEqual({ deleted: true });
  });
});

// ── Emergency Contacts ─────────────────────────────────────────────────────

describe('schoolService.updateEmergencyContact', () => {
  it('throws 404 when contact not found', async () => {
    prismaMock.emergencyContact.findUnique.mockResolvedValue(null);
    await expect(schoolService.updateEmergencyContact('c-1', {}, 'sch-1')).rejects.toMatchObject({ statusCode: 404 });
  });

  it('throws 403 when contact belongs to different school', async () => {
    prismaMock.emergencyContact.findUnique.mockResolvedValue({ id: 'c-1', schoolId: 'sch-other' } as any);
    await expect(schoolService.updateEmergencyContact('c-1', {}, 'sch-1')).rejects.toMatchObject({ statusCode: 403 });
  });

  it('updates contact', async () => {
    prismaMock.emergencyContact.findUnique.mockResolvedValue({ id: 'c-1', schoolId: 'sch-1' } as any);
    prismaMock.emergencyContact.update.mockResolvedValue({ id: 'c-1', name: 'Security' } as any);
    const result = await schoolService.updateEmergencyContact('c-1', { name: 'Security' } as any, 'sch-1');
    expect(result).toMatchObject({ id: 'c-1' });
  });
});

describe('schoolService.deleteEmergencyContact', () => {
  it('throws 404 when not found', async () => {
    prismaMock.emergencyContact.findUnique.mockResolvedValue(null);
    await expect(schoolService.deleteEmergencyContact('c-1', 'sch-1')).rejects.toMatchObject({ statusCode: 404 });
  });

  it('throws 403 for wrong school', async () => {
    prismaMock.emergencyContact.findUnique.mockResolvedValue({ id: 'c-1', schoolId: 'sch-other' } as any);
    await expect(schoolService.deleteEmergencyContact('c-1', 'sch-1')).rejects.toMatchObject({ statusCode: 403 });
  });

  it('deletes contact', async () => {
    prismaMock.emergencyContact.findUnique.mockResolvedValue({ id: 'c-1', schoolId: 'sch-1' } as any);
    prismaMock.emergencyContact.delete.mockResolvedValue({} as any);
    expect(await schoolService.deleteEmergencyContact('c-1', 'sch-1')).toEqual({ deleted: true });
  });
});

// ── setEventReminder ───────────────────────────────────────────────────────

describe('schoolService.setEventReminder', () => {
  it('throws 404 when event not found', async () => {
    prismaMock.schoolEvent.findUnique.mockResolvedValue(null);
    await expect(
      schoolService.setEventReminder('ev-1', 'u-1', { notifyAt: new Date().toISOString() })
    ).rejects.toMatchObject({ statusCode: 404 });
  });

  it('throws 400 when reminder is after event start', async () => {
    const startDate = new Date(Date.now() + 3600_000);
    const notifyAt  = new Date(Date.now() + 7200_000).toISOString(); // after start
    prismaMock.schoolEvent.findUnique.mockResolvedValue({ id: 'ev-1', startDate } as any);
    await expect(
      schoolService.setEventReminder('ev-1', 'u-1', { notifyAt })
    ).rejects.toMatchObject({ statusCode: 400 });
  });

  it('upserts reminder when valid', async () => {
    const startDate = new Date(Date.now() + 7200_000);
    const notifyAt  = new Date(Date.now() + 3600_000).toISOString(); // before start
    prismaMock.schoolEvent.findUnique.mockResolvedValue({ id: 'ev-1', startDate } as any);
    prismaMock.eventReminder.upsert.mockResolvedValue({ id: 'r-1' } as any);
    const result = await schoolService.setEventReminder('ev-1', 'u-1', { notifyAt });
    expect(result).toMatchObject({ id: 'r-1' });
  });
});
