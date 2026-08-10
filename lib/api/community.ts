import { apiFetch } from "./base";

export const communityApi = {
  // ─── Feed / Posts ────────────────────────────────────────────────────────────

  getFeed: (params?: Record<string, string>) => {
    const q = params ? "?" + new URLSearchParams(params).toString() : "";
    return apiFetch<any>(`/community/feed${q}`);
  },

  getPost: (id: string) => apiFetch<any>(`/community/posts/${id}`),

  createPost: (data: Record<string, unknown>) =>
    apiFetch<any>("/community/posts", { method: "POST", body: JSON.stringify(data) }),

  deletePost: (id: string) =>
    apiFetch<void>(`/community/posts/${id}`, { method: "DELETE" }),

  /** isPinned: true to pin, false to unpin */
  pinPost: (id: string, isPinned: boolean) =>
    apiFetch<any>(`/community/posts/${id}/pin`, {
      method: "PATCH",
      body: JSON.stringify({ isPinned }),
    }),

  upvotePost: (id: string) =>
    apiFetch<any>(`/community/posts/${id}/upvote`, { method: "POST" }),

  /** type: LIKE | HELPFUL | INSIGHTFUL | FUNNY | SUPPORT */
  reactToPost: (id: string, type: string) =>
    apiFetch<any>(`/community/posts/${id}/react`, {
      method: "POST",
      body: JSON.stringify({ type, targetType: "post" }),
    }),

  /** reason: SPAM | INAPPROPRIATE | HARASSMENT | MISINFORMATION | OTHER */
  reportPost: (id: string, reason: string, details?: string) =>
    apiFetch<any>(`/community/posts/${id}/report`, {
      method: "POST",
      body: JSON.stringify({ reason, targetType: "post", details }),
    }),

  addComment: (postId: string, content: string, parentId?: string | null) =>
    apiFetch<any>(`/community/posts/${postId}/comments`, {
      method: "POST",
      body: JSON.stringify({ content, parentId: parentId ?? null }),
    }),

  upvoteComment: (commentId: string) =>
    apiFetch<any>(`/community/comments/${commentId}/upvote`, { method: "POST" }),

  // ─── Notices ─────────────────────────────────────────────────────────────────

  getNotices: (params?: Record<string, string>) => {
    const q = params ? "?" + new URLSearchParams(params).toString() : "";
    return apiFetch<any>(`/community/notices${q}`);
  },

  /** Always include section: "NOTICE_BOARD" in data — backend doesn't enforce it */
  createNotice: (data: Record<string, unknown>) =>
    apiFetch<any>("/community/notices", {
      method: "POST",
      body: JSON.stringify({ ...data, section: "NOTICE_BOARD" }),
    }),

  pinNotice: (id: string, isPinned: boolean) =>
    apiFetch<any>(`/community/notices/${id}/pin`, {
      method: "PATCH",
      body: JSON.stringify({ isPinned }),
    }),

  // ─── Q&A ─────────────────────────────────────────────────────────────────────

  getQuestions: (params?: Record<string, string>) => {
    const q = params ? "?" + new URLSearchParams(params).toString() : "";
    return apiFetch<any>(`/community/questions${q}`);
  },

  getQuestion: (id: string) => apiFetch<any>(`/community/questions/${id}`),

  createQuestion: (data: Record<string, unknown>) =>
    apiFetch<any>("/community/questions", { method: "POST", body: JSON.stringify(data) }),

  deleteQuestion: (id: string) =>
    apiFetch<void>(`/community/questions/${id}`, { method: "DELETE" }),

  upvoteQuestion: (id: string) =>
    apiFetch<any>(`/community/questions/${id}/upvote`, { method: "POST" }),

  postAnswer: (questionId: string, content: string, attachments: unknown[] = []) =>
    apiFetch<any>(`/community/questions/${questionId}/answers`, {
      method: "POST",
      body: JSON.stringify({ content, attachments }),
    }),

  acceptAnswer: (questionId: string, answerId: string) =>
    apiFetch<any>(`/community/questions/${questionId}/answers/${answerId}/accept`, {
      method: "PATCH",
    }),

  pinAnswer: (questionId: string, answerId: string) =>
    apiFetch<any>(`/community/questions/${questionId}/answers/${answerId}/pin`, {
      method: "PATCH",
    }),

  upvoteAnswer: (answerId: string) =>
    apiFetch<any>(`/community/answers/${answerId}/upvote`, { method: "POST" }),

  reactToAnswer: (answerId: string, type: string) =>
    apiFetch<any>(`/community/answers/${answerId}/react`, {
      method: "POST",
      body: JSON.stringify({ type, targetType: "answer" }),
    }),

  deleteAnswer: (answerId: string) =>
    apiFetch<void>(`/community/answers/${answerId}`, { method: "DELETE" }),

  // ─── Mentors ─────────────────────────────────────────────────────────────────

  getMentors: (params?: Record<string, string>) => {
    const q = params ? "?" + new URLSearchParams(params).toString() : "";
    return apiFetch<any[]>(`/community/mentors${q}`);
  },

  getMyMentorRegistrations: () => apiFetch<any[]>("/community/mentors/me"),

  registerAsMentor: (courseCode: string, departmentId?: string) =>
    apiFetch<any>("/community/mentors/register", {
      method: "POST",
      body: JSON.stringify({ courseCode, departmentId }),
    }),

  // ─── FAQs ────────────────────────────────────────────────────────────────────

  getFaqs: (category?: string) => {
    const q = category ? `?category=${encodeURIComponent(category)}` : "";
    return apiFetch<any[]>(`/community/faqs${q}`);
  },

  createFaq: (data: Record<string, unknown>) =>
    apiFetch<any>("/community/faqs", { method: "POST", body: JSON.stringify(data) }),

  deleteFaq: (id: string) =>
    apiFetch<void>(`/community/faqs/${id}`, { method: "DELETE" }),

  // ─── Reports ─────────────────────────────────────────────────────────────────

  /** resolved: true = show resolved, false = show unresolved, omit = all */
  getReports: (params?: Record<string, string>) => {
    const q = params ? "?" + new URLSearchParams(params).toString() : "";
    return apiFetch<any>(`/community/reports${q}`);
  },

  resolveReport: (reportId: string) =>
    apiFetch<any>(`/community/reports/${reportId}/resolve`, { method: "PATCH" }),

  // ─── Study Groups ────────────────────────────────────────────────────────────

  getGroups: (params?: Record<string, string>) => {
    const q = params ? "?" + new URLSearchParams(params).toString() : "";
    return apiFetch<any>(`/community/groups${q}`);
  },

  getAllGroups: (params?: Record<string, string>) => {
    const q = params ? "?" + new URLSearchParams(params).toString() : "";
    return apiFetch<any>(`/community/groups/all${q}`);
  },

  getGroup: (id: string) => apiFetch<any>(`/community/groups/${id}`),

  createGroup: (data: Record<string, unknown>) =>
    apiFetch<any>("/community/groups", { method: "POST", body: JSON.stringify(data) }),

  updateGroup: (id: string, data: Record<string, unknown>) =>
    apiFetch<any>(`/community/groups/${id}`, { method: "PATCH", body: JSON.stringify(data) }),

  deleteGroup: (id: string) =>
    apiFetch<void>(`/community/groups/${id}`, { method: "DELETE" }),

  joinGroup: (id: string) =>
    apiFetch<any>(`/community/groups/${id}/join`, { method: "POST" }),

  leaveGroup: (id: string) =>
    apiFetch<void>(`/community/groups/${id}/leave`, { method: "DELETE" }),

  changeMemberRole: (groupId: string, userId: string, role: "ADMIN" | "MEMBER") =>
    apiFetch<any>(`/community/groups/${groupId}/members/${userId}/role`, {
      method: "PATCH",
      body: JSON.stringify({ role }),
    }),

  kickMember: (groupId: string, userId: string) =>
    apiFetch<void>(`/community/groups/${groupId}/members/${userId}`, { method: "DELETE" }),

  // Invites
  /**
   * @param maxUses  1–100
   * @param expiresInHours  1–168 (not an ISO datetime — just hours from now)
   */
  createInvite: (groupId: string, maxUses: number, expiresInHours: number) =>
    apiFetch<{ token: string; url: string }>(`/community/groups/${groupId}/invites`, {
      method: "POST",
      body: JSON.stringify({ maxUses, expiresInHours }),
    }),

  getInvites: (groupId: string) => apiFetch<any[]>(`/community/groups/${groupId}/invites`),

  revokeInvite: (groupId: string, inviteId: string) =>
    apiFetch<void>(`/community/groups/${groupId}/invites/${inviteId}`, { method: "DELETE" }),

  joinGroupByToken: (token: string) =>
    apiFetch<any>(`/community/groups/join/${token}`, { method: "POST" }),

  // Messages
  getGroupMessages: (id: string, params?: Record<string, string>) => {
    const q = params ? "?" + new URLSearchParams(params).toString() : "";
    return apiFetch<any>(`/community/groups/${id}/messages${q}`);
  },

  sendGroupMessage: (id: string, content: string, attachments: unknown[] = []) =>
    apiFetch<any>(`/community/groups/${id}/messages`, {
      method: "POST",
      body: JSON.stringify({ content, attachments }),
    }),

  // AI
  groupAiSummary: (groupId: string, materialId: string) =>
    apiFetch<any>(`/community/groups/${groupId}/ai/summary`, {
      method: "POST",
      body: JSON.stringify({ materialId }),
    }),

  groupAiAsk: (id: string, question: string) =>
    apiFetch<any>(`/community/groups/${id}/ai/ask`, {
      method: "POST",
      body: JSON.stringify({ question }),
    }),

  // Challenges
  getGroupChallenges: (groupId: string) =>
    apiFetch<any[]>(`/community/groups/${groupId}/challenges`),

  createChallenge: (groupId: string, data: {
    receiverGroupId: string;
    quizId: string;
    expiresInHours: number;
  }) =>
    apiFetch<any>(`/community/groups/${groupId}/challenges`, {
      method: "POST",
      body: JSON.stringify(data),
    }),

  acceptChallenge: (groupId: string, challengeId: string) =>
    apiFetch<any>(`/community/groups/${groupId}/challenges/${challengeId}/accept`, {
      method: "PATCH",
    }),

  declineChallenge: (groupId: string, challengeId: string) =>
    apiFetch<any>(`/community/groups/${groupId}/challenges/${challengeId}/decline`, {
      method: "PATCH",
    }),

  getChallengeResult: (groupId: string, challengeId: string) =>
    apiFetch<any>(`/community/groups/${groupId}/challenges/${challengeId}/result`),

  getGroupQuizLeaderboard: (groupId: string, quizId: string) =>
    apiFetch<any>(`/community/groups/${groupId}/quizzes/${quizId}/leaderboard`),
};
