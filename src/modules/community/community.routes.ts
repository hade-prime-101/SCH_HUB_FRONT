import { Router } from 'express';
import { authenticate } from '@/middleware/authenticate.js';
import { authorize } from '@/middleware/authorize.js';
import * as c from './community.controller.js';

export const communityRoutes = Router();
communityRoutes.use(authenticate);

// ── 6.1 Feed / Posts ──────────────────────────────────────────────────────
communityRoutes.get('/feed', c.listPosts);
communityRoutes.get('/posts', c.listPosts);
communityRoutes.post('/posts', c.createPost);
communityRoutes.get('/posts/:id', c.getPost);
communityRoutes.delete('/posts/:id', c.deletePost);
communityRoutes.patch('/posts/:id/pin', authorize('COURSE_REP', 'SCHOOL_ADMIN', 'SUPER_ADMIN'), c.pinPost);
communityRoutes.post('/posts/:id/upvote', c.upvotePost);
communityRoutes.post('/posts/:id/react', c.react);
communityRoutes.post('/posts/:id/report', c.report);

// ── Comments ──────────────────────────────────────────────────────────────
communityRoutes.post('/posts/:id/comments', c.createComment);
communityRoutes.post('/comments/:commentId/upvote', c.upvoteComment);

// ── Notices (alias for NOTICE_BOARD) ──────────────────────────────────────
communityRoutes.get('/notices', c.listPosts);
communityRoutes.post('/notices', authorize('COURSE_REP', 'SCHOOL_ADMIN', 'SUPER_ADMIN'), c.createNoticePost);
communityRoutes.patch('/notices/:id/pin', authorize('COURSE_REP', 'SCHOOL_ADMIN', 'SUPER_ADMIN'), c.pinPost);

// ── 6.2 Q&A ───────────────────────────────────────────────────────────────
communityRoutes.get('/questions', c.listQuestions);
communityRoutes.post('/questions', c.createQuestion);
communityRoutes.get('/questions/:id', c.getQuestion);
communityRoutes.delete('/questions/:id', c.deleteQuestion);
communityRoutes.post('/questions/:id/upvote', c.upvoteQuestion);
communityRoutes.post('/questions/:id/answers', c.createAnswer);
communityRoutes.patch('/questions/:id/answers/:answerId/accept', c.acceptAnswer);
communityRoutes.patch('/questions/:id/answers/:answerId/pin', authorize('COURSE_REP', 'SCHOOL_ADMIN', 'SUPER_ADMIN'), c.pinAnswer);
communityRoutes.post('/answers/:answerId/upvote', c.upvoteAnswer);
communityRoutes.post('/answers/:answerId/react', c.react);
communityRoutes.delete('/answers/:answerId', c.deleteAnswer);

// ── 6.3 Mentors ───────────────────────────────────────────────────────────
communityRoutes.get('/mentors', c.listMentors);
communityRoutes.get('/mentors/me', c.getMyMentorships);
communityRoutes.post('/mentors/register', c.registerMentor);

// ── 6.4 Freshers FAQ ─────────────────────────────────────────────────────
communityRoutes.get('/faqs', c.listFaqs);
communityRoutes.post('/faqs', authorize('SCHOOL_ADMIN', 'SUPER_ADMIN'), c.createFaq);
communityRoutes.delete('/faqs/:id', authorize('SCHOOL_ADMIN', 'SUPER_ADMIN'), c.deleteFaq);

// ── Reports (moderation) ──────────────────────────────────────────────────
communityRoutes.get('/reports', authorize('COURSE_REP', 'SCHOOL_ADMIN', 'SUPER_ADMIN'), c.listReports);
communityRoutes.patch('/reports/:reportId/resolve', authorize('COURSE_REP', 'SCHOOL_ADMIN', 'SUPER_ADMIN'), c.resolveReport);
