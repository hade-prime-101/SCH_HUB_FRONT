import { prisma } from '@/config/prisma.js';
import { AppError } from '@/utils/response.js';
import { notificationsService, sendAndPersistNotification } from '@/modules/notifications/notifications.service.js';
import type { Prisma, SectionType } from '@prisma/client';
import type { z } from 'zod';
import type {
  createPostSchema,
  listPostsSchema,
  createQuestionSchema,
  listQuestionsSchema,
  createAnswerSchema,
  reactSchema,
  reportSchema,
  createCommentSchema,
  registerMentorSchema,
  listMentorsSchema,
  createFaqSchema,
} from './community.validators.js';

type CreatePostInput     = z.infer<typeof createPostSchema>;
type ListPostsInput      = z.infer<typeof listPostsSchema>;
type CreateQuestionInput = z.infer<typeof createQuestionSchema>;
type ListQuestionsInput  = z.infer<typeof listQuestionsSchema>;
type CreateAnswerInput   = z.infer<typeof createAnswerSchema>;
type ReactInput          = z.infer<typeof reactSchema>;
type ReportInput         = z.infer<typeof reportSchema>;
type CreateCommentInput  = z.infer<typeof createCommentSchema>;
type RegisterMentorInput = z.infer<typeof registerMentorSchema>;
type ListMentorsInput    = z.infer<typeof listMentorsSchema>;
type CreateFaqInput      = z.infer<typeof createFaqSchema>;

const DEPT_SECTION_LIST: SectionType[] = ['NOTICE_BOARD', 'QNA', 'DEPT_UPDATES', 'CROSS_LEVEL', 'FRESHERS_CORNER'];
const SCHOOL_SECTION_LIST: SectionType[] = ['CAMPUS_CULTURE', 'LOUNGE', 'ANONYMOUS'];
const ANNOUNCEMENT_SECTION_LIST: SectionType[] = ['NOTICE_BOARD', 'DEPT_UPDATES'];
const DEPT_SECTIONS = new Set<SectionType>(DEPT_SECTION_LIST);
const ANNOUNCEMENT_SECTIONS = new Set<SectionType>(ANNOUNCEMENT_SECTION_LIST);
const LOUNGE_UNLOCK_THRESHOLD = 50;
const SPAM_KEYWORDS = ['join our whatsapp', 'click here to win', 'free airtime', 'send me your number'];

function isSpam(content: string): boolean {
  const lower = content.toLowerCase();
  return SPAM_KEYWORDS.some((kw) => lower.includes(kw));
}

function maskAnonymous<T extends { isAnonymous: boolean; author?: unknown }>(item: T): T {
  return item.isAnonymous ? { ...item, author: null } : item;
}

const POST_SELECT = {
  id: true, content: true, section: true, scope: true, priority: true,
  isPinned: true, isAnonymous: true, courseTag: true, expiresAt: true,
  upvoteCount: true, viewCount: true, attachments: true,
  isMentorQuestion: true, mentorCourseCode: true, targetLevel: true,
  createdAt: true,
  author: { select: { id: true, fullName: true, profilePictureUrl: true, level: true } },
  department: { select: { id: true, name: true, shortCode: true } },
  _count: { select: { comments: true, reactions: true } },
};

const QUESTION_SELECT = {
  id: true, title: true, content: true, type: true, courseTag: true,
  isAnonymous: true, upvoteCount: true, viewCount: true, isSolved: true,
  attachments: true, isMentorQuestion: true, createdAt: true,
  author: { select: { id: true, fullName: true, profilePictureUrl: true } },
  department: { select: { id: true, name: true, shortCode: true } },
  _count: { select: { answers: true } },
};

export const communityService = {

  // ── 6.1 Posts & Announcements ─────────────────────────────────────────

  async listPosts(input: ListPostsInput, user: { id: string; schoolId: string; departmentId: string; level: string }) {
    const { section, departmentId, courseTag, targetLevel, page, limit } = input;
    const skip = (page - 1) * limit;

    const where: Prisma.CommunityPostWhereInput = {
      isDeleted: false,
      ...(section
        ? {
            section,
            ...(DEPT_SECTIONS.has(section)
              ? { departmentId: departmentId ?? user.departmentId }
              : { schoolId: user.schoolId }),
          }
        : {
            OR: [
              { section: { in: DEPT_SECTION_LIST }, departmentId: user.departmentId },
              { section: { in: SCHOOL_SECTION_LIST }, schoolId: user.schoolId },
            ],
          }),
      ...(courseTag && { courseTag: { contains: courseTag, mode: 'insensitive' as const } }),
      ...(targetLevel && { targetLevel }),
    };

    const [data, total] = await Promise.all([
      prisma.communityPost.findMany({
        where,
        select: POST_SELECT,
        skip, take: limit,
        orderBy: [{ isPinned: 'desc' }, { priority: 'desc' }, { createdAt: 'desc' }],
      }),
      prisma.communityPost.count({ where }),
    ]);

    return { data: data.map(maskAnonymous), total, page, limit };
  },

  async getPost(id: string) {
    const post = await prisma.communityPost.findUnique({
      where: { id, isDeleted: false },
      select: {
        ...POST_SELECT,
        comments: {
          where: { isDeleted: false, parentId: null },
          select: {
            id: true, content: true, upvoteCount: true, createdAt: true,
            author: { select: { id: true, fullName: true, profilePictureUrl: true } },
            replies: {
              where: { isDeleted: false },
              select: {
                id: true, content: true, upvoteCount: true, createdAt: true,
                author: { select: { id: true, fullName: true, profilePictureUrl: true } },
              },
              orderBy: { createdAt: 'asc' },
            },
          },
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!post) throw new AppError('Post not found', 404);
    await prisma.communityPost.update({ where: { id }, data: { viewCount: { increment: 1 } } });
    return maskAnonymous(post);
  },

  async createPost(
    input: CreatePostInput,
    user: { id: string; role: string; schoolId: string; departmentId: string; level: string },
  ) {
    // 6.5 Lounge gate
    if (input.section === 'LOUNGE') {
      const u = await prisma.user.findUnique({ where: { id: user.id }, select: { academicPostCount: true } });
      if ((u?.academicPostCount ?? 0) < LOUNGE_UNLOCK_THRESHOLD) {
        throw new AppError(`Lounge requires ${LOUNGE_UNLOCK_THRESHOLD} academic posts to unlock. You have ${u?.academicPostCount ?? 0}.`, 403);
      }
      if (isSpam(input.content)) throw new AppError('Your post was flagged as spam and could not be submitted.', 400);
    }

    // 6.4 Freshers Corner: only 100–200L can post
    if (input.section === 'FRESHERS_CORNER' && parseInt(user.level) > 200) {
      throw new AppError('Only 100–200L students can post in Freshers Corner.', 403);
    }

    // 6.1 Announcements: privileged roles only
    if (ANNOUNCEMENT_SECTIONS.has(input.section as SectionType)) {
      if (!['COURSE_REP', 'SCHOOL_ADMIN', 'SUPER_ADMIN'].includes(user.role)) {
        throw new AppError('Only course reps and admins can post announcements.', 403);
      }
    }

    const isDeptScoped = DEPT_SECTIONS.has(input.section as SectionType);

    // Department scope guard for students
    if (isDeptScoped && user.role === 'STUDENT') {
      const targetDept = input.departmentId ?? user.departmentId;
      if (targetDept !== user.departmentId) throw new AppError('You can only post to your own department.', 403);
    }

    // 6.3 Mentor question needs a course code
    if (input.isMentorQuestion && !input.mentorCourseCode) {
      throw new AppError('mentorCourseCode is required for mentor questions.', 400);
    }

    const post = await prisma.communityPost.create({
      data: {
        content: input.content,
        section: input.section as any,
        scope: (isDeptScoped ? 'DEPARTMENT' : 'UNIVERSITY') as any,
        priority: input.priority as any,
        isAnonymous: input.isAnonymous,
        courseTag: input.courseTag,
        expiresAt: input.expiresAt ? new Date(input.expiresAt) : undefined,
        attachments: input.attachments ?? [],
        targetLevel: input.targetLevel,
        isMentorQuestion: input.isMentorQuestion,
        mentorCourseCode: input.mentorCourseCode,
        authorId: input.isAnonymous ? null : user.id,
        departmentId: isDeptScoped ? (input.departmentId ?? user.departmentId) : null,
        schoolId: !isDeptScoped ? user.schoolId : null,
      },
      select: POST_SELECT,
    });

    // Increment academic post count (not lounge, not anonymous)
    if (!input.isAnonymous && input.section !== 'LOUNGE') {
      await prisma.user.update({ where: { id: user.id }, data: { academicPostCount: { increment: 1 } } }).catch(() => null);
    }

    // 6.1 Broadcast with level targeting
    if (ANNOUNCEMENT_SECTIONS.has(input.section as SectionType)) {
      await notificationsService.broadcastAnnouncement({
        title: input.priority === 'URGENT' ? '🚨 Urgent Announcement' : 'New Notice',
        body: input.content.slice(0, 200),
        schoolId: user.schoolId,
        departmentId: isDeptScoped ? (input.departmentId ?? user.departmentId) : null,
        postId: post.id,
      }).catch(() => null);
    }

    // 6.3 Notify mentors
    if (input.isMentorQuestion && input.mentorCourseCode) {
      const deptId = input.departmentId ?? user.departmentId;
      const mentors = await prisma.courseMentor.findMany({
        where: { courseCode: input.mentorCourseCode, departmentId: deptId, isActive: true },
        select: { userId: true },
      });
      await Promise.all(
        mentors.map((m: { userId: string }) =>
          sendAndPersistNotification(
            m.userId, '🎓 Mentor Question',
            `${input.mentorCourseCode}: ${input.content.slice(0, 100)}`,
            'SYSTEM', { type: 'MENTOR_QUESTION', postId: post.id },
          ).catch(() => null)
        )
      );
    }

    return maskAnonymous(post);
  },

  async deletePost(id: string, user: { id: string; role: string }) {
    const post = await prisma.communityPost.findUnique({ where: { id, isDeleted: false }, select: { authorId: true } });
    if (!post) throw new AppError('Post not found', 404);

    const isAdmin = ['SCHOOL_ADMIN', 'SUPER_ADMIN'].includes(user.role);
    if (!isAdmin && post.authorId !== user.id) throw new AppError('Not authorized', 403);

    await prisma.communityPost.update({ where: { id }, data: { isDeleted: true, deletedAt: new Date() } });
    return { deleted: true };
  },

  async pinPost(id: string, isPinned: boolean) {
    const post = await prisma.communityPost.findUnique({ where: { id } });
    if (!post) throw new AppError('Post not found', 404);
    return prisma.communityPost.update({ where: { id }, data: { isPinned }, select: POST_SELECT });
  },

  async upvotePost(id: string) {
    if (!(await prisma.communityPost.findUnique({ where: { id, isDeleted: false } }))) throw new AppError('Post not found', 404);
    await prisma.communityPost.update({ where: { id }, data: { upvoteCount: { increment: 1 } } });
    return { upvoted: true };
  },

  // ── Comments ──────────────────────────────────────────────────────────

  async createComment(postId: string, input: CreateCommentInput, userId: string) {
    if (!(await prisma.communityPost.findUnique({ where: { id: postId, isDeleted: false } }))) {
      throw new AppError('Post not found', 404);
    }
    return prisma.communityComment.create({
      data: { postId, authorId: userId, content: input.content, parentId: input.parentId },
      select: {
        id: true, content: true, upvoteCount: true, createdAt: true, parentId: true,
        author: { select: { id: true, fullName: true, profilePictureUrl: true } },
      },
    });
  },

  async upvoteComment(commentId: string) {
    if (!(await prisma.communityComment.findUnique({ where: { id: commentId } }))) throw new AppError('Comment not found', 404);
    await prisma.communityComment.update({ where: { id: commentId }, data: { upvoteCount: { increment: 1 } } });
    return { upvoted: true };
  },

  // ── 6.2 Questions ─────────────────────────────────────────────────────

  async listQuestions(input: ListQuestionsInput, user: { schoolId: string; departmentId: string }) {
    const { type, courseTag, isSolved, isMentorQuestion, departmentId, page, limit } = input;
    const skip = (page - 1) * limit;

    const where = {
      isDeleted: false,
      departmentId: departmentId ?? user.departmentId,
      ...(type && { type }),
      ...(courseTag && { courseTag: { contains: courseTag, mode: 'insensitive' as const } }),
      ...(isSolved !== undefined && { isSolved }),
      ...(isMentorQuestion !== undefined && { isMentorQuestion }),
    };

    const [data, total] = await Promise.all([
      prisma.question.findMany({
        where, select: QUESTION_SELECT, skip, take: limit,
        orderBy: [{ isSolved: 'asc' }, { upvoteCount: 'desc' }, { createdAt: 'desc' }],
      }),
      prisma.question.count({ where }),
    ]);

    return { data: data.map(maskAnonymous), total, page, limit };
  },

  async getQuestion(id: string) {
    const q = await prisma.question.findUnique({
      where: { id, isDeleted: false },
      select: {
        ...QUESTION_SELECT,
        acceptedAnswerId: true,
        answers: {
          where: { isDeleted: false },
          select: {
            id: true, content: true, isAccepted: true, upvoteCount: true, attachments: true, createdAt: true,
            author: { select: { id: true, fullName: true, profilePictureUrl: true } },
          },
          orderBy: [{ isAccepted: 'desc' }, { upvoteCount: 'desc' }],
        },
      },
    });

    if (!q) throw new AppError('Question not found', 404);
    await prisma.question.update({ where: { id }, data: { viewCount: { increment: 1 } } });
    return maskAnonymous(q);
  },

  async createQuestion(input: CreateQuestionInput, user: { id: string; schoolId: string; departmentId: string }) {
    const q = await prisma.question.create({
      data: {
        title: input.title,
        content: input.content,
        type: input.type as any,
        courseTag: input.courseTag.toUpperCase(),
        isAnonymous: input.isAnonymous,
        attachments: input.attachments ?? [],
        isMentorQuestion: input.isMentorQuestion,
        authorId: input.isAnonymous ? null : user.id,
        departmentId: input.departmentId ?? user.departmentId,
        schoolId: user.schoolId,
      },
      select: QUESTION_SELECT,
    });

    if (!input.isAnonymous) {
      await prisma.user.update({ where: { id: user.id }, data: { academicPostCount: { increment: 1 } } }).catch(() => null);
    }

    // 6.3 Notify mentors for tagged questions
    if (input.isMentorQuestion) {
      const deptId = input.departmentId ?? user.departmentId;
      const mentors = await prisma.courseMentor.findMany({
        where: { courseCode: input.courseTag.toUpperCase(), departmentId: deptId, isActive: true },
        select: { userId: true },
      });
      await Promise.all(
        mentors.map((m: { userId: string }) =>
          sendAndPersistNotification(m.userId, '🎓 New Mentor Question', `${input.courseTag}: ${input.title}`, 'SYSTEM', { type: 'MENTOR_QUESTION', questionId: q.id }).catch(() => null)
        )
      );
    }

    return maskAnonymous(q);
  },

  async createAnswer(questionId: string, input: CreateAnswerInput, user: { id: string }) {
    const question = await prisma.question.findUnique({ where: { id: questionId, isDeleted: false }, select: { id: true, courseTag: true, departmentId: true } });
    if (!question) throw new AppError('Question not found', 404);

    const answer = await prisma.answer.create({
      data: { content: input.content, attachments: input.attachments ?? [], questionId, authorId: user.id },
      select: {
        id: true, content: true, isAccepted: true, upvoteCount: true, attachments: true, createdAt: true,
        author: { select: { id: true, fullName: true, profilePictureUrl: true } },
      },
    });

    // 6.3 Award mentor point if answerer is a mentor for this course
    if (question.courseTag && question.departmentId) {
      await prisma.courseMentor.updateMany({
        where: { userId: user.id, courseCode: question.courseTag, departmentId: question.departmentId },
        data: { mentorPoints: { increment: 1 } },
      }).catch(() => null);
    }

    await prisma.user.update({ where: { id: user.id }, data: { academicPostCount: { increment: 1 } } }).catch(() => null);
    return answer;
  },

  async acceptAnswer(questionId: string, answerId: string, userId: string) {
    const question = await prisma.question.findUnique({ where: { id: questionId, isDeleted: false }, select: { authorId: true } });
    if (!question) throw new AppError('Question not found', 404);
    if (question.authorId !== userId) throw new AppError('Only the question author can accept an answer.', 403);

    const answer = await prisma.answer.findUnique({ where: { id: answerId } });
    if (!answer) throw new AppError('Answer not found', 404);

    await prisma.$transaction([
      prisma.answer.updateMany({ where: { questionId }, data: { isAccepted: false } }),
      prisma.answer.update({ where: { id: answerId }, data: { isAccepted: true } }),
      prisma.question.update({ where: { id: questionId }, data: { isSolved: true, acceptedAnswerId: answerId } }),
    ]);

    return { accepted: true };
  },

  // 6.2 Course rep pins best answer
  async pinAnswer(questionId: string, answerId: string, userId: string, userRole: string) {
    const isPrivileged = ['COURSE_REP', 'SCHOOL_ADMIN', 'SUPER_ADMIN'].includes(userRole);
    const question = await prisma.question.findUnique({ where: { id: questionId }, select: { authorId: true } });
    if (!question) throw new AppError('Question not found', 404);
    if (!isPrivileged && question.authorId !== userId) {
      throw new AppError('Only course reps or the question author can pin answers.', 403);
    }

    await prisma.$transaction([
      prisma.answer.updateMany({ where: { questionId }, data: { isAccepted: false } }),
      prisma.answer.update({ where: { id: answerId }, data: { isAccepted: true } }),
      prisma.question.update({ where: { id: questionId }, data: { isSolved: true, acceptedAnswerId: answerId } }),
    ]);

    return { pinned: true };
  },

  async upvoteQuestion(id: string) {
    if (!(await prisma.question.findUnique({ where: { id, isDeleted: false } }))) throw new AppError('Question not found', 404);
    await prisma.question.update({ where: { id }, data: { upvoteCount: { increment: 1 } } });
    return { upvoted: true };
  },

  async upvoteAnswer(answerId: string) {
    if (!(await prisma.answer.findUnique({ where: { id: answerId, isDeleted: false } }))) throw new AppError('Answer not found', 404);
    await prisma.answer.update({ where: { id: answerId }, data: { upvoteCount: { increment: 1 } } });
    return { upvoted: true };
  },

  async deleteQuestion(id: string, user: { id: string; role: string }) {
    const q = await prisma.question.findUnique({ where: { id, isDeleted: false }, select: { authorId: true } });
    if (!q) throw new AppError('Question not found', 404);
    if (!['SCHOOL_ADMIN', 'SUPER_ADMIN', 'COURSE_REP'].includes(user.role) && q.authorId !== user.id) throw new AppError('Not authorized', 403);
    await prisma.question.update({ where: { id }, data: { isDeleted: true } });
    return { deleted: true };
  },

  async deleteAnswer(answerId: string, user: { id: string; role: string }) {
    const answer = await prisma.answer.findUnique({ where: { id: answerId, isDeleted: false }, select: { authorId: true } });
    if (!answer) throw new AppError('Answer not found', 404);
    if (!['SCHOOL_ADMIN', 'SUPER_ADMIN', 'COURSE_REP'].includes(user.role) && answer.authorId !== user.id) throw new AppError('Not authorized', 403);
    await prisma.answer.update({ where: { id: answerId }, data: { isDeleted: true } });
    return { deleted: true };
  },

  // ── 6.3 Mentors ───────────────────────────────────────────────────────

  async registerMentor(input: RegisterMentorInput, user: { id: string; departmentId: string; level: string }) {
    if (parseInt(user.level) < 300) throw new AppError('Only 300L and above can register as mentors.', 403);

    const deptId = input.departmentId ?? user.departmentId;
    const existing = await prisma.courseMentor.findUnique({
      where: { userId_courseCode: { userId: user.id, courseCode: input.courseCode } },
    });

    if (existing) {
      return prisma.courseMentor.update({
        where: { id: existing.id },
        data: { isActive: !existing.isActive },
        select: { id: true, courseCode: true, isActive: true, mentorPoints: true },
      });
    }

    return prisma.courseMentor.create({
      data: { userId: user.id, courseCode: input.courseCode, departmentId: deptId },
      select: { id: true, courseCode: true, isActive: true, mentorPoints: true, createdAt: true },
    });
  },

  async listMentors(input: ListMentorsInput, user: { departmentId: string }) {
    return prisma.courseMentor.findMany({
      where: {
        isActive: true,
        departmentId: input.departmentId ?? user.departmentId,
        ...(input.courseCode && { courseCode: input.courseCode.toUpperCase() }),
      },
      select: {
        id: true, courseCode: true, mentorPoints: true, createdAt: true,
        user: { select: { id: true, fullName: true, profilePictureUrl: true, level: true } },
      },
      orderBy: { mentorPoints: 'desc' },
    });
  },

  async getMyMentorships(userId: string) {
    return prisma.courseMentor.findMany({
      where: { userId },
      select: { id: true, courseCode: true, isActive: true, mentorPoints: true, createdAt: true },
      orderBy: { mentorPoints: 'desc' },
    });
  },

  // ── 6.4 Freshers FAQ ─────────────────────────────────────────────────

  async listFaqs(schoolId: string, category?: string) {
    return prisma.freshersFaq.findMany({
      where: { schoolId, isActive: true, ...(category && { category }) },
      select: { id: true, question: true, answer: true, category: true, order: true },
      orderBy: [{ category: 'asc' }, { order: 'asc' }],
    });
  },

  async createFaq(input: CreateFaqInput, schoolId: string) {
    return prisma.freshersFaq.create({
      data: { ...input, schoolId },
      select: { id: true, question: true, answer: true, category: true, order: true },
    });
  },

  async deleteFaq(id: string) {
    const faq = await prisma.freshersFaq.findUnique({ where: { id } });
    if (!faq) throw new AppError('FAQ not found', 404);
    await prisma.freshersFaq.update({ where: { id }, data: { isActive: false } });
    return { deleted: true };
  },

  // ── Reactions & Reports ───────────────────────────────────────────────

  async react(targetId: string, input: ReactInput, userId: string) {
    const { type, targetType } = input;
    const field = targetType === 'post' ? 'postId'
      : targetType === 'question' ? 'questionId'
      : targetType === 'answer' ? 'answerId'
      : 'commentId';

    const existing = await prisma.reaction.findFirst({ where: { userId, [field]: targetId, type } });
    if (existing) {
      await prisma.reaction.delete({ where: { id: existing.id } });
      return { reacted: false };
    }

    await prisma.reaction.create({ data: { userId, [field]: targetId, type: type as any } });
    return { reacted: true };
  },

  async report(targetId: string, input: ReportInput, userId: string) {
    const field = input.targetType === 'post' ? 'postId'
      : input.targetType === 'question' ? 'questionId'
      : 'answerId';
    await prisma.report.create({ data: { reason: input.reason as any, details: input.details, reporterId: userId, [field]: targetId } });
    return { reported: true };
  },

  async listReports(schoolId: string, isResolved: boolean, page: number, limit: number) {
    const skip = (page - 1) * limit;
    const where = { isResolved, reporter: { schoolId } };
    const [items, total] = await Promise.all([
      prisma.report.findMany({
        where,
        include: {
          reporter: { select: { id: true, fullName: true, email: true } },
          post: { select: { id: true, content: true, section: true } },
          question: { select: { id: true, title: true } },
          answer: { select: { id: true, content: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip, take: limit,
      }),
      prisma.report.count({ where }),
    ]);
    return { items, total, page, limit };
  },

  async resolveReport(reportId: string) {
    const report = await prisma.report.findUnique({ where: { id: reportId } });
    if (!report) throw new AppError('Report not found', 404);
    return prisma.report.update({ where: { id: reportId }, data: { isResolved: true } });
  },
};
