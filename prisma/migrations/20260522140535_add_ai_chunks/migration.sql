-- AlterTable
ALTER TABLE "ai_summaries" ADD COLUMN     "combinedExamTopics" JSONB,
ADD COLUMN     "combinedKeyPoints" JSONB,
ADD COLUMN     "errorMessage" TEXT,
ADD COLUMN     "finalSummary" TEXT,
ADD COLUMN     "masterQuizId" TEXT,
ADD COLUMN     "processedChunks" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "progress" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "revisionSheet" TEXT,
ADD COLUMN     "totalChunks" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "ai_summary_chunks" (
    "id" TEXT NOT NULL,
    "aiSummaryId" TEXT NOT NULL,
    "chunkNumber" INTEGER NOT NULL,
    "summary" TEXT,
    "keyPoints" JSONB,
    "examTopics" JSONB,
    "quizQuestions" JSONB,
    "beginnerExplanation" TEXT,
    "status" "AISummaryStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_summary_chunks_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ai_summary_chunks_aiSummaryId_chunkNumber_key" ON "ai_summary_chunks"("aiSummaryId", "chunkNumber");

-- AddForeignKey
ALTER TABLE "ai_summary_chunks" ADD CONSTRAINT "ai_summary_chunks_aiSummaryId_fkey" FOREIGN KEY ("aiSummaryId") REFERENCES "ai_summaries"("id") ON DELETE CASCADE ON UPDATE CASCADE;
