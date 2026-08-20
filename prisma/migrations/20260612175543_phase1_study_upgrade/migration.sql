-- CreateEnum
CREATE TYPE "TextExtractionStatus" AS ENUM ('PENDING', 'READABLE', 'EMPTY');

-- CreateEnum
CREATE TYPE "QuizApprovalStatus" AS ENUM ('PENDING_REVIEW', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "QuizVisibility" AS ENUM ('PUBLIC', 'DEPARTMENT', 'LEVEL', 'STUDY_GROUP', 'PRIVATE');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "AuditAction" ADD VALUE 'QUIZ_APPROVED';
ALTER TYPE "AuditAction" ADD VALUE 'QUIZ_REJECTED';

-- AlterEnum
ALTER TYPE "UserRole" ADD VALUE 'AUTHORIZED_UPLOADER';

-- AlterTable
ALTER TABLE "ai_summaries" ADD COLUMN     "quizApprovalStatus" "QuizApprovalStatus" NOT NULL DEFAULT 'PENDING_REVIEW',
ADD COLUMN     "revisionRoadmap" JSONB;

-- AlterTable
ALTER TABLE "materials" ADD COLUMN     "extractedText" TEXT,
ADD COLUMN     "extractedTextPreview" TEXT,
ADD COLUMN     "textExtractionStatus" "TextExtractionStatus" NOT NULL DEFAULT 'PENDING';

-- AlterTable
ALTER TABLE "quizzes" ADD COLUMN     "creatorRole" TEXT NOT NULL DEFAULT 'COURSE_REP',
ADD COLUMN     "isAiGenerated" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isDraft" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "quizApprovalStatus" "QuizApprovalStatus" NOT NULL DEFAULT 'APPROVED',
ADD COLUMN     "studyGroupId" TEXT,
ADD COLUMN     "visibility" "QuizVisibility" NOT NULL DEFAULT 'DEPARTMENT';

-- CreateTable
CREATE TABLE "quiz_analytics" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "totalAttempts" INTEGER NOT NULL DEFAULT 0,
    "totalCorrect" INTEGER NOT NULL DEFAULT 0,
    "totalQuestions" INTEGER NOT NULL DEFAULT 0,
    "weakTopics" JSONB NOT NULL DEFAULT '[]',
    "topicAttempts" JSONB NOT NULL DEFAULT '{}',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "quiz_analytics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quiz_question_stats" (
    "id" TEXT NOT NULL,
    "quizId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "topic" TEXT NOT NULL DEFAULT 'General',
    "totalAttempts" INTEGER NOT NULL DEFAULT 0,
    "totalWrong" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "quiz_question_stats_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "quiz_analytics_userId_key" ON "quiz_analytics"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "quiz_question_stats_questionId_key" ON "quiz_question_stats"("questionId");

-- CreateIndex
CREATE INDEX "quiz_question_stats_quizId_idx" ON "quiz_question_stats"("quizId");

-- CreateIndex
CREATE INDEX "quiz_attempts_quizId_completedAt_idx" ON "quiz_attempts"("quizId", "completedAt" DESC);

-- CreateIndex
CREATE INDEX "quizzes_studyGroupId_idx" ON "quizzes"("studyGroupId");

-- AddForeignKey
ALTER TABLE "quizzes" ADD CONSTRAINT "quizzes_studyGroupId_fkey" FOREIGN KEY ("studyGroupId") REFERENCES "study_groups"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quiz_analytics" ADD CONSTRAINT "quiz_analytics_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quiz_question_stats" ADD CONSTRAINT "quiz_question_stats_quizId_fkey" FOREIGN KEY ("quizId") REFERENCES "quizzes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
