import { randomUUID } from 'crypto';
import { prismaMock } from '../../helpers/mock-factories';
import { studyService } from '@/modules/study/study.service';

const userId   = 'u-1';
const adminId  = 'admin-1';
const matId    = 'mat-1';
const quizId   = 'quiz-1';

const mockMat = (overrides: Record<string, unknown> = {}) => ({
  id: matId, title: 'Notes', type: 'NOTES', courseCode: 'CSC101',
  courseTitle: 'Intro', mimeType: 'application/pdf', isDeleted: false,
  uploadedById: userId, visibility: 'PUBLIC', studyGroupId: null,
  department: { id: 'dep-1' }, level: '200', fileKey: 'key-1',
  ...overrides,
});

const mockQuiz = (overrides: Record<string, unknown> = {}) => ({
  id: quizId, title: 'Quiz 1', courseCode: 'CSC101', departmentId: 'dep-1',
  studyGroupId: null, visibility: 'PUBLIC', level: '200',
  createdById: userId, isActive: true, quizApprovalStatus: 'APPROVED',
  isAiGenerated: false, isDraft: false,
  questions: [{ id: 'q-1', question: 'What is X?', options: ['A','B'], correctAnswer: 0, explanation: 'A', order: 0 }],
  ...overrides,
});

// ── getMaterial ────────────────────────────────────────────────────────────

describe('studyService.getMaterial', () => {
  it('throws 404 when material not found', async () => {
    prismaMock.material.findUnique.mockResolvedValue(null);
    await expect(studyService.getMaterial(matId, userId, 'STUDENT')).rejects.toMatchObject({ statusCode: 404 });
  });

  it('returns material and increments view count', async () => {
    const mat = mockMat();
    prismaMock.material.findUnique.mockResolvedValue(mat as any);
    prismaMock.material.update.mockResolvedValue(mat as any);
    prismaMock.bookmark.findUnique.mockResolvedValue(null);
    prismaMock.materialRating.findUnique.mockResolvedValue(null);

    const result = await studyService.getMaterial(matId, userId, 'STUDENT');
    expect(result).toMatchObject({ id: matId });
    expect(prismaMock.material.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { viewCount: { increment: 1 } } })
    );
  });
});

// ── deleteMaterial ─────────────────────────────────────────────────────────

describe('studyService.deleteMaterial', () => {
  it('throws 404 when material not found', async () => {
    prismaMock.material.findUnique.mockResolvedValue(null);
    await expect(studyService.deleteMaterial(matId, userId, 'STUDENT')).rejects.toMatchObject({ statusCode: 404 });
  });

  it('throws 403 when non-owner non-admin tries to delete', async () => {
    prismaMock.material.findUnique.mockResolvedValue(mockMat({ uploadedById: 'other' }) as any);
    await expect(studyService.deleteMaterial(matId, userId, 'STUDENT')).rejects.toMatchObject({ statusCode: 403 });
  });

  it('soft-deletes own material', async () => {
    prismaMock.material.findUnique.mockResolvedValue(mockMat() as any);
    prismaMock.material.update.mockResolvedValue({} as any);
    prismaMock.auditLog?.create?.mockResolvedValue?.({} as any);
    const result = await studyService.deleteMaterial(matId, userId, 'STUDENT');
    expect(result).toEqual({ deleted: true });
  });
});

// ── updateVisibility ───────────────────────────────────────────────────────

describe('studyService.updateVisibility', () => {
  it('throws 404 when material not found', async () => {
    prismaMock.material.findUnique.mockResolvedValue(null);
    await expect(
      studyService.updateVisibility(matId, { visibility: 'PUBLIC' } as any, userId, 'STUDENT')
    ).rejects.toMatchObject({ statusCode: 404 });
  });

  it('throws 403 when non-owner tries to update', async () => {
    prismaMock.material.findUnique.mockResolvedValue(mockMat({ uploadedById: 'other' }) as any);
    await expect(
      studyService.updateVisibility(matId, { visibility: 'PUBLIC' } as any, userId, 'STUDENT')
    ).rejects.toMatchObject({ statusCode: 403 });
  });

  it('throws 400 when STUDY_GROUP visibility missing studyGroupId', async () => {
    prismaMock.material.findUnique.mockResolvedValue(mockMat() as any);
    await expect(
      studyService.updateVisibility(matId, { visibility: 'STUDY_GROUP' } as any, userId, 'STUDENT')
    ).rejects.toMatchObject({ statusCode: 400 });
  });

  it('updates visibility', async () => {
    prismaMock.material.findUnique.mockResolvedValue(mockMat() as any);
    prismaMock.material.update.mockResolvedValue({ id: matId, visibility: 'DEPARTMENT' } as any);
    const result = await studyService.updateVisibility(
      matId, { visibility: 'DEPARTMENT' } as any, userId, 'STUDENT'
    );
    expect(result).toMatchObject({ visibility: 'DEPARTMENT' });
  });
});

// ── rateMaterial ───────────────────────────────────────────────────────────

describe('studyService.rateMaterial', () => {
  it('upserts rating and updates avgRating', async () => {
    prismaMock.materialRating.upsert.mockResolvedValue({} as any);
    prismaMock.materialRating.aggregate.mockResolvedValue({ _avg: { rating: 4.5 } } as any);
    prismaMock.material.update.mockResolvedValue({} as any);
    const result = await studyService.rateMaterial(matId, userId, { rating: 5 });
    expect(result).toMatchObject({ rated: true, avgRating: 4.5 });
  });
});

// ── toggleBookmark ─────────────────────────────────────────────────────────

describe('studyService.toggleBookmark', () => {
  it('creates bookmark when none exists', async () => {
    prismaMock.bookmark.findUnique.mockResolvedValue(null);
    prismaMock.bookmark.create.mockResolvedValue({} as any);
    expect(await studyService.toggleBookmark(matId, userId)).toEqual({ bookmarked: true });
  });

  it('removes bookmark when already bookmarked', async () => {
    prismaMock.bookmark.findUnique.mockResolvedValue({ id: 'b-1' } as any);
    prismaMock.bookmark.delete.mockResolvedValue({} as any);
    expect(await studyService.toggleBookmark(matId, userId)).toEqual({ bookmarked: false });
  });
});

// ── getQuiz ────────────────────────────────────────────────────────────────

describe('studyService.getQuiz', () => {
  it('throws 404 when quiz not found', async () => {
    prismaMock.quiz.findUnique.mockResolvedValue(null);
    await expect(studyService.getQuiz(quizId, userId, 'STUDENT')).rejects.toMatchObject({ statusCode: 404 });
  });

  it('throws 404 when quiz not approved and user is student', async () => {
    prismaMock.quiz.findUnique.mockResolvedValue(mockQuiz({ quizApprovalStatus: 'PENDING' }) as any);
    await expect(studyService.getQuiz(quizId, userId, 'STUDENT')).rejects.toMatchObject({ statusCode: 404 });
  });

  it('returns quiz for approved quiz', async () => {
    prismaMock.quiz.findUnique.mockResolvedValue(mockQuiz() as any);
    const result = await studyService.getQuiz(quizId, userId, 'STUDENT');
    expect(result).toMatchObject({ id: quizId });
  });
});

// ── createQuiz ─────────────────────────────────────────────────────────────

describe('studyService.createQuiz', () => {
  it('throws 403 when student tries to create quiz', async () => {
    await expect(
      studyService.createQuiz({ title: 'Q', courseCode: 'CSC101', questions: [] } as any, userId, 'STUDENT')
    ).rejects.toMatchObject({ statusCode: 403 });
  });

  it('throws 400 when STUDY_GROUP visibility missing studyGroupId', async () => {
    await expect(
      studyService.createQuiz(
        { title: 'Q', courseCode: 'CSC101', visibility: 'STUDY_GROUP', questions: [] } as any,
        userId, 'COURSE_REP'
      )
    ).rejects.toMatchObject({ statusCode: 400 });
  });

  it('creates quiz for course rep', async () => {
    const quiz = { ...mockQuiz(), questions: [] };
    prismaMock.quiz.create.mockResolvedValue(quiz as any);
    prismaMock.quizQuestionStat.createMany.mockResolvedValue({ count: 0 } as any);
    const result = await studyService.createQuiz(
      { title: 'Q', courseCode: 'CSC101', visibility: 'PUBLIC', questions: [], isDraft: true } as any,
      userId, 'COURSE_REP'
    );
    expect(result).toMatchObject({ id: quizId });
  });
});

// ── deleteQuiz ─────────────────────────────────────────────────────────────

describe('studyService.deleteQuiz', () => {
  it('throws 404 when quiz not found', async () => {
    prismaMock.quiz.findUnique.mockResolvedValue(null);
    await expect(studyService.deleteQuiz(quizId, userId, 'STUDENT')).rejects.toMatchObject({ statusCode: 404 });
  });

  it('throws 403 when non-owner non-admin tries to delete', async () => {
    prismaMock.quiz.findUnique.mockResolvedValue(mockQuiz({ createdById: 'other' }) as any);
    await expect(studyService.deleteQuiz(quizId, userId, 'STUDENT')).rejects.toMatchObject({ statusCode: 403 });
  });

  it('soft-deletes quiz', async () => {
    prismaMock.quiz.findUnique.mockResolvedValue(mockQuiz() as any);
    prismaMock.quiz.update.mockResolvedValue({} as any);
    expect(await studyService.deleteQuiz(quizId, userId, 'STUDENT')).toEqual({ deleted: true });
  });
});

// ── submitQuizAttempt ──────────────────────────────────────────────────────

describe('studyService.submitQuizAttempt', () => {
  it('throws 404 when quiz not found', async () => {
    prismaMock.quiz.findUnique.mockResolvedValue(null);
    await expect(
      studyService.submitQuizAttempt(quizId, userId, { answers: [], timeTaken: 60 }, 'STUDENT')
    ).rejects.toMatchObject({ statusCode: 404 });
  });

  it('throws 403 when quiz not approved', async () => {
    prismaMock.quiz.findUnique.mockResolvedValue(mockQuiz({ quizApprovalStatus: 'PENDING' }) as any);
    await expect(
      studyService.submitQuizAttempt(quizId, userId, { answers: [], timeTaken: 60 }, 'STUDENT')
    ).rejects.toMatchObject({ statusCode: 403 });
  });

  it('scores attempt correctly', async () => {
    prismaMock.quiz.findUnique.mockResolvedValue(mockQuiz() as any);
    prismaMock.quizAttempt.create.mockResolvedValue({
      id: 'att-1', score: 1, totalQuestions: 1, percentage: 100,
    } as any);
    prismaMock.quizAnalytics.upsert.mockResolvedValue({} as any);
    prismaMock.quizAnalytics.update.mockResolvedValue({} as any);
    prismaMock.quizQuestionStat.upsert.mockResolvedValue({} as any);

    const result = await studyService.submitQuizAttempt(
      quizId, userId,
      { answers: [{ questionId: 'q-1', selected: 0 }], timeTaken: 30 },
      'STUDENT'
    );
    expect(result.score).toBe(1);
    expect(result.answers[0].correct).toBe(true);
  });
});

// ── getMyAnalytics ─────────────────────────────────────────────────────────

describe('studyService.getMyAnalytics', () => {
  it('returns zero defaults when no analytics exist', async () => {
    prismaMock.quizAnalytics.findUnique.mockResolvedValue(null);
    prismaMock.quizAttempt.findMany.mockResolvedValue([]);
    const result = await studyService.getMyAnalytics(userId);
    expect(result.totalAttempts).toBe(0);
    expect(result.completionRate).toBe(0);
    expect(result.weakTopics).toEqual([]);
  });

  it('calculates completion rate', async () => {
    prismaMock.quizAnalytics.findUnique.mockResolvedValue({
      totalAttempts: 5, totalCorrect: 8, totalQuestions: 10,
      weakTopics: ['Arrays'], topicAttempts: {},
    } as any);
    prismaMock.quizAttempt.findMany.mockResolvedValue([]);
    const result = await studyService.getMyAnalytics(userId);
    expect(result.completionRate).toBe(80);
    expect(result.weakTopics).toContain('Arrays');
  });
});
