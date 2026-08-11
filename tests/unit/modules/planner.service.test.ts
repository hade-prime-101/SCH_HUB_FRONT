import { prismaMock } from '../../helpers/mock-factories';
import { plannerService } from '@/modules/planner/planner.service';

const user = { id: 'u-1', schoolId: 'sch-1', departmentId: 'dep-1', level: '300' };

// ── getToday ───────────────────────────────────────────────────────────────

describe('plannerService.getToday', () => {
  beforeEach(() => {
    prismaMock.timetableEntry.findMany.mockResolvedValue([]);
    prismaMock.reminder.findMany.mockResolvedValue([]);
    prismaMock.schoolEvent.findMany.mockResolvedValue([]);
    prismaMock.deptReminder.findMany.mockResolvedValue([]);
  });

  it('returns today view with empty items when no data', async () => {
    const result = await plannerService.getToday(user);
    expect(result).toHaveProperty('date');
    expect(result).toHaveProperty('dayName');
    expect(result.items).toEqual([]);
  });

  it('includes timetable entries mapped to planner items', async () => {
    prismaMock.timetableEntry.findMany.mockResolvedValue([{
      id: 'tt-1', courseCode: 'CSC301', courseTitle: 'Data Structures',
      venue: 'LT1', startTime: '08:00', endTime: '10:00', type: 'LECTURE',
      dayOfWeek: new Date().getDay(),
    }] as any);

    const result = await plannerService.getToday(user);
    expect(result.items).toHaveLength(1);
    expect(result.items[0].sourceType).toBe('TIMETABLE');
    expect(result.items[0].title).toContain('CSC301');
  });

  it('includes reminders mapped to planner items', async () => {
    prismaMock.reminder.findMany.mockResolvedValue([{
      id: 'rem-1', title: 'Study for exam', description: 'Chapter 5',
      dueDate: new Date(), category: 'STUDY', isCompleted: false, priority: 'HIGH',
    }] as any);

    const result = await plannerService.getToday(user);
    expect(result.items).toHaveLength(1);
    expect(result.items[0].sourceType).toBe('REMINDER');
    expect(result.items[0].title).toBe('Study for exam');
    expect(result.items[0].isDone).toBe(false);
  });

  it('includes school events mapped to planner items', async () => {
    const startDate = new Date();
    prismaMock.schoolEvent.findMany.mockResolvedValue([{
      id: 'ev-1', title: 'Hackathon', type: 'INFO_ONLY',
      startDate, endDate: null, venue: 'Main Hall',
    }] as any);

    const result = await plannerService.getToday(user);
    expect(result.items).toHaveLength(1);
    expect(result.items[0].sourceType).toBe('EVENT');
    expect(result.items[0].title).toBe('Hackathon');
  });

  it('includes dept reminders mapped to planner items', async () => {
    prismaMock.deptReminder.findMany.mockResolvedValue([{
      id: 'dr-1', title: 'Assignment due', description: null, dueDate: new Date(),
    }] as any);

    const result = await plannerService.getToday(user);
    expect(result.items).toHaveLength(1);
    expect(result.items[0].sourceType).toBe('DEPT_REMINDER');
  });

  it('sorts items by startTime ascending', async () => {
    prismaMock.timetableEntry.findMany.mockResolvedValue([
      { id: 'tt-2', courseCode: 'MTH201', courseTitle: 'Calculus', venue: null, startTime: '10:00', endTime: '12:00', type: 'LECTURE', dayOfWeek: new Date().getDay() },
      { id: 'tt-1', courseCode: 'CSC301', courseTitle: 'DS', venue: null, startTime: '08:00', endTime: '10:00', type: 'LECTURE', dayOfWeek: new Date().getDay() },
    ] as any);

    const result = await plannerService.getToday(user);
    expect(result.items[0].startTime).toBe('08:00');
    expect(result.items[1].startTime).toBe('10:00');
  });
});

// ── getWeekly ──────────────────────────────────────────────────────────────

describe('plannerService.getWeekly', () => {
  beforeEach(() => {
    prismaMock.timetableEntry.findMany.mockResolvedValue([]);
    prismaMock.reminder.findMany.mockResolvedValue([]);
    prismaMock.schoolEvent.findMany.mockResolvedValue([]);
    prismaMock.deptReminder.findMany.mockResolvedValue([]);
  });

  it('returns weekly view with 7 days', async () => {
    const result = await plannerService.getWeekly(user);
    expect(Object.keys(result.days)).toHaveLength(7);
    expect(result).toHaveProperty('weekStart');
    expect(result).toHaveProperty('weekEnd');
    expect(result.weekOffset).toBe(0);
  });

  it('returns next week when weekOffset is 1', async () => {
    const current = await plannerService.getWeekly(user, 0);
    const next    = await plannerService.getWeekly(user, 1);
    expect(new Date(next.weekStart) > new Date(current.weekStart)).toBe(true);
  });

  it('places timetable entries on correct day of week', async () => {
    // Monday = dayOfWeek 1
    prismaMock.timetableEntry.findMany.mockResolvedValue([{
      id: 'tt-1', courseCode: 'CSC301', courseTitle: 'DS', venue: null,
      startTime: '08:00', endTime: '10:00', type: 'LECTURE', dayOfWeek: 1,
    }] as any);

    const result = await plannerService.getWeekly(user, 0);
    const days = Object.entries(result.days);
    // Find Monday (index 0 in Mon-Sun week)
    const [mondayKey, mondayData] = days[0];
    expect(mondayData.items).toHaveLength(1);
    expect(mondayData.items[0].sourceType).toBe('TIMETABLE');
  });

  it('each day has empty items array when no data', async () => {
    const result = await plannerService.getWeekly(user);
    for (const day of Object.values(result.days)) {
      expect(day.items).toEqual([]);
    }
  });
});
