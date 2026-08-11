// lib/community.api.ts

import { apiGet, apiPost, apiPatch, apiDelete } from '@/lib/api';
import type {
  Post,
  Question,
  Comment,
  Answer,
  Mentor,
  FAQ,
  Report,
  CreatePostPayload,
  CreateCommentPayload,
  CreateQuestionPayload,
  CreateAnswerPayload,
  RegisterMentorPayload,
  CreateFaqPayload,
  ReactPayload,
  ReportPayload,
} from '@/types/community';

// ─── Posts ──────────────────────────────────────────────────

export const listPosts = (params?: { page?: number; limit?: number; section?: string }) =>
  apiGet<{ data: Post[]; page: number; total: number; limit: number }>('/community/posts', params as any);

export const getPost = (id: string) =>
  apiGet<Post>(`/community/posts/${id}`);

export const createPost = (payload: CreatePostPayload) =>
  apiPost<Post>('/community/posts', payload);

export const createNoticePost = (payload: CreatePostPayload) =>
  apiPost<Post>('/community/posts/notice', payload);

export const deletePost = (id: string) =>
  apiDelete<{ message: string }>(`/community/posts/${id}`);

export const pinPost = (id: string, isPinned: boolean) =>
  apiPatch<Post>(`/community/posts/${id}/pin`, { isPinned });

export const upvotePost = (id: string) =>
  apiPost<Post>(`/community/posts/${id}/upvote`);

// ─── Comments ───────────────────────────────────────────────

export const createComment = (postId: string, payload: CreateCommentPayload) =>
  apiPost<Comment>(`/community/posts/${postId}/comments`, payload);

export const upvoteComment = (commentId: string) =>
  apiPost<Comment>(`/community/comments/${commentId}/upvote`);

// ─── Questions ─────────────────────────────────────────────

export const listQuestions = (params?: { page?: number; limit?: number; search?: string }) =>
  apiGet<{ data: Question[]; page: number; total: number; limit: number }>('/community/questions', params as any);

export const getQuestion = (id: string) =>
  apiGet<Question>(`/community/questions/${id}`);

export const createQuestion = (payload: CreateQuestionPayload) =>
  apiPost<Question>('/community/questions', payload);

export const deleteQuestion = (id: string) =>
  apiDelete<{ message: string }>(`/community/questions/${id}`);

export const upvoteQuestion = (id: string) =>
  apiPost<Question>(`/community/questions/${id}/upvote`);

export const createAnswer = (questionId: string, payload: CreateAnswerPayload) =>
  apiPost<Answer>(`/community/questions/${questionId}/answers`, payload);

export const acceptAnswer = (questionId: string, answerId: string) =>
  apiPost<Question>(`/community/questions/${questionId}/answers/${answerId}/accept`);

export const pinAnswer = (questionId: string, answerId: string) =>
  apiPost<Question>(`/community/questions/${questionId}/answers/${answerId}/pin`);

export const upvoteAnswer = (answerId: string) =>
  apiPost<Answer>(`/community/answers/${answerId}/upvote`);

export const deleteAnswer = (answerId: string) =>
  apiDelete<{ message: string }>(`/community/answers/${answerId}`);

// ─── Mentors ────────────────────────────────────────────────

export const registerMentor = (payload: RegisterMentorPayload) =>
  apiPost<Mentor>('/community/mentors', payload);

export const listMentors = (params?: { search?: string; expertise?: string[] }) =>
  apiGet<Mentor[]>('/community/mentors', params as any);

export const getMyMentorships = () =>
  apiGet<Mentor[]>('/community/mentors/me');

// ─── FAQ ────────────────────────────────────────────────────

export const listFaqs = (category?: string) =>
  apiGet<FAQ[]>('/community/faq', { category });

export const createFaq = (payload: CreateFaqPayload) =>
  apiPost<FAQ>('/community/faq', payload);

export const deleteFaq = (id: string) =>
  apiDelete<{ message: string }>(`/community/faq/${id}`);

// ─── Reactions & Reports ───────────────────────────────────

export const react = (targetId: string, payload: ReactPayload) =>
  apiPost<any>(`/community/${targetId}/react`, payload);

export const report = (targetId: string, payload: ReportPayload) =>
  apiPost<any>(`/community/${targetId}/report`, payload);

export const listReports = (params: { page?: number; limit?: number; resolved?: boolean }) =>
  apiGet<{ data: Report[]; page: number; total: number; limit: number }>('/community/reports', params as any);

export const resolveReport = (reportId: string) =>
  apiPost<any>(`/community/reports/${reportId}/resolve`);