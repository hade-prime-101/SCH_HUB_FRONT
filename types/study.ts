// ─── Pagination ───────────────────────────────────────────────

export interface PaginatedResponse<T> {
  data: T[];
  page: number;
  total: number;
  limit: number;
}

// ─── Materials ────────────────────────────────────────────────

export type MaterialVisibility = "PUBLIC" | "PRIVATE" | "LINK_ONLY" | "DEPARTMENT" | "LEVEL" | "STUDY_GROUP";
export type MaterialType = "PAST_QUESTION" | "NOTE" | "HANDOUT" | "ASSIGNMENT" | "SUMMARY" | "SLIDES" | "OTHER";

export interface Material {
  id: string;
  title: string;
  courseCode?: string;
  courseTitle?: string;
  description?: string;
  visibility: MaterialVisibility;
  verified: boolean;
  downloads: number;
  downloadCount?: number;
  averageRating?: number;
  rating?: number;
  fileType?: string;
  fileSize?: number;
  userId: string;
  createdAt: string;
  updatedAt: string;
  type?: MaterialType;
  isBookmarked?: boolean;
  isVerified?: boolean;
  uploader?: { id: string; fullName: string; profilePictureUrl?: string };
}

export interface MaterialUploadPayload {
  title: string;
  courseCode?: string;
  courseTitle?: string;
  description?: string;
  visibility: MaterialVisibility;
  type?: MaterialType;
}

export interface MaterialUpdatePayload {
  title?: string;
  courseCode?: string;
  courseTitle?: string;
  description?: string;
  visibility?: MaterialVisibility;
}

export interface MaterialReviewPayload {
  decision: "APPROVE" | "REJECT";
  note?: string;
}

export interface MaterialRatePayload {
  rating: number; // 1-5
}

// ─── Quizzes ─────────────────────────────────────────────────

export interface Quiz {
  id: string;
  title: string;
  description?: string;
  materialId?: string;
  isDraft: boolean;
  questions: QuizQuestion[];
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  visibility?: MaterialVisibility;
  questionCount?: number;
}

export interface QuizQuestion {
  id: string;
  text: string;
  type: "MCQ" | "TRUE_FALSE" | "SHORT_ANSWER";
  options?: string[] | { id: string; text: string }[];
  correctAnswer?: string | number;
  correct?: string;
  approved?: boolean;
}

export interface QuizCreatePayload {
  title: string;
  description?: string;
  questions?: QuizQuestionInput[];
}

export interface QuizQuestionInput {
  text: string;
  type: "MCQ" | "TRUE_FALSE" | "SHORT_ANSWER";
  options?: string[];
  correctAnswer?: string | number;
}

export interface QuizAttempt {
  id: string;
  quizId: string;
  userId: string;
  score: number;
  total: number;
  correctCount?: number;
  answers: QuizAttemptAnswer[];
  submittedAt: string;
}

export interface QuizAttemptAnswer {
  questionId: string;
  answer: string | number;
  correct?: boolean;
}

export interface QuizSubmitPayload {
  answers: {
    questionId: string;
    answer: string | number;
    selected?: number;
  }[];
}

// ─── Analytics ────────────────────────────────────────────────

export interface MyAnalytics {
  materialsUploaded: number;
  quizzesCreated: number;
  averageQuizScore: number;
  totalDownloads: number;
}

export interface AdminQuizAnalyticsQuery {
  from?: string;
  to?: string;
  quizId?: string;
  userId?: string;
  page?: number;
  limit?: number;
}

// ─── CGPA ────────────────────────────────────────────────────

export interface CGPACourse {
  id: string;
  userId: string;
  name: string;
  code: string;
  creditHours: number;
  grade: string;
  semester?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CGPACourseInput {
  name: string;
  code: string;
  creditHours: number;
  grade: string;
  semester?: string;
}

export interface CGPACalculationInput {
  courses: {
    name: string;
    creditHours: number;
    grade: string;
  }[];
}

export interface CGPAResult {
  cgpa: number;
  totalCredits: number;
}

// ─── Personal Study Sessions ─────────────────────────────────

export interface PersonalStudySession {
  id: string;
  title: string;
  userId: string;
  courseCode?: string;
  material?: Material;
  materialId?: string;
  messages?: PersonalStudyMessage[];
  quiz?: {
    id: string;
    questions: PersonalQuizQuestion[];
  };
  createdAt: string;
  updatedAt: string;
}

export interface PersonalStudyMessage {
  role: "user" | "assistant" | "ai";
  content: string;
  ts?: number;
}

export interface CreateSessionPayload {
  title: string;
  content?: string;   // text content
  materialId?: string;
  file?: File;
}

// For quiz generation within a session

export interface GeneratePersonalQuizPayload {
  numQuestions?: number;
  questionCount?: number;
  topic?: string;
  replaceExisting?: boolean;
}

export interface PersonalQuiz {
  id?: string;
  questions: PersonalQuizQuestion[];
}

export interface PersonalQuizQuestion {
  id: string;
  text: string;
  options: string[] | { id: string; text: string }[];
  correctIndex?: number;   // only revealed after submission
  correct?: string;
}

export interface PersonalQuizAnswer {
  questionId: string;
  selected: number;
  answer?: string | number;
}

export interface PersonalQuizResult {
  score: number;
  total: number;
  correctCount?: number;
  feedback?: string;
  answers?: {
    questionId: string;
    correct: boolean;
  }[];
}

// ─── AI Summaries ─────────────────────────────────────────────

export interface AISummary {
  id?: string;
  materialId: string;
  title?: string;
  status: "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED";
  content?: string;
  cached: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SummarizeRequest {
  materialId: string;
}

// ─── Chat ────────────────────────────────────────────────────

export interface ChatMessage {
  role: "user" | "ai" | "assistant";
  content: string;
  ts?: number;
  timestamp?: string;
}

// ─── Study Session Detail ────────────────────────────────────

export interface SessionDetail extends PersonalStudySession {
  quiz?: {
    id: string;
    questions: PersonalQuizQuestion[];
  };
}


