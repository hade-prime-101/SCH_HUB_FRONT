import {
  apiGet,
  apiPost,
  apiPatch,
  apiDelete,
} from "@/lib/api";

import type {
  Material,
  MaterialUploadPayload,
  MaterialUpdatePayload,
  MaterialReviewPayload,
  MaterialRatePayload,
  Quiz,
  QuizCreatePayload,
  QuizAttempt,
  QuizSubmitPayload,
  MyAnalytics,
  AdminQuizAnalyticsQuery,
  CGPACourse,
  CGPACourseInput,
  CGPACalculationInput,
  CGPAResult,
  PersonalStudySession,
  CreateSessionPayload,
  GeneratePersonalQuizPayload,
  PersonalQuiz,
  PersonalQuizResult,
  AISummary,
  SummarizeRequest,
  ChatMessage,
  SessionDetail,
} from "@/types/study";

// ─── Materials ─────────────────────────────────────────────────

export const listMaterials = (params: { page?: number; limit?: number; search?: string; visibility?: string }) =>
  apiGet<{ data: Material[]; page: number; total: number; limit: number }>("/study/materials", params as any);

export const getMaterial = (id: string) =>
  apiGet<Material>(`/study/materials/${id}`);

export const uploadMaterial = (payload: MaterialUploadPayload, file: File) => {
  const formData = new FormData();
  formData.append("file", file);
  Object.entries(payload).forEach(([key, value]) => {
    if (value !== undefined) formData.append(key, value as string);
  });
  return apiPost<Material>("/study/materials", formData, true);
};

export const bulkUploadMaterials = (materials: MaterialUploadPayload[], files: File[]) => {
  const formData = new FormData();
  files.forEach((f) => formData.append("files", f));
  formData.append("materials", JSON.stringify(materials));
  return apiPost<Material[]>("/study/materials/bulk", formData, true);
};

export const updateVisibility = (id: string, visibility: MaterialUpdatePayload["visibility"]) =>
  apiPatch<Material>(`/study/materials/${id}/visibility`, { visibility });

export const updateMaterial = (id: string, payload: MaterialUpdatePayload) =>
  apiPatch<Material>(`/study/materials/${id}`, payload);

export const deleteMaterial = (id: string) =>
  apiDelete<{ message: string }>(`/study/materials/${id}`);

export const adminDeleteMaterial = (id: string) =>
  apiDelete<{ message: string }>(`/study/materials/${id}/admin`);

export const verifyMaterial = (id: string) =>
  apiPost<Material>(`/study/materials/${id}/verify`, {});

export const listPendingReviewMaterials = (page = 1, limit = 20) =>
  apiGet<{ data: Material[]; page: number; total: number; limit: number }>("/study/materials/pending-review", { page, limit });

export const reviewMaterial = (id: string, payload: MaterialReviewPayload) =>
  apiPost<Material>(`/study/materials/${id}/review`, payload);

export const incrementDownload = (id: string) =>
  apiPost<{ downloads: number }>(`/study/materials/${id}/download/increment`, {});

export const rateMaterial = (id: string, payload: MaterialRatePayload) =>
  apiPost<Material>(`/study/materials/${id}/rate`, payload);

export const toggleBookmark = (id: string) =>
  apiPost<{ bookmarked: boolean }>(`/study/materials/${id}/bookmark`, {});

export const getDownloadUrl = (id: string) =>
  apiGet<{ url: string }>(`/study/materials/${id}/download-url`);

// ─── Quizzes ──────────────────────────────────────────────────

export const listQuizzes = (params: { page?: number; limit?: number; search?: string }) =>
  apiGet<{ data: Quiz[]; page: number; total: number; limit: number }>("/study/quizzes", params as any);

export const getQuiz = (id: string) =>
  apiGet<Quiz>(`/study/quizzes/${id}`);

export const createQuiz = (payload: QuizCreatePayload) =>
  apiPost<Quiz>("/study/quizzes", payload);

export const updateQuiz = (id: string, payload: Partial<QuizCreatePayload>) =>
  apiPatch<Quiz>(`/study/quizzes/${id}`, payload);

export const publishQuiz = (id: string, isDraft: boolean) =>
  apiPatch<Quiz>(`/study/quizzes/${id}/publish`, { isDraft });

export const deleteQuiz = (id: string) =>
  apiDelete<{ message: string }>(`/study/quizzes/${id}`);

export const generateQuizFromMaterial = (materialId: string, numQuestions?: number) =>
  apiPost<Quiz>("/study/quizzes/generate-from-material", { materialId, numQuestions });

export const submitQuizAttempt = (id: string, payload: QuizSubmitPayload) =>
  apiPost<QuizAttempt>(`/study/quizzes/${id}/attempt`, payload);

export const getQuizAttempts = (id: string) =>
  apiGet<QuizAttempt[]>(`/study/quizzes/${id}/attempts`);

// ─── Analytics ─────────────────────────────────────────────────

export const getMyAnalytics = () =>
  apiGet<MyAnalytics>("/study/analytics/my");

export const approveQuizQuestions = (quizId: string, approvals: { questionId: string; approved: boolean }[]) =>
  apiPost<Quiz>(`/study/quizzes/${quizId}/approve-questions`, { approvals });

export const getAdminQuizAnalytics = (params: AdminQuizAnalyticsQuery) =>
  apiGet<any>("/study/quizzes/admin-analytics", params as any);

// ─── CGPA ─────────────────────────────────────────────────────

export const listCGPACourses = (params?: { semester?: string }) =>
  apiGet<CGPACourse[]>("/cgpa/courses", params as any);

export const createCGPACourse = (payload: CGPACourseInput) =>
  apiPost<CGPACourse>("/cgpa/courses", payload);

export const updateCGPACourse = (id: string, payload: Partial<CGPACourseInput>) =>
  apiPatch<CGPACourse>(`/cgpa/courses/${id}`, payload);

export const deleteCGPACourse = (id: string) =>
  apiDelete<{ message: string }>(`/cgpa/courses/${id}`);

export const calculateCGPA = (payload: CGPACalculationInput) =>
  apiPost<CGPAResult>("/cgpa/calculate", payload);

export const getCGPARecords = () =>
  apiGet<CGPAResult[]>("/cgpa/records");

export const getCurrentCGPA = () =>
  apiGet<CGPAResult>("/cgpa/current");

// ─── Personal Study Sessions ─────────────────────────────────

export const listSessions = () =>
  apiGet<PersonalStudySession[]>("/ai/personal-study/sessions");

export const getSession = (sessionId: string) =>
  apiGet<SessionDetail>(`/ai/personal-study/sessions/${sessionId}`);

export const createSession = (payload: CreateSessionPayload, file?: File) => {
  const formData = new FormData();
  formData.append("title", payload.title);
  if (payload.content) formData.append("content", payload.content);
  if (payload.materialId) formData.append("materialId", payload.materialId);
  if (file) formData.append("file", file);
  return apiPost<PersonalStudySession>("/ai/personal-study/sessions", formData, true);
};

export const deleteSession = (sessionId: string) =>
  apiDelete<{ message: string }>(`/ai/personal-study/sessions/${sessionId}`);

export const generatePersonalQuiz = (sessionId: string, payload: GeneratePersonalQuizPayload) =>
  apiPost<PersonalQuiz>(`/ai/personal-study/sessions/${sessionId}/quiz/generate`, payload);

export const submitPersonalQuiz = (sessionId: string, answers: { questionId: string; selected: number }[]) =>
  apiPost<PersonalQuizResult>(`/ai/personal-study/sessions/${sessionId}/quiz/submit`, { answers });

export const askQuestion = (sessionId: string, question: string) =>
  apiPost<{ answer: string }>(`/ai/personal-study/sessions/${sessionId}/ask`, { question });

// ─── AI Summaries ─────────────────────────────────────────────

export const requestSummary = (payload: SummarizeRequest) =>
  apiPost<AISummary>("/ai/summarize", payload);

export const getSummary = (materialId: string) =>
  apiGet<AISummary>(`/ai/summaries/${materialId}`);

export const getUserSummaries = () =>
  apiGet<AISummary[]>("/ai/summaries");

// lib/study.api.ts (add at the bottom)

