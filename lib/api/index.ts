export { apiFetch, apiGet, apiPost, apiPatch, apiDelete, apiPut } from "./base";
export { authApi } from "./auth";
export { schoolApi } from "./school.api";
export { usersApi } from "./users.api";
export * from "./study.api";

// For backward compatibility - object-based API
export const studyApi = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  getMaterials: async (params: any) => {
    const { listMaterials } = await import("./study.api");
    return listMaterials(params);
  },
  getMaterial: async (id: string) => {
    const { getMaterial } = await import("./study.api");
    return getMaterial(id);
  },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  uploadMaterial: async (payload: any, file?: File) => {
    const { uploadMaterial } = await import("./study.api");
    return uploadMaterial(payload, file!);
  },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  bulkUploadMaterials: async (materials: any, files: File[]) => {
    const { bulkUploadMaterials } = await import("./study.api");
    return bulkUploadMaterials(materials, files);
  },
  deleteMaterial: async (id: string) => {
    const { deleteMaterial } = await import("./study.api");
    return deleteMaterial(id);
  },
  adminDeleteMaterial: async (id: string) => {
    const { adminDeleteMaterial } = await import("./study.api");
    return adminDeleteMaterial(id);
  },
  verifyMaterial: async (id: string) => {
    const { verifyMaterial } = await import("./study.api");
    return verifyMaterial(id);
  },
  getPendingMaterials: async (page = 1, limit = 20) => {
    const { listPendingReviewMaterials } = await import("./study.api");
    return listPendingReviewMaterials(page, limit);
  },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  reviewMaterial: async (id: string, payload: any) => {
    const { reviewMaterial } = await import("./study.api");
    return reviewMaterial(id, payload);
  },
  getDownloadUrl: async (id: string) => {
    const { getDownloadUrl } = await import("./study.api");
    return getDownloadUrl(id);
  },
  rateMaterial: async (id: string, rating: number) => {
    const { rateMaterial } = await import("./study.api");
    return rateMaterial(id, { rating });
  },
  toggleBookmark: async (id: string) => {
    const { toggleBookmark } = await import("./study.api");
    return toggleBookmark(id);
  },
  bookmarkMaterial: async (id: string) => {
    const { toggleBookmark } = await import("./study.api");
    return toggleBookmark(id);
  },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  getQuizzes: async (params: any) => {
    const { listQuizzes } = await import("./study.api");
    return listQuizzes(params);
  },
  getQuiz: async (id: string) => {
    const { getQuiz } = await import("./study.api");
    return getQuiz(id);
  },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  createQuiz: async (payload: any) => {
    const { createQuiz } = await import("./study.api");
    return createQuiz(payload);
  },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  generateQuiz: async (payload: any) => {
    const { generateQuizFromMaterial } = await import("./study.api");
    return generateQuizFromMaterial(payload.materialId, payload.numQuestions);
  },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  approveQuiz: async (quizId: string, approvals: any) => {
    const { approveQuizQuestions } = await import("./study.api");
    return approveQuizQuestions(quizId, approvals);
  },
  getMyAnalytics: async () => {
    const { getMyAnalytics } = await import("./study.api");
    return getMyAnalytics();
  },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  getAdminAnalytics: async (params: any) => {
    const { getAdminQuizAnalytics } = await import("./study.api");
    return getAdminQuizAnalytics(params);
  },
};
export { communityApi } from "./community.api";
export { marketplaceApi } from "./marketplace.api";
export { plannerApi, remindersApi, notificationsApi, campusMapApi, SOCKET_EVENTS } from "./planner.api";
export { adminApi } from "./admin";
