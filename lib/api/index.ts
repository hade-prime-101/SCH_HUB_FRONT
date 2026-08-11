export { apiFetch, apiGet, apiPost, apiPatch, apiDelete, apiPut } from "./base";
export { authApi } from "./auth";
export { schoolApi } from "./school";
export { usersApi } from "./users";
export * from "./study.api";

// For backward compatibility - object-based API
export const studyApi = {
  getMaterials: async (params: any) => {
    const { listMaterials } = await import("./study.api");
    return listMaterials(params);
  },
  getMaterial: async (id: string) => {
    const { getMaterial } = await import("./study.api");
    return getMaterial(id);
  },
  uploadMaterial: async (payload: any, file?: File) => {
    const { uploadMaterial } = await import("./study.api");
    return uploadMaterial(payload, file!);
  },
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
  getQuizzes: async (params: any) => {
    const { listQuizzes } = await import("./study.api");
    return listQuizzes(params);
  },
  getQuiz: async (id: string) => {
    const { getQuiz } = await import("./study.api");
    return getQuiz(id);
  },
  createQuiz: async (payload: any) => {
    const { createQuiz } = await import("./study.api");
    return createQuiz(payload);
  },
  generateQuiz: async (payload: any) => {
    const { generateQuizFromMaterial } = await import("./study.api");
    return generateQuizFromMaterial(payload.materialId, payload.numQuestions);
  },
  approveQuiz: async (quizId: string, approvals: any) => {
    const { approveQuizQuestions } = await import("./study.api");
    return approveQuizQuestions(quizId, approvals);
  },
  getMyAnalytics: async () => {
    const { getMyAnalytics } = await import("./study.api");
    return getMyAnalytics();
  },
  getAdminAnalytics: async (params: any) => {
    const { getAdminQuizAnalytics } = await import("./study.api");
    return getAdminQuizAnalytics(params);
  },
};
export { communityApi } from "./community.api";
export { marketplaceApi } from "./marketplace.api";
export { plannerApi, remindersApi, notificationsApi, campusMapApi, SOCKET_EVENTS } from "./planner";
export { adminApi } from "./admin";
