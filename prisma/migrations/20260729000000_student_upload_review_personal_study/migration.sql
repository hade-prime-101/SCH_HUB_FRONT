-- Migration: student_upload_review_personal_study
-- 1. Add MaterialReviewStatus enum
-- 2. Add review fields to materials
-- 3. Add PersonalStudySession, PersonalQuizQuestion, PersonalStudyChat models

-- CreateEnum
CREATE TYPE "MaterialReviewStatus" AS ENUM ('PENDING_REVIEW', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "PersonalChatRole" AS ENUM ('USER', 'ASSISTANT');

-- AlterTable: add review fields to materials
-- Default existing rows to APPROVED (they were uploaded by authorized roles)
ALTER TABLE "materials"
  ADD COLUMN "reviewStatus"  "MaterialReviewStatus" NOT NULL DEFAULT 'APPROVED',
  ADD COLUMN "reviewedAt"    TIMESTAMP(3),
  ADD COLUMN "reviewedById"  TEXT,
  ADD COLUMN "reviewNote"    TEXT;

-- CreateTable: personal_study_sessions
CREATE TABLE "personal_study_sessions" (
  "id"              TEXT NOT NULL,
  "userId"          TEXT NOT NULL,
  "materialId"      TEXT,
  "privateFileUrl"  TEXT,
  "privateFileKey"  TEXT,
  "privateFileSize" INTEGER,
  "privateMimeType" TEXT,
  "privateFileName" TEXT,
  "extractedText"   TEXT,
  "title"           TEXT NOT NULL,
  "courseCode"      TEXT NOT NULL,
  "createdAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "personal_study_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable: personal_quiz_questions
CREATE TABLE "personal_quiz_questions" (
  "id"            TEXT NOT NULL,
  "sessionId"     TEXT NOT NULL,
  "question"      TEXT NOT NULL,
  "options"       JSONB NOT NULL,
  "correctAnswer" INTEGER NOT NULL,
  "explanation"   TEXT,
  "topic"         TEXT,
  "order"         INTEGER NOT NULL,
  "createdAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "personal_quiz_questions_pkey" PRIMARY KEY ("id")
);

-- CreateTable: personal_study_chats
CREATE TABLE "personal_study_chats" (
  "id"        TEXT NOT NULL,
  "sessionId" TEXT NOT NULL,
  "role"      "PersonalChatRole" NOT NULL,
  "content"   TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "personal_study_chats_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey: personal_study_sessions → users
ALTER TABLE "personal_study_sessions"
  ADD CONSTRAINT "personal_study_sessions_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey: personal_study_sessions → materials (optional)
ALTER TABLE "personal_study_sessions"
  ADD CONSTRAINT "personal_study_sessions_materialId_fkey"
  FOREIGN KEY ("materialId") REFERENCES "materials"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey: personal_quiz_questions → personal_study_sessions
ALTER TABLE "personal_quiz_questions"
  ADD CONSTRAINT "personal_quiz_questions_sessionId_fkey"
  FOREIGN KEY ("sessionId") REFERENCES "personal_study_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey: personal_study_chats → personal_study_sessions
ALTER TABLE "personal_study_chats"
  ADD CONSTRAINT "personal_study_chats_sessionId_fkey"
  FOREIGN KEY ("sessionId") REFERENCES "personal_study_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateIndex
CREATE INDEX "materials_reviewStatus_isDeleted_idx" ON "materials"("reviewStatus", "isDeleted");
CREATE INDEX "personal_study_sessions_userId_createdAt_idx" ON "personal_study_sessions"("userId", "createdAt" DESC);
CREATE INDEX "personal_quiz_questions_sessionId_idx" ON "personal_quiz_questions"("sessionId");
CREATE INDEX "personal_study_chats_sessionId_createdAt_idx" ON "personal_study_chats"("sessionId", "createdAt" ASC);
