// types/community.ts

export type PostSection = 'GENERAL' | 'ACADEMICS' | 'CAREER' | 'EVENTS' | 'NOTICE_BOARD';

export interface Post {
  id: string;
  title: string;
  content: string;
  section: PostSection;
  isPinned: boolean;
  upvotes: number;
  author: {
    id: string;
    name: string;
    avatar?: string;
  };
  comments: Comment[];
  createdAt: string;
  updatedAt: string;
}

export interface Comment {
  id: string;
  content: string;
  upvotes: number;
  author: {
    id: string;
    name: string;
    avatar?: string;
  };
  createdAt: string;
}

export interface Question {
  id: string;
  title: string;
  content: string;
  upvotes: number;
  author: {
    id: string;
    name: string;
    avatar?: string;
  };
  answers: Answer[];
  acceptedAnswerId?: string;
  pinnedAnswerId?: string;
  createdAt: string;
}

export interface Answer {
  id: string;
  content: string;
  upvotes: number;
  isAccepted: boolean;
  isPinned: boolean;
  author: {
    id: string;
    name: string;
    avatar?: string;
  };
  createdAt: string;
}

export interface Mentor {
  id: string;
  userId: string;
  name: string;
  avatar?: string;
  expertise: string[];
  bio: string;
  available: boolean;
}

export interface FAQ {
  id: string;
  question: string;
  answer: string;
  category?: string;
}

export interface Report {
  id: string;
  targetId: string;   // post or question ID
  type: 'POST' | 'QUESTION' | 'COMMENT' | 'ANSWER';
  reason: string;
  reporterId: string;
  createdAt: string;
  resolved: boolean;
}

// ─── Payloads ─────────────────────────────────────────────────

export interface CreatePostPayload {
  title: string;
  content: string;
  section?: PostSection;   // default GENERAL
}

export interface CreateCommentPayload {
  content: string;
}

export interface CreateQuestionPayload {
  title: string;
  content: string;
}

export interface CreateAnswerPayload {
  content: string;
}

export interface RegisterMentorPayload {
  expertise: string[];
  bio: string;
}

export interface CreateFaqPayload {
  question: string;
  answer: string;
  category?: string;
}

export interface ReactPayload {
  type: 'LIKE' | 'HELPFUL' | 'INSIGHTFUL';   // example
}

export interface ReportPayload {
  reason: string;
  type: 'POST' | 'QUESTION' | 'COMMENT' | 'ANSWER';
}