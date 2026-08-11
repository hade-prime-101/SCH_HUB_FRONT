import { prismaMock } from '../../helpers/mock-factories';
import { cgpaService } from '@/modules/cgpa/cgpa.service';

const mockCourse = (overrides = {}) => ({
  id         : 'c-1',
  userId     : 'u-1',
  courseCode : 'CSC101',
  courseTitle: 'Intro to CS',
  creditUnit : 3,
  score      : 75,
  grade      : 'A',
  gradePoint : 5.0,
  passmark   : 40,
  semester   : 'FIRST' as const,
  session    : '2023/2024',
  createdAt  : new Date(),
  updatedAt  : new Date(),
  ...overrides,
});

// ── listCourses ───────────────────────────────────────────────────────────

describe('cgpaService.listCourses()', () => {
  it('returns courses for user', async () => {
    prismaMock.cGPACourse.findMany.mockResolvedValue([mockCourse()] as any);
    const result = await cgpaService.listCourses('u-1', {});
    expect(result).toHaveLength(1);
  });

  it('filters by semester and session', async () => {
    prismaMock.cGPACourse.findMany.mockResolvedValue([mockCourse()] as any);
    await cgpaService.listCourses('u-1', { semester: 'FIRST', session: '2023/2024' });
    expect(prismaMock.cGPACourse.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ semester: 'FIRST', session: '2023/2024' }) })
    );
  });
});

// ── createCourse ──────────────────────────────────────────────────────────

describe('cgpaService.createCourse()', () => {
  const input = {
    courseCode : 'CSC101',
    courseTitle: 'Intro to CS',
    creditUnit : 3,
    score      : 75,
    passmark   : 40,
    semester   : 'FIRST' as const,
    session    : '2023/2024',
  };

  it('creates course with grade A for score >= 70', async () => {
    prismaMock.cGPACourse.create.mockResolvedValue(mockCourse({ grade: 'A', gradePoint: 5.0 }) as any);
    const result = await cgpaService.createCourse('u-1', { ...input, score: 75 });
    expect(prismaMock.cGPACourse.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ grade: 'A', gradePoint: 5.0 }) })
    );
  });

  it('creates course with grade B for score 60-69', async () => {
    prismaMock.cGPACourse.create.mockResolvedValue(mockCourse({ grade: 'B', gradePoint: 4.0 }) as any);
    await cgpaService.createCourse('u-1', { ...input, score: 65 });
    expect(prismaMock.cGPACourse.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ grade: 'B', gradePoint: 4.0 }) })
    );
  });

  it('creates course with grade F for score below passmark', async () => {
    prismaMock.cGPACourse.create.mockResolvedValue(mockCourse({ grade: 'F', gradePoint: 0.0 }) as any);
    await cgpaService.createCourse('u-1', { ...input, score: 30 });
    expect(prismaMock.cGPACourse.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ grade: 'F', gradePoint: 0.0 }) })
    );
  });

  it('creates course without grade when score is undefined', async () => {
    prismaMock.cGPACourse.create.mockResolvedValue(mockCourse({ grade: null, gradePoint: null }) as any);
    const { score, ...inputWithoutScore } = input;
    await cgpaService.createCourse('u-1', inputWithoutScore);
    expect(prismaMock.cGPACourse.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ grade: undefined, gradePoint: undefined }) })
    );
  });
});

// ── updateCourse ──────────────────────────────────────────────────────────

describe('cgpaService.updateCourse()', () => {
  it('throws 404 when course not found', async () => {
    prismaMock.cGPACourse.findUnique.mockResolvedValue(null);
    await expect(cgpaService.updateCourse('c-1', 'u-1', { score: 80 }))
      .rejects.toMatchObject({ statusCode: 404 });
  });

  it('throws 403 when course belongs to different user', async () => {
    prismaMock.cGPACourse.findUnique.mockResolvedValue(mockCourse({ userId: 'other' }) as any);
    await expect(cgpaService.updateCourse('c-1', 'u-1', { score: 80 }))
      .rejects.toMatchObject({ statusCode: 403 });
  });

  it('updates course and recalculates grade', async () => {
    prismaMock.cGPACourse.findUnique.mockResolvedValue(mockCourse() as any);
    prismaMock.cGPACourse.update.mockResolvedValue(mockCourse({ score: 80, grade: 'A' }) as any);
    const result = await cgpaService.updateCourse('c-1', 'u-1', { score: 80 });
    expect(prismaMock.cGPACourse.update).toHaveBeenCalled();
  });
});

// ── deleteCourse ──────────────────────────────────────────────────────────

describe('cgpaService.deleteCourse()', () => {
  it('throws 404 when course not found', async () => {
    prismaMock.cGPACourse.findUnique.mockResolvedValue(null);
    await expect(cgpaService.deleteCourse('c-1', 'u-1'))
      .rejects.toMatchObject({ statusCode: 404 });
  });

  it('throws 403 when course belongs to different user', async () => {
    prismaMock.cGPACourse.findUnique.mockResolvedValue(mockCourse({ userId: 'other' }) as any);
    await expect(cgpaService.deleteCourse('c-1', 'u-1'))
      .rejects.toMatchObject({ statusCode: 403 });
  });

  it('deletes course successfully', async () => {
    prismaMock.cGPACourse.findUnique.mockResolvedValue(mockCourse() as any);
    prismaMock.cGPACourse.delete.mockResolvedValue({} as any);
    const result = await cgpaService.deleteCourse('c-1', 'u-1');
    expect(result.deleted).toBe(true);
  });
});

// ── calculate ─────────────────────────────────────────────────────────────

describe('cgpaService.calculate()', () => {
  const input = { semester: 'FIRST' as const, session: '2023/2024' };

  it('throws 400 when no courses found', async () => {
    prismaMock.cGPACourse.findMany.mockResolvedValue([]);
    await expect(cgpaService.calculate('u-1', input))
      .rejects.toMatchObject({ statusCode: 400 });
  });

  it('throws 400 when no graded courses found', async () => {
    prismaMock.cGPACourse.findMany.mockResolvedValue([
      mockCourse({ gradePoint: null }),
    ] as any);
    await expect(cgpaService.calculate('u-1', input))
      .rejects.toMatchObject({ statusCode: 400 });
  });

  it('calculates GPA and CGPA correctly', async () => {
    const courses = [
      mockCourse({ gradePoint: 5.0, creditUnit: 3 }),
      mockCourse({ id: 'c-2', gradePoint: 4.0, creditUnit: 2 }),
    ];
    prismaMock.cGPACourse.findMany
      .mockResolvedValueOnce(courses as any)  // semester courses
      .mockResolvedValueOnce(courses as any); // all courses for CGPA
    prismaMock.cGPARecord.upsert.mockResolvedValue({
      userId: 'u-1', semester: 'FIRST', session: '2023/2024',
      gpa: 4.6, cgpa: 4.6, totalUnits: 5,
    } as any);

    const result = await cgpaService.calculate('u-1', input);
    expect(result.gpa).toBeCloseTo(4.6, 1);
    expect(result.classification).toBe('First Class');
  });
});

// ── getRecords ────────────────────────────────────────────────────────────

describe('cgpaService.getRecords()', () => {
  it('returns records with classification', async () => {
    prismaMock.cGPARecord.findMany.mockResolvedValue([
      { id: 'r-1', cgpa: 4.6, gpa: 4.6, totalUnits: 5, semester: 'FIRST', session: '2023/2024', userId: 'u-1', createdAt: new Date(), updatedAt: new Date() },
    ] as any);
    const result = await cgpaService.getRecords('u-1');
    expect(result[0].classification).toBe('First Class');
  });
});

// ── getCurrentCGPA ────────────────────────────────────────────────────────

describe('cgpaService.getCurrentCGPA()', () => {
  it('returns zero CGPA when no courses', async () => {
    prismaMock.cGPACourse.findMany.mockResolvedValue([]);
    const result = await cgpaService.getCurrentCGPA('u-1');
    expect(result.cgpa).toBe(0);
    expect(result.classification).toBe('No grades yet');
  });

  it('calculates current CGPA from all graded courses', async () => {
    prismaMock.cGPACourse.findMany.mockResolvedValue([
      mockCourse({ gradePoint: 5.0, creditUnit: 3 }),
      mockCourse({ id: 'c-2', gradePoint: 3.0, creditUnit: 3 }),
    ] as any);
    const result = await cgpaService.getCurrentCGPA('u-1');
    expect(result.cgpa).toBe(4.0);
    expect(result.classification).toBe('Second Class Upper');
  });
});
