import { randomUUID } from 'crypto';
import { prismaMock } from '../../helpers/mock-factories';
import { communityService } from '@/modules/community/community.service';

const user = { id: 'u-1', role: 'STUDENT', schoolId: 'sch-1', departmentId: 'dep-1', level: '300' };
const adminUser = { ...user, role: 'SCHOOL_ADMIN' };
const repUser   = { ...user, role: 'COURSE_REP' };

const mockPost = (overrides: Record<string, unknown> = {}) => ({
  id: 'p-1', content: 'Test post', section: 'QNA', isAnonymous: false,
  authorId: 'u-1', isDeleted: false, ...overrides,
});

const mockQuestion = (overrides: Record<string, unknown> = {}) => ({
  id: 'q-1', title: 'What is X?', content: 'Explain X', isAnonymous: false,
  authorId: 'u-1', isDeleted: false, courseTag: 'CSC301', departmentId: 'dep-1', ...overrides,
});

// ── Posts ──────────────────────────────────────────────────────────────────

describe('communityService.getPost', () => {
  it('throws 404 when post not found', async () => {
    prismaMock.communityPost.findUnique.mockResolvedValue(null);
    await expect(communityService.getPost('p-1')).rejects.toMatchObject({ statusCode: 404 });
  });

  it('returns post and increments view count', async () => {
    const post = { ...mockPost(), comments: [] };
    prismaMock.communityPost.findUnique.mockResolvedValue(post as any);
    prismaMock.communityPost.update.mockResolvedValue(post as any);
    const result = await communityService.getPost('p-1');
    expect(result).toMatchObject({ id: 'p-1' });
    expect(prismaMock.communityPost.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { viewCount: { increment: 1 } } })
    );
  });

  it('masks author for anonymous posts', async () => {
    const post = { ...mockPost({ isAnonymous: true, author: { id: 'u-1', fullName: 'John' } }), comments: [] };
    prismaMock.communityPost.findUnique.mockResolvedValue(post as any);
    prismaMock.communityPost.update.mockResolvedValue(post as any);
    const result = await communityService.getPost('p-1');
    expect(result.author).toBeNull();
  });
});

describe('communityService.createPost', () => {
  it('throws 403 when student posts announcement', async () => {
    await expect(
      communityService.createPost({ content: 'Notice', section: 'NOTICE_BOARD' } as any, user)
    ).rejects.toMatchObject({ statusCode: 403 });
  });

  it('throws 403 when 300L+ posts in FRESHERS_CORNER', async () => {
    await expect(
      communityService.createPost({ content: 'Hi freshers', section: 'FRESHERS_CORNER' } as any, user)
    ).rejects.toMatchObject({ statusCode: 403 });
  });

  it('throws 400 when mentor question missing courseCode', async () => {
    await expect(
      communityService.createPost(
        { content: 'Help', section: 'QNA', isMentorQuestion: true } as any,
        { ...user, level: '200' }
      )
    ).rejects.toMatchObject({ statusCode: 400 });
  });

  it('creates post for valid student input', async () => {
    const post = mockPost();
    prismaMock.communityPost.create.mockResolvedValue(post as any);
    prismaMock.user.update.mockResolvedValue({} as any);
    const result = await communityService.createPost(
      { content: 'Test', section: 'QNA', isAnonymous: false } as any,
      user
    );
    expect(result).toMatchObject({ id: 'p-1' });
  });
});

describe('communityService.deletePost', () => {
  it('throws 404 when post not found', async () => {
    prismaMock.communityPost.findUnique.mockResolvedValue(null);
    await expect(communityService.deletePost('p-1', user)).rejects.toMatchObject({ statusCode: 404 });
  });

  it('throws 403 when non-owner tries to delete', async () => {
    prismaMock.communityPost.findUnique.mockResolvedValue({ authorId: 'other' } as any);
    await expect(communityService.deletePost('p-1', user)).rejects.toMatchObject({ statusCode: 403 });
  });

  it('soft-deletes own post', async () => {
    prismaMock.communityPost.findUnique.mockResolvedValue({ authorId: 'u-1' } as any);
    prismaMock.communityPost.update.mockResolvedValue({} as any);
    expect(await communityService.deletePost('p-1', user)).toEqual({ deleted: true });
  });
});

describe('communityService.upvotePost', () => {
  it('throws 404 when post not found', async () => {
    prismaMock.communityPost.findUnique.mockResolvedValue(null);
    await expect(communityService.upvotePost('p-1')).rejects.toMatchObject({ statusCode: 404 });
  });

  it('increments upvote count', async () => {
    prismaMock.communityPost.findUnique.mockResolvedValue(mockPost() as any);
    prismaMock.communityPost.update.mockResolvedValue({} as any);
    expect(await communityService.upvotePost('p-1')).toEqual({ upvoted: true });
  });
});

// ── Questions ──────────────────────────────────────────────────────────────

describe('communityService.getQuestion', () => {
  it('throws 404 when not found', async () => {
    prismaMock.question.findUnique.mockResolvedValue(null);
    await expect(communityService.getQuestion('q-1')).rejects.toMatchObject({ statusCode: 404 });
  });

  it('returns question with answers', async () => {
    const q = { ...mockQuestion(), answers: [], acceptedAnswerId: null };
    prismaMock.question.findUnique.mockResolvedValue(q as any);
    prismaMock.question.update.mockResolvedValue(q as any);
    expect(await communityService.getQuestion('q-1')).toMatchObject({ id: 'q-1' });
  });
});

describe('communityService.deleteQuestion', () => {
  it('throws 404 when not found', async () => {
    prismaMock.question.findUnique.mockResolvedValue(null);
    await expect(communityService.deleteQuestion('q-1', user)).rejects.toMatchObject({ statusCode: 404 });
  });

  it('throws 403 when non-owner student tries to delete', async () => {
    prismaMock.question.findUnique.mockResolvedValue({ authorId: 'other' } as any);
    await expect(communityService.deleteQuestion('q-1', user)).rejects.toMatchObject({ statusCode: 403 });
  });

  it('deletes own question', async () => {
    prismaMock.question.findUnique.mockResolvedValue({ authorId: 'u-1' } as any);
    prismaMock.question.update.mockResolvedValue({} as any);
    expect(await communityService.deleteQuestion('q-1', user)).toEqual({ deleted: true });
  });
});

// ── Answers ────────────────────────────────────────────────────────────────

describe('communityService.createAnswer', () => {
  it('throws 404 when question not found', async () => {
    prismaMock.question.findUnique.mockResolvedValue(null);
    await expect(
      communityService.createAnswer('q-1', { content: 'Answer' } as any, user)
    ).rejects.toMatchObject({ statusCode: 404 });
  });

  it('creates answer and increments academic post count', async () => {
    prismaMock.question.findUnique.mockResolvedValue(mockQuestion() as any);
    const answer = { id: 'a-1', content: 'Answer', isAccepted: false, upvoteCount: 0 };
    prismaMock.answer.create.mockResolvedValue(answer as any);
    prismaMock.courseMentor.updateMany.mockResolvedValue({ count: 0 } as any);
    prismaMock.user.update.mockResolvedValue({} as any);
    const result = await communityService.createAnswer('q-1', { content: 'Answer' } as any, user);
    expect(result).toMatchObject({ id: 'a-1' });
  });
});

describe('communityService.acceptAnswer', () => {
  it('throws 404 when question not found', async () => {
    prismaMock.question.findUnique.mockResolvedValue(null);
    await expect(communityService.acceptAnswer('q-1', 'a-1', 'u-1')).rejects.toMatchObject({ statusCode: 404 });
  });

  it('throws 403 when non-author tries to accept', async () => {
    prismaMock.question.findUnique.mockResolvedValue({ authorId: 'other' } as any);
    await expect(communityService.acceptAnswer('q-1', 'a-1', 'u-1')).rejects.toMatchObject({ statusCode: 403 });
  });

  it('accepts answer', async () => {
    prismaMock.question.findUnique.mockResolvedValue({ authorId: 'u-1' } as any);
    prismaMock.answer.findUnique.mockResolvedValue({ id: 'a-1' } as any);
    prismaMock.$transaction.mockResolvedValue([{}, {}, {}] as any);
    expect(await communityService.acceptAnswer('q-1', 'a-1', 'u-1')).toEqual({ accepted: true });
  });
});

// ── Mentors ────────────────────────────────────────────────────────────────

describe('communityService.registerMentor', () => {
  it('throws 403 when below 300L', async () => {
    await expect(
      communityService.registerMentor({ courseCode: 'CSC301' } as any, { ...user, level: '200' })
    ).rejects.toMatchObject({ statusCode: 403 });
  });

  it('creates mentor registration for 300L+', async () => {
    prismaMock.courseMentor.findUnique.mockResolvedValue(null);
    prismaMock.courseMentor.create.mockResolvedValue({ id: 'm-1', courseCode: 'CSC301', isActive: true, mentorPoints: 0 } as any);
    const result = await communityService.registerMentor(
      { courseCode: 'CSC301' } as any,
      { ...user, level: '300' }
    );
    expect(result).toMatchObject({ courseCode: 'CSC301' });
  });

  it('toggles existing mentor registration', async () => {
    prismaMock.courseMentor.findUnique.mockResolvedValue({ id: 'm-1', isActive: true } as any);
    prismaMock.courseMentor.update.mockResolvedValue({ id: 'm-1', isActive: false } as any);
    const result = await communityService.registerMentor(
      { courseCode: 'CSC301' } as any,
      { ...user, level: '300' }
    );
    expect(result).toMatchObject({ id: 'm-1' });
  });
});

// ── FAQs ───────────────────────────────────────────────────────────────────

describe('communityService.deleteFaq', () => {
  it('throws 404 when FAQ not found', async () => {
    prismaMock.freshersFaq.findUnique.mockResolvedValue(null);
    await expect(communityService.deleteFaq('faq-1')).rejects.toMatchObject({ statusCode: 404 });
  });

  it('soft-deletes FAQ', async () => {
    prismaMock.freshersFaq.findUnique.mockResolvedValue({ id: 'faq-1' } as any);
    prismaMock.freshersFaq.update.mockResolvedValue({} as any);
    expect(await communityService.deleteFaq('faq-1')).toEqual({ deleted: true });
  });
});

// ── Reports ────────────────────────────────────────────────────────────────

describe('communityService.resolveReport', () => {
  it('throws 404 when report not found', async () => {
    prismaMock.report.findUnique.mockResolvedValue(null);
    await expect(communityService.resolveReport('r-1')).rejects.toMatchObject({ statusCode: 404 });
  });

  it('resolves report', async () => {
    prismaMock.report.findUnique.mockResolvedValue({ id: 'r-1' } as any);
    prismaMock.report.update.mockResolvedValue({ id: 'r-1', isResolved: true } as any);
    const result = await communityService.resolveReport('r-1');
    expect(result).toMatchObject({ isResolved: true });
  });
});
